/**
 * hooks/useCanvas.js
 * Manages canvas sizing and the requestAnimationFrame render loop.
 */
import { useEffect, useRef, useCallback } from 'react';
import useAppStore from '../store/useAppStore';
import { renderFrame, initFogParticles, resetScrollY } from '../lib/canvasRenderer';

export function useCanvas(canvasRef, audioRef, mediaRefs) {
  const rafRef = useRef(null);

  const activeRatio = useAppStore((s) => s.activeRatio);
  const previewZoom = useAppStore((s) => s.previewZoom);
  const highlightRules = useAppStore((s) => s.highlightRules);
  const songTitle = useAppStore((s) => s.songTitle);
  const songArtist = useAppStore((s) => s.songArtist);
  const songChannel = useAppStore((s) => s.songChannel);

  // Init fog particles once
  useEffect(() => { initFogParticles(); }, []);

  // Canvas resolution + preview box size
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    const box = document.getElementById('aspect-ratio-box');
    if (!canvas || !box) return;

    if (activeRatio === '16:9') { canvas.width = 1280; canvas.height = 720; box.style.aspectRatio = '16/9'; }
    else if (activeRatio === '9:16') { canvas.width = 720; canvas.height = 1280; box.style.aspectRatio = '9/16'; }
    else { canvas.width = 720; canvas.height = 720; box.style.aspectRatio = '1/1'; }

    const parent = box.parentElement;
    if (!parent) return;
    const pw = parent.clientWidth;
    const ph = parent.clientHeight;
    const [wr, hr] = activeRatio.split(':').map(Number);
    const ratio = wr / hr;
    let bw = pw, bh = ph;
    if (pw / ph > ratio) bw = ph * ratio;
    else bh = pw / ratio;
    const zoom = (previewZoom || 100) / 100;
    box.style.width = `${bw * zoom}px`;
    box.style.height = `${bh * zoom}px`;
  }, [canvasRef, activeRatio, previewZoom]);

  useEffect(() => {
    updateCanvasSize();
    resetScrollY();
  }, [updateCanvasSize]);

  // Render loop
  const startRenderLoop = useCallback((getAudioDuration, getUpdateGain) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    // FPS counter state
    let fpsFrameCount = 0;
    let fpsLastTime = performance.now();
    let currentFps = 60;

    const tick = (rafTimestamp) => {
      // ── FPS tracking ───────────────────────────────────────────────────────
      fpsFrameCount++;
      if (rafTimestamp - fpsLastTime >= 1000) {
        currentFps = fpsFrameCount;
        fpsFrameCount = 0;
        fpsLastTime = rafTimestamp;
      }

      const canvas = canvasRef.current;
      const audio = audioRef.current;
      if (canvas && audio) {
        const ctx2d = canvas.getContext('2d');
        const state = useAppStore.getState();
        const visuals = state.visuals[state.activeRatio];

        // ── Source of truth: audio.currentTime (NEVER performance.now) ──────
        const curTime = audio.currentTime;

        // Sync background video if it drifts by more than 0.15s
        if (mediaRefs.bgMediaType.current === 'video' && mediaRefs.bgVideo.current) {
          const bgVid = mediaRefs.bgVideo.current;
          if (Math.abs(bgVid.currentTime - curTime) > 0.15) {
            bgVid.currentTime = curTime;
          }
        }
        // Sync main video if it drifts by more than 0.15s
        if (mediaRefs.mainMediaType.current === 'video' && mediaRefs.mainVideo.current) {
          const mainVid = mediaRefs.mainVideo.current;
          if (Math.abs(mainVid.currentTime - curTime) > 0.15) {
            mainVid.currentTime = curTime;
          }
        }

        renderFrame(
          ctx2d, canvas,
          curTime,
          visuals,
          { songTitle: state.songTitle, songArtist: state.songArtist, songChannel: state.songChannel },
          state.lyrics,
          {
            bgImage: mediaRefs.bgImage.current,
            bgVideo: mediaRefs.bgVideo.current,
            bgMediaType: mediaRefs.bgMediaType.current,
            mainImage: mediaRefs.mainImage.current,
            mainVideo: mediaRefs.mainVideo.current,
            mainMediaType: mediaRefs.mainMediaType.current,
          },
          state.highlightRules,
          getAudioDuration(),
        );

        // ── Debug overlay (visible in preview only, not in export) ──────────
        if (state.debugMode) {
          // Find active lyric index (same logic as canvasRenderer)
          let activeIdx = 0;
          state.lyrics.forEach((l, i) => {
            const t = l.time;
            if (t !== null && t !== undefined && !(i > 0 && t === 0) && curTime >= t) activeIdx = i;
          });
          const activeLyric = state.lyrics[activeIdx]?.text?.slice(0, 30) ?? '—';

          ctx2d.save();
          ctx2d.fillStyle = 'rgba(0,0,0,0.7)';
          ctx2d.fillRect(0, 0, 420, 90);
          ctx2d.fillStyle = '#00ff88';
          ctx2d.font = 'bold 20px monospace';
          ctx2d.textAlign = 'left';
          ctx2d.textBaseline = 'top';
          ctx2d.fillText(`⏱ audio.currentTime: ${curTime.toFixed(3)}s`, 10, 8);
          ctx2d.fillText(`🎵 activeIdx: ${activeIdx} | ${activeLyric}`, 10, 33);
          ctx2d.fillStyle = currentFps < 30 ? '#ff4444' : '#00ff88';
          ctx2d.fillText(`📊 FPS: ${currentFps} ${currentFps < 30 ? '⚠ THẤP' : '✓'}`, 10, 58);
          ctx2d.restore();
        }

        if (getUpdateGain) getUpdateGain();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    tick(performance.now());
  }, [canvasRef, audioRef, mediaRefs]);

  const stopRenderLoop = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  return { updateCanvasSize, startRenderLoop, stopRenderLoop, rafRef };
}
