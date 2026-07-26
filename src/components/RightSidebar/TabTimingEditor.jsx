/**
 * components/RightSidebar/TabTimingEditor.jsx
 * Timing list editor with sort, clear, hotkey config, and inline time editing.
 */
import { useEffect, useRef } from 'react';
import useAppStore from '../../store/useAppStore';
import { formatTime } from '../../lib/lyricsParser';
import { resetScrollY } from '../../lib/canvasRenderer';

export default function TabTimingEditor({ audioRef, initAudioContext }) {
  const lyrics = useAppStore((s) => s.lyrics);
  const syncCursorIndex = useAppStore((s) => s.syncCursorIndex);
  const markKeys = useAppStore((s) => s.markKeys);
  const timeFormatMMSS = useAppStore((s) => s.timeFormatMMSS);
  const setSyncCursor = useAppStore((s) => s.setSyncCursor);
  const updateTimingAt = useAppStore((s) => s.updateTimingAt);
  const setMarkKeys = useAppStore((s) => s.setMarkKeys);
  const updateLyrics = useAppStore((s) => s.updateLyrics);
  const syncMode = useAppStore((s) => s.syncMode);
  const karaokeCursorState = useAppStore((s) => s.karaokeCursorState);
  const set = useAppStore((s) => s.set);

  // Scroll active row into view
  const listRef = useRef(null);
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const active = container.querySelector('.timing-row-new.active');
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [syncCursorIndex]);

  const handleSort = () => {
    const sorted = [...lyrics].sort((a, b) => (a.time ?? 0) - (b.time ?? 0));
    updateLyrics(sorted);
  };

  const handleClearTimings = () => {
    const cleared = lyrics.map((l) => ({ ...l, time: 0, endTime: null }));
    updateLyrics(cleared);
    setSyncCursor(0);
    set({ karaokeCursorState: 'start' });

    if (audioRef && audioRef.current) {
      const state = useAppStore.getState();
      const offset = (state.previewOffset || 0) / 1000;
      const start = parseFloat(state.audioStart) || 0;
      audioRef.current.currentTime = start - offset;

      if (audioRef.current.paused) {
        const playBtn = document.querySelector('.play-btn');
        if (playBtn) playBtn.click();
      }
    }
  };

  const handleTimeChange = (idx, raw, isEnd = false) => {
    const val = raw.trim().replace(',', '.');
    const time = val === '' || isNaN(parseFloat(val)) ? 0 : parseFloat(val);
    const line = lyrics[idx];
    if (isEnd) {
      updateTimingAt(idx, line.time, time);
    } else {
      updateTimingAt(idx, time, line.endTime);
    }
  };

  const handleRowClick = (idx, time) => {
    setSyncCursor(idx);
    if (time !== null && time > 0) {
      initAudioContext();
      if (audioRef.current) audioRef.current.currentTime = time;
      resetScrollY(); // snap canvas to correct lyric immediately
    }
  };

  const addHotkey = () => {
    const key = prompt('Nhập phím (vd: Enter, Space, KeyA, Digit1, ...)');
    if (key && !markKeys.includes(key)) setMarkKeys([...markKeys, key]);
  };
  const removeHotkey = (key) => setMarkKeys(markKeys.filter((k) => k !== key));

  const displayTime = (t) => {
    if (t === null || t === undefined) return '--';
    if (timeFormatMMSS) return formatTime(t);
    return t.toFixed(5);
  };

  if (lyrics.length === 0) {
    return (
      <div className="tab-panel active" id="tab-timing-editor">
        <div className="panel-section flex-column-expand">
          <div className="timings-list-wrapper">
            <div className="empty-timings-state">
              <i className="fa-solid fa-hourglass-empty"></i>
              <p>Chưa có dữ liệu lyrics. Nhấn tab <strong>Nhập Lyrics</strong> để bắt đầu.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-panel active" id="tab-timing-editor">
      <div className="panel-section flex-column-expand">
        <div className="section-header-row">
          <h3><i className="fa-solid fa-clock-rotate-left"></i> Chỉnh Sửa Thời Gian</h3>
          <button id="btn-toggle-time-format" className="btn btn-small"
            onClick={() => set({ timeFormatMMSS: !timeFormatMMSS })}>
            <i className="fa-solid fa-clock"></i> <span>{timeFormatMMSS ? 'Dạng 0:00' : 'Dạng số'}</span>
          </button>
        </div>
        <div className="timing-actions-row">
          <button id="btn-sort-timings" className="btn btn-secondary" onClick={handleSort}>Sắp xếp</button>
          <button id="btn-clear-timings" className="btn btn-secondary" onClick={handleClearTimings}>Xóa tất cả</button>
        </div>
        
        <div className="timing-actions-row mt-2">
          <button 
            className={`btn btn-secondary ${syncMode === 'karaoke' ? 'active-mode' : ''}`}
            onClick={() => set({ syncMode: syncMode === 'karaoke' ? 'basic' : 'karaoke', karaokeCursorState: 'start' })}
            style={{ width: '100%', background: syncMode === 'karaoke' ? 'var(--color-primary)' : '', color: syncMode === 'karaoke' ? '#fff' : '' }}
          >
            <i className={`fa-solid ${syncMode === 'karaoke' ? 'fa-microphone-lines' : 'fa-list-ul'}`}></i> 
            {syncMode === 'karaoke' ? ' Chế độ Karaoke (Đầu - Cuối)' : ' Chế độ Cơ bản (1 lần bấm)'}
          </button>
        </div>

        {/* Hotkey config */}
        <div className="form-group hotkey-config-group mt-3">
          <label><i className="fa-solid fa-keyboard"></i> Phím tắt đánh dấu:</label>
          <div className="hotkey-badges-row" id="hotkey-badges-container">
            {markKeys.map((key) => (
              <span key={key} className="hotkey-badge">
                {key}
                <button onClick={() => removeHotkey(key)} style={{ marginLeft: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>×</button>
              </span>
            ))}
          </div>
          <button id="btn-add-hotkey" className="btn btn-secondary btn-small" onClick={addHotkey}>
            <i className="fa-solid fa-plus"></i> Thêm phím
          </button>
        </div>

        {/* Timing rows */}
        <div className="timings-list-wrapper" id="timings-list-container" ref={listRef}>
          {lyrics.map((line, idx) => (
            <div
              key={idx}
              className={`timing-row-new${idx === syncCursorIndex ? ' active' : ''}`}
              data-index={idx}
            >
              <span className="timing-row-index">
                {idx + 1}
                {syncMode === 'karaoke' && idx === syncCursorIndex && (
                  <span style={{ display: 'block', fontSize: '9px', color: 'var(--color-primary)', marginTop: '2px' }}>
                    {karaokeCursorState === 'start' ? 'BẮT ĐẦU' : 'KẾT THÚC'}
                  </span>
                )}
              </span>
              <span className="timing-row-text" title="Click để chọn làm câu hát hiện tại"
                onClick={() => handleRowClick(idx, line.time)}>
                {line.text}
              </span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <input
                  type="text"
                  className="timing-row-input"
                  title="Thời gian bắt đầu (giây)"
                  placeholder="Bắt đầu"
                  defaultValue={line.time !== null && line.time !== undefined ? line.time === 0 ? '0' : line.time.toFixed(5) : '0'}
                  key={`start-${idx}-${line.time}`}
                  onBlur={(e) => handleTimeChange(idx, e.target.value, false)}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                />
                
                {syncMode === 'karaoke' && (
                  <input
                    type="text"
                    className="timing-row-input"
                    title="Thời gian kết thúc (giây)"
                    placeholder="Kết thúc"
                    defaultValue={line.endTime !== null && line.endTime !== undefined ? line.endTime === 0 ? '0' : line.endTime.toFixed(5) : ''}
                    key={`end-${idx}-${line.endTime}`}
                    onBlur={(e) => handleTimeChange(idx, e.target.value, true)}
                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
