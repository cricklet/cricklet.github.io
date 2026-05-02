import { createRubberBandNode, RubberBandNode } from 'rubberband-web';
// @ts-ignore — esbuild inlines this as a string via --loader:.txt=text
import processorSrc from './rubberband-processor.txt';

const BPM_MIN = 40;
const BPM_MAX = 300;
const STORAGE_THEME = 'loop_theme';
const STORAGE_VOLUME = 'loop_volume';
const STORAGE_TARGET_BPM = 'loop_target_bpm';

// IndexedDB helpers
const DB_NAME = 'loop-player';
const DB_STORE = 'files';
const DB_KEY = 'last-audio';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveAudioFile(arrayBuffer: ArrayBuffer, name: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put({ buffer: arrayBuffer, name }, DB_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadSavedAudio(): Promise<{ buffer: ArrayBuffer; name: string } | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const req = tx.objectStore(DB_STORE).get(DB_KEY);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

// App state
interface AppState {
  audioCtx: AudioContext | null;
  rbNode: RubberBandNode | null;
  gainNode: GainNode | null;
  originalBuffer: AudioBuffer | null;
  currentSource: AudioBufferSourceNode | null;
  detectedBPM: number;
  targetBPM: number;
  volume: number;
  isPlaying: boolean;
  playStartBufferPos: number;
  playStartWallTime: number;
  pausedBufferPos: number;
}

const state: AppState = {
  audioCtx: null,
  rbNode: null,
  gainNode: null,
  originalBuffer: null,
  currentSource: null,
  detectedBPM: 120,
  targetBPM: 120,
  volume: 1,
  isPlaying: false,
  playStartBufferPos: 0,
  playStartWallTime: 0,
  pausedBufferPos: 0,
};

function getAudioCtx(): AudioContext {
  if (!state.audioCtx) state.audioCtx = new AudioContext();
  return state.audioCtx;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

// DOM refs
const bpmSection = document.getElementById('bpm-section')!;
const volumeSection = document.getElementById('volume-section')!;
const bpmFill = document.getElementById('bpm-fill')!;
const volumeFill = document.getElementById('volume-fill')!;
const bpmReadout = document.getElementById('bpm-readout')!;
const volumeReadout = document.getElementById('volume-readout')!;
const statusHint = document.getElementById('status-hint')!;
const detectedTick = document.getElementById('detected-tick')!;

// Display updates
function setBpmDisplay(bpm: number) {
  bpmReadout.textContent = `${Math.round(bpm)} BPM`;
  const frac = (bpm - BPM_MIN) / (BPM_MAX - BPM_MIN);
  bpmFill.style.width = `${clamp(frac, 0, 1) * 100}%`;
}

function setVolumeDisplay(v: number) {
  volumeReadout.textContent = `${Math.round(v * 100)}%`;
  volumeFill.style.width = `${v * 100}%`;
}

function setStatus(msg: string) {
  statusHint.textContent = msg;
}

// BPM detection: onset envelope + autocorrelation
function detectBPM(buffer: AudioBuffer): number {
  const sampleRate = buffer.sampleRate;
  const limit = Math.min(buffer.length, sampleRate * 30);
  const data = buffer.getChannelData(0).subarray(0, limit);
  const hopSize = 512;
  const winSize = 2048;
  const numFrames = Math.floor((data.length - winSize) / hopSize);
  const envelope = new Float32Array(numFrames);
  let prevEnergy = 0;
  for (let i = 0; i < numFrames; i++) {
    const start = i * hopSize;
    let energy = 0;
    for (let j = start; j < start + winSize; j++) energy += data[j] * data[j];
    energy /= winSize;
    envelope[i] = Math.max(0, energy - prevEnergy);
    prevEnergy = energy;
  }
  const frameRate = sampleRate / hopSize;
  const minLag = Math.round((frameRate * 60) / 200);
  const maxLag = Math.round((frameRate * 60) / 60);
  let bestLag = minLag, bestScore = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let score = 0;
    const n = envelope.length - lag;
    for (let i = 0; i < n; i++) score += envelope[i] * envelope[i + lag];
    score /= n;
    if (score > bestScore) { bestScore = score; bestLag = lag; }
  }
  let bpm = (frameRate * 60) / bestLag;
  while (bpm > 160) bpm /= 2;
  while (bpm < 80) bpm *= 2;
  return Math.round(bpm);
}

async function ensureNodes(): Promise<{ rb: RubberBandNode; gain: GainNode }> {
  const ctx = getAudioCtx();
  if (state.rbNode && state.gainNode) return { rb: state.rbNode, gain: state.gainNode };

  const blob = new Blob([processorSrc as string], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  const rb = await createRubberBandNode(ctx, url);
  rb.setHighQuality(true);

  const gain = ctx.createGain();
  gain.gain.value = state.volume;
  rb.connect(gain);
  gain.connect(ctx.destination);

  state.rbNode = rb;
  state.gainNode = gain;
  return { rb, gain };
}

function currentBufferPos(): number {
  if (!state.audioCtx || !state.isPlaying) return state.pausedBufferPos;
  const ratio = state.targetBPM / state.detectedBPM;
  return state.playStartBufferPos + (state.audioCtx.currentTime - state.playStartWallTime) * ratio;
}

function stopSource() {
  if (state.currentSource) {
    state.pausedBufferPos = currentBufferPos();
    state.currentSource.onended = null;
    state.currentSource.stop();
    state.currentSource.disconnect();
    state.currentSource = null;
  }
  state.isPlaying = false;
  document.body.classList.remove('playing');
}

function startSource(bufferPos: number) {
  const ctx = getAudioCtx();
  const buffer = state.originalBuffer!;
  const ratio = state.targetBPM / state.detectedBPM;
  const safePos = clamp(bufferPos, 0, buffer.duration - 0.01);

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.playbackRate.value = ratio;
  source.connect(state.rbNode!);
  source.start(0, safePos);

  state.rbNode!.setTempo(1.0);
  state.rbNode!.setPitch(1 / ratio);

  state.currentSource = source;
  state.playStartBufferPos = safePos;
  state.playStartWallTime = ctx.currentTime;
  state.isPlaying = true;
  document.body.classList.add('playing');

  source.onended = () => {
    if (state.currentSource === source) {
      state.isPlaying = false;
      state.pausedBufferPos = 0;
      state.currentSource = null;
      document.body.classList.remove('playing');
    }
  };
}

async function play() {
  if (!state.originalBuffer) return;
  await ensureNodes();
  if (!state.isPlaying) startSource(state.pausedBufferPos);
}

async function togglePlay() {
  if (!state.originalBuffer) return;
  await ensureNodes();
  if (state.isPlaying) stopSource();
  else startSource(state.pausedBufferPos);
}

function setTargetBPM(bpm: number) {
  const clamped = clamp(Math.round(bpm), BPM_MIN, BPM_MAX);
  state.targetBPM = clamped;
  setBpmDisplay(clamped);
  try { localStorage.setItem(STORAGE_TARGET_BPM, String(clamped)); } catch (_) {}

  if (state.isPlaying && state.currentSource) {
    const ratio = clamped / state.detectedBPM;
    const bufPos = currentBufferPos();
    state.currentSource.playbackRate.value = ratio;
    state.rbNode!.setPitch(1 / ratio);
    state.playStartBufferPos = bufPos;
    state.playStartWallTime = state.audioCtx!.currentTime;
  }
}

function setVolume(v: number) {
  state.volume = clamp(v, 0, 1);
  if (state.gainNode) state.gainNode.gain.value = state.volume;
  setVolumeDisplay(state.volume);
  try { localStorage.setItem(STORAGE_VOLUME, String(state.volume)); } catch (_) {}
}

// Pointer drag
let dragTarget: 'bpm' | 'volume' | null = null;

function bpmFromClientX(clientX: number): number {
  const r = bpmSection.getBoundingClientRect();
  const t = r.width <= 0 ? 0.5 : (clientX - r.left) / r.width;
  return BPM_MIN + clamp(t, 0, 1) * (BPM_MAX - BPM_MIN);
}

function volumeFromClientX(clientX: number): number {
  const r = volumeSection.getBoundingClientRect();
  const t = r.width <= 0 ? 1 : (clientX - r.left) / r.width;
  return clamp(t, 0, 1);
}

function onPointerDown(e: PointerEvent, target: 'bpm' | 'volume') {
  dragTarget = target;
  if (target === 'bpm') {
    setTargetBPM(bpmFromClientX(e.clientX));
    play();
  } else {
    setVolume(volumeFromClientX(e.clientX));
  }
}

function onPointerMove(e: PointerEvent) {
  if (!dragTarget) return;
  if (dragTarget === 'bpm') setTargetBPM(bpmFromClientX(e.clientX));
  else setVolume(volumeFromClientX(e.clientX));
}

function onPointerUp(e: PointerEvent) {
  dragTarget = null;
  try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch (_) {}
}

bpmSection.addEventListener('pointerdown', e => {
  bpmSection.setPointerCapture(e.pointerId);
  onPointerDown(e, 'bpm');
});
bpmSection.addEventListener('pointermove', e => onPointerMove(e));
bpmSection.addEventListener('pointerup', e => onPointerUp(e));
bpmSection.addEventListener('pointercancel', e => onPointerUp(e));

volumeSection.addEventListener('pointerdown', e => {
  volumeSection.setPointerCapture(e.pointerId);
  onPointerDown(e, 'volume');
});
volumeSection.addEventListener('pointermove', e => onPointerMove(e));
volumeSection.addEventListener('pointerup', e => onPointerUp(e));
volumeSection.addEventListener('pointercancel', e => onPointerUp(e));

// Focus/unfocus (exact same logic as metronome.html)
let swallowFirstControlPointer = false;
let absorbingRefocusClick = false;
let swallowPointerTimer: ReturnType<typeof setTimeout> | null = null;
let documentJustBecameVisible = false;
let windowEverBlurred = false;
const SWALLOW_POINTER_FALLBACK_MS = 400;
const INACTIVITY_TIMEOUT_MS = 10000;
let lastInteractionTime = Date.now();
let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

function syncWindowFocusClasses() {
  const windowFocused =
    typeof document.hasFocus === 'function' &&
    document.hasFocus() &&
    document.visibilityState === 'visible';
  const inactive = Date.now() - lastInteractionTime >= INACTIVITY_TIMEOUT_MS;
  const hasFocus = windowFocused && !inactive;
  document.body.classList.toggle('focused', hasFocus);
  document.body.classList.toggle('unfocused', !hasFocus);
}

function resetInactivityTimer() {
  lastInteractionTime = Date.now();
  if (inactivityTimer != null) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    inactivityTimer = null;
    syncWindowFocusClasses();
  }, INACTIVITY_TIMEOUT_MS);
  syncWindowFocusClasses();
}

function tryAbsorbRefocusPointerEvent(e: PointerEvent | MouseEvent): boolean {
  const onControl = (e.target as Element).closest?.('.control-section');
  if (swallowFirstControlPointer && onControl) {
    e.preventDefault();
    e.stopImmediatePropagation();
    swallowFirstControlPointer = false;
    if (swallowPointerTimer != null) { clearTimeout(swallowPointerTimer); swallowPointerTimer = null; }
    absorbingRefocusClick = true;
    return true;
  }
  if (absorbingRefocusClick && onControl) {
    e.preventDefault();
    e.stopImmediatePropagation();
    return true;
  }
  return false;
}

document.addEventListener('pointerdown', e => {
  if (document.body.classList.contains('unfocused')) {
    resetInactivityTimer();
    if ((e.target as Element).closest?.('.control-section')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      absorbingRefocusClick = true;
    }
    return;
  }
  tryAbsorbRefocusPointerEvent(e);
}, true);
document.addEventListener('mousedown', e => tryAbsorbRefocusPointerEvent(e as any), true);
document.addEventListener('pointerup', () => { absorbingRefocusClick = false; }, true);
document.addEventListener('pointercancel', () => { absorbingRefocusClick = false; }, true);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    documentJustBecameVisible = false;
    syncWindowFocusClasses();
  } else {
    documentJustBecameVisible = true;
    swallowFirstControlPointer = false;
    if (swallowPointerTimer != null) { clearTimeout(swallowPointerTimer); swallowPointerTimer = null; }
  }
});

window.addEventListener('blur', () => {
  windowEverBlurred = true;
  syncWindowFocusClasses();
  swallowFirstControlPointer = false;
  if (swallowPointerTimer != null) { clearTimeout(swallowPointerTimer); swallowPointerTimer = null; }
});

window.addEventListener('focus', () => {
  if (!windowEverBlurred) { swallowFirstControlPointer = false; documentJustBecameVisible = false; return; }
  if (documentJustBecameVisible) { swallowFirstControlPointer = false; documentJustBecameVisible = false; return; }
  swallowFirstControlPointer = true;
  if (swallowPointerTimer != null) clearTimeout(swallowPointerTimer);
  swallowPointerTimer = setTimeout(() => {
    swallowFirstControlPointer = false;
    swallowPointerTimer = null;
  }, SWALLOW_POINTER_FALLBACK_MS);
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  const tag = (e.target as HTMLElement).tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  resetInactivityTimer();
  if (e.key === ' ') { e.preventDefault(); togglePlay(); }
  else if (e.key === ']') setTargetBPM(state.targetBPM + 5);
  else if (e.key === '[') setTargetBPM(state.targetBPM - 5);
  else if (e.key === '=') setTargetBPM(state.targetBPM + 1);
  else if (e.key === '-') setTargetBPM(state.targetBPM - 1);
});

// Theme
function setTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'light' ? '◐' : '◑';
  try { localStorage.setItem(STORAGE_THEME, theme); } catch (_) {}
}
function toggleTheme() {
  setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
}
(window as any).toggleTheme = toggleTheme;

// Audio file processing
async function processArrayBuffer(arrayBuffer: ArrayBuffer, name: string) {
  stopSource();
  state.originalBuffer = null;
  state.pausedBufferPos = 0;
  setStatus('Decoding…');

  try {
    const ctx = getAudioCtx();
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    state.originalBuffer = decoded;

    setStatus('Detecting BPM…');
    await new Promise(r => setTimeout(r, 0));

    const bpm = detectBPM(decoded);
    state.detectedBPM = bpm;
    const tickFrac = (bpm - BPM_MIN) / (BPM_MAX - BPM_MIN);
    detectedTick.style.left = `${clamp(tickFrac, 0, 1) * 100}%`;
    detectedTick.style.display = 'block';

    // Restore saved target BPM if available, otherwise fall back to detected
    try {
      const saved = localStorage.getItem(STORAGE_TARGET_BPM);
      const savedBPM = saved ? parseInt(saved, 10) : NaN;
      setTargetBPM(Number.isFinite(savedBPM) ? savedBPM : bpm);
    } catch (_) {
      setTargetBPM(bpm);
    }

    setStatus('Loading…');
    await ensureNodes();

    const mins = Math.floor(decoded.duration / 60);
    const secs = Math.round(decoded.duration % 60).toString().padStart(2, '0');
    setStatus(`${name} · ${mins}:${secs} · detected ${bpm} BPM`);

    saveAudioFile(arrayBuffer, name).catch(() => {});
  } catch (e) {
    setStatus(`Error: ${(e as Error).message}`);
  }
}

async function processFile(file: File) {
  await processArrayBuffer(await file.arrayBuffer(), file.name);
}

// Drag and drop
let dragDepth = 0;
document.addEventListener('dragenter', e => {
  e.preventDefault();
  dragDepth++;
  document.body.classList.add('drag-over');
});
document.addEventListener('dragleave', () => {
  dragDepth--;
  if (dragDepth === 0) document.body.classList.remove('drag-over');
});
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => {
  e.preventDefault();
  dragDepth = 0;
  document.body.classList.remove('drag-over');
  const file = e.dataTransfer?.files[0];
  if (file) processFile(file);
});

const fileInput = document.getElementById('file-input') as HTMLInputElement;
fileInput.addEventListener('change', () => { if (fileInput.files?.[0]) processFile(fileInput.files[0]); });

// Init
(function init() {
  try {
    const saved = localStorage.getItem(STORAGE_THEME);
    setTheme(saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  } catch (_) {
    setTheme('dark');
  }
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    try { if (localStorage.getItem(STORAGE_THEME) != null) return; } catch (_) {}
    setTheme(e.matches ? 'dark' : 'light');
  });

  try {
    const v = parseFloat(localStorage.getItem(STORAGE_VOLUME) ?? '1');
    if (Number.isFinite(v)) state.volume = clamp(v, 0, 1);
  } catch (_) {}

  setBpmDisplay(state.targetBPM);
  setVolumeDisplay(state.volume);
  syncWindowFocusClasses();
  resetInactivityTimer();

  loadSavedAudio().then(saved => {
    if (saved) processArrayBuffer(saved.buffer, saved.name);
  }).catch(() => {});
})();
