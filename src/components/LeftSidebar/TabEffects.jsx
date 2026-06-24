/**
 * components/LeftSidebar/TabEffects.jsx
 * Main media effects, lyrics effects, watermark, and highlight rules.
 */
import useAppStore from '../../store/useAppStore';
import SliderRow from '../ui/SliderRow';
import ToggleRow from '../ui/ToggleRow';
import ColorPickerRow from '../ui/ColorPickerRow';

export default function TabEffects() {
  const v = useAppStore((s) => s.visuals[s.activeRatio]);
  const setVisual = useAppStore((s) => s.setVisual);
  const highlightRules = useAppStore((s) => s.highlightRules);
  const setHighlightRules = useAppStore((s) => s.setHighlightRules);

  const sv = (key, val) => setVisual(key, val);

  const addHighlightRule = () => {
    setHighlightRules([...highlightRules, { pattern: '[', close: ']', color: '#f59e0b' }]);
  };
  const removeHighlightRule = (idx) => {
    setHighlightRules(highlightRules.filter((_, i) => i !== idx));
  };
  const updateHighlightRule = (idx, field, val) => {
    const updated = highlightRules.map((r, i) => i === idx ? { ...r, [field]: val } : r);
    setHighlightRules(updated);
  };

  return (
    <>
      {/* Main Image Effects */}
      <div className="panel-section">
        <h3><i className="fa-solid fa-circle-nodes"></i> Hiệu Ứng Ảnh/Video Chính</h3>
        <ToggleRow id="toggle-float" label="Hiệu ứng trôi nổi (Floating)"
          checked={v?.floatEnabled !== false} onChange={(c) => sv('floatEnabled', c)} />
        <SliderRow id="slider-float-speed" label="Tốc độ trôi nổi" min={0.1} max={5} step={0.1}
          value={v?.floatSpeed ?? 1} displayValue={`${v?.floatSpeed ?? 1}x`}
          onChange={(val) => sv('floatSpeed', val)} />
        <SliderRow id="slider-fog-intensity" label="Mật độ sương mù (Fog)" min={0} max={100}
          value={v?.fogIntensity ?? 30} displayValue={`${v?.fogIntensity ?? 30}%`}
          onChange={(val) => sv('fogIntensity', val)} />
        <SliderRow id="slider-fog-speed" label="Tốc độ sương mù (Fog Speed)" min={0} max={10} step={0.1}
          value={v?.fogSpeed ?? 0.5} displayValue={`${v?.fogSpeed ?? 0.5}x`}
          onChange={(val) => sv('fogSpeed', val)} />
      </div>

      {/* Lyrics Effects */}
      <div className="panel-section">
        <h3><i className="fa-solid fa-sparkles"></i> Hiệu Ứng Lyrics</h3>
        <div className="form-grid">
          <ColorPickerRow id="color-lyric-base" label="Màu chữ gốc"
            value={v?.colorLyricBase ?? '#ffffff'} onChange={(c) => sv('colorLyricBase', c)} />
          <ColorPickerRow id="color-lyric-active" label="Màu Karaoke"
            value={v?.colorLyricActive ?? '#ff2e93'} onChange={(c) => sv('colorLyricActive', c)} />
        </div>
        <ToggleRow id="toggle-karaoke" label="Bật hiệu ứng Karaoke"
          checked={v?.karaokeEnabled !== false} onChange={(c) => sv('karaokeEnabled', c)} />
        <SliderRow id="slider-karaoke-speed" label="Tốc độ chuyển màu Karaoke" min={0} max={5} step={0.1}
          value={v?.karaokeSpeed ?? 1.0}
          displayValue={v?.karaokeSpeed === 0 ? 'Tắt' : `${v?.karaokeSpeed ?? 1.0}x`}
          onChange={(val) => sv('karaokeSpeed', val)} />
        <div className="form-group">
          <label>Hiệu ứng chuyển dòng (Khắc phục vỡ nền video)</label>
          <select 
            value={v?.transitionEnabled === false ? 'jump' : 'scroll'}
            onChange={(e) => sv('transitionEnabled', e.target.value === 'scroll')}
          >
            <option value="scroll">Cuộn mượt mà (Mặc định)</option>
            <option value="jump">Chuyển tức thì / Không cuộn (Tránh vỡ nền khi xem trên điện thoại)</option>
          </select>
        </div>
        <SliderRow id="slider-transition-speed" label="Tốc độ cuộn lyrics" min={0.02} max={0.5} step={0.01}
          value={v?.transitionSpeed ?? 0.1} displayValue={`${v?.transitionSpeed ?? 0.1}x`}
          onChange={(val) => sv('transitionSpeed', val)} />
        <SliderRow id="slider-lyric-zoom" label="Phóng to chữ hiện tại (Scale)" min={0.5} max={3.0} step={0.05}
          value={v?.lyricZoom ?? 1.1} displayValue={`${v?.lyricZoom ?? 1.1}x`}
          onChange={(val) => sv('lyricZoom', val)} />
        <SliderRow id="slider-lyric-glow" label="Độ phát sáng chữ (Glow)" min={0} max={60}
          value={v?.lyricGlow ?? 10} displayValue={`${v?.lyricGlow ?? 10}px`}
          onChange={(val) => sv('lyricGlow', val)} />
        <ColorPickerRow id="color-lyric-glow" label="Màu phát sáng"
          value={v?.colorLyricGlow ?? '#ff2e93'} onChange={(c) => sv('colorLyricGlow', c)} />
        <SliderRow id="slider-frame-opacity" label="Độ mờ khung nền chữ (Frame Opacity)" min={0} max={100}
          value={v?.frameOpacity ?? 0} displayValue={`${v?.frameOpacity ?? 0}%`}
          onChange={(val) => sv('frameOpacity', val)} />
        <div className="form-grid">
          <SliderRow id="slider-frame-width" label="Chiều rộng khung" min={50} max={2000}
            value={v?.frameWidth ?? 800} displayValue={`${v?.frameWidth ?? 800}px`}
            onChange={(val) => sv('frameWidth', val)} />
          <SliderRow id="slider-frame-height" label="Chiều cao khung" min={20} max={800}
            value={v?.frameHeight ?? 150} displayValue={`${v?.frameHeight ?? 150}px`}
            onChange={(val) => sv('frameHeight', val)} />
        </div>
        <ColorPickerRow id="color-frame-bg" label="Màu nền khung"
          value={v?.colorFrameBg ?? '#000000'} onChange={(c) => sv('colorFrameBg', c)} />
      </div>

      {/* Watermark */}
      <div className="panel-section">
        <h3><i className="fa-solid fa-copyright"></i> Watermark</h3>
        <ToggleRow id="toggle-watermark" label="Bật Watermark"
          checked={v?.watermarkEnabled === true} onChange={(c) => sv('watermarkEnabled', c)} />
        <ToggleRow id="toggle-wm-float" label="Trôi nổi đồng bộ với đĩa nhạc"
          checked={v?.watermarkFloatEnabled === true} onChange={(c) => sv('watermarkFloatEnabled', c)} />
        <div className="form-group">
          <label htmlFor="input-watermark-text">Nội dung</label>
          <input type="text" id="input-watermark-text" placeholder="@username"
            value={v?.watermarkText ?? '@annc19324'} onChange={(e) => sv('watermarkText', e.target.value)} />
        </div>
        <div className="form-grid">
          <SliderRow id="slider-wm-x" label="Vị trí X" min={0} max={100} step={0.1}
            value={v?.watermarkX ?? 50} displayValue={`${v?.watermarkX ?? 50}%`}
            onChange={(val) => sv('watermarkX', val)} />
          <SliderRow id="slider-wm-y" label="Vị trí Y" min={0} max={100} step={0.1}
            value={v?.watermarkY ?? 50} displayValue={`${v?.watermarkY ?? 50}%`}
            onChange={(val) => sv('watermarkY', val)} />
        </div>
        <div className="form-grid">
          <SliderRow id="slider-wm-size" label="Cỡ chữ" min={8} max={200}
            value={v?.watermarkFontSize ?? 18} displayValue={`${v?.watermarkFontSize ?? 18}px`}
            onChange={(val) => sv('watermarkFontSize', val)} />
          <SliderRow id="slider-wm-opacity" label="Độ mờ" min={0} max={100}
            value={v?.watermarkOpacity ?? 60} displayValue={`${v?.watermarkOpacity ?? 60}%`}
            onChange={(val) => sv('watermarkOpacity', val)} />
        </div>
        <div className="form-grid">
          <SliderRow id="slider-wm-rotate" label="Xoay" min={-180} max={180}
            value={v?.watermarkRotate ?? 0} displayValue={`${v?.watermarkRotate ?? 0}°`}
            onChange={(val) => sv('watermarkRotate', val)} />
          <SliderRow id="slider-wm-spacing" label="Khoảng chữ" min={0} max={20}
            value={v?.watermarkLetterSpacing ?? 0} displayValue={`${v?.watermarkLetterSpacing ?? 0}px`}
            onChange={(val) => sv('watermarkLetterSpacing', val)} />
        </div>
        <ColorPickerRow id="color-wm" label="Màu chữ"
          value={v?.watermarkColor ?? '#ffffff'} onChange={(c) => sv('watermarkColor', c)} />
        <div className="form-group flex-row" style={{ gap: '12px' }}>
          <ToggleRow id="toggle-wm-italic" label="Nghiêng"
            checked={v?.watermarkItalic === true} onChange={(c) => sv('watermarkItalic', c)} />
          <ToggleRow id="toggle-wm-bold" label="Đậm"
            checked={v?.watermarkBold === true} onChange={(c) => sv('watermarkBold', c)} />
        </div>
      </div>

      {/* Highlight Rules */}
      <div className="panel-section">
        <h3><i className="fa-solid fa-highlighter"></i> Highlight Chữ</h3>
        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
          Chọn ký tự mở/đóng và màu. Áp dụng cho lyrics, tên bài, ca sĩ, kênh.
        </p>
        <div id="highlight-rules-container">
          {highlightRules.map((rule, idx) => (
            <div key={idx} className="highlight-rule-row" style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
              <input type="text" placeholder="Mở" value={rule.pattern} style={{ width: '50px' }}
                onChange={(e) => updateHighlightRule(idx, 'pattern', e.target.value)} />
              <input type="text" placeholder="Đóng" value={rule.close} style={{ width: '50px' }}
                onChange={(e) => updateHighlightRule(idx, 'close', e.target.value)} />
              <input type="color" value={rule.color}
                onChange={(e) => updateHighlightRule(idx, 'color', e.target.value)} />
              <button className="btn btn-secondary btn-small" onClick={() => removeHighlightRule(idx)}>
                <i className="fa-solid fa-trash"></i>
              </button>
            </div>
          ))}
        </div>
        <button id="btn-add-highlight" className="btn btn-secondary mt-3" style={{ width: '100%' }}
          onClick={addHighlightRule}>
          <i className="fa-solid fa-plus"></i> Thêm quy tắc highlight
        </button>
      </div>
    </>
  );
}
