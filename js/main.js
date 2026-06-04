/* --- APP INITIALIZATION & EVENT BINDINGS MODULE (MAIN Entry point) --- */

import { 
  state, lyrics, syncCursorIndex, timeFormatMMSS,
  loadSavedState, saveCurrentState, resetAllState,
  setSyncCursorIndex, setTimeFormatMMSS, updateLyricsArray
} from "./state.js";

import {
  audioPlayer, audioFileLoaded, defaultAudioUrl,
  audioCtx, speakerGainNode, audioDestination,
  initAudioContext, updateGainAndFades, generateDreamySynth, setAudioFileLoaded
} from "./audio.js";

import {
  canvas, ctx, bgImage, mainImage, bgVideo, mainVideo,
  bgMediaType, mainMediaType, setBgMediaType, setMainMediaType,
  initCanvasModule, updateCanvasSize, startRenderLoop, updateHighlightRules
} from "./canvas.js";

// --- Global UI references ---
const textareaLyricsRaw = document.getElementById("textarea-lyrics-raw");
const timingsListContainer = document.getElementById("timings-list-container");

const inputSongTitle = document.getElementById("input-song-title");
const inputSongArtist = document.getElementById("input-song-artist");
const inputSongChannel = document.getElementById("input-song-channel");

const inputAudioStart = document.getElementById("input-audio-start");
const inputAudioEnd = document.getElementById("input-audio-end");
const inputFadeIn = document.getElementById("input-fade-in");
const inputFadeOut = document.getElementById("input-fade-out");

const inputBgImage = document.getElementById("input-bg-image");
const inputBgVideo = document.getElementById("input-bg-video");
const inputMainImage = document.getElementById("input-main-image");
const inputMainVideo = document.getElementById("input-main-video");

const sliderBgBlur = document.getElementById("slider-bg-blur");
const sliderBgOverlay = document.getElementById("slider-bg-overlay");
const sliderMainSize = document.getElementById("slider-main-size");
const sliderMainX = document.getElementById("slider-main-x");
const sliderMainY = document.getElementById("slider-main-y");

const selectFontFamily = document.getElementById("select-font-family");
const sliderLyricSize = document.getElementById("slider-lyric-size");
const sliderLyricX = document.getElementById("slider-lyric-x");
const sliderLyricY = document.getElementById("slider-lyric-y");
const inputLinesAbove = document.getElementById("input-lines-above");
const inputLinesBelow = document.getElementById("input-lines-below");

const toggleFloat = document.getElementById("toggle-float");
const sliderFloatSpeed = document.getElementById("slider-float-speed");
const sliderFogIntensity = document.getElementById("slider-fog-intensity");

const colorLyricBase = document.getElementById("color-lyric-base");
const colorLyricActive = document.getElementById("color-lyric-active");
const sliderKaraokeSpeed = document.getElementById("slider-karaoke-speed");
const sliderLyricZoom = document.getElementById("slider-lyric-zoom");
const sliderLyricGlow = document.getElementById("slider-lyric-glow");
const colorLyricGlow = document.getElementById("color-lyric-glow");

const sliderFrameOpacity = document.getElementById("slider-frame-opacity");
const sliderFrameWidth = document.getElementById("slider-frame-width");
const sliderFrameHeight = document.getElementById("slider-frame-height");
const colorFrameBg = document.getElementById("color-frame-bg");

const btnResetDefaults = document.getElementById("btn-reset-defaults");
const btnExportVideo = document.getElementById("btn-export-video");
const btnMarkTiming = document.getElementById("btn-mark-timing");
const btnPlayPause = document.getElementById("btn-play-pause");
const btnSkipBackward = document.getElementById("btn-skip-backward");
const btnSkipForward = document.getElementById("btn-skip-forward");
const sliderPlaybackProgress = document.getElementById("slider-playback-progress");
const progressBarFill = document.getElementById("progress-bar-fill");
const sliderVolume = document.getElementById("slider-volume");
const volumeIcon = document.getElementById("volume-icon");

const timeCurrent = document.getElementById("time-current");
const timeTotal = document.getElementById("time-total");

const btnParseLyrics = document.getElementById("btn-parse-lyrics");
const btnToggleTimeFormat = document.getElementById("btn-toggle-time-format");

const modalExport = document.getElementById("modal-export");
const btnCloseExport = document.getElementById("btn-close-export");
const btnCloseSuccess = document.getElementById("btn-close-success");
const btnCancelExport = document.getElementById("btn-cancel-export");
const exportRunningView = document.getElementById("export-running-view");
const exportSuccessView = document.getElementById("export-success-view");
const exportProgressFill = document.getElementById("export-progress-fill");
const exportStatusText = document.getElementById("export-status-text");
const downloadVideoLink = document.getElementById("download-video-link");

const ratioButtons = document.querySelectorAll(".ratio-btn");
const toggleMediaBtns = document.querySelectorAll(".toggle-media-type");

// Preview Zoom references
const sliderPreviewZoom = document.getElementById("slider-preview-zoom");
const valPreviewZoom = document.getElementById("val-preview-zoom");

// Timings Action Button references
const btnSortTimings = document.getElementById("btn-sort-timings");
const btnClearTimings = document.getElementById("btn-clear-timings");

// New feature references (added)
const toggleMainBorder  = () => document.getElementById("toggle-main-border");
const toggleMainSpin    = () => document.getElementById("toggle-main-spin");
const toggleMainFull    = () => document.getElementById("toggle-main-full");
const sliderSpinSpeed   = () => document.getElementById("slider-spin-speed");
const sliderFogSpeed    = () => document.getElementById("slider-fog-speed");
const toggleWatermark   = () => document.getElementById("toggle-watermark");
const inputWatermarkText= () => document.getElementById("input-watermark-text");
const sliderWmX         = () => document.getElementById("slider-wm-x");
const sliderWmY         = () => document.getElementById("slider-wm-y");
const sliderWmSize      = () => document.getElementById("slider-wm-size");
const sliderWmOpacity   = () => document.getElementById("slider-wm-opacity");
const colorWm           = () => document.getElementById("color-wm");
const toggleWmItalic    = () => document.getElementById("toggle-wm-italic");
const toggleWmBold      = () => document.getElementById("toggle-wm-bold");
const sliderWmRotate    = () => document.getElementById("slider-wm-rotate");
const sliderWmSpacing   = () => document.getElementById("slider-wm-spacing");
// Song info layout
const sliderSiX         = () => document.getElementById("slider-si-x");
const sliderSiY         = () => document.getElementById("slider-si-y");
const sliderSiSize      = () => document.getElementById("slider-si-size");
// Highlight rules container
const highlightRulesContainer = () => document.getElementById("highlight-rules-container");

let isProgressBarDragging = false;
let isExporting = false;
let mediaRecorder = null;
let exportBlobs = [];

// --- Functions ---


function parseTimeToSeconds(val) {
  if (val === "auto" || val === "" || val === undefined || val === null) return "auto";
  const str = String(val).trim();
  if (str.toLowerCase() === "auto") return "auto";
  if (str.includes(":")) {
    const parts = str.split(":");
    if (parts.length === 2) {
      const mins = parseFloat(parts[0]) || 0;
      const secs = parseFloat(parts[1]) || 0;
      return mins * 60 + secs;
    }
  }
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

function syncLyricsFromRawText() {
  const blocks = parseLyricsText(textareaLyricsRaw.value);
  const newLyrics = [];
  
  blocks.forEach((block, idx) => {
    let t = null;
    if (state.timings && state.timings[idx] !== undefined) {
      t = state.timings[idx];
    } else if (lyrics[idx]) {
      t = lyrics[idx].time;
    }
    
    newLyrics.push({ text: block, time: t });
  });
  
  updateLyricsArray(newLyrics);
  
  // Update sync cursor
  let foundCursor = false;
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].time === null || lyrics[i].time === undefined) {
      setSyncCursorIndex(i);
      foundCursor = true;
      break;
    }
  }
  if (!foundCursor) {
    setSyncCursorIndex(lyrics.length - 1 < 0 ? 0 : lyrics.length - 1);
  }
  
  renderTimingsList();
}

function parseLyricsText(text) {
  if (!text) return [];
  const blocks = text.split(/\n\s*\n+/);
  return blocks.map(b => b.trim()).filter(Boolean);
}

function syncTimingsListToRawText() {
  const rawText = lyrics.map(line => line.text).join("\n\n");
  textareaLyricsRaw.value = rawText;
  saveState();
}

function renderTimingsList() {
  timingsListContainer.innerHTML = "";
  
  if (lyrics.length === 0) {
    timingsListContainer.innerHTML = `
      <div class="empty-timings-state">
        <i class="fa-solid fa-hourglass-empty"></i>
        <p>Chưa có dữ liệu lyrics. Nhấn tab <strong>Nhập Lyrics</strong> để bắt đầu.</p>
      </div>`;
    return;
  }
  
  lyrics.forEach((line, idx) => {
    const item = document.createElement("div");
    item.className = `timing-row-new ${idx === syncCursorIndex ? 'active' : ''}`;
    item.setAttribute("data-index", idx);
    
    let displayTime = "0";
    if (line.time !== null && line.time !== undefined) {
      displayTime = line.time === 0 ? "0" : line.time.toFixed(5);
    }
    
    item.innerHTML = `
      <span class="timing-row-index">${idx + 1}</span>
      <span class="timing-row-text" title="Click để chọn làm câu hát hiện tại">${line.text}</span>
      <input type="text" class="timing-row-input" value="${displayTime}">
    `;
    
    // Click on text to set active sync cursor (active line)
    const textSpan = item.querySelector(".timing-row-text");
    textSpan.addEventListener("click", () => {
      setSyncCursorIndex(idx);
      renderTimingsList();
      
      // Also jump audio player to this time if set
      if (line.time !== null && line.time > 0) {
        initAudioContext();
        audioPlayer.currentTime = line.time;
      }
    });
    
    // Change timestamp value
    const timeInput = item.querySelector(".timing-row-input");
    timeInput.addEventListener("change", (e) => {
      const val = e.target.value.trim().replace(",", "."); // Support commas
      if (val === "" || isNaN(parseFloat(val))) {
        lyrics[idx].time = 0;
      } else {
        lyrics[idx].time = parseFloat(val);
      }
      syncTimingsListToRawText();
      renderTimingsList();
    });
    
    timingsListContainer.appendChild(item);
  });
}

function parseTimeStr(str) {
  if (!str) return 0;
  str = str.toString().trim();
  if (str.includes(":")) {
    const parts = str.split(":");
    const m = parseFloat(parts[0]) || 0;
    const s = parseFloat(parts[1]) || 0;
    return m * 60 + s;
  }
  return parseFloat(str) || 0;
}

function formatTime(seconds, showCentiseconds = false) {
  if (seconds === null || isNaN(seconds) || seconds === undefined) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (showCentiseconds) {
    const c = Math.floor((seconds % 1) * 100);
    return `${m}:${s.toString().padStart(2, "0")}.${c.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// --- Toast Notification ---
const toastIcons = {
  success: 'fa-circle-check',
  info: 'fa-circle-info',
  warning: 'fa-triangle-exclamation',
  error: 'fa-circle-xmark'
};

function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="toast-icon fa-solid ${toastIcons[type] || toastIcons.info}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// State Synchronization
function saveState() {
  const uiValues = {
    songTitle: inputSongTitle.value,
    songArtist: inputSongArtist.value,
    songChannel: inputSongChannel.value,
    rawLyrics: textareaLyricsRaw.value,
    audioStart: parseTimeStr(inputAudioStart.value),
    audioEnd: inputAudioEnd.value.trim() === "auto" ? "auto" : parseTimeStr(inputAudioEnd.value),
    fadeIn: parseFloat(inputFadeIn.value) || 0,
    fadeOut: parseFloat(inputFadeOut.value) || 0,
    volume: parseInt(sliderVolume.value) || 80,
    previewZoom: parseInt(sliderPreviewZoom.value) || 100,
    visuals: {
      bgBlur: parseInt(sliderBgBlur.value),
      bgOverlayOpacity: parseInt(sliderBgOverlay.value),
      mainShape: document.getElementById("btn-shape-circle").classList.contains("active") ? "circle" : "rect",
      mainSize: parseInt(sliderMainSize.value),
      mainX: parseInt(sliderMainX.value),
      mainY: parseInt(sliderMainY.value),
      lyricFontFamily: selectFontFamily.value,
      lyricFontSize: parseInt(sliderLyricSize.value),
      lyricAlign: document.querySelector(".align-btn.active")?.getAttribute("data-align") || "center",
      lyricX: parseInt(sliderLyricX.value),
      lyricY: parseInt(sliderLyricY.value),
      linesAbove: parseInt(inputLinesAbove.value) || 0,
      linesBelow: inputLinesBelow.value.trim() === "auto" ? "auto" : (parseInt(inputLinesBelow.value) || 0),
      floatEnabled: toggleFloat.checked,
      floatSpeed: parseFloat(sliderFloatSpeed.value) || 1,
      fogIntensity: parseInt(sliderFogIntensity.value) || 0,
      colorLyricBase: colorLyricBase.value,
      colorLyricActive: colorLyricActive.value,
      karaokeSpeed: parseFloat(sliderKaraokeSpeed.value) || 1.0,
      lyricZoom: parseFloat(sliderLyricZoom.value) || 1.1,
      lyricGlow: parseInt(sliderLyricGlow.value) || 0,
      colorLyricGlow: colorLyricGlow.value,
      frameOpacity: parseInt(sliderFrameOpacity.value) || 0,
      frameWidth: parseInt(sliderFrameWidth.value) || 600,
      frameHeight: parseInt(sliderFrameHeight.value) || 150,
      colorFrameBg: colorFrameBg.value,
      mainBorderEnabled: toggleMainBorder()?.checked ?? true,
      spinEnabled:       toggleMainSpin()?.checked ?? true,
      spinSpeed:         parseFloat(sliderSpinSpeed()?.value) || 1.0,
      fogSpeed:          parseFloat(sliderFogSpeed()?.value) || 0.5,
      watermarkEnabled:  toggleWatermark()?.checked ?? false,
      watermarkText:     inputWatermarkText()?.value || "@annc19324",
      watermarkX:        parseInt(sliderWmX()?.value) || 50,
      watermarkY:        parseInt(sliderWmY()?.value) || 50,
      watermarkFontSize: parseInt(sliderWmSize()?.value) || 18,
      watermarkOpacity:  parseInt(sliderWmOpacity()?.value) || 60,
      watermarkColor:    colorWm()?.value || "#ffffff",
      watermarkItalic:   toggleWmItalic()?.checked ?? false,
      watermarkBold:     toggleWmBold()?.checked ?? false,
      watermarkRotate:   parseInt(sliderWmRotate()?.value) || 0,
      watermarkLetterSpacing: parseInt(sliderWmSpacing()?.value) || 0,
      songInfoX:         parseInt(sliderSiX()?.value) || 50,
      songInfoY:         parseInt(sliderSiY()?.value) || 8,
      songInfoFontSize:  parseInt(sliderSiSize()?.value) || 20,
      songInfoAlign:     document.querySelector(".si-align-btn.active")?.getAttribute("data-align") || "center"
    },
    highlightRules: state.highlightRules
  };

  // Save active tabs
  const activeLeftTabEl  = document.querySelector("#sidebar-left .tab-btn.active");
  const activeRightTabEl = document.querySelector("#sidebar-right .tab-btn.active");
  const tabState = {
    activeLeftTab:  activeLeftTabEl?.getAttribute("data-tab")  || "tab-media",
    activeRightTab: activeRightTabEl?.getAttribute("data-tab") || "tab-lyrics-input"
  };

  saveCurrentState(state.activeRatio, lyrics, uiValues, tabState);
}

function applyStateToUI() {
  // Bind UI inputs from state
  inputSongTitle.value = state.songTitle;
  inputSongArtist.value = state.songArtist;
  inputSongChannel.value = state.songChannel;
  textareaLyricsRaw.value = state.rawLyrics;
  
  inputAudioStart.value = state.audioStart;
  inputAudioEnd.value = state.audioEnd;
  inputFadeIn.value = state.fadeIn;
  inputFadeOut.value = state.fadeOut;
  
  sliderVolume.value = state.volume;
  audioPlayer.volume = state.volume / 100;
  
  sliderPreviewZoom.value = state.previewZoom || 100;
  valPreviewZoom.innerText = `${state.previewZoom || 100}%`;
  
  // Set aspect ratio buttons styling
  ratioButtons.forEach(btn => {
    if (btn.getAttribute("data-ratio") === state.activeRatio) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
  
  // Apply visual controls for current active ratio
  const visuals = state.visuals[state.activeRatio];
  if (visuals) {
    sliderBgBlur.value = visuals.bgBlur;
    document.getElementById("val-bg-blur").innerText = `${visuals.bgBlur}px`;
    
    sliderBgOverlay.value = visuals.bgOverlayOpacity;
    document.getElementById("val-bg-overlay").innerText = `${visuals.bgOverlayOpacity}%`;
    
    if (visuals.mainShape === "circle") {
      document.getElementById("btn-shape-circle").classList.add("active");
      document.getElementById("btn-shape-rect").classList.remove("active");
    } else {
      document.getElementById("btn-shape-circle").classList.remove("active");
      document.getElementById("btn-shape-rect").classList.add("active");
    }
    
    sliderMainSize.value = visuals.mainSize;
    document.getElementById("val-main-size").innerText = `${visuals.mainSize}px`;
    
    sliderMainX.value = visuals.mainX;
    document.getElementById("val-main-x").innerText = `${visuals.mainX}%`;
    
    sliderMainY.value = visuals.mainY;
    document.getElementById("val-main-y").innerText = `${visuals.mainY}%`;
    
    selectFontFamily.value = visuals.lyricFontFamily;
    sliderLyricSize.value = visuals.lyricFontSize;
    document.getElementById("val-lyric-size").innerText = `${visuals.lyricFontSize}px`;
    
    document.querySelectorAll(".align-btn").forEach(btn => {
      if (btn.getAttribute("data-align") === visuals.lyricAlign) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
    
    sliderLyricX.value = visuals.lyricX;
    document.getElementById("val-lyric-x").innerText = `${visuals.lyricX}%`;
    
    sliderLyricY.value = visuals.lyricY;
    document.getElementById("val-lyric-y").innerText = `${visuals.lyricY}%`;
    
    inputLinesAbove.value = visuals.linesAbove;
    inputLinesBelow.value = visuals.linesBelow;
    
    toggleFloat.checked = visuals.floatEnabled;
    sliderFloatSpeed.value = visuals.floatSpeed;
    document.getElementById("val-float-speed").innerText = `${visuals.floatSpeed}x`;
    
    sliderFogIntensity.value = visuals.fogIntensity;
    document.getElementById("val-fog-intensity").innerText = `${visuals.fogIntensity}%`;
    
    colorLyricBase.value = visuals.colorLyricBase;
    colorLyricBase.parentElement.querySelector(".color-hex").innerText = visuals.colorLyricBase.toUpperCase();
    
    colorLyricActive.value = visuals.colorLyricActive;
    colorLyricActive.parentElement.querySelector(".color-hex").innerText = visuals.colorLyricActive.toUpperCase();
    
    sliderKaraokeSpeed.value = visuals.karaokeSpeed;
    document.getElementById("val-karaoke-speed").innerText = `${visuals.karaokeSpeed}x`;
    
    sliderLyricZoom.value = visuals.lyricZoom;
    document.getElementById("val-lyric-zoom").innerText = `${visuals.lyricZoom}x`;
    
    sliderLyricGlow.value = visuals.lyricGlow;
    document.getElementById("val-lyric-glow").innerText = `${visuals.lyricGlow}px`;
    
    colorLyricGlow.value = visuals.colorLyricGlow;
    colorLyricGlow.parentElement.querySelector(".color-hex").innerText = visuals.colorLyricGlow.toUpperCase();
    
    sliderFrameOpacity.value = visuals.frameOpacity;
    document.getElementById("val-frame-opacity").innerText = `${visuals.frameOpacity}%`;
    
    sliderFrameWidth.value = visuals.frameWidth;
    document.getElementById("val-frame-width").innerText = `${visuals.frameWidth}px`;
    
    sliderFrameHeight.value = visuals.frameHeight;
    document.getElementById("val-frame-height").innerText = `${visuals.frameHeight}px`;
    
    colorFrameBg.value = visuals.colorFrameBg;
    colorFrameBg.parentElement.querySelector(".color-hex").innerText = visuals.colorFrameBg.toUpperCase();
  }
  
  updateCanvasSize();

  // Apply new visual properties
  if (visuals) {
    if (toggleMainBorder())  toggleMainBorder().checked  = visuals.mainBorderEnabled !== false;
    if (toggleMainSpin())    toggleMainSpin().checked    = visuals.spinEnabled !== false;
    if (toggleMainFull())    toggleMainFull().checked    = visuals.mainFullEnabled || false;
    if (sliderSpinSpeed())   { sliderSpinSpeed().value   = visuals.spinSpeed || 1.0; const el = document.getElementById("val-spin-speed"); if(el) el.innerText = (visuals.spinSpeed||1.0)+"x"; }
    if (sliderFogSpeed())    { sliderFogSpeed().value    = visuals.fogSpeed || 0.5;  const el = document.getElementById("val-fog-speed");  if(el) el.innerText = (visuals.fogSpeed||0.5)+"x"; }
    if (toggleWatermark())   toggleWatermark().checked   = visuals.watermarkEnabled || false;
    if (inputWatermarkText()) inputWatermarkText().value = visuals.watermarkText || "@annc19324";
    if (sliderWmX())         { sliderWmX().value         = visuals.watermarkX || 50;        const el=document.getElementById("val-wm-x");       if(el) el.innerText=(visuals.watermarkX||50)+"%"; }
    if (sliderWmY())         { sliderWmY().value         = visuals.watermarkY || 50;        const el=document.getElementById("val-wm-y");       if(el) el.innerText=(visuals.watermarkY||50)+"%"; }
    if (sliderWmSize())      { sliderWmSize().value      = visuals.watermarkFontSize || 18; const el=document.getElementById("val-wm-size");    if(el) el.innerText=(visuals.watermarkFontSize||18)+"px"; }
    if (sliderWmOpacity())   { sliderWmOpacity().value   = visuals.watermarkOpacity || 60;  const el=document.getElementById("val-wm-opacity"); if(el) el.innerText=(visuals.watermarkOpacity||60)+"%"; }
    if (colorWm())           { colorWm().value           = visuals.watermarkColor || "#ffffff"; const el=colorWm().parentElement?.querySelector(".color-hex"); if(el) el.innerText=(visuals.watermarkColor||"#ffffff").toUpperCase(); }
    if (toggleWmItalic())    toggleWmItalic().checked    = visuals.watermarkItalic || false;
    if (toggleWmBold())      toggleWmBold().checked      = visuals.watermarkBold || false;
    if (sliderWmRotate())    { sliderWmRotate().value    = visuals.watermarkRotate || 0;    const el=document.getElementById("val-wm-rotate");  if(el) el.innerText=(visuals.watermarkRotate||0)+"°"; }
    if (sliderWmSpacing())   { sliderWmSpacing().value   = visuals.watermarkLetterSpacing||0; const el=document.getElementById("val-wm-spacing"); if(el) el.innerText=(visuals.watermarkLetterSpacing||0)+"px"; }
    if (sliderSiX())         { sliderSiX().value         = visuals.songInfoX || 50;         const el=document.getElementById("val-si-x");       if(el) el.innerText=(visuals.songInfoX||50)+"%"; }
    if (sliderSiY())         { sliderSiY().value         = visuals.songInfoY || 8;          const el=document.getElementById("val-si-y");       if(el) el.innerText=(visuals.songInfoY||8)+"%"; }
    if (sliderSiSize())      { sliderSiSize().value      = visuals.songInfoFontSize || 20;  const el=document.getElementById("val-si-size");    if(el) el.innerText=(visuals.songInfoFontSize||20)+"px"; }
    document.querySelectorAll(".si-align-btn").forEach(b => {
      if (b.getAttribute("data-align") === (visuals.songInfoAlign || "center")) b.classList.add("active");
      else b.classList.remove("active");
    });
  }

  // Restore active tabs
  if (state.activeLeftTab) {
    const leftBtn = document.querySelector(`#sidebar-left .tab-btn[data-tab="${state.activeLeftTab}"]`);
    if (leftBtn) leftBtn.click();
  }
  if (state.activeRightTab) {
    const rightBtn = document.querySelector(`#sidebar-right .tab-btn[data-tab="${state.activeRightTab}"]`);
    if (rightBtn) rightBtn.click();
  }

  // Sync highlight rules to canvas
  updateHighlightRules(state.highlightRules || []);
  renderHighlightRulesList();
}

function handlePlayPause() {
  initAudioContext();
  
  if (audioPlayer.paused) {
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    audioPlayer.play();
    btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
    btnPlayPause.classList.add("active");
    
    if (bgVideo && bgMediaType === "video") bgVideo.play();
    if (mainVideo && mainMediaType === "video") mainVideo.play();
  } else {
    audioPlayer.pause();
    btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
    btnPlayPause.classList.remove("active");
    
    if (bgVideo) bgVideo.pause();
    if (mainVideo) mainVideo.pause();
  }
}

function handleTimeUpdate() {
  if (isExporting) return; // Managed by export runner
  
  const cur = audioPlayer.currentTime;
  const dur = audioPlayer.duration || 60;
  
  const start = parseTimeToSeconds(state.audioStart) || 0;
  const end = state.audioEnd === "auto" ? dur : parseTimeToSeconds(state.audioEnd);
  
  if (cur < start) {
    audioPlayer.currentTime = start;
  }
  if (cur >= end) {
    audioPlayer.pause();
    audioPlayer.currentTime = start;
    btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
    btnPlayPause.classList.remove("active");
    if (bgVideo) bgVideo.pause();
    if (mainVideo) mainVideo.pause();
  }
  
  // Show time relative to trim range
  const trimDuration = end - start;
  const elapsed = Math.max(0, cur - start);
  timeCurrent.innerText = formatTime(elapsed);
  timeTotal.innerText = formatTime(trimDuration);
  
  if (!isProgressBarDragging) {
    const progress = trimDuration > 0 ? (elapsed / trimDuration) * 100 : 0;
    sliderPlaybackProgress.value = progress;
    progressBarFill.style.width = `${progress}%`;
  }

  // Highlight currently playing lyric in timing editor
  let activePlayingIdx = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].time !== null && lyrics[i].time !== undefined && cur >= lyrics[i].time) {
      activePlayingIdx = i;
    }
  }
  
  const rows = timingsListContainer.querySelectorAll(".timing-row-new");
  rows.forEach((row, idx) => {
    if (idx === activePlayingIdx) {
      if (!row.classList.contains("playing")) {
        row.classList.add("playing");
        row.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    } else {
      row.classList.remove("playing");
    }
  });
}

function markCurrentTiming() {
  initAudioContext();
  const curTime = audioPlayer.currentTime;
  
  if (lyrics.length === 0) return;
  
  lyrics[syncCursorIndex].time = curTime;
  
  if (syncCursorIndex < lyrics.length - 1) {
    setSyncCursorIndex(syncCursorIndex + 1);
    renderTimingsList();
    const nextItem = timingsListContainer.querySelector(`.timing-row-new[data-index="${syncCursorIndex}"]`);
    if (nextItem) nextItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } else {
    renderTimingsList();
  }
  
  syncTimingsListToRawText();
}

// File Upload Handler
function setupFileZone(zoneId, fileInputId, fileInfoId, mediaTypeKey) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(fileInputId);
  const info = document.getElementById(fileInfoId);
  
  zone.addEventListener("click", () => input.click());
  
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.style.borderColor = "var(--color-primary)";
    zone.style.backgroundColor = "rgba(99,102,241,0.06)";
  });
  
  zone.addEventListener("dragleave", () => {
    zone.style.borderColor = "var(--color-border)";
    zone.style.backgroundColor = "transparent";
  });
  
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.style.borderColor = "var(--color-border)";
    zone.style.backgroundColor = "transparent";
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      input.files = e.dataTransfer.files;
      handleFile(input.files[0]);
    }
  });
  
  input.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });
  
  function handleFile(file) {
    info.innerText = file.name;
    const url = URL.createObjectURL(file);
    
    if (mediaTypeKey === "audio") {
      setAudioFileLoaded(true);
      audioPlayer.src = url;
      audioPlayer.load();
      audioPlayer.currentTime = 0;
    } else if (mediaTypeKey === "bg_image") {
      bgImage.src = url;
    } else if (mediaTypeKey === "bg_video") {
      bgVideo.src = url;
      bgVideo.load();
      bgVideo.play().catch(e => console.log(e));
    } else if (mediaTypeKey === "main_image") {
      mainImage.src = url;
    } else if (mediaTypeKey === "main_video") {
      mainVideo.src = url;
      mainVideo.load();
      mainVideo.play().catch(e => console.log(e));
    }
    // Persist to IndexedDB
    saveFileToIDB(mediaTypeKey, file).catch(e => console.warn('IDB save failed:', e));
  }
}

// Media export WebM
function startVideoExport() {
  initAudioContext();
  
  if (lyrics.length === 0) {
    alert("Vui lòng nhập và phân tích lyrics trước!");
    return;
  }
  
  isExporting = true;
  exportBlobs = [];
  
  modalExport.classList.remove("hidden");
  exportRunningView.classList.remove("hidden");
  exportSuccessView.classList.add("hidden");

  // Reset phase UI
  const _phTitle = document.getElementById("export-phase-title");
  const _phDesc  = document.getElementById("export-phase-desc");
  if (_phTitle) _phTitle.innerText = "⏺ Đang ghi hình...";
  if (_phDesc)  _phDesc.innerText  = "Vui lòng giữ tab này mở. Đang ghi canvas và âm thanh theo thời gian thực.";

  audioPlayer.pause();
  btnPlayPause.innerHTML = '<i class="fa-solid fa-play"></i>';
  btnPlayPause.classList.remove("active");
  
  const trimStart = parseTimeToSeconds(state.audioStart) || 0;
  const trimEnd = state.audioEnd === "auto" ? (audioPlayer.duration || 60) : parseTimeToSeconds(state.audioEnd);
  const totalDuration = trimEnd - trimStart;
  
  audioPlayer.currentTime = trimStart;
  
  // Mute physical speakers
  if (speakerGainNode) {
    speakerGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  }
  
  const canvasStream = canvas.captureStream(30);
  const audioStream = audioDestination.stream;
  
  const combinedStream = new MediaStream();
  canvasStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
  audioStream.getAudioTracks().forEach(track => combinedStream.addTrack(track));
  
  let options = { mimeType: "video/webm;codecs=vp9,opus" };
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: "video/webm;codecs=vp8,opus" };
  }
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: "video/webm" };
  }
  
  try {
    mediaRecorder = new MediaRecorder(combinedStream, options);
  } catch (e) {
    console.error(e);
    alert("MediaRecorder not supported.");
    isExporting = false;
    modalExport.classList.add("hidden");
    return;
  }
  
  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) exportBlobs.push(event.data);
  };
  
  mediaRecorder.onstop = async () => {
    if (speakerGainNode) speakerGainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    const webmBlob = new Blob(exportBlobs, { type: "video/webm" });
    // Phase 2: Auto-convert WebM -> MP4 via ffmpeg.wasm
    await convertWebmToMp4(webmBlob);
    isExporting = false;
  };
  
  if (bgVideo && bgMediaType === "video") {
    bgVideo.currentTime = 0;
    bgVideo.play();
  }
  if (mainVideo && mainMediaType === "video") {
    mainVideo.currentTime = 0;
    mainVideo.play();
  }
  
  mediaRecorder.start(100);
  audioPlayer.play();
  
  audioPlayer.ontimeupdate = () => {
    if (!isExporting) {
      audioPlayer.ontimeupdate = handleTimeUpdate;
      handleTimeUpdate();
      return;
    }
    
    const curr = audioPlayer.currentTime;
    if (curr >= trimEnd || audioPlayer.ended) {
      audioPlayer.pause();
      mediaRecorder.stop();
      if (bgVideo) bgVideo.pause();
      if (mainVideo) mainVideo.pause();
      audioPlayer.ontimeupdate = handleTimeUpdate;
      return;
    }
    
    const elapsed = curr - trimStart;
    const progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
    exportProgressFill.style.width = `${progress.toFixed(1)}%`;
    exportProgressFill.innerText = `${Math.floor(progress)}%`;
    exportStatusText.innerText = `Đang ghi hình và âm thanh: ${elapsed.toFixed(1)}s / ${totalDuration.toFixed(1)}s`;
  };
}


async function convertWebmToMp4(webmBlob) {
  const phaseTitle = document.getElementById('export-phase-title');
  const phaseDesc  = document.getElementById('export-phase-desc');

  if (phaseTitle) phaseTitle.innerText = '\u23f3 \u0110ang chuy\u1ec3n \u0111\u1ed5i sang MP4...';
  if (phaseDesc)  phaseDesc.innerText  = 'Vui l\u00f2ng ch\u1edd. FFmpeg \u0111ang encode MP4 (H.264) ngay trong tr\u00ecnh duy\u1ec7t.';
  exportProgressFill.style.width = '0%';
  exportProgressFill.innerText   = '0%';
  exportStatusText.innerText     = '\u0110ang t\u1ea3i FFmpeg engine...';

  try {
    const FFmpegLib  = window.FFmpegWASM;
    const FFmpegUtil = window.FFmpegUtil;

    if (!FFmpegLib || !FFmpegUtil) {
      throw new Error('FFmpeg.wasm ch\u01b0a load xong. Vui l\u00f2ng th\u1eed l\u1ea1i sau v\u00e0i gi\u00e2y.');
    }

    const { FFmpeg }    = FFmpegLib;
    const { fetchFile } = FFmpegUtil;
    const ffmpeg = new FFmpeg();

    ffmpeg.on('log', ({ message }) => { console.log('[FFmpeg]', message); });

    ffmpeg.on('progress', ({ progress }) => {
      const pct = Math.round(progress * 100);
      exportProgressFill.style.width = pct + '%';
      exportProgressFill.innerText   = pct + '%';
      exportStatusText.innerText     = '\u2699\ufe0f \u0110ang encode MP4: ' + pct + '%';
    });

    exportStatusText.innerText = '\u0110ang load FFmpeg engine (l\u1ea7n \u0111\u1ea7u ~10-20s)...';

    await ffmpeg.load({
      coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
    });

    exportStatusText.innerText = 'FFmpeg s\u1eb5n s\u00e0ng, \u0111ang encode...';

    await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob));

    await ffmpeg.exec([
      '-i',        'input.webm',
      '-c:v',      'libx264',
      '-preset',   'fast',
      '-crf',      '23',
      '-c:a',      'aac',
      '-b:a',      '192k',
      '-movflags', '+faststart',
      'output.mp4'
    ]);

    const mp4Data = await ffmpeg.readFile('output.mp4');
    const mp4Blob = new Blob([mp4Data.buffer], { type: 'video/mp4' });
    const mp4Url  = URL.createObjectURL(mp4Blob);

    const safeName = (state.songTitle || 'lyrics-maker').toLowerCase().replace(/[^a-z0-9]/g, '-');
    downloadVideoLink.href      = mp4Url;
    downloadVideoLink.download  = safeName + '.mp4';
    downloadVideoLink.innerHTML = '<i class="fa-solid fa-download"></i> T\u1ea3i Video (.mp4)';

    await ffmpeg.deleteFile('input.webm');
    await ffmpeg.deleteFile('output.mp4');

    exportRunningView.classList.add('hidden');
    exportSuccessView.classList.remove('hidden');
    showToast('Xu\u1ea5t MP4 th\u00e0nh c\u00f4ng! \ud83c\udf89', 'success', 4000);

  } catch (err) {
    console.error('FFmpeg convert error:', err);

    if (phaseTitle) phaseTitle.innerText = '\u26a0\ufe0f Kh\u00f4ng th\u1ec3 convert sang MP4';
    if (phaseDesc)  phaseDesc.innerText  = 'L\u1ed7i: ' + err.message + '. B\u1ea1n c\u00f3 th\u1ec3 t\u1ea3i file WebM thay th\u1ebf.';

    const webmUrl  = URL.createObjectURL(webmBlob);
    const safeName = (state.songTitle || 'lyrics-maker').toLowerCase().replace(/[^a-z0-9]/g, '-');
    downloadVideoLink.href      = webmUrl;
    downloadVideoLink.download  = safeName + '.webm';
    downloadVideoLink.innerHTML = '<i class="fa-solid fa-download"></i> T\u1ea3i Video (.webm)';

    exportRunningView.classList.add('hidden');
    exportSuccessView.classList.remove('hidden');
    showToast('Kh\u00f4ng convert \u0111\u01b0\u1ee3c MP4, \u0111ang t\u1ea3i WebM thay th\u1ebf.', 'warning', 5000);
  }
}

function cancelVideoExport() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  audioPlayer.pause();
  if (speakerGainNode) speakerGainNode.gain.setValueAtTime(1, audioCtx.currentTime);
  audioPlayer.ontimeupdate = handleTimeUpdate;
  isExporting = false;
  modalExport.classList.add("hidden");
}

// --- DOM Initialization ---


// ── Highlight Rules Manager ────────────────────────────────────────────────
function renderHighlightRulesList() {
  const container = highlightRulesContainer();
  if (!container) return;
  container.innerHTML = "";
  const rules = state.highlightRules || [];
  rules.forEach((rule, idx) => {
    const row = document.createElement("div");
    row.className = "highlight-rule-row";
    row.innerHTML = `
      <input class="hl-pattern" type="text" value="${escHtml(rule.pattern)}" placeholder="[" style="width:40px">
      <input class="hl-close"   type="text" value="${escHtml(rule.close||'')}" placeholder="]" style="width:40px">
      <div class="color-picker-wrapper" style="flex:1">
        <input class="hl-color" type="color" value="${rule.color||'#f59e0b'}">
        <span class="color-hex">${(rule.color||'#f59e0b').toUpperCase()}</span>
      </div>
      <button class="btn btn-small hl-delete" data-idx="${idx}" title="Xóa"><i class="fa-solid fa-trash"></i></button>
    `;
    // Events
    row.querySelector(".hl-pattern").addEventListener("input", e => {
      state.highlightRules[idx].pattern = e.target.value;
      updateHighlightRules(state.highlightRules); saveState();
    });
    row.querySelector(".hl-close").addEventListener("input", e => {
      state.highlightRules[idx].close = e.target.value;
      updateHighlightRules(state.highlightRules); saveState();
    });
    row.querySelector(".hl-color").addEventListener("input", e => {
      state.highlightRules[idx].color = e.target.value;
      row.querySelector(".color-hex").innerText = e.target.value.toUpperCase();
      updateHighlightRules(state.highlightRules); saveState();
    });
    row.querySelector(".hl-delete").addEventListener("click", () => {
      state.highlightRules.splice(idx, 1);
      updateHighlightRules(state.highlightRules);
      saveState();
      renderHighlightRulesList();
    });
    container.appendChild(row);
  });
}

function escHtml(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

document.addEventListener("DOMContentLoaded", () => {
  initCanvasModule();
  generateDreamySynth();
  
  loadSavedState();
  applyStateToUI();
  
  // Re-parse timings
  syncLyricsFromRawText();
  
  // Run loop
  startRenderLoop();
  
  // Input binders
  const inputs = [
    inputSongTitle, inputSongArtist, inputSongChannel,
    inputAudioStart, inputAudioEnd, inputFadeIn, inputFadeOut,
    sliderBgBlur, sliderBgOverlay, sliderMainSize, sliderMainX, sliderMainY,
    selectFontFamily, sliderLyricSize, sliderLyricX, sliderLyricY,
    inputLinesAbove, inputLinesBelow, toggleFloat, sliderFloatSpeed, sliderFogIntensity,
    colorLyricBase, colorLyricActive, sliderKaraokeSpeed, sliderLyricZoom, sliderLyricGlow, colorLyricGlow,
    sliderFrameOpacity, sliderFrameWidth, sliderFrameHeight, colorFrameBg
  ];
  
  inputs.forEach(input => {
    input.addEventListener("input", () => {
      // Numerical label updates
      if (input.id === "slider-bg-blur") document.getElementById("val-bg-blur").innerText = `${input.value}px`;
      if (input.id === "slider-bg-overlay") document.getElementById("val-bg-overlay").innerText = `${input.value}%`;
      if (input.id === "slider-main-size") document.getElementById("val-main-size").innerText = `${input.value}px`;
      if (input.id === "slider-main-x") document.getElementById("val-main-x").innerText = `${input.value}%`;
      if (input.id === "slider-main-y") document.getElementById("val-main-y").innerText = `${input.value}%`;
      if (input.id === "slider-lyric-size") document.getElementById("val-lyric-size").innerText = `${input.value}px`;
      if (input.id === "slider-lyric-x") document.getElementById("val-lyric-x").innerText = `${input.value}%`;
      if (input.id === "slider-lyric-y") document.getElementById("val-lyric-y").innerText = `${input.value}%`;
      if (input.id === "slider-float-speed") document.getElementById("val-float-speed").innerText = `${input.value}x`;
      if (input.id === "slider-fog-intensity") document.getElementById("val-fog-intensity").innerText = `${input.value}%`;
      if (input.id === "slider-karaoke-speed") document.getElementById("val-karaoke-speed").innerText = `${input.value}x`;
      if (input.id === "slider-lyric-zoom") document.getElementById("val-lyric-zoom").innerText = `${input.value}x`;
      if (input.id === "slider-lyric-glow") document.getElementById("val-lyric-glow").innerText = `${input.value}px`;
      if (input.id === "slider-frame-opacity") document.getElementById("val-frame-opacity").innerText = `${input.value}%`;
      if (input.id === "slider-frame-width") document.getElementById("val-frame-width").innerText = `${input.value}px`;
      if (input.id === "slider-frame-height") document.getElementById("val-frame-height").innerText = `${input.value}px`;
      
      if (input.type === "color") {
        input.parentElement.querySelector(".color-hex").innerText = input.value.toUpperCase();
      }
      
      saveState();
    });
  });
  
  // Align select buttons
  document.querySelectorAll(".align-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".align-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      saveState();
    });
  });
  
  // Preview Zoom slider bindings
  sliderPreviewZoom.addEventListener("input", (e) => {
    valPreviewZoom.innerText = `${e.target.value}%`;
    saveState();
    updateCanvasSize();
  });
  
  // Shape buttons
  document.getElementById("btn-shape-circle").addEventListener("click", () => {
    document.getElementById("btn-shape-circle").classList.add("active");
    document.getElementById("btn-shape-rect").classList.remove("active");
    saveState();
  });
  document.getElementById("btn-shape-rect").addEventListener("click", () => {
    document.getElementById("btn-shape-rect").classList.add("active");
    document.getElementById("btn-shape-circle").classList.remove("active");
    saveState();
  });
  
  // Playback triggers
  audioPlayer.ontimeupdate = handleTimeUpdate;
  audioPlayer.addEventListener("loadedmetadata", () => {
    timeTotal.innerText = formatTime(audioPlayer.duration);
  });
  btnPlayPause.addEventListener("click", handlePlayPause);
  btnMarkTiming.addEventListener("click", markCurrentTiming);
  
  btnParseLyrics.addEventListener("click", () => {
    syncLyricsFromRawText();
    saveState();
  });
  textareaLyricsRaw.addEventListener("change", () => {
    syncLyricsFromRawText();
    saveState();
  });
  
  btnToggleTimeFormat.addEventListener("click", () => {
    setTimeFormatMMSS(!timeFormatMMSS);
    btnToggleTimeFormat.querySelector("span").innerText = timeFormatMMSS ? "Dạng 0:00" : "Dạng 161.3s";
    renderTimingsList();
  });
  
  btnResetDefaults.addEventListener("click", () => {
    if (confirm("Khôi phục toàn bộ mặc định?")) {
      resetAllState();
      setAudioFileLoaded(false);
      audioPlayer.src = defaultAudioUrl;
      audioPlayer.load();
      document.getElementById("audio-file-info").innerText = "Đang dùng nhạc demo mặc định";
      inputAudioStart.value = 0;
      inputAudioEnd.value = "auto";
      loadSavedState();
      applyStateToUI();
      syncLyricsFromRawText();
    }
  });
  
  btnSortTimings.addEventListener("click", () => {
    lyrics.sort((a, b) => {
      const t1 = (a.time === null || a.time === undefined || a.time === 0) ? 999999 : a.time;
      const t2 = (b.time === null || b.time === undefined || b.time === 0) ? 999999 : b.time;
      return t1 - t2;
    });
    setSyncCursorIndex(0);
    syncTimingsListToRawText();
    renderTimingsList();
  });
  
  btnClearTimings.addEventListener("click", () => {
    lyrics.forEach(line => {
      line.time = 0;
    });
    setSyncCursorIndex(0);
    syncTimingsListToRawText();
    renderTimingsList();

    // Seek to audioStart and continue playing
    const startTime = parseTimeToSeconds(state.audioStart) || 0;
    initAudioContext();
    audioPlayer.currentTime = startTime;
    if (audioPlayer.paused) {
      audioCtx && audioCtx.state === 'suspended' && audioCtx.resume();
      audioPlayer.play();
      btnPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i>';
      btnPlayPause.classList.add('active');
      if (bgVideo && bgMediaType === 'video') bgVideo.play();
      if (mainVideo && mainMediaType === 'video') mainVideo.play();
    }

    showToast('Đã xóa tất cả mốc thời gian — Đang phát lại từ đầu', 'warning');
  });

  btnExportVideo.addEventListener("click", startVideoExport);
  btnCloseExport.addEventListener("click", () => modalExport.classList.add("hidden"));
  btnCancelExport.addEventListener("click", cancelVideoExport);
  btnCloseSuccess.addEventListener("click", () => modalExport.classList.add("hidden"));
  
  // Sidebar tabs switcher
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const parent = btn.parentElement;
      const contentPanel = parent.nextElementSibling;
      const targetTab = btn.getAttribute("data-tab");
      
      parent.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      contentPanel.querySelectorAll(".tab-panel").forEach(panel => {
        if (panel.id === targetTab) {
          panel.classList.add("active");
        } else {
          panel.classList.remove("active");
        }
      });
    });
  });
  
  // Aspect ratio switcher
  ratioButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      saveState();
      const ratio = btn.getAttribute("data-ratio");
      state.activeRatio = ratio;
      
      ratioButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      applyStateToUI();
      saveState();
    });
  });
  
  // Media Type image vs video toggles
  toggleMediaBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      const type = btn.getAttribute("data-type");
      
      const section = btn.parentElement.parentElement;
      section.querySelectorAll(`.toggle-media-type[data-target="${target}"]`).forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      if (target === "bg") {
        setBgMediaType(type);
        document.getElementById("upload-bg-image-zone").style.display = type === "image" ? "flex" : "none";
        document.getElementById("upload-bg-video-zone").style.display = type === "video" ? "flex" : "none";
      } else {
        setMainMediaType(type);
        document.getElementById("upload-main-image-zone").style.display = type === "image" ? "flex" : "none";
        document.getElementById("upload-main-video-zone").style.display = type === "video" ? "flex" : "none";
      }
    });
  });
  
  // File upload dropzones
  setupFileZone("upload-audio-zone", "input-audio-file", "audio-file-info", "audio");
  setupFileZone("upload-bg-image-zone", "input-bg-image", "bg-image-info", "bg_image");
  setupFileZone("upload-bg-video-zone", "input-bg-video", "bg-video-info", "bg_video");
  setupFileZone("upload-main-image-zone", "input-main-image", "main-image-info", "main_image");
  setupFileZone("upload-main-video-zone", "input-main-video", "main-video-info", "main_video");
  
  window.addEventListener("resize", updateCanvasSize);
  
  // Progress Bar Dragging
  sliderPlaybackProgress.addEventListener("input", (e) => {
    isProgressBarDragging = true;
    const percent = parseFloat(e.target.value);
    progressBarFill.style.width = `${percent}%`;
    const dur = audioPlayer.duration || 60;
    const trimStart = parseTimeToSeconds(state.audioStart) || 0;
    const trimEnd   = state.audioEnd === "auto" ? dur : parseTimeToSeconds(state.audioEnd);
    const trimDur   = trimEnd - trimStart;
    timeCurrent.innerText = formatTime((percent / 100) * trimDur);
  });

  sliderPlaybackProgress.addEventListener("change", (e) => {
    isProgressBarDragging = false;
    const percent = parseFloat(e.target.value);
    const dur = audioPlayer.duration || 60;
    const trimStart = parseTimeToSeconds(state.audioStart) || 0;
    const trimEnd   = state.audioEnd === "auto" ? dur : parseTimeToSeconds(state.audioEnd);
    const trimDur   = trimEnd - trimStart;
    audioPlayer.currentTime = trimStart + (percent / 100) * trimDur;
  });
  
  // Volume Slider
  sliderVolume.addEventListener("input", (e) => {
    const vol = parseInt(e.target.value);
    state.volume = vol;
    audioPlayer.volume = vol / 100;
    
    if (vol === 0) {
      volumeIcon.className = "fa-solid fa-volume-xmark";
    } else if (vol < 40) {
      volumeIcon.className = "fa-solid fa-volume-off";
    } else if (vol < 80) {
      volumeIcon.className = "fa-solid fa-volume-low";
    } else {
      volumeIcon.className = "fa-solid fa-volume-high";
    }
    saveState();
  });
  
  // Hotkeys Listener
  window.addEventListener("keydown", (e) => {
    const isTyping = document.activeElement.tagName === "INPUT" || 
                     document.activeElement.tagName === "TEXTAREA" ||
                     document.activeElement.tagName === "SELECT";
                     
    if (isTyping) return;
    
    if (e.code === "Space") {
      e.preventDefault();
      handlePlayPause();
    }
    
    if (e.code === "Enter") {
      e.preventDefault();
      markCurrentTiming();
    }
  });
  
  // Skip buttons
  btnSkipBackward.addEventListener("click", () => {
    audioPlayer.currentTime = Math.max(0, audioPlayer.currentTime - 5);
  });
  btnSkipForward.addEventListener("click", () => {
    audioPlayer.currentTime = Math.min(audioPlayer.duration || 60, audioPlayer.currentTime + 5);
  });

  // ── New controls ────────────────────────────────────────────────────────
  const newSliders = [
    "slider-spin-speed","slider-fog-speed",
    "slider-wm-x","slider-wm-y","slider-wm-size","slider-wm-opacity",
    "slider-wm-rotate","slider-wm-spacing",
    "slider-si-x","slider-si-y","slider-si-size"
  ];
  newSliders.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      const valEl = document.getElementById("val-" + id.replace("slider-",""));
      if (valEl) {
        const unit = id.includes("size")||id.includes("spacing") ? "px"
                   : id.includes("rotate") ? "°"
                   : id.includes("opacity") ? "%" : (id.includes("speed") ? "x" : "%");
        valEl.innerText = el.value + unit;
      }
      saveState();
    });
  });

  const newToggles = ["toggle-main-border","toggle-main-spin","toggle-watermark","toggle-wm-italic","toggle-wm-bold"];
  newToggles.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", saveState);
  });

  const newInputs2 = ["input-watermark-text","color-wm"];
  newInputs2.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      if (el.type === "color") {
        const hex = el.parentElement?.querySelector(".color-hex");
        if (hex) hex.innerText = el.value.toUpperCase();
      }
      saveState();
    });
  });

  // Song info align buttons
  document.querySelectorAll(".si-align-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".si-align-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      saveState();
    });
  });

  // Add highlight rule button
  const btnAddHighlight = document.getElementById("btn-add-highlight");
  if (btnAddHighlight) {
    btnAddHighlight.addEventListener("click", () => {
      if (!state.highlightRules) state.highlightRules = [];
      state.highlightRules.push({ pattern: "[", close: "]", color: "#f59e0b" });
      updateHighlightRules(state.highlightRules);
      saveState();
      renderHighlightRulesList();
    });
  }

  // Init highlight rules
  updateHighlightRules(state.highlightRules || []);
  renderHighlightRulesList();

  // File persistence via IndexedDB
  initFileStore();
});

// ── IndexedDB File Persistence ────────────────────────────────────────────
const DB_NAME = 'LyricsMakerDB';
const DB_VER  = 1;
let fileDB = null;

function openFileDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore('files');
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e);
  });
}

async function saveFileToIDB(key, blob) {
  if (!fileDB) return;
  return new Promise((resolve, reject) => {
    const tx  = fileDB.transaction('files', 'readwrite');
    const st  = tx.objectStore('files');
    st.put(blob, key);
    tx.oncomplete = resolve;
    tx.onerror    = reject;
  });
}

async function loadFileFromIDB(key) {
  if (!fileDB) return null;
  return new Promise((resolve) => {
    const tx  = fileDB.transaction('files', 'readonly');
    const st  = tx.objectStore('files');
    const req = st.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror   = () => resolve(null);
  });
}

async function initFileStore() {
  try {
    fileDB = await openFileDB();
    // Restore saved files
    const audioBlob = await loadFileFromIDB('audio');
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      audioPlayer.src = url;
      audioPlayer.load();
      setAudioFileLoaded(true);
      document.getElementById('audio-file-info').innerText = '✅ Nhạc đã lưu (từ phiên trước)';
    }
    const bgImgBlob = await loadFileFromIDB('bg_image');
    if (bgImgBlob) bgImage.src = URL.createObjectURL(bgImgBlob);
    const mainImgBlob = await loadFileFromIDB('main_image');
    if (mainImgBlob) mainImage.src = URL.createObjectURL(mainImgBlob);
    const bgVidBlob = await loadFileFromIDB('bg_video');
    if (bgVidBlob) { bgVideo.src = URL.createObjectURL(bgVidBlob); bgVideo.load(); bgVideo.play().catch(()=>{}); }
    const mainVidBlob = await loadFileFromIDB('main_video');
    if (mainVidBlob) { mainVideo.src = URL.createObjectURL(mainVidBlob); mainVideo.load(); mainVideo.play().catch(()=>{}); }
  } catch(e) {
    console.warn('IndexedDB init failed:', e);
  }
}
