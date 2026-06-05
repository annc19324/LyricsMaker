/**
 * components/LeftSidebar/index.jsx
 * Left sidebar with tabbed navigation.
 */
import { useState, useEffect } from 'react';
import useAppStore from '../../store/useAppStore';
import TabMedia from './TabMedia';
import TabLayout from './TabLayout';
import TabEffects from './TabEffects';

const TABS = [
  { id: 'tab-media', icon: 'fa-photo-film', label: 'Tệp & Nền' },
  { id: 'tab-layout', icon: 'fa-sliders', label: 'Bố Cục' },
  { id: 'tab-effects', icon: 'fa-wand-magic-sparkles', label: 'Hiệu Ứng' },
];

export default function LeftSidebar({ mediaRefs, loadAudioFile }) {
  const savedTab = useAppStore((s) => s.activeLeftTab);
  const set = useAppStore((s) => s.set);
  const [activeTab, setActiveTab] = useState(savedTab || 'tab-media');

  const switchTab = (id) => {
    setActiveTab(id);
    set({ activeLeftTab: id });
  };

  return (
    <aside className="workspace-sidebar" id="sidebar-left">
      <div className="sidebar-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
            onClick={() => switchTab(t.id)}>
            <i className={`fa-solid ${t.icon}`}></i> {t.label}
          </button>
        ))}
      </div>
      <div className="sidebar-content">
        {activeTab === 'tab-media' && (
          <div className="tab-panel active" id="tab-media">
            <TabMedia mediaRefs={mediaRefs} loadAudioFile={loadAudioFile} />
          </div>
        )}
        {activeTab === 'tab-layout' && (
          <div className="tab-panel active" id="tab-layout">
            <TabLayout />
          </div>
        )}
        {activeTab === 'tab-effects' && (
          <div className="tab-panel active" id="tab-effects">
            <TabEffects />
          </div>
        )}
      </div>
    </aside>
  );
}
