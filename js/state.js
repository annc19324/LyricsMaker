/* --- STATE MANAGEMENT MODULE --- */

export const DEFAULT_SETTINGS = {
  songTitle: "Bài Ca Hy Vọng",
  songArtist: "Antigravity Synth",
  songChannel: "Google DeepMind Studio",
  rawLyrics: `[Intro - Lofi Synth Melody]

Chào mừng bạn đến với Lyrics Maker

Nơi thiết kế video karaoke chuyên nghiệp

Tự động đồng bộ và lưu thông số thiết lập

Hỗ trợ nhiều tỷ lệ khung hình 16:9, 9:16, 1:1

Thêm hiệu ứng sương mù và đĩa nhạc trôi nổi

Thử ngay nút xuất video trực tiếp cực kì tiện lợi

[Outro - Âm nhạc nhỏ dần]`,
  audioStart: 0,
  audioEnd: "auto",
  fadeIn: 1,
  fadeOut: 2,
  volume: 80,
  timings: [0, 6.0, 12.0, 18.0, 24.0, 30.0, 36.0, 42.0],
  activeRatio: "16:9",
  previewZoom: 100, // Zoom percentage of preview box (50% to 500%)
  visuals: {
    "16:9": {
      bgBlur: 0,           // Default to 0 as requested
      bgOverlayOpacity: 0, // Default to 0 as requested
      mainShape: "circle",
      mainSize: 220,
      mainX: 30,
      mainY: 50,
      lyricFontFamily: "Montserrat",
      lyricFontSize: 28,
      lyricAlign: "center",
      lyricX: 70,
      lyricY: 50,
      linesAbove: 1,
      linesBelow: 1,
      floatEnabled: true,
      floatSpeed: 1.0,
      fogIntensity: 30,
      colorLyricBase: "#ffffff",
      colorLyricActive: "#ff2e93",
      karaokeSpeed: 1.0,
      lyricZoom: 1.1,
      lyricGlow: 10,
      colorLyricGlow: "#ff2e93",
      frameOpacity: 25,
      frameWidth: 500,
      frameHeight: 180,
      colorFrameBg: "#000000"
    },
    "9:16": {
      bgBlur: 0,           // Default to 0 as requested
      bgOverlayOpacity: 0, // Default to 0 as requested
      mainShape: "circle",
      mainSize: 200,
      mainX: 50,
      mainY: 30,
      lyricFontFamily: "Montserrat",
      lyricFontSize: 24,
      lyricAlign: "center",
      lyricX: 50,
      lyricY: 70,
      linesAbove: 0,
      linesBelow: 1,
      floatEnabled: true,
      floatSpeed: 1.2,
      fogIntensity: 40,
      colorLyricBase: "#ffffff",
      colorLyricActive: "#00f0ff",
      karaokeSpeed: 1.0,
      lyricZoom: 1.15,
      lyricGlow: 12,
      colorLyricGlow: "#00f0ff",
      frameOpacity: 0,
      frameWidth: 600,
      frameHeight: 140,
      colorFrameBg: "#000000"
    },
    "1:1": {
      bgBlur: 0,           // Default to 0 as requested
      bgOverlayOpacity: 0, // Default to 0 as requested
      mainShape: "circle",
      mainSize: 180,
      mainX: 50,
      mainY: 35,
      lyricFontFamily: "Montserrat",
      lyricFontSize: 26,
      lyricAlign: "center",
      lyricX: 50,
      lyricY: 75,
      linesAbove: 1,
      linesBelow: 1,
      floatEnabled: true,
      floatSpeed: 1.0,
      fogIntensity: 25,
      colorLyricBase: "#ffffff",
      colorLyricActive: "#10b981",
      karaokeSpeed: 1.0,
      lyricZoom: 1.1,
      lyricGlow: 8,
      colorLyricGlow: "#10b981",
      frameOpacity: 15,
      frameWidth: 550,
      frameHeight: 150,
      colorFrameBg: "#000000"
    }
  }
};

export let state = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
export let lyrics = [];
export let syncCursorIndex = 0;
export let timeFormatMMSS = true;

export function setSyncCursorIndex(val) {
  syncCursorIndex = val;
}

export function setTimeFormatMMSS(val) {
  timeFormatMMSS = val;
}

export function updateLyricsArray(newLyrics) {
  lyrics = newLyrics;
}

export function loadSavedState() {
  const globalData = localStorage.getItem("lyricsmaker_global");
  if (globalData) {
    try {
      const parsedGlobal = JSON.parse(globalData);
      state.songTitle = parsedGlobal.songTitle ?? DEFAULT_SETTINGS.songTitle;
      state.songArtist = parsedGlobal.songArtist ?? DEFAULT_SETTINGS.songArtist;
      state.songChannel = parsedGlobal.songChannel ?? DEFAULT_SETTINGS.songChannel;
      state.rawLyrics = parsedGlobal.rawLyrics ?? DEFAULT_SETTINGS.rawLyrics;
      state.audioStart = parsedGlobal.audioStart ?? DEFAULT_SETTINGS.audioStart;
      state.audioEnd = parsedGlobal.audioEnd ?? DEFAULT_SETTINGS.audioEnd;
      state.fadeIn = parsedGlobal.fadeIn ?? DEFAULT_SETTINGS.fadeIn;
      state.fadeOut = parsedGlobal.fadeOut ?? DEFAULT_SETTINGS.fadeOut;
      state.volume = parsedGlobal.volume ?? DEFAULT_SETTINGS.volume;
      state.activeRatio = parsedGlobal.activeRatio ?? DEFAULT_SETTINGS.activeRatio;
      state.previewZoom = parsedGlobal.previewZoom ?? DEFAULT_SETTINGS.previewZoom;
      
      if (parsedGlobal.timings) {
        state.timings = parsedGlobal.timings;
      }
    } catch (e) {
      console.error("Error loading global state: ", e);
    }
  }

  ["16:9", "9:16", "1:1"].forEach(ratio => {
    const visualData = localStorage.getItem(`lyricsmaker_visuals_${ratio.replace(":", "_")}`);
    if (visualData) {
      try {
        state.visuals[ratio] = JSON.parse(visualData);
      } catch (e) {
        console.error(`Error loading visuals for ${ratio}: `, e);
      }
    }
  });
}

export function saveCurrentState(activeRatio, lyricsList, uiValues) {
  // Sync core state values
  state.songTitle = uiValues.songTitle;
  state.songArtist = uiValues.songArtist;
  state.songChannel = uiValues.songChannel;
  state.rawLyrics = uiValues.rawLyrics;
  state.audioStart = uiValues.audioStart;
  state.audioEnd = uiValues.audioEnd;
  state.fadeIn = uiValues.fadeIn;
  state.fadeOut = uiValues.fadeOut;
  state.volume = uiValues.volume;
  state.activeRatio = activeRatio;
  state.previewZoom = uiValues.previewZoom;
  state.timings = lyricsList.map(line => line.time);
  
  // Save global
  localStorage.setItem("lyricsmaker_global", JSON.stringify({
    songTitle: state.songTitle,
    songArtist: state.songArtist,
    songChannel: state.songChannel,
    rawLyrics: state.rawLyrics,
    audioStart: state.audioStart,
    audioEnd: state.audioEnd,
    fadeIn: state.fadeIn,
    fadeOut: state.fadeOut,
    volume: state.volume,
    activeRatio: state.activeRatio,
    previewZoom: state.previewZoom,
    timings: state.timings
  }));

  // Save current visuals
  if (uiValues.visuals) {
    state.visuals[activeRatio] = uiValues.visuals;
    localStorage.setItem(`lyricsmaker_visuals_${activeRatio.replace(":", "_")}`, JSON.stringify(uiValues.visuals));
  }
}

export function resetAllState() {
  localStorage.clear();
  state = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}
