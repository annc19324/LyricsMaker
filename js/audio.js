/* --- AUDIO MANAGEMENT MODULE --- */

import { state } from "./state.js";

export const audioPlayer = document.getElementById("audio-player");
export let audioFileLoaded = false;
export let defaultAudioUrl = "";

export let audioCtx = null;
export let audioSource = null;
export let gainNode = null;
export let speakerGainNode = null;
export let audioDestination = null;

export function setAudioFileLoaded(val) {
  audioFileLoaded = val;
}

export function initAudioContext() {
  if (audioCtx) return;
  
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  gainNode = audioCtx.createGain();
  audioDestination = audioCtx.createMediaStreamDestination();
  
  // Connect Audio Player output to AudioContext
  audioSource = audioCtx.createMediaElementSource(audioPlayer);
  speakerGainNode = audioCtx.createGain();
  
  audioSource.connect(gainNode);
  gainNode.connect(speakerGainNode);
  speakerGainNode.connect(audioCtx.destination);
  gainNode.connect(audioDestination);
}

export function updateGainAndFades() {
  if (!gainNode) return;
  
  const curTime = audioPlayer.currentTime;
  const totalDuration = audioPlayer.duration || 60;
  
  // Parse parameters from state
  const start = parseFloat(state.audioStart) || 0;
  const end = state.audioEnd === "auto" ? totalDuration : parseFloat(state.audioEnd);
  
  const fIn = parseFloat(state.fadeIn) || 0;
  const fOut = parseFloat(state.fadeOut) || 0;
  
  let volumePercent = parseFloat(state.volume) / 100;
  let targetGain = volumePercent;
  
  // Fade In
  if (fIn > 0 && curTime < start + fIn) {
    const progress = (curTime - start) / fIn;
    targetGain *= Math.max(0, Math.min(1, progress));
  }
  
  // Fade Out
  if (fOut > 0 && curTime > end - fOut) {
    const progress = (end - curTime) / fOut;
    targetGain *= Math.max(0, Math.min(1, progress));
  }
  
  targetGain = Math.max(0, Math.min(1, targetGain));
  gainNode.gain.setValueAtTime(targetGain, audioCtx.currentTime);
}

// Dreamy Lofi Synth generator using OfflineAudioContext
export function generateDreamySynth() {
  const sampleRate = 44100;
  const duration = 60; // 60s track
  const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
  
  // Chords: Cmaj7, Am7, Fmaj7, G7
  const chords = [
    [130.81, 164.81, 196.00, 246.94], // Cmaj7 (C3, E3, G3, B3)
    [110.00, 130.81, 164.81, 196.00], // Am7 (A2, C3, E3, G3)
    [87.31,  220.00, 130.81, 164.81], // Fmaj7 (F2, A3, C3, E3)
    [98.00,  246.94, 146.83, 174.61]  // G7 (G2, B3, D3, F3)
  ];
  
  const chordDuration = 15;
  
  for (let i = 0; i < 4; i++) {
    const startTime = i * chordDuration;
    const notes = chords[i];
    
    notes.forEach((freq, idx) => {
      const osc = offlineCtx.createOscillator();
      osc.type = idx === 0 ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(freq, startTime);
      osc.detune.setValueAtTime((idx % 2 === 0 ? 6 : -6), startTime);
      
      const filter = offlineCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(idx === 0 ? 250 : 600, startTime);
      filter.frequency.exponentialRampToValueAtTime(idx === 0 ? 350 : 1000, startTime + chordDuration / 2);
      filter.frequency.exponentialRampToValueAtTime(idx === 0 ? 250 : 600, startTime + chordDuration);
      
      const gain = offlineCtx.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(idx === 0 ? 0.15 : 0.05, startTime + 1.5);
      gain.gain.setValueAtTime(idx === 0 ? 0.15 : 0.05, startTime + chordDuration - 1.5);
      gain.gain.linearRampToValueAtTime(0, startTime + chordDuration);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(offlineCtx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + chordDuration);
    });
  }
  
  offlineCtx.startRendering().then(renderedBuffer => {
    const wavBlob = bufferToWav(renderedBuffer);
    defaultAudioUrl = URL.createObjectURL(wavBlob);
    
    // Set default audio if user hasn't loaded one
    if (!audioFileLoaded) {
      audioPlayer.src = defaultAudioUrl;
      audioPlayer.load();
    }
  }).catch(err => {
    console.error("Synthesizer rendering failed: ", err);
  });
}

function bufferToWav(buffer) {
  let numOfChan = buffer.numberOfChannels,
      length = buffer.length * numOfChan * 2 + 44,
      bufferArr = new ArrayBuffer(length),
      view = new DataView(bufferArr),
      channels = [], i, sample,
      pos = 0, offset = 0;

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt "
  setUint32(16);
  setUint16(1);          // raw PCM
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * numOfChan * 2);
  setUint16(numOfChan * 2);
  setUint16(16);         // 16-bit

  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF);
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([bufferArr], { type: "audio/wav" });

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}
