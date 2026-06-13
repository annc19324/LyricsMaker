/**
 * components/LeftSidebar/TabMedia.jsx
 * Song info + audio + background + main media upload.
 */
import { useState, useEffect } from 'react';
import useAppStore from '../../store/useAppStore';
import FileUploadZone from '../ui/FileUploadZone';
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
