/**
 * components/RightSidebar/index.jsx
 * Right sidebar with Lyrics Input and Timing Editor tabs.
 */
import { useState } from 'react';
import useAppStore from '../../store/useAppStore';
import TabLyricsInput from './TabLyricsInput';
import TabTimingEditor from './TabTimingEditor';

const TABS = [
  { id: 'tab-lyrics-input', icon: 'fa-edit', label: 'Nhập Lyrics' },
  { id: 'tab-timing-editor', icon: 'fa-clock', label: 'Thời Gian' },
];

export default function RightSidebar({ audioRef, initAudioContext }) {
  const savedTab = useAppStore((s) => s.activeRightTab);
  const set = useAppStore((s) => s.set);
  const [activeTab, setActiveTab] = useState(savedTab || 'tab-lyrics-input');

  const switchTab = (id) => {
    setActiveTab(id);
    set({ activeRightTab: id });
  };

  return (
    <aside className="workspace-sidebar" id="sidebar-right">
      <div className="sidebar-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
            onClick={() => switchTab(t.id)}>
            <i className={`fa-solid ${t.icon}`}></i> {t.label}
          </button>
        ))}
      </div>
      <div className="sidebar-content">
        {activeTab === 'tab-lyrics-input' && <TabLyricsInput />}
        {activeTab === 'tab-timing-editor' && (
          <TabTimingEditor audioRef={audioRef} initAudioContext={initAudioContext} />
        )}
      </div>
    </aside>
  );
}
