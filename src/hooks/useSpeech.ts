import { useState, useEffect } from 'react';

export function useSpeech(calledTurn: any) {
//   function transformarCodigo(code: string) {
//     const letra = code.charAt(0);
//     const numero = parseInt(code.slice(1), 10);
//     return `Turno ${letra} ${numero}`;
//   }

    function transformarCodigo(code: string) {
        const letra = code.charAt(0);
        const numeroStr = code.slice(1);
        const numero = parseInt(numeroStr, 10);

        if (numero < 100) {
            // Si el número es menor a 100, decir "0 XX"
            console.log("turno menor de 100",numero)
            const num = parseInt(code.slice(2));
            return `Turno ${letra} 0 ${num}`;
        } else {
            return `Turno ${letra} ${numero}`;
        }
    }

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const voicesList = window.speechSynthesis.getVoices();
      if (voicesList.length) {
        setVoices(voicesList);
      }
    };

    loadVoices();

    // Algunos navegadores no cargan las voces al principio
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    if (!calledTurn || voices.length === 0) return;

    const synth = window.speechSynthesis;

    const selectedVoice = voices.find(
      (voice) =>
        voice.name === 'Google español de Estados Unidos'
    );

    const turnoLegible = transformarCodigo(calledTurn.code);
    const msg = new SpeechSynthesisUtterance(
        `${turnoLegible}, ${calledTurn.module?.name || calledTurn.moduleId}`
    );
    msg.voice = selectedVoice || voices.find(v => v.lang.startsWith('es')) || voices[0];
    msg.lang = 'es-ES';
    msg.rate = 0.8;

    synth.cancel(); // Detiene cualquier voz anterior
    synth.speak(msg);
  }, [calledTurn, voices]);
}
