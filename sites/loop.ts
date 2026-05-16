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
const STORAGE_SHOW_TIMES = 'loop_show_times';
const STORAGE_PLAYER_MODE = 'loop_player_mode';
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
  } catch (e) {
    console.error('loadBeatCache failed:', e);
    return null;
  }
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
  } catch (e) {
    console.error('saveBeatCache failed:', e);
  }
}

async function saveAudioFile(arrayBuffer: ArrayBuffer, name: string, id: string, duration?: number, bpm?: number, bpmFromAPI?: boolean, bpmAPIHint?: number, bpmTapped?: boolean, bpmTapHint?: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([DB_STORE_FILES, DB_STORE_META], 'readwrite');
    const metaReq = tx.objectStore(DB_STORE_META).get(id);
    metaReq.onsuccess = () => {
      const existing = metaReq.result;
      const meta: Record<string, any> = { id, name, addedAt: existing?.addedAt ?? Date.now() };
      meta.duration = duration ?? existing?.duration;
      meta.bpm = bpm ?? existing?.bpm;
      meta.bpmFromAPI = bpmFromAPI ?? existing?.bpmFromAPI ?? false;
      meta.bpmAPIHint = bpmAPIHint ?? existing?.bpmAPIHint;
      meta.bpmTapped = bpmTapped ?? existing?.bpmTapped ?? false;
      meta.bpmTapHint = bpmTapHint ?? existing?.bpmTapHint;
      tx.objectStore(DB_STORE_META).put(meta);
      tx.objectStore(DB_STORE_FILES).put({ id, buffer: arrayBuffer });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadAllFilesMeta(): Promise<Array<{ id: string; name: string; addedAt: number; duration?: number; bpm?: number; bpmFromAPI?: boolean; bpmAPIHint?: number; bpmTapped?: boolean; bpmTapHint?: number }>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE_META, 'readonly');
    const req = tx.objectStore(DB_STORE_META).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

async function deleteAudioFile(id: string): Promise<void> {
  try { localStorage.removeItem(`loop_file_${id}`); } catch (e) { console.error('localStorage.removeItem failed:', e); }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([DB_STORE_FILES, DB_STORE_META, DB_STORE_BEATS], 'readwrite');
    tx.objectStore(DB_STORE_FILES).delete(id);
    tx.objectStore(DB_STORE_META).delete(id);
    tx.objectStore(DB_STORE_BEATS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
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

function drawWaveformOnCanvas(canvas: HTMLCanvasElement, startFrac = 0, endFrac = 1) {
  if (!waveformPeaks) return;
  const peaks = waveformPeaks;
  const w = canvas.width;
  const h = canvas.height;
  const ctx2d = canvas.getContext('2d')!;
  ctx2d.clearRect(0, 0, w, h);
  ctx2d.fillStyle = 'rgba(128, 128, 128, 0.18)';
  const startB = startFrac * peaks.length;
  const span = (endFrac - startFrac) * peaks.length;
  for (let x = 0; x < w; x++) {
    const b = Math.floor(startB + (x / w) * span);
    const idx = clamp(b, 0, peaks.length - 1);
    const barH = Math.max(1, peaks[idx] * (h - 2) * 0.92);
    ctx2d.fillRect(x, h - barH, 1, barH);
  }
}

// Per-file settings in localStorage keyed by file id
interface FileSettings {
  loops?: LoopData[];
  activeLoopId?: string | null;
  transposeSemitones?: number;
  // Legacy fields
  targetBPM?: number;
  loopStartBeats?: number;
  loopEndBeats?: number;
}

function loadFileSettings(id: string): FileSettings {
  try { return JSON.parse(localStorage.getItem(`loop_file_${id}`) ?? '{}'); }
  catch (e) { console.error('loadFileSettings failed:', e); return {}; }
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
      transposeSemitones: state.transposeSemitones,
    }));
  } catch (e) { console.error('persistCurrentFileSettings failed:', e); }
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
  showTimes: boolean;
  playerMode: boolean;
  zoomActive: boolean;
  transposeSemitones: number;
  currentFileId: string | null;
  currentFileName: string | null;
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
  showTimes: false,
  playerMode: false,
  zoomActive: false,
  transposeSemitones: 0,
  currentFileId: null,
  currentFileName: null,
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
  const mainCol = document.getElementById('main-col');
  const vh = mainCol ? mainCol.clientHeight : window.innerHeight;
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

window.addEventListener('resize', () => {
  if (isSidebarMode() && pickerOpen) pickerOpen = false;
  updateRowHeight();
});

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
interface ActiveRefs {
  card: HTMLElement;
  between: HTMLElement;
  hint: HTMLElement;
  playhead: HTMLElement;
  pausedPlayhead: HTMLElement;
  startLabel: HTMLElement;
  endLabel: HTMLElement;
  lengthInput: HTMLInputElement;
  startInput: HTMLInputElement;
  endInput: HTMLInputElement;
  startHandle: HTMLElement;
  endHandle: HTMLElement;
  playheadTime: HTMLElement;
  pausedPlayheadTime: HTMLElement;
  startTime: HTMLElement;
  endTime: HTMLElement;
}
let active: ActiveRefs | null = null;

function formatTime(secs: number): string {
  if (!isFinite(secs) || secs < 0) secs = 0;
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Hide the playhead time when the playhead is within this many pixels of B,
// since the time text sits to the right of the line and would overlap the end marker.
const PLAYHEAD_TIME_HIDE_PX = 44;

function updatePlayheadTimeSide(el: HTMLElement | null, bufferPosSecs: number) {
  if (!el || !active || !state.originalBuffer) return;
  const cardW = active.card.clientWidth;
  if (cardW <= 0) return;
  const beatDur = beatDurationSecs();
  const [viewStart, viewEnd] = activeViewRangeBeats();
  const viewSpanSecs = (viewEnd - viewStart) * beatDur;
  if (viewSpanSecs <= 0) return;
  const pxToEnd = ((loopEndSecs() - bufferPosSecs) / viewSpanSecs) * cardW;
  el.classList.toggle('hide', pxToEnd < PLAYHEAD_TIME_HIDE_PX);
}

function bufferSecsToViewFrac(secs: number): number {
  const total = totalBeats();
  if (total <= 0) return 0;
  const beatDur = beatDurationSecs();
  const [viewStart, viewEnd] = activeViewRangeBeats();
  const viewSpanSecs = (viewEnd - viewStart) * beatDur;
  if (viewSpanSecs <= 0) return 0;
  return (secs - viewStart * beatDur) / viewSpanSecs;
}

function setPausedPos(pos: number) {
  state.pausedBufferPos = pos;
  refreshPlayheadUI();
}

// Single source of truth for both playheads' positions + time-hint text + hide state.
// Call this after anything that affects what either playhead should show: pos change,
// loop bounds change, zoom toggle, show-times toggle, card mount.
function refreshPlayheadUI() {
  if (!active || !state.originalBuffer) return;
  const livePos = currentLoopedBufferPos();
  const pausedPos = state.pausedBufferPos;
  active.playhead.style.left = `${clamp(bufferSecsToViewFrac(livePos), 0, 1) * 100}%`;
  active.pausedPlayhead.style.left = `${clamp(bufferSecsToViewFrac(pausedPos), 0, 1) * 100}%`;
  active.playheadTime.textContent = formatTime(livePos);
  active.pausedPlayheadTime.textContent = formatTime(pausedPos);
  updatePlayheadTimeSide(active.playheadTime, livePos);
  updatePlayheadTimeSide(active.pausedPlayheadTime, pausedPos);
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

function setDetectedStatus(durationStr: string, bpm: number, apiHint?: number, tapHint?: number) {
  lastDetectedArgs = [durationStr, bpm, apiHint, tapHint];
  statusHint.style.pointerEvents = 'auto';
  statusHint.style.opacity = '0.5';
  const hintSuffix = tapHint != null ? ` (tapped at ${tapHint})` : apiHint != null ? ` (GetSongBPM ${apiHint})` : '';
  statusHint.innerHTML = `${durationStr} · detected <span class="detected-bpm-clickable" title="Click to re-detect with a BPM hint">${bpm}</span> BPM${hintSuffix}`;
  statusHint.querySelector('.detected-bpm-clickable')!.addEventListener('click', enterDetectedBPMHintEdit);
}

function enterDetectedBPMHintEdit() {
  detectedBpmInput.value = String(state.detectedBPM);
  statusHint.style.visibility = 'hidden';
  detectedBpmInput.style.display = 'block';
  detectedBpmInput.focus();
  detectedBpmInput.select();
}

function parseBPMHintInput(raw: string, current: number): number | null {
  const s = raw.trim();
  if (/^\*[\d.]+$/.test(s)) {
    const factor = parseFloat(s.slice(1));
    return Number.isFinite(factor) ? Math.round(current * factor) : null;
  }
  if (/^\/[\d.]+$/.test(s)) {
    const factor = parseFloat(s.slice(1));
    return Number.isFinite(factor) && factor !== 0 ? Math.round(current / factor) : null;
  }
  if (/^[+-][\d.]+$/.test(s)) {
    const delta = parseFloat(s);
    return Number.isFinite(delta) ? Math.round(current + delta) : null;
  }
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

async function commitDetectedBPMHintEdit() {
  if (detectedBpmInput.style.display === 'none') return;
  detectedBpmInput.style.display = 'none';
  statusHint.style.visibility = '';
  const v = parseBPMHintInput(detectedBpmInput.value, state.detectedBPM);
  if (v === null || v < BPM_MIN || v > BPM_MAX || !state.originalBuffer || !state.currentFileId) return;
  if (v === state.detectedBPM) return;
  setStatus('Re-detecting BPM…');
  try {
    const buf = state.originalBuffer;
    const { bpm, ticks } = await detectRhythm(buf, v);
    state.detectedBPM = bpm;
    state.beatTicks = ticks;
    saveBeatCache(state.currentFileId, bpm, ticks).catch(e => console.error('saveBeatCache failed:', e));
    const tickFrac = (bpm - BPM_MIN) / (BPM_MAX - BPM_MIN);
    detectedTick.style.left = `${clamp(tickFrac, 0, 1) * 100}%`;
    const mins = Math.floor(buf.duration / 60);
    const secs = Math.round(buf.duration % 60).toString().padStart(2, '0');
    setDetectedStatus(`${mins}:${secs}`, bpm);
    if (state.currentFileId) {
      updateFileMeta(state.currentFileId, { bpm, bpmTapped: false, bpmTapHint: undefined }).catch(e => console.error('updateFileMeta failed:', e));
      renderFilePicker().catch(e => console.error('renderFilePicker failed:', e));
    }
  } catch (e) {
    console.error('commitDetectedBPMHintEdit failed:', e);
    setStatus(`Error: ${(e as Error).message}`);
  }
}

// Tap tempo: track last 4 taps of 't' key and re-detect if consistent
const TAP_COUNT = 4;
const TAP_WINDOW_MS = 8000;
const TAP_CONSISTENCY = 0.25; // allow ±25% deviation from median interval
let tapTimes: number[] = [];
let lastDetectedArgs: [string, number, number | undefined, number | undefined] | null = null;

function restoreDetectedStatus() {
  if (lastDetectedArgs) setDetectedStatus(...lastDetectedArgs);
}

function medianOf(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function cancelTapTempo() {
  tapTimes = [];
  restoreDetectedStatus();
}

function handleTapTempo() {
  if (!state.originalBuffer || !state.isPlaying) return;
  const now = performance.now();
  tapTimes.push(now);
  tapTimes = tapTimes.filter(t => now - t < TAP_WINDOW_MS);
  if (tapTimes.length < 2) { setStatus('Tap tempo: 1/' + TAP_COUNT); return; }

  const intervals = tapTimes.slice(1).map((t, i) => t - tapTimes[i]);
  const median = medianOf(intervals);
  const consistent = intervals.every(iv => Math.abs(iv - median) / median <= TAP_CONSISTENCY);
  const bpmFromTaps = Math.round(60000 / median);

  if (bpmFromTaps < BPM_MIN || bpmFromTaps > BPM_MAX || !consistent) {
    tapTimes = [now];
    restoreDetectedStatus();
    return;
  }

  if (tapTimes.length < TAP_COUNT) {
    setStatus(`Tap tempo: ${bpmFromTaps} BPM (${tapTimes.length}/${TAP_COUNT})`);
    return;
  }

  tapTimes = [];
  void commitTapTempo(bpmFromTaps);
}

async function commitTapTempo(tappedBPM: number) {
  if (!state.originalBuffer || !state.currentFileId) return;
  setStatus(`Re-detecting at tapped ${tappedBPM} BPM…`);
  try {
    const buf = state.originalBuffer;
    const { bpm, ticks } = await detectRhythm(buf, tappedBPM);
    state.detectedBPM = bpm;
    state.beatTicks = ticks;
    saveBeatCache(state.currentFileId, bpm, ticks).catch(e => console.error('saveBeatCache failed:', e));
    const tickFrac = (bpm - BPM_MIN) / (BPM_MAX - BPM_MIN);
    detectedTick.style.left = `${clamp(tickFrac, 0, 1) * 100}%`;
    const mins = Math.floor(buf.duration / 60);
    const secs = Math.round(buf.duration % 60).toString().padStart(2, '0');
    setDetectedStatus(`${mins}:${secs}`, bpm, undefined, tappedBPM);
    await updateFileMeta(state.currentFileId, { bpm, bpmTapped: true, bpmTapHint: tappedBPM });
    renderFilePicker().catch(e => console.error('renderFilePicker failed:', e));
  } catch (e) {
    console.error('commitTapTempo failed:', e);
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

// While a drag is in progress we lock the view to its drag-start range so the
// cursor stays aligned with the edge handle even as zoom would otherwise rescale.
let dragViewStart: number | null = null;
let dragViewEnd: number | null = null;

function activeViewRangeBeats(): [number, number] {
  if (dragViewStart != null && dragViewEnd != null) return [dragViewStart, dragViewEnd];
  if (state.zoomActive) {
    // Loop fills the middle ~50% of the view; the remaining 50% is split into
    // equal margins on either side so surrounding context stays visible.
    const loopSpan = state.loopEndBeats - state.loopStartBeats;
    const margin = loopSpan / 2;
    const total = totalBeats();
    return [Math.max(0, state.loopStartBeats - margin), Math.min(total, state.loopEndBeats + margin)];
  }
  return [0, totalBeats()];
}

function snapshotDragView() {
  if (state.zoomActive) {
    const [vs, ve] = activeViewRangeBeats();
    dragViewStart = vs;
    dragViewEnd = ve;
  }
}

function clearDragView() {
  dragViewStart = null;
  dragViewEnd = null;
}

function redrawActiveWaveform() {
  if (!active) return;
  const canvas = active.card.querySelector<HTMLCanvasElement>('.loop-waveform');
  const total = totalBeats();
  if (!canvas || total <= 0) return;
  const [viewStart, viewEnd] = activeViewRangeBeats();
  drawWaveformOnCanvas(canvas, viewStart / total, viewEnd / total);
}

function beatDurationSecs(): number {
  return 60 / state.detectedBPM;
}

function loopStartSecs(): number {
  if (state.playerMode) return 0;
  return state.loopStartBeats * beatDurationSecs();
}

function loopEndSecs(): number {
  if (state.playerMode && state.originalBuffer) return state.originalBuffer.duration;
  return state.loopEndBeats * beatDurationSecs();
}

function updateActiveLoopCardDisplay() {
  if (!active) return;
  const total = totalBeats();
  if (total === 0) return;
  const [viewStart, viewEnd] = activeViewRangeBeats();
  const viewSpan = viewEnd - viewStart;
  if (viewSpan <= 0) return;
  const startFrac = (state.loopStartBeats - viewStart) / viewSpan;
  const endFrac = (state.loopEndBeats - viewStart) / viewSpan;
  const beats = state.loopEndBeats - state.loopStartBeats;
  active.between.style.left = `${startFrac * 100}%`;
  active.between.style.width = `${(endFrac - startFrac) * 100}%`;
  active.hint.textContent = String(beats);
  active.startLabel.textContent = String(state.loopStartBeats);
  active.startLabel.style.left = `${startFrac * 100}%`;
  active.endLabel.textContent = String(state.loopEndBeats);
  active.endLabel.style.left = `${endFrac * 100}%`;
  active.startHandle.style.left = `${startFrac * 100}%`;
  active.endHandle.style.left = `${endFrac * 100}%`;
  active.startTime.style.left = `${startFrac * 100}%`;
  active.startTime.textContent = formatTime(loopStartSecs());
  active.endTime.style.left = `${endFrac * 100}%`;
  active.endTime.textContent = formatTime(loopEndSecs());
}

function updateInactiveCardDisplay(
  card: HTMLElement,
  loop: LoopData,
) {
  const between = card.querySelector<HTMLElement>('.loop-between')!;
  const hint = card.querySelector<HTMLElement>('.loop-hint')!;
  const startLbl = card.querySelector<HTMLElement>('.loop-start-label')!;
  const endLbl = card.querySelector<HTMLElement>('.loop-end-label')!;
  const startTime = card.querySelector<HTMLElement>('.loop-start-time');
  const endTime = card.querySelector<HTMLElement>('.loop-end-time');
  const total = totalBeats();
  if (total === 0) return;
  const startFrac = loop.startBeats / total;
  const endFrac = loop.endBeats / total;
  const beatDur = beatDurationSecs();
  between.style.left = `${startFrac * 100}%`;
  between.style.width = `${(endFrac - startFrac) * 100}%`;
  hint.textContent = String(loop.endBeats - loop.startBeats);
  startLbl.textContent = String(loop.startBeats);
  startLbl.style.left = `${startFrac * 100}%`;
  endLbl.textContent = String(loop.endBeats);
  endLbl.style.left = `${endFrac * 100}%`;
  if (startTime) {
    startTime.style.left = `${startFrac * 100}%`;
    startTime.textContent = formatTime(loop.startBeats * beatDur);
  }
  if (endTime) {
    endTime.style.left = `${endFrac * 100}%`;
    endTime.textContent = formatTime(loop.endBeats * beatDur);
  }
}

// Playhead
let playheadRaf: number | null = null;

function currentLoopedBufferPos(): number {
  if (!state.audioCtx || !state.isPlaying || !state.originalBuffer) return state.pausedBufferPos;
  const ratio = state.targetBPM / state.detectedBPM;
  const linear = state.playStartBufferPos + (state.audioCtx.currentTime - state.playStartWallTime) * ratio;
  if (state.playerMode) return clamp(linear, 0, state.originalBuffer.duration);
  const lStart = loopStartSecs();
  const lEnd = loopEndSecs();
  const len = lEnd - lStart;
  if (len <= 0) return lStart;
  return lStart + ((linear - lStart) % len + len) % len;
}

function tickPlayhead() {
  if (!state.isPlaying || !state.originalBuffer) return;
  refreshPlayheadUI();
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
  if (state.zoomActive && dragViewStart == null) redrawActiveWaveform();
  // Loop edges moved — playhead positions/text may need to flip hide state
  refreshPlayheadUI();
  if (state.currentSource) {
    state.currentSource.loopStart = loopStartSecs();
    state.currentSource.loopEnd = loopEndSecs();
  }
  if (persist) persistCurrentFileSettings();
}

const ESSENTIA_MIN_DURATION = 3; // seconds — shorter clips cause WASM abort

async function resampleTo44100(buffer: AudioBuffer): Promise<AudioBuffer> {
  if (buffer.sampleRate === 44100) return buffer;
  const numFrames = Math.ceil(buffer.duration * 44100);
  const offline = new OfflineAudioContext(buffer.numberOfChannels, numFrames, 44100);
  const src = offline.createBufferSource();
  src.buffer = buffer;
  src.connect(offline.destination);
  src.start();
  return offline.startRendering();
}

async function detectRhythm(buffer: AudioBuffer, hintBPM?: number): Promise<{ bpm: number; ticks: Float32Array }> {
  if (buffer.duration < ESSENTIA_MIN_DURATION) {
    const bpm = hintBPM ?? 120;
    return { bpm, ticks: new Float32Array(0) };
  }
  buffer = await resampleTo44100(buffer);
  const essentia = await getEssentia();
  const ctx = getAudioCtx();
  const wasSuspended = ctx.state === 'suspended';
  if (ctx.state === 'running') await ctx.suspend();
  let bpm: number;
  let ticks: Float32Array;
  const ESSENTIA_MAX = 208;
  const minBPM = hintBPM ? Math.max(40, Math.floor(hintBPM * 0.85)) : 70;
  // TempoTapDegara requires maxTempo > minTempo + 20; enforce that minimum spread.
  const maxBPM = hintBPM ? Math.min(ESSENTIA_MAX, Math.max(Math.ceil(hintBPM * 1.15), minBPM + 21)) : 140;
  // Downmix in JS to avoid essentia's audioBufferToMonoSignal, which leaks
  // three WASM heap vectors (left, right, monoSignal) and causes OOM on long files.
  let monoArray: Float32Array;
  if (buffer.numberOfChannels === 1) {
    monoArray = buffer.getChannelData(0);
  } else {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    monoArray = new Float32Array(left.length);
    for (let i = 0; i < left.length; i++) monoArray[i] = (left[i] + right[i]) * 0.5;
  }
  let signal: any, result: any;
  try {
    signal = essentia.arrayToVector(monoArray);
    result = essentia.RhythmExtractor2013(signal, maxBPM, 'multifeature', minBPM);
    bpm = Math.round(result.bpm);
    ticks = essentia.vectorToArray(result.ticks);
  } catch (e) {
    console.error('RhythmExtractor2013 failed:', e);
    essentiaPromise = null; // WASM abort corrupts the module — force re-init on next call
    throw e;
  } finally {
    // Free WASM heap allocations — critical in batch mode to prevent OOM aborts
    signal?.delete();
    result?.ticks?.delete();
    result?.estimates?.delete();
    result?.bpmIntervals?.delete();
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
  const name = (state.currentFileName ?? 'loop').replace(/\.[^.]+$/, '');
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
    el.play().catch(e => console.error('audio play failed:', e));
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
  try { localStorage.setItem(STORAGE_METRONOME, state.metronomeEnabled ? '1' : '0'); } catch (e) { console.error('localStorage failed:', e); }
}
(window as any).toggleMetronome = toggleMetronome;

function setPlayerMode(enabled: boolean, persist = true) {
  if (state.playerMode === enabled) return;
  state.playerMode = enabled;
  document.body.classList.toggle('player-mode', enabled);
  const btn = document.getElementById('player-mode-toggle');
  if (btn) btn.classList.toggle('active', enabled);
  if (enabled && state.zoomActive) setZoom(false);
  if (persist) {
    try { localStorage.setItem(STORAGE_PLAYER_MODE, enabled ? '1' : '0'); } catch (e) { console.error('localStorage failed:', e); }
  }
  // Re-render the loop card so non-active cards hide/show and the active card stretches to whole-track view.
  renderLoopCards();
  // Restart playback so source.loop and clamped paused position pick up the new mode.
  if (state.isPlaying) {
    const pos = currentLoopedBufferPos();
    stopSource();
    setPausedPos(pos);
    void play();
  } else {
    setPausedPos(clamp(state.pausedBufferPos, loopStartSecs(), loopEndSecs()));
  }
}

function togglePlayerMode() {
  setPlayerMode(!state.playerMode);
}
(window as any).togglePlayerMode = togglePlayerMode;

function setShowTimes(enabled: boolean, persist = true) {
  state.showTimes = enabled;
  document.body.classList.toggle('show-times', enabled);
  const btn = document.getElementById('show-times-toggle');
  if (btn) btn.classList.toggle('active', enabled);
  if (enabled) {
    updateActiveLoopCardDisplay();
    refreshPlayheadUI();
  }
  if (persist) {
    try { localStorage.setItem(STORAGE_SHOW_TIMES, enabled ? '1' : '0'); } catch (e) { console.error('localStorage failed:', e); }
  }
}

function toggleShowTimes() {
  setShowTimes(!state.showTimes);
}
(window as any).toggleShowTimes = toggleShowTimes;

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
  source.loop = !state.playerMode;
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
      stopPlayhead();
      stopMetronomeLoop();
      if (state.playerMode) void advanceToNextFile();
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
    try { localStorage.setItem(STORAGE_VOLUME, String(state.volume)); } catch (e) { console.error('localStorage failed:', e); }
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
  localStorage.setItem(STORAGE_VOLUME, String(snap.volume));
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
  try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch (e) { console.error('releasePointerCapture failed:', e); }
}

bpmSection.addEventListener('pointerdown', e => {
  bpmSection.setPointerCapture(e.pointerId);
  onPointerDown(e, 'bpm');
});
bpmSection.addEventListener('pointermove', e => onPointerMove(e));
bpmSection.addEventListener('pointerup', e => onPointerUp(e));
bpmSection.addEventListener('pointercancel', e => onPointerUp(e));
bpmSection.addEventListener('lostpointercapture', () => { dragTarget = null; });

volumeSection.addEventListener('pointerdown', e => {
  volumeSection.setPointerCapture(e.pointerId);
  onPointerDown(e, 'volume');
});
volumeSection.addEventListener('pointermove', e => onPointerMove(e));
volumeSection.addEventListener('pointerup', e => onPointerUp(e));
volumeSection.addEventListener('pointercancel', e => onPointerUp(e));
volumeSection.addEventListener('lostpointercapture', () => { dragTarget = null; });

// Pointer interaction on the active card. Three concrete behaviors collapse
// into two kinds: 'resize' (drag an A/B edge) and 'move' (drag the whole loop,
// or click-only-jump when 'disableMove' is true).
type PointerInteraction =
  | {
      kind: 'resize';
      side: 'start' | 'end';
      startX: number;
      startBeats: number;
      clickBeats: number;
      didMove: boolean;
      committed: boolean; // true once we've pushUndo'd and committed to a drag
      initialTarget: Element | null;
    }
  | {
      kind: 'move';
      startX: number;
      startBeats: number;
      span: number;
      didMove: boolean;
      initialTarget: Element | null;
      clickJumpBeats: number; // -1 = don't jump playhead on click
      disableMove: boolean;   // true = movement has no effect (zoom/inside-loop)
    };

let pointerInteraction: PointerInteraction | null = null;

// A/B-point drag only initiates when click is within this many pixels of an edge.
const EDGE_DRAG_THRESHOLD_PX = 32;

function enterLoopLengthEdit() {
  if (!active) return;
  commitLoopStartEdit();
  commitLoopEndEdit();
  const { hint, lengthInput, card } = active;
  const cardRect = card.getBoundingClientRect();
  const hintRect = hint.getBoundingClientRect();
  lengthInput.style.left = `${(hintRect.left + hintRect.width / 2 - cardRect.left) / cardRect.width * 100}%`;
  lengthInput.value = String(state.loopEndBeats - state.loopStartBeats);
  lengthInput.style.display = 'block';
  hint.style.visibility = 'hidden';
  lengthInput.focus();
  lengthInput.select();
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
  } catch (e) { console.error('evalArithmetic failed:', e); return null; }
}

function commitLoopLengthEdit() {
  if (!active || active.lengthInput.style.display === 'none') return;
  const v = evalArithmetic(active.lengthInput.value.trim());
  if (v !== null && v >= 1) {
    pushUndo();
    setLoopPoints(state.loopStartBeats, state.loopStartBeats + Math.round(v));
  }
  active.lengthInput.style.display = 'none';
  active.hint.style.visibility = '';
}

function enterLoopStartEdit() {
  if (!active) return;
  commitLoopLengthEdit();
  commitLoopEndEdit();
  const { startLabel, startInput, card } = active;
  const cardRect = card.getBoundingClientRect();
  const lblRect = startLabel.getBoundingClientRect();
  startInput.style.left = `${(lblRect.left + lblRect.width / 2 - cardRect.left) / cardRect.width * 100}%`;
  startInput.value = String(state.loopStartBeats);
  startInput.style.display = 'block';
  startLabel.style.visibility = 'hidden';
  startInput.focus();
  startInput.select();
}

function commitLoopStartEdit() {
  if (!active || active.startInput.style.display === 'none') return;
  const v = evalRelative(active.startInput.value.trim(), state.loopStartBeats);
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
  active.startInput.style.display = 'none';
  active.startLabel.style.visibility = '';
}

function enterLoopEndEdit() {
  if (!active) return;
  commitLoopLengthEdit();
  commitLoopStartEdit();
  const { endLabel, endInput, card } = active;
  const cardRect = card.getBoundingClientRect();
  const lblRect = endLabel.getBoundingClientRect();
  endInput.style.left = `${(lblRect.left + lblRect.width / 2 - cardRect.left) / cardRect.width * 100}%`;
  endInput.value = String(state.loopEndBeats);
  endInput.style.display = 'block';
  endLabel.style.visibility = 'hidden';
  endInput.focus();
  endInput.select();
}

function commitLoopEndEdit() {
  if (!active || active.endInput.style.display === 'none') return;
  const v = evalRelative(active.endInput.value.trim(), state.loopEndBeats);
  if (v !== null) {
    const newEnd = Math.round(v);
    if (newEnd !== state.loopEndBeats && newEnd > state.loopStartBeats) {
      pushUndo();
      setLoopPoints(state.loopStartBeats, newEnd);
    }
  }
  active.endInput.style.display = 'none';
  active.endLabel.style.visibility = '';
}

function setupActiveCardDrag(card: HTMLElement) {
  function clearInteraction() {
    const hadSnapshot = dragViewStart != null;
    const wasResize = pointerInteraction?.kind === 'resize';
    pointerInteraction = null;
    card.classList.remove(wasResize ? 'resizing' : 'dragging');
    card.style.cursor = '';
    if (wasResize && active) {
      active.startHandle.style.opacity = '0';
      active.startHandle.classList.remove('active');
      active.endHandle.style.opacity = '0';
      active.endHandle.classList.remove('active');
    }
    clearDragView();
    if (hadSnapshot) {
      updateActiveLoopCardDisplay();
      redrawActiveWaveform();
    }
  }

  card.addEventListener('pointerdown', e => {
    if (!state.originalBuffer) return;
    if ((e.target as Element).closest('.loop-icon-btn, .loop-beat-label, .loop-resize-handle')) return;
    const focused = document.activeElement;
    if (active && (focused === active.lengthInput || focused === active.startInput || focused === active.endInput)) return;

    const r = card.getBoundingClientRect();
    const total = totalBeats();
    const [viewStart, viewEnd] = activeViewRangeBeats();
    const viewSpan = viewEnd - viewStart;
    const clickBeats = total > 0 && r.width > 0 && viewSpan > 0
      ? viewStart + (e.clientX - r.left) / r.width * viewSpan
      : -1;

    if (state.playerMode) {
      if (clickBeats < 0) return;
      const pos = clamp(clickBeats * beatDurationSecs(), 0, state.originalBuffer.duration);
      if (state.isPlaying) { stopSource(); startSource(pos); }
      else setPausedPos(pos);
      return;
    }

    const insideLoop = total > 0 && clickBeats >= state.loopStartBeats && clickBeats <= state.loopEndBeats;
    const startPx = total > 0 && viewSpan > 0 ? r.left + ((state.loopStartBeats - viewStart) / viewSpan) * r.width : 0;
    const endPx = total > 0 && viewSpan > 0 ? r.left + ((state.loopEndBeats - viewStart) / viewSpan) * r.width : 0;
    const distToStartPx = Math.abs(e.clientX - startPx);
    const distToEndPx = Math.abs(e.clientX - endPx);
    const nearEdge = insideLoop && Math.min(distToStartPx, distToEndPx) <= EDGE_DRAG_THRESHOLD_PX;

    if (nearEdge) {
      // Near an edge — wait to see if it's a click or a resize drag
      const side = distToStartPx <= distToEndPx ? 'start' : 'end';
      card.setPointerCapture(e.pointerId);
      pointerInteraction = {
        kind: 'resize',
        side,
        startX: e.clientX,
        startBeats: side === 'start' ? state.loopStartBeats : state.loopEndBeats,
        clickBeats,
        didMove: false,
        committed: false,
        initialTarget: e.target as Element,
      };
      return;
    }

    // Inside the loop (or anywhere in the zoomed view): click-to-jump only — no whole-loop drag
    if (state.zoomActive || insideLoop) {
      card.setPointerCapture(e.pointerId);
      pointerInteraction = {
        kind: 'move',
        startX: e.clientX,
        startBeats: state.loopStartBeats,
        span: state.loopEndBeats - state.loopStartBeats,
        didMove: false,
        initialTarget: e.target as Element,
        clickJumpBeats: clickBeats,
        disableMove: true,
      };
      return;
    }

    // Outside the loop (non-zoom only): drag to move the whole loop
    pushUndo();
    card.setPointerCapture(e.pointerId);
    pointerInteraction = {
      kind: 'move',
      startX: e.clientX,
      startBeats: state.loopStartBeats,
      span: state.loopEndBeats - state.loopStartBeats,
      didMove: false,
      initialTarget: e.target as Element,
      clickJumpBeats: -1,
      disableMove: false,
    };
    card.classList.add('dragging');
    card.style.cursor = 'grabbing';
  });

  card.addEventListener('pointermove', e => {
    const pi = pointerInteraction;
    if (pi?.kind === 'resize') {
      if (e.clientX !== pi.startX) pi.didMove = true;
      if (!pi.didMove) return;
      if (!pi.committed) {
        // First actual movement — commit to drag mode
        pi.committed = true;
        pushUndo();
        snapshotDragView();
        card.classList.add('resizing');
        card.style.cursor = 'ew-resize';
        if (active) {
          const activeHandle = pi.side === 'start' ? active.startHandle : active.endHandle;
          const inactiveHandle = pi.side === 'start' ? active.endHandle : active.startHandle;
          activeHandle.style.opacity = '1';
          activeHandle.classList.add('active');
          inactiveHandle.style.opacity = '0';
        }
      }
      const r = card.getBoundingClientRect();
      const total = totalBeats();
      const [viewStart, viewEnd] = activeViewRangeBeats();
      const viewSpan = viewEnd - viewStart;
      const deltaBeats = Math.round((e.clientX - pi.startX) / r.width * viewSpan);
      const newBeats = pi.startBeats + deltaBeats;
      if (pi.side === 'start') {
        setLoopPoints(clamp(newBeats, 0, state.loopEndBeats - 1), state.loopEndBeats);
      } else {
        setLoopPoints(state.loopStartBeats, clamp(newBeats, state.loopStartBeats + 1, total));
      }
      return;
    }
    if (pi?.kind === 'move') {
      if (e.clientX !== pi.startX) pi.didMove = true;
      if (!pi.didMove) return;
      if (pi.disableMove) return;
      const r = card.getBoundingClientRect();
      const total = totalBeats();
      const [viewStart, viewEnd] = activeViewRangeBeats();
      const viewSpan = viewEnd - viewStart;
      const deltaBeats = Math.round((e.clientX - pi.startX) / r.width * viewSpan);
      const newStart = clamp(pi.startBeats + deltaBeats, 0, total - pi.span);
      setLoopPoints(newStart, newStart + pi.span);
      return;
    }
    // Hover: cursor + handle visibility mirror what mousedown will do here.
    const r = card.getBoundingClientRect();
    const total = totalBeats();
    const [viewStart, viewEnd] = activeViewRangeBeats();
    const viewSpan = viewEnd - viewStart;
    if (total > 0 && r.width > 0 && viewSpan > 0 && active) {
      const hoverBeats = viewStart + (e.clientX - r.left) / r.width * viewSpan;
      const insideLoop = hoverBeats >= state.loopStartBeats && hoverBeats <= state.loopEndBeats;
      const startPx = r.left + ((state.loopStartBeats - viewStart) / viewSpan) * r.width;
      const endPx = r.left + ((state.loopEndBeats - viewStart) / viewSpan) * r.width;
      const distStart = Math.abs(e.clientX - startPx);
      const distEnd = Math.abs(e.clientX - endPx);
      const nearEdge = insideLoop && Math.min(distStart, distEnd) <= EDGE_DRAG_THRESHOLD_PX;

      if (nearEdge) {
        const nearStart = distStart <= distEnd;
        active.startHandle.style.opacity = nearStart ? '1' : '0';
        active.endHandle.style.opacity = nearStart ? '0' : '1';
        card.style.cursor = 'ew-resize';
      } else {
        active.startHandle.style.opacity = '0';
        active.endHandle.style.opacity = '0';
        // Whole-loop drag fires only outside the loop in non-zoom mode
        card.style.cursor = (!state.zoomActive && !insideLoop) ? 'grab' : '';
      }
    }
  });

  card.addEventListener('pointerleave', () => {
    if (pointerInteraction) return;
    if (active) {
      active.startHandle.style.opacity = '0';
      active.endHandle.style.opacity = '0';
    }
    card.style.cursor = '';
  });

  card.addEventListener('lostpointercapture', () => {
    if (pointerInteraction) clearInteraction();
  });

  card.addEventListener('pointerup', e => {
    const pi = pointerInteraction;
    if (!pi) return;
    const didMove = pi.didMove;
    const initialTarget = pi.initialTarget;
    const jumpBeats = pi.kind === 'resize' ? pi.clickBeats : pi.clickJumpBeats;
    const movedLoop = pi.kind === 'resize' ? didMove : (didMove && !pi.disableMove);
    try { card.releasePointerCapture(e.pointerId); } catch (err) { console.error('releasePointerCapture failed:', err); }
    clearInteraction();

    if (!didMove && initialTarget?.closest('.loop-hint')) {
      enterLoopLengthEdit();
      return;
    }
    if (!didMove && jumpBeats >= 0 && state.rbNode) {
      restartPlayback(jumpBeats * beatDurationSecs());
      return;
    }
    if (movedLoop && state.originalBuffer && state.rbNode) {
      restartPlayback(loopStartSecs());
    }
  });

  card.addEventListener('pointercancel', e => {
    try { card.releasePointerCapture(e.pointerId); } catch (err) { console.error('releasePointerCapture failed:', err); }
    if (pointerInteraction) clearInteraction();
  });
}

function setupHandleDrag(card: HTMLElement, startHandle: HTMLElement, endHandle: HTMLElement) {
  function onDown(e: PointerEvent, side: 'start' | 'end') {
    e.stopPropagation();
    if (!state.originalBuffer) return;
    pushUndo();
    snapshotDragView();
    card.setPointerCapture(e.pointerId);
    const startBeats = side === 'start' ? state.loopStartBeats : state.loopEndBeats;
    pointerInteraction = {
      kind: 'resize',
      side,
      startX: e.clientX,
      startBeats,
      clickBeats: startBeats,
      didMove: false,
      committed: true,
      initialTarget: null,
    };
    card.classList.add('resizing');
  }
  startHandle.addEventListener('pointerdown', e => onDown(e, 'start'));
  endHandle.addEventListener('pointerdown', e => onDown(e, 'end'));
}

function setZoom(zoom: boolean) {
  if (!state.originalBuffer || state.zoomActive === zoom) return;
  state.zoomActive = zoom;
  updateActiveLoopCardDisplay();
  redrawActiveWaveform();
  refreshPlayheadUI();
}

// Loop management

// Restart audio at `pos` — stays playing if currently playing, else parks paused there.
function restartPlayback(pos: number) {
  const wasPlaying = state.isPlaying;
  stopSource();
  if (wasPlaying) startSource(pos);
  else setPausedPos(pos);
}

// Make `loop` the active loop: resets transient view/undo state, applies BPM
// and loop bounds, persists, and re-renders. Caller handles playback restart.
function activateLoop(loop: LoopData) {
  state.activeLoopId = loop.id;
  state.zoomActive = false;
  clearDragView();
  clearUndoHistory();
  setTargetBPM(loop.targetBPM, false);
  setLoopPoints(loop.startBeats, loop.endBeats, false);
  persistCurrentFileSettings();
  renderLoopCards();
}

function switchToLoop(id: string) {
  if (id === state.activeLoopId) return;
  commitLoopLengthEdit();
  syncStateToActiveLoop();
  const loop = state.loops.find(l => l.id === id);
  if (!loop) return;
  activateLoop(loop);
  restartPlayback(loopStartSecs());
}

function addLoop() {
  if (!state.originalBuffer) return;
  syncStateToActiveLoop();
  const current = state.loops.find(l => l.id === state.activeLoopId);
  const newLoop: LoopData = current
    ? { id: genId(), startBeats: current.startBeats, endBeats: current.endBeats, targetBPM: current.targetBPM }
    : { id: genId(), startBeats: 0, endBeats: totalBeats(), targetBPM: state.detectedBPM };
  state.loops.push(newLoop);
  activateLoop(newLoop);
}

function deleteLoop(id: string) {
  if (state.loops.length <= 1) return;
  const idx = state.loops.findIndex(l => l.id === id);
  if (idx === -1) return;
  state.loops.splice(idx, 1);
  if (state.activeLoopId === id) {
    const newActive = state.loops[Math.min(idx, state.loops.length - 1)];
    activateLoop(newActive);
    restartPlayback(loopStartSecs());
  } else {
    persistCurrentFileSettings();
    renderLoopCards();
  }
}

function renderLoopCards() {
  const container = document.getElementById('loops-container')!;
  const addRow = document.getElementById('add-loop-row')!;

  // Commit any in-flight edit before wiping the DOM
  commitLoopLengthEdit();
  commitLoopStartEdit();
  commitLoopEndEdit();

  // Reset active refs
  active = null;

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
    const playheadTime = document.createElement('div');
    playheadTime.className = 'loop-time-hint loop-playhead-time';
    playhead.appendChild(playheadTime);
    card.appendChild(playhead);

    const pausedPlayhead = document.createElement('div');
    pausedPlayhead.className = 'loop-paused-playhead';
    const pausedTime = document.createElement('div');
    pausedTime.className = 'loop-time-hint loop-paused-time';
    pausedPlayhead.appendChild(pausedTime);
    card.appendChild(pausedPlayhead);

    const startTimeEl = document.createElement('div');
    startTimeEl.className = 'loop-time-hint loop-start-time';
    card.appendChild(startTimeEl);

    const endTimeEl = document.createElement('div');
    endTimeEl.className = 'loop-time-hint loop-end-time';
    card.appendChild(endTimeEl);

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
      // Start/end value inputs
      const startInput = document.createElement('input');
      startInput.className = 'loop-start-input';
      startInput.type = 'text';
      startInput.inputMode = 'numeric';
      startInput.autocomplete = 'off';
      startInput.spellcheck = false;
      startInput.style.display = 'none';
      card.appendChild(startInput);

      const endInput = document.createElement('input');
      endInput.className = 'loop-end-input';
      endInput.type = 'text';
      endInput.inputMode = 'numeric';
      endInput.autocomplete = 'off';
      endInput.spellcheck = false;
      endInput.style.display = 'none';
      card.appendChild(endInput);

      const startHandle = document.createElement('div');
      startHandle.className = 'loop-resize-handle';
      card.appendChild(startHandle);

      const endHandle = document.createElement('div');
      endHandle.className = 'loop-resize-handle';
      card.appendChild(endHandle);

      active = {
        card,
        between,
        hint,
        playhead,
        pausedPlayhead,
        playheadTime,
        pausedPlayheadTime: pausedTime,
        startTime: startTimeEl,
        endTime: endTimeEl,
        startLabel: startLbl,
        endLabel: endLbl,
        lengthInput: input,
        startInput,
        endInput,
        startHandle,
        endHandle,
      };

      setPausedPos(state.pausedBufferPos);

      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { commitLoopLengthEdit(); e.preventDefault(); }
        if (e.key === 'Escape') {
          input.style.display = 'none';
          hint.style.visibility = '';
          input.blur();
          e.preventDefault();
        }
      });
      input.addEventListener('blur', commitLoopLengthEdit);
      input.addEventListener('pointerdown', e => e.stopPropagation());

      startInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { commitLoopStartEdit(); e.preventDefault(); }
        else if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); commitLoopStartEdit(); enterLoopEndEdit(); }
        else if (e.key === 'Escape') { startInput.style.display = 'none'; startLbl.style.visibility = ''; startInput.blur(); e.preventDefault(); }
      });
      startInput.addEventListener('blur', commitLoopStartEdit);
      startInput.addEventListener('pointerdown', e => e.stopPropagation());

      endInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') { commitLoopEndEdit(); e.preventDefault(); }
        else if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); commitLoopEndEdit(); enterLoopStartEdit(); }
        else if (e.key === 'Escape') { endInput.style.display = 'none'; endLbl.style.visibility = ''; endInput.blur(); e.preventDefault(); }
      });
      endInput.addEventListener('blur', commitLoopEndEdit);
      endInput.addEventListener('pointerdown', e => e.stopPropagation());

      // Label click to edit
      startLbl.addEventListener('pointerdown', e => e.stopPropagation());
      startLbl.addEventListener('click', () => enterLoopStartEdit());
      endLbl.addEventListener('pointerdown', e => e.stopPropagation());
      endLbl.addEventListener('click', () => enterLoopEndEdit());

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

  // After cards are in the DOM, refresh once more — clientWidth wasn't available
  // when setPausedPos ran during card construction.
  refreshPlayheadUI();
}

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && tapTimes.length > 0) { cancelTapTempo(); e.preventDefault(); return; }
  if (e.key === 'Escape' && pickerOpen) { closeFilePicker(); e.preventDefault(); return; }
  if (pickerOpen) return;
  const tag = (e.target as HTMLElement).tagName;
  const inInput = tag === 'INPUT' || tag === 'TEXTAREA';
  if (e.ctrlKey && !e.metaKey && !inInput && !state.playerMode) {
    if (e.key === 'a' && state.originalBuffer) { e.preventDefault(); enterLoopStartEdit(); return; }
    if (e.key === 'e' && state.originalBuffer) { e.preventDefault(); enterLoopEndEdit(); return; }
    if (e.key === 'j' && state.originalBuffer) { e.preventDefault(); enterLoopLengthEdit(); return; }
  }
  if (inInput) return;
  if (e.key === 'Escape' && state.zoomActive) { e.preventDefault(); setZoom(false); return; }
  if (e.key === 'Enter' && state.originalBuffer && !state.playerMode) { e.preventDefault(); enterLoopLengthEdit(); return; }
  if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    if (e.shiftKey) redo(); else undo();
  }
  else if ((e.key === 'z' || e.key === 'Z') && !state.playerMode) { e.preventDefault(); setZoom(!state.zoomActive); }
  else if ((e.key === 'x' || e.key === 'X') && !state.playerMode) { e.preventDefault(); setZoom(false); }
  else if (e.key === ' ') {
    e.preventDefault();
    if (e.shiftKey) { if (state.isPlaying) { stopSource(); } else { setPausedPos(0); play(); } }
    else togglePlay();
  }
  else if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey) { e.preventDefault(); stopSource(); setPausedPos(0); play(); }
  else if (e.key === 't' || e.key === 'T') { e.preventDefault(); handleTapTempo(); }
  else if (e.key === 'm' || e.key === 'M') { e.preventDefault(); toggleMetronome(); }
  else if ((e.key === 'f' || e.key === 'F') && !isSidebarMode() && !pickerOpen) { e.preventDefault(); openFilePicker(); }
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
  else if ((e.key === '.' || e.key === ',') && !state.playerMode) {
    if (!state.originalBuffer) return;
    e.preventDefault();
    const span = state.loopEndBeats - state.loopStartBeats;
    const delta = e.key === '.' ? 1 : -1;
    const newStart = clamp(state.loopStartBeats + delta, 0, totalBeats() - span);
    pushUndo();
    setLoopPoints(newStart, newStart + span);
    restartPlayback(loopStartSecs());
  }
  else if ((e.key === 'a' || e.key === 'A') && !e.ctrlKey && !e.metaKey && !e.altKey && !state.playerMode) {
    if (!state.originalBuffer || !state.activeLoopId) return;
    e.preventDefault();
    const currentBeat = Math.round(currentLoopedBufferPos() / beatDurationSecs());
    syncStateToActiveLoop();
    const current = state.loops.find(l => l.id === state.activeLoopId)!;
    if (currentBeat >= current.endBeats) return;
    const newLoop: LoopData = {
      id: genId(),
      startBeats: clamp(currentBeat, 0, current.endBeats - 1),
      endBeats: current.endBeats,
      targetBPM: current.targetBPM,
    };
    state.loops.push(newLoop);
    activateLoop(newLoop);
    if (!state.isPlaying) setPausedPos(loopStartSecs());
  }
  else if ((e.key === 'b' || e.key === 'B') && !e.ctrlKey && !e.metaKey && !e.altKey && !state.playerMode) {
    if (!state.originalBuffer || !state.activeLoopId) return;
    e.preventDefault();
    const currentBeat = Math.round(currentLoopedBufferPos() / beatDurationSecs());
    syncStateToActiveLoop();
    const current = state.loops.find(l => l.id === state.activeLoopId)!;
    if (currentBeat <= current.startBeats) return;
    const newLoop: LoopData = {
      id: genId(),
      startBeats: current.startBeats,
      endBeats: clamp(currentBeat, current.startBeats + 1, totalBeats()),
      targetBPM: current.targetBPM,
    };
    state.loops.push(newLoop);
    activateLoop(newLoop);
    if (!state.isPlaying) setPausedPos(loopStartSecs());
  }
});

// Theme
function setTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'light' ? '◐' : '◑';
  try { localStorage.setItem(STORAGE_THEME, theme); } catch (e) { console.error('localStorage failed:', e); }
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

const filePickerBtn = document.getElementById('file-picker-btn') as HTMLButtonElement;

let pickerOpen = false;
let pickerSortCol: 'name' | 'bpm' | 'length' | 'addedAt' = 'bpm';
let pickerSortAsc = true;

function buildUrl(fileId?: string | null): string {
  const p = new URLSearchParams();
  if (fileId) p.set('f', fileId);
  p.set('sort', pickerSortCol);
  p.set('dir', pickerSortAsc ? 'asc' : 'desc');
  return '?' + p.toString();
}

function readUrlSort() {
  const p = new URLSearchParams(location.search);
  const col = p.get('sort') as typeof pickerSortCol | null;
  if (col && ['name', 'bpm', 'length', 'addedAt'].includes(col)) pickerSortCol = col;
  const dir = p.get('dir');
  if (dir === 'asc' || dir === 'desc') pickerSortAsc = dir === 'asc';
}

function updateFilePickerBtn() {
  filePickerBtn.textContent = state.currentFileName ?? '';
  filePickerBtn.classList.toggle('has-files', !!state.currentFileName);
}

const PICKER_WIDE_PX = 1000;

function isSidebarMode() { return window.innerWidth >= PICKER_WIDE_PX; }

function openFilePicker() {
  if (isSidebarMode()) return;
  pickerOpen = true;
  document.getElementById('file-picker-panel')!.removeAttribute('hidden');
  renderFilePicker().then(() => {
    const row = document.querySelector<HTMLElement>('#file-picker-table .fp-current');
    if (row) row.scrollIntoView({ block: 'nearest' });
  }).catch(e => console.error('renderFilePicker failed:', e));
}

function closeFilePicker() {
  pickerOpen = false;
  document.getElementById('file-picker-panel')!.setAttribute('hidden', '');
}

function formatPickerDate(ts: number): string {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function formatPickerDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function sortPickerFiles<T extends { name: string; bpm?: number | null; duration?: number; addedAt: number }>(files: T[]): T[] {
  files.sort((a, b) => {
    let va: any, vb: any;
    if (pickerSortCol === 'bpm') {
      const aNull = a.bpm == null, bNull = b.bpm == null;
      if (aNull && bNull) return 0;
      if (aNull) return 1;
      if (bNull) return -1;
      va = a.bpm; vb = b.bpm;
    } else if (pickerSortCol === 'name') { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
    else if (pickerSortCol === 'length') { va = a.duration ?? -1; vb = b.duration ?? -1; }
    else { va = a.addedAt; vb = b.addedAt; }
    if (va < vb) return pickerSortAsc ? -1 : 1;
    if (va > vb) return pickerSortAsc ? 1 : -1;
    return 0;
  });
  return files;
}

async function advanceToNextFile() {
  if (!state.currentFileId) return;
  const sorted = sortPickerFiles(await loadAllFilesMeta());
  const idx = sorted.findIndex(f => f.id === state.currentFileId);
  if (idx === -1 || idx >= sorted.length - 1) return;
  const next = sorted[idx + 1];
  const saved = await loadAudioById(next.id);
  if (!saved) return;
  await processArrayBuffer(saved.buffer, saved.name, next.id);
  void play();
}

async function renderFilePicker() {
  const files = sortPickerFiles(await loadAllFilesMeta());
  filePickerBtn.classList.toggle('has-files', files.length > 0);

  const labels: Record<string, string> = { name: 'Name', bpm: 'BPM', length: 'Length', addedAt: 'Added' };
  document.querySelectorAll<HTMLElement>('#file-picker-table thead th[data-col]').forEach(th => {
    const col = th.dataset.col!;
    const sorted = col === pickerSortCol;
    th.classList.toggle('fp-sorted', sorted);
    th.textContent = labels[col] + (sorted ? (pickerSortAsc ? ' ↑' : ' ↓') : '');
  });

  const numDigits = String(files.length).length;
  const numCol = document.querySelector<HTMLElement>('col.fpc-num');
  if (numCol) numCol.style.width = `calc(${numDigits}ch + 1.4rem)`;

  const tbody = document.getElementById('file-picker-body')!;
  tbody.innerHTML = '';

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const tr = document.createElement('tr');
    if (f.id === state.currentFileId) tr.classList.add('fp-current');

    const addCell = (text: string, title?: string) => {
      const td = document.createElement('td');
      td.textContent = text;
      if (title) td.title = title;
      tr.appendChild(td);
    };

    const numTd = document.createElement('td');
    numTd.className = 'fpc-num-cell';
    numTd.textContent = String(i + 1);
    tr.appendChild(numTd);

    addCell(f.name, f.name);
    addCell(f.bpm != null ? `${f.bpm}${f.bpmTapped ? 'ᵗ' : f.bpmFromAPI ? 'ᵃ' : ''}` : '—');
    addCell(f.duration != null ? formatPickerDuration(f.duration) : '—');
    addCell(f.addedAt ? formatPickerDate(f.addedAt) : '—');

    const tdDel = document.createElement('td');
    tdDel.className = 'fp-del-cell';
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'fp-delete-btn';
    delBtn.title = 'Remove';
    delBtn.textContent = '×';
    const fileId = f.id;
    delBtn.addEventListener('click', async e => {
      e.stopPropagation();
      await deleteAudioFile(fileId);
      if (state.currentFileId === fileId) {
        stopSource();
        state.originalBuffer = null;
        state.currentFileId = null;
        state.currentFileName = null;
        state.loops = [];
        state.activeLoopId = null;
        waveformPeaks = null;
        detectedTick.style.display = 'none';
        setStatus('Drop audio file(s) anywhere');
        renderLoopCards();
        updateFilePickerBtn();
        const remaining = (await loadAllFilesMeta()).sort((a, b) => b.addedAt - a.addedAt);
        if (remaining.length > 0) {
          const saved = await loadAudioById(remaining[0].id);
          if (saved) processArrayBuffer(saved.buffer, saved.name, remaining[0].id);
        }
      }
      await renderFilePicker();
    });
    tdDel.appendChild(delBtn);
    tr.appendChild(tdDel);

    tr.addEventListener('click', async () => {
      if (f.id === state.currentFileId) { closeFilePicker(); return; }
      closeFilePicker();
      const saved = await loadAudioById(f.id);
      if (saved) processArrayBuffer(saved.buffer, saved.name, f.id);
    });

    tbody.appendChild(tr);
  }

  // Scroll active row into view if picker is visible
  const currentRow = tbody.querySelector<HTMLElement>('.fp-current');
  if (currentRow && (pickerOpen || isSidebarMode())) {
    currentRow.scrollIntoView({ block: 'nearest' });
  }
}

filePickerBtn.addEventListener('click', () => {
  if (pickerOpen) closeFilePicker(); else openFilePicker();
});

document.getElementById('clear-all-btn')!.addEventListener('click', async () => {
  if (!confirm('Delete all MP3s? This cannot be undone.')) return;
  const files = await loadAllFilesMeta();
  for (const f of files) await deleteAudioFile(f.id);
  stopSource();
  state.currentFileId = null;
  state.currentFileName = null;
  state.originalBuffer = null;
  state.loops = [];
  state.activeLoopId = null;
  renderLoopCards();
  updateFilePickerBtn();
  await renderFilePicker();
  setStatus('Drop an MP3 to get started');
});

document.querySelectorAll<HTMLElement>('#file-picker-table thead th[data-col]').forEach(th => {
  th.addEventListener('click', () => {
    const col = th.dataset.col as typeof pickerSortCol;
    if (col === pickerSortCol) {
      pickerSortAsc = !pickerSortAsc;
    } else {
      pickerSortCol = col;
      pickerSortAsc = col === 'name';
    }
    history.replaceState({ fileId: state.currentFileId }, '', buildUrl(state.currentFileId));
    renderFilePicker().catch(e => console.error('renderFilePicker failed:', e));
  });
});

// No click-outside handler needed: narrow mode is full-screen (Escape / toggle / row-click to close).

async function processArrayBuffer(arrayBuffer: ArrayBuffer, name: string, id = encodeURIComponent(name), pushHistory = true) {
  stopSource();
  clearUndoHistory();
  state.originalBuffer = null;
  state.pausedBufferPos = 0;
  state.currentFileId = id;
  state.currentFileName = name;
  state.loops = [];
  state.activeLoopId = null;
  lastDetectedArgs = null;
  tapTimes = [];
  renderLoopCards();
  setStatus('Decoding…');

  const ctx = getAudioCtx();
  const raw = await ctx.decodeAudioData(arrayBuffer.slice(0));
  const decoded = normalizeAudio(trimSilence(raw));
  state.originalBuffer = decoded;
  waveformPeaks = null;
  computeWaveform(decoded);

  const cached = await loadBeatCache(id);
  let bpm: number, ticks: Float32Array;
  let apiHint: number | undefined;
  let tapHint: number | undefined;
  if (cached) {
    ({ bpm, ticks } = cached);
    setStatus('Loading…');
    const meta = await loadFileMeta(id);
    if (meta?.bpmTapped && meta.bpmTapHint) tapHint = meta.bpmTapHint;
    else if (meta?.bpmAPIHint) apiHint = meta.bpmAPIHint;
  } else {
    let hintBPM: number | undefined;
    const apiKey = GETSONGBPM_KEY;
    if (apiKey && GETSONGBPM_ENABLED) {
      const parsed = parseFilenameForLookup(name);
      if (parsed?.title) {
        const desc = parsed.artist ? `${parsed.title} by ${parsed.artist}` : parsed.title;
        setStatus(`Looking up ${desc}…`);
      } else {
        setStatus('Looking up BPM…');
      }
      await new Promise(r => setTimeout(r, 0));
      const looked = await lookupBPMFromGetSongBPM(name, apiKey);
      if (looked) { hintBPM = looked; apiHint = looked; }
    }
    setStatus('Detecting BPM…');
    await new Promise(r => setTimeout(r, 0));
    ({ bpm, ticks } = await detectRhythm(decoded, hintBPM));
    await saveBeatCache(id, bpm, ticks);
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
  setTransposeSemitones(
    settings.transposeSemitones != null && Number.isFinite(settings.transposeSemitones)
      ? settings.transposeSemitones
      : 0,
    false,
  );
  state.pausedBufferPos = loopStartSecs();
  persistCurrentFileSettings();

  setStatus('Loading…');
  await ensureNodes();

  const mins = Math.floor(decoded.duration / 60);
  const secs = Math.round(decoded.duration % 60).toString().padStart(2, '0');
  setDetectedStatus(`${mins}:${secs}`, bpm, apiHint, tapHint);

  renderLoopCards();
  updateFilePickerBtn();

  const url = buildUrl(id);
  if (pushHistory && location.search !== url) history.pushState({ fileId: id }, '', url);
  else history.replaceState({ fileId: id }, '', url);
  saveAudioFile(arrayBuffer, name, id, decoded.duration, bpm, !!apiHint, apiHint)
    .then(() => renderFilePicker())
    .catch(e => console.error('saveAudioFile/renderFilePicker failed:', e));
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

  // Process multiple files: save new ones, then open the last new one
  const mp3Files = Array.from(files).filter(f => f.type === 'audio/mpeg' || f.name.endsWith('.mp3'));
  if (mp3Files.length === 0) {
    setStatus('No MP3 files found');
    return;
  }

  const existingIds = new Set((await loadAllFilesMeta()).map(f => f.id));
  const newFiles = mp3Files.filter(f => !existingIds.has(encodeURIComponent(f.name)));

  if (newFiles.length === 0) {
    setStatus(`All ${mp3Files.length} file${mp3Files.length === 1 ? '' : 's'} already added`);
    return;
  }

  for (let i = 0; i < newFiles.length; i++) {
    const file = newFiles[i];
    const skipped = mp3Files.length - newFiles.length;
    const skipNote = skipped > 0 ? ` (${skipped} already exist)` : '';
    setStatus(`Adding ${i + 1}/${newFiles.length}${skipNote}: ${file.name}…`);

    const arrayBuffer = await file.arrayBuffer();
    const id = encodeURIComponent(file.name);
    await saveAudioFile(arrayBuffer, file.name, id);
  }

  await renderFilePicker();

  // Open the last new file
  const lastFile = newFiles[newFiles.length - 1];
  const lastId = encodeURIComponent(lastFile.name);
  const saved = await loadAudioById(lastId);
  if (saved) {
    await processArrayBuffer(saved.buffer, saved.name, lastId);
  }
});

const fileInput = document.getElementById('file-input') as HTMLInputElement;
fileInput.addEventListener('change', () => { if (fileInput.files?.[0]) processFile(fileInput.files[0]); });

window.addEventListener('popstate', async () => {
  readUrlSort();
  void renderFilePicker();
  const id = new URLSearchParams(location.search).get('f');
  if (!id || id === state.currentFileId) return;
  const saved = await loadAudioById(id);
  if (saved) processArrayBuffer(saved.buffer, saved.name, id, false);
});

document.getElementById('add-loop-btn')!.addEventListener('click', addLoop);

const GETSONGBPM_KEY = '86904f2347dfb31bf0ba23414847c7df';
const GETSONGBPM_ENABLED = ['cricklet.github.io', 'localhost'].includes(location.hostname);

async function updateFileMeta(id: string, updates: { bpm?: number; duration?: number; bpmFromAPI?: boolean; bpmAPIHint?: number; bpmTapped?: boolean; bpmTapHint?: number }): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE_META, 'readwrite');
    const req = tx.objectStore(DB_STORE_META).get(id);
    req.onsuccess = () => {
      const existing = req.result;
      if (!existing) { resolve(); return; }
      if (updates.bpm != null) existing.bpm = updates.bpm;
      if (updates.duration != null) existing.duration = updates.duration;
      if (updates.bpmFromAPI != null) existing.bpmFromAPI = updates.bpmFromAPI;
      if (updates.bpmAPIHint != null) existing.bpmAPIHint = updates.bpmAPIHint;
      if (updates.bpmTapped != null) existing.bpmTapped = updates.bpmTapped;
      if ('bpmTapHint' in updates) existing.bpmTapHint = updates.bpmTapHint;
      tx.objectStore(DB_STORE_META).put(existing);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadFileMeta(id: string): Promise<{ bpmFromAPI?: boolean; bpmAPIHint?: number; bpmTapped?: boolean; bpmTapHint?: number } | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE_META, 'readonly');
    const req = tx.objectStore(DB_STORE_META).get(id);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

// Repeatedly strip trailing (...) and [...] groups from the end of a string.
// e.g. "Song (Official Video) [Lyrics]" → "Song"
function trimTrailingBrackets(s: string): string {
  let result = s.trim();
  for (;;) {
    const m = result.match(/^(.*\S)\s*(?:\([^()]*\)|\[[^\[\]]*\])\s*$/);
    if (!m) break;
    result = m[1].trim();
  }
  return result;
}

function parseFilenameForLookup(filename: string): { artist: string; title: string } | null {
  let name = filename.replace(/\.[^.]+$/, '');
  // Normalize fullwidth chars YouTube uses instead of - / "
  name = name.replace(/｜/g, ' - ').replace(/[⧸／]/g, '/').replace(/[＂＂]/g, '"');

  // Strip trailing badge groups before splitting so they don't pollute part counts
  // e.g. "Artist - Song (Official Video)" → "Artist - Song"
  name = trimTrailingBrackets(name);

  const parts = name.split(/\s+-\s+/).map(s => s.trim()).filter(Boolean);

  // Strip all (...) and [...] blocks from a string (for artist/channel parts)
  const strip = (s: string): string => {
    let prev = '';
    while (prev !== s) {
      prev = s;
      s = s.replace(/\s*[\[(][^\[\]()]*[\])]\s*/g, ' ').trim();
    }
    return s.replace(/\s{2,}/g, ' ').trim();
  };

  // For the title part: take only text before the first ( or [
  // so "Your Idol (Lyrics) KPop Demon Hunters" → "Your Idol"
  const stripTitle = (s: string): string => {
    const before = s.replace(/[\[(].*/s, '').trim();
    return before || strip(s);
  };

  const cleaned = parts.map(strip).filter(Boolean);
  const titles = parts.map(stripTitle).filter(Boolean);

  if (cleaned.length === 0) return null;
  if (cleaned.length === 1) return { artist: '', title: titles[0] ?? cleaned[0] };
  if (cleaned.length === 2) return { artist: cleaned[0], title: titles[1] ?? cleaned[1] };

  // 3+ parts: p0 = YouTube channel (ignored), p1 = artist, p2 = title
  const [p0, p1] = cleaned;
  const t2 = titles[2] ?? cleaned[2];
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  // Same name in first two slots (e.g. "Austin Giorgio - Austin Giorgio - Chokehold")
  if (norm(p0) === norm(p1) || norm(p1).startsWith(norm(p0))) {
    return { artist: p1, title: t2 };
  }
  // YouTube Topic auto-channel (e.g. "ittibitti - Topic - Made You Look")
  if (p1.toLowerCase() === 'topic') {
    return { artist: p0, title: t2 };
  }
  // Default: p0 = YouTube channel, p1 = artist, p2 = title
  return { artist: p1, title: t2 };
}

async function lookupBPMFromGetSongBPM(filename: string, apiKey: string): Promise<number | null> {
  const parsed = parseFilenameForLookup(filename);
  if (!parsed || !parsed.title) return null;
  const enc = (s: string) => encodeURIComponent(s).replace(/%20/g, '+');
  const base = `https://api.getsong.co/search/?api_key=${encodeURIComponent(apiKey)}`;
  const tempoFrom = (data: any): number | null => {
    let tempo = parseInt(data.search?.[0]?.tempo, 10);
    if (!Number.isFinite(tempo) || tempo <= 0) return null;
    while (tempo <= 70) tempo *= 2;
    while (tempo >= 140) tempo /= 2;
    return Math.round(tempo);
  };
  try {
    // Try artist+song together first
    if (parsed.artist) {
      const lookup = `song:${enc(parsed.title)}+artist:${enc(parsed.artist)}`;
      const res = await fetch(`${base}&type=both&lookup=${lookup}`);
      if (res.ok) {
        const data = await res.json();
        const t = tempoFrom(data);
        if (t) return t;
      }
    }
    // Fall back to title-only search
    const res = await fetch(`${base}&type=song&lookup=${enc(parsed.title)}`);
    if (!res.ok) return null;
    return tempoFrom(await res.json());
  } catch (e) {
    console.error('lookupBPMFromGetSongBPM failed:', e);
    return null;
  }
}

async function runBatchDecode() {
  const modal = document.getElementById('batch-decode-modal')!;
  const progressEl = document.getElementById('batch-decode-progress')!;
  const filenameEl = document.getElementById('batch-decode-filename')!;
  const sourceEl = document.getElementById('batch-decode-source')!;

  modal.removeAttribute('hidden');

  const apiKey = GETSONGBPM_KEY;
  const countsEl = document.getElementById('batch-decode-counts')!;
  countsEl.textContent = '';

  const allFiles = await loadAllFilesMeta();
  // Include files missing bpm OR duration — API-only hits from previous runs have bpm but no duration/beat cache
  const undecoded = allFiles.filter(f => f.bpm == null || f.duration == null);
  const total = undecoded.length;

  if (total === 0) {
    progressEl.textContent = 'All files already decoded';
    filenameEl.textContent = '';
    await renderFilePicker();
    setTimeout(() => modal.setAttribute('hidden', ''), 1500);
    return;
  }

  let apiHits = 0;
  for (let i = 0; i < total; i++) {
    const f = undecoded[i];
    progressEl.textContent = `Decoding ${i + 1} / ${total}…`;
    filenameEl.textContent = f.name;
    sourceEl.textContent = '';
    await new Promise(r => setTimeout(r, 0));
    let hintBPM: number | undefined;
    if (apiKey && GETSONGBPM_ENABLED) {
      const bpmFromAPI = await lookupBPMFromGetSongBPM(f.name, apiKey);
      if (bpmFromAPI) {
        hintBPM = bpmFromAPI;
        apiHits++;
        sourceEl.textContent = `GetSongBPM: ${bpmFromAPI} BPM → analyzing…`;
        await new Promise(r => setTimeout(r, 80)); // be polite to the API
      }
    }
    if (!hintBPM) sourceEl.textContent = 'analyzing audio…';
    try {
      const saved = await loadAudioById(f.id);
      if (!saved) continue;
      const ctx = getAudioCtx();
      const raw = await ctx.decodeAudioData(saved.buffer.slice(0));
      const decoded = normalizeAudio(trimSilence(raw));
      const { bpm, ticks } = await detectRhythm(decoded, hintBPM);
      await saveBeatCache(f.id, bpm, ticks);
      await saveAudioFile(saved.buffer, f.name, f.id, decoded.duration, bpm, !!hintBPM, hintBPM);
      countsEl.textContent = `${i + 1} / ${total} done`;
    } catch (e) {
      console.error(`batch decode failed for ${f.name}:`, e);
      sourceEl.textContent = `Error: ${(e as Error).message ?? e}`;
    }
  }

  const apiNote = apiHits ? ` (${apiHits} API hints)` : '';
  progressEl.textContent = `Done — ${total} file${total === 1 ? '' : 's'}${apiNote}`;
  filenameEl.textContent = '';
  sourceEl.textContent = '';
  await renderFilePicker();
  setTimeout(() => modal.setAttribute('hidden', ''), 2500);
}

function normalizeBPMToRange(bpm: number): number {
  let v = bpm;
  while (v <= 70) v *= 2;
  while (v >= 140) v /= 2;
  return Math.round(v);
}

async function runNormalize() {
  const modal = document.getElementById('batch-decode-modal')!;
  const progressEl = document.getElementById('batch-decode-progress')!;
  const filenameEl = document.getElementById('batch-decode-filename')!;
  const sourceEl = document.getElementById('batch-decode-source')!;
  const countsEl = document.getElementById('batch-decode-counts')!;

  modal.removeAttribute('hidden');
  countsEl.textContent = '';

  const allFiles = await loadAllFilesMeta();
  const toFix = allFiles.filter(f => f.bpmFromAPI && f.bpm != null && (f.bpm < 70 || f.bpm > 140));
  const total = toFix.length;

  if (total === 0) {
    progressEl.textContent = 'No out-of-range API BPMs found';
    filenameEl.textContent = '';
    await renderFilePicker();
    setTimeout(() => modal.setAttribute('hidden', ''), 1500);
    return;
  }

  let fixed = 0;
  for (let i = 0; i < total; i++) {
    const f = toFix[i];
    const hintBPM = normalizeBPMToRange(f.bpm!);
    progressEl.textContent = `Normalizing ${i + 1} / ${total}…`;
    filenameEl.textContent = f.name;
    sourceEl.textContent = `${f.bpm} BPM → hint ${hintBPM} BPM`;
    await new Promise(r => setTimeout(r, 0));
    try {
      const saved = await loadAudioById(f.id);
      if (!saved) continue;
      const ctx = getAudioCtx();
      const raw = await ctx.decodeAudioData(saved.buffer.slice(0));
      const decoded = normalizeAudio(trimSilence(raw));
      const { bpm, ticks } = await detectRhythm(decoded, hintBPM);
      await saveBeatCache(f.id, bpm, ticks);
      await saveAudioFile(saved.buffer, f.name, f.id, decoded.duration, bpm, true, f.bpmAPIHint);
      fixed++;
      countsEl.textContent = `${fixed} fixed`;
    } catch (e) {
      console.error(`normalize failed for ${f.name}:`, e);
      sourceEl.textContent = `Error: ${(e as Error).message ?? e}`;
    }
  }

  progressEl.textContent = `Done — ${fixed} / ${total} fixed`;
  filenameEl.textContent = '';
  sourceEl.textContent = '';
  await renderFilePicker();
  setTimeout(() => modal.setAttribute('hidden', ''), 2500);
}

// Init
(function init() {
  const saved = localStorage.getItem(STORAGE_THEME);
  setTheme(saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    try { if (localStorage.getItem(STORAGE_THEME) != null) return; } catch (e) { console.error('localStorage failed:', e); }
    setTheme(e.matches ? 'dark' : 'light');
  });

  try {
    const v = parseFloat(localStorage.getItem(STORAGE_VOLUME) ?? '1');
    if (Number.isFinite(v)) state.volume = clamp(v, 0, 1);
  } catch (e) { console.error('failed to read STORAGE_VOLUME:', e); }

  try {
    if (localStorage.getItem(STORAGE_METRONOME) === '1') {
      state.metronomeEnabled = true;
      const btn = document.getElementById('metronome-toggle');
      if (btn) btn.classList.add('active');
    }
  } catch (e) { console.error('failed to read STORAGE_METRONOME:', e); }

  try {
    if (localStorage.getItem(STORAGE_SHOW_TIMES) === '1') {
      setShowTimes(true, false);
    }
  } catch (e) { console.error('failed to read STORAGE_SHOW_TIMES:', e); }

  try {
    if (localStorage.getItem(STORAGE_PLAYER_MODE) === '1') {
      state.playerMode = true;
      document.body.classList.add('player-mode');
      const btn = document.getElementById('player-mode-toggle');
      if (btn) btn.classList.add('active');
    }
  } catch (e) { console.error('failed to read STORAGE_PLAYER_MODE:', e); }

  setBpmDisplay(state.targetBPM);
  setVolumeDisplay(state.volume);
  updateTransposeBtn();
  updateRowHeight();
  renderLoopCards();

  if (new URLSearchParams(window.location.search).has('batch')) {
    runBatchDecode().catch(console.error);
    return;
  }

  if (new URLSearchParams(window.location.search).has('normalize')) {
    runNormalize().catch(console.error);
    return;
  }

  readUrlSort();

  loadAllFilesMeta().then(async files => {
    renderFilePicker().catch(e => console.error('renderFilePicker failed:', e));
    if (files.length === 0) return;
    const urlId = new URLSearchParams(location.search).get('f');
    const target = (urlId && files.find(f => f.id === urlId))
      ? urlId
      : files.sort((a, b) => b.addedAt - a.addedAt)[0].id;
    const saved = await loadAudioById(target);
    if (saved) processArrayBuffer(saved.buffer, saved.name, target, false);
  }).catch(e => console.error('init loadAllFilesMeta failed:', e));
})();
