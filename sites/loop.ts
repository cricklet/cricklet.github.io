import { createRubberBandNode, RubberBandNode } from 'rubberband-web';
// @ts-ignore — esbuild inlines this as a string via --loader:.txt=text
import processorSrc from './rubberband-processor.txt';
// @ts-ignore
import { EssentiaWASM } from 'essentia.js/dist/essentia-wasm.es.js';
// @ts-ignore
import EssentiaCore from 'essentia.js/dist/essentia.js-core.es.js';

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
const TRANSPOSE_MIN = -24;
const TRANSPOSE_MAX = 24;

const DB_NAME = 'loop-player';
const DB_VERSION = 3;
const DB_STORE_FILES = 'files';
const DB_STORE_META = 'meta';
const DB_STORE_BEATS = 'beats';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
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

// Per-loop data
interface LoopData {
  id: string;
  startBeats: number;
  endBeats: number;
  targetBPM: number;
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Waveform visualization
let waveformPeaks: Float32Array | null = null;

function computeWaveform(buffer: AudioBuffer) {
  const buckets = 1200;
  const raw = new Float32Array(buckets);
  const nCh = buffer.numberOfChannels;
  const len = buffer.length;
  const step = len / buckets;
  for (let b = 0; b < buckets; b++) {
    const start = Math.floor(b * step);
    const end = Math.floor((b + 1) * step);
    let peak = 0;
    for (let c = 0; c < nCh; c++) {
      const ch = buffer.getChannelData(c);
      for (let i = start; i < end; i++) {
        const v = Math.abs(ch[i]);
        if (v > peak) peak = v;
      }
    }
    raw[b] = peak;
  }

  // Gaussian smooth
  const radius = 8;
  const sigma = radius / 2;
  const kernel: number[] = [];
  let kernelSum = 0;
  for (let j = -radius; j <= radius; j++) {
    const w = Math.exp(-0.5 * (j / sigma) ** 2);
    kernel.push(w);
    kernelSum += w;
  }
  for (let j = 0; j < kernel.length; j++) kernel[j] /= kernelSum;

  const smoothed = new Float32Array(buckets);
  for (let b = 0; b < buckets; b++) {
    let v = 0;
    for (let j = -radius; j <= radius; j++) {
      const idx = clamp(b + j, 0, buckets - 1);
      v += raw[idx] * kernel[j + radius];
    }
    smoothed[b] = v;
  }
  for (let b = 0; b < buckets; b++) smoothed[b] = smoothed[b] ** 1.5;
  waveformPeaks = smoothed;
}

function drawWaveformOnCanvas(canvas: HTMLCanvasElement) {
  if (!waveformPeaks) return;
  const peaks = waveformPeaks;
  const w = canvas.width;
  const h = canvas.height;
  const ctx2d = canvas.getContext('2d')!;
  ctx2d.clearRect(0, 0, w, h);
  ctx2d.fillStyle = 'rgba(128, 128, 128, 0.18)';
  for (let x = 0; x < w; x++) {
    const b = Math.floor(x / w * peaks.length);
    const barH = Math.max(1, peaks[b] * (h - 2) * 0.92);
    ctx2d.fillRect(x, h - barH, 1, barH);
  }
}

// Per-file settings in localStorage keyed by file id
interface FileSettings {
  loops?: LoopData[];
  activeLoopId?: string | null;
  volume?: number;
  transposeSemitones?: number;
  // Legacy fields
  targetBPM?: number;
  loopStartBeats?: number;
  loopEndBeats?: number;
}

function loadFileSettings(id: string): FileSettings {
  try { return JSON.parse(localStorage.getItem(`loop_file_${id}`) ?? '{}'); } catch (_) { return {}; }
}

function syncStateToActiveLoop() {
  const loop = state.loops.find(l => l.id === state.activeLoopId);
  if (loop) {
    loop.startBeats = state.loopStartBeats;
    loop.endBeats = state.loopEndBeats;
    loop.targetBPM = state.targetBPM;
  }
}

function persistCurrentFileSettings() {
  if (!state.currentFileId) return;
  syncStateToActiveLoop();
  try {
    localStorage.setItem(`loop_file_${state.currentFileId}`, JSON.stringify({
      loops: state.loops,
      activeLoopId: state.activeLoopId,
      volume: state.volume,
      transposeSemitones: state.transposeSemitones,
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
  transposeSemitones: number;
  currentFileId: string | null;
  beatTicks: Float32Array | null;
  loops: LoopData[];
  activeLoopId: string | null;
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
  transposeSemitones: 0,
  currentFileId: null,
  beatTicks: null,
  loops: [],
  activeLoopId: null,
};

function getAudioCtx(): AudioContext {
  if (!state.audioCtx) state.audioCtx = new AudioContext();
  return state.audioCtx;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function updateRowHeight() {
  const nLoops = Math.max(1, state.loops.length);
  const hasFile = !!state.originalBuffer;
  const addRowH = hasFile ? 36 : 0;
  const vh = window.innerHeight;
  const topBarH = 40;

  // Natural heights matching the old clamp(72px, 9dvh, 112px) / clamp(52px, 6.5dvh, 80px)
  const naturalH = clamp(vh * 0.09, 72, 112);
  const naturalVH = clamp(vh * 0.065, 52, 80);

  // Shrink only when needed to fit everything
  const available = vh - topBarH - addRowH - 60; // top-bar + add-row + min main-area
  const totalUnits = nLoops + 1 + 0.72; // loop rows + bpm + volume
  const idealH = available / totalUnits;

  const h = Math.round(clamp(Math.min(naturalH, idealH), 44, 112));
  const vH = Math.round(clamp(Math.min(naturalVH, h * 0.72), 32, 80));
  const loopsMaxH = Math.max(h, vh - topBarH - addRowH - h - vH - 60);
  document.documentElement.style.setProperty('--row-height', `${h}px`);
  document.documentElement.style.setProperty('--volume-height', `${vH}px`);
  document.documentElement.style.setProperty('--loops-max-height', `${loopsMaxH}px`);
}

window.addEventListener('resize', updateRowHeight);

// Static DOM refs
const bpmSection = document.getElementById('bpm-section')!;
const volumeSection = document.getElementById('volume-section')!;
const bpmFill = document.getElementById('bpm-fill')!;
const volumeFill = document.getElementById('volume-fill')!;
const bpmReadout = document.getElementById('bpm-readout')!;
const volumeReadout = document.getElementById('volume-readout')!;
const statusHint = document.getElementById('status-hint')!;
const detectedTick = document.getElementById('detected-tick')!;
const detectedBpmInput = document.getElementById('detected-bpm-input') as HTMLInputElement;

// Dynamic refs — point to active loop card elements, updated by renderLoopCards()
let activeLoopCard: HTMLElement | null = null;
let loopBetween: HTMLElement | null = null;
let loopHint: HTMLElement | null = null;
let loopPlayhead: HTMLElement | null = null;
let loopPausedPlayhead: HTMLElement | null = null;
let loopStartLabel: HTMLElement | null = null;
let loopEndLabel: HTMLElement | null = null;
let loopLengthInput: HTMLInputElement | null = null;
let loopStartInput: HTMLInputElement | null = null;
let loopEndInput: HTMLInputElement | null = null;
let loopStartHandle: HTMLElement | null = null;
let loopEndHandle: HTMLElement | null = null;

function setPausedPos(pos: number) {
  state.pausedBufferPos = pos;
  if (loopPausedPlayhead && state.originalBuffer) {
    const frac = pos / state.originalBuffer.duration;
    loopPausedPlayhead.style.left = `${clamp(frac, 0, 1) * 100}%`;
  }
}

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
  statusHint.style.pointerEvents = 'none';
  statusHint.style.opacity = '';
}

function setDetectedStatus(durationStr: string, bpm: number) {
  statusHint.style.pointerEvents = 'auto';
  statusHint.style.opacity = '0.5';
  statusHint.innerHTML = `${durationStr} · detected <span class="detected-bpm-clickable" title="Click to re-detect with a BPM hint">${bpm}</span> BPM`;
  statusHint.querySelector('.detected-bpm-clickable')!.addEventListener('click', enterDetectedBPMHintEdit);
}

function enterDetectedBPMHintEdit() {
  detectedBpmInput.value = String(state.detectedBPM);
  statusHint.style.visibility = 'hidden';
  detectedBpmInput.style.display = 'block';
  detectedBpmInput.focus();
  detectedBpmInput.select();
}

async function commitDetectedBPMHintEdit() {
  if (detectedBpmInput.style.display === 'none') return;
  detectedBpmInput.style.display = 'none';
  statusHint.style.visibility = '';
  const v = parseInt(detectedBpmInput.value.trim(), 10);
  if (!Number.isFinite(v) || v < BPM_MIN || v > BPM_MAX || !state.originalBuffer || !state.currentFileId) return;
  if (v === state.detectedBPM) return;
  setStatus('Re-detecting BPM…');
  try {
    const buf = state.originalBuffer;
    const { bpm, ticks } = await detectRhythm(buf, v);
    state.detectedBPM = bpm;
    state.beatTicks = ticks;
    saveBeatCache(state.currentFileId, bpm, ticks).catch(() => {});
    const tickFrac = (bpm - BPM_MIN) / (BPM_MAX - BPM_MIN);
    detectedTick.style.left = `${clamp(tickFrac, 0, 1) * 100}%`;
    const mins = Math.floor(buf.duration / 60);
    const secs = Math.round(buf.duration % 60).toString().padStart(2, '0');
    setDetectedStatus(`${mins}:${secs}`, bpm);
  } catch (e) {
    setStatus(`Error: ${(e as Error).message}`);
  }
}

detectedBpmInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { void commitDetectedBPMHintEdit(); e.preventDefault(); }
  else if (e.key === 'Escape') {
    detectedBpmInput.style.display = 'none';
    statusHint.style.visibility = '';
    e.preventDefault();
  }
});
detectedBpmInput.addEventListener('blur', () => { void commitDetectedBPMHintEdit(); });

function totalBeats(): number {
  if (!state.originalBuffer) return 0;
  return Math.ceil(state.originalBuffer.duration * state.detectedBPM / 60);
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

function updateActiveLoopCardDisplay() {
  if (!loopBetween || !loopHint || !loopStartLabel || !loopEndLabel) return;
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
  if (loopStartHandle) loopStartHandle.style.left = `${startFrac * 100}%`;
  if (loopEndHandle) loopEndHandle.style.left = `${endFrac * 100}%`;
}

function updateInactiveCardDisplay(
  card: HTMLElement,
  loop: LoopData,
) {
  const between = card.querySelector<HTMLElement>('.loop-between')!;
  const hint = card.querySelector<HTMLElement>('.loop-hint')!;
  const startLbl = card.querySelector<HTMLElement>('.loop-start-label')!;
  const endLbl = card.querySelector<HTMLElement>('.loop-end-label')!;
  const total = totalBeats();
  if (total === 0) return;
  const startFrac = loop.startBeats / total;
  const endFrac = loop.endBeats / total;
  between.style.left = `${startFrac * 100}%`;
  between.style.width = `${(endFrac - startFrac) * 100}%`;
  hint.textContent = String(loop.endBeats - loop.startBeats);
  startLbl.textContent = String(loop.startBeats);
  startLbl.style.left = `${startFrac * 100}%`;
  endLbl.textContent = String(loop.endBeats);
  endLbl.style.left = `${endFrac * 100}%`;
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
  if (loopPlayhead) loopPlayhead.style.left = `${clamp(frac, 0, 1) * 100}%`;
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
  if (state.isPlaying && state.audioCtx) {
    state.playStartBufferPos = currentLoopedBufferPos();
    state.playStartWallTime = state.audioCtx.currentTime;
  }
  const newStart = clamp(startBeats, 0, total - 1);
  const newEnd = clamp(endBeats, newStart + 1, total);
  state.loopStartBeats = newStart;
  state.loopEndBeats = newEnd;
  updateActiveLoopCardDisplay();
  if (state.currentSource) {
    state.currentSource.loopStart = loopStartSecs();
    state.currentSource.loopEnd = loopEndSecs();
  }
  if (persist) persistCurrentFileSettings();
}

async function detectRhythm(buffer: AudioBuffer, hintBPM?: number): Promise<{ bpm: number; ticks: Float32Array }> {
  const essentia = await getEssentia();
  const ctx = getAudioCtx();
  const wasSuspended = ctx.state === 'suspended';
  if (ctx.state === 'running') await ctx.suspend();
  let bpm: number;
  let ticks: Float32Array;
  const ESSENTIA_MAX = 208;
  const minBPM = hintBPM ? Math.max(40, Math.floor(hintBPM * 0.85)) : 40;
  const maxBPM = hintBPM ? Math.min(ESSENTIA_MAX, Math.ceil(hintBPM * 1.15)) : ESSENTIA_MAX;
  try {
    const mono = essentia.audioBufferToMonoSignal(buffer);
    const signal = essentia.arrayToVector(mono);
    const result = essentia.RhythmExtractor2013(signal, maxBPM, 'multifeature', minBPM);
    bpm = Math.round(result.bpm);
    ticks = essentia.vectorToArray(result.ticks);
  } finally {
    if (!wasSuspended) await ctx.resume();
  }
  return { bpm, ticks };
}

// WAV export
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

function downloadLoopById(id: string) {
  if (!state.originalBuffer) return;
  const loop = state.loops.find(l => l.id === id);
  if (!loop) return;
  const buf = state.originalBuffer;
  const beatDur = 60 / state.detectedBPM;
  const startSecs = loop.startBeats * beatDur;
  const endSecs = loop.endBeats * beatDur;
  const startSnapped = Math.max(0, snapToNearestTick(startSecs));
  const endSnapped = Math.min(buf.duration, snapToNearestTick(endSecs));
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
  const loopIdx = state.loops.findIndex(l => l.id === id) + 1;
  a.download = state.loops.length > 1 ? `${name}_loop${loopIdx}.wav` : `${name}_loop.wav`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function downloadLoop() {
  if (state.activeLoopId) downloadLoopById(state.activeLoopId);
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

// Metronome
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

function nextTickWallTimeAfter(wallTime: number): number {
  const ticks = state.beatTicks;
  const lStart = loopStartSecs();
  const lEnd = loopEndSecs();
  const loopLen = lEnd - lStart;
  const ratio = state.targetBPM / state.detectedBPM;
  if (!ticks || ticks.length === 0 || loopLen <= 0 || !state.audioCtx) {
    return wallTime + 60 / state.targetBPM;
  }
  const linear = state.playStartBufferPos + (wallTime - state.playStartWallTime) * ratio;
  const bufPos = lStart + ((linear - lStart) % loopLen + loopLen) % loopLen;
  let nextBuf: number | null = null;
  for (let i = 0; i < ticks.length; i++) {
    if (ticks[i] >= lStart && ticks[i] < lEnd && ticks[i] > bufPos + 0.005) {
      nextBuf = ticks[i]; break;
    }
  }
  let bufDelta: number;
  if (nextBuf === null) {
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

// Transpose
function updateTransposeBtn() {
  const btn = document.getElementById('transpose-btn');
  if (!btn) return;
  const n = state.transposeSemitones;
  btn.textContent = n > 0 ? `+${n}` : String(n);
  btn.classList.toggle('active', n !== 0);
}

function setTransposeSemitones(n: number, persist = true) {
  state.transposeSemitones = clamp(Math.round(n), TRANSPOSE_MIN, TRANSPOSE_MAX);
  updateTransposeBtn();
  if (state.isPlaying && state.rbNode) {
    const ratio = state.targetBPM / state.detectedBPM;
    state.rbNode.setPitch((1 / ratio) * Math.pow(2, state.transposeSemitones / 12));
  }
  if (persist) persistCurrentFileSettings();
}

function parseTransposeInput(raw: string): number | null {
  const t = raw.trim().toLowerCase();
  if (t === 'bb') return 2;
  if (t === 'eb') return -3;
  const n = Number(t);
  return Number.isInteger(n) && Number.isFinite(n) ? n : null;
}

function enterTransposeEdit() {
  const btn = document.getElementById('transpose-btn')!;
  const input = document.getElementById('transpose-input') as HTMLInputElement;
  input.value = String(state.transposeSemitones);
  btn.style.display = 'none';
  input.style.display = 'block';
  input.focus();
  input.select();
}

function commitTransposeEdit() {
  const btn = document.getElementById('transpose-btn')!;
  const input = document.getElementById('transpose-input') as HTMLInputElement;
  if (input.style.display === 'none') return;
  const v = parseTransposeInput(input.value);
  if (v !== null) {
    pushUndo();
    setTransposeSemitones(v);
  }
  input.style.display = 'none';
  btn.style.display = '';
}

document.getElementById('transpose-btn')!.addEventListener('click', enterTransposeEdit);
const transposeInput = document.getElementById('transpose-input') as HTMLInputElement;
transposeInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { commitTransposeEdit(); e.preventDefault(); }
  else if (e.key === 'Escape') {
    const btn = document.getElementById('transpose-btn')!;
    transposeInput.style.display = 'none';
    btn.style.display = '';
    e.preventDefault();
  }
});
transposeInput.addEventListener('blur', commitTransposeEdit);

function stopSource() {
  if (state.currentSource) {
    setPausedPos(currentBufferPos());
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
  state.rbNode!.setPitch((1 / ratio) * Math.pow(2, state.transposeSemitones / 12));
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
      setPausedPos(0);
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
    state.rbNode!.setPitch((1 / ratio) * Math.pow(2, state.transposeSemitones / 12));
    state.playStartBufferPos = bufPos;
    state.playStartWallTime = state.audioCtx!.currentTime;
  }
}

function setVolume(v: number, persist = true) {
  state.volume = clamp(v, 0, 1);
  if (state.gainNode) state.gainNode.gain.value = state.volume;
  setVolumeDisplay(state.volume);
  if (persist) {
    try { localStorage.setItem(STORAGE_VOLUME, String(state.volume)); } catch (_) {}
    persistCurrentFileSettings();
  }
}

// Undo / redo
interface Snapshot { targetBPM: number; loopStartBeats: number; loopEndBeats: number; volume: number; transposeSemitones: number; }
const undoStack: Snapshot[] = [];
const redoStack: Snapshot[] = [];
const MAX_UNDO = 100;

function captureSnapshot(): Snapshot {
  return { targetBPM: state.targetBPM, loopStartBeats: state.loopStartBeats, loopEndBeats: state.loopEndBeats, volume: state.volume, transposeSemitones: state.transposeSemitones };
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
  setTransposeSemitones(snap.transposeSemitones, false);
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

// Pointer drag for BPM / Volume
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

// Loop card drag state
let loopDragActive = false;
let loopDragStartX = 0;
let loopDragStartBeats = 0;
let loopDragSpan = 0;
let loopDragDidMove = false;
let loopDragInitialTarget: Element | null = null;

// Resize handle drag state
let resizeDragActive = false;
let resizeDragSide: 'start' | 'end' = 'start';
let resizeDragStartX = 0;
let resizeDragStartBeats = 0;

function enterLoopLengthEdit() {
  if (!loopLengthInput || !loopHint) return;
  commitLoopStartEdit();
  commitLoopEndEdit();
  const card = loopHint.closest('.loop-card')!;
  const cardRect = card.getBoundingClientRect();
  const hintRect = loopHint.getBoundingClientRect();
  loopLengthInput.style.left = `${(hintRect.left + hintRect.width / 2 - cardRect.left) / cardRect.width * 100}%`;
  loopLengthInput.value = String(state.loopEndBeats - state.loopStartBeats);
  loopLengthInput.style.display = 'block';
  loopHint.style.visibility = 'hidden';
  loopLengthInput.focus();
  loopLengthInput.select();
}

function evalRelative(expr: string, current: number): number | null {
  const trimmed = expr.trim();
  if (trimmed.startsWith('+')) {
    const delta = evalArithmetic(trimmed.slice(1));
    return delta !== null ? current + delta : null;
  }
  if (trimmed.startsWith('-')) {
    const delta = evalArithmetic(trimmed.slice(1));
    return delta !== null ? current - delta : null;
  }
  return evalArithmetic(trimmed);
}

function evalArithmetic(expr: string): number | null {
  if (!/^[\d\s+\-*/.()]+$/.test(expr)) return null;
  try {
    const v = Function('"use strict"; return (' + expr + ')')();
    return typeof v === 'number' && isFinite(v) ? v : null;
  } catch { return null; }
}

function commitLoopLengthEdit() {
  if (!loopLengthInput || loopLengthInput.style.display === 'none') return;
  const v = evalArithmetic(loopLengthInput.value.trim());
  if (v !== null && v >= 1) {
    pushUndo();
    setLoopPoints(state.loopStartBeats, state.loopStartBeats + Math.round(v));
  }
  loopLengthInput.style.display = 'none';
  if (loopHint) loopHint.style.visibility = '';
}

function enterLoopStartEdit() {
  if (!loopStartInput || !loopStartLabel) return;
  commitLoopLengthEdit();
  commitLoopEndEdit();
  const card = loopStartLabel.closest('.loop-card')!;
  const cardRect = card.getBoundingClientRect();
  const lblRect = loopStartLabel.getBoundingClientRect();
  loopStartInput.style.left = `${(lblRect.left + lblRect.width / 2 - cardRect.left) / cardRect.width * 100}%`;
  loopStartInput.value = String(state.loopStartBeats);
  loopStartInput.style.display = 'block';
  loopStartLabel.style.visibility = 'hidden';
  loopStartInput.focus();
  loopStartInput.select();
}

function commitLoopStartEdit() {
  if (!loopStartInput || loopStartInput.style.display === 'none') return;
  const v = evalRelative(loopStartInput.value.trim(), state.loopStartBeats);
  if (v !== null) {
    const newStart = Math.round(v);
    if (newStart !== state.loopStartBeats) {
      const span = state.loopEndBeats - state.loopStartBeats;
      const newEnd = newStart + span;
      if (newStart >= 0 && newEnd <= totalBeats()) {
        pushUndo();
        setLoopPoints(newStart, newEnd);
      }
    }
  }
  loopStartInput.style.display = 'none';
  if (loopStartLabel) loopStartLabel.style.visibility = '';
}

function enterLoopEndEdit() {
  if (!loopEndInput || !loopEndLabel) return;
  commitLoopLengthEdit();
  commitLoopStartEdit();
  const card = loopEndLabel.closest('.loop-card')!;
  const cardRect = card.getBoundingClientRect();
  const lblRect = loopEndLabel.getBoundingClientRect();
  loopEndInput.style.left = `${(lblRect.left + lblRect.width / 2 - cardRect.left) / cardRect.width * 100}%`;
  loopEndInput.value = String(state.loopEndBeats);
  loopEndInput.style.display = 'block';
  loopEndLabel.style.visibility = 'hidden';
  loopEndInput.focus();
  loopEndInput.select();
}

function commitLoopEndEdit() {
  if (!loopEndInput || loopEndInput.style.display === 'none') return;
  const v = evalRelative(loopEndInput.value.trim(), state.loopEndBeats);
  if (v !== null) {
    const newEnd = Math.round(v);
    if (newEnd !== state.loopEndBeats && newEnd > state.loopStartBeats) {
      pushUndo();
      setLoopPoints(state.loopStartBeats, newEnd);
    }
  }
  loopEndInput.style.display = 'none';
  if (loopEndLabel) loopEndLabel.style.visibility = '';
}

function setupActiveCardDrag(card: HTMLElement) {
  card.addEventListener('pointerdown', e => {
    if (!state.originalBuffer) return;
    if ((e.target as Element).closest('.loop-icon-btn, .loop-beat-label, .loop-resize-handle')) return;
    const focused = document.activeElement;
    if (focused === loopLengthInput || focused === loopStartInput || focused === loopEndInput) return;

    const r = card.getBoundingClientRect();
    const total = totalBeats();
    const clickBeats = total > 0 && r.width > 0 ? (e.clientX - r.left) / r.width * total : -1;

    if (total > 0 && clickBeats >= state.loopStartBeats && clickBeats <= state.loopEndBeats) {
      // Click inside loop — drag the closer of start/end
      pushUndo();
      card.setPointerCapture(e.pointerId);
      resizeDragActive = true;
      const distToStart = Math.abs(clickBeats - state.loopStartBeats);
      const distToEnd = Math.abs(clickBeats - state.loopEndBeats);
      resizeDragSide = distToStart <= distToEnd ? 'start' : 'end';
      resizeDragStartX = e.clientX;
      resizeDragStartBeats = resizeDragSide === 'start' ? state.loopStartBeats : state.loopEndBeats;
      loopDragDidMove = false;
      loopDragInitialTarget = e.target as Element;
      card.classList.add('resizing');
      return;
    }

    pushUndo();
    card.setPointerCapture(e.pointerId);
    loopDragActive = true;
    loopDragStartX = e.clientX;
    loopDragStartBeats = state.loopStartBeats;
    loopDragSpan = state.loopEndBeats - state.loopStartBeats;
    loopDragDidMove = false;
    loopDragInitialTarget = e.target as Element;
    card.classList.add('dragging');
  });

  card.addEventListener('pointermove', e => {
    if (resizeDragActive) {
      const r = card.getBoundingClientRect();
      const total = totalBeats();
      const deltaBeats = Math.round((e.clientX - resizeDragStartX) / r.width * total);
      const newBeats = resizeDragStartBeats + deltaBeats;
      if (e.clientX !== resizeDragStartX) loopDragDidMove = true;
      if (resizeDragSide === 'start') {
        setLoopPoints(clamp(newBeats, 0, state.loopEndBeats - 1), state.loopEndBeats);
        if (loopStartHandle) loopStartHandle.style.opacity = '1';
        if (loopEndHandle) loopEndHandle.style.opacity = '0';
      } else {
        setLoopPoints(state.loopStartBeats, clamp(newBeats, state.loopStartBeats + 1, total));
        if (loopStartHandle) loopStartHandle.style.opacity = '0';
        if (loopEndHandle) loopEndHandle.style.opacity = '1';
      }
      return;
    }
    if (loopDragActive) {
      if (e.clientX !== loopDragStartX) loopDragDidMove = true;
      if (!loopDragDidMove) return;
      const r = card.getBoundingClientRect();
      const total = totalBeats();
      const deltaBeats = Math.round((e.clientX - loopDragStartX) / r.width * total);
      const newStart = clamp(loopDragStartBeats + deltaBeats, 0, total - loopDragSpan);
      setLoopPoints(newStart, newStart + loopDragSpan);
      return;
    }
    // Hover: show only the handle closer to the cursor (if inside loop region)
    const r = card.getBoundingClientRect();
    const total = totalBeats();
    if (total > 0 && r.width > 0 && loopStartHandle && loopEndHandle) {
      const hoverBeats = (e.clientX - r.left) / r.width * total;
      if (hoverBeats >= state.loopStartBeats && hoverBeats <= state.loopEndBeats) {
        const nearStart = Math.abs(hoverBeats - state.loopStartBeats) <= Math.abs(hoverBeats - state.loopEndBeats);
        loopStartHandle.style.opacity = nearStart ? '1' : '0';
        loopEndHandle.style.opacity = nearStart ? '0' : '1';
        card.style.cursor = 'ew-resize';
      } else {
        loopStartHandle.style.opacity = '0';
        loopEndHandle.style.opacity = '0';
        card.style.cursor = '';
      }
    }
  });

  card.addEventListener('pointerleave', () => {
    if (resizeDragActive || loopDragActive) return;
    if (loopStartHandle) loopStartHandle.style.opacity = '0';
    if (loopEndHandle) loopEndHandle.style.opacity = '0';
    card.style.cursor = '';
  });

  card.addEventListener('pointerup', e => {
    if (resizeDragActive) {
      resizeDragActive = false;
      card.classList.remove('resizing');
      try { card.releasePointerCapture(e.pointerId); } catch (_) {}
      const resizeDidMove = loopDragDidMove;
      const resizeInitialTarget = loopDragInitialTarget;
      loopDragDidMove = false;
      loopDragInitialTarget = null;
      if (loopStartHandle) loopStartHandle.style.opacity = '0';
      if (loopEndHandle) loopEndHandle.style.opacity = '0';
      card.style.cursor = '';
      if (!resizeDidMove && resizeInitialTarget?.closest('.loop-hint')) {
        enterLoopLengthEdit();
        return;
      }
      if (state.originalBuffer && state.rbNode) {
        const wasPlaying = state.isPlaying;
        stopSource();
        if (wasPlaying) startSource(loopStartSecs());
        else setPausedPos(loopStartSecs());
      }
      return;
    }
    const didMove = loopDragDidMove;
    const initialTarget = loopDragInitialTarget;
    loopDragActive = false;
    loopDragDidMove = false;
    loopDragInitialTarget = null;
    card.classList.remove('dragging');
    try { card.releasePointerCapture(e.pointerId); } catch (_) {}

    if (!didMove && initialTarget?.closest('.loop-hint')) {
      enterLoopLengthEdit();
      return;
    }
    if (didMove && state.originalBuffer && state.rbNode) {
      const wasPlaying = state.isPlaying;
      stopSource();
      if (wasPlaying) startSource(loopStartSecs());
      else setPausedPos(loopStartSecs());
    }
  });

  card.addEventListener('pointercancel', e => {
    if (resizeDragActive) {
      resizeDragActive = false;
      loopDragDidMove = false;
      loopDragInitialTarget = null;
      card.classList.remove('resizing');
      try { card.releasePointerCapture(e.pointerId); } catch (_) {}
      return;
    }
    loopDragActive = false;
    loopDragDidMove = false;
    loopDragInitialTarget = null;
    card.classList.remove('dragging');
    try { card.releasePointerCapture(e.pointerId); } catch (_) {}
  });
}

function setupHandleDrag(card: HTMLElement, startHandle: HTMLElement, endHandle: HTMLElement) {
  function onDown(e: PointerEvent, side: 'start' | 'end') {
    e.stopPropagation();
    if (!state.originalBuffer) return;
    pushUndo();
    card.setPointerCapture(e.pointerId);
    resizeDragActive = true;
    resizeDragSide = side;
    resizeDragStartX = e.clientX;
    resizeDragStartBeats = side === 'start' ? state.loopStartBeats : state.loopEndBeats;
    card.classList.add('resizing');
  }
  startHandle.addEventListener('pointerdown', e => onDown(e, 'start'));
  endHandle.addEventListener('pointerdown', e => onDown(e, 'end'));
}

// Loop management
function switchToLoop(id: string) {
  if (id === state.activeLoopId) return;
  commitLoopLengthEdit();
  syncStateToActiveLoop();
  state.activeLoopId = id;
  const loop = state.loops.find(l => l.id === id);
  if (!loop) return;
  clearUndoHistory();
  setTargetBPM(loop.targetBPM, false);
  setLoopPoints(loop.startBeats, loop.endBeats, false);
  const wasPlaying = state.isPlaying;
  stopSource();
  if (wasPlaying) startSource(loopStartSecs());
  else setPausedPos(loopStartSecs());
  persistCurrentFileSettings();
  renderLoopCards();
}

function addLoop() {
  if (!state.originalBuffer) return;
  syncStateToActiveLoop();
  const active = state.loops.find(l => l.id === state.activeLoopId);
  const newId = genId();
  const newLoop: LoopData = active
    ? { id: newId, startBeats: active.startBeats, endBeats: active.endBeats, targetBPM: active.targetBPM }
    : { id: newId, startBeats: 0, endBeats: totalBeats(), targetBPM: state.detectedBPM };
  state.loops.push(newLoop);
  state.activeLoopId = newId;
  clearUndoHistory();
  setTargetBPM(newLoop.targetBPM, false);
  setLoopPoints(newLoop.startBeats, newLoop.endBeats, false);
  persistCurrentFileSettings();
  renderLoopCards();
}

function deleteLoop(id: string) {
  if (state.loops.length <= 1) return;
  const idx = state.loops.findIndex(l => l.id === id);
  if (idx === -1) return;
  state.loops.splice(idx, 1);
  if (state.activeLoopId === id) {
    const newActive = state.loops[Math.min(idx, state.loops.length - 1)];
    state.activeLoopId = newActive.id;
    clearUndoHistory();
    setTargetBPM(newActive.targetBPM, false);
    setLoopPoints(newActive.startBeats, newActive.endBeats, false);
    const wasPlaying = state.isPlaying;
    stopSource();
    if (wasPlaying) startSource(loopStartSecs());
    else setPausedPos(loopStartSecs());
  }
  persistCurrentFileSettings();
  renderLoopCards();
}

function renderLoopCards() {
  const container = document.getElementById('loops-container')!;
  const addRow = document.getElementById('add-loop-row')!;

  // Commit any in-flight edit before wiping the DOM
  commitLoopLengthEdit();
  commitLoopStartEdit();
  commitLoopEndEdit();

  // Reset active refs
  activeLoopCard = null;
  loopBetween = null;
  loopHint = null;
  loopPlayhead = null;
  loopPausedPlayhead = null;
  loopStartLabel = null;
  loopEndLabel = null;
  loopLengthInput = null;
  loopStartInput = null;
  loopEndInput = null;
  loopStartHandle = null;
  loopEndHandle = null;

  container.innerHTML = '';

  for (const loop of state.loops) {
    const isActive = loop.id === state.activeLoopId;

    const card = document.createElement('div');
    card.className = 'loop-card' + (isActive ? ' active' : '');
    card.dataset.loopId = loop.id;

    // Waveform canvas — first child so it sits behind everything
    const waveCanvas = document.createElement('canvas');
    waveCanvas.className = 'loop-waveform';
    waveCanvas.width = 1200;
    waveCanvas.height = 54;
    drawWaveformOnCanvas(waveCanvas);
    card.appendChild(waveCanvas);

    const between = document.createElement('div');
    between.className = 'loop-between';

    const hint = document.createElement('div');
    hint.className = 'loop-hint';
    between.appendChild(hint);

    const input = document.createElement('input');
    input.className = 'loop-length-input';
    input.type = 'text';
    input.inputMode = 'numeric';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.style.display = 'none';

    card.appendChild(between);
    card.appendChild(input);

    const startLbl = document.createElement('div');
    startLbl.className = 'loop-beat-label loop-start-label';
    card.appendChild(startLbl);

    const endLbl = document.createElement('div');
    endLbl.className = 'loop-beat-label loop-end-label';
    card.appendChild(endLbl);

    const playhead = document.createElement('div');
    playhead.className = 'loop-playhead';
    card.appendChild(playhead);

    const pausedPlayhead = document.createElement('div');
    pausedPlayhead.className = 'loop-paused-playhead';
    card.appendChild(pausedPlayhead);

    // Hover icons
    const icons = document.createElement('div');
    icons.className = 'loop-card-icons';

    const dlBtn = document.createElement('button');
    dlBtn.type = 'button';
    dlBtn.className = 'loop-icon-btn loop-download-btn';
    dlBtn.title = 'Download loop';
    dlBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 1v9M4 7l4 4 4-4M2 13h12"/></svg>`;
    const loopId = loop.id;
    dlBtn.addEventListener('click', e => { e.stopPropagation(); downloadLoopById(loopId); });
    icons.appendChild(dlBtn);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'loop-icon-btn loop-delete-btn';
    delBtn.title = 'Delete loop';
    delBtn.innerHTML = '&times;';
    delBtn.addEventListener('click', e => { e.stopPropagation(); deleteLoop(loopId); });
    icons.appendChild(delBtn);

    card.appendChild(icons);

    if (isActive) {
      activeLoopCard = card;
      loopBetween = between;
      loopHint = hint;
      loopPlayhead = playhead;
      loopPausedPlayhead = pausedPlayhead;
      setPausedPos(state.pausedBufferPos);
      loopStartLabel = startLbl;
      loopEndLabel = endLbl;
      loopLengthInput = input;

      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { commitLoopLengthEdit(); e.preventDefault(); }
        if (e.key === 'Escape') {
          if (loopLengthInput) loopLengthInput.style.display = 'none';
          if (loopHint) loopHint.style.visibility = '';
          input.blur();
          e.preventDefault();
        }
      });
      input.addEventListener('blur', commitLoopLengthEdit);
      input.addEventListener('pointerdown', e => e.stopPropagation());

      // Start point input
      const startInput = document.createElement('input');
      startInput.className = 'loop-start-input';
      startInput.type = 'text';
      startInput.inputMode = 'numeric';
      startInput.autocomplete = 'off';
      startInput.spellcheck = false;
      startInput.style.display = 'none';
      card.appendChild(startInput);
      loopStartInput = startInput;

      // End point input
      const endInput = document.createElement('input');
      endInput.className = 'loop-end-input';
      endInput.type = 'text';
      endInput.inputMode = 'numeric';
      endInput.autocomplete = 'off';
      endInput.spellcheck = false;
      endInput.style.display = 'none';
      card.appendChild(endInput);
      loopEndInput = endInput;

      startInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { commitLoopStartEdit(); e.preventDefault(); }
        else if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); commitLoopStartEdit(); enterLoopEndEdit(); }
        else if (e.key === 'Escape') { startInput.style.display = 'none'; if (loopStartLabel) loopStartLabel.style.visibility = ''; startInput.blur(); e.preventDefault(); }
      });
      startInput.addEventListener('blur', commitLoopStartEdit);
      startInput.addEventListener('pointerdown', e => e.stopPropagation());

      endInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { commitLoopEndEdit(); e.preventDefault(); }
        else if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); commitLoopEndEdit(); enterLoopStartEdit(); }
        else if (e.key === 'Escape') { endInput.style.display = 'none'; if (loopEndLabel) loopEndLabel.style.visibility = ''; endInput.blur(); e.preventDefault(); }
      });
      endInput.addEventListener('blur', commitLoopEndEdit);
      endInput.addEventListener('pointerdown', e => e.stopPropagation());

      // Label click to edit
      startLbl.addEventListener('pointerdown', e => e.stopPropagation());
      startLbl.addEventListener('click', () => enterLoopStartEdit());
      endLbl.addEventListener('pointerdown', e => e.stopPropagation());
      endLbl.addEventListener('click', () => enterLoopEndEdit());

      const startHandle = document.createElement('div');
      startHandle.className = 'loop-resize-handle';
      card.appendChild(startHandle);
      loopStartHandle = startHandle;

      const endHandle = document.createElement('div');
      endHandle.className = 'loop-resize-handle';
      card.appendChild(endHandle);
      loopEndHandle = endHandle;

      setupActiveCardDrag(card);
      setupHandleDrag(card, startHandle, endHandle);
      updateActiveLoopCardDisplay();
    } else {
      card.addEventListener('pointerdown', e => {
        if ((e.target as Element).closest('.loop-icon-btn')) return;
        e.preventDefault();
        switchToLoop(loopId);
      });
      updateInactiveCardDisplay(card, loop);
    }

    container.appendChild(card);
  }

  addRow.style.display = state.originalBuffer ? 'flex' : 'none';
  updateRowHeight();
}

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  const tag = (e.target as HTMLElement).tagName;
  const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || (tag === 'SELECT' && fileSelectOpen);
  if (e.ctrlKey && !e.metaKey && !inInput) {
    if (e.key === 'a' && state.originalBuffer) { e.preventDefault(); enterLoopStartEdit(); return; }
    if (e.key === 'e' && state.originalBuffer) { e.preventDefault(); enterLoopEndEdit(); return; }
    if (e.key === 'j' && state.originalBuffer) { e.preventDefault(); enterLoopLengthEdit(); return; }
  }
  if (inInput) return;
  if (e.key === 'Enter' && state.originalBuffer) { e.preventDefault(); enterLoopLengthEdit(); return; }
  if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    if (e.shiftKey) redo(); else undo();
  }
  else if (e.key === ' ') {
    e.preventDefault();
    if (e.shiftKey) { if (state.isPlaying) { stopSource(); } else { setPausedPos(0); play(); } }
    else togglePlay();
  }
  else if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey) { e.preventDefault(); stopSource(); setPausedPos(0); play(); }
  else if (e.key === ']') { pushUndo(); setTargetBPM(state.targetBPM + 5); }
  else if (e.key === '[') { pushUndo(); setTargetBPM(state.targetBPM - 5); }
  else if (e.key === '=') { pushUndo(); setTargetBPM(state.targetBPM + 1); }
  else if (e.key === '-') { pushUndo(); setTargetBPM(state.targetBPM - 1); }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    if (!state.originalBuffer) return;
    e.preventDefault();
    const delta = (e.key === 'ArrowRight' ? 4 : -4) * beatDurationSecs();
    const pos = clamp(currentBufferPos() + delta, 0, state.originalBuffer.duration);
    if (state.isPlaying) { stopSource(); startSource(pos); }
    else setPausedPos(pos);
  }
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
    else setPausedPos(loopStartSecs());
  }
  else if ((e.key === 'a' || e.key === 'A') && !e.ctrlKey && !e.metaKey && !e.altKey) {
    if (!state.originalBuffer || !state.activeLoopId) return;
    e.preventDefault();
    const currentBeat = Math.round(currentLoopedBufferPos() / beatDurationSecs());
    syncStateToActiveLoop();
    const active = state.loops.find(l => l.id === state.activeLoopId)!;
    if (currentBeat >= active.endBeats) return;
    const newId = genId();
    const newLoop: LoopData = {
      id: newId,
      startBeats: clamp(currentBeat, 0, active.endBeats - 1),
      endBeats: active.endBeats,
      targetBPM: active.targetBPM,
    };
    state.loops.push(newLoop);
    state.activeLoopId = newId;
    clearUndoHistory();
    setTargetBPM(newLoop.targetBPM, false);
    setLoopPoints(newLoop.startBeats, newLoop.endBeats, false);
    persistCurrentFileSettings();
    renderLoopCards();
    if (!state.isPlaying) setPausedPos(loopStartSecs());
  }
  else if ((e.key === 'b' || e.key === 'B') && !e.ctrlKey && !e.metaKey && !e.altKey) {
    if (!state.originalBuffer || !state.activeLoopId) return;
    e.preventDefault();
    const currentBeat = Math.round(currentLoopedBufferPos() / beatDurationSecs());
    syncStateToActiveLoop();
    const active = state.loops.find(l => l.id === state.activeLoopId)!;
    if (currentBeat <= active.startBeats) return;
    const newId = genId();
    const newLoop: LoopData = {
      id: newId,
      startBeats: active.startBeats,
      endBeats: clamp(currentBeat, active.startBeats + 1, totalBeats()),
      targetBPM: active.targetBPM,
    };
    state.loops.push(newLoop);
    state.activeLoopId = newId;
    clearUndoHistory();
    setTargetBPM(newLoop.targetBPM, false);
    setLoopPoints(newLoop.startBeats, newLoop.endBeats, false);
    persistCurrentFileSettings();
    renderLoopCards();
    if (!state.isPlaying) setPausedPos(loopStartSecs());
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

function trimSilence(buffer: AudioBuffer, threshold = 0.05): AudioBuffer {
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
  if (startSample === 0) return buffer;
  const ctx = getAudioCtx();
  const trimmed = ctx.createBuffer(numChannels, length - startSample, buffer.sampleRate);
  for (let c = 0; c < numChannels; c++) {
    trimmed.copyToChannel(channels[c].subarray(startSample), c);
  }
  return trimmed;
}

function normalizeAudio(buffer: AudioBuffer, targetPeak = 0.95): AudioBuffer {
  const numChannels = buffer.numberOfChannels;
  let peak = 0;
  for (let c = 0; c < numChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }
  }
  if (peak === 0 || peak >= targetPeak) return buffer;
  const scale = targetPeak / peak;
  const ctx = getAudioCtx();
  const normalized = ctx.createBuffer(numChannels, buffer.length, buffer.sampleRate);
  for (let c = 0; c < numChannels; c++) {
    const src = buffer.getChannelData(c);
    const dst = normalized.getChannelData(c);
    for (let i = 0; i < src.length; i++) dst[i] = src[i] * scale;
  }
  return normalized;
}

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

let fileSelectOpen = false;
fileSelect.addEventListener('mousedown', () => { fileSelectOpen = true; });
fileSelect.addEventListener('blur', () => { fileSelectOpen = false; });
fileSelect.addEventListener('change', () => { fileSelectOpen = false; });
fileSelect.addEventListener('keydown', e => {
  if (!fileSelectOpen) {
    if ([' ', 'ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) {
      fileSelectOpen = true;
    } else if (e.key.length === 1) {
      e.preventDefault();
    }
  }
});

async function processArrayBuffer(arrayBuffer: ArrayBuffer, name: string, id = encodeURIComponent(name)) {
  stopSource();
  clearUndoHistory();
  state.originalBuffer = null;
  state.pausedBufferPos = 0;
  state.currentFileId = id;
  state.loops = [];
  state.activeLoopId = null;
  renderLoopCards();
  setStatus('Decoding…');

  try {
    const ctx = getAudioCtx();
    const raw = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const decoded = normalizeAudio(trimSilence(raw));
    state.originalBuffer = decoded;
    waveformPeaks = null;
    computeWaveform(decoded);

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

    const total = Math.floor(decoded.duration * bpm / 60);
    const settings = loadFileSettings(id);

    if (settings.loops && settings.loops.length > 0) {
      state.loops = settings.loops;
      const savedActiveId = settings.activeLoopId;
      const activeExists = savedActiveId && state.loops.some(l => l.id === savedActiveId);
      state.activeLoopId = activeExists ? savedActiveId! : state.loops[0].id;
    } else {
      const s = settings.loopStartBeats, e = settings.loopEndBeats;
      const hasValidLoop = s != null && e != null && s >= 0 && e <= total && s < e;
      const loopId = genId();
      state.loops = [{
        id: loopId,
        startBeats: hasValidLoop ? s! : 0,
        endBeats: hasValidLoop ? e! : total,
        targetBPM: settings.targetBPM ?? bpm,
      }];
      state.activeLoopId = loopId;
    }

    const activeLoop = state.loops.find(l => l.id === state.activeLoopId)!;
    setTargetBPM(activeLoop.targetBPM, false);
    setLoopPoints(activeLoop.startBeats, activeLoop.endBeats, false);
    if (settings.volume != null && Number.isFinite(settings.volume)) {
      setVolume(clamp(settings.volume, 0, 1), false);
    }
    setTransposeSemitones(
      settings.transposeSemitones != null && Number.isFinite(settings.transposeSemitones)
        ? settings.transposeSemitones
        : 0,
      false,
    );
    persistCurrentFileSettings();

    setStatus('Loading…');
    await ensureNodes();

    const mins = Math.floor(decoded.duration / 60);
    const secs = Math.round(decoded.duration % 60).toString().padStart(2, '0');
    setDetectedStatus(`${mins}:${secs}`, bpm);

    renderLoopCards();

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
document.addEventListener('drop', async e => {
  e.preventDefault();
  dragDepth = 0;
  document.body.classList.remove('drag-over');
  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) return;

  if (files.length === 1) {
    await processFile(files[0]);
    return;
  }

  // Process multiple files: save all, then open the last one
  const mp3Files = Array.from(files).filter(f => f.type === 'audio/mpeg' || f.name.endsWith('.mp3'));
  if (mp3Files.length === 0) {
    setStatus('No MP3 files found');
    return;
  }

  for (let i = 0; i < mp3Files.length; i++) {
    const file = mp3Files[i];
    setStatus(`Processing ${i + 1}/${mp3Files.length}: ${file.name}…`);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const id = encodeURIComponent(file.name);
      await saveAudioFile(arrayBuffer, file.name, id);
    } catch (err) {
      console.error('Failed to save file:', file.name, err);
    }
  }

  await refreshFileDropdown();

  // Open the last file
  const lastFile = mp3Files[mp3Files.length - 1];
  const lastId = encodeURIComponent(lastFile.name);
  const saved = await loadAudioById(lastId);
  if (saved) {
    await processArrayBuffer(saved.buffer, saved.name, lastId);
  }
});

const fileInput = document.getElementById('file-input') as HTMLInputElement;
fileInput.addEventListener('change', () => { if (fileInput.files?.[0]) processFile(fileInput.files[0]); });

document.getElementById('add-loop-btn')!.addEventListener('click', addLoop);

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
  updateTransposeBtn();
  updateRowHeight();
  renderLoopCards();

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
