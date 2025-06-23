import { useState, useEffect, useRef } from 'react';

export function useSpeech(calledTurns: any[]) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [currentSpokenTurn, setCurrentSpokenTurn] = useState<any>(null);
  const turnQueue = useRef<any[]>([]);
  const isSpeaking = useRef(false);
  const spokenTurnIds = useRef<Set<string>>(new Set());

  function transformarCodigo(code: string) {
    const letra = code.charAt(0);
    const numeroStr = code.slice(1);
    const numero = parseInt(numeroStr, 10);
    return numero < 100
      ? `Turno ${letra} 0 ${numero}`
      : `Turno ${letra} ${numero}`;
  }

  const speakTurn = (turn: any, voice: SpeechSynthesisVoice) => {
    const texto = `${transformarCodigo(turn.code)}, ${turn.module?.name || turn.moduleId}`;
    let count = 0;

    const speakOnce = () => {
      const msg = new SpeechSynthesisUtterance(texto);
      msg.voice = voice;
      msg.lang = 'es-ES';
      msg.rate = 0.8;

      // Fallback en caso de que onend nunca se dispare
      const fallback = setTimeout(() => {
        console.warn('⚠️ speechSynthesis.onend no disparado, liberando isSpeaking manualmente');
        isSpeaking.current = false;
        setCurrentSpokenTurn(null);
        processQueue();
      }, 6000);

      msg.onend = () => {
        clearTimeout(fallback);
        count++;
        if (count < 3) {
          setTimeout(speakOnce, 500);
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

      window.speechSynthesis.speak(msg);
    };

    setCurrentSpokenTurn(turn);
    window.speechSynthesis.cancel();
    speakOnce();
  };

  const processQueue = () => {
    console.log('🌀 Procesando cola...', {
      isSpeaking: isSpeaking.current,
      queueLength: turnQueue.current.length,
      voicesLength: voices.length,
    });

    if (isSpeaking.current || turnQueue.current.length === 0 || voices.length === 0) return;

    const nextTurn = turnQueue.current.shift();
    const voice =
      voices.find(v => v.name === 'Google español de Estados Unidos') ||
      voices.find(v => v.lang.startsWith('es')) ||
      voices[0];

    isSpeaking.current = true;
    spokenTurnIds.current.add(nextTurn.id);
    console.log('🔊 Reproduciendo:', transformarCodigo(nextTurn.code), nextTurn.module?.name || nextTurn.moduleId);
    speakTurn(nextTurn, voice);
  };

  useEffect(() => {
    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      if (list.length) setVoices(list);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    if (!Array.isArray(calledTurns) || voices.length === 0) return;

    const nuevosTurnos = [...calledTurns]
      .reverse() // más antiguos primero
      .filter(turn =>
        !spokenTurnIds.current.has(turn.id) &&
        !turnQueue.current.some(t => t.id === turn.id)
      );

    if (nuevosTurnos.length > 0) {
      console.log('🆕 Nuevos turnos en cola: \n', nuevosTurnos.map(t => t.code));
      turnQueue.current.push(...nuevosTurnos);
      processQueue();
    }
  }, [calledTurns, voices]);

  return {
    modalVisible: !!currentSpokenTurn,
    modalTurn: currentSpokenTurn,
  };
}
