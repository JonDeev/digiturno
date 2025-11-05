// hooks/useSpeech.ts
import { useState, useEffect, useRef } from 'react';

export function useSpeech(calledTurns: any[]) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentSpokenTurn, setCurrentSpokenTurn] = useState<any>(null);
  const turnQueue = useRef<any[]>([]);
  const isSpeaking = useRef(false);

  // 🔑 AHORA guardamos eventos (id + calledCount), no sólo id
  const spokenEventKeys = useRef<Set<string>>(new Set());
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  const eventKey = (t: any) => `${t.id}:${t.calledCount ?? 0}`; // <-- CLAVE NUEVA

  function transformarCodigo(code: string) {
    const letra = code.charAt(0);
    const numero = parseInt(code.slice(1), 10);
    return numero < 100 ? `Turno ${letra} 0 ${numero}` : `Turno ${letra} ${numero}`;
  }

  const speakTurn = (turn: any, voice: SpeechSynthesisVoice) => {
    const texto = `${transformarCodigo(turn.code)}, ${turn.module?.name || `Módulo ${turn.moduleId}`}`;
    let repeat = 0;

    const speakOnce = () => {
      const msg = new SpeechSynthesisUtterance(texto);
      msg.voice = voice;
      msg.lang = 'es-ES';
      msg.rate = 0.8;

      const fallback = setTimeout(() => {
        console.warn('⚠️ speechSynthesis.onend no disparado, liberando isSpeaking manualmente');
        isSpeaking.current = false;
        setCurrentSpokenTurn(null);
        processQueue();
      }, 8000);

      msg.onend = () => {
        clearTimeout(fallback);
        repeat++;
        if (repeat < 3) {
          setTimeout(speakOnce, 600);
        } else {
          isSpeaking.current = false;
          setCurrentSpokenTurn(null);
          processQueue();
        }
      };

      msg.onerror = (err) => {
        console.error('❌ Error en speechSynthesis:', err);
        clearTimeout(fallback);
        isSpeaking.current = false;
        setCurrentSpokenTurn(null);
        processQueue();
      };

      console.log('🗣 Reproduciendo con voz:', msg.voice?.name);
      synth?.speak(msg);
    };

    isSpeaking.current = true;
    setCurrentSpokenTurn(turn);
    speakOnce();
  };

  const processQueue = () => {
    if (
      isSpeaking.current ||
      turnQueue.current.length === 0 ||
      voices.length === 0 ||
      localStorage.getItem('speechMaster') !== 'true'
    ) return;

    const nextTurn = turnQueue.current.shift();

    // ✅ Marcar evento como “ya hablado”
    spokenEventKeys.current.add(eventKey(nextTurn));

    const voice =
      voices.find(v => v.name === 'Google español de Estados Unidos') ||
      voices.find(v => v.lang.startsWith('es')) ||
      voices[0];

    console.log('🔊 Reproduciendo:', transformarCodigo(nextTurn.code), nextTurn.module?.name || nextTurn.moduleId);
    speakTurn(nextTurn, voice);
  };

  useEffect(() => {
    const tryLoadVoices = () => {
      const list = synth?.getVoices() || [];
      if (list.length) setVoices(list);
      else setTimeout(tryLoadVoices, 300);
    };
    tryLoadVoices();
    if (synth) synth.onvoiceschanged = tryLoadVoices;
  }, []);

  useEffect(() => {
    if (!Array.isArray(calledTurns) || voices.length === 0) return;

    // 🔁 Considera NUEVO evento si cambia calledCount (o calledAt si prefieres)
    const nuevosTurnos = [...calledTurns]
      .sort((a, b) => (new Date(a.calledAt || 0).getTime()) - (new Date(b.calledAt || 0).getTime())) // más viejos primero
      .filter(t => {
        const key = eventKey(t);
        const queued = turnQueue.current.some(q => eventKey(q) === key);
        return !spokenEventKeys.current.has(key) && !queued;
      });

    if (nuevosTurnos.length > 0) {
      console.log('🆕 Eventos nuevos:', nuevosTurnos.map(t => `${t.code} x${t.calledCount}`));
      turnQueue.current.push(...nuevosTurnos);
      processQueue();
    }
  }, [calledTurns, voices]);

  return {
    modalVisible: !!currentSpokenTurn,
    modalTurn: currentSpokenTurn,
  };
}
