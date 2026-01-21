import { Decimal } from 'decimal.js';

type Vec2 = [number, number];

type Graph = {
  points: Record<number, Vec2>;
  curves: Record<number, Line | Arc>;
};
type Line = {
  type: 'line';
  start: number;
  end: number;
};
type Arc = {
  type: 'arc';
  start: number;
  end: number;
  bulge: number;
};

type PositionedLine = {
  type: 'line';
  start: Vec2;
  end: Vec2;
};

type PositionedArc = {
  type: 'arc';
  start: [number, number];
  end: [number, number];
  bulge: number;
};

type LabelRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
};

type ArcDef = {
  center: Vec2;
  startAngle: number;
  endAngle: number;
  angle: number;
  radius: number;
  bulgeSign: number;
};

type Minimal = Array<
  // point
  [number, number] |
  // line
  [number, number, number, number] |
  // arc
  [number, number, number, number, number]>;

// Vector utility functions
function add(a: Vec2, b: Vec2): Vec2 {
  return [a[0] + b[0], a[1] + b[1]];
}

function subtract(a: Vec2, b: Vec2): Vec2 {
  return [a[0] - b[0], a[1] - b[1]];
}

function scale(v: Vec2, s: number): Vec2 {
  return [v[0] * s, v[1] * s];
}

function midpoint(a: Vec2, b: Vec2): Vec2 {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

function distance(a: Vec2, b: Vec2): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return Math.sqrt(dx * dx + dy * dy);
}

function direction(a: Vec2, b: Vec2): Vec2 {
  const d = subtract(b, a);
  const len = Math.sqrt(d[0] * d[0] + d[1] * d[1]);
  return [d[0] / len, d[1] / len];
}

function perpendicular2D(v: Vec2): Vec2 {
  return [-v[1], v[0]];
}

function isVec2(v: any): v is Vec2 {
  return Array.isArray(v) && v.length === 2 && isNumber(v[0]) && isNumber(v[1]);
}

function isLine(v: Minimal[number]): v is [number, number, number, number] {
  return Array.isArray(v) && v.length === 4 && isNumber(v[0]) && isNumber(v[1]) && isNumber(v[2]) && isNumber(v[3]);
}

function isArc(v: Minimal[number]): v is [number, number, number, number, number] {
  return (
    Array.isArray(v) &&
    v.length === 5 &&
    isNumber(v[0]) &&
    isNumber(v[1]) &&
    isNumber(v[2]) &&
    isNumber(v[3]) &&
    isNumber(v[4])
  );
}

function addMinimalToGraph(graph: Graph, minimal: Minimal): Graph {
  let nextPointId = Math.max(...Object.keys(graph.points).map(Number), 0) + 1;
  let nextCurveId = Math.max(...Object.keys(graph.curves).map(Number), 0) + 1;

  const addPoint = (point: Vec2): number => {
    const id = nextPointId++;
    graph.points[id] = point;
    return id;
  };

  const findOrAddPoint = (point: Vec2): number => {
    for (const [id, p] of Object.entries(graph.points)) {
      if (distance(p, point) < 1e-14) {
        return Number(id);
      }
    }
    const id = nextPointId++;
    graph.points[id] = point;
    return id;
  };

  for (const item of minimal) {
    if (isVec2(item)) {
      addPoint(item);
    } else if (isLine(item)) {
      let start = findOrAddPoint([item[0], item[1]]);
      let end = findOrAddPoint([item[2], item[3]]);
      graph.curves[nextCurveId++] = { type: 'line', start, end };
    } else if (isArc(item)) {
      let start = findOrAddPoint([item[0], item[1]]);
      let end = findOrAddPoint([item[2], item[3]]);
      graph.curves[nextCurveId++] = { type: 'arc', start, end, bulge: item[4] };
    }
  }

  return graph;
}

// Positioned segments support
function isPositionedLine(obj: any): obj is PositionedLine {
  return obj?.type === 'line' && isVec2(obj.start) && isVec2(obj.end);
}

function isPositionedArc(obj: any): obj is PositionedArc {
  return (
    obj?.type === 'arc' && isVec2(obj.start) && isVec2(obj.end) && isNumber(obj.bulge)
  );
}

function isPositionedSegments(
  data: any
): Array<PositionedLine | PositionedArc> | null {
  if (!Array.isArray(data)) {
    return null;
  }
  for (const item of data) {
    if (!isPositionedLine(item) && !isPositionedArc(item)) {
      return null;
    }
  }
  return data;
}

function addPositionedSegmentsToGraph(
  graph: Graph,
  segments: Array<PositionedLine | PositionedArc>
): Graph {
  let nextPointId = Math.max(...Object.keys(graph.points).map(Number), 0) + 1;
  let nextCurveId = Math.max(...Object.keys(graph.curves).map(Number), 0) + 1;

  const findOrAddPoint = (point: Vec2): number => {
    for (const [id, p] of Object.entries(graph.points)) {
      if (distance(p, point) < 1e-14) {
        return Number(id);
      }
    }
    const id = nextPointId++;
    graph.points[id] = point;
    return id;
  };

  for (const seg of segments) {
    const start = findOrAddPoint(seg.start);
    const end = findOrAddPoint(seg.end);
    if (seg.type === 'line') {
      graph.curves[nextCurveId++] = { type: 'line', start, end };
    } else {
      graph.curves[nextCurveId++] = { type: 'arc', start, end, bulge: seg.bulge };
    }
  }
  return graph;
}

function indexOfMatchingBracket(text: string, openBracket: string, closeBracket: string, startIndex: number): number | undefined {
  let depth = 0;
  for (let i = startIndex; i < text.length; i++) {
    if (text[i] === openBracket) {
      depth++;
    } else if (text[i] === closeBracket) {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }
  return undefined;
}

// Extract the first top-level JSON array of positioned segments from text and return remainder
function extractFirstPositionedSegments(
  text: string
): { segments: Array<PositionedLine | PositionedArc>; remainder: string } | null {
  console.log(text);
  const firstBracketIndex = text.indexOf('[');
  const matchingBracketIndex = indexOfMatchingBracket(text, '[', ']', firstBracketIndex);
  if (matchingBracketIndex == null) {
    return null;
  }
  try {
    const segments = JSON.parse(text.slice(firstBracketIndex, matchingBracketIndex + 1));
    console.log(segments);
    if (!isPositionedSegments(segments)) {
      return null;
    }
    const remainder = text.slice(matchingBracketIndex + 1);
    return { segments, remainder };
  } catch (e) {
    return null;
  }
}

function extractGraph(text: string): { graph: Graph, remainder: string } {
  const defaultResult = {
    graph: { points: {}, curves: {} },
    remainder: text,
  };
  const firstBracketIndex = text.indexOf('{');
  if (firstBracketIndex === -1) {
    return defaultResult;
  }
  const matchingBracketIndex = indexOfMatchingBracket(text, '{', '}', firstBracketIndex);
  if (matchingBracketIndex == null) {
    return defaultResult;
  }
  const graphText = text.slice(firstBracketIndex, matchingBracketIndex + 1);
  const graph = asGraph(JSON.parse(graphText));
  if (graph == null) {
    return defaultResult;
  }
  const remainder = text.replace(graphText, '');
  return { graph, remainder };
}

function parseMinimal(text: string): Minimal {
  const result: Minimal = [];

  // Process vector addition blocks first
  let processedText = text;

  // Find all vector addition blocks: ( + vector1 vector2 )
  const additionBlockRegex = /\(\s*\+\s*([-\d\.]+),?\s*([-\d\.]+)\s*([-\d\.]+),?\s*([-\d\.]+)\s*\)/g;

  processedText = processedText.replace(additionBlockRegex, (match, x1, y1, x2, y2) => {
    const vec1: Vec2 = [parseFloat(x1), parseFloat(y1)];
    const vec2: Vec2 = [parseFloat(x2), parseFloat(y2)];
    const sum = add(vec1, vec2);
    return `${sum[0]}, ${sum[1]}`;
  });

  console.log(processedText)

  for (const line of processedText.split('\n')) {
    let trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('//')) {
      continue;
    }

    trimmed = trimmed.replace(/[\[\],]/g, ' ');
    const parts: number[] = trimmed.split(' ').filter((v) => v != '' && v != null).map(Number);
    if (parts.length === 2 || parts.length === 4 || parts.length === 5) {
      result.push(parts as Minimal[number]);
    }
  }

  return result;
}

function isNumber(n: any): n is number {
  return typeof n === 'number' && !isNaN(n);
}

function asNumber(n: string | number): number {
  if (typeof n === 'string') {
    return Number(n);
  }
  return n;
}

function asGraph(data: any): Graph | null {
  if (data.points == null) {
    console.log('data.points is null');
    return null;
  }

  for (const _pointId of Object.keys(data.points)) {
    const pointId = Number(_pointId);
    const point = data.points[pointId];
    if (!Array.isArray(point) || point.length !== 2) {
      return null;
    }
  }

  for (const _curveId of Object.keys(data.curves)) {
    const curveId = Number(_curveId);
    const curve = data.curves[curveId];

    if (curve.type === 'line') {
      if (!isNumber(curve.start) || !isNumber(curve.end)) {
        return null;
      }
    } else if (curve.type === 'arc') {
      if (
        !isNumber(curve.start) ||
        !isNumber(curve.end) ||
        !isNumber(curve.bulge)
      ) {
        return null;
      }
    } else {
      return null;
    }
  }
  return data;
}

function isInView(_x: Decimal | number, _y: Decimal | number): boolean {
  const x = _x instanceof Decimal ? _x.toNumber() : _x;
  const y = _y instanceof Decimal ? _y.toNumber() : _y;
  return x >= 0 && x <= canvasWidth && y >= 0 && y <= canvasHeight;
}

function drawPoint(ctx: CanvasRenderingContext2D, x: number, y: number) {
  if (isInView(x, y)) {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDecimalLine(
  ctx: CanvasRenderingContext2D,
  startX: Decimal,
  startY: Decimal,
  endX: Decimal,
  endY: Decimal,
) {
  // Use Liang-Barsky algorithm to clip the line to the canvas viewport.
  // The viewport is from (0, 0) to (canvasWidth, canvasHeight).

  const d_canvasWidth = new Decimal(canvasWidth);
  const d_canvasHeight = new Decimal(canvasHeight);

  let t0 = new Decimal(0);
  let t1 = new Decimal(1);

  const dx = endX.minus(startX);
  const dy = endY.minus(startY);

  // p and q arrays for the 4 clip boundaries (left, right, bottom, top)
  const p = [dx.neg(), dx, dy.neg(), dy];
  const q = [
    startX,
    d_canvasWidth.minus(startX),
    startY,
    d_canvasHeight.minus(startY),
  ];

  for (let i = 0; i < 4; i++) {
    const p_i = p[i];
    const q_i = q[i];

    if (p_i.isZero()) {
      // Line is parallel to the clip edge
      if (q_i.isNegative()) {
        // Parallel and outside of the boundary, so the line is entirely outside
        return;
      }
    } else {
      const r = q_i.div(p_i);
      if (p_i.isNegative()) {
        // Line is entering the clip region from this edge
        t0 = Decimal.max(t0, r);
      } else {
        // p_i is positive
        // Line is leaving the clip region from this edge
        t1 = Decimal.min(t1, r);
      }
    }
  }

  if (t0.greaterThan(t1)) {
    // Line is completely outside the clip window
    return;
  }

  // Calculate the clipped line endpoints
  const clipStartX = startX.plus(t0.times(dx));
  const clipStartY = startY.plus(t0.times(dy));
  const clipEndX = startX.plus(t1.times(dx));
  const clipEndY = startY.plus(t1.times(dy));

  // Draw the clipped line
  ctx.beginPath();
  ctx.moveTo(clipStartX.toNumber(), clipStartY.toNumber());
  ctx.lineTo(clipEndX.toNumber(), clipEndY.toNumber());
  ctx.stroke();
}

// Arc-related utility functions
const BULGE_STRAIGHT_LINE_THRESHOLD = 1e-6;

const canvas = document.getElementById('drawing-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const textarea = document.getElementById('input-text') as HTMLTextAreaElement;
const normalizedTextarea = document.getElementById(
  'normalized-text'
) as HTMLTextAreaElement;

// Cursor position overlay (created in init)
let cursorOverlayEl: HTMLDivElement | null = null;

// Add reset button handler
document
  .getElementById('reset-button')!
  .addEventListener('click', function () {
    zoomLevel = 1;
    dataOffsetX = 0;
    dataOffsetY = 0;
    drawGraph();
    saveGraphData();
  });

// Add filter state
let filteredVertexIds = new Set<number>();

// Get file_id from URL
const url = new URL(window.location.href);
const fileId = url.searchParams.get('file_id') ?? Math.random().toString(36).substring(2);
let outputFormat = 'js';

// Add format toggle handler
document
  .getElementById('format-toggle')!
  .addEventListener('click', function () {
    outputFormat = outputFormat === 'js' ? 'rust' : 'js';
    this.textContent = `Format: ${outputFormat.toUpperCase()}`;
    drawGraph(); // Redraw to update the normalized text
  });

// Variables for zoom and pan
let zoomLevel = 1;
let dataOffsetX = 0;
let dataOffsetY = 0;
let dataScale = 1;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Cached during rendering, useful for zooming maths
let dataWidth = 100;
let dataHeight = 100;
let dataCenterX = 0;
let dataCenterY = 0;
let finalDataWidth = 100;
let finalDataHeight = 100;
const margin = 30;
let canvasWidth = canvas.width / window.devicePixelRatio;
let canvasHeight = canvas.height / window.devicePixelRatio;
let availableWidth = canvasWidth - margin * 2;
let availableHeight = canvasHeight - margin * 2;
let canvasCenterX = canvasWidth / 2;
let canvasCenterY = canvasHeight / 2;

// Function to transform coordinates to canvas coordinates
function transformDataX(dataX: number): Decimal {
  // const x = dataX - dataCenterX + dataOffsetX;
  // return canvasCenterX + x * dataScale;

  const d_dataX = new Decimal(dataX);
  const d_dataCenterX = new Decimal(dataCenterX);
  const d_dataOffsetX = new Decimal(dataOffsetX);
  const d_canvasCenterX = new Decimal(canvasCenterX);
  const d_dataScale = new Decimal(dataScale);

  const x = d_dataX.minus(d_dataCenterX).plus(d_dataOffsetX);
  return d_canvasCenterX.plus(x.times(d_dataScale));
}

function transformDataY(dataY: number) {
  // const y = dataY - dataCenterY + dataOffsetY;
  // return canvasCenterY + y * dataScale;

  const d_dataY = new Decimal(dataY);
  const d_dataCenterY = new Decimal(dataCenterY);
  const d_dataOffsetY = new Decimal(dataOffsetY);
  const d_canvasCenterY = new Decimal(canvasCenterY);
  const d_dataScale = new Decimal(dataScale);

  const y = d_dataY.minus(d_dataCenterY).plus(d_dataOffsetY);
  return d_canvasCenterY.minus(y.times(d_dataScale));
}

// Inverse transform: screen pixels -> data coordinates
function screenToData(screenX: number, screenY: number): Vec2 {
  const dataX = dataCenterX - dataOffsetX + (screenX - canvasCenterX) / dataScale;
  const dataY = dataCenterY - dataOffsetY + (canvasCenterY - screenY) / dataScale;
  return [dataX, dataY];
}

// Zoom limits
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 1000000000000000;
const ZOOM_MULTIPLIER = 1.1;
const SHIFT_ZOOM_MULTIPLIER = 10;
const SHIFT_ZOOM_WHEEL_MULTIPLIER = 2.0;

// Theme functionality
function setTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme);
}

// Set canvas size to match its container and adjust for Retina displays
function resizeCanvas() {
  const container = canvas.parentElement!;
  const dpr = window.devicePixelRatio || 1;

  // Set canvas dimensions accounting for device pixel ratio
  canvas.width = container.clientWidth * dpr;
  canvas.height = container.clientHeight * dpr;

  // Use CSS to scale back down visually (otherwise it would look zoomed in)
  canvas.style.width = `${container.clientWidth}px`;
  canvas.style.height = `${container.clientHeight}px`;

  // Reset transformations
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Apply device pixel ratio scaling to make drawing crisp
  ctx.scale(dpr, dpr);

  drawGraph(); // Redraw when resized
}

// Example data to prefill the textarea
const exampleData = {
  points: {
    1: [1.1649012131626062, -3.3265764030271026],
    2: [2.2611750688787104, -2.2679170464475904],
    3: [2.9646221193477764, -5.19024195774448],
    // 4: [4.060895975063881, -4.1315826011649674],
    // 5: [1.4528886113182526, -4.508833699525585],
    // 6: [4.077193439461576, -3.285100260829216],
    // 7: [1.6678217712176435, -3.8473658863215636],
    // 8: [2.973779474923968, -3.005840510648178],
    // 9: [3.7544347246239678, -3.8142326863322733],
    // 10: [2.3768186192922176, -4.5815536148847515]
  },
  curves: [
    // Object notation for lines and arcs
    {
      type: 'line',
      start: [1.1649012131626062, -3.3265764030271026],
      end: [2.2611750688787104, -2.2679170464475904],
    },
    {
      type: 'line',
      start: [2.9646221193477764, -5.19024195774448],
      end: [4.060895975063881, -4.1315826011649674],
    },
    {
      type: 'line',
      start: [1.1649012131626062, -3.3265764030271026],
      end: [1.6678217712176435, -3.8473658863215636],
    },
    {
      type: 'line',
      start: [2.2611750688787104, -2.2679170464475904],
      end: [2.973779474923968, -3.005840510648178],
    },
    {
      type: 'arc',
      start: [1.4528886113182526, -4.508833699525585],
      end: [1.6678217712176435, -3.8473658863215636],
      bulge: -0.10390619845676649,
    },
    {
      type: 'arc',
      start: [1.6678217712176435, -3.8473658863215636],
      end: [2.973779474923968, -3.005840510648178],
      bulge: -0.2432042241491406,
    },
    {
      type: 'arc',
      start: [2.973779474923968, -3.005840510648178],
      end: [4.077193439461576, -3.285100260829216],
      bulge: -0.1732772029204678,
    },
    {
      type: 'line',
      start: [2.973779474923968, -3.005840510648178],
      end: [3.7544347246239678, -3.8142326863322733],
    },
    {
      type: 'line',
      start: [3.7544347246239678, -3.8142326863322733],
      end: [4.060895975063881, -4.1315826011649674],
    },
    {
      type: 'line',
      start: [1.6678217712176435, -3.8473658863215636],
      end: [2.3768186192922176, -4.5815536148847515],
    },
    {
      type: 'line',
      start: [2.3768186192922176, -4.5815536148847515],
      end: [2.9646221193477764, -5.19024195774448],
    },
    {
      type: 'arc',
      start: [4.077193439461576, -3.285100260829216],
      end: [3.7544347246239678, -3.8142326863322733],
      bulge: -0.07173627184060931,
    },
    {
      type: 'arc',
      start: [3.7544347246239678, -3.8142326863322733],
      end: [2.3768186192922176, -4.5815536148847515],
      bulge: -0.187994054375502,
    },
    {
      type: 'arc',
      start: [2.3768186192922176, -4.5815536148847515],
      end: [1.4528886113182526, -4.508833699525585],
      bulge: -0.10796167436425991,
    },

    // Shorthand notation for lines
    [
      1.1649012131626062, -3.3265764030271026, 2.2611750688787104,
      -2.2679170464475904,
    ],
    [
      2.9646221193477764, -5.19024195774448, 4.060895975063881,
      -4.1315826011649674,
    ],
    [
      1.1649012131626062, -3.3265764030271026, 1.6678217712176435,
      -3.8473658863215636,
    ],
    [
      2.2611750688787104, -2.2679170464475904, 2.973779474923968,
      -3.005840510648178,
    ],

    // Shorthand notation for arcs
    [
      1.4528886113182526, -4.508833699525585, 1.6678217712176435,
      -3.8473658863215636, -0.10390619845676649,
    ],
    [
      1.6678217712176435, -3.8473658863215636, 2.973779474923968,
      -3.005840510648178, -0.2432042241491406,
    ],
    [
      2.973779474923968, -3.005840510648178, 4.077193439461576,
      -3.285100260829216, -0.1732772029204678,
    ],
    [
      4.077193439461576, -3.285100260829216, 3.7544347246239678,
      -3.8142326863322733, -0.07173627184060931,
    ],
    [
      3.7544347246239678, -3.8142326863322733, 2.3768186192922176,
      -4.5815536148847515, -0.187994054375502,
    ],
    [
      2.3768186192922176, -4.5815536148847515, 1.4528886113182526,
      -4.508833699525585, -0.10796167436425991,
    ],
  ],
};

// New minimalistic format example
const minimalisticExample = `
// Points (x y)
1.1649 -3.3265
2.2611 -2.2679
2.9646 -5.1902

// Lines (x1 y1 x2 y2)
1.1649 -3.3265 2.2611 -2.2679
2.9646 -5.1902 4.0608 -4.1315
1.1649 -3.3265 1.6678 -3.8473
2.2611 -2.2679 2.9737 -3.0058
2.9737 -3.0058 3.7544 -3.8142
3.7544 -3.8142 4.0608 -4.1315
1.6678 -3.8473 2.3768 -4.5815
2.3768 -4.5815 2.9646 -5.1902

// Arcs (x1 y1 x2 y2 bulge)
1.4528 -4.5088 1.6678 -3.8473 -0.1039
1.6678 -3.8473 2.9737 -3.0058 -0.2432
2.9737 -3.0058 4.0771 -3.2851 -0.1732
4.0771 -3.2851 3.7544 -3.8142 -0.0717
3.7544 -3.8142 2.3768 -4.5815 -0.1879
2.3768 -4.5815 1.4528 -4.5088 -0.1079
`;

const bracketPairExample = `// Points [x, y]
[1.1649, -3.3265]
[2.2611, -2.2679]

// Lines [x, y] [x, y]
[1.1649, -3.3265] [2.2611, -2.2679]
[2.9646, -5.1902] [4.0608, -4.1315]

// Arcs [x, y] [x, y] bulge
[1.4528, -4.5088] [1.6678, -3.8473] -0.1039
[1.6678, -3.8473] [2.9737, -3.0058] -0.2432
`;

const parenPairExample = `// Points (x, y)
(1.1649, -3.3265)
(2.2611, -2.2679)

// Lines (x, y) (x, y)
(1.1649, -3.3265) (2.2611, -2.2679)
(2.9646, -5.1902) (4.0608, -4.1315)

// Arcs (x, y) (x, y) bulge
(1.4528, -4.5088) (1.6678, -3.8473) -0.1039
(1.6678, -3.8473) (2.9737, -3.0058) -0.2432
`;

const logFormatExample = `// Log output with coordinates
INFO src/embedded_network_builder.rs:274 2.3972856841357393 -4.5786420921870175
INFO src/embedded_network_builder.rs:282 [1.4528886113182526, -4.508833699525585] [1.6678217712176435, -3.8473658863215636] -0.10390619845676649
ERROR src/embedded_network_builder.rs:283 [3.7544347246239678, -3.8142326863322733] [2.3768186192922176, -4.5815536148847515] -0.187994054375502
`;

// Function to reset zoom and pan
function resetZoomAndPan() {
  zoomLevel = 1;
  dataOffsetX = 0;
  dataOffsetY = 0;
}

// Reset zoom and pan when loading new data
function loadGraphData() {
  const savedData = window.localStorage.getItem(fileId);
  resetZoomAndPan();

  if (savedData) {
    try {
      // Try to parse as JSON first (new format)
      const data = JSON.parse(savedData);
      textarea.value = data.text;

      // If view settings exist, apply them
      if (data.view) {
        zoomLevel = data.view.zoomLevel;
        dataOffsetX = data.view.dataOffsetX;
        dataOffsetY = data.view.dataOffsetY;
      }
    } catch (e) {
      // If parsing fails, treat as legacy text-only format
      textarea.value = savedData;
    }
    drawGraph();
  } else {
    // Load default example data - use minimalistic format
    textarea.value = minimalisticExample;
    drawGraph();
  }
}

function saveGraphData() {
  const data = {
    text: textarea.value,
    view: {
      zoomLevel,
      dataOffsetX,
      dataOffsetY,
    },
  };
  window.localStorage.setItem(fileId, JSON.stringify(data));
}

/**
 * Returns the center, angle, and radius of an arc.
 */
function arcSegmentToArcDef(segment: PositionedArc): ArcDef {
  const { start, end, bulge } = segment;

  const chordMidpoint = midpoint(start, end);

  // Degenerate cases -- just treat the arc as a straight line.
  if (Math.abs(bulge) < BULGE_STRAIGHT_LINE_THRESHOLD) {
    return {
      center: chordMidpoint,
      startAngle: 0,
      endAngle: 0,
      angle: 0,
      radius: Infinity,
      bulgeSign: 0,
    };
  }

  const chordLength = distance(start, end);
  const sagitta = (chordLength / 2) * bulge;

  const angle = Math.atan(bulge) * 4;
  const halfθ = Math.abs(angle) / 2;
  const radius = chordLength / (2 * Math.sin(halfθ));

  // Calculate the direction from start to end
  const chordDir = direction(start, end);
  // For bulge, the perpendicular is 90 degrees counter-clockwise from chord
  const perpendicular: Vec2 = [-chordDir[1], chordDir[0]];

  // Scale perpendicular based on bulge sign - this determines which side of the chord
  // the arc appears on
  const center = add(
    chordMidpoint,
    scale(
      perpendicular,
      bulge < 0
        ? -radius * Math.abs(Math.cos(halfθ))
        : radius * Math.abs(Math.cos(halfθ))
    )
  );

  const startAngle = Math.atan2(start[1] - center[1], start[0] - center[0]);
  const endAngle = Math.atan2(end[1] - center[1], end[0] - center[0]);

  return {
    center,
    startAngle,
    endAngle,
    angle,
    radius,
    bulgeSign: Math.sign(bulge),
  };
}

function tessellateArc2D(arc: PositionedArc, numPoints = 20) {
  const arcDef = arcSegmentToArcDef(arc);
  const {
    center,
    angle: deltaAngle,
    startAngle,
    endAngle,
    radius,
    bulgeSign,
  } = arcDef;

  if (Math.abs(deltaAngle) < BULGE_STRAIGHT_LINE_THRESHOLD) {
    // Angle was zero so just return the endpoints
    return [arc.start, arc.end];
  }

  const vpoints = [];

  // For correct arc rendering, we need to handle both clockwise and counter-clockwise arcs
  let startAng = startAngle;
  let endAng = endAngle;

  // Handle angle wrapping correctly based on bulge sign
  // Positive bulge means counter-clockwise path from start to end
  // Negative bulge means clockwise path from start to end
  if (bulgeSign > 0) {
    // CCW - if end is less than start, we crossed 0
    if (endAng < startAng) {
      endAng += 2 * Math.PI;
    }
  } else {
    // CW - if start is less than end, we crossed 0
    if (startAng < endAng) {
      startAng += 2 * Math.PI;
    }
  }

  // Generate points along the arc
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const angle = startAng * (1 - t) + endAng * t;

    const x = center[0] + radius * Math.cos(angle);
    const y = center[1] + radius * Math.sin(angle);

    vpoints.push([x, y]);
  }

  return vpoints;
}

function rotateVector(v: Vec2, angle: number): Vec2 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [v[0] * cos - v[1] * sin, v[0] * sin + v[1] * cos];
}

function fixJavascriptUnquotedKeys(inputText: string): string {
  // First, try to convert JavaScript object literals to valid JSON by quoting unquoted property names
  // This regex handles both alphabetic property names and numeric ones
  const jsonText = inputText.replace(
    /([{,]\s*)([a-zA-Z0-9_$][a-zA-Z0-9_$]*)\s*:/g,
    '$1"$2":'
  );
  return jsonText;
}

function removeTrailingCommasBeforeAllClosingBracesOrBrackets(
  input: string
): string {
  // Find all trailing commas before closing braces or brackets and remove them
  // This makes JavaScript object literals with trailing commas valid JSON
  return input
    .replace(/,\s*\]/g, ']') // Remove trailing commas before closing brackets
    .replace(/,\s*\}/g, '}'); // Remove trailing commas before closing braces
}

function removeTrailingSemicolonsFromJSON(input: string): string {
  // Find all trailing semicolons and remove them
  return input.replace(/;\s*$/, '');
}

function replaceSingleQuotesWithDoubleQuotes(input: string): string {
  return input.replace(/'/g, '"');
}

function removeCommentsFromJSON(input: string): string {
  // Process the input line by line
  const lines = input.split('\n');
  const processedLines = lines.map((line) => {
    // Remove any text after // (comments)
    const commentIndex = line.indexOf('//');
    if (commentIndex >= 0) {
      return line.substring(0, commentIndex);
    }
    return line;
  });

  // Join the lines back together
  return processedLines.join('\n');
}

function parseText(text: string): Graph | null {
  try {
    text = text.trim();
    text = removeLogPrefixes(text);
    text = removeCommentsFromJSON(text);
    text = replaceSingleQuotesWithDoubleQuotes(
      removeTrailingSemicolonsFromJSON(
        removeTrailingCommasBeforeAllClosingBracesOrBrackets(
          fixJavascriptUnquotedKeys(text)
        )
      )
    );

    // Split the message into:
    //  * Graph text by finding the first { and last }
    //  * The rest of the text
    const graphExtraction = extractGraph(text);
    let restText = graphExtraction.remainder;
    let graph = graphExtraction.graph;
    console.log(graphExtraction);

    const positionedSegmentsExtraction = extractFirstPositionedSegments(restText);
    console.log(positionedSegmentsExtraction);
    if (positionedSegmentsExtraction) {
      graph = addPositionedSegmentsToGraph(graph, positionedSegmentsExtraction.segments);
      restText = positionedSegmentsExtraction.remainder;
    }

    return addMinimalToGraph(graph, parseMinimal(restText));
  } catch (e) {
    return null;
  }
}

function removeLogPrefixes(input: string) {
  // Process the input line by line
  const lines = input.split('\n');
  const processedLines = lines.map((line) => {
    // First remove log-style prefixes like "INFO src/cross_section.rs:840"
    let processed = line.replace(
      /^(?:INFO|ERROR|DEBUG|WARN|TRACE)\s+[\w\/\-\.]+:\d+(?::\d+)?\s+/,
      ''
    );

    // Then remove file paths with line/column numbers like "arcol_rust.js:4197:16"
    // Updated pattern to better match file paths including dots and underscores
    processed = processed.replace(/arcol_rust.js:[\d:]+/, '');

    return processed;
  });

  // Join the lines back together
  return processedLines.join('\n');
}

let redrawTimeout: number | undefined = undefined;
function triggerRedraw() {
  clearTimeout(redrawTimeout);
  redrawTimeout = setTimeout(function () {
    drawGraph();
    saveGraphData();
  }, 1);
}

function drawGraph() {
  // Clear canvas - use CSS dimensions for clear
  ctx.clearRect(
    0,
    0,
    canvas.width / window.devicePixelRatio,
    canvas.height / window.devicePixelRatio
  );

  try {
    let data: Graph | null = parseText(textarea.value);
    if (data == null) {
      return;
    }

    // Convert curves array to record if needed
    if (Array.isArray(data.curves)) {
      const curvesRecord: Record<number, Line | Arc> = {};
      data.curves.forEach((curve, index) => {
        curvesRecord[index] = curve;
      });
      data.curves = curvesRecord;
    }

    // Helper function to resolve point references
    function resolvePoint(pointId: number): Vec2 | null {
      if (data?.points && data.points[pointId]) {
        return data.points[pointId];
      } else {
        console.error(`Could not resolve point ID: ${pointId}`);
        return null; // Return null to indicate an error
      }
    }

    // Update normalized text area with the full format
    updateNormalizedFormat(data);

    // Find min and max values to scale the drawing appropriately
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    // Process points
    if (data.points) {
      Object.values(data.points).forEach((point) => {
        minX = Math.min(minX, point[0]);
        maxX = Math.max(maxX, point[0]);
        minY = Math.min(minY, point[1]);
        maxY = Math.max(maxY, point[1]);
      });
    }

    // Process curves
    if (data.curves) {
      Object.values(data.curves).forEach((curve) => {
        // Object notation for curves - handle point IDs and coordinate arrays
        const startPoint = resolvePoint(curve.start);
        const endPoint = resolvePoint(curve.end);

        if (startPoint && endPoint) {
          minX = Math.min(minX, startPoint[0], endPoint[0]);
          maxX = Math.max(maxX, startPoint[0], endPoint[0]);
          minY = Math.min(minY, startPoint[1], endPoint[1]);
          maxY = Math.max(maxY, startPoint[1], endPoint[1]);
        }
      });
    }

    // Calculate data ranges and center point
    dataWidth = maxX - minX;
    dataHeight = maxY - minY;
    dataCenterX = minX + dataWidth / 2;
    dataCenterY = minY + dataHeight / 2;

    // Add proportional padding (10% of the larger dimension)
    const paddingFactor = 0.3;
    const paddingAmount = Math.max(dataWidth, dataHeight) * paddingFactor;

    // Adjust ranges with padding
    minX = minX - paddingAmount;
    maxX = maxX + paddingAmount;
    minY = minY - paddingAmount;
    maxY = maxY + paddingAmount;

    // Recalculate dimensions with padding
    const adjustedDataWidth = maxX - minX;
    const adjustedDataHeight = maxY - minY;

    // Always maintain square aspect ratio for mathematical accuracy
    const useSquareAspectRatio = true;

    if (useSquareAspectRatio) {
      // Make the data range square (equal in both dimensions)
      const maxDimension = Math.max(adjustedDataWidth, adjustedDataHeight);
      // Expand the smaller dimension
      if (adjustedDataWidth < maxDimension) {
        const diff = maxDimension - adjustedDataWidth;
        minX -= diff / 2;
        maxX += diff / 2;
      }
      if (adjustedDataHeight < maxDimension) {
        const diff = maxDimension - adjustedDataHeight;
        minY -= diff / 2;
        maxY += diff / 2;
      }
    }

    // Final dimensions for scaling calculation
    finalDataWidth = maxX - minX;
    finalDataHeight = maxY - minY;

    // Margins (fixed padding in pixels)
    canvasWidth = canvas.width / window.devicePixelRatio;
    canvasHeight = canvas.height / window.devicePixelRatio;
    availableWidth = canvasWidth - margin * 2;
    availableHeight = canvasHeight - margin * 2;

    // Determine scale factor to maintain aspect ratio
    dataScale =
      zoomLevel *
      Math.min(
        availableWidth / finalDataWidth,
        availableHeight / finalDataHeight
      );

    // Calculate the center of the canvas
    canvasCenterX = canvasWidth / 2;
    canvasCenterY = canvasHeight / 2;

    // Draw subtle grid (optional)
    ctx.strokeStyle = getComputedStyle(
      document.documentElement
    ).getPropertyValue('--d-border');
    ctx.lineWidth = 0.5;

    // Draw all points
    ctx.fillStyle = getComputedStyle(
      document.documentElement
    ).getPropertyValue('--point-color');
    const existingLabels: LabelRect[] = [];
    if (data.points) {
      for (const [id, point] of Object.entries(data.points)) {
        const x = transformDataX(point[0]).toNumber();
        const y = transformDataY(point[1]).toNumber();

        drawPoint(ctx, x, y);

        // Calculate text dimensions
        ctx.fillStyle = getComputedStyle(
          document.documentElement
        ).getPropertyValue('--text-color');
        ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';

        // Draw ID label above the point
        const idLabelText = `${id}`;
        drawLabel(ctx, idLabelText, x + 8, y - 4, x, y, existingLabels);

        // Draw coordinate label below the point
        const coordLabelText = `(${point[0].toFixed(2)}, ${point[1].toFixed(2)})`;
        drawLabel(ctx, coordLabelText, x + 8, y + 12, x, y, existingLabels);

        // Reset fill style to point color for the next point
        ctx.fillStyle = getComputedStyle(
          document.documentElement
        ).getPropertyValue('--point-color');
      }
    }

    // Draw all lines and arcs
    if (data.curves) {
      Object.entries(data.curves).forEach(([curveId, curve]) => {
        // Object notation for curves - resolve point references first
        const startPoint = resolvePoint(curve.start);
        const endPoint = resolvePoint(curve.end);

        // Skip if we couldn't resolve the points
        if (!startPoint || !endPoint) {
          console.error("Couldn't resolve points for curve:", curve);
          return;
        }

        // Now draw using the resolved coordinates
        const startX = transformDataX(startPoint[0]);
        const startY = transformDataY(startPoint[1]);
        const endX = transformDataX(endPoint[0]);
        const endY = transformDataY(endPoint[1]);

        // Set point color before drawing points
        ctx.fillStyle = getComputedStyle(
          document.documentElement
        ).getPropertyValue('--point-color');
        ctx.beginPath();
        ctx.arc(startX.toNumber(), startY.toNumber(), 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(endX.toNumber(), endY.toNumber(), 3, 0, Math.PI * 2);
        ctx.fill();

        // Draw point ID and coordinate labels for curve start and end points
        ctx.fillStyle = getComputedStyle(
          document.documentElement
        ).getPropertyValue('--text-color');
        ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';

        // Prepare display text for coordinate labels
        const startCoordText = `(${startPoint[0].toFixed(2)}, ${startPoint[1].toFixed(2)})`;
        const endCoordText = `(${endPoint[0].toFixed(2)}, ${endPoint[1].toFixed(2)})`;

        // Draw start and end point labels
        drawLabel(
          ctx,
          startCoordText,
          startX.toNumber() + 8,
          startY.toNumber() + 12,
          startX.toNumber(),
          startY.toNumber(),
          existingLabels
        );
        drawLabel(
          ctx,
          endCoordText,
          endX.toNumber() + 8,
          endY.toNumber() + 12,
          endX.toNumber(),
          endY.toNumber(),
          existingLabels
        );

        if (curve.type === 'line') {
          // Draw line
          ctx.strokeStyle = getComputedStyle(
            document.documentElement
          ).getPropertyValue('--line-color');
          ctx.lineWidth = 0.5;

          drawDecimalLine(ctx, startX, startY, endX, endY);

          // Draw curve key at midpoint
          const midX = (startX.toNumber() + endX.toNumber()) / 2;
          const midY = (startY.toNumber() + endY.toNumber()) / 2;
          ctx.fillStyle = getComputedStyle(
            document.documentElement
          ).getPropertyValue('--text-color');
          ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
          drawLabel(ctx, curveId, midX, midY, midX, midY, []);
        } else if (curve.type === 'arc') {
          // Draw arc
          ctx.strokeStyle = getComputedStyle(
            document.documentElement
          ).getPropertyValue('--arc-color');
          ctx.lineWidth = 0.5;

          // Get the arc definition with resolved points
          const arcDef = arcSegmentToArcDef({
            type: 'arc',
            start: startPoint,
            end: endPoint,
            bulge: curve.bulge,
          });

          if (
            arcDef.radius === Infinity ||
            Math.abs(arcDef.angle) < BULGE_STRAIGHT_LINE_THRESHOLD
          ) {
            // Draw as a straight line if the arc is degenerate
            drawDecimalLine(ctx, startX, startY, endX, endY);

            // Draw curve key at midpoint
            const midX = (startX.toNumber() + endX.toNumber()) / 2;
            const midY = (startY.toNumber() + endY.toNumber()) / 2;
            ctx.fillStyle = getComputedStyle(
              document.documentElement
            ).getPropertyValue('--text-color');
            ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
            drawLabel(ctx, curveId, midX, midY, midX, midY, []);
          } else {
            // For arcs with significant curvature, tessellate and draw as segments
            const points = tessellateArc2D(
              {
                type: 'arc',
                start: startPoint,
                end: endPoint,
                bulge: curve.bulge,
              },
              50
            );

            for (let i = 0; i < points.length - 1; i++) {
              drawDecimalLine(ctx, transformDataX(points[i][0]), transformDataY(points[i][1]), transformDataX(points[i + 1][0]), transformDataY(points[i + 1][1]));
            }

            // Draw curve key at midpoint of arc
            const midPointIndex = Math.floor(points.length / 2);
            const midX = transformDataX(points[midPointIndex][0]).toNumber();
            const midY = transformDataY(points[midPointIndex][1]).toNumber();
            ctx.fillStyle = getComputedStyle(
              document.documentElement
            ).getPropertyValue('--text-color');
            ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
            drawLabel(ctx, curveId, midX, midY, midX, midY, []);
          }
        }
      });
    }
  } catch (error) {
    console.error('Error parsing or drawing:', error);
    ctx.fillStyle = 'red';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('Error: ' + (error as Error).message, 20, 30);
  }

  // Draw scale indicator at bottom left
  drawScale();
}

// Function to draw scale indicator
function drawScale() {
  // Position at bottom left with some margin
  const scaleX = 20;
  let scaleY = canvasHeight - 20; // Start a bit higher

  // Calculate what 1 data unit represents in pixels
  const pixelsPerDataUnit = dataScale;

  // Define scale units in mm (since 1.0 data length = 1m)
  const scaleUnits = [
    { value: 1e-15, name: '1fm', color: '#B00020' }, // Darker Red
    { value: 1e-14, name: '10fm', color: '#C8381C' },
    { value: 1e-12, name: '1pm', color: '#E07018' },
    { value: 1e-11, name: '10pm', color: '#F8A814' },
    { value: 1e-9, name: '1nm', color: '#D4AA00' }, // Darker Yellow
    { value: 1e-8, name: '10nm', color: '#8F9C00' },
    { value: 1e-6, name: '1μm', color: '#4A8F00' },
    { value: 1e-5, name: '10μm', color: '#058200' },
    { value: 0.0001, name: '0.1mm', color: '#007500' }, // Darker Green
    { value: 0.001, name: '1mm', color: '#006020' },
    { value: 0.01, name: '1cm', color: '#004B40' },
    { value: 0.1, name: '10cm', color: '#003660' },
    { value: 1, name: '1m', color: '#002180' }, // Darker Blue
    { value: 10, name: '10m', color: '#2850E0' },
    { value: 100, name: '100m', color: '#5028C8' },
    { value: 1000, name: '1km', color: '#7800B0' },
    { value: 10000, name: '10km', color: '#A00098' },
  ];

  // Find the most appropriate scale to show by finding the one closest to 100px
  let bestScaleIndex = 0;
  let minDiff = Infinity;
  const targetPixels = 100;

  for (let i = 0; i < scaleUnits.length; i++) {
    const scale = scaleUnits[i];
    const scalePixels = scale.value * pixelsPerDataUnit;
    const diff = Math.abs(scalePixels - targetPixels);
    if (diff < minDiff) {
      minDiff = diff;
      bestScaleIndex = i;
    }
  }

  const scalesToShow: typeof scaleUnits = [];
  if (bestScaleIndex > 0) {
    scalesToShow.push(scaleUnits[bestScaleIndex - 1]);
  }
  scalesToShow.push(scaleUnits[bestScaleIndex]);
  if (bestScaleIndex < scaleUnits.length - 1) {
    scalesToShow.push(scaleUnits[bestScaleIndex + 1]);
  }

  for (const scale of scalesToShow) {
    const scaleLength = scale.value * pixelsPerDataUnit;
    const cappedLength = Math.min(scaleLength, canvasWidth - scaleX * 2);

    // Don't draw if it's too small to see
    if (cappedLength < 2) continue;

    // Draw scale bar
    ctx.strokeStyle = scale.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY);
    ctx.lineTo(scaleX + cappedLength, scaleY);
    ctx.stroke();

    // Draw tick marks at ends
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY - 4);
    ctx.lineTo(scaleX, scaleY + 4);
    if (scaleLength < canvasWidth - scaleX * 2) {
      ctx.moveTo(scaleX + cappedLength, scaleY - 4);
      ctx.lineTo(scaleX + cappedLength, scaleY + 4);
    }
    ctx.stroke();

    // Draw label
    ctx.fillStyle = scale.color;
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(scale.name, scaleX + cappedLength / 2, scaleY - 8);

    scaleY -= 25; // Move up for the next scale bar
  }

  // Reset text alignment
  ctx.textAlign = 'left';
}

// Function to check if two rectangles overlap
function doRectanglesOverlap(rect1: LabelRect, rect2: LabelRect): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

// Function to find a non-overlapping position for a label
function findNonOverlappingPosition(
  labelRect: LabelRect,
  existingLabels: LabelRect[],
  labelText: string
): LabelRect | null {
  // Check if this label text already exists
  for (let existing of existingLabels) {
    if (existing.text === labelText) {
      // Return null to indicate this label should be skipped
      return null;
    }
  }

  const offsets = [
    { x: 0, y: 0 },
    { x: 16, y: -16 },
    { x: -16, y: -16 },
    { x: 16, y: 16 },
    { x: -16, y: 16 },
    { x: 20, y: 0 },
    { x: -20, y: 0 },
    { x: 0, y: -20 },
    { x: 0, y: 20 },
  ];

  // Try more positions for better label placement
  for (let offset of offsets) {
    const newRect = {
      x: labelRect.x + offset.x,
      y: labelRect.y + offset.y,
      width: labelRect.width,
      height: labelRect.height,
      text: labelText, // Store the text with the rectangle
    };

    let overlap = false;
    for (let existingLabel of existingLabels) {
      if (doRectanglesOverlap(newRect, existingLabel)) {
        overlap = true;
        break;
      }
    }

    if (!overlap) {
      return newRect;
    }
  }

  // If all positions overlap, return the original (with text added)
  return { ...labelRect, text: labelText };
}

// Modify updateNormalizedFormat function to handle filtering
function updateNormalizedFormat(data: Graph) {
  const normalizedTextarea = document.getElementById(
    'normalized-text'
  )! as HTMLTextAreaElement;

  // Create filtered data structure for output
  const filteredData: Graph = {
    points: {},
    curves: {},
  };

  // If we have a filter, apply it
  if (filteredVertexIds.size > 0) {
    // First pass: collect all curves that connect to filtered vertices
    const relevantCurveIds = new Set<number>();
    Object.entries(data.curves || {}).forEach(([curveId, curve]) => {
      const startId = typeof curve.start === 'number' ? curve.start : null;
      const endId = typeof curve.end === 'number' ? curve.end : null;
      if (startId == null || endId == null) {
        return;
      }
      if (
        filteredVertexIds.has(asNumber(startId)) ||
        filteredVertexIds.has(asNumber(endId))
      ) {
        relevantCurveIds.add(asNumber(curveId));
      }
    });

    // Second pass: collect all vertices connected to relevant curves
    const relevantVertexIds = new Set(filteredVertexIds);
    Object.entries(data.curves || {}).forEach(([curveId, curve]) => {
      if (relevantCurveIds.has(asNumber(curveId))) {
        if (typeof curve.start === 'number')
          relevantVertexIds.add(curve.start);
        if (typeof curve.end === 'number') relevantVertexIds.add(curve.end);
      }
    });

    // Build filtered data
    relevantVertexIds.forEach((id) => {
      if (data.points[id]) {
        filteredData.points[id] = data.points[id];
      }
    });

    relevantCurveIds.forEach((id) => {
      filteredData.curves[id] = data.curves[id];
    });
  } else {
    // No filter, use all data
    filteredData.points = data.points;
    filteredData.curves = data.curves;
  }

  // Format using the same style as json-to-js.html
  normalizedTextarea.value =
    outputFormat === 'js'
      ? formatJsObject(filteredData)
      : formatRustObject(filteredData);
}

function isSimpleArray(arr: any[]): boolean {
  if (arr.length > 2) return false; // Lower threshold to force more multi-line arrays

  for (const item of arr) {
    if (typeof item === 'object' && item !== null) {
      return false; // Any nested objects/arrays will force multi-line format
    }
  }
  return true;
}

function isSimpleObject(obj: any): boolean {
  const keys = Object.keys(obj);
  // Increased the threshold to allow more objects to be displayed on single line
  // Previously was checking for keys.length > 2
  if (keys.length > 4) return false;

  // For curve objects specifically, always use single-line format
  if (
    keys.includes('type') &&
    (keys.includes('start') || keys.includes('end'))
  ) {
    return true;
  }

  // Original check for nested objects
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'object' && value !== null) {
      return false; // Any nested objects/arrays will force multi-line format
    }
  }
  return true;
}

function shouldRemoveQuotes(key: string): boolean {
  // Check for numeric keys (can be unquoted in JS)
  if (/^\d+$/.test(key)) {
    return true;
  }

  // Check if the key is a valid JS identifier
  // (starts with letter/underscore/$ and contains only letters/numbers/underscore/$)
  if (
    /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) &&
    !key.includes('-') &&
    !key.includes(' ')
  ) {
    return true;
  }

  return false;
}

function formatRustObject(obj: Graph): string {
  let rustCode = 'let mut network = PlanarNetwork::empty();\n\n';

  // Helper function to format numbers as float literals
  function formatFloat(num: number): string {
    // Convert to number and ensure it's a float
    const n = typeof num === 'number' ? num : parseFloat(num);
    // If it's an integer, add .0 suffix
    return Number.isInteger(n) ? `${n}.0` : n.toString();
  }

  // First, add all points
  const pointMap = new Map<string, number>();
  Object.entries(obj.points || {}).forEach(([id, point]) => {
    rustCode += `let p${id} = network.set_point(VertexId(${id}), vec2d![${formatFloat(point[0])}, ${formatFloat(point[1])}]);\n`;
    pointMap.set(JSON.stringify(point), asNumber(id));
  });

  rustCode += '\n';

  // Then add all curves
  Object.entries(obj.curves || {}).forEach(([curveId, curve]) => {
    const startId = curve.start;
    const endId = curve.end;

    if (curve.type === 'line') {
      rustCode += `network.set_line(CurveId(${curveId}), p${startId}, p${endId});\n`;
    } else if (curve.type === 'arc') {
      rustCode += `network.set_arc(CurveId(${curveId}), p${startId}, p${endId}, ${formatFloat(curve.bulge)});\n`;
    }
  });

  return rustCode;
}

function formatJsObject(obj: any, indent = 0): string {
  if (obj === null) return 'null';

  const indentStr = ' '.repeat(indent);
  const innerIndentStr = ' '.repeat(indent + 2);

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';

    if (isSimpleArray(obj)) {
      // Format simple array on one line
      const items = obj.map((item) => formatJsObject(item, 0)).join(', ');
      return `[ ${items} ]`;
    } else {
      // Format complex array on multiple lines
      const items = obj
        .map((item) => `${innerIndentStr}${formatJsObject(item, indent + 2)}`)
        .join(',\n');
      return `[\n${items}\n${indentStr}]`;
    }
  } else if (typeof obj === 'object') {
    const keys = Object.keys(obj);

    if (keys.length === 0) return '{}';

    if (isSimpleObject(obj)) {
      // Format simple object on one line
      const properties = keys
        .map((key) => {
          const value = formatJsObject(obj[key], 0);
          return shouldRemoveQuotes(key)
            ? `${key}: ${value}`
            : `"${key}": ${value}`;
        })
        .join(', ');
      return `{ ${properties} }`;
    } else {
      // Format complex object on multiple lines
      const properties = keys
        .map((key) => {
          const value = formatJsObject(obj[key], indent + 2);
          return `${innerIndentStr}${shouldRemoveQuotes(key) ? key : `"${key}"`}: ${value}`;
        })
        .join(',\n');
      return `{\n${properties}\n${indentStr}}`;
    }
  } else if (typeof obj === 'string') {
    return `"${obj}"`;
  } else {
    return String(obj);
  }
}
/**
 * Helper function for drawing labels with non-overlapping positioning
 */
function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  pointX: number,
  pointY: number,
  existingLabels: LabelRect[]
): boolean {
  // Calculate text dimensions
  const labelMetrics = ctx.measureText(text);

  // Initial label position
  let labelRect: LabelRect = {
    x: x,
    y: y,
    width: labelMetrics.width,
    height: 12,
    text: text,
  };

  // Find non-overlapping position
  const adjustedLabelRect = findNonOverlappingPosition(
    labelRect,
    existingLabels,
    text
  );

  // If a position was found (label is not a duplicate)
  if (adjustedLabelRect) {
    // Draw a line if the label was moved
    if (
      adjustedLabelRect.x !== labelRect.x ||
      adjustedLabelRect.y !== labelRect.y
    ) {
      ctx.strokeStyle = getComputedStyle(
        document.documentElement
      ).getPropertyValue('--text-color');
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(pointX, pointY);
      ctx.lineTo(adjustedLabelRect.x, adjustedLabelRect.y);
      ctx.stroke();
    }

    // Draw the label text
    ctx.fillText(text, adjustedLabelRect.x, adjustedLabelRect.y);

    // Add the label to existing labels
    existingLabels.push(adjustedLabelRect);

    return true; // Label was drawn
  }

  return false; // Label was skipped (duplicate)
}

function init() {
  // Create cursor overlay in the top-right of the canvas container
  const canvasContainer = canvas.parentElement as HTMLElement;
  if (canvasContainer) {
    // Ensure positioning context
    if (getComputedStyle(canvasContainer).position === 'static') {
      canvasContainer.style.position = 'relative';
    }

    cursorOverlayEl = document.createElement('div');
    cursorOverlayEl.style.position = 'absolute';
    cursorOverlayEl.style.top = '10px';
    cursorOverlayEl.style.right = '10px';
    cursorOverlayEl.style.padding = '6px 8px';
    cursorOverlayEl.style.borderRadius = '4px';
    cursorOverlayEl.style.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    cursorOverlayEl.style.background = 'var(--input-bg-color)';
    cursorOverlayEl.style.color = 'var(--text-color)';
    cursorOverlayEl.style.border = '1px solid var(--canvas-border)';
    cursorOverlayEl.style.pointerEvents = 'none';
    cursorOverlayEl.style.whiteSpace = 'nowrap';
    cursorOverlayEl.style.display = 'none';
    canvasContainer.appendChild(cursorOverlayEl);
  }

  function updateCursorOverlayFromClient(clientX: number, clientY: number) {
    if (!cursorOverlayEl) return;
    const rect = canvas.getBoundingClientRect();
    const cursorX = clientX - rect.left;
    const cursorY = clientY - rect.top;

    // Compute data coordinates under cursor using inverse transform
    const [dataX, dataY] = screenToData(cursorX, cursorY);
    cursorOverlayEl.textContent = `x: ${dataX.toFixed(6)}, y: ${dataY.toFixed(6)}`;
  }

  // Add click handler to select all text in normalized textarea
  normalizedTextarea.addEventListener('click', function () {
    this.select();
  });

  // Add keyboard shortcut for commenting/uncommenting lines
  textarea.addEventListener('keydown', function (e) {
    // Check for Cmd+/ (Mac) or Ctrl+/ (Windows/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault(); // Prevent default browser behavior

      // Get selection or current line
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;

      // Find the start and end of the lines that contain the selection
      let lineStart = text.lastIndexOf('\n', start - 1) + 1;
      if (lineStart === -1) lineStart = 0;

      let lineEnd = text.indexOf('\n', end);
      if (lineEnd === -1) lineEnd = text.length;

      // Extract the selected lines
      const selectedText = text.substring(lineStart, lineEnd);
      const lines = selectedText.split('\n');

      // Check if all lines are commented
      const allCommented = lines.every((line) => line.trim().startsWith('//'));

      // Comment or uncomment based on current state
      let newText;
      if (allCommented) {
        // Uncomment all lines
        newText = lines
          .map((line) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('//')) {
              // Remove the comment marker and one space if it exists
              const commentStart = line.indexOf('//');
              const afterComment = line.substring(commentStart + 2);
              return (
                line.substring(0, commentStart) +
                (afterComment.startsWith(' ')
                  ? afterComment.substring(1)
                  : afterComment)
              );
            }
            return line;
          })
          .join('\n');
      } else {
        // Comment all lines
        newText = lines
          .map((line) => {
            if (line.trim() === '') return line; // Don't comment empty lines
            return line.replace(/^(\s*)/, '$1// ');
          })
          .join('\n');
      }

      // Replace the text and maintain selection
      textarea.value =
        text.substring(0, lineStart) + newText + text.substring(lineEnd);
      textarea.selectionStart = lineStart;
      textarea.selectionEnd = lineStart + newText.length;

      // Trigger redraw
      triggerRedraw();
    }
  });

  // Add keyboard event listener for zoom controls
  document.addEventListener('keydown', function (e) {
    if (document.activeElement === textarea) {
      return;
    }

    let multiplier = e.shiftKey ? SHIFT_ZOOM_MULTIPLIER : ZOOM_MULTIPLIER;

    // Check for + key (plus sign)
    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      zoomLevel = Math.min(MAX_ZOOM, zoomLevel * multiplier);
      drawGraph();
    }
    // Check for - key (minus sign)
    else if (e.key === '-' || e.key === '_') {
      e.preventDefault();
      zoomLevel = Math.max(MIN_ZOOM, zoomLevel / multiplier);
      drawGraph();
    }
  });

  // Add mouse event listeners for panning
  canvas.addEventListener('mousedown', function (e) {
    isDragging = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    canvas.style.cursor = 'grabbing';
  });

  canvas.addEventListener('mousemove', function (e) {
    // Always update cursor overlay on mouse move
    if (cursorOverlayEl) {
      cursorOverlayEl.style.display = 'block';
      updateCursorOverlayFromClient(e.clientX, e.clientY);
    }
    if (isDragging) {
      const deltaX = e.clientX - lastMouseX;
      const deltaY = e.clientY - lastMouseY;

      dataOffsetX += deltaX / dataScale;
      dataOffsetY -= deltaY / dataScale;

      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      drawGraph();
      saveGraphData(); // Add this line to save view settings after panning
    }
  });

  canvas.addEventListener('mouseup', function () {
    isDragging = false;
    canvas.style.cursor = 'default';
  });

  canvas.addEventListener('mouseleave', function () {
    isDragging = false;
    canvas.style.cursor = 'default';
    if (cursorOverlayEl) cursorOverlayEl.style.display = 'none';
  });

  // Add hover effect for canvas
  canvas.addEventListener('mouseenter', function () {
    canvas.style.cursor = 'grab';
    if (cursorOverlayEl) cursorOverlayEl.style.display = 'block';
  });

  // Initialize theme based on system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(prefersDark ? 'dark' : 'light');

  // Listen for system theme changes
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      setTheme(e.matches ? 'dark' : 'light');
      drawGraph();
    });

  // Resize canvas when window resizes
  window.addEventListener('resize', resizeCanvas);

  // Handle visibility changes when switching tabs
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      // Small delay to ensure the container has proper dimensions
      setTimeout(resizeCanvas, 1);
    }
  });

  // Handle focus events when switching back to the window
  window.addEventListener('focus', function () {
    setTimeout(resizeCanvas, 1);
  });

  // Initial canvas sizing
  resizeCanvas();

  // Add auto-redraw when input changes
  textarea.addEventListener('input', function () {
    triggerRedraw();
  });

  // Update URL with file_id
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set('file_id', fileId);
  window.history.replaceState({}, '', newUrl);

  // Initialize with graph data based on file_id
  loadGraphData();

  // Resize canvas when window resizes
  window.addEventListener('resize', function () {
    const container = canvas.parentElement!;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    drawGraph(); // Redraw when resized
  });

  // Auto-redraw when input changes
  textarea.addEventListener('input', function () {
    triggerRedraw();
  });

  // Add filter input handler
  document
    .getElementById('format-input')!
    .addEventListener('input', function (e) {
      // Parse input as either comma or space separated numbers
      const input = (e.target as HTMLInputElement).value.trim();
      if (!input) {
        filteredVertexIds.clear();
      } else {
        filteredVertexIds = new Set(
          input
            .split(/[\s,]+/)
            .map((id) => parseInt(id.trim()))
            .filter((id) => !isNaN(id))
        );
      }
      drawGraph(); // This will update both the graph and normalized text
    });

  // Add mouse wheel event listener for zooming
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault(); // Prevent page scrolling

    const multiplier = e.shiftKey ? SHIFT_ZOOM_WHEEL_MULTIPLIER : ZOOM_MULTIPLIER;
    if (e.deltaY < 0 || (e.shiftKey && e.deltaX < 0)) {
      zoomLevel = Math.min(MAX_ZOOM, zoomLevel * multiplier);
    } else if (e.deltaY > 0 || (e.shiftKey && e.deltaX > 0)) {
      zoomLevel = Math.max(MIN_ZOOM, zoomLevel / multiplier);
    }

    // Get cursor position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    // Calculate data coordinates under cursor before zoom
    const [dataX, dataY] = screenToData(cursorX, cursorY);

    // Calculate new scale
    const newDataScale =
      zoomLevel *
      Math.min(
        availableWidth / finalDataWidth,
        availableHeight / finalDataHeight
      );

    // Calculate new offsets to keep cursor over the same data point
    dataOffsetX = (cursorX - canvasCenterX) / newDataScale - (dataX - dataCenterX);
    dataOffsetY = (canvasCenterY - cursorY) / newDataScale - (dataY - dataCenterY);

    // Update scale
    dataScale = newDataScale;

    drawGraph();
    saveGraphData(); // Add this line to save view settings after zooming

    // Update overlay after zoom to reflect new data coordinates under cursor
    if (cursorOverlayEl) {
      cursorOverlayEl.style.display = 'block';
      updateCursorOverlayFromClient(e.clientX, e.clientY);
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  init();
});

