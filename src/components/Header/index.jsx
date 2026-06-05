/**
 * components/Header/index.jsx
 * Top application header with logo, preview zoom, and action buttons.
 */
import useAppStore from '../../store/useAppStore';

export default function Header({ onReset, onExport }) {
  const previewZoom = useAppStore((s) => s.previewZoom);
  const debugMode = useAppStore((s) => s.debugMode);
  const set = useAppStore((s) => s.set);

  return (
    <header className="app-header">
      <div className="header-logo">
        <i className="fa-solid fa-music neon-text-icon"></i>
        <h1>Lyrics <span>Maker</span></h1>
        <span className="badge">PRO Studio</span>
      </div>

      <div className="header-zoom-control">
        <label htmlFor="slider-preview-zoom">
          <i className="fa-solid fa-magnifying-glass-plus"></i> Phóng to xem trước
        </label>
        <input type="range" id="slider-preview-zoom" min="50" max="500" value={previewZoom}
          onChange={(e) => set({ previewZoom: parseInt(e.target.value) })} />
        <span id="val-preview-zoom">{previewZoom}%</span>
      </div>

      <div className="header-actions">
        <button
          id="btn-debug-mode"
          className={`btn ${debugMode ? 'btn-danger' : 'btn-secondary'}`}
          title="Bật/tắt debug overlay (hiện audio.currentTime, FPS, lyric index trên canvas)"
          onClick={() => set({ debugMode: !debugMode })}
        >
          <i className="fa-solid fa-bug"></i> {debugMode ? 'Tắt Debug' : 'Debug'}
        </button>
        <button id="btn-reset-defaults" className="btn btn-secondary"
          title="Cài đặt lại toàn bộ thông số về mặc định" onClick={onReset}>
          <i className="fa-solid fa-rotate-left"></i> Cài lại mặc định
        </button>
        <button id="btn-export-video" className="btn btn-primary btn-glow"
          title="Xuất video chất lượng cao" onClick={onExport}>
          <i className="fa-solid fa-circle-arrow-down"></i> Xuất Video
        </button>
      </div>
    </header>
  );
}
