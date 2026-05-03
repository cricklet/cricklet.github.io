import { createRubberBandNode, RubberBandNode } from 'rubberband-web';
// @ts-ignore — esbuild inlines this as a string via --loader:.txt=text
import processorSrc from './rubberband-processor.txt';

const BPM_MIN = 40;
const BPM_MAX = 300;
const STORAGE_THEME = 'loop_theme';
const STORAGE_VOLUME = 'loop_volume';
const STORAGE_METRONOME = 'loop_metronome';
const STORAGE_LAST_FILE = 'loop_last_file';

// IndexedDB helpers
const DB_NAME = 'loop-player';
const DB_VERSION = 2;
const DB_STORE_FILES = 'files';  // { id, buffer }
const DB_STORE_META = 'meta';    // { id, name, addedAt }

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (db.objectStoreNames.contains(DB_STORE_FILES)) db.deleteObjectStore(DB_STORE_FILES);
      if (db.objectStoreNames.contains(DB_STORE_META)) db.deleteObjectStore(DB_STORE_META);
      db.createObjectStore(DB_STORE_FILES, { keyPath: 'id' });
      const metaStore = db.createObjectStore(DB_STORE_META, { keyPath: 'id' });
      metaStore.createIndex('addedAt', 'addedAt');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveAudioFile(arrayBuffer: ArrayBuffer, name: string, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([DB_STORE_FILES, DB_STORE_META], 'readwrite');
    const metaReq = tx.objectStore(DB_STORE_META).get(id);
    metaReq.onsuccess = () => {
      const existing = metaReq.result;
      tx.objectStore(DB_STORE_META).put({ id, name, addedAt: existing?.addedAt ?? Date.now() });
      tx.objectStore(DB_STORE_FILES).put({ id, buffer: arrayBuffer });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadAllFilesMeta(): Promise<Array<{ id: string; name: string; addedAt: number }>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE_META, 'readonly');
    const req = tx.objectStore(DB_STORE_META).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

async function loadAudioById(id: string): Promise<{ buffer: ArrayBuffer; name: string } | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([DB_STORE_FILES, DB_STORE_META], 'readonly');
    const fileReq = tx.objectStore(DB_STORE_FILES).get(id);
    const metaReq = tx.objectStore(DB_STORE_META).get(id);
    let fileRec: any, metaRec: any;
    fileReq.onsuccess = () => { fileRec = fileReq.result; };
    metaReq.onsuccess = () => { metaRec = metaReq.result; };
    tx.oncomplete = () => resolve(fileRec && metaRec ? { buffer: fileRec.buffer, name: metaRec.name } : null);
    tx.onerror = () => reject(tx.error);
  });
}

// Per-file settings (BPM, loop points) stored in localStorage keyed by file id
interface FileSettings { targetBPM?: number; loopStartBeats?: number; loopEndBeats?: number; }

function loadFileSettings(id: string): FileSettings {
  try { return JSON.parse(localStorage.getItem(`loop_file_${id}`) ?? '{}'); } catch (_) { return {}; }
}

function persistCurrentFileSettings() {
  if (!state.currentFileId) return;
  try {
    localStorage.setItem(`loop_file_${state.currentFileId}`, JSON.stringify({
      targetBPM: state.targetBPM,
      loopStartBeats: state.loopStartBeats,
      loopEndBeats: state.loopEndBeats,
    }));
  } catch (_) {}
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
  loopStartBeats: number;
  loopEndBeats: number;
  isPlaying: boolean;
  playStartBufferPos: number;
  playStartWallTime: number;
  pausedBufferPos: number;
  metronomeEnabled: boolean;
  currentFileId: string | null;
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
  loopStartBeats: 0,
  loopEndBeats: 0,
  isPlaying: false,
  playStartBufferPos: 0,
  playStartWallTime: 0,
  pausedBufferPos: 0,
  metronomeEnabled: false,
  currentFileId: null,
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
const loopSection = document.getElementById('loop-section')!;
const loopBetween = document.getElementById('loop-between')!;
const loopHint = document.getElementById('loop-hint')!;
const loopPlayhead = document.getElementById('loop-playhead')!;

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

// Loop points
function totalBeats(): number {
  if (!state.originalBuffer) return 0;
  return Math.floor(state.originalBuffer.duration * state.detectedBPM / 60);
}

function beatDurationSecs(): number {
  return 60 / state.detectedBPM;
}

function loopStartSecs(): number {
  return state.loopStartBeats * beatDurationSecs();
}

function loopEndSecs(): number {
  return state.loopEndBeats * beatDurationSecs();
}

function updateLoopDisplay() {
  const total = totalBeats();
  if (total === 0) return;
  const startFrac = state.loopStartBeats / total;
  const endFrac = state.loopEndBeats / total;
  const beats = state.loopEndBeats - state.loopStartBeats;
  loopBetween.style.left = `${startFrac * 100}%`;
  loopBetween.style.width = `${(endFrac - startFrac) * 100}%`;
  loopHint.textContent = `${beats} beat${beats !== 1 ? 's' : ''}`;
}

// Playhead
let playheadRaf: number | null = null;

function currentLoopedBufferPos(): number {
  if (!state.audioCtx || !state.isPlaying || !state.originalBuffer) return state.pausedBufferPos;
  const ratio = state.targetBPM / state.detectedBPM;
  const linear = state.playStartBufferPos + (state.audioCtx.currentTime - state.playStartWallTime) * ratio;
  const lStart = loopStartSecs();
  const lEnd = loopEndSecs();
  const len = lEnd - lStart;
  if (len <= 0) return lStart;
  return lStart + ((linear - lStart) % len + len) % len;
}

function tickPlayhead() {
  if (!state.isPlaying || !state.originalBuffer) return;
  const pos = currentLoopedBufferPos();
  const frac = pos / state.originalBuffer.duration;
  loopPlayhead.style.left = `${clamp(frac, 0, 1) * 100}%`;
  playheadRaf = requestAnimationFrame(tickPlayhead);
}

function startPlayhead() {
  if (playheadRaf !== null) return;
  playheadRaf = requestAnimationFrame(tickPlayhead);
}

function stopPlayhead() {
  if (playheadRaf !== null) { cancelAnimationFrame(playheadRaf); playheadRaf = null; }
}

function setLoopPoints(startBeats: number, endBeats: number, persist = true) {
  const total = totalBeats();
  if (total === 0) return;
  // Snapshot position before loop bounds change so playhead modulo stays valid
  if (state.isPlaying && state.audioCtx) {
    state.playStartBufferPos = currentLoopedBufferPos();
    state.playStartWallTime = state.audioCtx.currentTime;
  }
  const newStart = clamp(startBeats, 0, total - 1);
  const newEnd = clamp(endBeats, newStart + 1, total);
  state.loopStartBeats = newStart;
  state.loopEndBeats = newEnd;
  updateLoopDisplay();
  if (state.currentSource) {
    state.currentSource.loopStart = loopStartSecs();
    state.currentSource.loopEnd = loopEndSecs();
  }
  if (persist) persistCurrentFileSettings();
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

// Metronome click
let metronomeNextClickTime = 0;
let metronomeRaf: number | null = null;

function metronomeNowSec(): number {
  return performance.now() / 1000;
}

function playMetronomeClick(when: number) {
  const el = document.getElementById('loop-click-audio') as HTMLAudioElement | null;
  if (!el) return;
  const delayMs = Math.max(0, (when - metronomeNowSec()) * 1000);
  window.setTimeout(() => {
    el.currentTime = 0;
    void el.play().catch(() => {});
  }, delayMs);
}

function scheduleMetronomeClicks() {
  if (!state.metronomeEnabled || !state.isPlaying) return;
  const lookahead = 0.08;
  const now = metronomeNowSec();
  while (metronomeNextClickTime < now + lookahead) {
    if (metronomeNextClickTime >= now - 0.01) {
      playMetronomeClick(metronomeNextClickTime);
    }
    metronomeNextClickTime += 60 / state.targetBPM;
  }
  metronomeRaf = requestAnimationFrame(scheduleMetronomeClicks);
}

function startMetronomeLoop() {
  if (metronomeRaf !== null) return;
  metronomeNextClickTime = metronomeNowSec() + 0.05;
  metronomeRaf = requestAnimationFrame(scheduleMetronomeClicks);
}

function stopMetronomeLoop() {
  if (metronomeRaf !== null) { cancelAnimationFrame(metronomeRaf); metronomeRaf = null; }
}

function toggleMetronome() {
  state.metronomeEnabled = !state.metronomeEnabled;
  const btn = document.getElementById('metronome-toggle');
  if (btn) btn.classList.toggle('active', state.metronomeEnabled);
  if (state.metronomeEnabled && state.isPlaying) {
    startMetronomeLoop();
  } else {
    stopMetronomeLoop();
  }
  try { localStorage.setItem(STORAGE_METRONOME, state.metronomeEnabled ? '1' : '0'); } catch (_) {}
}
(window as any).toggleMetronome = toggleMetronome;

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
  stopPlayhead();
  stopMetronomeLoop();
}

function startSource(bufferPos: number) {
  const ctx = getAudioCtx();
  const buffer = state.originalBuffer!;
  const ratio = state.targetBPM / state.detectedBPM;
  const lStart = loopStartSecs();
  const lEnd = loopEndSecs();
  const safePos = clamp(bufferPos, lStart, lEnd - 0.01);

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.loopStart = lStart;
  source.loopEnd = lEnd;
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
  startPlayhead();
  if (state.metronomeEnabled) startMetronomeLoop();

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

function setTargetBPM(bpm: number, persist = true) {
  const clamped = clamp(Math.round(bpm), BPM_MIN, BPM_MAX);
  state.targetBPM = clamped;
  setBpmDisplay(clamped);
  if (persist) persistCurrentFileSettings();

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

// Loop section pointer
let dragLoop: 'a' | 'b' | null = null;

function loopSecsFromClientX(clientX: number): number {
  const r = loopSection.getBoundingClientRect();
  if (!state.originalBuffer) return 0;
  return clamp((clientX - r.left) / r.width, 0, 1) * state.originalBuffer.duration;
}

function updateLoopDrag(clientX: number) {
  const secs = loopSecsFromClientX(clientX);
  const beat = Math.round(secs / beatDurationSecs());
  if (dragLoop === 'a') setLoopPoints(beat, state.loopEndBeats);
  else setLoopPoints(state.loopStartBeats, beat);
}

loopSection.addEventListener('pointerdown', e => {
  if (!state.originalBuffer) return;
  loopSection.setPointerCapture(e.pointerId);
  const secs = loopSecsFromClientX(e.clientX);
  dragLoop = Math.abs(secs - loopStartSecs()) <= Math.abs(secs - loopEndSecs()) ? 'a' : 'b';
  updateLoopDrag(e.clientX);
  resetInactivityTimer();
});
loopSection.addEventListener('pointermove', e => { if (dragLoop) updateLoopDrag(e.clientX); });
loopSection.addEventListener('pointerup', e => {
  const wasA = dragLoop === 'a';
  dragLoop = null;
  try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch (_) {}
  if (wasA && state.originalBuffer && state.rbNode) {
    const wasPlaying = state.isPlaying;
    stopSource();
    if (wasPlaying) startSource(loopStartSecs());
    else state.pausedBufferPos = loopStartSecs();
  }
});
loopSection.addEventListener('pointercancel', e => {
  dragLoop = null;
  try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch (_) {}
});

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
  if (e.key === ' ') {
    e.preventDefault();
    if (e.shiftKey) { if (state.isPlaying) { stopSource(); } else { state.pausedBufferPos = 0; play(); } }
    else togglePlay();
  }
  else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); stopSource(); state.pausedBufferPos = 0; play(); }
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

function trimSilence(buffer: AudioBuffer, threshold = 0.0316): AudioBuffer {
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length;
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) channels.push(buffer.getChannelData(c));

  let startSample = 0;
  scan_start: for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      if (Math.abs(channels[c][i]) > threshold) { startSample = i; break scan_start; }
    }
  }

  let endSample = length;
  scan_end: for (let i = length - 1; i >= startSample; i--) {
    for (let c = 0; c < numChannels; c++) {
      if (Math.abs(channels[c][i]) > threshold) { endSample = i + 1; break scan_end; }
    }
  }

  if (startSample === 0 && endSample === length) return buffer;

  const ctx = getAudioCtx();
  const trimmed = ctx.createBuffer(numChannels, endSample - startSample, buffer.sampleRate);
  for (let c = 0; c < numChannels; c++) {
    trimmed.copyToChannel(channels[c].subarray(startSample, endSample), c);
  }
  return trimmed;
}

// File dropdown
const fileSelect = document.getElementById('file-select') as HTMLSelectElement;

async function refreshFileDropdown() {
  const files = (await loadAllFilesMeta()).sort((a, b) => b.addedAt - a.addedAt);
  fileSelect.innerHTML = '';
  for (const f of files) {
    const opt = document.createElement('option');
    opt.value = f.id;
    opt.textContent = f.name;
    fileSelect.appendChild(opt);
  }
  fileSelect.classList.toggle('has-files', files.length > 0);
  if (state.currentFileId) fileSelect.value = state.currentFileId;
}

fileSelect.addEventListener('change', async () => {
  const id = fileSelect.value;
  const saved = await loadAudioById(id);
  if (saved) processArrayBuffer(saved.buffer, saved.name, id);
});

// Audio file processing
async function processArrayBuffer(arrayBuffer: ArrayBuffer, name: string, id = encodeURIComponent(name)) {
  stopSource();
  state.originalBuffer = null;
  state.pausedBufferPos = 0;
  state.currentFileId = id;
  setStatus('Decoding…');

  try {
    const ctx = getAudioCtx();
    const raw = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const decoded = trimSilence(raw);
    state.originalBuffer = decoded;

    setStatus('Detecting BPM…');
    await new Promise(r => setTimeout(r, 0));

    const bpm = detectBPM(decoded);
    state.detectedBPM = bpm;
    const tickFrac = (bpm - BPM_MIN) / (BPM_MAX - BPM_MIN);
    detectedTick.style.left = `${clamp(tickFrac, 0, 1) * 100}%`;
    detectedTick.style.display = 'block';

    // Restore per-file settings, falling back to detected BPM / full range.
    // Apply both without persisting so stale loop/bpm state can't overwrite each other,
    // then save once with the fully-resolved values.
    const settings = loadFileSettings(id);
    setTargetBPM(settings.targetBPM ?? bpm, false);

    const total = Math.floor(decoded.duration * bpm / 60);
    const s = settings.loopStartBeats, e = settings.loopEndBeats;
    const hasValidLoop = s != null && e != null && s >= 0 && e <= total && s < e;
    setLoopPoints(hasValidLoop ? s! : 0, hasValidLoop ? e! : total, false);
    persistCurrentFileSettings();

    setStatus('Loading…');
    await ensureNodes();

    const mins = Math.floor(decoded.duration / 60);
    const secs = Math.round(decoded.duration % 60).toString().padStart(2, '0');
    setStatus(`${mins}:${secs} · detected ${bpm} BPM`);

    try { localStorage.setItem(STORAGE_LAST_FILE, id); } catch (_) {}
    saveAudioFile(arrayBuffer, name, id).then(() => refreshFileDropdown()).catch(() => {});
    fileSelect.value = id;
  } catch (e) {
    setStatus(`Error: ${(e as Error).message}`);
  }
}

async function processFile(file: File) {
  const id = encodeURIComponent(file.name);
  await processArrayBuffer(await file.arrayBuffer(), file.name, id);
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

  try {
    if (localStorage.getItem(STORAGE_METRONOME) === '1') {
      state.metronomeEnabled = true;
      const btn = document.getElementById('metronome-toggle');
      if (btn) btn.classList.add('active');
    }
  } catch (_) {}

  setBpmDisplay(state.targetBPM);
  setVolumeDisplay(state.volume);
  syncWindowFocusClasses();
  resetInactivityTimer();

  loadAllFilesMeta().then(async files => {
    refreshFileDropdown();
    if (files.length === 0) return;
    let lastId: string | null = null;
    try { lastId = localStorage.getItem(STORAGE_LAST_FILE); } catch (_) {}
    const target = (lastId && files.find(f => f.id === lastId))
      ? lastId
      : files.sort((a, b) => b.addedAt - a.addedAt)[0].id;
    const saved = await loadAudioById(target);
    if (saved) processArrayBuffer(saved.buffer, saved.name, target);
  }).catch(() => {});
})();
