/**
 * lib/audioSynth.js
 * Generates a dreamy lofi synth track as a WAV Blob using OfflineAudioContext.
 */

export function generateDreamySynth() {
  return new Promise((resolve, reject) => {
    const sampleRate = 44100;
    const duration = 60;
    const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

    // Cmaj7, Am7, Fmaj7, G7
    const chords = [
      [130.81, 164.81, 196.0, 246.94],
      [110.0, 130.81, 164.81, 196.0],
      [87.31, 220.0, 130.81, 164.81],
      [98.0, 246.94, 146.83, 174.61],
    ];
    const chordDuration = 15;

    for (let i = 0; i < 4; i++) {
      const startTime = i * chordDuration;
      chords[i].forEach((freq, idx) => {
        const osc = offlineCtx.createOscillator();
        osc.type = idx === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        osc.detune.setValueAtTime(idx % 2 === 0 ? 6 : -6, startTime);

        const filter = offlineCtx.createBiquadFilter();
        filter.type = 'lowpass';
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

    offlineCtx
      .startRendering()
      .then((buffer) => resolve(bufferToWav(buffer)))
      .catch(reject);
  });
}

export function generateSilentAudio() {
  return new Promise((resolve, reject) => {
    const sampleRate = 44100;
    const duration = 60;
    const offlineCtx = new OfflineAudioContext(1, sampleRate * duration, sampleRate);
    offlineCtx
      .startRendering()
      .then((buffer) => resolve(bufferToWav(buffer)))
      .catch(reject);
  });
}

function bufferToWav(buffer) {
  const numChan = buffer.numberOfChannels;
  const length = buffer.length * numChan * 2 + 44;
  const arrayBuf = new ArrayBuffer(length);
  const view = new DataView(arrayBuf);
  const channels = [];
  let pos = 0;

  const setUint16 = (d) => { view.setUint16(pos, d, true); pos += 2; };
  const setUint32 = (d) => { view.setUint32(pos, d, true); pos += 4; };

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16);
  setUint16(1); // PCM
  setUint16(numChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * numChan * 2);
  setUint16(numChan * 2);
  setUint16(16);
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < numChan; i++) channels.push(buffer.getChannelData(i));

  let offset = 0;
  while (pos < length) {
    for (let i = 0; i < numChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }
  return new Blob([arrayBuf], { type: 'audio/wav' });
}
