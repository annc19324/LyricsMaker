/**
 * components/LeftSidebar/TabLayout.jsx
 * Aspect ratio, song info layout, background styles, main media layout, lyrics typography.
 */
import useAppStore from '../../store/useAppStore';
import SliderRow from '../ui/SliderRow';
import ToggleRow from '../ui/ToggleRow';

const RATIOS = ['16:9', '9:16', '1:1'];
const RATIO_ICONS = { '16:9': 'fa-desktop', '9:16': 'fa-mobile-screen', '1:1': 'fa-square' };
const RATIO_LABELS = { '16:9': 'YouTube', '9:16': 'TikTok', '1:1': 'Square' };

const FONTS = [
  { value: 'Outfit', label: 'Outfit (Hiện đại)' },
  { value: 'Be Vietnam Pro', label: 'Be Vietnam Pro (Rõ nét)' },
  { value: 'Montserrat', label: 'Montserrat (Mạnh mẽ)' },
  { value: 'Inter', label: 'Inter (Tối giản / UI)' },
  { value: 'Lexend', label: 'Lexend (Dễ đọc / Tối ưu)' },
  { value: 'Nunito', label: 'Nunito (Bo tròn dễ thương)' },
  { value: 'Quicksand', label: 'Quicksand (Nhẹ nhàng)' },
  { value: 'Comfortaa', label: 'Comfortaa (Độc đáo)' },
  { value: 'Oswald', label: 'Oswald (Hẹp cao cá tính)' },
  { value: 'Lora', label: 'Lora (Serif Cổ điển)' },
  { value: 'Playfair Display', label: 'Playfair Display (Nghệ thuật)' },
  { value: 'Pacifico', label: 'Pacifico (Viết tay cá tính)' },
  { value: 'Dancing Script', label: 'Dancing Script (Viết tay uốn lượn)' },
  { value: 'Patrick Hand', label: 'Patrick Hand (Viết tay tự nhiên)' },
  { value: 'sans-serif', label: 'System Sans-Serif' },
];

export default function TabLayout() {
  const activeRatio = useAppStore((s) => s.activeRatio);
  const setActiveRatio = useAppStore((s) => s.setActiveRatio);
  const v = useAppStore((s) => s.visuals[s.activeRatio]);
  const setVisual = useAppStore((s) => s.setVisual);
  const setVisuals = useAppStore((s) => s.setVisuals);

  const sv = (key, val) => setVisual(key, val);

  return (
    <>
      {/* Aspect Ratio */}
      <div className="panel-section">
        <h3><i className="fa-solid fa-crop"></i> Tỷ Lệ Khung Hình</h3>
        <div className="aspect-ratio-selector">
          {RATIOS.map((r) => (
            <button key={r} className={`ratio-btn${activeRatio === r ? ' active' : ''}`} onClick={() => setActiveRatio(r)}>
              <i className={`fa-solid ${RATIO_ICONS[r]}`}></i>
              <span>{r}</span>
              <span className="ratio-label">{RATIO_LABELS[r]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Song Info Layout */}
      <div className="panel-section">
        <h3><i className="fa-solid fa-music"></i> Bố Cục Tên Bài / Ca Sĩ</h3>
        <div className="form-group">
          <label>Căn lề</label>
          <div className="align-selector">
            {['left', 'center', 'right'].map((a) => (
              <button key={a} className={`si-align-btn${(v?.songInfoAlign ?? 'center') === a ? ' active' : ''}`}
                onClick={() => sv('songInfoAlign', a)}>
                <i className={`fa-solid fa-align-${a}`}></i> {a === 'left' ? 'Trái' : a === 'center' ? 'Giữa' : 'Phải'}
              </button>
            ))}
          </div>
        </div>
        <SliderRow id="slider-si-size" label="Cỡ chữ" min={8} max={120} value={v?.songInfoFontSize ?? 20}
          displayValue={`${v?.songInfoFontSize ?? 20}px`}
          onChange={(val) => sv('songInfoFontSize', val)} />
        <div className="form-grid">
          <SliderRow id="slider-si-x" label="Vị trí X" min={0} max={100} step={0.1} value={v?.songInfoX ?? 50}
            displayValue={`${v?.songInfoX ?? 50}%`} onChange={(val) => sv('songInfoX', val)} />
          <SliderRow id="slider-si-y" label="Vị trí Y" min={0} max={100} step={0.1} value={v?.songInfoY ?? 8}
            displayValue={`${v?.songInfoY ?? 8}%`} onChange={(val) => sv('songInfoY', val)} />
        </div>
      </div>

      {/* Background Styles */}
      <div className="panel-section">
        <h3><i className="fa-solid fa-palette"></i> Cài Đặt Nền</h3>
        <SliderRow id="slider-bg-blur" label="Độ nhòe nền (Blur)" min={0} max={80} value={v?.bgBlur ?? 0}
          displayValue={`${v?.bgBlur ?? 0}px`} onChange={(val) => sv('bgBlur', val)} />
        <SliderRow id="slider-bg-overlay" label="Độ mờ nền / Tối (Dark Overlay)" min={0} max={100}
          value={v?.bgOverlayOpacity ?? 0} displayValue={`${v?.bgOverlayOpacity ?? 0}%`}
          onChange={(val) => sv('bgOverlayOpacity', val)} />
        <ToggleRow id="toggle-bg-float" label="Hiệu ứng nền trôi nổi"
          checked={v?.bgFloatEnabled === true} onChange={(c) => sv('bgFloatEnabled', c)} />
        <SliderRow id="slider-bg-float-speed" label="Tốc độ trôi nền" min={0.1} max={5} step={0.1}
          value={v?.bgFloatSpeed ?? 1.0} displayValue={`${v?.bgFloatSpeed ?? 1.0}x`}
          onChange={(val) => sv('bgFloatSpeed', val)} />
      </div>

      {/* Main Media Settings */}
      <div className="panel-section">
        <h3><i className="fa-solid fa-circle-dot"></i> Bố Cục Ảnh/Video Chính</h3>
        <div className="form-group">
          <label>Hình dạng ảnh/video chính</label>
          <div className="toggle-group">
            <button className={`toggle-btn${(v?.mainShape ?? 'circle') === 'circle' ? ' active' : ''}`}
              onClick={() => sv('mainShape', 'circle')}>Tròn</button>
            <button className={`toggle-btn${(v?.mainShape ?? 'circle') === 'rect' ? ' active' : ''}`}
              onClick={() => sv('mainShape', 'rect')}>Vuông</button>
          </div>
        </div>
        <ToggleRow id="toggle-main-border" label="Hiển thị viền (Border)"
          checked={v?.mainBorderEnabled !== false} onChange={(c) => sv('mainBorderEnabled', c)} />
        <ToggleRow id="toggle-main-spin" label="Quay ảnh/video chính"
          checked={v?.spinEnabled !== false} onChange={(c) => sv('spinEnabled', c)} />
        <ToggleRow id="toggle-main-full" label="Hiện đầy đủ ảnh/video (không cắt)"
          checked={v?.mainFullEnabled === true} onChange={(c) => sv('mainFullEnabled', c)} />
        <SliderRow id="slider-spin-speed" label="Tốc độ quay" min={0.1} max={10} step={0.1}
          value={v?.spinSpeed ?? 1.0} displayValue={`${v?.spinSpeed ?? 1.0}x`}
          onChange={(val) => sv('spinSpeed', val)} />
        <SliderRow id="slider-main-size" label="Kích thước (Size)" min={20} max={1200}
          value={v?.mainSize ?? 200} displayValue={`${v?.mainSize ?? 200}px`}
          onChange={(val) => sv('mainSize', val)} />
        <SliderRow id="slider-main-x" label="Vị trí X (%)" min={0} max={100} step={0.1}
          value={v?.mainX ?? 50} displayValue={`${v?.mainX ?? 50}%`}
          onChange={(val) => sv('mainX', val)} />
        <SliderRow id="slider-main-y" label="Vị trí Y (%)" min={0} max={100} step={0.1}
          value={v?.mainY ?? 35} displayValue={`${v?.mainY ?? 35}%`}
          onChange={(val) => sv('mainY', val)} />
      </div>

      {/* Lyrics Typography */}
      <div className="panel-section">
        <h3><i className="fa-solid fa-font"></i> Bố Cục Chữ Lyrics</h3>
        <div className="form-group">
          <label htmlFor="select-font-family">Phông Chữ (Font Family)</label>
          <select id="select-font-family" value={v?.lyricFontFamily ?? 'Montserrat'}
            onChange={(e) => sv('lyricFontFamily', e.target.value)}>
            {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <SliderRow id="slider-lyric-size" label="Cỡ chữ (Font Size)" min={8} max={200}
          value={v?.lyricFontSize ?? 28} displayValue={`${v?.lyricFontSize ?? 28}px`}
          onChange={(val) => sv('lyricFontSize', val)} />
        <ToggleRow id="toggle-lyric-bold" label="In đậm dòng chính"
          checked={v?.lyricBoldEnabled !== false} onChange={(c) => sv('lyricBoldEnabled', c)} />
        <SliderRow id="slider-line-spacing" label="Khoảng cách câu" min={0.8} max={3.0} step={0.1}
          value={v?.lineSpacing ?? 1.5} displayValue={`${v?.lineSpacing ?? 1.5}x`}
          onChange={(val) => sv('lineSpacing', val)} />
        <SliderRow id="slider-subline-spacing" label="Khoảng cách dòng (trong 1 câu)" min={0.8} max={3.0} step={0.1}
          value={v?.subLineSpacing ?? 1.2} displayValue={`${v?.subLineSpacing ?? 1.2}x`}
          onChange={(val) => sv('subLineSpacing', val)} />
        <SliderRow id="slider-highlight-scale" label="Tỷ lệ cỡ chữ kí tự đặc biệt" min={0.5} max={2.0} step={0.05}
          value={v?.highlightFontScale ?? 1.0} displayValue={`${v?.highlightFontScale ?? 1.0}x`}
          onChange={(val) => sv('highlightFontScale', val)} />
        <div className="form-group">
          <label>Căn Lề (Align)</label>
          <div className="align-selector">
            {['left', 'center', 'right'].map((a) => (
              <button key={a} className={`align-btn${(v?.lyricAlign ?? 'center') === a ? ' active' : ''}`}
                onClick={() => sv('lyricAlign', a)}>
                <i className={`fa-solid fa-align-${a}`}></i> {a === 'left' ? 'Trái' : a === 'center' ? 'Giữa' : 'Phải'}
              </button>
            ))}
          </div>
        </div>
        <SliderRow id="slider-lyric-x" label="Vị trí X (%)" min={0} max={100} step={0.1}
          value={v?.lyricX ?? 50} displayValue={`${v?.lyricX ?? 50}%`}
          onChange={(val) => sv('lyricX', val)} />
        <SliderRow id="slider-lyric-y" label="Vị trí Y (%)" min={0} max={100} step={0.1}
          value={v?.lyricY ?? 75} displayValue={`${v?.lyricY ?? 75}%`}
          onChange={(val) => sv('lyricY', val)} />
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="input-lines-above">Số dòng trên</label>
            <input type="number" id="input-lines-above" min={0} max={5}
              value={v?.linesAbove ?? 0} onChange={(e) => sv('linesAbove', parseInt(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label htmlFor="input-lines-below">Số dòng dưới</label>
            <input type="text" id="input-lines-below" placeholder="auto hoặc số"
              value={v?.linesBelow ?? 'auto'}
              onChange={(e) => {
                const val = e.target.value.trim();
                sv('linesBelow', val === 'auto' ? 'auto' : (parseInt(val) || 0));
              }} />
          </div>
        </div>
      </div>
    </>
  );
}
