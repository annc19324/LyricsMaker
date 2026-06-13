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

    source.connect(gain);
    gain.connect(speakerGain);
    speakerGain.connect(ctx.destination);
    gain.connect(dest);

    audioCtxRef.current = ctx;
    gainRef.current = gain;
    speakerGainRef.current = speakerGain;
    audioDestRef.current = dest;
    audioSourceRef.current = source;
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

  return {
    audioCtxRef,
    gainRef,
    speakerGainRef,
    audioDestRef,
    audioFileLoadedRef,
    initAudioContext,
    updateGainAndFades,
    loadAudioFile,
  };
}
