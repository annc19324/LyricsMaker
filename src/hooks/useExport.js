/**
 * hooks/useExport.js
 * Handles the WebCodecs + mp4-muxer + FFmpeg.wasm video export pipeline.
 */
import { useRef, useCallback, useState } from 'react';
import useAppStore from '../store/useAppStore';
import { renderFrame } from '../lib/canvasRenderer';

export function useExport(canvasRef, audioRef, mediaRefs, speakerGainRef, audioCtxRef) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportPhase, setExportPhase] = useState('');
  const [exportDesc, setExportDesc] = useState('');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusText, setExportStatusText] = useState('');
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const cancelRef = useRef(false);

  const startExport = useCallback(async () => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio) return;

    const state = useAppStore.getState();
    if (state.lyrics.length === 0) { alert('Vui lòng nhập và phân tích lyrics trước!'); return; }
    if (typeof VideoEncoder === 'undefined') { alert('Trình duyệt của bạn không hỗ trợ WebCodecs API. Vui lòng dùng Chrome, Edge hoặc Safari mới nhất!'); return; }

    cancelRef.current = false;
    setIsExporting(true);
    setShowModal(true);
    setExportDone(false);
    setDownloadUrl(null);
    setExportPhase('⏺ Đang kết xuất video câm...');
    setExportDesc('Tận dụng GPU của thiết bị để render siêu tốc các khung hình.');
    setExportProgress(0);

    audio.pause();

    const trimStart = parseFloat(state.audioStart) || 0;
    const trimEnd = state.audioEnd === 'auto' ? (audio.duration || 60) : parseFloat(state.audioEnd);
    const totalDuration = trimEnd - trimStart;
    const fps = 30;
    const totalFrames = Math.floor(totalDuration * fps);

    // Mute speakers during export
    if (speakerGainRef.current && audioCtxRef.current) {
      speakerGainRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
    }

    await new Promise((r) => setTimeout(r, 50));

    try {
      const muxer = new Mp4Muxer.Muxer({
        target: new Mp4Muxer.ArrayBufferTarget(),
        video: { codec: 'avc', width: canvas.width, height: canvas.height },
        fastStart: 'in-memory',
      });

      const encoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => console.error('[VideoEncoder]', e),
      });

      const config = {
        codec: 'avc1.4d002a',
        width: canvas.width, height: canvas.height,
        bitrate: 6_000_000, framerate: fps,
        hardwareAcceleration: 'prefer-hardware',
      };
      const support = await VideoEncoder.isConfigSupported(config);
      if (!support.supported) config.hardwareAcceleration = 'prefer-software';
      encoder.configure(config);

      const ctx2d = canvas.getContext('2d');
      const visuals = state.visuals[state.activeRatio];
      const meta = { songTitle: state.songTitle, songArtist: state.songArtist, songChannel: state.songChannel };
      const media = {
        bgImage: mediaRefs.bgImage.current, bgVideo: mediaRefs.bgVideo.current,
        bgMediaType: mediaRefs.bgMediaType.current, mainImage: mediaRefs.mainImage.current,
        mainVideo: mediaRefs.mainVideo.current, mainMediaType: mediaRefs.mainMediaType.current,
      };

      for (let frame = 0; frame < totalFrames; frame++) {
        if (cancelRef.current) break;
        const t = trimStart + frame / fps;
        renderFrame(ctx2d, canvas, t, visuals, meta, state.lyrics, media, state.highlightRules, audio.duration || 60);

        const vf = new VideoFrame(canvas, { timestamp: Math.round((frame / fps) * 1_000_000), duration: Math.round(1_000_000 / fps) });
        encoder.encode(vf, { keyFrame: frame % (fps * 2) === 0 });
        vf.close();

        if (frame % 10 === 0) {
          const pct = Math.round((frame / totalFrames) * 100);
          setExportProgress(pct);
          setExportStatusText(`Đang render: ${frame}/${totalFrames} frames (${pct}%)`);
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      await encoder.flush();
      muxer.finalize();
      const silentMp4 = muxer.target.buffer;

      if (cancelRef.current) { setIsExporting(false); setShowModal(false); return; }

      // Audio muxing with FFmpeg
      setExportPhase('🎵 Đang ghép âm thanh...');
      setExportDesc('Sử dụng FFmpeg.wasm để ghép audio vào video.');
      setExportProgress(90);

      const { FFmpeg, fetchFile } = FFmpegUtil;
      const { createFFmpeg } = FFmpeg;
      const ffmpeg = createFFmpeg({ log: false });
      await ffmpeg.load();

      ffmpeg.FS('writeFile', 'silent.mp4', new Uint8Array(silentMp4));
      audio.currentTime = trimStart;

      // Grab audio as ArrayBuffer
      const audioResp = await fetch(audio.src);
      const audioData = await audioResp.arrayBuffer();
      ffmpeg.FS('writeFile', 'audio_src', new Uint8Array(audioData));

      const fadeInArg = parseFloat(state.fadeIn) || 0;
      const fadeOutArg = parseFloat(state.fadeOut) || 0;
      let audioFilter = `atrim=start=${trimStart}:end=${trimEnd}`;
      if (fadeInArg > 0) audioFilter += `,afade=t=in:st=${trimStart}:d=${fadeInArg}`;
      if (fadeOutArg > 0) audioFilter += `,afade=t=out:st=${trimEnd - fadeOutArg}:d=${fadeOutArg}`;
      audioFilter += `,asetpts=PTS-STARTPTS,volume=${state.volume / 100}`;

      await ffmpeg.run(
        '-i', 'silent.mp4',
        '-i', 'audio_src',
        '-filter_complex', `[1:a]${audioFilter}[a]`,
        '-map', '0:v', '-map', '[a]',
        '-c:v', 'copy', '-c:a', 'aac', '-shortest',
        'output.mp4',
      );

      const outputData = ffmpeg.FS('readFile', 'output.mp4');
      const blob = new Blob([outputData.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setExportProgress(100);
      setExportDone(true);
    } catch (err) {
      console.error('[Export Error]', err);
      alert('Xuất video thất bại: ' + err.message);
      setShowModal(false);
    } finally {
      setIsExporting(false);
      // Restore speaker gain
      if (speakerGainRef.current && audioCtxRef.current) {
        speakerGainRef.current.gain.setValueAtTime(1, audioCtxRef.current.currentTime);
      }
    }
  }, [canvasRef, audioRef, mediaRefs, speakerGainRef, audioCtxRef]);

  const cancelExport = useCallback(() => {
    cancelRef.current = true;
    setIsExporting(false);
    setShowModal(false);
  }, []);

  const closeModal = useCallback(() => { setShowModal(false); }, []);

  return {
    isExporting, showModal, exportDone,
    exportPhase, exportDesc, exportProgress, exportStatusText, downloadUrl,
    startExport, cancelExport, closeModal,
  };
}
