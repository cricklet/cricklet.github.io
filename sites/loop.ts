import { createRubberBandNode, RubberBandNode } from 'rubberband-web';
// @ts-ignore — esbuild inlines this as a string via --loader:.txt=text
import processorSrc from './rubberband-processor.txt';
// @ts-ignore
import { EssentiaWASM } from 'essentia.js/dist/essentia-wasm.es.js';
// @ts-ignore
import EssentiaCore from 'essentia.js/dist/essentia.js-core.es.js';

// Essentia singleton — lazily initialized on first audio load.
// essentia-wasm.es.js uses onRuntimeInitialized (not .ready), and with inlined
// base64 WASM it usually finishes synchronously before our code runs.
let essentiaPromise: Promise<any> | null = null;
function getEssentia(): Promise<any> {
  if (!essentiaPromise) {
    essentiaPromise = new Promise<any>(resolve => {
      if ((EssentiaWASM as any).EssentiaJS) {
        resolve(new EssentiaCore(EssentiaWASM));
      } else {
        (EssentiaWASM as any)['onRuntimeInitialized'] = () => {
          resolve(new EssentiaCore(EssentiaWASM));
        };
      }
    });
  }
  return essentiaPromise;
}

const BPM_MIN = 40;
const BPM_MAX = 300;
const STORAGE_THEME = 'loop_theme';
const STORAGE_VOLUME = 'loop_volume';
const STORAGE_METRONOME = 'loop_metronome';
const STORAGE_LAST_FILE = 'loop_last_file';

// IndexedDB helpers
const DB_NAME = 'loop-player';
const DB_VERSION = 3;
const DB_STORE_FILES = 'files';  // { id, buffer }
const DB_STORE_META = 'meta';    // { id, name, addedAt }
const DB_STORE_BEATS = 'beats';  // { id, bpm, ticks: Float32Array }

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      // v2→v3: recreate files+meta (same schema) and add beats store
      if (db.objectStoreNames.contains(DB_STORE_FILES)) db.deleteObjectStore(DB_STORE_FILES);
      if (db.objectStoreNames.contains(DB_STORE_META)) db.deleteObjectStore(DB_STORE_META);
      if (db.objectStoreNames.contains(DB_STORE_BEATS)) db.deleteObjectStore(DB_STORE_BEATS);
      db.createObjectStore(DB_STORE_FILES, { keyPath: 'id' });
      const metaStore = db.createObjectStore(DB_STORE_META, { keyPath: 'id' });
      metaStore.createIndex('addedAt', 'addedAt');
      db.createObjectStore(DB_STORE_BEATS, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadBeatCache(id: string): Promise<{ bpm: number; ticks: Float32Array } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const req = db.transaction(DB_STORE_BEATS, 'readonly').objectStore(DB_STORE_BEATS).get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch { return null; }
}

async function saveBeatCache(id: string, bpm: number, ticks: Float32Array): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE_BEATS, 'readwrite');
      tx.objectStore(DB_STORE_BEATS).put({ id, bpm, ticks });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* non-fatal */ }
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
  beatTicks: Float32Array | null;
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
  beatTicks: null,
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
const loopStartLabel = document.getElementById('loop-start-label')!;
const loopEndLabel = document.getElementById('loop-end-label')!;

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
  loopHint.textContent = String(beats);
  loopStartLabel.textContent = String(state.loopStartBeats);
  loopStartLabel.style.left = `${startFrac * 100}%`;
  loopEndLabel.textContent = String(state.loopEndBeats);
  loopEndLabel.style.left = `${endFrac * 100}%`;
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

// BPM + beat detection via Essentia RhythmExtractor2013 (multifeature).
// Analyzes the full buffer so ticks cover the entire track for metronome sync.
async function detectRhythm(buffer: AudioBuffer): Promise<{ bpm: number; ticks: Float32Array }> {
  const essentia = await getEssentia();
  const ctx = getAudioCtx();

  // Suspend the AudioContext so the renderer doesn't crash while WASM blocks the main thread
  const wasSuspended = ctx.state === 'suspended';
  if (ctx.state === 'running') await ctx.suspend();

  let bpm: number;
  let ticks: Float32Array;
  try {
    const mono = essentia.audioBufferToMonoSignal(buffer);
    const signal = essentia.arrayToVector(mono);
    const result = essentia.RhythmExtractor2013(signal, 208, 'multifeature', 40);
    bpm = Math.round(result.bpm);
    ticks = essentia.vectorToArray(result.ticks);
  } finally {
    if (!wasSuspended) await ctx.resume();
  }

  return { bpm, ticks };
}

// WAV export helpers
function writeStr(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

function encodeWav(segment: AudioBuffer): ArrayBuffer {
  const nCh = segment.numberOfChannels;
  const sr = segment.sampleRate;
  const n = segment.length;
  const dataSize = n * nCh * 2;
  const buf = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buf);
  writeStr(v, 0, 'RIFF'); v.setUint32(4, 36 + dataSize, true);
  writeStr(v, 8, 'WAVE'); writeStr(v, 12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, nCh, true); v.setUint32(24, sr, true);
  v.setUint32(28, sr * nCh * 2, true); v.setUint16(32, nCh * 2, true);
  v.setUint16(34, 16, true); writeStr(v, 36, 'data');
  v.setUint32(40, dataSize, true);
  const chs: Float32Array[] = [];
  for (let c = 0; c < nCh; c++) chs.push(segment.getChannelData(c));
  let off = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < nCh; c++) {
      const s = Math.max(-1, Math.min(1, chs[c][i]));
      v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      off += 2;
    }
  }
  return buf;
}

function snapToNearestTick(secs: number): number {
  const ticks = state.beatTicks;
  if (!ticks || ticks.length === 0) return secs;
  let best = ticks[0], bestDist = Math.abs(ticks[0] - secs);
  for (let i = 1; i < ticks.length; i++) {
    const d = Math.abs(ticks[i] - secs);
    if (d < bestDist) { bestDist = d; best = ticks[i]; }
  }
  return best;
}

function downloadLoop() {
  if (!state.originalBuffer) return;
  const buf = state.originalBuffer;
  const startSnapped = Math.max(0, snapToNearestTick(loopStartSecs()));
  const endSnapped = Math.min(buf.duration, snapToNearestTick(loopEndSecs()));
  const sr = buf.sampleRate;
  const startSample = Math.floor(startSnapped * sr);
  const endSample = Math.min(Math.ceil(endSnapped * sr), buf.length);
  const length = Math.max(1, endSample - startSample);
  const nCh = buf.numberOfChannels;
  const ctx = getAudioCtx();
  const segment = ctx.createBuffer(nCh, length, sr);
  for (let c = 0; c < nCh; c++) {
    segment.copyToChannel(buf.getChannelData(c).subarray(startSample, endSample), c);
  }
  const wavBuf = encodeWav(segment);
  const blob = new Blob([wavBuf], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const name = (fileSelect.selectedOptions[0]?.textContent ?? 'loop').replace(/\.[^.]+$/, '');
  a.download = `${name}_loop.wav`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
(window as any).downloadLoop = downloadLoop;

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
// All times are in audioCtx.currentTime space so they align with playStartWallTime.
let metronomeNextClickTime = 0;
let metronomeRaf: number | null = null;

function playMetronomeClick(when: number) {
  const ctx = state.audioCtx;
  if (!ctx) return;
  const el = document.getElementById('loop-click-audio') as HTMLAudioElement | null;
  if (!el) return;
  const delayMs = Math.max(0, (when - ctx.currentTime) * 1000);
  window.setTimeout(() => {
    el.currentTime = 0;
    void el.play().catch(() => {});
  }, delayMs);
}

// Given a wall time, return the wall time of the next beat tick after it.
// Uses state.beatTicks (actual beat positions from Essentia) mapped through the
// loop range and playback-rate ratio. Falls back to a uniform BPM grid if ticks
// aren't available.
function nextTickWallTimeAfter(wallTime: number): number {
  const ticks = state.beatTicks;
  const lStart = loopStartSecs();
  const lEnd = loopEndSecs();
  const loopLen = lEnd - lStart;
  const ratio = state.targetBPM / state.detectedBPM;

  if (!ticks || ticks.length === 0 || loopLen <= 0 || !state.audioCtx) {
    return wallTime + 60 / state.targetBPM;
  }

  // Buffer position at wallTime, accounting for looping
  const linear = state.playStartBufferPos + (wallTime - state.playStartWallTime) * ratio;
  const bufPos = lStart + ((linear - lStart) % loopLen + loopLen) % loopLen;

  // Find the next tick inside the loop range that is strictly after bufPos
  let nextBuf: number | null = null;
  for (let i = 0; i < ticks.length; i++) {
    if (ticks[i] >= lStart && ticks[i] < lEnd && ticks[i] > bufPos + 0.005) {
      nextBuf = ticks[i]; break;
    }
  }

  let bufDelta: number;
  if (nextBuf === null) {
    // Past the last tick in the loop — wrap to first tick of next cycle
    let firstBuf: number | null = null;
    for (let i = 0; i < ticks.length; i++) {
      if (ticks[i] >= lStart && ticks[i] < lEnd) { firstBuf = ticks[i]; break; }
    }
    if (firstBuf === null) return wallTime + 60 / state.targetBPM;
    bufDelta = firstBuf - bufPos + loopLen;
  } else {
    bufDelta = nextBuf - bufPos;
  }

  return wallTime + bufDelta / ratio;
}

function scheduleMetronomeClicks() {
  if (!state.metronomeEnabled || !state.isPlaying || !state.audioCtx) return;
  const lookahead = 0.08;
  const now = state.audioCtx.currentTime;
  while (metronomeNextClickTime < now + lookahead) {
    if (metronomeNextClickTime >= now - 0.01) playMetronomeClick(metronomeNextClickTime);
    metronomeNextClickTime = nextTickWallTimeAfter(metronomeNextClickTime);
  }
  metronomeRaf = requestAnimationFrame(scheduleMetronomeClicks);
}

function startMetronomeLoop() {
  if (metronomeRaf !== null) return;
  const ctx = state.audioCtx!;
  metronomeNextClickTime = nextTickWallTimeAfter(ctx.currentTime);
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
  const safePos = clamp(bufferPos, lStart, Math.max(lStart, lEnd - 0.01));

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

function setVolume(v: number, persist = true) {
  state.volume = clamp(v, 0, 1);
  if (state.gainNode) state.gainNode.gain.value = state.volume;
  setVolumeDisplay(state.volume);
  if (persist) try { localStorage.setItem(STORAGE_VOLUME, String(state.volume)); } catch (_) {}
}

// Undo / redo
interface Snapshot { targetBPM: number; loopStartBeats: number; loopEndBeats: number; volume: number; }

const undoStack: Snapshot[] = [];
const redoStack: Snapshot[] = [];
const MAX_UNDO = 100;

function captureSnapshot(): Snapshot {
  return { targetBPM: state.targetBPM, loopStartBeats: state.loopStartBeats, loopEndBeats: state.loopEndBeats, volume: state.volume };
}

function pushUndo() {
  undoStack.push(captureSnapshot());
  if (undoStack.length > MAX_UNDO) undoStack.shift();
  redoStack.length = 0;
}

function applySnapshot(snap: Snapshot) {
  setTargetBPM(snap.targetBPM, false);
  setLoopPoints(snap.loopStartBeats, snap.loopEndBeats, false);
  setVolume(snap.volume, false);
  persistCurrentFileSettings();
  try { localStorage.setItem(STORAGE_VOLUME, String(snap.volume)); } catch (_) {}
}

function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(captureSnapshot());
  applySnapshot(undoStack.pop()!);
}

function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(captureSnapshot());
  applySnapshot(redoStack.pop()!);
}

function clearUndoHistory() {
  undoStack.length = 0;
  redoStack.length = 0;
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
  pushUndo();
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

// Loop section: drag anywhere to move the loop window; tap the hint label to edit length.
// We use pointerup (not click) to detect a hint tap because setPointerCapture redirects
// pointerup to the section element, which prevents click from ever firing on the hint.
let loopDragActive = false;
let loopDragStartX = 0;
let loopDragStartBeats = 0;
let loopDragSpan = 0;
let loopDragDidMove = false;
let loopDragInitialTarget: Element | null = null;

loopSection.addEventListener('pointerdown', e => {
  if (!state.originalBuffer) return;
  if (document.activeElement === loopLengthInput) return;
  pushUndo();
  loopSection.setPointerCapture(e.pointerId);
  loopDragActive = true;
  loopDragStartX = e.clientX;
  loopDragStartBeats = state.loopStartBeats;
  loopDragSpan = state.loopEndBeats - state.loopStartBeats;
  loopDragDidMove = false;
  loopDragInitialTarget = e.target as Element;
  loopSection.classList.add('dragging');
  resetInactivityTimer();
});
loopSection.addEventListener('pointermove', e => {
  if (!loopDragActive) return;
  if (e.clientX !== loopDragStartX) loopDragDidMove = true;
  if (!loopDragDidMove) return;
  const r = loopSection.getBoundingClientRect();
  const total = totalBeats();
  const deltaBeats = Math.round((e.clientX - loopDragStartX) / r.width * total);
  const newStart = clamp(loopDragStartBeats + deltaBeats, 0, total - loopDragSpan);
  setLoopPoints(newStart, newStart + loopDragSpan);
});
loopSection.addEventListener('pointerup', e => {
  const didMove = loopDragDidMove;
  const initialTarget = loopDragInitialTarget;
  loopDragActive = false;
  loopDragDidMove = false;
  loopDragInitialTarget = null;
  loopSection.classList.remove('dragging');
  try { loopSection.releasePointerCapture(e.pointerId); } catch (_) {}

  if (!didMove && initialTarget?.closest('#loop-hint')) {
    enterLoopLengthEdit();
    return;
  }
  if (didMove && state.originalBuffer && state.rbNode) {
    const wasPlaying = state.isPlaying;
    stopSource();
    if (wasPlaying) startSource(loopStartSecs());
    else state.pausedBufferPos = loopStartSecs();
  }
});
loopSection.addEventListener('pointercancel', e => {
  loopDragActive = false;
  loopDragDidMove = false;
  loopDragInitialTarget = null;
  loopSection.classList.remove('dragging');
  try { loopSection.releasePointerCapture(e.pointerId); } catch (_) {}
});

function evalArithmetic(expr: string): number | null {
  if (!/^[\d\s+\-*/.()]+$/.test(expr)) return null;
  try {
    const v = Function('"use strict"; return (' + expr + ')')();
    return typeof v === 'number' && isFinite(v) ? v : null;
  } catch { return null; }
}

function enterLoopLengthEdit() {
  loopLengthInput.value = String(state.loopEndBeats - state.loopStartBeats);
  loopLengthInput.style.display = 'block';
  loopHint.style.visibility = 'hidden';
  loopLengthInput.focus();
  loopLengthInput.select();
}

function commitLoopLengthEdit() {
  if (loopLengthInput.style.display === 'none') return;
  const v = evalArithmetic(loopLengthInput.value.trim());
  if (v !== null && v >= 1) {
    pushUndo();
    setLoopPoints(state.loopStartBeats, state.loopStartBeats + Math.round(v));
  }
  loopLengthInput.style.display = 'none';
  loopHint.style.visibility = '';
}

const loopLengthInput = document.getElementById('loop-length-input') as HTMLInputElement;
loopLengthInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { commitLoopLengthEdit(); e.preventDefault(); }
  if (e.key === 'Escape') { loopLengthInput.style.display = 'none'; loopHint.style.visibility = ''; }
});
loopLengthInput.addEventListener('blur', commitLoopLengthEdit);
loopLengthInput.addEventListener('pointerdown', e => e.stopPropagation());

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
  if (e.key === 'z' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    if (e.shiftKey) redo(); else undo();
  }
  else if (e.key === ' ') {
    e.preventDefault();
    if (e.shiftKey) { if (state.isPlaying) { stopSource(); } else { state.pausedBufferPos = 0; play(); } }
    else togglePlay();
  }
  else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); stopSource(); state.pausedBufferPos = 0; play(); }
  else if (e.key === ']') { pushUndo(); setTargetBPM(state.targetBPM + 5); }
  else if (e.key === '[') { pushUndo(); setTargetBPM(state.targetBPM - 5); }
  else if (e.key === '=') { pushUndo(); setTargetBPM(state.targetBPM + 1); }
  else if (e.key === '-') { pushUndo(); setTargetBPM(state.targetBPM - 1); }
  else if (e.key === '.' || e.key === ',') {
    if (!state.originalBuffer) return;
    e.preventDefault();
    const span = state.loopEndBeats - state.loopStartBeats;
    const delta = e.key === '.' ? 1 : -1;
    const newStart = clamp(state.loopStartBeats + delta, 0, totalBeats() - span);
    pushUndo();
    setLoopPoints(newStart, newStart + span);
    const wasPlaying = state.isPlaying;
    stopSource();
    if (wasPlaying) startSource(loopStartSecs());
    else state.pausedBufferPos = loopStartSecs();
  }
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
  clearUndoHistory();
  state.originalBuffer = null;
  state.pausedBufferPos = 0;
  state.currentFileId = id;
  setStatus('Decoding…');

  try {
    const ctx = getAudioCtx();
    const raw = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const decoded = trimSilence(raw);
    state.originalBuffer = decoded;

    const cached = await loadBeatCache(id);
    let bpm: number, ticks: Float32Array;
    if (cached) {
      ({ bpm, ticks } = cached);
      setStatus('Loading…');
    } else {
      setStatus('Detecting BPM…');
      await new Promise(r => setTimeout(r, 0));
      ({ bpm, ticks } = await detectRhythm(decoded));
      saveBeatCache(id, bpm, ticks).catch(() => {});
    }
    state.detectedBPM = bpm;
    state.beatTicks = ticks;
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

    document.getElementById('download-btn')?.classList.add('visible');
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
