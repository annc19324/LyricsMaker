import { useState, useEffect } from 'react';
import useAppStore from '../../store/useAppStore';
import FileUploadZone from '../ui/FileUploadZone';
import SliderRow from '../ui/SliderRow';
import ToggleRow from '../ui/ToggleRow';
import { saveFileToIDB, loadFileFromIDB, removeFileFromIDB } from '../../lib/idb';

export default function TabPip({ mediaRefs }) {
  const v = useAppStore((s) => s.visuals[s.activeRatio]);
  const setVisual = useAppStore((s) => s.setVisual);
  const sv = (key, val) => setVisual(key, val);

  const [pipImageInfo, setPipImageInfo] = useState('Chưa có ảnh PIP');

  useEffect(() => {
    const restoreLabels = async () => {
      try {
        const pipImg = await loadFileFromIDB('pip_image');
        if (pipImg) setPipImageInfo(pipImg.name);
      } catch (e) {
        console.warn('TabPip label restore failed:', e);
      }
    };
    restoreLabels();
  }, []);

  const handlePipImage = (file) => {
    setPipImageInfo(file.name);
    const url = URL.createObjectURL(file);
    if (mediaRefs && mediaRefs.pipImage) {
      mediaRefs.pipImage.current.src = url;
    }
    saveFileToIDB('pip_image', file).catch(() => {});
    sv('pipEnabled', true);
  };

  const handleClearPip = () => {
    setPipImageInfo('Chưa có ảnh PIP');
    if (mediaRefs && mediaRefs.pipImage) {
      mediaRefs.pipImage.current.src = '';
    }
    removeFileFromIDB('pip_image').catch(() => {});
    sv('pipEnabled', false);
  };

  return (
    <>
      <div className="panel-section">
        <h3><i className="fa-solid fa-clone"></i> Ảnh Thu Nhỏ (PIP)</h3>
        
        <FileUploadZone id="upload-pip-image-zone" accept="image/*" icon="fa-image"
          label="Chọn Ảnh PIP" fileInfo={pipImageInfo} onFile={handlePipImage} />
          
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleClearPip}>
            <i className="fa-solid fa-trash"></i> Xóa ảnh
          </button>
        </div>

        <div style={{ marginTop: '15px' }}>
          <ToggleRow id="toggle-pip" label="Bật hiển thị PIP"
            checked={v?.pipEnabled === true} onChange={(c) => sv('pipEnabled', c)} />
        </div>

        {v?.pipEnabled && (
          <>
            <div className="form-grid">
              <SliderRow id="slider-pip-x" label="Vị trí X" min={0} max={100} step={0.1}
                value={v?.pipX ?? 80} displayValue={`${v?.pipX ?? 80}%`}
                onChange={(val) => sv('pipX', val)} />
              <SliderRow id="slider-pip-y" label="Vị trí Y" min={0} max={100} step={0.1}
                value={v?.pipY ?? 80} displayValue={`${v?.pipY ?? 80}%`}
                onChange={(val) => sv('pipY', val)} />
            </div>

            <SliderRow id="slider-pip-size" label="Kích thước" min={20} max={800} step={5}
              value={v?.pipSize ?? 200} displayValue={`${v?.pipSize ?? 200}px`}
              onChange={(val) => sv('pipSize', val)} />

            <div className="form-group">
              <label>Hình dáng (Cắt ảnh)</label>
              <select 
                value={v?.pipShape || 'rectangle'}
                onChange={(e) => sv('pipShape', e.target.value)}
              >
                <option value="rectangle">Chữ nhật (Mặc định)</option>
                <option value="square">Hình vuông 1:1</option>
                <option value="circle">Hình tròn</option>
              </select>
            </div>

            {v?.pipShape !== 'circle' && (
              <SliderRow id="slider-pip-radius" label="Độ bo góc" min={0} max={100}
                value={v?.pipBorderRadius ?? 12} displayValue={`${v?.pipBorderRadius ?? 12}px`}
                onChange={(val) => sv('pipBorderRadius', val)} />
            )}

            <h4 style={{marginTop: '15px', color: 'var(--color-primary)', fontSize: '13px'}}>Thời gian hiển thị</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Bắt đầu (s)</label>
                <input type="number" step="0.5" value={v?.pipStartTime ?? 0}
                  onChange={(e) => sv('pipStartTime', parseFloat(e.target.value) || 0)} />
              </div>
              <div className="form-group">
                <label>Kết thúc (s) - 0 là luôn hiện</label>
                <input type="number" step="0.5" value={v?.pipEndTime ?? 0}
                  onChange={(e) => sv('pipEndTime', parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            <div className="form-grid">
              <SliderRow id="slider-pip-fadein" label="Hiện dần (s)" min={0} max={5} step={0.1}
                value={v?.pipFadeIn ?? 0.5} displayValue={`${v?.pipFadeIn ?? 0.5}s`}
                onChange={(val) => sv('pipFadeIn', val)} />
              <SliderRow id="slider-pip-fadeout" label="Mờ dần (s)" min={0} max={5} step={0.1}
                value={v?.pipFadeOut ?? 0.5} displayValue={`${v?.pipFadeOut ?? 0.5}s`}
                onChange={(val) => sv('pipFadeOut', val)} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
