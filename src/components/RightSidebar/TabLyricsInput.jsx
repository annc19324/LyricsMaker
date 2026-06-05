/**
 * components/RightSidebar/TabLyricsInput.jsx
 * Raw lyrics textarea + auto-sync parse.
 */
import { useEffect } from 'react';
import useAppStore from '../../store/useAppStore';
import { buildLyricsFromRaw, findFirstUnsyncedIndex } from '../../lib/lyricsParser';

export default function TabLyricsInput() {
  const rawLyrics = useAppStore((s) => s.rawLyrics);
  const timings = useAppStore((s) => s.timings);
  const lyrics = useAppStore((s) => s.lyrics);
  const set = useAppStore((s) => s.set);
  const updateLyrics = useAppStore((s) => s.updateLyrics);
  const setSyncCursor = useAppStore((s) => s.setSyncCursor);

  // Auto-parse on rawLyrics change so it syncs immediately without clicking a button
  useEffect(() => {
    const newLyrics = buildLyricsFromRaw(rawLyrics, timings, lyrics);
    updateLyrics(newLyrics);
    setSyncCursor(findFirstUnsyncedIndex(newLyrics));
  }, [rawLyrics]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="tab-panel active" id="tab-lyrics-input">
      <div className="panel-section flex-column-expand">
        <div className="section-header-row">
          <h3><i className="fa-solid fa-align-left"></i> Nhập Lời Bài Hát</h3>
          <span className="helper-badge" title="Các dòng cách nhau 1 dòng trống. Các dòng liền kề được coi là cùng 1 đoạn hiển thị.">
            <i className="fa-solid fa-circle-question"></i> Hướng dẫn
          </span>
        </div>
        <p className="lyrics-rule-desc">
          * Mỗi câu hiển thị cách nhau bằng <strong>1 dòng trống</strong>. Các dòng xuống hàng nhưng không có dòng trống sẽ gộp chung vào một câu (dùng ngắt dòng).
        </p>
        <textarea
          id="textarea-lyrics-raw"
          placeholder={`Nhập lời bài hát vào đây...\n\nVí dụ:\nChào mừng bạn đến với Lyrics Maker\n\nNơi biên tập lyrics dễ dàng\nVà chuyên nghiệp nhất`}
          value={rawLyrics}
          onChange={(e) => set({ rawLyrics: e.target.value })}
        />
      </div>
    </div>
  );
}
