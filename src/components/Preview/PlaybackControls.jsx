/**
 * components/Preview/PlaybackControls.jsx
 * Playback bar: progress slider, play/pause, skip, volume, mark timing button.
 */
import { useState, useCallback } from 'react';
import useAppStore from '../../store/useAppStore';
import { formatTime } from '../../lib/lyricsParser';
import { resetScrollY } from '../../lib/canvasRenderer';

export default function PlaybackControls({ audioRef, initAudioContext, onMarkTiming, mediaRefs }) {
  const volume = useAppStore((s) => s.volume);
  const set = useAppStore((s) => s.set);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // These are called from App.jsx via a ref pattern through audioRef events
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || isDragging) return;
    const state = useAppStore.getState();
    const offset = (state.previewOffset || 0) / 1000;
    const audioStart = parseFloat(state.audioStart) || 0;
    const audioEndRaw = state.audioEnd;
    const dur = audio.duration || 60;
    const end = (!audioEndRaw || audioEndRaw === 'auto' || isNaN(parseFloat(audioEndRaw))) ? dur : parseFloat(audioEndRaw);
    const t = audio.currentTime + offset;
    const elapsed = Math.max(0, t - audioStart);
    const trimDur = end - audioStart;
    setCurrentTime(elapsed);
    setDuration(trimDur);
  }, [audioRef, isDragging]);

  // Expose event handlers to be attached in App
  PlaybackControls._handleTimeUpdate = handleTimeUpdate;
  PlaybackControls._setIsPlaying = setIsPlaying;

  const handlePlayPause = () => {
    initAudioContext();
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      // Jump to trim start if behind it
      const state = useAppStore.getState();
      const offset = (state.previewOffset || 0) / 1000;
      const start = parseFloat(state.audioStart) || 0;
      const t = audio.currentTime + offset;
      if (t < start) audio.currentTime = start - offset;
      audio.play();
      setIsPlaying(true);
      if (mediaRefs?.bgVideo?.current) mediaRefs.bgVideo.current.play().catch(() => {});
      if (mediaRefs?.mainVideo?.current) mediaRefs.mainVideo.current.play().catch(() => {});
    } else {
      audio.pause();
      setIsPlaying(false);
      if (mediaRefs?.bgVideo?.current) mediaRefs.bgVideo.current.pause();
      if (mediaRefs?.mainVideo?.current) mediaRefs.mainVideo.current.pause();
    }
  };

  const handleSkip = (delta) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime + delta);
    resetScrollY(); // snap canvas to correct lyric after seek
  };

  const handleProgressChange = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const state = useAppStore.getState();
    const offset = (state.previewOffset || 0) / 1000;
    const audioStart = parseFloat(state.audioStart) || 0;
    const audioEndRaw = state.audioEnd;
    const dur = audio.duration || 60;
    const end = (!audioEndRaw || audioEndRaw === 'auto' || isNaN(parseFloat(audioEndRaw))) ? dur : parseFloat(audioEndRaw);
    const trimDur = end - audioStart;
    const targetT = audioStart + (parseFloat(e.target.value) / 100) * trimDur;
    audio.currentTime = targetT - offset;
    resetScrollY(); // snap canvas to correct lyric after seek
  };

  const handleVolumeChange = (e) => {
    const val = parseInt(e.target.value);
    set({ volume: val });
    if (audioRef.current) audioRef.current.volume = val / 100;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="playback-controls-card">
      <div className="progress-container">
        <input type="range" id="slider-playback-progress" min="0" max="100" value={progress.toFixed(1)}
          step="0.1" className="playback-slider"
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onChange={handleProgressChange} />
        <div className="progress-bar-fill" id="progress-bar-fill" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="control-buttons-row">
        <div className="current-time-display">
          <span id="time-current">{formatTime(currentTime)}</span>
          <span className="time-divider">/</span>
          <span id="time-total">{formatTime(duration)}</span>
        </div>
        <div className="playback-buttons">
          <button id="btn-skip-backward" className="control-btn" title="Lùi lại 5 giây" onClick={() => handleSkip(-5)}>
            <i className="fa-solid fa-backward-step"></i>
          </button>
          <button id="btn-play-pause" className={`control-btn play-btn${isPlaying ? ' active' : ''}`}
            title="Chạy / Dừng (Space)" onClick={handlePlayPause}>
            <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
          </button>
          <button id="btn-skip-forward" className="control-btn" title="Tiến lên 5 giây" onClick={() => handleSkip(5)}>
            <i className="fa-solid fa-forward-step"></i>
          </button>
        </div>
        <div className="controls-right-group">
          <div className="volume-container">
            <i className="fa-solid fa-volume-high" id="volume-icon"></i>
            <input type="range" id="slider-volume" min="0" max="100" value={volume}
              className="volume-slider" onChange={handleVolumeChange} />
          </div>
          <button id="btn-mark-timing" className="btn btn-danger btn-glow btn-mark-timing"
            title="Đánh dấu câu tiếp theo tại giây hiện tại (Enter)" onClick={onMarkTiming}>
            <i className="fa-solid fa-stopwatch"></i> Đánh Dấu (Enter)
          </button>
        </div>
      </div>
    </div>
  );
}
