import { PitchDetector } from 'pitchy';

declare const Vex: any;

const NOTE_NAMES_SHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const NOTE_NAMES_FLAT  = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];

const VF_SHARP = [
  { key: 'c',  acc: null }, { key: 'c#', acc: '#'  }, { key: 'd',  acc: null },
  { key: 'd#', acc: '#'  }, { key: 'e',  acc: null }, { key: 'f',  acc: null },
  { key: 'f#', acc: '#'  }, { key: 'g',  acc: null }, { key: 'g#', acc: '#'  },
  { key: 'a',  acc: null }, { key: 'a#', acc: '#'  }, { key: 'b',  acc: null },
];
const VF_FLAT = [
  { key: 'c',  acc: null }, { key: 'db', acc: 'b'  }, { key: 'd',  acc: null },
  { key: 'eb', acc: 'b'  }, { key: 'e',  acc: null }, { key: 'f',  acc: null },
  { key: 'gb', acc: 'b'  }, { key: 'g',  acc: null }, { key: 'ab', acc: 'b'  },
  { key: 'a',  acc: null }, { key: 'bb', acc: 'b'  }, { key: 'b',  acc: null },
];

type NoteInfo = { letter: string; accidental: string; octave: number; cents: number };

// Settings
let useFlats     = false;   // auto-synced to trumpetMode
let trumpetMode  = false;
let sinewaveMode = false;   // theoretical trumpet tuning; only active when trumpetMode is on

// Theoretical Bb trumpet intonation offsets (cents from ET), keyed by written MIDI.
// Sources: harmonic series physics + valve-combination mechanical sharpness.
// Low Gb3/G3/Db4/D4 (1-3 and 1-2-3 combos) assumed slide-corrected by player → 0¢ (no entry).
const TRUMPET_OFFSETS: Record<number, number> = {
  // ── below the staff ──────────────────────────────────────
  // F#3/Gb3 (54): 1-2-3, normally ~+35¢ — slide corrected → 0
  // G3      (55): 1-3,   normally ~+27¢ — slide corrected → 0
  56: +12,  // Ab3  — 2-3
  57:  +5,  // A3   — 1-2
  58:  +5,  // Bb3  — 1st valve
  // B3 (59): 2nd valve, ~0¢
  // C4 (60): open, ~0¢

  // ── in the staff ─────────────────────────────────────────
  // C#4/Db4 (61): 1-2-3, normally ~+35¢ — slide corrected → 0
  // D4      (62): 1-3,   normally ~+27¢ — slide corrected → 0
  63: +12,  // Eb4  — 2-3
  64:  +5,  // E4   — 1-2
  65:  +5,  // F4   — 1st valve
  // F#4 (66): 2nd valve, ~0¢
  67:  +2,  // G4   — open (3rd partial of Bb series)
  68: +10,  // Ab4  — 2-3
  69:  +5,  // A4   — 1-2
  70:  +5,  // Bb4  — 1st valve
  // B4 (71): 2nd valve, ~0¢
  // C5 (72): open, ~0¢

  // ── top of staff and above ────────────────────────────────
  73:  +5,  // C#5  — 1-2
  74:  +7,  // D5   — 1st valve (+5 to +10¢)
  75: +10,  // Eb5  — 2-3
  76: -14,  // E5   — open (5th partial of Bb series) ← the famous flat note
  77:  +5,  // F5   — 1st valve
  // F#5 (78): 2nd valve, ~0¢
  79:  +2,  // G5   — open (6th partial of Bb series)
  80: +10,  // Ab5  — 2-3
  81:  +5,  // A5   — 1-2
  82:  +5,  // Bb5  — 1st valve (open 7th partial ≈−31¢ is unusable, never used)
  // B5 (83): 2nd valve, ~0¢
  84:  +2,  // C6   — open
};

// dB meter
const DB_MIN = -60;
const DB_MAX = -10;
let dbThreshold = -40;

// Audio
let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let detector: PitchDetector<Float32Array> | null = null;
let started = false;
let currentStream: MediaStream | null = null;
let currentSource: MediaStreamAudioSourceNode | null = null;
let selectedDeviceId = '';   // '' → browser default; persisted

// Last detected state
let lastConcertMidi: number | null = null;
let lastCents: number | null = null;
const centsHistory: Array<{ t: number; midi: number; cents: number }> = [];
let lastFreq: number | null = null;
let noSignalFrames = 0;
const NO_SIGNAL_THRESHOLD = 12;

// Stopwatch — uses Date.now() wall-clock so elapsed time survives page reloads
let stopwatchStartTime: number | null = null;   // Date.now() timestamp
let stopwatchOffsetMs = 0;                       // accumulated ms before current run

// Staff render throttle — key encodes midi + tuning color bucket
let staffRenderedKey = 'dirty';

function lerpRgb(a: [number,number,number], b: [number,number,number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

// Returns a color that is neutral when in-tune, shading to bright blue (flat) or bright red (sharp).
// In-tune zone (≤5¢): neutral. 5–30¢: dark→bright. ≥30¢: full bright.
function tuningColor(cents: number | null, alpha = 1): string {
  if (cents === null || Math.abs(cents) <= 5) {
    const [r, g, b] = [50, 200, 100];
    return alpha === 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alpha})`;
  }
  const TEAL_DARK:  [number,number,number] = [160, 130,   0];
  const TEAL_BRIGHT:[number,number,number] = [255, 210,   0];
  const RED_DARK:   [number,number,number] = [160, 20,  20];
  const RED_BRIGHT: [number,number,number] = [255, 55,  55];
  const t = Math.min(1, (Math.abs(cents) - 5) / 25);  // 0 at 5¢, 1 at 30¢
  const color = cents < 0
    ? lerpRgb(TEAL_DARK, TEAL_BRIGHT, t)
    : lerpRgb(RED_DARK,  RED_BRIGHT,  t);
  if (alpha === 1) return color;
  // parse rgb(...) → rgba(...)
  return color.replace('rgb(', 'rgba(').replace(')', `,${alpha})`);
}

function staffKey(midi: number | null, cents: number | null): string {
  if (midi === null) return 'null';
  // Quantize to 2-cent steps so re-renders are frequent but not every frame
  const q = cents === null ? 'n' : Math.round(cents / 2);
  return `${midi}:${q}`;
}

// DOM refs
const canvas         = document.getElementById('meter-canvas') as HTMLCanvasElement;
const noteLetter     = document.getElementById('note-letter')!;
const noteAccidental = document.getElementById('note-accidental')!;
const noteOctave     = document.getElementById('note-octave')!;
const freqDisplay    = document.getElementById('freq-display')!;
const centsDisplay   = document.getElementById('cents-display')!;
const statusHint     = document.getElementById('status-hint')!;
const trumpetBtn      = document.getElementById('trumpet-btn')!;
const sinewaveBtn     = document.getElementById('sinewave-btn')!;
const accidentalsBtn  = document.getElementById('accidentals-btn')!;
const playbackBtn     = document.getElementById('playback-btn')!;
const playbackVolume        = document.getElementById('playback-volume')!;
const playbackVolumeFill    = document.getElementById('playback-volume-fill')!;
const playbackVolumeReadout = document.getElementById('playback-volume-readout')!;
const tunerLeft      = document.getElementById('tuner-left')!;
const dbGraphCanvas  = document.getElementById('db-graph-canvas') as HTMLCanvasElement;
const deviceSelect   = document.getElementById('device-select') as HTMLSelectElement;

// ── Helpers ────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }

function dbToFrac(db: number) { return clamp((db - DB_MIN) / (DB_MAX - DB_MIN), 0, 1); }
function fracToDb(f: number)  { return DB_MIN + clamp(f, 0, 1) * (DB_MAX - DB_MIN); }

function computeDb(buf: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  const rms = Math.sqrt(sum / buf.length);
  return rms > 0 ? clamp(20 * Math.log10(rms), DB_MIN, 0) : DB_MIN;
}

function freqToConcertMidi(freq: number): { midi: number; cents: number } {
  const exact = 12 * Math.log2(freq / 440) + 69;
  const midi  = Math.round(exact);
  return { midi, cents: Math.round((exact - midi) * 100) };
}

function midiToNoteInfo(displayMidi: number, cents: number): NoteInfo {
  const idx    = ((displayMidi % 12) + 12) % 12;
  const octave = Math.floor(displayMidi / 12) - 1;
  const name   = (useFlats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP)[idx];
  return { letter: name[0], accidental: name.slice(1), octave, cents };
}

function currentDisplayMidi(): number | null {
  return lastConcertMidi === null ? null : lastConcertMidi + (trumpetMode ? 2 : 0);
}

// dB graph history
const dbRawSamples:  Array<{ t: number; db: number }> = [];
const dbAvgHistory:  Array<{ t: number; db: number }> = [];

function gaussianCents(midi: number, rawCents: number): number {
  const now = performance.now();
  centsHistory.push({ t: now, midi, cents: rawCents });
  const cut = now - 250;
  while (centsHistory.length > 1 && centsHistory[0].t < cut) centsHistory.shift();
  const sigma = 80;
  let wSum = 0, wTotal = 0;
  for (const s of centsHistory) {
    if (s.midi !== midi) continue;
    const dt = now - s.t;
    const w = Math.exp(-(dt * dt) / (2 * sigma * sigma));
    wSum += w * s.cents; wTotal += w;
  }
  return wTotal > 0 ? Math.round(wSum / wTotal) : rawCents;
}

// ── dB meter ───────────────────────────────────────────────────────────────

function updateDbDisplay(_currentDb: number) { }

function updateDbGraph(db: number) {
  const now = performance.now();
  dbRawSamples.push({ t: now, db });
  const cut = now - 1000;
  while (dbRawSamples.length > 1 && dbRawSamples[0].t < cut) dbRawSamples.shift();
  const sigma = 300;
  let wSum = 0, wTotal = 0;
  for (const s of dbRawSamples) {
    const dt = now - s.t;
    const w = Math.exp(-(dt * dt) / (2 * sigma * sigma));
    wSum += w * s.db; wTotal += w;
  }
  const avg = wTotal > 0 ? wSum / wTotal : db;
  dbAvgHistory.push({ t: now, db: avg });
  const cut20 = now - 20000;
  while (dbAvgHistory.length > 1 && dbAvgHistory[0].t < cut20) dbAvgHistory.shift();
  drawDbGraph();
}

function drawDbGraph() {
  const w = dbGraphCanvas.clientWidth;
  const h = dbGraphCanvas.clientHeight;
  if (w === 0 || h === 0) return;
  dbGraphCanvas.width = w;
  dbGraphCanvas.height = h;
  const ctx = dbGraphCanvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  const graphH = h / 3;
  const now = performance.now();
  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const xOf = (t: number) => ((t - (now - 10000)) / 10000) * w;
  const yOf = (v: number) => h - dbToFrac(v) * graphH;

  if (dbAvgHistory.length >= 2) {
    const fillColor   = isDark ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.025)';
    const strokeColor = isDark ? 'rgba(255,255,255,0.12)'  : 'rgba(0,0,0,0.09)';
    const x0 = xOf(dbAvgHistory[0].t);
    const y0 = yOf(dbAvgHistory[0].db);
    ctx.beginPath();
    ctx.moveTo(x0, h);
    ctx.lineTo(x0, y0);
    for (let i = 1; i < dbAvgHistory.length; i++)
      ctx.lineTo(xOf(dbAvgHistory[i].t), yOf(dbAvgHistory[i].db));
    ctx.lineTo(xOf(dbAvgHistory[dbAvgHistory.length - 1].t), h);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    for (let i = 1; i < dbAvgHistory.length; i++)
      ctx.lineTo(xOf(dbAvgHistory[i].t), yOf(dbAvgHistory[i].db));
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Local-max labels — wider neighborhood so only real peaks qualify
    const halfWin = 20;
    ctx.font = '10px "Reddit Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
    let lastMaxT = -Infinity;
    for (let i = halfWin; i < dbAvgHistory.length - halfWin; i++) {
      const { t, db } = dbAvgHistory[i];
      if (db <= dbThreshold) continue;
      if (now - t < 2000) continue;
      const x = xOf(t);
      if (x < 0 || x > w || t - lastMaxT < 800) continue;
      let isPeak = true;
      for (let j = i - halfWin; j <= i + halfWin && isPeak; j++)
        if (j !== i && dbAvgHistory[j].db >= db) isPeak = false;
      if (isPeak) { ctx.fillText(`${Math.round(db)}`, x, yOf(db) - 5); lastMaxT = t; }
    }
  }

  // Threshold dashed line (always visible)
  const threshY = yOf(dbThreshold);
  ctx.beginPath();
  ctx.moveTo(0, threshY);
  ctx.lineTo(w, threshY);
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 5]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function setDbThreshold(db: number) {
  dbThreshold = clamp(db, DB_MIN, DB_MAX);
  drawDbGraph();
  try { localStorage.setItem('tuner_db_threshold', String(dbThreshold)); } catch (_) {}
}

let dbDragging = false;

function threshFromPointer(clientY: number, r: DOMRect) {
  const graphH = r.height / 3;
  return fracToDb(clamp((r.top + r.height - clientY) / graphH, 0, 1));
}

tunerLeft.addEventListener('pointerdown', e => {
  const r = tunerLeft.getBoundingClientRect();
  if (e.clientY < r.top + r.height * 2 / 3) return;
  tunerLeft.setPointerCapture(e.pointerId);
  dbDragging = true;
  setDbThreshold(threshFromPointer(e.clientY, r));
});
tunerLeft.addEventListener('pointermove', e => {
  if (!dbDragging) return;
  setDbThreshold(threshFromPointer(e.clientY, tunerLeft.getBoundingClientRect()));
});
tunerLeft.addEventListener('pointerup',     () => { dbDragging = false; });
tunerLeft.addEventListener('pointercancel', () => { dbDragging = false; });

// ── Meter canvas ───────────────────────────────────────────────────────────

function drawMeter(cents: number | null) {
  const w = canvas.width, h = canvas.height;
  const ctx2d = canvas.getContext('2d')!;
  ctx2d.clearRect(0, 0, w, h);

  const cx = w / 2, cy = h, r = h * 0.88;
  const isDark      = document.documentElement.getAttribute('data-theme') !== 'light';
  const arcColor    = isDark ? 'rgba(128,128,128,0.2)'   : 'rgba(128,128,128,0.28)';
  const tickColor   = isDark ? 'rgba(180,180,180,0.45)'  : 'rgba(80,80,80,0.4)';
  const tickMajColor = isDark ? 'rgba(200,200,200,0.65)' : 'rgba(60,60,60,0.55)';
  const pivotColor  = isDark ? 'rgba(150,150,150,0.5)'   : 'rgba(100,100,100,0.5)';

  ctx2d.beginPath();
  ctx2d.arc(cx, cy, r, Math.PI, 0, false);
  ctx2d.strokeStyle = arcColor;
  ctx2d.lineWidth = 3;
  ctx2d.stroke();

  const gs = (5 / 50) * (Math.PI / 2);
  ctx2d.beginPath();
  ctx2d.arc(cx, cy, r, -Math.PI / 2 - gs, -Math.PI / 2 + gs, false);
  ctx2d.strokeStyle = 'rgba(50,200,100,0.3)';
  ctx2d.lineWidth = 12;
  ctx2d.stroke();

  for (const c of [-50, -25, 0, 25, 50]) {
    const major = c % 50 === 0 || c === 0;
    const angle = -Math.PI / 2 + (c / 50) * (Math.PI / 2);
    const inner = r - (major ? 18 : 12), outer = r + (major ? 8 : 5);
    ctx2d.beginPath();
    ctx2d.moveTo(cx + inner * Math.cos(angle), cy + inner * Math.sin(angle));
    ctx2d.lineTo(cx + outer * Math.cos(angle), cy + outer * Math.sin(angle));
    ctx2d.strokeStyle = major ? tickMajColor : tickColor;
    ctx2d.lineWidth = major ? 1.5 : 1;
    ctx2d.stroke();
  }

  if (cents !== null) {
    const clamped = clamp(cents, -50, 50);
    const angle = -Math.PI / 2 + (clamped / 50) * (Math.PI / 2);
    const abs = Math.abs(cents);
    ctx2d.beginPath();
    ctx2d.moveTo(cx, cy);
    ctx2d.lineTo(cx + (r - 22) * Math.cos(angle), cy + (r - 22) * Math.sin(angle));
    ctx2d.strokeStyle = tuningColor(cents);
    ctx2d.lineWidth = 2.5;
    ctx2d.lineCap = 'round';
    ctx2d.stroke();
  }

  ctx2d.beginPath();
  ctx2d.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx2d.fillStyle = pivotColor;
  ctx2d.fill();
}

// ── VexFlow staff ──────────────────────────────────────────────────────────

function renderStaff(midi: number | null, cents: number | null) {
  const key = staffKey(midi, cents);
  if (key === staffRenderedKey) return;
  staffRenderedKey = key;

  if (typeof Vex === 'undefined') return;
  const container = document.getElementById('staff-container')!;
  container.innerHTML = '';

  const W = container.clientWidth  || 150;
  const H = container.clientHeight || 220;
  const { Renderer, Stave, StaveNote, Formatter, Accidental } = Vex.Flow;

  // Draw at a reduced scale so the notation is smaller within the same panel.
  // Layout is computed in the unscaled "virtual" coordinate space (VW × VH) so
  // the staff stays centered after the context scale is applied.
  const STAFF_SCALE = 0.8;
  const VW = W / STAFF_SCALE;
  const VH = H / STAFF_SCALE;

  const STAVE_W = clamp(VW - 16, 80, VW);
  const staveX  = (VW - STAVE_W) / 2;
  const staveY  = (VH - 40) / 2;

  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(W, H);
  const vctx = renderer.getContext();
  vctx.scale(STAFF_SCALE, STAFF_SCALE);

  const themeColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--text-color').trim() || 'rgba(255,255,255,0.87)';
  vctx.setFillStyle(themeColor);
  vctx.setStrokeStyle(themeColor);

  const stave = new Stave(staveX, staveY, STAVE_W);
  stave.addClef('treble');
  stave.setContext(vctx).draw();

  if (midi === null) return;

  const noteColor = tuningColor(cents);
  vctx.setFillStyle(noteColor);
  vctx.setStrokeStyle(noteColor);

  const vfMap = useFlats ? VF_FLAT : VF_SHARP;
  const { key: noteKey, acc } = vfMap[((midi % 12) + 12) % 12];
  const keyStr = `${noteKey}/${Math.floor(midi / 12) - 1}`;

  try {
    const staveNote = new StaveNote({ keys: [keyStr], duration: 'w' });
    if (acc) staveNote.addModifier(new Accidental(acc), 0);
    Formatter.FormatAndDraw(vctx, stave, [staveNote]);
  } catch (_) {}
}

// ── Note display ───────────────────────────────────────────────────────────

function updateDisplay(info: NoteInfo | null, freq?: number) {
  if (!info) {
    noteLetter.textContent = '—';
    noteAccidental.textContent = '';
    noteOctave.textContent = '';
    freqDisplay.textContent = '';
    centsDisplay.textContent = '';
    centsDisplay.style.color = '';
    return;
  }
  noteLetter.textContent = info.letter;
  noteAccidental.textContent = info.accidental;
  noteOctave.textContent = String(info.octave);
  if (freq !== undefined) freqDisplay.textContent = `${freq.toFixed(1)} Hz`;
  const sign = info.cents > 0 ? '+' : '';
  centsDisplay.textContent = `${sign}${info.cents} cents`;
  centsDisplay.style.color = tuningColor(info.cents);
}

function displayCents(rawCents: number, displayMidi: number): number {
  return rawCents - (sinewaveMode ? (TRUMPET_OFFSETS[displayMidi] ?? 0) : 0);
}

function rerenderCurrent() {
  staffRenderedKey = 'dirty';
  const dm = currentDisplayMidi();
  if (dm === null || lastCents === null) {
    updateDisplay(null);
    drawMeter(null);
    renderStaff(null, null);
  } else {
    const dc = displayCents(lastCents, dm);
    updateDisplay(midiToNoteInfo(dm, dc), lastFreq ?? undefined);
    drawMeter(dc);
    renderStaff(dm, dc);
  }
}

// ── Stopwatch ──────────────────────────────────────────────────────────────

function saveStopwatchState() {
  try {
    if (stopwatchStartTime !== null) {
      localStorage.setItem('tuner_stopwatch_startTime', String(stopwatchStartTime));
      localStorage.setItem('tuner_stopwatch_offsetMs', String(stopwatchOffsetMs));
    } else {
      localStorage.removeItem('tuner_stopwatch_startTime');
      localStorage.setItem('tuner_stopwatch_offsetMs', String(stopwatchOffsetMs));
    }
  } catch (_) {}
}

function loadStopwatchState() {
  try {
    const savedStart  = localStorage.getItem('tuner_stopwatch_startTime');
    const savedOffset = localStorage.getItem('tuner_stopwatch_offsetMs');
    if (savedStart !== null && savedOffset !== null) {
      const now = Date.now();
      stopwatchOffsetMs  = parseFloat(savedOffset) + (now - parseInt(savedStart));
      stopwatchStartTime = now;
    }
  } catch (_) {}
}

function formatStopwatch(): string {
  const ms = stopwatchOffsetMs + (stopwatchStartTime !== null ? Date.now() - stopwatchStartTime : 0);
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function resetStopwatch() {
  stopwatchOffsetMs  = 0;
  stopwatchStartTime = started ? Date.now() : null;
  saveStopwatchState();
}

// ── Pitch detection loop ───────────────────────────────────────────────────

function tick() {
  if (!analyser || !detector || !audioCtx) return;

  const input = new Float32Array(detector.inputLength);
  analyser.getFloatTimeDomainData(input);

  statusHint.textContent = formatStopwatch();

  const currentDb = computeDb(input);
  updateDbDisplay(currentDb);
  updateDbGraph(currentDb);

  const [freq, clarity] = detector.findPitch(input, audioCtx.sampleRate);
  const loud = currentDb > dbThreshold;

  if (loud && clarity > 0.9 && freq > 60 && freq < 5000) {
    noSignalFrames = 0;
    const { midi, cents } = freqToConcertMidi(freq);
    lastConcertMidi = midi;
    lastCents = gaussianCents(midi, cents);
    lastFreq = freq;
    const dm = midi + (trumpetMode ? 2 : 0);
    const dc = displayCents(lastCents, dm);
    updateDisplay(midiToNoteInfo(dm, dc), freq);
    drawMeter(dc);
    renderStaff(dm, dc);
    // Only sound playback within the main trumpet range: written G3–C6
    // (concert F3–Bb5). Written note = concert + 2 for a Bb trumpet.
    const writtenMidi = midi + 2;
    if (writtenMidi >= 55 && writtenMidi <= 84) updatePlayback(midi);
    else updatePlayback(null);
  } else {
    noSignalFrames++;
    if (noSignalFrames > 2) updatePlayback(null);
    if (noSignalFrames > NO_SIGNAL_THRESHOLD) {
      lastConcertMidi = null;
      lastCents = null;
      lastFreq = null;
      updateDisplay(null);
      drawMeter(null);
      renderStaff(null, null);
    }
  }

  requestAnimationFrame(tick);
}

// All processing disabled: echoCancellation defaults to ON in Chrome and its
// adaptive filter uses audioCtx.destination as a reference signal — when
// playback mode is on and the user is on headphones (no real echo path), the
// filter chases a phantom signal and bleeds artifacts into the mic stream,
// causing the dB graph to fluctuate in lockstep with the playback. Turning it
// off keeps the mic signal raw.
function micConstraints(deviceId: string): MediaStreamConstraints {
  const audio: MediaTrackConstraints = {
    echoCancellation: false,
    autoGainControl: false,
    noiseSuppression: false,
  };
  if (deviceId) audio.deviceId = { exact: deviceId };
  return { audio, video: false };
}

// Repopulate the input dropdown. Device labels are only exposed by the browser
// after mic permission is granted, so this is called again post-getUserMedia.
async function refreshDeviceList() {
  if (!navigator.mediaDevices?.enumerateDevices) return;
  let devices: MediaDeviceInfo[];
  try { devices = await navigator.mediaDevices.enumerateDevices(); }
  catch (_) { return; }
  const inputs = devices.filter(d => d.kind === 'audioinput');

  // If nothing explicit is chosen yet, reflect whatever device the active
  // stream actually resolved to so the dropdown shows the truth.
  if (!selectedDeviceId && currentStream) {
    const id = currentStream.getAudioTracks()[0]?.getSettings().deviceId;
    if (id) selectedDeviceId = id;
  }

  deviceSelect.innerHTML = '';
  if (inputs.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Default microphone';
    deviceSelect.appendChild(opt);
    return;
  }
  inputs.forEach((d, i) => {
    const opt = document.createElement('option');
    opt.value = d.deviceId;
    opt.textContent = d.label || `Microphone ${i + 1}`;
    deviceSelect.appendChild(opt);
  });
  if (selectedDeviceId && inputs.some(d => d.deviceId === selectedDeviceId)) {
    deviceSelect.value = selectedDeviceId;
  }
}

function attachStream(stream: MediaStream) {
  if (!audioCtx || !analyser) return;
  if (currentSource) { try { currentSource.disconnect(); } catch (_) {} }
  if (currentStream) currentStream.getTracks().forEach(t => t.stop());
  currentStream = stream;
  currentSource = audioCtx.createMediaStreamSource(stream);
  currentSource.connect(analyser);
}

async function switchDevice(deviceId: string) {
  selectedDeviceId = deviceId;
  try { localStorage.setItem('tuner_device', deviceId); } catch (_) {}
  if (!started) { start(); return; }
  if (!audioCtx) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia(micConstraints(deviceId));
    attachStream(stream);
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    await refreshDeviceList();
  } catch (e) {
    statusHint.textContent = `Mic error: ${(e as Error).message}`;
  }
}
deviceSelect.addEventListener('change', () => switchDevice(deviceSelect.value));

async function start() {
  if (started) return;
  started = true;
  statusHint.textContent = 'Requesting microphone…';
  try {
    const stream = await navigator.mediaDevices.getUserMedia(micConstraints(selectedDeviceId));
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    // 1024 ≈ 23 ms of audio at 44.1 kHz — halves the buffer-induced playback
    // latency vs. 2048. Still ~4 periods of the lowest trumpet note (concert
    // F3 ≈ 175 Hz), which is enough for pitchy to lock on reliably.
    analyser.fftSize = 1024;
    attachStream(stream);
    detector = PitchDetector.forFloat32Array(analyser.fftSize);
    await refreshDeviceList();
    if (stopwatchStartTime === null) {
      stopwatchStartTime = Date.now();
      saveStopwatchState();
    }
    requestAnimationFrame(tick);
  } catch (e) {
    statusHint.textContent = `Microphone error: ${(e as Error).message}`;
    started = false;
  }
}

// ── Toggles ────────────────────────────────────────────────────────────────

function syncAccidentalsBtn() {
  accidentalsBtn.textContent = useFlats ? '♭' : '♯';
}

function toggleAccidentals() {
  useFlats = !useFlats;
  syncAccidentalsBtn();
  try { localStorage.setItem('tuner_flats', useFlats ? '1' : '0'); } catch (_) {}
  rerenderCurrent();
}
(window as any).toggleAccidentals = toggleAccidentals;

function toggleTrumpet() {
  trumpetMode = !trumpetMode;
  trumpetBtn.classList.toggle('active', trumpetMode);
  sinewaveBtn.style.display = trumpetMode ? 'inline-flex' : 'none';
  if (!trumpetMode) {
    sinewaveMode = false;
    sinewaveBtn.classList.remove('active');
  }
  try { localStorage.setItem('tuner_trumpet', trumpetMode ? '1' : '0'); } catch (_) {}
  rerenderCurrent();
}
(window as any).toggleTrumpet = toggleTrumpet;

function toggleSinewave() {
  if (!trumpetMode) return;
  sinewaveMode = !sinewaveMode;
  sinewaveBtn.classList.toggle('active', sinewaveMode);
  rerenderCurrent();
}
(window as any).toggleSinewave = toggleSinewave;

// ── In-tune playback ──────────────────────────────────────────────────────
// Plays a continuous trumpet-ish tone at the exact ET frequency of the user's
// detected note, so they can hear what perfectly in-tune sounds like next to
// what they're producing. Synthesis modeled on trumpet.html.
let playbackMode = false;
let playbackMasterGain: GainNode | null = null;
type PlaybackVoice = {
  osc: OscillatorNode;
  osc2: OscillatorNode;
  noteGain: GainNode;
  formantHi: BiquadFilterNode;
};
let playbackVoice: PlaybackVoice | null = null;
const PLAYBACK_MAX_GAIN = 1.5;     // master gain at 100% volume
let playbackVolumePct = 50;        // user-adjustable, persisted

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function ensurePlaybackVoice() {
  if (!audioCtx || playbackVoice) return;
  if (!playbackMasterGain) {
    playbackMasterGain = audioCtx.createGain();
    playbackMasterGain.gain.value = (playbackVolumePct / 100) * PLAYBACK_MAX_GAIN;
    playbackMasterGain.connect(audioCtx.destination);
  }

  const noteGain = audioCtx.createGain();
  noteGain.gain.value = 0;
  noteGain.connect(playbackMasterGain);

  const lp = audioCtx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2200;
  lp.Q.value = 0.6;
  lp.connect(noteGain);

  const osc = audioCtx.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 440;

  const osc2 = audioCtx.createOscillator();
  osc2.type = 'sawtooth';
  osc2.frequency.value = 440 * 1.002;
  const osc2Gain = audioCtx.createGain();
  osc2Gain.gain.value = 0.25;
  osc2.connect(osc2Gain);
  osc2Gain.connect(lp);

  // Formant at 2× freq tracks the note; high formant fixed at 1100 Hz
  const formantHi = audioCtx.createBiquadFilter();
  formantHi.type = 'bandpass';
  formantHi.frequency.value = 880;
  formantHi.Q.value = 1.8;
  osc.connect(formantHi);
  formantHi.connect(lp);

  const formantFixed = audioCtx.createBiquadFilter();
  formantFixed.type = 'bandpass';
  formantFixed.frequency.value = 1100;
  formantFixed.Q.value = 1.8;
  osc.connect(formantFixed);
  formantFixed.connect(lp);

  const directGain = audioCtx.createGain();
  directGain.gain.value = 0.1;
  osc.connect(directGain);
  directGain.connect(lp);

  osc.start();
  osc2.start();

  playbackVoice = { osc, osc2, noteGain, formantHi };
}

function tearDownPlaybackVoice() {
  if (!playbackVoice || !audioCtx) return;
  const v = playbackVoice;
  playbackVoice = null;
  const t = audioCtx.currentTime;
  v.noteGain.gain.cancelScheduledValues(t);
  v.noteGain.gain.setValueAtTime(v.noteGain.gain.value, t);
  v.noteGain.gain.linearRampToValueAtTime(0, t + 0.12);
  setTimeout(() => {
    try { v.osc.stop(); } catch (_) {}
    try { v.osc2.stop(); } catch (_) {}
    v.noteGain.disconnect();
  }, 300);
}

function updatePlayback(midi: number | null) {
  if (!playbackMode || !audioCtx) return;
  if (midi === null) {
    if (playbackVoice) {
      const t = audioCtx.currentTime;
      playbackVoice.noteGain.gain.cancelScheduledValues(t);
      playbackVoice.noteGain.gain.setTargetAtTime(0, t, 0.04);
    }
    return;
  }
  ensurePlaybackVoice();
  if (!playbackVoice) return;
  const freq = midiToFreq(midi);
  const t = audioCtx.currentTime;
  playbackVoice.osc.frequency.setTargetAtTime(freq, t, 0.002);
  playbackVoice.osc2.frequency.setTargetAtTime(freq * 1.002, t, 0.002);
  playbackVoice.formantHi.frequency.setTargetAtTime(freq * 2, t, 0.005);
  playbackVoice.noteGain.gain.cancelScheduledValues(t);
  playbackVoice.noteGain.gain.setTargetAtTime(0.4, t, 0.005);
}

function togglePlayback() {
  playbackMode = !playbackMode;
  playbackBtn.classList.toggle('active', playbackMode);
  document.body.classList.toggle('playback-on', playbackMode);
  if (!playbackMode) tearDownPlaybackVoice();
  else if (lastConcertMidi !== null) updatePlayback(lastConcertMidi);
  try { localStorage.setItem('tuner_playback', playbackMode ? '1' : '0'); } catch (_) {}
}
(window as any).togglePlayback = togglePlayback;

function applyPlaybackVolumeUi() {
  playbackVolumeFill.style.height = `${playbackVolumePct}%`;
  playbackVolumeReadout.textContent = `${Math.round(playbackVolumePct)}%`;
  if (playbackMasterGain && audioCtx) {
    const gain = (playbackVolumePct / 100) * PLAYBACK_MAX_GAIN;
    playbackMasterGain.gain.setTargetAtTime(gain, audioCtx.currentTime, 0.01);
  }
}

function playbackVolumeFromClientY(clientY: number): number {
  const r = playbackVolume.getBoundingClientRect();
  if (r.height <= 0) return playbackVolumePct;
  return clamp(((r.bottom - clientY) / r.height) * 100, 0, 100);
}

let playbackVolumeDragging = false;
playbackVolume.addEventListener('pointerdown', e => {
  playbackVolume.setPointerCapture(e.pointerId);
  playbackVolumeDragging = true;
  playbackVolumePct = playbackVolumeFromClientY(e.clientY);
  applyPlaybackVolumeUi();
});
playbackVolume.addEventListener('pointermove', e => {
  if (!playbackVolumeDragging) return;
  playbackVolumePct = playbackVolumeFromClientY(e.clientY);
  applyPlaybackVolumeUi();
});
playbackVolume.addEventListener('pointerup', () => {
  playbackVolumeDragging = false;
  try { localStorage.setItem('tuner_playback_volume', String(playbackVolumePct)); } catch (_) {}
});
playbackVolume.addEventListener('pointercancel', () => { playbackVolumeDragging = false; });

function applySystemTheme() {
  document.documentElement.setAttribute('data-theme',
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  drawMeter(lastCents);
  staffRenderedKey = 'dirty';
  const _dm = currentDisplayMidi();
  const _dc = _dm !== null && lastCents !== null ? displayCents(lastCents, _dm) : null;
  renderStaff(_dm, _dc);
}

// ── Init ───────────────────────────────────────────────────────────────────

(function init() {
  applySystemTheme();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applySystemTheme);

  try {
    if (localStorage.getItem('tuner_trumpet') === '1') {
      trumpetMode = true;
      trumpetBtn.classList.add('active');
      sinewaveBtn.style.display = 'inline-flex';
    }
    const savedFlats = localStorage.getItem('tuner_flats');
    if (savedFlats !== null) useFlats = savedFlats === '1';
    syncAccidentalsBtn();
    const savedVol = parseFloat(localStorage.getItem('tuner_playback_volume') ?? '');
    if (Number.isFinite(savedVol)) playbackVolumePct = clamp(savedVol, 0, 100);
    if (localStorage.getItem('tuner_playback') === '1') {
      playbackMode = true;
      playbackBtn.classList.add('active');
      document.body.classList.add('playback-on');
    }
    applyPlaybackVolumeUi();
    const saved = parseFloat(localStorage.getItem('tuner_db_threshold') ?? '');
    if (Number.isFinite(saved)) dbThreshold = clamp(saved, DB_MIN, DB_MAX);
    const savedDevice = localStorage.getItem('tuner_device');
    if (savedDevice) selectedDeviceId = savedDevice;
  } catch (_) {}

  refreshDeviceList();
  navigator.mediaDevices?.addEventListener?.('devicechange', () => refreshDeviceList());

  loadStopwatchState();
  drawMeter(null);
  renderStaff(null, null);
  drawDbGraph();
  document.addEventListener('click', () => start(), { once: true });
  document.addEventListener('keydown', e => {
    if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey && !e.altKey) resetStopwatch();
  });

  new ResizeObserver(() => {
    staffRenderedKey = 'dirty';
    const dm = currentDisplayMidi();
    const dc = dm !== null && lastCents !== null ? displayCents(lastCents, dm) : null;
    renderStaff(dm, dc);
  }).observe(document.getElementById('staff-panel')!);
})();
