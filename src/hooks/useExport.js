/**
 * hooks/useExport.js
 * Video export: WebCodecs (VideoEncoder + AudioEncoder) + mp4-muxer.
 * No FFmpeg dependency — audio is decoded via Web Audio API and encoded
 * with AudioEncoder, then muxed together with mp4-muxer in one pass.
 *
 * Required global (index.html script tag):
 *   /js/ffmpeg/mp4-muxer.js  → window.Mp4Muxer
 */
import { useRef, useCallback, useState } from 'react';
import useAppStore from '../store/useAppStore';
import { renderFrame, resetScrollY } from '../lib/canvasRenderer';
import { showToast } from '../components/ui/Toast';

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


    if (typeof VideoEncoder === 'undefined') {
      showToast('Trình duyệt không hỗ trợ WebCodecs (VideoEncoder). Hãy dùng Chrome/Edge mới nhất!', 'error', 5000);
      return;
    }
    if (typeof AudioEncoder === 'undefined') {
      showToast('Trình duyệt không hỗ trợ AudioEncoder. Hãy dùng Chrome/Edge mới nhất!', 'error', 5000);
      return;
    }
    if (!window.Mp4Muxer) {
      showToast('mp4-muxer chưa được tải. Kiểm tra /js/ffmpeg/mp4-muxer.js', 'error', 5000);
      return;
    }

    cancelRef.current = false;
    setIsExporting(true);
    setShowModal(true);
    setExportDone(false);
    setDownloadUrl(null);
    setExportPhase('🎵 Đang giải mã âm thanh...');
    setExportDesc('Đọc file âm thanh và chuẩn bị encoder.');
    setExportProgress(0);
    setExportStatusText('');

    audio.pause();

    // Mute speakers during export
    if (speakerGainRef.current && audioCtxRef.current) {
      speakerGainRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
    }

    const trimStart = parseFloat(state.audioStart) || 0;
    const trimEndRaw = state.audioEnd;
    const dur = audio.duration || 60;
    const trimEnd = (!trimEndRaw || trimEndRaw === 'auto' || isNaN(parseFloat(trimEndRaw))) ? dur : parseFloat(trimEndRaw);
    const totalDuration = trimEnd - trimStart;
    const fps = 30;
    const totalFrames = Math.max(1, Math.floor(totalDuration * fps));

    try {
      // ── Step 1: Decode audio ─────────────────────────────────────────────
      let audioBuffer = null;
      try {
        const audioResp = await fetch(audio.src);
        if (!audioResp.ok) throw new Error(`HTTP ${audioResp.status}`);
        const arrayBuf = await audioResp.arrayBuffer();
        const offlineCtx = new OfflineAudioContext(2, 44100, 44100);
        audioBuffer = await offlineCtx.decodeAudioData(arrayBuf);
      } catch (e) {
        console.warn('[Export] Audio decode failed, exporting silent video:', e);
        showToast('Không thể đọc file âm thanh — xuất video không có tiếng.', 'warning', 4000);
      }

      const sampleRate = audioBuffer?.sampleRate ?? 44100;
      const numChannels = audioBuffer?.numberOfChannels ?? 2;

      // ── Step 2: Set up Mp4Muxer ──────────────────────────────────────────
      setExportPhase('⏺ Đang render video...');
      const exportWidth = Math.floor(canvas.width / 2) * 2;
      const exportHeight = Math.floor(canvas.height / 2) * 2;

      const muxerOptions = {
        target: new Mp4Muxer.ArrayBufferTarget(),
        video: { codec: 'avc', width: exportWidth, height: exportHeight },
        fastStart: 'in-memory',
      };
      if (audioBuffer) {
        muxerOptions.audio = {
          codec: 'aac',
          numberOfChannels: numChannels,
          sampleRate,
        };
      }
      const muxer = new Mp4Muxer.Muxer(muxerOptions);

      // ── Step 3: VideoEncoder ─────────────────────────────────────────────
      const videoEncoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => console.error('[VideoEncoder]', e),
      });

      const videoCfg = {
        codec: 'avc1.4d002a',
        width: exportWidth,
        height: exportHeight,
        bitrate: 6_000_000,
        framerate: fps,
        hardwareAcceleration: 'prefer-hardware',
      };
      const videoSupport = await VideoEncoder.isConfigSupported(videoCfg);
      if (!videoSupport.supported) videoCfg.hardwareAcceleration = 'prefer-software';
      videoEncoder.configure(videoCfg);

      // ── Step 4: AudioEncoder ─────────────────────────────────────────────
      let audioEncoder = null;
      if (audioBuffer) {
        audioEncoder = new AudioEncoder({
          output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
          error: (e) => console.error('[AudioEncoder]', e),
        });
        audioEncoder.configure({
          codec: 'mp4a.40.2', // AAC-LC
          numberOfChannels: numChannels,
          sampleRate,
          bitrate: 128_000,
        });
      }

      // ── Step 5: Render video frames ──────────────────────────────────────
      const ctx2d = canvas.getContext('2d');
      const visuals = state.visuals[state.activeRatio];
      const meta = { songTitle: state.songTitle, songArtist: state.songArtist, songChannel: state.songChannel };
      const media = {
        bgImage: mediaRefs.bgImage.current,
        bgVideo: mediaRefs.bgVideo.current,
        bgMediaType: mediaRefs.bgMediaType.current,
        mainImage: mediaRefs.mainImage.current,
        mainVideo: mediaRefs.mainVideo.current,
        mainMediaType: mediaRefs.mainMediaType.current,
      };

      const volumeFactor = parseFloat(state.volume) / 100;
      const fadeIn = parseFloat(state.fadeIn) || 0;
      const fadeOut = parseFloat(state.fadeOut) || 0;

      // Reset scroll state so export starts from clean position (same as after seek in preview)
      resetScrollY();

      let audioSampleOffset = 0;
      const aacFrameSize = 1024;
      const audioStartOffset = audioBuffer ? Math.floor(trimStart * sampleRate) : 0;
      const audioEndOffset = audioBuffer ? Math.floor(trimEnd * sampleRate) : 0;
      const totalAudioSamples = audioEndOffset - audioStartOffset;

      for (let frame = 0; frame < totalFrames; frame++) {
        if (cancelRef.current) break;

        const t = Math.max(0, trimStart + frame / fps + (state.exportOffset || 0) / 1000);

        // Sync video times to render timestamp 't' so export frames are correct
        if (media.bgMediaType === 'video' && media.bgVideo) {
          media.bgVideo.currentTime = t;
          await new Promise((resolve) => {
            const onSeeked = () => {
              media.bgVideo.removeEventListener('seeked', onSeeked);
              resolve();
            };
            media.bgVideo.addEventListener('seeked', onSeeked);
            setTimeout(onSeeked, 80);
          });
        }
        if (media.mainMediaType === 'video' && media.mainVideo) {
          media.mainVideo.currentTime = t;
          await new Promise((resolve) => {
            const onSeeked = () => {
              media.mainVideo.removeEventListener('seeked', onSeeked);
              resolve();
            };
            media.mainVideo.addEventListener('seeked', onSeeked);
            setTimeout(onSeeked, 80);
          });
        }

        // Draw frame
        renderFrame(ctx2d, canvas, t, visuals, meta, state.lyrics, media, state.highlightRules, audio.duration || 60);

        // Encode video frame
        const videoFrame = new VideoFrame(canvas, {
          timestamp: Math.round((frame / fps) * 1_000_000),
          duration: Math.round(1_000_000 / fps),
        });

        if (videoEncoder.state === 'closed') {
          videoFrame.close();
          throw new Error('VideoEncoder bị đóng đột ngột. Vui lòng thử khởi động lại trình duyệt hoặc dùng Chrome/Edge bản mới nhất!');
        }
        while (videoEncoder.encodeQueueSize >= 5) {
          await new Promise((r) => setTimeout(r, 5));
        }

        videoEncoder.encode(videoFrame, { keyFrame: frame % (fps * 2) === 0 });
        videoFrame.close();

        // ── Encode audio chunks interleaved with video ──
        if (audioEncoder && audioBuffer) {
          const targetAudioTime = (frame + 1) / fps;
          const targetSampleOffset = Math.min(totalAudioSamples, Math.floor(targetAudioTime * sampleRate));

          while (audioSampleOffset < targetSampleOffset || (frame === totalFrames - 1 && audioSampleOffset < totalAudioSamples)) {
            if (cancelRef.current) break;

            const remaining = totalAudioSamples - audioSampleOffset;
            const chunkSize = Math.min(aacFrameSize, remaining);

            // Wait for full AAC frame unless it's the very last chunk of the file
            if (chunkSize < aacFrameSize && frame < totalFrames - 1) {
              break;
            }

            const currentSampleIndex = audioStartOffset + audioSampleOffset;
            const planeData = new Float32Array(chunkSize * numChannels);

            for (let ch = 0; ch < numChannels; ch++) {
              const src = audioBuffer.getChannelData(ch);
              const planeOffset = ch * chunkSize;
              for (let s = 0; s < chunkSize; s++) {
                let sample = src[currentSampleIndex + s] ?? 0;

                // Apply volume
                sample *= volumeFactor;

                // Fade in/out
                const elapsed = (currentSampleIndex + s) / sampleRate - trimStart;
                if (fadeIn > 0 && elapsed < fadeIn) {
                  sample *= Math.max(0, elapsed / fadeIn);
                }
                if (fadeOut > 0 && elapsed > totalDuration - fadeOut) {
                  sample *= Math.max(0, (totalDuration - elapsed) / fadeOut);
                }

                planeData[planeOffset + s] = sample;
              }
            }

            const audioData = new AudioData({
              format: 'f32-planar',
              sampleRate,
              numberOfFrames: chunkSize,
              numberOfChannels: numChannels,
              timestamp: Math.round((audioSampleOffset / sampleRate) * 1_000_000),
              data: planeData,
            });

            if (audioEncoder.state === 'closed') {
              audioData.close();
              throw new Error('AudioEncoder bị đóng đột ngột!');
            }
            while (audioEncoder.encodeQueueSize >= 10) {
              await new Promise((r) => setTimeout(r, 5));
            }

            audioEncoder.encode(audioData);
            audioData.close();

            audioSampleOffset += chunkSize;
          }
        }

        if (frame % 15 === 0) {
          const pct = Math.round((frame / totalFrames) * 90);
          setExportProgress(pct);
          setExportStatusText(`Đang render: ${frame}/${totalFrames} frames (${pct}%)`);
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      if (cancelRef.current) {
        setIsExporting(false);
        setShowModal(false);
        return;
      }


      // ── Step 6: Flush & finalise ─────────────────────────────────────────
      setExportPhase('✅ Đang hoàn thiện file MP4...');
      setExportDesc('Ghép video và âm thanh vào một file MP4.');
      setExportProgress(93);
      setExportStatusText('Đang flush encoders...');

      await videoEncoder.flush();
      if (audioEncoder) await audioEncoder.flush();
      muxer.finalize();

      const outputBuf = muxer.target.buffer;
      const blob = new Blob([outputBuf], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setExportProgress(100);
      setExportStatusText('Hoàn tất!');
      setExportDone(true);
      showToast('Xuất video MP4 thành công! 🎉', 'success', 4000);

      // Auto trigger download!
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.songTitle || 'video'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch (err) {
      console.error('[Export Error]', err);
      showToast('Xuất video thất bại: ' + (err?.message || String(err)), 'error', 6000);
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
    showToast('Đã hủy xuất video.', 'info');
  }, []);

  const closeModal = useCallback(() => { setShowModal(false); }, []);

  return {
    isExporting, showModal, exportDone,
    exportPhase, exportDesc, exportProgress, exportStatusText, downloadUrl,
    startExport, cancelExport, closeModal,
  };
}
