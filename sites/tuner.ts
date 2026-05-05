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

// Last detected state
let lastConcertMidi: number | null = null;
let lastCents: number | null = null;
let lastFreq: number | null = null;
let noSignalFrames = 0;
const NO_SIGNAL_THRESHOLD = 12;

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
const trumpetBtn     = document.getElementById('trumpet-btn')!;
const sinewaveBtn    = document.getElementById('sinewave-btn')!;
const dbSection      = document.getElementById('db-section')!;
const dbFill         = document.getElementById('db-fill')!;
const dbThreshLine   = document.getElementById('db-threshold-line')!;
const dbReadout      = document.getElementById('db-readout')!;

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

// ── dB meter ───────────────────────────────────────────────────────────────

function updateDbDisplay(currentDb: number) {
  dbFill.style.width = `${dbToFrac(currentDb) * 100}%`;
  dbThreshLine.style.left = `${dbToFrac(dbThreshold) * 100}%`;
  dbReadout.textContent = `${Math.round(dbThreshold)} dB`;
}

function setDbThreshold(db: number) {
  dbThreshold = clamp(db, DB_MIN, DB_MAX);
  try { localStorage.setItem('tuner_db_threshold', String(dbThreshold)); } catch (_) {}
}

let dbDragging = false;

dbSection.addEventListener('pointerdown', e => {
  dbSection.setPointerCapture(e.pointerId);
  dbDragging = true;
  const r = dbSection.getBoundingClientRect();
  setDbThreshold(fracToDb((e.clientX - r.left) / r.width));
});
dbSection.addEventListener('pointermove', e => {
  if (!dbDragging) return;
  const r = dbSection.getBoundingClientRect();
  setDbThreshold(fracToDb((e.clientX - r.left) / r.width));
});
dbSection.addEventListener('pointerup',     () => { dbDragging = false; });
dbSection.addEventListener('pointercancel', () => { dbDragging = false; });

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

  const STAVE_W = clamp(W - 16, 80, 120);
  const staveX  = (W - STAVE_W) / 2;
  const staveY  = (H - 40) / 2;

  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(W, H);
  const vctx = renderer.getContext();

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

// ── Pitch detection loop ───────────────────────────────────────────────────

function tick() {
  if (!analyser || !detector || !audioCtx) return;

  const input = new Float32Array(detector.inputLength);
  analyser.getFloatTimeDomainData(input);

  const currentDb = computeDb(input);
  updateDbDisplay(currentDb);

  const [freq, clarity] = detector.findPitch(input, audioCtx.sampleRate);
  const loud = currentDb > dbThreshold;

  if (loud && clarity > 0.9 && freq > 60 && freq < 5000) {
    noSignalFrames = 0;
    const { midi, cents } = freqToConcertMidi(freq);
    lastConcertMidi = midi;
    lastCents = cents;
    lastFreq = freq;
    const dm = midi + (trumpetMode ? 2 : 0);
    const dc = displayCents(cents, dm);
    updateDisplay(midiToNoteInfo(dm, dc), freq);
    drawMeter(dc);
    renderStaff(dm, dc);
  } else {
    noSignalFrames++;
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

async function start() {
  if (started) return;
  started = true;
  statusHint.textContent = 'Requesting microphone…';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    audioCtx.createMediaStreamSource(stream).connect(analyser);
    detector = PitchDetector.forFloat32Array(analyser.fftSize);
    statusHint.textContent = '';
    requestAnimationFrame(tick);
  } catch (e) {
    statusHint.textContent = `Microphone error: ${(e as Error).message}`;
    started = false;
  }
}

// ── Toggles ────────────────────────────────────────────────────────────────

function toggleTrumpet() {
  trumpetMode = !trumpetMode;
  useFlats = trumpetMode;
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

function setTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'light' ? '◐' : '◑';
  try { localStorage.setItem('tuner_theme', theme); } catch (_) {}
  drawMeter(lastCents);
  staffRenderedKey = 'dirty';
  const _dm = currentDisplayMidi();
  const _dc = _dm !== null && lastCents !== null ? displayCents(lastCents, _dm) : null;
  renderStaff(_dm, _dc);
}

function toggleTheme() {
  setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
}
(window as any).toggleTheme = toggleTheme;

// ── Init ───────────────────────────────────────────────────────────────────

(function init() {
  try {
    const saved = localStorage.getItem('tuner_theme');
    setTheme(saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  } catch (_) { setTheme('dark'); }

  try {
    if (localStorage.getItem('tuner_trumpet') === '1') {
      trumpetMode = true;
      useFlats = true;
      trumpetBtn.classList.add('active');
      sinewaveBtn.style.display = 'inline-flex';
    }
    const saved = parseFloat(localStorage.getItem('tuner_db_threshold') ?? '');
    if (Number.isFinite(saved)) dbThreshold = clamp(saved, DB_MIN, DB_MAX);
  } catch (_) {}

  drawMeter(null);
  renderStaff(null, null);
  updateDbDisplay(DB_MIN);
  document.addEventListener('click', () => start(), { once: true });
})();
