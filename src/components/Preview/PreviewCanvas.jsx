/**
 * components/Preview/PreviewCanvas.jsx
 * The canvas element inside the aspect-ratio box.
 */
export default function PreviewCanvas({ canvasRef }) {
  return (
    <div className="preview-container">
      <div className="aspect-ratio-box" id="aspect-ratio-box">
        <canvas ref={canvasRef} id="preview-canvas"></canvas>
        <div className="safe-area-overlay hidden">
          <div className="safe-box"></div>
        </div>
        <div className="preview-loader hidden" id="preview-loader">
          <i className="fa-solid fa-circle-notch fa-spin"></i>
          <p>Đang chuẩn bị...</p>
        </div>
      </div>
    </div>
  );
}
