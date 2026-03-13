import React from 'react';

// Common mapping for Group 1 verbs (U-verbs) to their 'I' stem for MASU form
const uToIMap: Record<string, string> = {
    'う': 'い',
    'く': 'き',
    'ぐ': 'ぎ',
    'す': 'し',
    'つ': 'ち',
    'ぬ': 'に',
    'ぶ': 'び',
    'む': 'み',
    'る': 'り',
};

/**
 * Converts a dictionary form verb to its MASU form based on its verb group.
 */
export const getMasuForm = (dictionaryForm: string, group: 1 | 2 | 3): string => {
    if (!dictionaryForm) return '';

    if (group === 3) {
        if (dictionaryForm === 'する') return 'します';
        if (dictionaryForm === '来る' || dictionaryForm === 'くる') return '来ます'; // Can be kanji or kana
        // Edge cases like compound verbs with する
        if (dictionaryForm.endsWith('する')) {
            return dictionaryForm.slice(0, -2) + 'します';
        }
        return dictionaryForm; // Fallback
    }

    if (group === 2) {
        // Drop the final 'る' and add 'ます'
        if (dictionaryForm.endsWith('る')) {
            return dictionaryForm.slice(0, -1) + 'ます';
        }
        return dictionaryForm; // Fallback
    }

    if (group === 1) {
        // Change the final 'u' sound to 'i' sound and add 'ます'
        const lastChar = dictionaryForm.slice(-1);
        const stemChar = uToIMap[lastChar];
        if (stemChar) {
            return dictionaryForm.slice(0, -1) + stemChar + 'ます';
        }
        return dictionaryForm; // Fallback
    }

    return dictionaryForm;
};

/**
 * Converts a dictionary form reading (kana) to its MASU form reading based on its verb group.
 */
export const getMasuReading = (reading: string, group: 1 | 2 | 3): string => {
    if (!reading) return '';

    if (group === 3) {
        if (reading === 'する') return 'します';
        if (reading === 'くる') return 'きます';
        if (reading.endsWith('する')) {
            return reading.slice(0, -2) + 'します';
        }
        return reading;
    }

    if (group === 2) {
        if (reading.endsWith('る')) {
            return reading.slice(0, -1) + 'ます';
        }
        return reading;
    }

    if (group === 1) {
        const lastChar = reading.slice(-1);
        const stemChar = uToIMap[lastChar];
        if (stemChar) {
            return reading.slice(0, -1) + stemChar + 'ます';
        }
        return reading;
    }

    return reading;
};

/**
 * Renders Japanese text with Furigana (<ruby>) tags if it contains Kanji.
 * Assumes okurigana (trailing kana) matches between the text and the reading.
 */
export const renderFurigana = (text: string, reading: string): React.ReactNode => {
    if (!text || !reading) return text;

    // If text is exactly the same as reading (e.g., kana-only verb), don't render ruby
    if (text === reading) return text;

    // Simple heuristic to split stem (Kanji) from okurigana (Kana)
    // Find the common trailing suffix (okurigana)
    let okurigana = '';
    let i = text.length - 1;
    let j = reading.length - 1;

    while (i >= 0 && j >= 0 && text[i] === reading[j]) {
        okurigana = text[i] + okurigana;
        i--;
        j--;
    }

    const kanjiPart = text.slice(0, i + 1);
    const readingPart = reading.slice(0, j + 1);

    // If there is no kanji part identified, return as string
    if (!kanjiPart) return text;

    return (
        <ruby>
            {kanjiPart}
            <rt>{readingPart}</rt>
            {okurigana}
        </ruby>
    );
};
