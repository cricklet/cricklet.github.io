// Chord note mapping
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const noteNamesFlat = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Major keys: C, F, Eb, G, Bb, Ab
const majorKeys = [
  { name: 'C', semitones: 0 },
  { name: 'F', semitones: 5 },
  { name: 'Eb', semitones: 3 },
  { name: 'G', semitones: 7 },
  { name: 'Bb', semitones: 10 },
  { name: 'Ab', semitones: 8 }
];

// Minor keys: Am, Dm, Cm, Em, Gm, Fm
const minorKeys = [
  { name: 'Am', semitones: 0 },
  { name: 'Dm', semitones: 5 },
  { name: 'Cm', semitones: 3 },
  { name: 'Em', semitones: 7 },
  { name: 'Gm', semitones: 10 },
  { name: 'Fm', semitones: 8 }
];

type KeyInfo = {
  name: string;
  isMinor: boolean;
  semitones: number | null;
};

type TargetKey = {
  name: string;
  semitones: number;
};

function parseNote(noteStr: string): number | null {
  // Remove whitespace and convert to uppercase
  noteStr = noteStr.trim().toUpperCase();
  
  // Handle common variations
  if (noteStr === 'DB') noteStr = 'C#';
  if (noteStr === 'EB') noteStr = 'D#';
  if (noteStr === 'GB') noteStr = 'F#';
  if (noteStr === 'AB') noteStr = 'G#';
  if (noteStr === 'BB') noteStr = 'A#';
  
  // Try to find in sharp names first
  let index = noteNames.indexOf(noteStr);
  if (index !== -1) return index;
  
  // Try flat names
  index = noteNamesFlat.indexOf(noteStr);
  if (index !== -1) return index;
  
  // Try single letter (C, D, E, F, G, A, B)
  const singleLetter = noteStr[0];
  const singleIndex = noteNames.indexOf(singleLetter);
  if (singleIndex !== -1) return singleIndex;
  
  return null;
}

function getNoteName(semitone: number, preferFlats: boolean = false): string {
  if (preferFlats) {
    return noteNamesFlat[semitone % 12];
  }
  return noteNames[semitone % 12];
}

function transposeChord(chord: string, semitones: number): string {
  // Match chord pattern: note name + optional modifiers
  // Examples: C, CM7, Eb 9, D b9 #11, Dm7 9, C 6 9
  const chordMatch = chord.match(/^([A-G][#b]?)(.*)$/i);
  
  if (!chordMatch) {
    // If it doesn't match a chord pattern, return as-is
    return chord;
  }
  
  const rootNote = chordMatch[1];
  const modifiers = chordMatch[2];
  
  const rootSemitone = parseNote(rootNote);
  if (rootSemitone === null) {
    return chord; // Can't parse, return as-is
  }
  
  const newSemitone = (rootSemitone + semitones) % 12;
  // Prefer flats for Eb, Bb, Ab keys
  const preferFlats = ['Eb', 'Bb', 'Ab', 'Cm', 'Gm', 'Fm'].some(key => 
    chord.includes(key) || semitones % 12 === 3 || semitones % 12 === 8 || semitones % 12 === 10
  );
  const newRoot = getNoteName(newSemitone, preferFlats);
  
  return newRoot + modifiers;
}

function transposeLine(line: string, semitones: number, targetKeyName?: string): string {
  // Split by | to preserve bar separators
  const parts = line.split('|');
  return parts.map(part => {
    // Find chord roots more carefully
    // Match patterns like: "C ", "C#", "Db ", "Eb 9", "Dm7", etc.
    // But NOT: "b9", "b13" (where 'b' is part of extension)
    // Strategy: match A-G (optionally with # or b) that is:
    // 1. At word boundary
    // 2. Followed by space, m/M, chord degree digit, or end of string
    // 3. NOT a standalone 'b' followed by digit
    
    let result = part;
    const regex = /\b([A-G][#b]?)(?=\s|$|[mM]|\d|sus|dim|aug|add|alt(?:\d|$|\s))/gi;
    let match;
    
    // Collect all matches first, then process in reverse order to maintain offsets
    const matches: Array<{match: string, rootNote: string, index: number}> = [];
    while ((match = regex.exec(part)) !== null) {
      matches.push({
        match: match[0],
        rootNote: match[1],
        index: match.index
      });
    }
    
    // Process matches in reverse order to maintain string indices
    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i];
      // Use original part for afterMatch check (before any replacements)
      const afterMatch = part.substring(m.index + m.match.length);
      
      // Skip if it's a standalone 'b' followed by a digit (part of extension like 'b9')
      if (m.match.length === 1 && m.match.toUpperCase() === 'B' && /^\s*\d/.test(afterMatch)) {
        continue; // Skip this match
      }
      
      // The regex lookahead already ensures we match valid chord patterns.
      // If the match is followed by 'm' or 'M', that's part of the chord quality (minor/major).
      // If it's followed by a digit directly (like '7' or '13'), that's also valid.
      // We should NOT skip these cases - they are valid chords to transpose.
      
      // Transpose the chord root
      const rootSemitone = parseNote(m.rootNote);
      if (rootSemitone === null) {
        continue; // Can't parse, skip
      }
      
      const newSemitone = (rootSemitone + semitones) % 12;
      // Prefer flats for: F, C, Eb, Bb, Ab (major) and Dm, Am, Cm, Gm, Fm (minor)
      // Also prefer flats for certain semitone intervals
      const preferFlats = 
        (targetKeyName && ['F', 'C', 'Eb', 'Bb', 'Ab', 'Dm', 'Am', 'Cm', 'Gm', 'Fm'].includes(targetKeyName)) ||
        semitones % 12 === 3 || semitones % 12 === 8 || semitones % 12 === 10;
      const newRoot = getNoteName(newSemitone, preferFlats);
      
      // Replace in the result string
      result = result.substring(0, m.index) + newRoot + result.substring(m.index + m.match.length);
    }

    // Keep bar-cell width when roots shorten (e.g. EbM7 -> CM7): pad at end through all extensions.
    if (result.length < part.length) {
      result += ' '.repeat(part.length - result.length);
    }

    return result;
  }).join('|');
}

function detectKey(input: string): KeyInfo | null {
  // Look for "in X" pattern
  const match = input.match(/in\s+([A-G][#bm]?)/i);
  if (!match) {
    return {
      name: 'C',
      isMinor: false,
      semitones: 0
    }
  }
  
  const keyStr = match[1].trim();
  const isMinor = /m$/i.test(keyStr);
  
  // Look up the semitones from the key arrays to ensure consistency
  const keyArrays = isMinor ? minorKeys : majorKeys;
  const keyEntry = keyArrays.find(k => k.name === keyStr);
  
  if (keyEntry) {
    return {
      name: keyStr,
      isMinor: isMinor,
      semitones: keyEntry.semitones
    };
  }
  
  // Fallback: if key not found in arrays, use parseNote
  const keyNote = keyStr.replace(/m$/i, '');
  return {
    name: keyStr,
    isMinor: isMinor,
    semitones: parseNote(keyNote)
  };
}

function transposeChart(input: string): string {
  // Convert "-" to "m" early in processing (e.g., "D-" -> "Dm", "C-7" -> "Cm7")
  // This handles both keys (e.g., "in D-") and chords (e.g., "D-7", "A-7b5")
  // Match note name (A-G, optionally with # or b) followed by "-"
  // The word boundary ensures we only match at the start of note names
  input = input.replace(/\b([A-G][#b]?)-/g, '$1m');
  
  const originalKey = detectKey(input);
  if (!originalKey || originalKey.semitones === null) {
    return 'Could not detect key. Please include "in X" at the start.';
  }
  
  const targetKeys: TargetKey[] = originalKey.isMinor ? minorKeys : majorKeys;
  const results: string[] = [];
  
  // Remove the "in X" line from the original, but preserve newlines
  // Match "in X" at the start of a line, optionally followed by newline
  if (input.startsWith('in ')) {
    // Delete the first line
    input = input.split('\n').slice(1).join('\n');
  }
  
  // Add the original input key first
  results.push(`in ${originalKey.name}\n${input}`);
  
  for (const targetKey of targetKeys) {
    // Skip if this is the original key (already printed above)
    if (targetKey.name === originalKey.name) {
      continue;
    }
    
    const semitones = (targetKey.semitones - originalKey.semitones + 12) % 12;

    const transposedLines = input.split('\n').map(line => {
      // Skip empty lines (but preserve them)
      if (!line.trim()) return line;
      
      // Transpose the line
      return transposeLine(line, semitones, targetKey.name);
    });
    
    results.push(`in ${targetKey.name}\n${transposedLines.join('\n')}`);
  }
  
  return results.join('\n\n');
}

function updateOutput() {
  const input = (document.getElementById('input-text') as HTMLTextAreaElement).value;
  const output = transposeChart(input);
  (document.getElementById('output-text') as HTMLTextAreaElement).value = output;
}

// Theme: 'auto' (default), 'light', or 'dark'. Auto follows system pref.
const STORAGE_THEME = 'transpose-theme';
type ThemePref = 'auto' | 'light' | 'dark';

function readThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(STORAGE_THEME);
    return v === 'light' || v === 'dark' ? v : 'auto';
  } catch (_) { return 'auto'; }
}
function resolvedTheme(): 'light' | 'dark' {
  const p = readThemePref();
  return p === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : p;
}
function applyTheme() {
  const pref = readThemePref();
  document.documentElement.setAttribute('data-theme', resolvedTheme());
  const btn = document.getElementById('theme-toggle') as HTMLButtonElement | null;
  if (btn) {
    btn.textContent = pref === 'auto' ? '◓' : pref === 'light' ? '◐' : '◑';
    btn.title = `Theme: ${pref}`;
  }
}
function setTheme(pref: ThemePref) {
  try {
    if (pref === 'auto') localStorage.removeItem(STORAGE_THEME);
    else localStorage.setItem(STORAGE_THEME, pref);
  } catch (_) {}
  applyTheme();
}
function toggleTheme() {
  const cur = readThemePref();
  setTheme(cur === 'auto' ? 'light' : cur === 'light' ? 'dark' : 'auto');
}
(window as any).toggleTheme = toggleTheme;

applyTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (readThemePref() === 'auto') applyTheme();
});

// Update output on input
document.getElementById('input-text')!.addEventListener('input', updateOutput);

// Load example on first load
window.addEventListener('load', function() {
  const example = `in C

CM7 9 13            | Eb 9
4th                   3rd

D b9 #11            | G 9 13
4th                   2nd

Dm7 9               | G 9 13     Db 9 b13
4th                   2nd        4th

C 6 9      A 9 13   | Ab 9 13    G 9 13
1st        2nd        "          "



`;
  
  const savedInput = localStorage.getItem('transpose-input');
  if (!savedInput) {
  (document.getElementById('input-text') as HTMLTextAreaElement).value = example;
  } else {
    (document.getElementById('input-text') as HTMLTextAreaElement).value = savedInput;
  }
  updateOutput();
});

// Save input to localStorage
document.getElementById('input-text')!.addEventListener('input', function() {
  localStorage.setItem('transpose-input', (this as HTMLTextAreaElement).value);
});
