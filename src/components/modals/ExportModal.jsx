/**
 * components/modals/ExportModal.jsx
 * Export progress and success modal.
 */
export default function ExportModal({
  show, isDone, phase, desc, progress, statusText, downloadUrl,
  onCancel, onClose,
}) {
  if (!show) return null;

  return (
    <div className="modal-overlay" id="modal-export">
      <div className="modal-card">
        <div className="modal-header">
          <h2><i className="fa-solid fa-file-video text-accent"></i> Xuất Video Hoàn Tất</h2>
          <button className="modal-close" id="btn-close-export" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="modal-body">
          {!isDone ? (
            <div className="export-progress-container" id="export-running-view">
              <div className="spinner-spinner">
                <i className="fa-solid fa-spinner fa-spin-pulse"></i>
              </div>
              <h3 id="export-phase-title">{phase}</h3>
              <p id="export-phase-desc">{desc}</p>
              <div className="export-progress-bar">
                <div className="export-progress-fill" id="export-progress-fill"
                  style={{ width: `${progress}%` }}>{progress}%</div>
              </div>
              <span className="export-progress-status" id="export-status-text">{statusText}</span>
              <button id="btn-cancel-export" className="btn btn-secondary mt-3" onClick={onCancel}>Hủy bỏ</button>
            </div>
          ) : (
            <div className="export-result-container" id="export-success-view">
              <i className="fa-solid fa-circle-check success-icon"></i>
              <h3>Xuất MP4 thành công! 🎉</h3>
              <p>Video MP4 của bạn đã sẵn sàng. Tương thích với TikTok, YouTube, Instagram và mọi thiết bị.</p>
              <div className="export-actions-row">
                <a href={downloadUrl} id="download-video-link" className="btn btn-primary btn-glow"
                  download="lyrics-maker-output.mp4">
                  <i className="fa-solid fa-download"></i> Tải Video (.mp4)
                </a>
                <button id="btn-close-success" className="btn btn-secondary" onClick={onClose}>Đóng</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
