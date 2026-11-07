/**
 * Morse Code Dictionary and Classified Vocabulary Data
 */

const MORSE_CODE_MAP = {
    'A': '.-',    'B': '-...',  'C': '-.-.',  'D': '-..',   'E': '.',
    'F': '..-.',  'G': '--.',   'H': '....',  'I': '..',    'J': '.---',
    'K': '-.-',   'L': '.-..',  'M': '--',    'N': '-.',    'O': '---',
    'P': '.--.',  'Q': '--.-',  'R': '.-.',   'S': '...',   'T': '-',
    'U': '..-',   'V': '...-',  'W': '.--',   'X': '-..-',  'Y': '-.--',
    'Z': '--..',  '0': '-----', '1': '.----', '2': '..---', '3': '...--',
    '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
    '9': '----.'
};

// Reverse map for lookup if needed
const REVERSE_MORSE_MAP = Object.fromEntries(
    Object.entries(MORSE_CODE_MAP).map(([letter, morse]) => [morse, letter])
);

// Vocabulary sets categorized by security clearance (difficulty)
const TRANSMISSION_DATABASE = {
    novice: [
        "A", "B", "C", "D", "E", "F", "G", "H",
        "I", "J", "K", "L", "M", "N", "O", "P",
        "Q", "R", "S", "T", "U", "V", "W", "X" , "Y", "Z"
    ],
    agent: [
        "BUNKER", "COBALT", "CIPHER", "MISSILE", "SPUTNIK", "SHADOW",
        "LAZARUS", "RADAR", "TARGET", "BEACON", "VECTOR", "CLASSIFIED",
        "PROTOCOL", "STEALTH", "OUTPOST", "PATRIOT", "SENTINEL", "COMMAND"
    ],
    master: [
        "AGENT 007", "DEFCON 1", "RED ALERT 99", "SECTOR 7G",
        "APOLLO 11", "NUCLEAR BEACON", "LAUNCH PROTOCOL",
        "PROJECT CYCLOPS", "TACTICAL NUKES", "CIPHER DECRYPT 42"
    ]
};

/**
 * Encodes plain text string to Morse code representation
 * E.g. "SOS" -> "... --- ..."
 * E.g. "RED WAR" -> ".-. . -.. / .-- .- .-."
 */
function textToMorse(text) {
    const cleanText = text.toUpperCase().trim();
    const words = cleanText.split(' ');
    
    const morseWords = words.map(word => {
        return word.split('')
            .map(char => MORSE_CODE_MAP[char] || char)
            .join(' ');
    });

    return morseWords.join(' / ');
}

/**
 * Returns security clearance rank based on score
 */
function getClearanceRank(score) {
    if (score < 300) return { title: "SECTOR JANITOR", security: "UNCLEARED", status: "TERMINATED IN DISGRACE" };
    if (score < 800) return { title: "DECODER TRAINEE", security: "CONFIDENTIAL", status: "REPLACED BY MACHINE" };
    if (score < 1500) return { title: "INTERCEPT OFFICER", security: "SECRET", status: "HONORABLE SACRIFICE" };
    if (score < 2500) return { title: "SENIOR CRYPTOGRAPHER", security: "TOP SECRET", status: "KILLED AT DESK" };
    if (score < 4000) return { title: "SPECIAL AGENT", security: "ULTRA TOP SECRET", status: "LEGEND OF SECTOR 7G" };
    return { title: "FACILITY DIRECTOR", security: "EYES ONLY", status: "GOD OF MORSE CODE" };
}

window.morseUtils = {
    MORSE_CODE_MAP,
    REVERSE_MORSE_MAP,
    TRANSMISSION_DATABASE,
    textToMorse,
    getClearanceRank
};
