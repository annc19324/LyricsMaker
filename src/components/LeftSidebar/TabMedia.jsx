/**
 * components/LeftSidebar/TabMedia.jsx
 * Song info + audio + background + main media upload.
 */
import { useState } from 'react';
import useAppStore from '../../store/useAppStore';
import FileUploadZone from '../ui/FileUploadZone';
import { saveFileToIDB } from '../../lib/idb';

export default function TabMedia({ mediaRefs, loadAudioFile }) {
  const songTitle = useAppStore((s) => s.songTitle);
  const songArtist = useAppStore((s) => s.songArtist);
  const songChannel = useAppStore((s) => s.songChannel);
  const audioStart = useAppStore((s) => s.audioStart);
  const audioEnd = useAppStore((s) => s.audioEnd);
  const fadeIn = useAppStore((s) => s.fadeIn);
  const fadeOut = useAppStore((s) => s.fadeOut);
  const set = useAppStore((s) => s.set);

  const [bgType, setBgType] = useState('image');
  const [mainType, setMainType] = useState('image');
  const [audioInfo, setAudioInfo] = useState('Đang dùng nhạc demo mặc định');
  const [bgImageInfo, setBgImageInfo] = useState('Mặc định: Gradient tối');
  const [bgVideoInfo, setBgVideoInfo] = useState('Chưa có video nền');
  const [mainImageInfo, setMainImageInfo] = useState('Mặc định: Đĩa Vinyl');
  const [mainVideoInfo, setMainVideoInfo] = useState('Chưa có video chính');

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
        <FileUploadZone id="upload-audio-zone" accept="audio/*" icon="fa-cloud-arrow-up"
          label="Kéo thả hoặc click để chọn File Nhạc" fileInfo={audioInfo} onFile={handleAudio} />
        <div className="form-grid mt-3">
          <div className="form-group">
            <label htmlFor="input-audio-start">Bắt đầu (s)</label>
            <input type="text" id="input-audio-start" value={audioStart}
              onChange={(e) => set({ audioStart: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="input-audio-end">Kết thúc (s)</label>
            <input type="text" id="input-audio-end" value={audioEnd}
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
      </div>
    </>
  );
}
