"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/fft.js/lib/fft.js
  var require_fft = __commonJS({
    "node_modules/fft.js/lib/fft.js"(exports, module) {
      "use strict";
      function FFT2(size) {
        this.size = size | 0;
        if (this.size <= 1 || (this.size & this.size - 1) !== 0)
          throw new Error("FFT size must be a power of two and bigger than 1");
        this._csize = size << 1;
        var table = new Array(this.size * 2);
        for (var i = 0; i < table.length; i += 2) {
          const angle = Math.PI * i / this.size;
          table[i] = Math.cos(angle);
          table[i + 1] = -Math.sin(angle);
        }
        this.table = table;
        var power = 0;
        for (var t = 1; this.size > t; t <<= 1)
          power++;
        this._width = power % 2 === 0 ? power - 1 : power;
        this._bitrev = new Array(1 << this._width);
        for (var j = 0; j < this._bitrev.length; j++) {
          this._bitrev[j] = 0;
          for (var shift = 0; shift < this._width; shift += 2) {
            var revShift = this._width - shift - 2;
            this._bitrev[j] |= (j >>> shift & 3) << revShift;
          }
        }
        this._out = null;
        this._data = null;
        this._inv = 0;
      }
      module.exports = FFT2;
      FFT2.prototype.fromComplexArray = function fromComplexArray(complex, storage) {
        var res = storage || new Array(complex.length >>> 1);
        for (var i = 0; i < complex.length; i += 2)
          res[i >>> 1] = complex[i];
        return res;
      };
      FFT2.prototype.createComplexArray = function createComplexArray() {
        const res = new Array(this._csize);
        for (var i = 0; i < res.length; i++)
          res[i] = 0;
        return res;
      };
      FFT2.prototype.toComplexArray = function toComplexArray(input, storage) {
        var res = storage || this.createComplexArray();
        for (var i = 0; i < res.length; i += 2) {
          res[i] = input[i >>> 1];
          res[i + 1] = 0;
        }
        return res;
      };
      FFT2.prototype.completeSpectrum = function completeSpectrum(spectrum) {
        var size = this._csize;
        var half = size >>> 1;
        for (var i = 2; i < half; i += 2) {
          spectrum[size - i] = spectrum[i];
          spectrum[size - i + 1] = -spectrum[i + 1];
        }
      };
      FFT2.prototype.transform = function transform(out, data) {
        if (out === data)
          throw new Error("Input and output buffers must be different");
        this._out = out;
        this._data = data;
        this._inv = 0;
        this._transform4();
        this._out = null;
        this._data = null;
      };
      FFT2.prototype.realTransform = function realTransform(out, data) {
        if (out === data)
          throw new Error("Input and output buffers must be different");
        this._out = out;
        this._data = data;
        this._inv = 0;
        this._realTransform4();
        this._out = null;
        this._data = null;
      };
      FFT2.prototype.inverseTransform = function inverseTransform(out, data) {
        if (out === data)
          throw new Error("Input and output buffers must be different");
        this._out = out;
        this._data = data;
        this._inv = 1;
        this._transform4();
        for (var i = 0; i < out.length; i++)
          out[i] /= this.size;
        this._out = null;
        this._data = null;
      };
      FFT2.prototype._transform4 = function _transform4() {
        var out = this._out;
        var size = this._csize;
        var width = this._width;
        var step = 1 << width;
        var len = size / step << 1;
        var outOff;
        var t;
        var bitrev = this._bitrev;
        if (len === 4) {
          for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
            const off = bitrev[t];
            this._singleTransform2(outOff, off, step);
          }
        } else {
          for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
            const off = bitrev[t];
            this._singleTransform4(outOff, off, step);
          }
        }
        var inv = this._inv ? -1 : 1;
        var table = this.table;
        for (step >>= 2; step >= 2; step >>= 2) {
          len = size / step << 1;
          var quarterLen = len >>> 2;
          for (outOff = 0; outOff < size; outOff += len) {
            var limit = outOff + quarterLen;
            for (var i = outOff, k = 0; i < limit; i += 2, k += step) {
              const A = i;
              const B = A + quarterLen;
              const C = B + quarterLen;
              const D = C + quarterLen;
              const Ar = out[A];
              const Ai = out[A + 1];
              const Br = out[B];
              const Bi = out[B + 1];
              const Cr = out[C];
              const Ci = out[C + 1];
              const Dr = out[D];
              const Di = out[D + 1];
              const MAr = Ar;
              const MAi = Ai;
              const tableBr = table[k];
              const tableBi = inv * table[k + 1];
              const MBr = Br * tableBr - Bi * tableBi;
              const MBi = Br * tableBi + Bi * tableBr;
              const tableCr = table[2 * k];
              const tableCi = inv * table[2 * k + 1];
              const MCr = Cr * tableCr - Ci * tableCi;
              const MCi = Cr * tableCi + Ci * tableCr;
              const tableDr = table[3 * k];
              const tableDi = inv * table[3 * k + 1];
              const MDr = Dr * tableDr - Di * tableDi;
              const MDi = Dr * tableDi + Di * tableDr;
              const T0r = MAr + MCr;
              const T0i = MAi + MCi;
              const T1r = MAr - MCr;
              const T1i = MAi - MCi;
              const T2r = MBr + MDr;
              const T2i = MBi + MDi;
              const T3r = inv * (MBr - MDr);
              const T3i = inv * (MBi - MDi);
              const FAr = T0r + T2r;
              const FAi = T0i + T2i;
              const FCr = T0r - T2r;
              const FCi = T0i - T2i;
              const FBr = T1r + T3i;
              const FBi = T1i - T3r;
              const FDr = T1r - T3i;
              const FDi = T1i + T3r;
              out[A] = FAr;
              out[A + 1] = FAi;
              out[B] = FBr;
              out[B + 1] = FBi;
              out[C] = FCr;
              out[C + 1] = FCi;
              out[D] = FDr;
              out[D + 1] = FDi;
            }
          }
        }
      };
      FFT2.prototype._singleTransform2 = function _singleTransform2(outOff, off, step) {
        const out = this._out;
        const data = this._data;
        const evenR = data[off];
        const evenI = data[off + 1];
        const oddR = data[off + step];
        const oddI = data[off + step + 1];
        const leftR = evenR + oddR;
        const leftI = evenI + oddI;
        const rightR = evenR - oddR;
        const rightI = evenI - oddI;
        out[outOff] = leftR;
        out[outOff + 1] = leftI;
        out[outOff + 2] = rightR;
        out[outOff + 3] = rightI;
      };
      FFT2.prototype._singleTransform4 = function _singleTransform4(outOff, off, step) {
        const out = this._out;
        const data = this._data;
        const inv = this._inv ? -1 : 1;
        const step2 = step * 2;
        const step3 = step * 3;
        const Ar = data[off];
        const Ai = data[off + 1];
        const Br = data[off + step];
        const Bi = data[off + step + 1];
        const Cr = data[off + step2];
        const Ci = data[off + step2 + 1];
        const Dr = data[off + step3];
        const Di = data[off + step3 + 1];
        const T0r = Ar + Cr;
        const T0i = Ai + Ci;
        const T1r = Ar - Cr;
        const T1i = Ai - Ci;
        const T2r = Br + Dr;
        const T2i = Bi + Di;
        const T3r = inv * (Br - Dr);
        const T3i = inv * (Bi - Di);
        const FAr = T0r + T2r;
        const FAi = T0i + T2i;
        const FBr = T1r + T3i;
        const FBi = T1i - T3r;
        const FCr = T0r - T2r;
        const FCi = T0i - T2i;
        const FDr = T1r - T3i;
        const FDi = T1i + T3r;
        out[outOff] = FAr;
        out[outOff + 1] = FAi;
        out[outOff + 2] = FBr;
        out[outOff + 3] = FBi;
        out[outOff + 4] = FCr;
        out[outOff + 5] = FCi;
        out[outOff + 6] = FDr;
        out[outOff + 7] = FDi;
      };
      FFT2.prototype._realTransform4 = function _realTransform4() {
        var out = this._out;
        var size = this._csize;
        var width = this._width;
        var step = 1 << width;
        var len = size / step << 1;
        var outOff;
        var t;
        var bitrev = this._bitrev;
        if (len === 4) {
          for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
            const off = bitrev[t];
            this._singleRealTransform2(outOff, off >>> 1, step >>> 1);
          }
        } else {
          for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
            const off = bitrev[t];
            this._singleRealTransform4(outOff, off >>> 1, step >>> 1);
          }
        }
        var inv = this._inv ? -1 : 1;
        var table = this.table;
        for (step >>= 2; step >= 2; step >>= 2) {
          len = size / step << 1;
          var halfLen = len >>> 1;
          var quarterLen = halfLen >>> 1;
          var hquarterLen = quarterLen >>> 1;
          for (outOff = 0; outOff < size; outOff += len) {
            for (var i = 0, k = 0; i <= hquarterLen; i += 2, k += step) {
              var A = outOff + i;
              var B = A + quarterLen;
              var C = B + quarterLen;
              var D = C + quarterLen;
              var Ar = out[A];
              var Ai = out[A + 1];
              var Br = out[B];
              var Bi = out[B + 1];
              var Cr = out[C];
              var Ci = out[C + 1];
              var Dr = out[D];
              var Di = out[D + 1];
              var MAr = Ar;
              var MAi = Ai;
              var tableBr = table[k];
              var tableBi = inv * table[k + 1];
              var MBr = Br * tableBr - Bi * tableBi;
              var MBi = Br * tableBi + Bi * tableBr;
              var tableCr = table[2 * k];
              var tableCi = inv * table[2 * k + 1];
              var MCr = Cr * tableCr - Ci * tableCi;
              var MCi = Cr * tableCi + Ci * tableCr;
              var tableDr = table[3 * k];
              var tableDi = inv * table[3 * k + 1];
              var MDr = Dr * tableDr - Di * tableDi;
              var MDi = Dr * tableDi + Di * tableDr;
              var T0r = MAr + MCr;
              var T0i = MAi + MCi;
              var T1r = MAr - MCr;
              var T1i = MAi - MCi;
              var T2r = MBr + MDr;
              var T2i = MBi + MDi;
              var T3r = inv * (MBr - MDr);
              var T3i = inv * (MBi - MDi);
              var FAr = T0r + T2r;
              var FAi = T0i + T2i;
              var FBr = T1r + T3i;
              var FBi = T1i - T3r;
              out[A] = FAr;
              out[A + 1] = FAi;
              out[B] = FBr;
              out[B + 1] = FBi;
              if (i === 0) {
                var FCr = T0r - T2r;
                var FCi = T0i - T2i;
                out[C] = FCr;
                out[C + 1] = FCi;
                continue;
              }
              if (i === hquarterLen)
                continue;
              var ST0r = T1r;
              var ST0i = -T1i;
              var ST1r = T0r;
              var ST1i = -T0i;
              var ST2r = -inv * T3i;
              var ST2i = -inv * T3r;
              var ST3r = -inv * T2i;
              var ST3i = -inv * T2r;
              var SFAr = ST0r + ST2r;
              var SFAi = ST0i + ST2i;
              var SFBr = ST1r + ST3i;
              var SFBi = ST1i - ST3r;
              var SA = outOff + quarterLen - i;
              var SB = outOff + halfLen - i;
              out[SA] = SFAr;
              out[SA + 1] = SFAi;
              out[SB] = SFBr;
              out[SB + 1] = SFBi;
            }
          }
        }
      };
      FFT2.prototype._singleRealTransform2 = function _singleRealTransform2(outOff, off, step) {
        const out = this._out;
        const data = this._data;
        const evenR = data[off];
        const oddR = data[off + step];
        const leftR = evenR + oddR;
        const rightR = evenR - oddR;
        out[outOff] = leftR;
        out[outOff + 1] = 0;
        out[outOff + 2] = rightR;
        out[outOff + 3] = 0;
      };
      FFT2.prototype._singleRealTransform4 = function _singleRealTransform4(outOff, off, step) {
        const out = this._out;
        const data = this._data;
        const inv = this._inv ? -1 : 1;
        const step2 = step * 2;
        const step3 = step * 3;
        const Ar = data[off];
        const Br = data[off + step];
        const Cr = data[off + step2];
        const Dr = data[off + step3];
        const T0r = Ar + Cr;
        const T1r = Ar - Cr;
        const T2r = Br + Dr;
        const T3r = inv * (Br - Dr);
        const FAr = T0r + T2r;
        const FBr = T1r;
        const FBi = -T3r;
        const FCr = T0r - T2r;
        const FDr = T1r;
        const FDi = T3r;
        out[outOff] = FAr;
        out[outOff + 1] = 0;
        out[outOff + 2] = FBr;
        out[outOff + 3] = FBi;
        out[outOff + 4] = FCr;
        out[outOff + 5] = 0;
        out[outOff + 6] = FDr;
        out[outOff + 7] = FDi;
      };
    }
  });

  // node_modules/pitchy/index.js
  var import_fft = __toESM(require_fft(), 1);
  var Autocorrelator = class _Autocorrelator {
    /** @private @readonly @type {number} */
    _inputLength;
    /** @private @type {FFT} */
    _fft;
    /** @private @type {(size: number) => T} */
    _bufferSupplier;
    /** @private @type {T} */
    _paddedInputBuffer;
    /** @private @type {T} */
    _transformBuffer;
    /** @private @type {T} */
    _inverseBuffer;
    /**
     * A helper method to create an {@link Autocorrelator} using
     * {@link Float32Array} buffers.
     *
     * @param inputLength {number} the input array length to support
     * @returns {Autocorrelator<Float32Array>}
     */
    static forFloat32Array(inputLength) {
      return new _Autocorrelator(
        inputLength,
        (length) => new Float32Array(length)
      );
    }
    /**
     * A helper method to create an {@link Autocorrelator} using
     * {@link Float64Array} buffers.
     *
     * @param inputLength {number} the input array length to support
     * @returns {Autocorrelator<Float64Array>}
     */
    static forFloat64Array(inputLength) {
      return new _Autocorrelator(
        inputLength,
        (length) => new Float64Array(length)
      );
    }
    /**
     * A helper method to create an {@link Autocorrelator} using `number[]`
     * buffers.
     *
     * @param inputLength {number} the input array length to support
     * @returns {Autocorrelator<number[]>}
     */
    static forNumberArray(inputLength) {
      return new _Autocorrelator(inputLength, (length) => Array(length));
    }
    /**
     * Constructs a new {@link Autocorrelator} able to handle input arrays of the
     * given length.
     *
     * @param inputLength {number} the input array length to support. This
     * `Autocorrelator` will only support operation on arrays of this length.
     * @param bufferSupplier {(length: number) => T} the function to use for
     * creating buffers, accepting the length of the buffer to create and
     * returning a new buffer of that length. The values of the returned buffer
     * need not be initialized in any particular way.
     */
    constructor(inputLength, bufferSupplier) {
      if (inputLength < 1) {
        throw new Error(`Input length must be at least one`);
      }
      this._inputLength = inputLength;
      this._fft = new import_fft.default(ceilPow2(2 * inputLength));
      this._bufferSupplier = bufferSupplier;
      this._paddedInputBuffer = this._bufferSupplier(this._fft.size);
      this._transformBuffer = this._bufferSupplier(2 * this._fft.size);
      this._inverseBuffer = this._bufferSupplier(2 * this._fft.size);
    }
    /**
     * Returns the supported input length.
     *
     * @returns {number} the supported input length
     */
    get inputLength() {
      return this._inputLength;
    }
    /**
     * Autocorrelates the given input data.
     *
     * @param input {ArrayLike<number>} the input data to autocorrelate
     * @param output {T} the output buffer into which to write the autocorrelated
     * data. If not provided, a new buffer will be created.
     * @returns {T} `output`
     */
    autocorrelate(input, output = this._bufferSupplier(input.length)) {
      if (input.length !== this._inputLength) {
        throw new Error(
          `Input must have length ${this._inputLength} but had length ${input.length}`
        );
      }
      for (let i = 0; i < input.length; i++) {
        this._paddedInputBuffer[i] = input[i];
      }
      for (let i = input.length; i < this._paddedInputBuffer.length; i++) {
        this._paddedInputBuffer[i] = 0;
      }
      this._fft.realTransform(this._transformBuffer, this._paddedInputBuffer);
      this._fft.completeSpectrum(this._transformBuffer);
      const tb = this._transformBuffer;
      for (let i = 0; i < tb.length; i += 2) {
        tb[i] = tb[i] * tb[i] + tb[i + 1] * tb[i + 1];
        tb[i + 1] = 0;
      }
      this._fft.inverseTransform(this._inverseBuffer, this._transformBuffer);
      for (let i = 0; i < input.length; i++) {
        output[i] = this._inverseBuffer[2 * i];
      }
      return output;
    }
  };
  function getKeyMaximumIndices(input) {
    const keyIndices = [];
    let lookingForMaximum = false;
    let max = -Infinity;
    let maxIndex = -1;
    for (let i = 1; i < input.length - 1; i++) {
      if (input[i - 1] <= 0 && input[i] > 0) {
        lookingForMaximum = true;
        maxIndex = i;
        max = input[i];
      } else if (input[i - 1] > 0 && input[i] <= 0) {
        lookingForMaximum = false;
        if (maxIndex !== -1) {
          keyIndices.push(maxIndex);
        }
      } else if (lookingForMaximum && input[i] > max) {
        max = input[i];
        maxIndex = i;
      }
    }
    return keyIndices;
  }
  function refineResultIndex(index, data) {
    const [x0, x1, x2] = [index - 1, index, index + 1];
    const [y0, y1, y2] = [data[x0], data[x1], data[x2]];
    const a = y0 / 2 - y1 + y2 / 2;
    const b = -(y0 / 2) * (x1 + x2) + y1 * (x0 + x2) - y2 / 2 * (x0 + x1);
    const c = y0 * x1 * x2 / 2 - y1 * x0 * x2 + y2 * x0 * x1 / 2;
    const xMax = -b / (2 * a);
    const yMax = a * xMax * xMax + b * xMax + c;
    return [xMax, yMax];
  }
  var PitchDetector = class _PitchDetector {
    /** @private @type {Autocorrelator<T>} */
    _autocorrelator;
    /** @private @type {T} */
    _nsdfBuffer;
    /** @private @type {number} */
    _clarityThreshold = 0.9;
    /** @private @type {number} */
    _minVolumeAbsolute = 0;
    /** @private @type {number} */
    _maxInputAmplitude = 1;
    /**
     * A helper method to create an {@link PitchDetector} using {@link Float32Array} buffers.
     *
     * @param inputLength {number} the input array length to support
     * @returns {PitchDetector<Float32Array>}
     */
    static forFloat32Array(inputLength) {
      return new _PitchDetector(inputLength, (length) => new Float32Array(length));
    }
    /**
     * A helper method to create an {@link PitchDetector} using {@link Float64Array} buffers.
     *
     * @param inputLength {number} the input array length to support
     * @returns {PitchDetector<Float64Array>}
     */
    static forFloat64Array(inputLength) {
      return new _PitchDetector(inputLength, (length) => new Float64Array(length));
    }
    /**
     * A helper method to create an {@link PitchDetector} using `number[]` buffers.
     *
     * @param inputLength {number} the input array length to support
     * @returns {PitchDetector<number[]>}
     */
    static forNumberArray(inputLength) {
      return new _PitchDetector(inputLength, (length) => Array(length));
    }
    /**
     * Constructs a new {@link PitchDetector} able to handle input arrays of the
     * given length.
     *
     * @param inputLength {number} the input array length to support. This
     * `PitchDetector` will only support operation on arrays of this length.
     * @param bufferSupplier {(inputLength: number) => T} the function to use for
     * creating buffers, accepting the length of the buffer to create and
     * returning a new buffer of that length. The values of the returned buffer
     * need not be initialized in any particular way.
     */
    constructor(inputLength, bufferSupplier) {
      this._autocorrelator = new Autocorrelator(inputLength, bufferSupplier);
      this._nsdfBuffer = bufferSupplier(inputLength);
    }
    /**
     * Returns the supported input length.
     *
     * @returns {number} the supported input length
     */
    get inputLength() {
      return this._autocorrelator.inputLength;
    }
    /**
     * Sets the clarity threshold used when identifying the correct pitch (the constant
     * `k` from the MPM paper). The value must be between 0 (exclusive) and 1
     * (inclusive), with the most suitable range being between 0.8 and 1.
     *
     * @param threshold {number} the clarity threshold
     */
    set clarityThreshold(threshold) {
      if (!Number.isFinite(threshold) || threshold <= 0 || threshold > 1) {
        throw new Error("clarityThreshold must be a number in the range (0, 1]");
      }
      this._clarityThreshold = threshold;
    }
    /**
     * Sets the minimum detectable volume, as an absolute number between 0 and
     * `maxInputAmplitude`, inclusive, to consider in a sample when detecting the
     * pitch. If a sample fails to meet this minimum volume, `findPitch` will
     * return a clarity of 0.
     *
     * Volume is calculated as the RMS (root mean square) of the input samples.
     *
     * @param volume {number} the minimum volume as an absolute amplitude value
     */
    set minVolumeAbsolute(volume) {
      if (!Number.isFinite(volume) || volume < 0 || volume > this._maxInputAmplitude) {
        throw new Error(
          `minVolumeAbsolute must be a number in the range [0, ${this._maxInputAmplitude}]`
        );
      }
      this._minVolumeAbsolute = volume;
    }
    /**
     * Sets the minimum volume using a decibel measurement. Must be less than or
     * equal to 0: 0 indicates the loudest possible sound (see
     * `maxInputAmplitude`), -10 is a sound with a tenth of the volume of the
     * loudest possible sound, etc.
     *
     * Volume is calculated as the RMS (root mean square) of the input samples.
     *
     * @param db {number} the minimum volume in decibels, with 0 being the loudest
     * sound
     */
    set minVolumeDecibels(db) {
      if (!Number.isFinite(db) || db > 0) {
        throw new Error("minVolumeDecibels must be a number <= 0");
      }
      this._minVolumeAbsolute = this._maxInputAmplitude * 10 ** (db / 10);
    }
    /**
     * Sets the maximum amplitude of an input reading. Must be greater than 0.
     *
     * @param amplitude {number} the maximum amplitude (absolute value) of an input reading
     */
    set maxInputAmplitude(amplitude) {
      if (!Number.isFinite(amplitude) || amplitude <= 0) {
        throw new Error("maxInputAmplitude must be a number > 0");
      }
      this._maxInputAmplitude = amplitude;
    }
    /**
     * Returns the pitch detected using McLeod Pitch Method (MPM) along with a
     * measure of its clarity.
     *
     * The clarity is a value between 0 and 1 (potentially inclusive) that
     * represents how "clear" the pitch was. A clarity value of 1 indicates that
     * the pitch was very distinct, while lower clarity values indicate less
     * definite pitches.
     *
     * @param input {ArrayLike<number>} the time-domain input data
     * @param sampleRate {number} the sample rate at which the input data was
     * collected
     * @returns {[number, number]} the detected pitch, in Hz, followed by the
     * clarity. If a pitch cannot be determined from the input, such as if the
     * volume is too low (see `minVolumeAbsolute` and `minVolumeDecibels`), this
     * will be `[0, 0]`.
     */
    findPitch(input, sampleRate) {
      if (this._belowMinimumVolume(input)) return [0, 0];
      this._nsdf(input);
      const keyMaximumIndices = getKeyMaximumIndices(this._nsdfBuffer);
      if (keyMaximumIndices.length === 0) {
        return [0, 0];
      }
      const nMax = Math.max(...keyMaximumIndices.map((i) => this._nsdfBuffer[i]));
      const resultIndex = keyMaximumIndices.find(
        (i) => this._nsdfBuffer[i] >= this._clarityThreshold * nMax
      );
      const [refinedResultIndex, clarity] = refineResultIndex(
        // @ts-expect-error resultIndex is guaranteed to be defined
        resultIndex,
        this._nsdfBuffer
      );
      return [sampleRate / refinedResultIndex, Math.min(clarity, 1)];
    }
    /**
     * Returns whether the input audio data is below the minimum volume allowed by
     * the pitch detector.
     *
     * @private
     * @param input {ArrayLike<number>}
     * @returns {boolean}
     */
    _belowMinimumVolume(input) {
      if (this._minVolumeAbsolute === 0) return false;
      let squareSum = 0;
      for (let i = 0; i < input.length; i++) {
        squareSum += input[i] ** 2;
      }
      return Math.sqrt(squareSum / input.length) < this._minVolumeAbsolute;
    }
    /**
     * Computes the NSDF of the input and stores it in the internal buffer. This
     * is equation (9) in the McLeod pitch method paper.
     *
     * @private
     * @param input {ArrayLike<number>}
     */
    _nsdf(input) {
      this._autocorrelator.autocorrelate(input, this._nsdfBuffer);
      let m = 2 * this._nsdfBuffer[0];
      let i;
      for (i = 0; i < this._nsdfBuffer.length && m > 0; i++) {
        this._nsdfBuffer[i] = 2 * this._nsdfBuffer[i] / m;
        m -= input[i] ** 2 + input[input.length - i - 1] ** 2;
      }
      for (; i < this._nsdfBuffer.length; i++) {
        this._nsdfBuffer[i] = 0;
      }
    }
  };
  function ceilPow2(v) {
    v--;
    v |= v >> 1;
    v |= v >> 2;
    v |= v >> 4;
    v |= v >> 8;
    v |= v >> 16;
    v++;
    return v;
  }

  // tuner.ts
  var NOTE_NAMES_SHARP = ["C", "C\u266F", "D", "D\u266F", "E", "F", "F\u266F", "G", "G\u266F", "A", "A\u266F", "B"];
  var NOTE_NAMES_FLAT = ["C", "D\u266D", "D", "E\u266D", "E", "F", "G\u266D", "G", "A\u266D", "A", "B\u266D", "B"];
  var VF_SHARP = [
    { key: "c", acc: null },
    { key: "c#", acc: "#" },
    { key: "d", acc: null },
    { key: "d#", acc: "#" },
    { key: "e", acc: null },
    { key: "f", acc: null },
    { key: "f#", acc: "#" },
    { key: "g", acc: null },
    { key: "g#", acc: "#" },
    { key: "a", acc: null },
    { key: "a#", acc: "#" },
    { key: "b", acc: null }
  ];
  var VF_FLAT = [
    { key: "c", acc: null },
    { key: "db", acc: "b" },
    { key: "d", acc: null },
    { key: "eb", acc: "b" },
    { key: "e", acc: null },
    { key: "f", acc: null },
    { key: "gb", acc: "b" },
    { key: "g", acc: null },
    { key: "ab", acc: "b" },
    { key: "a", acc: null },
    { key: "bb", acc: "b" },
    { key: "b", acc: null }
  ];
  var useFlats = false;
  var trumpetMode = false;
  var DB_MIN = -60;
  var DB_MAX = -10;
  var dbThreshold = -40;
  var audioCtx = null;
  var analyser = null;
  var detector = null;
  var started = false;
  var currentStream = null;
  var currentSource = null;
  var selectedDeviceId = "";
  var REPLAY_SECONDS = 100;
  var replayProcessor = null;
  var replayBuffer = null;
  var replayWrite = 0;
  var replayFilled = 0;
  var replaySampleRate = 44100;
  var lastConcertMidi = null;
  var lastCents = null;
  var centsHistory = [];
  var lastFreq = null;
  var noSignalFrames = 0;
  var NO_SIGNAL_THRESHOLD = 12;
  var stopwatchStartTime = null;
  var stopwatchOffsetMs = 0;
  var STOPWATCH_MAX_MS = 12 * 60 * 60 * 1e3;
  var staffRenderedKey = "dirty";
  function lerpRgb(a, b, t) {
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return `rgb(${r},${g},${bl})`;
  }
  function tuningColor(cents, alpha = 1) {
    if (cents === null || Math.abs(cents) <= 5) {
      const [r, g, b] = [50, 200, 100];
      return alpha === 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alpha})`;
    }
    const TEAL_DARK = [160, 130, 0];
    const TEAL_BRIGHT = [255, 210, 0];
    const RED_DARK = [160, 20, 20];
    const RED_BRIGHT = [255, 55, 55];
    const t = Math.min(1, (Math.abs(cents) - 5) / 25);
    const color = cents < 0 ? lerpRgb(TEAL_DARK, TEAL_BRIGHT, t) : lerpRgb(RED_DARK, RED_BRIGHT, t);
    if (alpha === 1) return color;
    return color.replace("rgb(", "rgba(").replace(")", `,${alpha})`);
  }
  function staffKey(midi, cents) {
    if (midi === null) return "null";
    const q = cents === null ? "n" : Math.round(cents / 2);
    return `${midi}:${q}`;
  }
  var canvas = document.getElementById("meter-canvas");
  var noteLetter = document.getElementById("note-letter");
  var noteAccidental = document.getElementById("note-accidental");
  var noteOctave = document.getElementById("note-octave");
  var freqDisplay = document.getElementById("freq-display");
  var centsDisplay = document.getElementById("cents-display");
  var statusHint = document.getElementById("status-hint");
  var trumpetBtn = document.getElementById("trumpet-btn");
  var accidentalsBtn = document.getElementById("accidentals-btn");
  var playbackBtn = document.getElementById("playback-btn");
  var playbackVolume = document.getElementById("playback-volume");
  var playbackVolumeFill = document.getElementById("playback-volume-fill");
  var playbackVolumeReadout = document.getElementById("playback-volume-readout");
  var tunerLeft = document.getElementById("tuner-left");
  var dbGraphCanvas = document.getElementById("db-graph-canvas");
  var deviceSelect = document.getElementById("device-select");
  function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }
  function dbToFrac(db) {
    return clamp((db - DB_MIN) / (DB_MAX - DB_MIN), 0, 1);
  }
  function fracToDb(f) {
    return DB_MIN + clamp(f, 0, 1) * (DB_MAX - DB_MIN);
  }
  function computeDb(buf) {
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    return rms > 0 ? clamp(20 * Math.log10(rms), DB_MIN, 0) : DB_MIN;
  }
  function freqToConcertMidi(freq) {
    const exact = 12 * Math.log2(freq / 440) + 69;
    const midi = Math.round(exact);
    return { midi, cents: Math.round((exact - midi) * 100) };
  }
  function midiToNoteInfo(displayMidi, cents) {
    const idx = (displayMidi % 12 + 12) % 12;
    const octave = Math.floor(displayMidi / 12) - 1;
    const name = (useFlats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP)[idx];
    return { letter: name[0], accidental: name.slice(1), octave, cents };
  }
  function currentDisplayMidi() {
    return lastConcertMidi === null ? null : lastConcertMidi + (trumpetMode ? 2 : 0);
  }
  var dbRawSamples = [];
  var dbAvgHistory = [];
  function gaussianCents(midi, rawCents) {
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
      wSum += w * s.cents;
      wTotal += w;
    }
    return wTotal > 0 ? Math.round(wSum / wTotal) : rawCents;
  }
  function updateDbDisplay(_currentDb) {
  }
  function updateDbGraph(db) {
    const now = performance.now();
    dbRawSamples.push({ t: now, db });
    const cut = now - 1e3;
    while (dbRawSamples.length > 1 && dbRawSamples[0].t < cut) dbRawSamples.shift();
    const sigma = 300;
    let wSum = 0, wTotal = 0;
    for (const s of dbRawSamples) {
      const dt = now - s.t;
      const w = Math.exp(-(dt * dt) / (2 * sigma * sigma));
      wSum += w * s.db;
      wTotal += w;
    }
    const avg = wTotal > 0 ? wSum / wTotal : db;
    dbAvgHistory.push({ t: now, db: avg });
    const cut20 = now - 2e4;
    while (dbAvgHistory.length > 1 && dbAvgHistory[0].t < cut20) dbAvgHistory.shift();
    drawDbGraph();
  }
  function drawDbGraph() {
    const w = dbGraphCanvas.clientWidth;
    const h = dbGraphCanvas.clientHeight;
    if (w === 0 || h === 0) return;
    dbGraphCanvas.width = w;
    dbGraphCanvas.height = h;
    const ctx = dbGraphCanvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    const graphH = h / 3;
    const now = performance.now();
    const isDark = document.documentElement.getAttribute("data-theme") !== "light";
    const xOf = (t) => (t - (now - 1e4)) / 1e4 * w;
    const yOf = (v) => h - dbToFrac(v) * graphH;
    if (dbAvgHistory.length >= 2) {
      const fillColor = isDark ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.025)";
      const strokeColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.09)";
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
      const halfWin = 20;
      ctx.font = '10px "Reddit Mono", monospace';
      ctx.textAlign = "center";
      ctx.fillStyle = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)";
      let lastMaxT = -Infinity;
      for (let i = halfWin; i < dbAvgHistory.length - halfWin; i++) {
        const { t, db } = dbAvgHistory[i];
        if (db <= dbThreshold) continue;
        if (now - t < 2e3) continue;
        const x = xOf(t);
        if (x < 0 || x > w || t - lastMaxT < 800) continue;
        let isPeak = true;
        for (let j = i - halfWin; j <= i + halfWin && isPeak; j++)
          if (j !== i && dbAvgHistory[j].db >= db) isPeak = false;
        if (isPeak) {
          ctx.fillText(`${Math.round(db)}`, x, yOf(db) - 5);
          lastMaxT = t;
        }
      }
    }
    const threshY = yOf(dbThreshold);
    ctx.beginPath();
    ctx.moveTo(0, threshY);
    ctx.lineTo(w, threshY);
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  function setDbThreshold(db) {
    dbThreshold = clamp(db, DB_MIN, DB_MAX);
    drawDbGraph();
    try {
      localStorage.setItem("tuner_db_threshold", String(dbThreshold));
    } catch (_) {
    }
  }
  var dbDragging = false;
  function threshFromPointer(clientY, r) {
    const graphH = r.height / 3;
    return fracToDb(clamp((r.top + r.height - clientY) / graphH, 0, 1));
  }
  tunerLeft.addEventListener("pointerdown", (e) => {
    const r = tunerLeft.getBoundingClientRect();
    if (e.clientY < r.top + r.height * 2 / 3) return;
    tunerLeft.setPointerCapture(e.pointerId);
    dbDragging = true;
    setDbThreshold(threshFromPointer(e.clientY, r));
  });
  tunerLeft.addEventListener("pointermove", (e) => {
    if (!dbDragging) return;
    setDbThreshold(threshFromPointer(e.clientY, tunerLeft.getBoundingClientRect()));
  });
  tunerLeft.addEventListener("pointerup", () => {
    dbDragging = false;
  });
  tunerLeft.addEventListener("pointercancel", () => {
    dbDragging = false;
  });
  function drawMeter(cents) {
    const w = canvas.width, h = canvas.height;
    const ctx2d = canvas.getContext("2d");
    ctx2d.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h, r = h * 0.88;
    const isDark = document.documentElement.getAttribute("data-theme") !== "light";
    const arcColor = isDark ? "rgba(128,128,128,0.2)" : "rgba(128,128,128,0.28)";
    const tickColor = isDark ? "rgba(180,180,180,0.45)" : "rgba(80,80,80,0.4)";
    const tickMajColor = isDark ? "rgba(200,200,200,0.65)" : "rgba(60,60,60,0.55)";
    const pivotColor = isDark ? "rgba(150,150,150,0.5)" : "rgba(100,100,100,0.5)";
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, r, Math.PI, 0, false);
    ctx2d.strokeStyle = arcColor;
    ctx2d.lineWidth = 3;
    ctx2d.stroke();
    const gs = 5 / 50 * (Math.PI / 2);
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, r, -Math.PI / 2 - gs, -Math.PI / 2 + gs, false);
    ctx2d.strokeStyle = "rgba(50,200,100,0.3)";
    ctx2d.lineWidth = 12;
    ctx2d.stroke();
    for (const c of [-50, -25, 0, 25, 50]) {
      const major = c % 50 === 0 || c === 0;
      const angle = -Math.PI / 2 + c / 50 * (Math.PI / 2);
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
      const angle = -Math.PI / 2 + clamped / 50 * (Math.PI / 2);
      const abs = Math.abs(cents);
      ctx2d.beginPath();
      ctx2d.moveTo(cx, cy);
      ctx2d.lineTo(cx + (r - 22) * Math.cos(angle), cy + (r - 22) * Math.sin(angle));
      ctx2d.strokeStyle = tuningColor(cents);
      ctx2d.lineWidth = 2.5;
      ctx2d.lineCap = "round";
      ctx2d.stroke();
    }
    ctx2d.beginPath();
    ctx2d.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx2d.fillStyle = pivotColor;
    ctx2d.fill();
  }
  function renderStaff(midi, cents) {
    const key = staffKey(midi, cents);
    if (key === staffRenderedKey) return;
    staffRenderedKey = key;
    if (typeof Vex === "undefined") return;
    const container = document.getElementById("staff-container");
    container.innerHTML = "";
    const W = container.clientWidth || 150;
    const H = container.clientHeight || 220;
    const { Renderer, Stave, StaveNote, Formatter, Accidental } = Vex.Flow;
    const STAFF_SCALE = 0.8;
    const VW = W / STAFF_SCALE;
    const VH = H / STAFF_SCALE;
    const STAVE_W = clamp(VW - 16, 80, VW);
    const staveX = (VW - STAVE_W) / 2;
    const staveY = (VH - 40) / 2;
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(W, H);
    const vctx = renderer.getContext();
    vctx.scale(STAFF_SCALE, STAFF_SCALE);
    const themeColor = getComputedStyle(document.documentElement).getPropertyValue("--text-color").trim() || "rgba(255,255,255,0.87)";
    vctx.setFillStyle(themeColor);
    vctx.setStrokeStyle(themeColor);
    const stave = new Stave(staveX, staveY, STAVE_W);
    stave.addClef("treble");
    stave.setContext(vctx).draw();
    if (midi === null) return;
    const noteColor = tuningColor(cents);
    vctx.setFillStyle(noteColor);
    vctx.setStrokeStyle(noteColor);
    const vfMap = useFlats ? VF_FLAT : VF_SHARP;
    const { key: noteKey, acc } = vfMap[(midi % 12 + 12) % 12];
    const keyStr = `${noteKey}/${Math.floor(midi / 12) - 1}`;
    try {
      const staveNote = new StaveNote({ keys: [keyStr], duration: "w" });
      if (acc) staveNote.addModifier(new Accidental(acc), 0);
      Formatter.FormatAndDraw(vctx, stave, [staveNote]);
    } catch (_) {
    }
  }
  function updateDisplay(info, freq) {
    if (!info) {
      noteLetter.textContent = "\u2014";
      noteAccidental.textContent = "";
      noteOctave.textContent = "";
      freqDisplay.textContent = "";
      centsDisplay.textContent = "";
      centsDisplay.style.color = "";
      return;
    }
    noteLetter.textContent = info.letter;
    noteAccidental.textContent = info.accidental;
    noteOctave.textContent = String(info.octave);
    if (freq !== void 0) freqDisplay.textContent = `${freq.toFixed(1)} Hz`;
    const sign = info.cents > 0 ? "+" : "";
    centsDisplay.textContent = `${sign}${info.cents} cents`;
    centsDisplay.style.color = tuningColor(info.cents);
  }
  function rerenderCurrent() {
    staffRenderedKey = "dirty";
    const dm = currentDisplayMidi();
    if (dm === null || lastCents === null) {
      updateDisplay(null);
      drawMeter(null);
      renderStaff(null, null);
    } else {
      updateDisplay(midiToNoteInfo(dm, lastCents), lastFreq ?? void 0);
      drawMeter(lastCents);
      renderStaff(dm, lastCents);
    }
  }
  function saveStopwatchState() {
    try {
      if (stopwatchStartTime !== null) {
        localStorage.setItem("tuner_stopwatch_startTime", String(stopwatchStartTime));
        localStorage.setItem("tuner_stopwatch_offsetMs", String(stopwatchOffsetMs));
      } else {
        localStorage.removeItem("tuner_stopwatch_startTime");
        localStorage.setItem("tuner_stopwatch_offsetMs", String(stopwatchOffsetMs));
      }
    } catch (_) {
    }
  }
  function loadStopwatchState() {
    try {
      const savedStart = localStorage.getItem("tuner_stopwatch_startTime");
      const savedOffset = localStorage.getItem("tuner_stopwatch_offsetMs");
      if (savedStart !== null && savedOffset !== null) {
        const now = Date.now();
        const restored = parseFloat(savedOffset) + (now - parseInt(savedStart));
        stopwatchStartTime = now;
        if (restored > STOPWATCH_MAX_MS) {
          stopwatchOffsetMs = 0;
          saveStopwatchState();
        } else {
          stopwatchOffsetMs = restored;
        }
      }
    } catch (_) {
    }
  }
  function formatStopwatch() {
    const ms = stopwatchOffsetMs + (stopwatchStartTime !== null ? Date.now() - stopwatchStartTime : 0);
    const totalSec = Math.floor(ms / 1e3);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  function resetStopwatch() {
    stopwatchOffsetMs = 0;
    stopwatchStartTime = started ? Date.now() : null;
    saveStopwatchState();
  }
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
    if (loud && clarity > 0.9 && freq > 60 && freq < 5e3) {
      noSignalFrames = 0;
      const { midi, cents } = freqToConcertMidi(freq);
      lastConcertMidi = midi;
      lastCents = gaussianCents(midi, cents);
      lastFreq = freq;
      const dm = midi + (trumpetMode ? 2 : 0);
      updateDisplay(midiToNoteInfo(dm, lastCents), freq);
      drawMeter(lastCents);
      renderStaff(dm, lastCents);
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
  function micConstraints(deviceId) {
    const audio = {
      echoCancellation: false,
      autoGainControl: false,
      noiseSuppression: false
    };
    if (deviceId) audio.deviceId = { exact: deviceId };
    return { audio, video: false };
  }
  async function refreshDeviceList() {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    let devices;
    try {
      devices = await navigator.mediaDevices.enumerateDevices();
    } catch (_) {
      return;
    }
    const inputs = devices.filter((d) => d.kind === "audioinput");
    if (!selectedDeviceId && currentStream) {
      const id = currentStream.getAudioTracks()[0]?.getSettings().deviceId;
      if (id) selectedDeviceId = id;
    }
    deviceSelect.innerHTML = "";
    if (inputs.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "Default microphone";
      deviceSelect.appendChild(opt);
      return;
    }
    inputs.forEach((d, i) => {
      const opt = document.createElement("option");
      opt.value = d.deviceId;
      opt.textContent = d.label || `Microphone ${i + 1}`;
      deviceSelect.appendChild(opt);
    });
    if (selectedDeviceId && inputs.some((d) => d.deviceId === selectedDeviceId)) {
      deviceSelect.value = selectedDeviceId;
    }
  }
  function attachStream(stream) {
    if (!audioCtx || !analyser) return;
    if (currentSource) {
      try {
        currentSource.disconnect();
      } catch (_) {
      }
    }
    if (currentStream) currentStream.getTracks().forEach((t) => t.stop());
    currentStream = stream;
    currentSource = audioCtx.createMediaStreamSource(stream);
    currentSource.connect(analyser);
    if (replayProcessor) currentSource.connect(replayProcessor);
  }
  async function switchDevice(deviceId) {
    selectedDeviceId = deviceId;
    try {
      localStorage.setItem("tuner_device", deviceId);
    } catch (_) {
    }
    if (!started) {
      start();
      return;
    }
    if (!audioCtx) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia(micConstraints(deviceId));
      attachStream(stream);
      if (audioCtx.state === "suspended") await audioCtx.resume();
      await refreshDeviceList();
    } catch (e) {
      statusHint.textContent = `Mic error: ${e.message}`;
    }
  }
  deviceSelect.addEventListener("change", () => switchDevice(deviceSelect.value));
  function setupReplayRecorder() {
    if (!audioCtx || replayProcessor) return;
    replaySampleRate = audioCtx.sampleRate;
    replayBuffer = new Float32Array(Math.ceil(REPLAY_SECONDS * replaySampleRate));
    replayWrite = 0;
    replayFilled = 0;
    const processor = audioCtx.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (e) => {
      const ch = e.inputBuffer.getChannelData(0);
      const buf = replayBuffer;
      const n = buf.length;
      for (let i = 0; i < ch.length; i++) {
        buf[replayWrite] = ch[i];
        replayWrite = (replayWrite + 1) % n;
      }
      replayFilled = Math.min(replayFilled + ch.length, n);
    };
    const sink = audioCtx.createGain();
    sink.gain.value = 0;
    processor.connect(sink);
    sink.connect(audioCtx.destination);
    replayProcessor = processor;
  }
  function encodeWav(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeStr = (off2, s) => {
      for (let i = 0; i < s.length; i++) view.setUint8(off2 + i, s.charCodeAt(i));
    };
    writeStr(0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeStr(36, "data");
    view.setUint32(40, samples.length * 2, true);
    let off = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = clamp(samples[i], -1, 1);
      view.setInt16(off, s < 0 ? s * 32768 : s * 32767, true);
      off += 2;
    }
    return buffer;
  }
  function downloadReplay(seconds = REPLAY_SECONDS) {
    if (!replayBuffer || replayFilled === 0) {
      statusHint.textContent = "Nothing recorded yet";
      return;
    }
    const n = replayBuffer.length;
    const want = Math.min(Math.round(seconds * replaySampleRate), replayFilled);
    const startIdx = (replayWrite - want + n) % n;
    const pcm = new Float32Array(want);
    for (let i = 0; i < want; i++) pcm[i] = replayBuffer[(startIdx + i) % n];
    const blob = new Blob([encodeWav(pcm, replaySampleRate)], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const secs = Math.round(want / replaySampleRate);
    a.href = url;
    a.download = `tuner-replay-last-${secs}s-${stamp}.wav`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  }
  window.downloadReplay = downloadReplay;
  async function start() {
    if (started) return;
    started = true;
    statusHint.textContent = "Requesting microphone\u2026";
    try {
      const stream = await navigator.mediaDevices.getUserMedia(micConstraints(selectedDeviceId));
      audioCtx = new AudioContext();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      setupReplayRecorder();
      attachStream(stream);
      detector = PitchDetector.forFloat32Array(analyser.fftSize);
      await refreshDeviceList();
      if (stopwatchStartTime === null) {
        stopwatchStartTime = Date.now();
        saveStopwatchState();
      }
      requestAnimationFrame(tick);
    } catch (e) {
      statusHint.textContent = `Microphone error: ${e.message}`;
      started = false;
    }
  }
  function syncAccidentalsBtn() {
    accidentalsBtn.textContent = useFlats ? "\u266D" : "\u266F";
  }
  function toggleAccidentals() {
    useFlats = !useFlats;
    syncAccidentalsBtn();
    try {
      localStorage.setItem("tuner_flats", useFlats ? "1" : "0");
    } catch (_) {
    }
    rerenderCurrent();
  }
  window.toggleAccidentals = toggleAccidentals;
  function toggleTrumpet() {
    trumpetMode = !trumpetMode;
    trumpetBtn.classList.toggle("active", trumpetMode);
    try {
      localStorage.setItem("tuner_trumpet", trumpetMode ? "1" : "0");
    } catch (_) {
    }
    rerenderCurrent();
  }
  window.toggleTrumpet = toggleTrumpet;
  var playbackMode = false;
  var playbackMasterGain = null;
  var playbackVoice = null;
  var PLAYBACK_MAX_GAIN = 1.5;
  var playbackVolumePct = 50;
  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  function ensurePlaybackVoice() {
    if (!audioCtx || playbackVoice) return;
    if (!playbackMasterGain) {
      playbackMasterGain = audioCtx.createGain();
      playbackMasterGain.gain.value = playbackVolumePct / 100 * PLAYBACK_MAX_GAIN;
      playbackMasterGain.connect(audioCtx.destination);
    }
    const noteGain = audioCtx.createGain();
    noteGain.gain.value = 0;
    noteGain.connect(playbackMasterGain);
    const lp = audioCtx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2200;
    lp.Q.value = 0.6;
    lp.connect(noteGain);
    const osc = audioCtx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 440;
    const osc2 = audioCtx.createOscillator();
    osc2.type = "sawtooth";
    osc2.frequency.value = 440 * 1.002;
    const osc2Gain = audioCtx.createGain();
    osc2Gain.gain.value = 0.25;
    osc2.connect(osc2Gain);
    osc2Gain.connect(lp);
    const formantHi = audioCtx.createBiquadFilter();
    formantHi.type = "bandpass";
    formantHi.frequency.value = 880;
    formantHi.Q.value = 1.8;
    osc.connect(formantHi);
    formantHi.connect(lp);
    const formantFixed = audioCtx.createBiquadFilter();
    formantFixed.type = "bandpass";
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
      try {
        v.osc.stop();
      } catch (_) {
      }
      try {
        v.osc2.stop();
      } catch (_) {
      }
      v.noteGain.disconnect();
    }, 300);
  }
  function updatePlayback(midi) {
    if (!playbackMode || !audioCtx) return;
    if (midi === null) {
      if (playbackVoice) {
        const t2 = audioCtx.currentTime;
        playbackVoice.noteGain.gain.cancelScheduledValues(t2);
        playbackVoice.noteGain.gain.setTargetAtTime(0, t2, 0.04);
      }
      return;
    }
    ensurePlaybackVoice();
    if (!playbackVoice) return;
    const freq = midiToFreq(midi);
    const t = audioCtx.currentTime;
    playbackVoice.osc.frequency.setTargetAtTime(freq, t, 2e-3);
    playbackVoice.osc2.frequency.setTargetAtTime(freq * 1.002, t, 2e-3);
    playbackVoice.formantHi.frequency.setTargetAtTime(freq * 2, t, 5e-3);
    playbackVoice.noteGain.gain.cancelScheduledValues(t);
    playbackVoice.noteGain.gain.setTargetAtTime(0.4, t, 5e-3);
  }
  function togglePlayback() {
    playbackMode = !playbackMode;
    playbackBtn.classList.toggle("active", playbackMode);
    document.body.classList.toggle("playback-on", playbackMode);
    if (!playbackMode) tearDownPlaybackVoice();
    else if (lastConcertMidi !== null) updatePlayback(lastConcertMidi);
    try {
      localStorage.setItem("tuner_playback", playbackMode ? "1" : "0");
    } catch (_) {
    }
  }
  window.togglePlayback = togglePlayback;
  function applyPlaybackVolumeUi() {
    playbackVolumeFill.style.height = `${playbackVolumePct}%`;
    playbackVolumeReadout.textContent = `${Math.round(playbackVolumePct)}%`;
    if (playbackMasterGain && audioCtx) {
      const gain = playbackVolumePct / 100 * PLAYBACK_MAX_GAIN;
      playbackMasterGain.gain.setTargetAtTime(gain, audioCtx.currentTime, 0.01);
    }
  }
  function playbackVolumeFromClientY(clientY) {
    const r = playbackVolume.getBoundingClientRect();
    if (r.height <= 0) return playbackVolumePct;
    return clamp((r.bottom - clientY) / r.height * 100, 0, 100);
  }
  var playbackVolumeDragging = false;
  playbackVolume.addEventListener("pointerdown", (e) => {
    playbackVolume.setPointerCapture(e.pointerId);
    playbackVolumeDragging = true;
    playbackVolumePct = playbackVolumeFromClientY(e.clientY);
    applyPlaybackVolumeUi();
  });
  playbackVolume.addEventListener("pointermove", (e) => {
    if (!playbackVolumeDragging) return;
    playbackVolumePct = playbackVolumeFromClientY(e.clientY);
    applyPlaybackVolumeUi();
  });
  playbackVolume.addEventListener("pointerup", () => {
    playbackVolumeDragging = false;
    try {
      localStorage.setItem("tuner_playback_volume", String(playbackVolumePct));
    } catch (_) {
    }
  });
  playbackVolume.addEventListener("pointercancel", () => {
    playbackVolumeDragging = false;
  });
  function applySystemTheme() {
    document.documentElement.setAttribute(
      "data-theme",
      window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    );
    drawMeter(lastCents);
    staffRenderedKey = "dirty";
    renderStaff(currentDisplayMidi(), lastCents);
  }
  (function init() {
    applySystemTheme();
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applySystemTheme);
    try {
      if (localStorage.getItem("tuner_trumpet") === "1") {
        trumpetMode = true;
        trumpetBtn.classList.add("active");
      }
      const savedFlats = localStorage.getItem("tuner_flats");
      if (savedFlats !== null) useFlats = savedFlats === "1";
      syncAccidentalsBtn();
      const savedVol = parseFloat(localStorage.getItem("tuner_playback_volume") ?? "");
      if (Number.isFinite(savedVol)) playbackVolumePct = clamp(savedVol, 0, 100);
      if (localStorage.getItem("tuner_playback") === "1") {
        playbackMode = true;
        playbackBtn.classList.add("active");
        document.body.classList.add("playback-on");
      }
      applyPlaybackVolumeUi();
      const saved = parseFloat(localStorage.getItem("tuner_db_threshold") ?? "");
      if (Number.isFinite(saved)) dbThreshold = clamp(saved, DB_MIN, DB_MAX);
      const savedDevice = localStorage.getItem("tuner_device");
      if (savedDevice) selectedDeviceId = savedDevice;
    } catch (_) {
    }
    refreshDeviceList();
    navigator.mediaDevices?.addEventListener?.("devicechange", () => refreshDeviceList());
    loadStopwatchState();
    drawMeter(null);
    renderStaff(null, null);
    drawDbGraph();
    document.addEventListener("click", () => start(), { once: true });
    document.addEventListener("keydown", (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "r" || e.key === "R") {
        resetStopwatch();
        return;
      }
      if (e.key >= "0" && e.key <= "9") {
        downloadReplay(e.key === "0" ? 100 : parseInt(e.key, 10) * 10);
      }
    });
    new ResizeObserver(() => {
      staffRenderedKey = "dirty";
      renderStaff(currentDisplayMidi(), lastCents);
    }).observe(document.getElementById("staff-panel"));
  })();
})();
