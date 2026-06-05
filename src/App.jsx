/**
 * App.jsx
 * Root component — wires all hooks, refs, and components together.
 * Handles global keyboard events, audio timeupdate, and the mark-timing flow.
 */
import { useRef, useEffect, useCallback } from 'react';

import useAppStore from './store/useAppStore';
import { useAudio } from './hooks/useAudio';
import { useCanvas } from './hooks/useCanvas';
import { useExport } from './hooks/useExport';
import { buildLyricsFromRaw, findFirstUnsyncedIndex } from './lib/lyricsParser';
import { loadFileFromIDB } from './lib/idb';

import Header from './components/Header';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import PreviewCanvas from './components/Preview/PreviewCanvas';
import PlaybackControls from './components/Preview/PlaybackControls';
import ExportModal from './components/modals/ExportModal';
import { ToastContainer, showToast } from './components/ui/Toast';

export default function App() {
  // ── Refs ───────────────────────────────────────────────────────────────────
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const playbackControlsRef = useRef(null);

  // Media element refs (passed into canvas renderer)
  const mediaRefs = {
    bgImage: useRef(new Image()),
    bgVideo: useRef(Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true })),
    bgMediaType: useRef('image'),
    mainImage: useRef(new Image()),
    mainVideo: useRef(Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true })),
    mainMediaType: useRef('image'),
  };

  // ── Store ──────────────────────────────────────────────────────────────────
  const lyrics = useAppStore((s) => s.lyrics);
  const markKeys = useAppStore((s) => s.markKeys);
  const syncCursorIndex = useAppStore((s) => s.syncCursorIndex);
  const resetToDefaults = useAppStore((s) => s.resetToDefaults);
  const updateLyrics = useAppStore((s) => s.updateLyrics);
  const setSyncCursor = useAppStore((s) => s.setSyncCursor);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const {
    audioCtxRef, gainRef, speakerGainRef, audioDestRef,
    initAudioContext, updateGainAndFades, loadAudioFile,
  } = useAudio(audioRef);

  const { updateCanvasSize, startRenderLoop, stopRenderLoop } = useCanvas(canvasRef, audioRef, mediaRefs);

  const {
    isExporting, showModal, exportDone,
    exportPhase, exportDesc, exportProgress, exportStatusText, downloadUrl,
    startExport, cancelExport, closeModal,
  } = useExport(canvasRef, audioRef, mediaRefs, speakerGainRef, audioCtxRef);

  // ── Boot: restore lyrics from saved state ─────────────────────────────────
  useEffect(() => {
    const st = useAppStore.getState();
    if (st.rawLyrics && st.lyrics.length === 0) {
      const lyr = buildLyricsFromRaw(st.rawLyrics, st.timings, []);
      updateLyrics(lyr);
      setSyncCursor(findFirstUnsyncedIndex(lyr));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Boot: restore media from IndexedDB ────────────────────────────────────
  useEffect(() => {
    const restoreMedia = async () => {
      try {
        const audioFile = await loadFileFromIDB('audio');
        if (audioFile) loadAudioFile(audioFile);

        const bgImg = await loadFileFromIDB('bg_image');
        if (bgImg) { mediaRefs.bgImage.current.src = URL.createObjectURL(bgImg); mediaRefs.bgMediaType.current = 'image'; }

        const bgVid = await loadFileFromIDB('bg_video');
        if (bgVid) {
          const v = mediaRefs.bgVideo.current;
          v.src = URL.createObjectURL(bgVid); v.load(); v.play().catch(() => {});
          mediaRefs.bgMediaType.current = 'video';
        }

        const mainImg = await loadFileFromIDB('main_image');
        if (mainImg) { mediaRefs.mainImage.current.src = URL.createObjectURL(mainImg); mediaRefs.mainMediaType.current = 'image'; }

        const mainVid = await loadFileFromIDB('main_video');
        if (mainVid) {
          const v = mediaRefs.mainVideo.current;
          v.src = URL.createObjectURL(mainVid); v.load(); v.play().catch(() => {});
          mediaRefs.mainMediaType.current = 'video';
        }
      } catch (e) {
        console.warn('IDB restore failed:', e);
      }
    };
    restoreMedia();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start render loop once ────────────────────────────────────────────────
  useEffect(() => {
    startRenderLoop(
      () => audioRef.current?.duration || 60,
      () => updateGainAndFades(),
    );
    return () => stopRenderLoop();
  }, [startRenderLoop, stopRenderLoop, updateGainAndFades]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Audio timeupdate → playback controls ─────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      // Forward to PlaybackControls static handler
      PlaybackControls._handleTimeUpdate?.();

      const st = useAppStore.getState();
      const audioStart = parseFloat(st.audioStart) || 0;
      const audioEnd = st.audioEnd;
      const dur = audio.duration || 60;
      const end = audioEnd === 'auto' ? dur : parseFloat(audioEnd);
      if (audio.currentTime >= end) {
        audio.pause();
        audio.currentTime = audioStart;
        PlaybackControls._setIsPlaying?.(false);
        if (mediaRefs.bgVideo.current) mediaRefs.bgVideo.current.pause();
        if (mediaRefs.mainVideo.current) mediaRefs.mainVideo.current.pause();
      }

      // Highlight active timing row
      const cur = audio.currentTime;
      const timingRows = document.querySelectorAll('.timing-row-new');
      let activePlayIdx = -1;
      st.lyrics.forEach((l, i) => {
        const t = l.time;
        if (t !== null && t !== undefined && !(i > 0 && t === 0) && cur >= t) activePlayIdx = i;
      });
      timingRows.forEach((row, i) => {
        if (i === activePlayIdx) { row.classList.add('playing'); }
        else { row.classList.remove('playing'); }
      });
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    return () => audio.removeEventListener('timeupdate', onTimeUpdate);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mark timing ───────────────────────────────────────────────────────────
  const markCurrentTiming = useCallback(() => {
    initAudioContext();
    const audio = audioRef.current;
    if (!audio || lyrics.length === 0) return;
    const cur = audio.currentTime;
    const idx = useAppStore.getState().syncCursorIndex;
    const updated = [...useAppStore.getState().lyrics];
    updated[idx] = { ...updated[idx], time: cur };
    updateLyrics(updated);
    if (idx < updated.length - 1) setSyncCursor(idx + 1);
    showToast(`✓ Đánh dấu tại ${cur.toFixed(2)}s`, 'success', 1500);
  }, [initAudioContext, audioRef, lyrics.length, updateLyrics, setSyncCursor]);

  // ── Global keyboard handler ───────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      // Don't intercept while typing in inputs
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const st = useAppStore.getState();
      const key = e.code; // e.g. "Space", "Enter", "KeyA"

      if (st.markKeys.includes(key) || st.markKeys.includes(e.key)) {
        e.preventDefault();
        markCurrentTiming();
        return;
      }

      // Space fallback for play/pause when not a mark key
      if (e.key === ' ' && !st.markKeys.includes('Space')) {
        e.preventDefault();
        const audio = audioRef.current;
        if (!audio) return;
        initAudioContext();
        if (audio.paused) { audio.play(); PlaybackControls._setIsPlaying?.(true); }
        else { audio.pause(); PlaybackControls._setIsPlaying?.(false); }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [markCurrentTiming, initAudioContext, audioRef]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const handleReset = () => {
    if (!window.confirm('Cài lại toàn bộ thông số mặc định? Dữ liệu hiện tại sẽ bị xóa.')) return;
    resetToDefaults();
    updateCanvasSize();
    showToast('Đã cài lại mặc định.', 'info');
  };

  // ── Export (stop render loop first) ──────────────────────────────────────
  const handleExport = useCallback(async () => {
    stopRenderLoop();
    await startExport();
    startRenderLoop(
      () => audioRef.current?.duration || 60,
      () => updateGainAndFades(),
    );
  }, [stopRenderLoop, startExport, startRenderLoop, audioRef, updateGainAndFades]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      <Header onReset={handleReset} onExport={handleExport} />

      <main className="app-workspace">
        <LeftSidebar mediaRefs={mediaRefs} loadAudioFile={loadAudioFile} />

        <section className="workspace-center">
          <PreviewCanvas canvasRef={canvasRef} />
          <PlaybackControls
            ref={playbackControlsRef}
            audioRef={audioRef}
            initAudioContext={initAudioContext}
            onMarkTiming={markCurrentTiming}
            mediaRefs={mediaRefs}
          />
        </section>

        <RightSidebar audioRef={audioRef} initAudioContext={initAudioContext} />
      </main>

      {/* Hidden audio element */}
      <audio ref={audioRef} id="audio-player" style={{ display: 'none' }} />

      <ExportModal
        show={showModal}
        isDone={exportDone}
        phase={exportPhase}
        desc={exportDesc}
        progress={exportProgress}
        statusText={exportStatusText}
        downloadUrl={downloadUrl}
        onCancel={cancelExport}
        onClose={closeModal}
      />

      <ToastContainer />
    </div>
  );
}
