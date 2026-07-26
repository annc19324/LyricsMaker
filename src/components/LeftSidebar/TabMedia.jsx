/**
 * components/LeftSidebar/TabMedia.jsx
 * Song info + audio + background + main media upload.
 */
import { useState, useEffect } from 'react';
import useAppStore from '../../store/useAppStore';
import FileUploadZone from '../ui/FileUploadZone';
import SliderRow from '../ui/SliderRow';
import ToggleRow from '../ui/ToggleRow';
import { saveFileToIDB, loadFileFromIDB, removeFileFromIDB } from '../../lib/idb';

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
  const [pipImageInfo, setPipImageInfo] = useState('Chưa có ảnh PIP');

  const v = useAppStore((s) => s.visuals[s.activeRatio]);
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

        const pipImg = await loadFileFromIDB('pip_image');
        if (pipImg) setPipImageInfo(pipImg.name);
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
