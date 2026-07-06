/**
 * lib/canvasRenderer.js
 * Pure canvas drawing functions. No React, no store — receives all data as arguments.
 */

// ── Fog particles (module-level singleton) ────────────────────────────────────
const fogParticles = [];
export function initFogParticles() {
  fogParticles.length = 0;
  for (let i = 0; i < 20; i++) {
    fogParticles.push({
      x: Math.random() * 120 - 10,
      y: Math.random() * 120 - 10,
      r: 80 + Math.random() * 150,
      dx: 0.02 + Math.random() * 0.05,
      dy: (Math.random() - 0.5) * 0.02,
      opacity: 0.05 + Math.random() * 0.15,
    });
  }
}

// ── Scroll LERP state (Now stateless, resetScrollY kept for API compatibility) ──
export function resetScrollY() {}

// ── Main render entry ─────────────────────────────────────────────────────────
/**
 * Renders one frame onto the given canvas context.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement} canvas
 * @param {number} curTime        - current audio time (seconds)
 * @param {object} visuals        - visual settings for the active ratio
 * @param {object} meta           - { songTitle, songArtist, songChannel }
 * @param {Array}  lyrics         - [{ text, time }]
 * @param {object} media          - { bgImage, bgVideo, bgMediaType, mainImage, mainVideo, mainMediaType }
 * @param {Array}  highlightRules - [{ pattern, close, color }]
 * @param {number} audioDuration  - total audio duration in seconds
 */
export function renderFrame(ctx, canvas, curTime, visuals, meta, lyrics, media, highlightRules = [], audioDuration = 60) {
  let w = canvas.width;
  let h = canvas.height;

  ctx.save();
  
  // High-DPI scaling for sharp rendering
  if (canvas.dataset.logicalWidth && canvas.dataset.logicalHeight) {
    const dpr = window.devicePixelRatio || 1;
    w = parseFloat(canvas.dataset.logicalWidth);
    h = parseFloat(canvas.dataset.logicalHeight);
    ctx.scale(dpr, dpr);
  }

  // Clear
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);

  if (!visuals) {
    ctx.restore();
    return;
  }

  // 1. Background
  if (media.bgMediaType !== 'none') {
    drawBackground(ctx, w, h, curTime, visuals, media);
  }

  // 2. Dark overlay
  if (visuals.bgOverlayOpacity > 0) {
    ctx.fillStyle = `rgba(0,0,0,${visuals.bgOverlayOpacity / 100})`;
    ctx.fillRect(0, 0, w, h);
  }

  // 3. Song info
  drawSongInfo(ctx, w, h, visuals, meta, highlightRules);

  // 4. Main media (disc / image / video)
  let mainOffset = { x: 0, y: 0 };
  if (media.mainMediaType !== 'none') {
    mainOffset = drawMainMedia(ctx, w, h, curTime, visuals, media);
  }

  // 5. Fog
  if (visuals.fogIntensity > 0) {
    drawFog(ctx, w, h, visuals.fogIntensity / 100, visuals);
  }

  // 6. Watermark
  drawWatermark(ctx, w, h, visuals, mainOffset);

  // 7. Lyrics
  drawLyrics(ctx, w, h, curTime, visuals, lyrics, highlightRules, audioDuration);

  ctx.restore();
}

// ── Background ────────────────────────────────────────────────────────────────
function drawBackground(ctx, w, h, curTime, visuals, media) {
  ctx.save();
  
  if (visuals.bgFloatEnabled) {
    const bgScale = 1.1;
    const speed = visuals.bgFloatSpeed || 1.0;
    const offsetX = Math.sin(curTime * 0.8 * speed) * (w * 0.05);
    const offsetY = Math.cos(curTime * 1.1 * speed) * (h * 0.05);
    ctx.translate(w / 2 + offsetX, h / 2 + offsetY);
    ctx.scale(bgScale, bgScale);
    ctx.translate(-w / 2, -h / 2);
  }

  let loaded = false;

  if (media.bgMediaType === 'image' && media.bgImage?.src) {
    loaded = true;
    if (visuals.bgBlur > 0) {
      ctx.filter = `blur(${visuals.bgBlur}px)`;
      const b = visuals.bgBlur * 2;
      ctx.drawImage(media.bgImage, -b, -b, w + b * 2, h + b * 2);
      ctx.filter = 'none';
    } else {
      ctx.drawImage(media.bgImage, 0, 0, w, h);
    }
  } else if (
    media.bgMediaType === 'video' &&
    media.bgVideo?.src &&
    !media.bgVideo.paused &&
    media.bgVideo.readyState >= 2
  ) {
    loaded = true;
    if (visuals.bgBlur > 0) {
      ctx.filter = `blur(${visuals.bgBlur}px)`;
      const b = visuals.bgBlur * 2;
      ctx.drawImage(media.bgVideo, -b, -b, w + b * 2, h + b * 2);
      ctx.filter = 'none';
    } else {
      ctx.drawImage(media.bgVideo, 0, 0, w, h);
    }
  }

  if (!loaded) {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h) * 0.8);
    grad.addColorStop(0, '#1c1836');
    grad.addColorStop(1, '#07050d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

// ── Song Info ─────────────────────────────────────────────────────────────────
function drawSongInfo(ctx, w, h, visuals, meta, rules) {
  ctx.save();
  const fs = visuals.songInfoFontSize || 20;
  const x = ((visuals.songInfoX || 50) / 100) * w;
  const y = ((visuals.songInfoY || 8) / 100) * h;
  ctx.textAlign = visuals.songInfoAlign || 'center';
  ctx.font = `bold ${fs}px Outfit`;
  drawHighlightedText(ctx, meta.songTitle || '', x, y, fs, 'rgba(255,255,255,0.9)', rules);
  ctx.font = `normal ${Math.round(fs * 0.75)}px Outfit`;
  const parts = [];
  if (meta.songArtist) parts.push(meta.songArtist);
  if (meta.songChannel) parts.push(meta.songChannel);
  const sub = parts.join(' - ');
  drawHighlightedText(ctx, sub, x, y + fs * 1.4, Math.round(fs * 0.75), 'rgba(255,255,255,0.6)', rules);
  ctx.restore();
}

// ── Main Media (disc / image / video) ────────────────────────────────────────
function drawMainMedia(ctx, w, h, curTime, visuals, media) {
  const mainXPixel = (visuals.mainX / 100) * w;
  let mainYPixel = (visuals.mainY / 100) * h;
  const size = visuals.mainSize;
  const offset = { x: 0, y: 0 };

  if (visuals.floatEnabled) {
    const floatOffset = Math.sin(curTime * 2.0 * (visuals.floatSpeed || 1)) * 15;
    mainYPixel += floatOffset;
    offset.y = floatOffset;
  }

  const spinEnabled = visuals.spinEnabled !== false;
  const rotationAngle = spinEnabled ? curTime * 0.72 * (visuals.spinSpeed || 1.0) : 0;

  ctx.save();
  let loaded = false;
  const isFull = visuals.mainFullEnabled === true;

  ctx.save();
  if (isFull) {
    if (media.mainMediaType === 'image' && media.mainImage?.src) {
      loaded = true;
      const imgW = media.mainImage.naturalWidth || size;
      const imgH = media.mainImage.naturalHeight || size;
      const scale = size / Math.max(imgW, imgH);
      ctx.translate(mainXPixel, mainYPixel);
      ctx.rotate(rotationAngle);
      ctx.drawImage(media.mainImage, -(imgW * scale) / 2, -(imgH * scale) / 2, imgW * scale, imgH * scale);
    } else if (media.mainMediaType === 'video' && media.mainVideo?.src && !media.mainVideo.paused && media.mainVideo.readyState >= 2) {
      loaded = true;
      const vW = media.mainVideo.videoWidth || size;
      const vH = media.mainVideo.videoHeight || size;
      const scale = size / Math.max(vW, vH);
      ctx.translate(mainXPixel, mainYPixel);
      ctx.rotate(rotationAngle);
      ctx.drawImage(media.mainVideo, -(vW * scale) / 2, -(vH * scale) / 2, vW * scale, vH * scale);
    }
  } else {
    ctx.beginPath();
    if (visuals.mainShape === 'circle') {
      ctx.arc(mainXPixel, mainYPixel, size / 2, 0, Math.PI * 2);
    } else {
      ctx.rect(mainXPixel - size / 2, mainYPixel - size / 2, size, size);
    }
    ctx.clip();

    if (media.mainMediaType === 'image' && media.mainImage?.src) {
      loaded = true;
      ctx.translate(mainXPixel, mainYPixel);
      ctx.rotate(rotationAngle);
      drawCover(ctx, media.mainImage, -size / 2, -size / 2, size, size);
    } else if (media.mainMediaType === 'video' && media.mainVideo?.src && !media.mainVideo.paused && media.mainVideo.readyState >= 2) {
      loaded = true;
      ctx.translate(mainXPixel, mainYPixel);
      ctx.rotate(rotationAngle);
      drawCover(ctx, media.mainVideo, -size / 2, -size / 2, size, size);
    }
  }
  ctx.restore();

  if (!loaded) {
    drawDefaultVinyl(ctx, mainXPixel, mainYPixel, size, rotationAngle);
  } else if (visuals.mainBorderEnabled !== false) {
    ctx.beginPath();
    if (visuals.mainShape === 'circle') {
      ctx.arc(mainXPixel, mainYPixel, size / 2, 0, Math.PI * 2);
    } else {
      ctx.rect(mainXPixel - size / 2, mainYPixel - size / 2, size, size);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 4;
    ctx.stroke();
  }
  ctx.restore();
  return offset;
}

// ── Fog ───────────────────────────────────────────────────────────────────────
function drawFog(ctx, w, h, intensity, visuals) {
  ctx.save();
  const speedMult = visuals.fogSpeed !== undefined ? visuals.fogSpeed : 0.5;
  fogParticles.forEach((p) => {
    p.x += p.dx * (speedMult / 0.5);
    p.y += p.dy * (speedMult / 0.5);
    if (p.x * (w / 100) > w + p.r) p.x = -p.r / (w / 100);
    if (p.y * (h / 100) > h + p.r) p.y = -p.r / (h / 100);
    if (p.y * (h / 100) < -p.r) p.y = (h + p.r) / (h / 100);

    const px = p.x * (w / 100);
    const py = p.y * (h / 100);
    const grad = ctx.createRadialGradient(px, py, 0, px, py, p.r);
    grad.addColorStop(0, `rgba(220,225,255,${p.opacity * intensity})`);
    grad.addColorStop(0.5, `rgba(220,225,255,${p.opacity * intensity * 0.3})`);
    grad.addColorStop(1, 'rgba(220,225,255,0)');
    ctx.beginPath();
    ctx.arc(px, py, p.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  });
  ctx.restore();
}

// ── Lyrics ────────────────────────────────────────────────────────────────────
function drawLyrics(ctx, w, h, curTime, visuals, lyrics, rules, audioDuration) {
  if (!lyrics.length) return;

  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    const t = lyrics[i].time;
    if (t !== null && t !== undefined) {
      if (i > 0 && t === 0) continue;
      if (curTime >= t) activeIndex = i;
    }
  }
  if (activeIndex === -1) activeIndex = 0;

  const lyricX = (visuals.lyricX / 100) * w;
  const lyricY = (visuals.lyricY / 100) * h;
  const fontSize = visuals.lyricFontSize;
  const lineSpacingMult = visuals.lineSpacing !== undefined ? visuals.lineSpacing : 1.5;
  const lineSpacing = fontSize * lineSpacingMult;
  const subLineSpacingMult = visuals.subLineSpacing !== undefined ? visuals.subLineSpacing : 1.2;
  const subLineSpacing = fontSize * subLineSpacingMult;

  // Precompute block positions to account for subLineSpacing
  const blockY = new Array(lyrics.length).fill(0);
  const subLinesArray = new Array(lyrics.length);
  for (let i = 0; i < lyrics.length; i++) {
    subLinesArray[i] = lyrics[i].text.replace(/\r/g, '').split('\n');
    if (i > 0) {
      const prevHalf = (subLinesArray[i - 1].length - 1) / 2 * subLineSpacing;
      const currHalf = (subLinesArray[i].length - 1) / 2 * subLineSpacing;
      blockY[i] = blockY[i - 1] + prevHalf + currHalf + lineSpacing;
    }
  }

  const linesAbove = visuals.linesAbove;
  const linesBelow = visuals.linesBelow === 'auto' ? 1 : visuals.linesBelow;

  // Smooth frame-rate-independent scroll transition (stateless)
  const targetScrollY = blockY[activeIndex];
  const transitionEnabled = visuals.transitionEnabled !== false;
  let currentScrollY = targetScrollY;

  if (transitionEnabled && activeIndex > 0 && lyrics.length > 0) {
    const activeLyr = lyrics[activeIndex];
    const prevLyr = lyrics[activeIndex - 1];
    if (activeLyr && prevLyr && activeLyr.time !== null && prevLyr.time !== null) {
      const tStart = activeLyr.time;
      const tPrev = prevLyr.time;
      const gap = tStart - tPrev;
      const duration = Math.min(0.35, gap > 0 ? gap : 0.35);
      if (curTime < tStart + duration) {
        const elapsed = curTime - tStart;
        if (elapsed >= 0) {
          const progress = elapsed / duration;
          const ease = progress * progress * (3 - 2 * progress); // smoothstep
          const prevScrollY = blockY[activeIndex - 1];
          currentScrollY = prevScrollY + (targetScrollY - prevScrollY) * ease;
        } else {
          currentScrollY = blockY[activeIndex - 1];
        }
      }
    }
  }

  const startIdx = Math.max(0, activeIndex - linesAbove - 1);
  const endIdx = Math.min(lyrics.length - 1, activeIndex + linesBelow + 1);

  // Frame box
  if (visuals.frameOpacity > 0) {
    ctx.save();
    const fW = visuals.frameWidth;
    const fH = visuals.frameHeight;
    ctx.beginPath();
    drawRoundRect(ctx, lyricX - fW / 2, lyricY - fH / 2, fW, fH, 12);
    ctx.fillStyle = hexToRgba(visuals.colorFrameBg, visuals.frameOpacity / 100);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  for (let i = startIdx; i <= endIdx; i++) {
    const isActive = i === activeIndex;
    const yPos = lyricY + blockY[i] - currentScrollY;
    const scale = isActive ? (visuals.lyricZoom || 1.1) : 1.0;

    let lineOpacity = 1.0;
    if (!isActive) {
      const topY = lyricY - linesAbove * lineSpacing;
      const bottomY = lyricY + linesBelow * lineSpacing;
      
      let progressDown = 0;
      if (bottomY > topY) {
        progressDown = (yPos - topY) / (bottomY - topY);
      }
      progressDown = Math.max(0, Math.min(1, progressDown));
      
      // Mờ dần từ trên xuống dưới: trên cùng (0) -> 0.85, dưới cùng (1) -> 0.1
      lineOpacity = 0.85 - (0.75 * progressDown);
    }

    ctx.save();
    if (isActive) {
      const weight = visuals.lyricBoldEnabled !== false ? 'bold' : 'normal';
      ctx.font = `${weight} ${fontSize * scale}px "${visuals.lyricFontFamily}"`;
      ctx.fillStyle = visuals.colorLyricBase;
      if (visuals.lyricGlow > 0) {
        ctx.shadowColor = visuals.colorLyricGlow;
        ctx.shadowBlur = visuals.lyricGlow;
      }
    } else {
      ctx.font = `normal ${fontSize}px "${visuals.lyricFontFamily}"`;
      ctx.fillStyle = hexToRgba(visuals.colorLyricBase, lineOpacity);
      ctx.shadowBlur = 0;
    }

    let textX = lyricX;
    if (visuals.lyricAlign === 'center') ctx.textAlign = 'center';
    else if (visuals.lyricAlign === 'left') { ctx.textAlign = 'left'; textX = lyricX - (visuals.frameWidth ? visuals.frameWidth / 2.2 : 200); }
    else if (visuals.lyricAlign === 'right') { ctx.textAlign = 'right'; textX = lyricX + (visuals.frameWidth ? visuals.frameWidth / 2.2 : 200); }

    const subLines = subLinesArray[i];
    const karaokeSpeedMult = visuals.karaokeSpeed !== undefined ? visuals.karaokeSpeed : 1.0;
    const karaokeEnabled = visuals.karaokeEnabled !== false && karaokeSpeedMult > 0;
    const highlightScale = visuals.highlightFontScale !== undefined ? visuals.highlightFontScale : 1.0;

    subLines.forEach((subText, subIdx) => {
      const subLineY = yPos + (subIdx - (subLines.length - 1) / 2) * subLineSpacing;
      let baseClr = isActive ? visuals.colorLyricBase : hexToRgba(visuals.colorLyricBase, lineOpacity);
      if (isActive && !karaokeEnabled) baseClr = visuals.colorLyricActive;
      drawHighlightedText(ctx, subText, textX, subLineY, isActive ? fontSize * scale : fontSize, baseClr, rules, isActive && !karaokeEnabled, highlightScale);

      if (isActive && karaokeEnabled && lyrics[i].time !== null) {
        const textWidth = ctx.measureText(subText).width;
        const tStart = lyrics[i].time;
        const tEnd = (i < lyrics.length - 1 && lyrics[i + 1].time !== null)
          ? lyrics[i + 1].time
          : audioDuration;

        const numSubLines = subLines.length;
        const subDuration = (tEnd - tStart) / numSubLines;
        const subStart = tStart + subIdx * subDuration;
        
        const karaokeDelay = visuals.karaokeDelay !== undefined ? visuals.karaokeDelay : 0.5;
        let actualFillDuration = subDuration - karaokeDelay;
        actualFillDuration = Math.max(0.1, actualFillDuration); // Ensure it has some time to fill
        
        let progress = actualFillDuration > 0 ? ((curTime - subStart) / actualFillDuration) * karaokeSpeedMult : 0;
        progress = Math.max(0, Math.min(1, progress));

        ctx.save();
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.beginPath();
        let startX = textX;
        if (visuals.lyricAlign === 'center') startX = textX - textWidth / 2;
        else if (visuals.lyricAlign === 'right') startX = textX - textWidth;
        ctx.rect(startX - 10, subLineY - fontSize * scale * 0.8, textWidth * progress + 10, fontSize * scale * 1.6);
        ctx.clip();
        drawHighlightedText(ctx, subText, textX, subLineY, fontSize * scale, visuals.colorLyricActive, rules, true, highlightScale);
        ctx.restore();
      }
    });
    ctx.restore();
  }
}

// ── Watermark ─────────────────────────────────────────────────────────────────
function drawWatermark(ctx, w, h, visuals, offset) {
  if (!visuals.watermarkEnabled) return;
  const text = visuals.watermarkText || '@annc19324';
  let wmX = ((visuals.watermarkX || 50) / 100) * w;
  let wmY = ((visuals.watermarkY || 50) / 100) * h;
  if (visuals.watermarkFloatEnabled && offset) { wmX += offset.x; wmY += offset.y; }

  const opacity = (visuals.watermarkOpacity || 60) / 100;
  const color = visuals.watermarkColor || '#ffffff';
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  ctx.save();
  ctx.translate(wmX, wmY);
  ctx.rotate(((visuals.watermarkRotate || 0) * Math.PI) / 180);
  ctx.font = `${visuals.watermarkItalic ? 'italic ' : ''}${visuals.watermarkBold ? 'bold ' : ''}${visuals.watermarkFontSize || 18}px Outfit`;
  ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
  ctx.shadowColor = `rgba(0,0,0,${opacity * 0.5})`;
  ctx.shadowBlur = 4;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const ls = visuals.watermarkLetterSpacing || 0;
  if (ls > 0) {
    let totalW = 0;
    for (const ch of text) totalW += ctx.measureText(ch).width + ls;
    let cx = -totalW / 2;
    for (const ch of text) { ctx.fillText(ch, cx, 0); cx += ctx.measureText(ch).width + ls; }
  } else {
    ctx.fillText(text, 0, 0);
  }
  ctx.restore();
}

// ── Default vinyl ─────────────────────────────────────────────────────────────
function drawDefaultVinyl(ctx, x, y, size, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const r = size / 2;

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = '#121215';
  ctx.fill();
  ctx.strokeStyle = '#272730';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0.35; i < 0.9; i += 0.08) {
    ctx.beginPath();
    ctx.arc(0, 0, r * i, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.35);
  grad.addColorStop(0, '#ff2e93');
  grad.addColorStop(1, '#6366f1');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.rotate(-rotation);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${r * 0.09}px Outfit`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LYRICS', 0, -r * 0.07);
  ctx.fillText('MAKER', 0, r * 0.07);
  ctx.rotate(rotation);

  ctx.beginPath();
  ctx.arc(0, 0, r * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = '#09090c';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function drawHighlightedText(ctx, text, x, y, fontSize, baseColor, rules = [], shouldHighlight = true, highlightScale = 1.0) {
  if (!text) return;
  if (!rules.length) { ctx.fillStyle = baseColor; ctx.fillText(text, x, y); return; }

  const segments = [];
  let cursor = 0;
  while (cursor < text.length) {
    let matched = false;
    for (const rule of rules) {
      const open = rule.pattern;
      const close = rule.close || '';
      if (text.startsWith(open, cursor)) {
        const endIdx = close ? text.indexOf(close, cursor + open.length) : -1;
        if (close && endIdx !== -1) {
          segments.push({ text: text.slice(cursor + open.length, endIdx), color: shouldHighlight ? rule.color : baseColor, isSpecial: true });
          cursor = endIdx + close.length;
          matched = true; break;
        } else if (!close) {
          let end = cursor + open.length;
          while (end < text.length && text[end] !== ' ') end++;
          segments.push({ text: text.slice(cursor + open.length, end), color: shouldHighlight ? rule.color : baseColor, isSpecial: true });
          cursor = end; matched = true; break;
        }
      }
    }
    if (!matched) {
      let nextSpecial = text.length;
      for (const rule of rules) {
        const idx = text.indexOf(rule.pattern, cursor);
        if (idx !== -1 && idx < nextSpecial) nextSpecial = idx;
      }
      if (nextSpecial > cursor) { segments.push({ text: text.slice(cursor, nextSpecial), color: baseColor, isSpecial: false }); cursor = nextSpecial; }
      else { segments.push({ text: text[cursor], color: baseColor, isSpecial: false }); cursor++; }
    }
  }

  const baseFont = ctx.font;
  const specialFont = highlightScale !== 1.0 ? baseFont.replace(/\d+(?:\.\d+)?px/, `${fontSize * highlightScale}px`) : baseFont;

  let totalW = 0;
  segments.forEach((s) => { 
    ctx.font = s.isSpecial ? specialFont : baseFont;
    totalW += ctx.measureText(s.text).width; 
  });

  const align = ctx.textAlign;
  let drawX = x;
  if (align === 'center') drawX = x - totalW / 2;
  else if (align === 'right') drawX = x - totalW;

  const savedAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  let cx = drawX;
  segments.forEach((s) => { 
    ctx.font = s.isSpecial ? specialFont : baseFont;
    ctx.fillStyle = s.color; 
    ctx.fillText(s.text, cx, y); 
    cx += ctx.measureText(s.text).width; 
  });
  ctx.textAlign = savedAlign;
  ctx.font = baseFont;
}

function drawCover(ctx, source, dx, dy, dw, dh) {
  const sw = source.naturalWidth || source.videoWidth || dw;
  const sh = source.naturalHeight || source.videoHeight || dh;
  if (!sw || !sh) { ctx.drawImage(source, dx, dy, dw, dh); return; }
  const scale = Math.max(dw / sw, dh / sh);
  const scaledW = sw * scale;
  const scaledH = sh * scale;
  ctx.drawImage(source, dx + (dw - scaledW) / 2, dy + (dh - scaledH) / 2, scaledW, scaledH);
}

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function hexToRgba(hex, alpha) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
