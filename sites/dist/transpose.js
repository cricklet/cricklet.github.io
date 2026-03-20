"use strict";
(() => {
  // transpose.ts
  var noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  var noteNamesFlat = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
  var majorKeys = [
    { name: "C", semitones: 0 },
    { name: "F", semitones: 5 },
    { name: "Eb", semitones: 3 },
    { name: "G", semitones: 7 },
    { name: "Bb", semitones: 10 },
    { name: "Ab", semitones: 8 }
  ];
  var minorKeys = [
    { name: "Am", semitones: 0 },
    { name: "Dm", semitones: 5 },
    { name: "Cm", semitones: 3 },
    { name: "Em", semitones: 7 },
    { name: "Gm", semitones: 10 },
    { name: "Fm", semitones: 8 }
  ];
  function parseNote(noteStr) {
    noteStr = noteStr.trim().toUpperCase();
    if (noteStr === "DB") noteStr = "C#";
    if (noteStr === "EB") noteStr = "D#";
    if (noteStr === "GB") noteStr = "F#";
    if (noteStr === "AB") noteStr = "G#";
    if (noteStr === "BB") noteStr = "A#";
    let index = noteNames.indexOf(noteStr);
    if (index !== -1) return index;
    index = noteNamesFlat.indexOf(noteStr);
    if (index !== -1) return index;
    const singleLetter = noteStr[0];
    const singleIndex = noteNames.indexOf(singleLetter);
    if (singleIndex !== -1) return singleIndex;
    return null;
  }
  function getNoteName(semitone, preferFlats = false) {
    if (preferFlats) {
      return noteNamesFlat[semitone % 12];
    }
    return noteNames[semitone % 12];
  }
  function transposeLine(line, semitones, targetKeyName) {
    const parts = line.split("|");
    return parts.map((part) => {
      let result = part;
      const regex = /\b([A-G][#b]?)(?=\s|$|[mM]|\d|sus|dim|aug|add|alt(?:\d|$|\s))/gi;
      let match;
      const matches = [];
      while ((match = regex.exec(part)) !== null) {
        matches.push({
          match: match[0],
          rootNote: match[1],
          index: match.index
        });
      }
      for (let i = matches.length - 1; i >= 0; i--) {
        const m = matches[i];
        const afterMatch = part.substring(m.index + m.match.length);
        if (m.match.length === 1 && m.match.toUpperCase() === "B" && /^\s*\d/.test(afterMatch)) {
          continue;
        }
        const rootSemitone = parseNote(m.rootNote);
        if (rootSemitone === null) {
          continue;
        }
        const newSemitone = (rootSemitone + semitones) % 12;
        const preferFlats = targetKeyName && ["F", "C", "Eb", "Bb", "Ab", "Dm", "Am", "Cm", "Gm", "Fm"].includes(targetKeyName) || semitones % 12 === 3 || semitones % 12 === 8 || semitones % 12 === 10;
        const newRoot = getNoteName(newSemitone, preferFlats);
        result = result.substring(0, m.index) + newRoot + result.substring(m.index + m.match.length);
      }
      if (result.length < part.length) {
        result += " ".repeat(part.length - result.length);
      }
      return result;
    }).join("|");
  }
  function detectKey(input) {
    const match = input.match(/in\s+([A-G][#bm]?)/i);
    if (!match) {
      return {
        name: "C",
        isMinor: false,
        semitones: 0
      };
    }
    const keyStr = match[1].trim();
    const isMinor = /m$/i.test(keyStr);
    const keyArrays = isMinor ? minorKeys : majorKeys;
    const keyEntry = keyArrays.find((k) => k.name === keyStr);
    if (keyEntry) {
      return {
        name: keyStr,
        isMinor,
        semitones: keyEntry.semitones
      };
    }
    const keyNote = keyStr.replace(/m$/i, "");
    return {
      name: keyStr,
      isMinor,
      semitones: parseNote(keyNote)
    };
  }
  function transposeChart(input) {
    input = input.replace(/\b([A-G][#b]?)-/g, "$1m");
    const originalKey = detectKey(input);
    if (!originalKey || originalKey.semitones === null) {
      return 'Could not detect key. Please include "in X" at the start.';
    }
    const targetKeys = originalKey.isMinor ? minorKeys : majorKeys;
    const results = [];
    if (input.startsWith("in ")) {
      input = input.split("\n").slice(1).join("\n");
    }
    results.push(`in ${originalKey.name}
${input}`);
    for (const targetKey of targetKeys) {
      if (targetKey.name === originalKey.name) {
        continue;
      }
      const semitones = (targetKey.semitones - originalKey.semitones + 12) % 12;
      const transposedLines = input.split("\n").map((line) => {
        if (!line.trim()) return line;
        return transposeLine(line, semitones, targetKey.name);
      });
      results.push(`in ${targetKey.name}
${transposedLines.join("\n")}`);
    }
    return results.join("\n\n");
  }
  function updateOutput() {
    const input = document.getElementById("input-text").value;
    const output = transposeChart(input);
    document.getElementById("output-text").value = output;
  }
  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const toggle = document.getElementById("theme-toggle");
    toggle.textContent = theme === "light" ? "\u25D0" : "\u25D1";
    localStorage.setItem("transpose-theme", theme);
  }
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
  }
  window.toggleTheme = toggleTheme;
  var savedTheme = localStorage.getItem("transpose-theme");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var initialTheme = savedTheme || (prefersDark ? "dark" : "light");
  setTheme(initialTheme);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (!localStorage.getItem("transpose-theme")) {
      setTheme(e.matches ? "dark" : "light");
    }
  });
  document.getElementById("input-text").addEventListener("input", updateOutput);
  window.addEventListener("load", function() {
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
    const savedInput = localStorage.getItem("transpose-input");
    if (!savedInput) {
      document.getElementById("input-text").value = example;
    } else {
      document.getElementById("input-text").value = savedInput;
    }
    updateOutput();
  });
  document.getElementById("input-text").addEventListener("input", function() {
    localStorage.setItem("transpose-input", this.value);
  });
})();
