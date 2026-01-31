import { useCallback } from 'react';

export const useHaptics = () => {
    const vibrate = useCallback((pattern: number | number[]) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }, []);

    const triggerSuccess = useCallback(() => {
        // Double short pulse
        vibrate([50, 50, 50]);
    }, [vibrate]);

    const triggerError = useCallback(() => {
        // One longer pulse
        vibrate(300);
    }, [vibrate]);

    const triggerSelection = useCallback(() => {
        // Very short tick
        vibrate(20);
    }, [vibrate]);

    return {
        triggerSuccess,
        triggerError,
        triggerSelection,
        vibrate
    };
};
