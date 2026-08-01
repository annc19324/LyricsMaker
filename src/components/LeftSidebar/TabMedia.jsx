/**
 * components/LeftSidebar/TabMedia.jsx
 * Song info + audio + background + main media upload.
 */
import { useState, useEffect } from 'react';
import useAppStore from '../../store/useAppStore';
import FileUploadZone from '../ui/FileUploadZone';
import SliderRow from '../ui/SliderRow';
import ToggleRow from '../ui/ToggleRow';
import { saveFileToIDB, loadFileFromIDB, removeFileFromIDB, getAllKeysFromIDB } from '../../lib/idb';

export default function TabMedia({ mediaRefs, loadAudioFile }) {
  const songTitle = useAppStore((s) => s.songTitle);
  const songArtist = useAppStore((s) => s.songArtist);
  const songChannel = useAppStore((s) => s.songChannel);
  const audioStart = useAppStore((s) => s.audioStart);
  const audioEnd = useAppStore((s) => s.audioEnd);
  const fadeIn = useAppStore((s) => s.fadeIn);
  const fadeOut = useAppStore((s) => s.fadeOut);
  const previewOffset = useAppStore((s) => s.previewOffset);
  const exportOffset = useAppStore((s) => s.exportOffset);
  const set = useAppStore((s) => s.set);

  const [bgType, setBgType] = useState('image');
  const [mainType, setMainType] = useState('image');
  const [audioInfo, setAudioInfo] = useState('Đang dùng nhạc demo mặc định');
  const [bgImageInfo, setBgImageInfo] = useState('Mặc định: Gradient tối');
  const [bgVideoInfo, setBgVideoInfo] = useState('Chưa có video nền');
  const [mainImageInfo, setMainImageInfo] = useState('Mặc định: Đĩa Vinyl');
  const [mainVideoInfo, setMainVideoInfo] = useState('Chưa có video chính');
  const [pipNames, setPipNames] = useState({});

  const v = useAppStore((s) => s.visuals[s.activeRatio]);
  const pips = useAppStore((s) => s.pips);
  const addPip = useAppStore((s) => s.addPip);
  const updatePip = useAppStore((s) => s.updatePip);
  const removePip = useAppStore((s) => s.removePip);
  const setVisual = useAppStore((s) => s.setVisual);
  const sv = (key, val) => setVisual(key, val);

  // Load actual file names from IndexedDB on mount to keep labels accurate
  useEffect(() => {
    const restoreLabels = async () => {
      try {
        const audioFile = await loadFileFromIDB('audio');
        if (audioFile) setAudioInfo(audioFile.name);

        const bgImg = await loadFileFromIDB('bg_image');
        if (bgImg) setBgImageInfo(bgImg.name);

        const bgVid = await loadFileFromIDB('bg_video');
        if (bgVid) {
          setBgVideoInfo(bgVid.name);
          setBgType('video');
        }

        const mainImg = await loadFileFromIDB('main_image');
        if (mainImg) setMainImageInfo(mainImg.name);

        const mainVid = await loadFileFromIDB('main_video');
        if (mainVid) {
          setMainVideoInfo(mainVid.name);
          setMainType('video');
        }

        const keys = await getAllKeysFromIDB();
        const pipKeys = keys.filter(k => k.startsWith('pip_image_'));
        const newPipNames = {};
        for (const k of pipKeys) {
          const pipImg = await loadFileFromIDB(k);
          if (pipImg) {
            newPipNames[k.replace('pip_image_', '')] = pipImg.name;
          }
        }
        setPipNames(newPipNames);
      } catch (e) {
        console.warn('TabMedia label restore failed:', e);
      }
    };
    restoreLabels();
  }, []);

  const handleAudio = (file) => {
    setAudioInfo(file.name);
    loadAudioFile(file);
    saveFileToIDB('audio', file).catch(() => {});
  };

  const handleBgImage = (file) => {
    setBgImageInfo(file.name);
    const url = URL.createObjectURL(file);
    mediaRefs.bgImage.current.src = url;
    mediaRefs.bgMediaType.current = 'image';
    saveFileToIDB('bg_image', file).catch(() => {});
  };

  const handleBgVideo = (file) => {
    setBgVideoInfo(file.name);
    const url = URL.createObjectURL(file);
    mediaRefs.bgVideo.current.src = url;
    mediaRefs.bgVideo.current.load();
    mediaRefs.bgVideo.current.play().catch(() => {});
    mediaRefs.bgMediaType.current = 'video';
    saveFileToIDB('bg_video', file).catch(() => {});

    // If no manual custom audio is selected, use the background video's audio & timeline
    const isDefaultOrVid = audioInfo === 'Đang dùng nhạc demo mặc định' || audioInfo.startsWith('Nhạc từ video') || audioInfo === bgVideoInfo || audioInfo === mainVideoInfo;
    if (isDefaultOrVid) {
      setAudioInfo(`Nhạc từ video nền: ${file.name}`);
      loadAudioFile(file);
      saveFileToIDB('audio', file).catch(() => {});
    }
  };

  const handleMainImage = (file) => {
    setMainImageInfo(file.name);
    const url = URL.createObjectURL(file);
    mediaRefs.mainImage.current.src = url;
    mediaRefs.mainMediaType.current = 'image';
    saveFileToIDB('main_image', file).catch(() => {});
  };

  const handleMainVideo = (file) => {
    setMainVideoInfo(file.name);
    const url = URL.createObjectURL(file);
    mediaRefs.mainVideo.current.src = url;
    mediaRefs.mainVideo.current.load();
    mediaRefs.mainVideo.current.play().catch(() => {});
    mediaRefs.mainMediaType.current = 'video';
    saveFileToIDB('main_video', file).catch(() => {});

    // If no manual custom audio is selected, use the main video's audio & timeline
    const isDefaultOrVid = audioInfo === 'Đang dùng nhạc demo mặc định' || audioInfo.startsWith('Nhạc từ video') || audioInfo === bgVideoInfo || audioInfo === mainVideoInfo;
    if (isDefaultOrVid) {
      setAudioInfo(`Nhạc từ video chính: ${file.name}`);
      loadAudioFile(file);
      saveFileToIDB('audio', file).catch(() => {});
    }
  };

  const handleClearAudio = () => {
    setAudioInfo('Không dùng nhạc (Im lặng)');
    loadAudioFile(null, 'none');
    removeFileFromIDB('audio').catch(() => {});
  };

  const handleResetAudio = () => {
    setAudioInfo('Đang dùng nhạc demo mặc định');
    loadAudioFile(null, 'default');
    removeFileFromIDB('audio').catch(() => {});
  };

  const handleClearBg = () => {
    setBgImageInfo('Không dùng ảnh/video nền');
    setBgVideoInfo('Không dùng ảnh/video nền');
    mediaRefs.bgImage.current.src = '';
    mediaRefs.bgVideo.current.pause();
    mediaRefs.bgVideo.current.removeAttribute('src');
    mediaRefs.bgVideo.current.load();
    mediaRefs.bgMediaType.current = 'none';
    setBgType('image');
    removeFileFromIDB('bg_image').catch(() => {});
    removeFileFromIDB('bg_video').catch(() => {});
  };

  const handleResetBg = () => {
    setBgImageInfo('Mặc định: Gradient tối');
    setBgVideoInfo('Chưa có video nền');
    mediaRefs.bgImage.current.src = '';
    mediaRefs.bgVideo.current.pause();
    mediaRefs.bgVideo.current.removeAttribute('src');
    mediaRefs.bgVideo.current.load();
    mediaRefs.bgMediaType.current = 'default';
    setBgType('image');
    removeFileFromIDB('bg_image').catch(() => {});
    removeFileFromIDB('bg_video').catch(() => {});
  };

  const handleClearMain = () => {
    setMainImageInfo('Không dùng ảnh/video chính');
    setMainVideoInfo('Không dùng ảnh/video chính');
    mediaRefs.mainImage.current.src = '';
    mediaRefs.mainVideo.current.pause();
    mediaRefs.mainVideo.current.removeAttribute('src');
    mediaRefs.mainVideo.current.load();
    mediaRefs.mainMediaType.current = 'none';
    setMainType('image');
    removeFileFromIDB('main_image').catch(() => {});
    removeFileFromIDB('main_video').catch(() => {});
  };

  const handleResetMain = () => {
    setMainImageInfo('Mặc định: Đĩa Vinyl');
    setMainVideoInfo('Chưa có video chính');
    mediaRefs.mainImage.current.src = '';
    mediaRefs.mainVideo.current.pause();
    mediaRefs.mainVideo.current.removeAttribute('src');
    mediaRefs.mainVideo.current.load();
    mediaRefs.mainMediaType.current = 'default';
    setMainType('image');
    removeFileFromIDB('main_image').catch(() => {});
    removeFileFromIDB('main_video').catch(() => {});
  };

  const handlePipImage = (file, pipId) => {
    setPipNames((prev) => ({ ...prev, [pipId]: file.name }));
    const url = URL.createObjectURL(file);
    if (mediaRefs && mediaRefs.pipImages) {
      if (!mediaRefs.pipImages.current[`pip_image_${pipId}`]) {
        mediaRefs.pipImages.current[`pip_image_${pipId}`] = new Image();
      }
      mediaRefs.pipImages.current[`pip_image_${pipId}`].src = url;
    }
    saveFileToIDB(`pip_image_${pipId}`, file).catch(() => {});
    updatePip(pipId, { enabled: true });
  };

  const handleRemovePip = (pipId) => {
    removePip(pipId);
    removeFileFromIDB(`pip_image_${pipId}`).catch(() => {});
    setPipNames((prev) => { const n = { ...prev }; delete n[pipId]; return n; });
    if (mediaRefs && mediaRefs.pipImages) {
      delete mediaRefs.pipImages.current[`pip_image_${pipId}`];
    }
  };

  const handleAddPip = () => {
    const id = Date.now().toString();
    addPip({
      id, enabled: false, x: 50, y: 50, size: 200, shape: 'rectangle',
      borderRadius: 12, startTime: 0, endTime: 0, fadeIn: 0.5, fadeOut: 0.5
    });
  };

  return (
    <>
      {/* Song Information */}
      <div className="panel-section">
        <h3><i className="fa-solid fa-info-circle"></i> Thông Tin Bài Hát</h3>
        <div className="form-group">
          <label htmlFor="input-song-title">Tên Bài Hát</label>
          <input type="text" id="input-song-title" placeholder="Nhập tên bài hát..."
            value={songTitle} onChange={(e) => set({ songTitle: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor="input-song-artist">Ca sĩ / Rapper</label>
          <input type="text" id="input-song-artist" placeholder="Nhập tên ca sĩ/rapper..."
            value={songArtist} onChange={(e) => set({ songArtist: e.target.value })} />
        </div>
        <div className="form-group">
          <label htmlFor="input-song-channel">Tên Kênh</label>
          <input type="text" id="input-song-channel" placeholder="Nhập tên kênh YouTube/TikTok..."
            value={songChannel} onChange={(e) => set({ songChannel: e.target.value })} />
        </div>
      </div>

      {/* Audio Upload */}
      <div className="panel-section">
        <h3><i className="fa-solid fa-file-audio"></i> Nhạc Nền (Sound)</h3>
        <FileUploadZone id="upload-audio-zone" accept="audio/*,video/*" icon="fa-cloud-arrow-up"
          label="Kéo thả hoặc click để chọn File Nhạc/Video" fileInfo={audioInfo} onFile={handleAudio} />
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleClearAudio}>
            <i className="fa-solid fa-trash"></i> Xóa
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleResetAudio}>
            <i className="fa-solid fa-rotate-left"></i> Mặc định
          </button>
        </div>
        <div className="form-grid mt-3">
          <div className="form-group">
            <label htmlFor="input-audio-start">Bắt đầu (s)</label>
            <input type="text" id="input-audio-start" value={audioStart} placeholder="0"
              onChange={(e) => set({ audioStart: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="input-audio-end">Kết thúc (s)</label>
            <input type="text" id="input-audio-end" value={audioEnd} placeholder="Tự động (hết nhạc)"
              onChange={(e) => set({ audioEnd: e.target.value })} />
          </div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="input-fade-in">Fade In (s)</label>
            <input type="number" id="input-fade-in" min="0" max="10" step="0.5" value={fadeIn}
              onChange={(e) => set({ fadeIn: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="form-group">
            <label htmlFor="input-fade-out">Fade Out (s)</label>
            <input type="number" id="input-fade-out" min="0" max="10" step="0.5" value={fadeOut}
              onChange={(e) => set({ fadeOut: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
      </div>

      {/* Background Media */}
      <div className="panel-section">
        <h3><i className="fa-solid fa-image"></i> Ảnh / Video Nền (Background)</h3>
        <div className="media-type-selector">
          <button className={`toggle-media-type${bgType === 'image' ? ' active' : ''}`}
            onClick={() => { setBgType('image'); mediaRefs.bgMediaType.current = 'image'; }}>Ảnh</button>
          <button className={`toggle-media-type${bgType === 'video' ? ' active' : ''}`}
            onClick={() => { setBgType('video'); mediaRefs.bgMediaType.current = 'video'; }}>Video</button>
        </div>
        {bgType === 'image' ? (
          <FileUploadZone id="upload-bg-image-zone" accept="image/*" icon="fa-image"
            label="Chọn Ảnh Nền" fileInfo={bgImageInfo} onFile={handleBgImage} />
        ) : (
          <FileUploadZone id="upload-bg-video-zone" accept="video/*" icon="fa-video"
            label="Chọn Video Nền" fileInfo={bgVideoInfo} onFile={handleBgVideo} />
        )}
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleClearBg}>
            <i className="fa-solid fa-trash"></i> Xóa nền
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleResetBg}>
            <i className="fa-solid fa-rotate-left"></i> Mặc định
          </button>
        </div>
      </div>

      {/* Main Media */}
      <div className="panel-section">
        <h3><i className="fa-solid fa-compact-disc"></i> Ảnh / Video Chính (Main Media)</h3>
        <div className="media-type-selector">
          <button className={`toggle-media-type${mainType === 'image' ? ' active' : ''}`}
            onClick={() => { setMainType('image'); mediaRefs.mainMediaType.current = 'image'; }}>Ảnh</button>
          <button className={`toggle-media-type${mainType === 'video' ? ' active' : ''}`}
            onClick={() => { setMainType('video'); mediaRefs.mainMediaType.current = 'video'; }}>Video</button>
        </div>
        {mainType === 'image' ? (
          <FileUploadZone id="upload-main-image-zone" accept="image/*" icon="fa-image"
            label="Chọn Ảnh Chính" fileInfo={mainImageInfo} onFile={handleMainImage} />
        ) : (
          <FileUploadZone id="upload-main-video-zone" accept="video/*" icon="fa-video"
            label="Chọn Video Chính" fileInfo={mainVideoInfo} onFile={handleMainVideo} />
        )}
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleClearMain}>
            <i className="fa-solid fa-trash"></i> Xóa ảnh/video chính
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleResetMain}>
            <i className="fa-solid fa-rotate-left"></i> Mặc định
          </button>
        </div>
      </div>

      {/* PIP Media */}
      <div className="panel-section">
        <h3>
          <i className="fa-solid fa-clone"></i> Ảnh Thu Nhỏ (PIP)
          <button className="btn btn-primary btn-small" style={{ float: 'right', padding: '2px 8px', fontSize: '12px' }} onClick={handleAddPip}>
            <i className="fa-solid fa-plus"></i> Thêm PIP
          </button>
        </h3>
        
        {pips.map((pip, index) => (
          <div key={pip.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', marginTop: '15px', position: 'relative' }}>
            <h4 style={{ margin: '0 0 10px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>PIP #{index + 1}</span>
              <button className="btn btn-small btn-secondary" style={{ color: '#ff4d4f' }} onClick={() => handleRemovePip(pip.id)}>
                <i className="fa-solid fa-trash"></i>
              </button>
            </h4>

            <FileUploadZone id={`upload-pip-${pip.id}`} accept="image/*" icon="fa-image"
              label="Chọn Ảnh PIP" fileInfo={pipNames[pip.id] || 'Chưa có ảnh'} onFile={(file) => handlePipImage(file, pip.id)} />
            
            <div style={{ marginTop: '15px' }}>
              <ToggleRow id={`toggle-pip-${pip.id}`} label="Bật hiển thị PIP"
                checked={pip.enabled === true} onChange={(c) => updatePip(pip.id, { enabled: c })} />
            </div>

            {pip.enabled && (
              <>
                <div className="form-grid mt-2">
                  <SliderRow id={`slider-pip-x-${pip.id}`} label="Vị trí X" min={0} max={100} step={0.1}
                    value={pip.x ?? 80} displayValue={`${pip.x ?? 80}%`}
                    onChange={(val) => updatePip(pip.id, { x: val })} />
                  <SliderRow id={`slider-pip-y-${pip.id}`} label="Vị trí Y" min={0} max={100} step={0.1}
                    value={pip.y ?? 80} displayValue={`${pip.y ?? 80}%`}
                    onChange={(val) => updatePip(pip.id, { y: val })} />
                </div>

                <SliderRow id={`slider-pip-size-${pip.id}`} label="Kích thước" min={20} max={800} step={5}
                  value={pip.size ?? 200} displayValue={`${pip.size ?? 200}px`}
                  onChange={(val) => updatePip(pip.id, { size: val })} />

                <div className="form-group">
                  <label>Hình dáng (Cắt ảnh)</label>
                  <select 
                    value={pip.shape || 'rectangle'}
                    onChange={(e) => updatePip(pip.id, { shape: e.target.value })}
                  >
                    <option value="rectangle">Chữ nhật (Mặc định)</option>
                    <option value="square">Hình vuông 1:1</option>
                    <option value="circle">Hình tròn</option>
                  </select>
                </div>

                {pip.shape !== 'circle' && (
                  <SliderRow id={`slider-pip-radius-${pip.id}`} label="Độ bo góc" min={0} max={100}
                    value={pip.borderRadius ?? 12} displayValue={`${pip.borderRadius ?? 12}px`}
                    onChange={(val) => updatePip(pip.id, { borderRadius: val })} />
                )}

                <h4 style={{marginTop: '15px', color: 'var(--color-primary)', fontSize: '13px'}}>Thời gian hiển thị</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Bắt đầu (s)</label>
                    <input type="number" step="0.5" value={pip.startTime ?? 0}
                      onChange={(e) => updatePip(pip.id, { startTime: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group">
                    <label>Kết thúc (s) - 0 là luôn hiện</label>
                    <input type="number" step="0.5" value={pip.endTime ?? 0}
                      onChange={(e) => updatePip(pip.id, { endTime: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>

                <div className="form-grid">
                  <SliderRow id={`slider-pip-fadein-${pip.id}`} label="Hiện dần (s)" min={0} max={5} step={0.1}
                    value={pip.fadeIn ?? 0.5} displayValue={`${pip.fadeIn ?? 0.5}s`}
                    onChange={(val) => updatePip(pip.id, { fadeIn: val })} />
                  <SliderRow id={`slider-pip-fadeout-${pip.id}`} label="Mờ dần (s)" min={0} max={5} step={0.1}
                    value={pip.fadeOut ?? 0.5} displayValue={`${pip.fadeOut ?? 0.5}s`}
                    onChange={(val) => updatePip(pip.id, { fadeOut: val })} />
                </div>
              </>
            )}
          </div>
        ))}

        {pips.length === 0 && (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '15px' }}>
            Chưa có PIP nào. Bấm "Thêm PIP" để tạo.
          </p>
        )}
      </div>

      {/* Time Offset Controls */}
      <div className="panel-section">
        <h3><i className="fa-solid fa-clock-rotate-left"></i> Độ lệch thời gian (Offset)</h3>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="input-preview-offset">Bản xem web (ms)</label>
            <input type="number" id="input-preview-offset" step="50" value={previewOffset}
              onChange={(e) => set({ previewOffset: parseInt(e.target.value) || 0 })} />
            <small style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
              VD: +500 dịch chuyển chữ/hình lên sớm hơn 0.5s.
            </small>
          </div>
          <div className="form-group">
            <label htmlFor="input-export-offset">Video xuất ra (ms)</label>
            <input type="number" id="input-export-offset" step="50" value={exportOffset}
              onChange={(e) => set({ exportOffset: parseInt(e.target.value) || 0 })} />
            <small style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginTop: '4px' }}>
              Thường để bằng 0 trừ khi video xuất bị lệch tiếng.
            </small>
          </div>
        </div>
      </div>
    </>
  );
}
