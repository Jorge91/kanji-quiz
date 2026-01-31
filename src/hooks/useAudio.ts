import { useCallback } from 'react';

export const useAudio = () => {
    const speak = useCallback((text: string) => {
        if (!window.speechSynthesis) return;

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';

        // Attempt to find a Japanese voice
        const voices = window.speechSynthesis.getVoices();
        const jaVoice = voices.find(v => v.lang.startsWith('ja'));
        if (jaVoice) {
            utterance.voice = jaVoice;
        }

        window.speechSynthesis.speak(utterance);
    }, []);

    return { speak };
};
