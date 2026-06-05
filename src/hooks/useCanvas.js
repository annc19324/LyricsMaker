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

    const tick = () => {
      const canvas = canvasRef.current;
      const audio = audioRef.current;
      if (canvas && audio) {
        const ctx2d = canvas.getContext('2d');
        const state = useAppStore.getState();
        const visuals = state.visuals[state.activeRatio];
        renderFrame(
          ctx2d, canvas,
          audio.currentTime,
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
        if (getUpdateGain) getUpdateGain();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, [canvasRef, audioRef, mediaRefs]);

  const stopRenderLoop = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  return { updateCanvasSize, startRenderLoop, stopRenderLoop, rafRef };
}
