/**
 * components/ui/FileUploadZone.jsx
 * Drag-and-drop / click file upload zone.
 */
import { useRef } from 'react';

export default function FileUploadZone({ id, accept, icon, label, fileInfo, onFile, isActive = true }) {
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      className={`file-upload-zone${isActive ? ' active' : ''}`}
      id={id}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); }}
      onDrop={handleDrop}
    >
      <i className={`fa-solid ${icon}`}></i>
      <p>{label}</p>
      <span className="file-info">{fileInfo}</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="file-input-hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
    </div>
  );
}
