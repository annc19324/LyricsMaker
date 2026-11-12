/**
 * hooks/useAudio.js
 * Manages the HTML audio element, AudioContext, gain/fades, and default synth.
 */
import { useEffect, useRef, useCallback } from 'react';
import useAppStore from '../store/useAppStore';
import { generateDreamySynth, generateSilentAudio } from '../lib/audioSynth';

export function useAudio(audioRef) {
  const audioCtxRef = useRef(null);
  const gainRef = useRef(null);
  const speakerGainRef = useRef(null);
  const audioDestRef = useRef(null);
  const audioSourceRef = useRef(null);
  const audioFileLoadedRef = useRef(false);
  const analyserRef = useRef(null);
  const freqDataRef = useRef(new Uint8Array(128));
  const smoothBeatRef = useRef(0);
  const smoothVolRef = useRef(0);
  const bassHistoryRef = useRef(0.15);

  const volume = useAppStore((s) => s.volume);
  const audioStart = useAppStore((s) => s.audioStart);
  const audioEnd = useAppStore((s) => s.audioEnd);
  const fadeIn = useAppStore((s) => s.fadeIn);
  const fadeOut = useAppStore((s) => s.fadeOut);

  // Generate default synth on mount
  useEffect(() => {
    generateDreamySynth()
      .then((wavBlob) => {
        if (!audioFileLoadedRef.current && audioRef.current) {
          const url = URL.createObjectURL(wavBlob);
          audioRef.current.src = url;
          audioRef.current.load();
        }
      })
      .catch((e) => console.warn('Synth generation failed:', e));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync volume slider to audio element
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume, audioRef]);

  const initAudioContext = useCallback(() => {
    if (audioCtxRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    const speakerGain = ctx.createGain();
    const dest = ctx.createMediaStreamDestination();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.85; // Làm mịn tần số cao để chuyển động êm dịu

    source.connect(analyser);
    analyser.connect(gain);
    gain.connect(speakerGain);
    speakerGain.connect(ctx.destination);
    gain.connect(dest);

    audioCtxRef.current = ctx;
    gainRef.current = gain;
    speakerGainRef.current = speakerGain;
    audioDestRef.current = dest;
    audioSourceRef.current = source;
    analyserRef.current = analyser;
  }, [audioRef]);

  const updateGainAndFades = useCallback(() => {
    const audio = audioRef.current;
    const ctx = audioCtxRef.current;
    const gain = gainRef.current;
    if (!gain || !ctx || !audio) return;

    const cur = audio.currentTime;
    const totalDur = audio.duration || 60;
    const start = parseFloat(audioStart) || 0;
    const end = (!audioEnd || audioEnd === 'auto' || isNaN(parseFloat(audioEnd))) ? totalDur : parseFloat(audioEnd);
    const fIn = parseFloat(fadeIn) || 0;
    const fOut = parseFloat(fadeOut) || 0;

    let targetGain = (volume / 100);
    if (fIn > 0 && cur < start + fIn) targetGain *= Math.max(0, Math.min(1, (cur - start) / fIn));
    if (fOut > 0 && cur > end - fOut) targetGain *= Math.max(0, Math.min(1, (end - cur) / fOut));
    targetGain = Math.max(0, Math.min(1, targetGain));
    gain.gain.setValueAtTime(targetGain, ctx.currentTime);
  }, [audioRef, audioStart, audioEnd, fadeIn, fadeOut, volume]);

  const loadAudioFile = useCallback((file, type = 'default') => {
    if (!file) {
      audioFileLoadedRef.current = false;
      const synthPromise = type === 'none' ? generateSilentAudio() : generateDreamySynth();
      synthPromise.then((wavBlob) => {
        if (audioRef.current) {
          const url = URL.createObjectURL(wavBlob);
          audioRef.current.src = url;
          audioRef.current.load();
          audioRef.current.currentTime = 0;
        }
      }).catch(() => {});
      return;
    }
    audioFileLoadedRef.current = true;
    if (audioRef.current) {
      const url = URL.createObjectURL(file);
      audioRef.current.src = url;
      audioRef.current.load();
      audioRef.current.currentTime = 0;
    }
  }, [audioRef]);

  const getAudioData = useCallback(() => {
    const analyser = analyserRef.current;
    const audio = audioRef.current;
    if (!analyser || !audio || audio.paused) {
      smoothBeatRef.current *= 0.90;
      smoothVolRef.current *= 0.90;
      return { beat: smoothBeatRef.current, volume: smoothVolRef.current };
    }

    analyser.getByteFrequencyData(freqDataRef.current);
    const data = freqDataRef.current;

    // 1. Bass / Beat: lấy các bin tần số thấp chủ đạo của kick drum và bassline (bins 1 - 3, khoảng 40Hz - 160Hz)
    const rawBass = (data[1] * 0.45 + data[2] * 0.35 + data[3] * 0.2) / 255;
    
    // Theo dõi mức bass nền (running average) để chỉ phản hồi khi có cú đập beat rõ ràng
    bassHistoryRef.current = bassHistoryRef.current * 0.96 + rawBass * 0.04;
    const diff = Math.max(0, rawBass - bassHistoryRef.current * 0.85);
    
    // Nén giá trị beat mượt mà (soft saturation), không vọt giật
    const targetBeat = Math.min(1.0, Math.pow(diff * 2.2, 1.2));
    
    // Chuyển động đàn hồi mềm mại: Attack êm ái (không nhảy tức thì trong 1 frame), decay thanh thoát
    if (targetBeat > smoothBeatRef.current) {
      smoothBeatRef.current += (targetBeat - smoothBeatRef.current) * 0.35;
    } else {
      smoothBeatRef.current *= 0.92;
    }

    // 2. Volume toàn dải: làm mượt cao để không rung lắc
    let totalSum = 0;
    const totalCount = Math.min(32, data.length);
    for (let i = 0; i < totalCount; i++) {
      totalSum += data[i];
    }
    const rawVol = totalSum / (totalCount * 255);
    smoothVolRef.current = smoothVolRef.current * 0.85 + rawVol * 0.15;

    return {
      beat: smoothBeatRef.current,
      volume: smoothVolRef.current,
    };
  }, [audioRef]);

  return {
    audioCtxRef,
    gainRef,
    speakerGainRef,
    audioDestRef,
    audioFileLoadedRef,
    analyserRef,
    initAudioContext,
    updateGainAndFades,
    loadAudioFile,
    getAudioData,
  };
}
