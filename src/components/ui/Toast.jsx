/**
 * components/ui/Toast.jsx
 * Toast notification system.
 */
import { useState, useCallback, useEffect, useRef } from 'react';

let _showToast = null;

export function showToast(message, type = 'info', duration = 3000) {
  if (_showToast) _showToast(message, type, duration);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const add = useCallback((message, type, duration) => {
    const id = ++counterRef.current;
    setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 350);
    }, duration);
  }, []);

  useEffect(() => { _showToast = add; return () => { _showToast = null; }; }, [add]);

  const icons = { success: 'fa-circle-check', info: 'fa-circle-info', warning: 'fa-triangle-exclamation', error: 'fa-circle-xmark' };

  return (
    <div id="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}${t.exiting ? ' toast-exit' : ''}`}>
          <i className={`toast-icon fa-solid ${icons[t.type] || icons.info}`}></i>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
