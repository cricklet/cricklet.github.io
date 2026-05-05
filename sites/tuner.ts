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
let useFlats    = false;
let trumpetMode = false;

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

// Staff render throttle
let staffRenderedMidi: number | 'dirty' = 'dirty';

// DOM refs
const canvas         = document.getElementById('meter-canvas') as HTMLCanvasElement;
const noteLetter     = document.getElementById('note-letter')!;
const noteAccidental = document.getElementById('note-accidental')!;
const noteOctave     = document.getElementById('note-octave')!;
const freqDisplay    = document.getElementById('freq-display')!;
const centsDisplay   = document.getElementById('cents-display')!;
const statusHint     = document.getElementById('status-hint')!;
const trumpetBtn     = document.getElementById('trumpet-btn')!;
const flatsBtn       = document.getElementById('flats-btn')!;
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
  ctx2d.strokeStyle = 'rgba(60,200,100,0.32)';
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
    ctx2d.strokeStyle = abs <= 5 ? '#3ccc6a' : abs <= 20 ? '#f0b400' : '#e84040';
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

function renderStaff(midi: number | null) {
  if (midi === staffRenderedMidi) return;
  staffRenderedMidi = midi ?? 'dirty';

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

  const color = getComputedStyle(document.documentElement)
    .getPropertyValue('--text-color').trim() || 'rgba(255,255,255,0.87)';
  vctx.setFillStyle(color);
  vctx.setStrokeStyle(color);

  const stave = new Stave(staveX, staveY, STAVE_W);
  stave.addClef('treble');
  stave.setContext(vctx).draw();

  if (midi === null) return;

  const vfMap = useFlats ? VF_FLAT : VF_SHARP;
  const { key, acc } = vfMap[((midi % 12) + 12) % 12];
  const keyStr = `${key}/${Math.floor(midi / 12) - 1}`;

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
    centsDisplay.className = '';
    return;
  }
  noteLetter.textContent = info.letter;
  noteAccidental.textContent = info.accidental;
  noteOctave.textContent = String(info.octave);
  if (freq !== undefined) freqDisplay.textContent = `${freq.toFixed(1)} Hz`;
  const sign = info.cents > 0 ? '+' : '';
  centsDisplay.textContent = `${sign}${info.cents} cents`;
  const abs = Math.abs(info.cents);
  centsDisplay.className = abs <= 5 ? 'in-tune' : abs <= 20 ? 'slightly-off' : 'out-of-tune';
}

function rerenderCurrent() {
  staffRenderedMidi = 'dirty';
  const dm = currentDisplayMidi();
  if (dm === null || lastCents === null) {
    updateDisplay(null);
    drawMeter(null);
    renderStaff(null);
  } else {
    updateDisplay(midiToNoteInfo(dm, lastCents), lastFreq ?? undefined);
    drawMeter(lastCents);
    renderStaff(dm);
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
    updateDisplay(midiToNoteInfo(dm, cents), freq);
    drawMeter(cents);
    renderStaff(dm);
  } else {
    noSignalFrames++;
    if (noSignalFrames > NO_SIGNAL_THRESHOLD) {
      lastConcertMidi = null;
      lastCents = null;
      lastFreq = null;
      updateDisplay(null);
      drawMeter(null);
      renderStaff(null);
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
  trumpetBtn.classList.toggle('active', trumpetMode);
  try { localStorage.setItem('tuner_trumpet', trumpetMode ? '1' : '0'); } catch (_) {}
  rerenderCurrent();
}
(window as any).toggleTrumpet = toggleTrumpet;

function toggleFlats() {
  useFlats = !useFlats;
  flatsBtn.classList.toggle('active', useFlats);
  try { localStorage.setItem('tuner_flats', useFlats ? '1' : '0'); } catch (_) {}
  rerenderCurrent();
}
(window as any).toggleFlats = toggleFlats;

function setTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'light' ? '◐' : '◑';
  try { localStorage.setItem('tuner_theme', theme); } catch (_) {}
  drawMeter(lastCents);
  staffRenderedMidi = 'dirty';
  renderStaff(currentDisplayMidi());
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
      trumpetBtn.classList.add('active');
    }
    if (localStorage.getItem('tuner_flats') === '1') {
      useFlats = true;
      flatsBtn.classList.add('active');
    }
    const saved = parseFloat(localStorage.getItem('tuner_db_threshold') ?? '');
    if (Number.isFinite(saved)) dbThreshold = clamp(saved, DB_MIN, DB_MAX);
  } catch (_) {}

  drawMeter(null);
  renderStaff(null);
  updateDbDisplay(DB_MIN);
  document.addEventListener('click', () => start(), { once: true });
})();
