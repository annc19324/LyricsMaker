import { create } from 'zustand';

export const DEFAULT_SETTINGS = {
  songTitle: 'Tên bài hát',
  songArtist: 'Tên ca sĩ/rapper',
  songChannel: '@annc19324',
  rawLyrics: `[Intro - Lofi Synth Melody]

Chào mừng bạn đến với Lyrics Maker

Nơi thiết kế video karaoke chuyên nghiệp

Tự động đồng bộ và lưu thông số thiết lập

Hỗ trợ nhiều tỷ lệ khung hình 16:9, 9:16, 1:1

Thêm hiệu ứng sương mù và đĩa nhạc trôi nổi

Thử ngay nút xuất video trực tiếp cực kì tiện lợi

[Outro - Âm nhạc nhỏ dần]`,
  audioStart: 0,
  audioEnd: 'auto',
  fadeIn: 1,
  fadeOut: 2,
  volume: 80,
  timings: [0, 6.0, 12.0, 18.0, 24.0, 30.0, 36.0, 42.0],
  activeRatio: '16:9',
  markKeys: ['Enter', 'Space'],
  previewZoom: 100,
  visuals: {
    '16:9': {
      bgBlur: 0, lineSpacing: 1.5, karaokeEnabled: true, transitionEnabled: true,
      transitionSpeed: 0.1, bgOverlayOpacity: 0, mainShape: 'circle', mainSize: 220,
      mainX: 30, mainY: 50, lyricFontFamily: 'Montserrat', lyricFontSize: 28,
      lyricAlign: 'center', lyricX: 70, lyricY: 50, linesAbove: 0, linesBelow: 'auto',
      floatEnabled: true, floatSpeed: 1.0, fogIntensity: 30, colorLyricBase: '#ffffff',
      colorLyricActive: '#ff2e93', karaokeSpeed: 1.0, lyricZoom: 1.1,
      lyricBoldEnabled: true, lyricGlow: 10, colorLyricGlow: '#ff2e93',
      frameOpacity: 25, frameWidth: 500, frameHeight: 180, colorFrameBg: '#000000',
      mainBorderEnabled: true, mainFullEnabled: false, spinEnabled: true, spinSpeed: 1.0,
      fogSpeed: 0.5, watermarkEnabled: false, watermarkFloatEnabled: false,
      watermarkText: '@annc19324', watermarkX: 50, watermarkY: 50, watermarkFontSize: 18,
      watermarkOpacity: 60, watermarkColor: '#ffffff', watermarkItalic: false,
      watermarkBold: false, watermarkRotate: -15, watermarkLetterSpacing: 2,
      songInfoX: 50, songInfoY: 8, songInfoFontSize: 20, songInfoAlign: 'center',
    },
    '9:16': {
      bgBlur: 0, lineSpacing: 1.5, karaokeEnabled: true, transitionEnabled: true,
      transitionSpeed: 0.1, bgOverlayOpacity: 0, mainShape: 'circle', mainSize: 200,
      mainX: 50, mainY: 30, lyricFontFamily: 'Montserrat', lyricFontSize: 24,
      lyricAlign: 'center', lyricX: 50, lyricY: 70, linesAbove: 0, linesBelow: 'auto',
      floatEnabled: true, floatSpeed: 1.2, fogIntensity: 40, colorLyricBase: '#ffffff',
      colorLyricActive: '#00f0ff', karaokeSpeed: 1.0, lyricZoom: 1.15,
      lyricBoldEnabled: true, lyricGlow: 12, colorLyricGlow: '#00f0ff',
      frameOpacity: 0, frameWidth: 600, frameHeight: 140, colorFrameBg: '#000000',
      mainBorderEnabled: true, mainFullEnabled: false, spinEnabled: true, spinSpeed: 1.0,
      fogSpeed: 0.5, watermarkEnabled: false, watermarkFloatEnabled: false,
      watermarkText: '@annc19324', watermarkX: 50, watermarkY: 50, watermarkFontSize: 18,
      watermarkOpacity: 60, watermarkColor: '#ffffff', watermarkItalic: false,
      watermarkBold: false, watermarkRotate: -15, watermarkLetterSpacing: 2,
      songInfoX: 50, songInfoY: 8, songInfoFontSize: 20, songInfoAlign: 'center',
    },
    '1:1': {
      bgBlur: 0, lineSpacing: 1.5, karaokeEnabled: true, transitionEnabled: true,
      transitionSpeed: 0.1, bgOverlayOpacity: 0, mainShape: 'circle', mainSize: 180,
      mainX: 50, mainY: 35, lyricFontFamily: 'Montserrat', lyricFontSize: 26,
      lyricAlign: 'center', lyricX: 50, lyricY: 75, linesAbove: 0, linesBelow: 'auto',
      floatEnabled: true, floatSpeed: 1.0, fogIntensity: 25, colorLyricBase: '#ffffff',
      colorLyricActive: '#10b981', karaokeSpeed: 1.0, lyricZoom: 1.1,
      lyricBoldEnabled: true, lyricGlow: 8, colorLyricGlow: '#10b981',
      frameOpacity: 15, frameWidth: 550, frameHeight: 150, colorFrameBg: '#000000',
      mainBorderEnabled: true, mainFullEnabled: false, spinEnabled: true, spinSpeed: 1.0,
      fogSpeed: 0.5, watermarkEnabled: false, watermarkFloatEnabled: false,
      watermarkText: '@annc19324', watermarkX: 50, watermarkY: 50, watermarkFontSize: 18,
      watermarkOpacity: 60, watermarkColor: '#ffffff', watermarkItalic: false,
      watermarkBold: false, watermarkRotate: -15, watermarkLetterSpacing: 2,
      songInfoX: 50, songInfoY: 8, songInfoFontSize: 20, songInfoAlign: 'center',
    },
  },
  highlightRules: [{ pattern: '[', close: ']', color: '#f59e0b' }],
  activeLeftTab: 'tab-media',
  activeRightTab: 'tab-lyrics-input',
  previewOffset: 0,      // in milliseconds
  exportOffset: 0,       // in milliseconds
};

// ── localStorage helpers ──────────────────────────────────────────────────────
function loadPersistedState() {
  try {
    const globalRaw = localStorage.getItem('lyricsmaker_global');
    const global = globalRaw ? JSON.parse(globalRaw) : {};
    const visuals = { ...DEFAULT_SETTINGS.visuals };
    ['16:9', '9:16', '1:1'].forEach((ratio) => {
      const key = `lyricsmaker_visuals_${ratio.replace(':', '_')}`;
      const raw = localStorage.getItem(key);
      if (raw) visuals[ratio] = JSON.parse(raw);
    });
    return { ...DEFAULT_SETTINGS, ...global, visuals };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function persistGlobal(state) {
  const { visuals, ...rest } = state; // eslint-disable-line no-unused-vars
  const keys = [
    'songTitle','songArtist','songChannel','rawLyrics','audioStart','audioEnd',
    'fadeIn','fadeOut','volume','activeRatio','previewZoom','timings',
    'highlightRules','markKeys','activeLeftTab','activeRightTab',
    'previewOffset', 'exportOffset',
  ];
  const payload = {};
  keys.forEach((k) => { payload[k] = rest[k]; });
  localStorage.setItem('lyricsmaker_global', JSON.stringify(payload));
}

function persistVisuals(ratio, visuals) {
  localStorage.setItem(`lyricsmaker_visuals_${ratio.replace(':', '_')}`, JSON.stringify(visuals));
}

// ── Store ─────────────────────────────────────────────────────────────────────
const useAppStore = create((set, get) => ({
  // ---- state ----
  ...loadPersistedState(),
  lyrics: [],            // [{ text, time }]
  syncCursorIndex: 0,
  timeFormatMMSS: true,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  debugMode: false,      // canvas debug overlay

  // ---- actions ----
  set(partial) {
    set(partial);
    const next = { ...get(), ...partial };
    persistGlobal(next);
  },

  setVisual(key, value) {
    const ratio = get().activeRatio;
    const visuals = {
      ...get().visuals,
      [ratio]: { ...get().visuals[ratio], [key]: value },
    };
    set({ visuals });
    persistVisuals(ratio, visuals[ratio]);
  },

  setVisuals(partial) {
    const ratio = get().activeRatio;
    const updated = { ...get().visuals[ratio], ...partial };
    const visuals = { ...get().visuals, [ratio]: updated };
    set({ visuals });
    persistVisuals(ratio, updated);
  },

  setActiveRatio(ratio) {
    set({ activeRatio: ratio });
    persistGlobal({ ...get(), activeRatio: ratio });
  },

  updateLyrics(lyrics) {
    set({ lyrics });
  },

  setSyncCursor(index) {
    set({ syncCursorIndex: index });
  },

  updateTimingAt(index, time) {
    const lyrics = [...get().lyrics];
    lyrics[index] = { ...lyrics[index], time };
    set({ lyrics });
    persistGlobal({ ...get(), timings: lyrics.map((l) => l.time) });
  },

  setHighlightRules(rules) {
    set({ highlightRules: rules });
    persistGlobal({ ...get(), highlightRules: rules });
  },

  setMarkKeys(keys) {
    set({ markKeys: keys });
    persistGlobal({ ...get(), markKeys: keys });
  },

  resetToDefaults() {
    localStorage.clear();
    set({ ...JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), lyrics: [], syncCursorIndex: 0 });
  },

  getActiveVisuals() {
    return get().visuals[get().activeRatio];
  },
}));

export default useAppStore;
