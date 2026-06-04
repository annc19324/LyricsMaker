/* --- CANVAS & RENDERING MODULE --- */

import { state, lyrics } from "./state.js";
import { audioPlayer, updateGainAndFades } from "./audio.js";

export let canvas = null;
export let ctx = null;
let animationFrameId = null;

// Media Sources (shared state)
export let bgMediaType = "image";
export let mainMediaType = "image";
export const bgImage = new Image();
export const mainImage = new Image();

export const bgVideo = document.createElement("video");
bgVideo.muted = true;
bgVideo.loop = true;
bgVideo.playsInline = true;
bgVideo.autoplay = true;

export const mainVideo = document.createElement("video");
mainVideo.muted = true;
mainVideo.loop = true;
mainVideo.playsInline = true;
mainVideo.autoplay = true;

// Fog particle list
const fogParticles = [];

// Persistent rotation for main media
let mainMediaRotation = 0;

export function setBgMediaType(val) {
  bgMediaType = val;
}

export function setMainMediaType(val) {
  mainMediaType = val;
}

export function initCanvasModule() {
  canvas = document.getElementById("preview-canvas");
  ctx = canvas.getContext("2d");
  initFogParticles();
}

function initFogParticles() {
  fogParticles.length = 0;
  for (let i = 0; i < 20; i++) {
    fogParticles.push({
      x: Math.random() * 120 - 10,
      y: Math.random() * 120 - 10,
      r: 80 + Math.random() * 150,
      dx: 0.02 + Math.random() * 0.05,
      dy: (Math.random() - 0.5) * 0.02,
      opacity: 0.05 + Math.random() * 0.15
    });
  }
}

export function updateCanvasSize() {
  if (!canvas) return;
  
  const activeRatio = state.activeRatio;
  
  // Render resolution
  if (activeRatio === "16:9") {
    canvas.width = 1280;
    canvas.height = 720;
    document.getElementById("aspect-ratio-box").style.aspectRatio = "16/9";
  } else if (activeRatio === "9:16") {
    canvas.width = 720;
    canvas.height = 1280;
    document.getElementById("aspect-ratio-box").style.aspectRatio = "9/16";
  } else if (activeRatio === "1:1") {
    canvas.width = 720;
    canvas.height = 720;
    document.getElementById("aspect-ratio-box").style.aspectRatio = "1/1";
  }
  
  // Size calculations
  const aspectRatioBox = document.getElementById("aspect-ratio-box");
  const parentWidth = aspectRatioBox.parentElement.clientWidth;
  const parentHeight = aspectRatioBox.parentElement.clientHeight;
  
  let boxWidth = parentWidth;
  let boxHeight = parentHeight;
  
  const [wRatio, hRatio] = activeRatio.split(":").map(Number);
  const ratio = wRatio / hRatio;
  
  if (parentWidth / parentHeight > ratio) {
    boxWidth = parentHeight * ratio;
  } else {
    boxHeight = parentWidth / ratio;
  }
  
  // Apply preview zoom (default is 100%)
  const zoomFactor = (state.previewZoom || 100) / 100;
  
  // Constrain to not overflow container too aggressively by default, 
  // but allow sizing dynamically
  aspectRatioBox.style.width = `${boxWidth * zoomFactor}px`;
  aspectRatioBox.style.height = `${boxHeight * zoomFactor}px`;
}

export function updateHighlightRules(rules) {
  window.__highlightRules = rules || [];
}

export function startRenderLoop() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  function tick() {
    renderCanvas();
    updateGainAndFades();
    animationFrameId = requestAnimationFrame(tick);
  }
  
  tick();
}

function renderCanvas() {
  if (!canvas || !ctx) return;
  
  const w = canvas.width;
  const h = canvas.height;
  
  // Reset
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);
  
  const curTime = audioPlayer.currentTime;
  const visuals = state.visuals[state.activeRatio];
  if (!visuals) return;
  
  // 1. Draw Background
  ctx.save();
  let bgLoaded = false;
  
  if (bgMediaType === "image" && bgImage.src) {
    bgLoaded = true;
    if (visuals.bgBlur > 0) {
      ctx.filter = `blur(${visuals.bgBlur}px)`;
      const b = visuals.bgBlur * 2;
      ctx.drawImage(bgImage, -b, -b, w + b * 2, h + b * 2);
      ctx.filter = "none";
    } else {
      ctx.drawImage(bgImage, 0, 0, w, h);
    }
  } else if (bgMediaType === "video" && bgVideo.src && !bgVideo.paused && bgVideo.readyState >= 2) {
    bgLoaded = true;
    if (visuals.bgBlur > 0) {
      ctx.filter = `blur(${visuals.bgBlur}px)`;
      const b = visuals.bgBlur * 2;
      ctx.drawImage(bgVideo, -b, -b, w + b * 2, h + b * 2);
      ctx.filter = "none";
    } else {
      ctx.drawImage(bgVideo, 0, 0, w, h);
    }
  }
  
  if (!bgLoaded) {
    const radialGrad = ctx.createRadialGradient(
      w / 2, h / 2, 50,
      w / 2, h / 2, Math.max(w, h) * 0.8
    );
    radialGrad.addColorStop(0, "#1c1836");
    radialGrad.addColorStop(1, "#07050d");
    ctx.fillStyle = radialGrad;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
  
  // 2. Draw Background Overlay Opacity (Dark overlay)
  if (visuals.bgOverlayOpacity > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${visuals.bgOverlayOpacity / 100})`;
    ctx.fillRect(0, 0, w, h);
  }
  
  // 3. Draw Song Info
  ctx.save();
  const siFontSize = visuals.songInfoFontSize || 20;
  const siX = ((visuals.songInfoX || 50) / 100) * w;
  const siY = ((visuals.songInfoY || 8) / 100) * h;
  const siAlign = visuals.songInfoAlign || "center";
  ctx.textAlign = siAlign;
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
  ctx.font = `bold ${siFontSize}px Outfit`;
  drawHighlightedText(ctx, state.songTitle || "", siX, siY, siFontSize, "rgba(255,255,255,0.9)");
  ctx.font = `normal ${Math.round(siFontSize * 0.75)}px Outfit`;
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  const subLine = `${state.songArtist || ""} • ${state.songChannel || ""}`;
  drawHighlightedText(ctx, subLine, siX, siY + siFontSize * 1.4, Math.round(siFontSize * 0.75), "rgba(255,255,255,0.6)");
  ctx.restore();
  
  // 4. Draw Main Media
  ctx.save();
  const mainXPixel = (visuals.mainX / 100) * w;
  let mainYPixel = (visuals.mainY / 100) * h;
  const size = visuals.mainSize;
  
  // Float Animation
  if (visuals.floatEnabled) {
    const floatOffset = Math.sin(Date.now() * 0.002 * (visuals.floatSpeed || 1)) * 15;
    mainYPixel += floatOffset;
  }
  
  const spinEnabled = visuals.spinEnabled !== false;
  const spinSpeedMult = visuals.spinSpeed || 1.0;
  if (spinEnabled && !audioPlayer.paused) {
    // 60fps average step ~ 0.016. Multiplied by speed.
    mainMediaRotation += 0.012 * spinSpeedMult;
  }
  const rotationAngle = mainMediaRotation;
  
  let mainMediaLoaded = false;
  
  ctx.save();
  const isFull = visuals.mainFullEnabled === true;
  
  if (isFull) {
    // Draw full aspect ratio (no clip)
    if (mainMediaType === "image" && mainImage.src) {
      mainMediaLoaded = true;
      const imgW = mainImage.naturalWidth || size;
      const imgH = mainImage.naturalHeight || size;
      const scale = size / Math.max(imgW, imgH);
      const dw = imgW * scale;
      const dh = imgH * scale;
      
      ctx.translate(mainXPixel, mainYPixel);
      ctx.rotate(rotationAngle);
      ctx.drawImage(mainImage, -dw / 2, -dh / 2, dw, dh);
    } else if (mainMediaType === "video" && mainVideo.src && !mainVideo.paused && mainVideo.readyState >= 2) {
      mainMediaLoaded = true;
      const vidW = mainVideo.videoWidth || size;
      const vidH = mainVideo.videoHeight || size;
      const scale = size / Math.max(vidW, vidH);
      const dw = vidW * scale;
      const dh = vidH * scale;
      
      ctx.translate(mainXPixel, mainYPixel);
      ctx.rotate(rotationAngle);
      ctx.drawImage(mainVideo, -dw / 2, -dh / 2, dw, dh);
    }
  } else {
    // Draw inside circle/rect clip shape
    ctx.beginPath();
    if (visuals.mainShape === "circle") {
      ctx.arc(mainXPixel, mainYPixel, size / 2, 0, Math.PI * 2);
    } else {
      ctx.rect(mainXPixel - size / 2, mainYPixel - size / 2, size, size);
    }
    ctx.clip();
    
    if (mainMediaType === "image" && mainImage.src) {
      mainMediaLoaded = true;
      ctx.translate(mainXPixel, mainYPixel);
      ctx.rotate(rotationAngle);
      drawCover(ctx, mainImage, -size / 2, -size / 2, size, size);
    } else if (mainMediaType === "video" && mainVideo.src && !mainVideo.paused && mainVideo.readyState >= 2) {
      mainMediaLoaded = true;
      ctx.translate(mainXPixel, mainYPixel);
      ctx.rotate(rotationAngle);
      drawCover(ctx, mainVideo, -size / 2, -size / 2, size, size);
    }
  }
  ctx.restore();
  
  if (!mainMediaLoaded) {
    drawDefaultVinyl(ctx, mainXPixel, mainYPixel, size, rotationAngle);
  } else if (visuals.mainBorderEnabled !== false) {
    ctx.beginPath();
    if (visuals.mainShape === "circle") {
      ctx.arc(mainXPixel, mainYPixel, size / 2, 0, Math.PI * 2);
    } else {
      ctx.rect(mainXPixel - size / 2, mainYPixel - size / 2, size, size);
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.restore();
  
  // 5. Draw Fog
  if (visuals.fogIntensity > 0) {
    drawFog(w, h, visuals.fogIntensity / 100, visuals);
  }
  
  // 6. Draw Watermark on main media area
  drawWatermark(ctx, w, h, visuals);

  // 7. Draw Lyrics
  drawLyrics(w, h, curTime, visuals);
}

function drawDefaultVinyl(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const r = size / 2;
  
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = "#121215";
  ctx.fill();
  ctx.strokeStyle = "#272730";
  ctx.lineWidth = 3;
  ctx.stroke();
  
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1;
  for (let i = 0.35; i < 0.9; i += 0.08) {
    ctx.beginPath();
    ctx.arc(0, 0, r * i, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.35);
  grad.addColorStop(0, "#ff2e93");
  grad.addColorStop(1, "#6366f1");
  ctx.fillStyle = grad;
  ctx.fill();
  
  ctx.rotate(-rotation);
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${r * 0.09}px Outfit`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LYRICS", 0, -r * 0.07);
  ctx.fillText("MAKER", 0, r * 0.07);
  ctx.rotate(rotation);
  
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = "#09090c";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawFog(w, h, intensity, visuals) {
  ctx.save();
  fogParticles.forEach(p => {
    p.x += p.dx;
    p.y += p.dy;
    
    if (p.x * (w / 100) > w + p.r) p.x = -p.r / (w / 100);
    if (p.y * (h / 100) > h + p.r) p.y = -p.r / (h / 100);
    if (p.y * (h / 100) < -p.r) p.y = (h + p.r) / (h / 100);
    
    const px = p.x * (w / 100);
    const py = p.y * (h / 100);
    
    const grad = ctx.createRadialGradient(px, py, 0, px, py, p.r);
    grad.addColorStop(0, `rgba(220, 225, 255, ${p.opacity * intensity})`);
    grad.addColorStop(0.5, `rgba(220, 225, 255, ${p.opacity * intensity * 0.3})`);
    grad.addColorStop(1, "rgba(220, 225, 255, 0)");
    
    ctx.beginPath();
    ctx.arc(px, py, p.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  });
  ctx.restore();
}

function drawLyrics(w, h, curTime, visuals) {
  if (lyrics.length === 0) return;
  
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    const t = lyrics[i].time;
    if (t !== null && t !== undefined) {
      if (i > 0 && t === 0) {
        continue;
      }
      if (curTime >= t) {
        activeIndex = i;
      }
    }
  }
  
  if (activeIndex === -1) activeIndex = 0;
  
  const lyricXPixel = (visuals.lyricX / 100) * w;
  const lyricYPixel = (visuals.lyricY / 100) * h;
  const fontSize = visuals.lyricFontSize;
  
  // Custom Line Spacing support
  const lineSpacingMult = visuals.lineSpacing !== undefined ? visuals.lineSpacing : 1.5;
  const targetLineSpacing = fontSize * lineSpacingMult;
  
  const linesAbove = visuals.linesAbove;
  const linesBelow = visuals.linesBelow === "auto" ? 1 : visuals.linesBelow;
  
  // Smooth Transition Scrolling LERP
  const targetScrollY = activeIndex * targetLineSpacing;
  const transitionEnabled = visuals.transitionEnabled !== false;
  if (typeof window.__currentScrollY === 'undefined' || !transitionEnabled) {
    window.__currentScrollY = targetScrollY;
  } else {
    const transitionSpeed = visuals.transitionSpeed !== undefined ? visuals.transitionSpeed : 0.1;
    window.__currentScrollY += (targetScrollY - window.__currentScrollY) * transitionSpeed;
  }

  // Render extra lines buffer to avoid sudden disappearing/popping during smooth scroll
  const startIdx = Math.max(0, activeIndex - linesAbove - 1);
  const endIdx = Math.min(lyrics.length - 1, activeIndex + linesBelow + 1);
  
  const linesToDraw = [];
  for (let i = startIdx; i <= endIdx; i++) {
    linesToDraw.push({
      index: i,
      text: lyrics[i].text,
      isActive: i === activeIndex,
      yPos: lyricYPixel + (i * targetLineSpacing) - window.__currentScrollY
    });
  }
  
  // Draw Background Box
  if (visuals.frameOpacity > 0) {
    ctx.save();
    const frameW = visuals.frameWidth;
    const frameH = visuals.frameHeight;
    const frameX = lyricXPixel - frameW / 2;
    const frameY = lyricYPixel - frameH / 2;
    
    ctx.beginPath();
    drawRoundRect(ctx, frameX, frameY, frameW, frameH, 12);
    ctx.fillStyle = hexToRgba(visuals.colorFrameBg, visuals.frameOpacity / 100);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
  
  linesToDraw.forEach(item => {
    ctx.save();
    const lineY = item.yPos;
    let textX = lyricXPixel;
    
    let scale = 1.0;
    
    if (item.isActive) {
      scale = visuals.lyricZoom || 1.1;
      ctx.font = `bold ${fontSize * scale}px "${visuals.lyricFontFamily}"`;
      ctx.fillStyle = visuals.colorLyricBase;
      
      if (visuals.lyricGlow > 0) {
        ctx.shadowColor = visuals.colorLyricGlow;
        ctx.shadowBlur = visuals.lyricGlow;
      }
    } else {
      ctx.font = `normal ${fontSize}px "${visuals.lyricFontFamily}"`;
      ctx.fillStyle = hexToRgba(visuals.colorLyricBase, 0.4);
      ctx.shadowBlur = 0;
    }
    
    if (visuals.lyricAlign === "center") {
      ctx.textAlign = "center";
    } else if (visuals.lyricAlign === "left") {
      ctx.textAlign = "left";
      textX = lyricXPixel - (visuals.frameWidth ? visuals.frameWidth / 2.2 : 200);
    } else if (visuals.lyricAlign === "right") {
      ctx.textAlign = "right";
      textX = lyricXPixel + (visuals.frameWidth ? visuals.frameWidth / 2.2 : 200);
    }
    
    const subLines = item.text.split("
");
    const subLineSpacing = fontSize * 1.2;
    
    subLines.forEach((subText, subIdx) => {
      const subLineY = lineY + (subIdx - (subLines.length - 1) / 2) * subLineSpacing;
      
      const karaokeSpeedMult = visuals.karaokeSpeed !== undefined ? visuals.karaokeSpeed : 1.0;
      const karaokeEnabled = visuals.karaokeEnabled !== false && karaokeSpeedMult > 0;
      
      let baseClr = item.isActive ? visuals.colorLyricBase : hexToRgba(visuals.colorLyricBase, 0.4);
      if (item.isActive && !karaokeEnabled) {
        baseClr = visuals.colorLyricActive;
      }
      
      drawHighlightedText(ctx, subText, textX, subLineY, item.isActive ? fontSize * scale : fontSize, baseClr);

      // Sequential Karaoke calculation for multi-line lyrics
      if (item.isActive && karaokeEnabled && lyrics[item.index].time !== null) {
        const textWidth = ctx.measureText(subText).width;
        
        const tStart = lyrics[item.index].time;
        let tEnd = tStart + 6.0;
        
        if (item.index < lyrics.length - 1 && lyrics[item.index + 1].time !== null) {
          tEnd = lyrics[item.index + 1].time;
        } else if (audioPlayer.duration) {
          tEnd = audioPlayer.duration;
        }
        
        const lineDuration = tEnd - tStart;
        
        // Divide total duration evenly among all sublines
        const numSubLines = subLines.length;
        const subDuration = lineDuration / numSubLines;
        const subStart = tStart + subIdx * subDuration;
        const elapsed = curTime - subStart;
        
        let progress = subDuration > 0 ? (elapsed / subDuration) * karaokeSpeedMult : 0;
        progress = Math.max(0, Math.min(1, progress));
        
        ctx.save();
        ctx.beginPath();
        
        let startX = textX;
        if (visuals.lyricAlign === "center") {
          startX = textX - textWidth / 2;
        } else if (visuals.lyricAlign === "right") {
          startX = textX - textWidth;
        }
        
        ctx.rect(
          startX - 10,
          subLineY - (fontSize * scale) * 0.8,
          textWidth * progress + 10,
          (fontSize * scale) * 1.6
        );
        ctx.clip();
        
        drawHighlightedText(ctx, subText, textX, subLineY, fontSize * scale, visuals.colorLyricActive);
        ctx.restore();
      }
    });
    
    ctx.restore();
  });
}

function drawRoundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}


function drawHighlightedText(ctx, text, x, y, fontSize, baseColor) {
  if (!text) return;
  const rules = (window.__highlightRules) || [];
  if (!rules.length) {
    ctx.fillStyle = baseColor;
    ctx.fillText(text, x, y);
    return;
  }

  // Build segments
  const segments = [];
  let cursor = 0;
  const fullLen = text.length;

  while (cursor < fullLen) {
    let matched = false;
    for (const rule of rules) {
      const open = rule.pattern;
      const close = rule.close || '';
      if (text.startsWith(open, cursor)) {
        const endIdx = close ? text.indexOf(close, cursor + open.length) : -1;
        if (close && endIdx !== -1) {
          // Bóc tách nội dung ở giữa (bỏ kí tự đặc biệt)
          const content = text.slice(cursor + open.length, endIdx);
          segments.push({ text: content, color: rule.color });
          cursor = endIdx + close.length;
          matched = true;
          break;
        } else if (!close) {
          // Single-char delimiter: color until next whitespace
          let end = cursor + open.length;
          while (end < fullLen && text[end] !== ' ') end++;
          // Bóc tách nội dung (bỏ kí tự đặc biệt)
          const content = text.slice(cursor + open.length, end);
          segments.push({ text: content, color: rule.color });
          cursor = end;
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      const startPlain = cursor;
      let nextSpecial = fullLen;
      for (const rule of rules) {
        const idx = text.indexOf(rule.pattern, cursor);
        if (idx !== -1 && idx < nextSpecial) nextSpecial = idx;
      }
      if (nextSpecial > startPlain) {
        segments.push({ text: text.slice(startPlain, nextSpecial), color: baseColor });
        cursor = nextSpecial;
      } else {
        segments.push({ text: text.slice(startPlain, startPlain + 1), color: baseColor });
        cursor++;
      }
    }
  }

  // Measure total width for alignment offset
  let totalWidth = 0;
  segments.forEach(seg => {
    totalWidth += ctx.measureText(seg.text).width;
  });

  let drawX = x;
  const align = ctx.textAlign;
  if (align === 'center') drawX = x - totalWidth / 2;
  else if (align === 'right') drawX = x - totalWidth;

  const savedAlign = ctx.textAlign;
  ctx.textAlign = 'left';

  let currentX = drawX;
  segments.forEach(seg => {
    ctx.fillStyle = seg.color;
    ctx.fillText(seg.text, currentX, y);
    currentX += ctx.measureText(seg.text).width;
  });

  ctx.textAlign = savedAlign;
}

function drawWatermark(ctx, w, h, visuals) {
  if (!visuals.watermarkEnabled) return;
  const text = visuals.watermarkText || '@annc19324';
  const wmX = ((visuals.watermarkX || 50) / 100) * w;
  const wmY = ((visuals.watermarkY || 50) / 100) * h;
  const fontSize = visuals.watermarkFontSize || 18;
  const opacity = (visuals.watermarkOpacity || 60) / 100;
  const color = visuals.watermarkColor || '#ffffff';
  const italic = visuals.watermarkItalic ? 'italic ' : '';
  const bold = visuals.watermarkBold ? 'bold ' : '';
  const rotate = (visuals.watermarkRotate || 0) * Math.PI / 180;
  const letterSpacing = visuals.watermarkLetterSpacing || 0;

  ctx.save();
  ctx.translate(wmX, wmY);
  ctx.rotate(rotate);
  ctx.font = `${italic}${bold}${fontSize}px Outfit`;
  ctx.fillStyle = color.replace(')', `, ${opacity})`).replace('rgb', 'rgba').replace('#', '');
  // Build rgba from hex
  const r = parseInt(color.slice(1,3), 16);
  const g = parseInt(color.slice(3,5), 16);
  const b = parseInt(color.slice(5,7), 16);
  ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
  ctx.shadowColor = `rgba(0,0,0,${opacity * 0.5})`;
  ctx.shadowBlur = 4;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (letterSpacing > 0) {
    // Manual letter spacing
    let totalW = 0;
    for (const ch of text) totalW += ctx.measureText(ch).width + letterSpacing;
    let cx = -totalW / 2;
    for (const ch of text) {
      ctx.fillText(ch, cx, 0);
      cx += ctx.measureText(ch).width + letterSpacing;
    }
  } else {
    ctx.fillText(text, 0, 0);
  }
  ctx.restore();
}


// Draw image/video with object-fit: cover (preserves aspect ratio, crops to fill)
function drawCover(ctx, source, dx, dy, dw, dh) {
  const sw = source.naturalWidth || source.videoWidth || dw;
  const sh = source.naturalHeight || source.videoHeight || dh;
  if (!sw || !sh) { ctx.drawImage(source, dx, dy, dw, dh); return; }

  const scale = Math.max(dw / sw, dh / sh);
  const scaledW = sw * scale;
  const scaledH = sh * scale;
  const offsetX = (dw - scaledW) / 2;
  const offsetY = (dh - scaledH) / 2;

  ctx.drawImage(source, dx + offsetX, dy + offsetY, scaledW, scaledH);
}

function hexToRgba(hex, alpha) {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
