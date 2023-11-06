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

// ../wasm-chess/pkg/wasm_chess.js
var require_wasm_chess = __commonJS({
  "../wasm-chess/pkg/wasm_chess.js"(exports, module) {
    var wasm_bindgen2;
    (function() {
      const __exports = {};
      let script_src;
      if (typeof document !== "undefined" && document.currentScript !== null) {
        script_src = new URL(document.currentScript.src, location.href).toString();
      }
      let wasm = void 0;
      const cachedTextDecoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-8", { ignoreBOM: true, fatal: true }) : { decode: () => {
        throw Error("TextDecoder not available");
      } };
      if (typeof TextDecoder !== "undefined") {
        cachedTextDecoder.decode();
      }
      ;
      let cachedUint8Memory0 = null;
      function getUint8Memory0() {
        if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
          cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
        }
        return cachedUint8Memory0;
      }
      function getStringFromWasm0(ptr, len) {
        ptr = ptr >>> 0;
        return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
      }
      const heap = new Array(128).fill(void 0);
      heap.push(void 0, null, true, false);
      let heap_next = heap.length;
      function addHeapObject(obj) {
        if (heap_next === heap.length)
          heap.push(heap.length + 1);
        const idx = heap_next;
        heap_next = heap[idx];
        heap[idx] = obj;
        return idx;
      }
      function getObject(idx) {
        return heap[idx];
      }
      function dropObject(idx) {
        if (idx < 132)
          return;
        heap[idx] = heap_next;
        heap_next = idx;
      }
      function takeObject(idx) {
        const ret = getObject(idx);
        dropObject(idx);
        return ret;
      }
      let WASM_VECTOR_LEN = 0;
      const cachedTextEncoder = typeof TextEncoder !== "undefined" ? new TextEncoder("utf-8") : { encode: () => {
        throw Error("TextEncoder not available");
      } };
      const encodeString = typeof cachedTextEncoder.encodeInto === "function" ? function(arg, view) {
        return cachedTextEncoder.encodeInto(arg, view);
      } : function(arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
          read: arg.length,
          written: buf.length
        };
      };
      function passStringToWasm0(arg, malloc, realloc) {
        if (realloc === void 0) {
          const buf = cachedTextEncoder.encode(arg);
          const ptr2 = malloc(buf.length, 1) >>> 0;
          getUint8Memory0().subarray(ptr2, ptr2 + buf.length).set(buf);
          WASM_VECTOR_LEN = buf.length;
          return ptr2;
        }
        let len = arg.length;
        let ptr = malloc(len, 1) >>> 0;
        const mem = getUint8Memory0();
        let offset = 0;
        for (; offset < len; offset++) {
          const code = arg.charCodeAt(offset);
          if (code > 127)
            break;
          mem[ptr + offset] = code;
        }
        if (offset !== len) {
          if (offset !== 0) {
            arg = arg.slice(offset);
          }
          ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
          const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
          const ret = encodeString(arg, view);
          offset += ret.written;
        }
        WASM_VECTOR_LEN = offset;
        return ptr;
      }
      let cachedInt32Memory0 = null;
      function getInt32Memory0() {
        if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
          cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
        }
        return cachedInt32Memory0;
      }
      function handleError(f, args) {
        try {
          return f.apply(this, args);
        } catch (e) {
          wasm.__wbindgen_exn_store(addHeapObject(e));
        }
      }
      class CounterForJs {
        static __wrap(ptr) {
          ptr = ptr >>> 0;
          const obj = Object.create(CounterForJs.prototype);
          obj.__wbg_ptr = ptr;
          return obj;
        }
        __destroy_into_raw() {
          const ptr = this.__wbg_ptr;
          this.__wbg_ptr = 0;
          return ptr;
        }
        free() {
          const ptr = this.__destroy_into_raw();
          wasm.__wbg_counterforjs_free(ptr);
        }
        /**
        * @returns {CounterForJs}
        */
        static new() {
          const ret = wasm.counterforjs_new();
          return CounterForJs.__wrap(ret);
        }
        /**
        */
        think() {
          wasm.counterforjs_think(this.__wbg_ptr);
        }
        /**
        * @returns {number}
        */
        count() {
          const ret = wasm.counterforjs_count(this.__wbg_ptr);
          return ret;
        }
      }
      __exports.CounterForJs = CounterForJs;
      class PerftForJs {
        static __wrap(ptr) {
          ptr = ptr >>> 0;
          const obj = Object.create(PerftForJs.prototype);
          obj.__wbg_ptr = ptr;
          return obj;
        }
        __destroy_into_raw() {
          const ptr = this.__wbg_ptr;
          this.__wbg_ptr = 0;
          return ptr;
        }
        free() {
          const ptr = this.__destroy_into_raw();
          wasm.__wbg_perftforjs_free(ptr);
        }
        /**
        * @returns {PerftForJs}
        */
        static new() {
          const ret = wasm.perftforjs_new();
          return PerftForJs.__wrap(ret);
        }
        /**
        * @returns {number}
        */
        count() {
          const ret = wasm.perftforjs_count(this.__wbg_ptr);
          return ret;
        }
        /**
        * @param {string} fen
        * @param {number} max_depth
        */
        setup(fen, max_depth) {
          const ptr0 = passStringToWasm0(fen, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
          const len0 = WASM_VECTOR_LEN;
          wasm.perftforjs_setup(this.__wbg_ptr, ptr0, len0, max_depth);
        }
        /**
        * @returns {boolean}
        */
        think_and_return_done() {
          const ret = wasm.perftforjs_think_and_return_done(this.__wbg_ptr);
          return ret !== 0;
        }
        /**
        */
        clear() {
          wasm.perftforjs_clear(this.__wbg_ptr);
        }
      }
      __exports.PerftForJs = PerftForJs;
      class UciForJs {
        static __wrap(ptr) {
          ptr = ptr >>> 0;
          const obj = Object.create(UciForJs.prototype);
          obj.__wbg_ptr = ptr;
          return obj;
        }
        __destroy_into_raw() {
          const ptr = this.__wbg_ptr;
          this.__wbg_ptr = 0;
          return ptr;
        }
        free() {
          const ptr = this.__destroy_into_raw();
          wasm.__wbg_uciforjs_free(ptr);
        }
        /**
        * @returns {UciForJs}
        */
        static new() {
          const ret = wasm.uciforjs_new();
          return UciForJs.__wrap(ret);
        }
        /**
        * @param {string} line
        * @returns {string}
        */
        handle_line(line) {
          let deferred3_0;
          let deferred3_1;
          try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            const ptr0 = passStringToWasm0(line, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            wasm.uciforjs_handle_line(retptr, this.__wbg_ptr, ptr0, len0);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr2 = r0;
            var len2 = r1;
            if (r3) {
              ptr2 = 0;
              len2 = 0;
              throw takeObject(r2);
            }
            deferred3_0 = ptr2;
            deferred3_1 = len2;
            return getStringFromWasm0(ptr2, len2);
          } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
          }
        }
        /**
        * @returns {string}
        */
        think() {
          let deferred2_0;
          let deferred2_1;
          try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.uciforjs_think(retptr, this.__wbg_ptr);
            var r0 = getInt32Memory0()[retptr / 4 + 0];
            var r1 = getInt32Memory0()[retptr / 4 + 1];
            var r2 = getInt32Memory0()[retptr / 4 + 2];
            var r3 = getInt32Memory0()[retptr / 4 + 3];
            var ptr1 = r0;
            var len1 = r1;
            if (r3) {
              ptr1 = 0;
              len1 = 0;
              throw takeObject(r2);
            }
            deferred2_0 = ptr1;
            deferred2_1 = len1;
            return getStringFromWasm0(ptr1, len1);
          } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
          }
        }
      }
      __exports.UciForJs = UciForJs;
      async function __wbg_load(module2, imports) {
        if (typeof Response === "function" && module2 instanceof Response) {
          if (typeof WebAssembly.instantiateStreaming === "function") {
            try {
              return await WebAssembly.instantiateStreaming(module2, imports);
            } catch (e) {
              if (module2.headers.get("Content-Type") != "application/wasm") {
                console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
              } else {
                throw e;
              }
            }
          }
          const bytes = await module2.arrayBuffer();
          return await WebAssembly.instantiate(bytes, imports);
        } else {
          const instance = await WebAssembly.instantiate(module2, imports);
          if (instance instanceof WebAssembly.Instance) {
            return { instance, module: module2 };
          } else {
            return instance;
          }
        }
      }
      function __wbg_get_imports() {
        const imports = {};
        imports.wbg = {};
        imports.wbg.__wbg_logtojs_1cd69cf7d1e69686 = function(arg0, arg1) {
          globalThis.BindingsJs.log_to_js(getStringFromWasm0(arg0, arg1));
        };
        imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
          const ret = getStringFromWasm0(arg0, arg1);
          return addHeapObject(ret);
        };
        imports.wbg.__wbg_new_abda76e883ba8a5f = function() {
          const ret = new Error();
          return addHeapObject(ret);
        };
        imports.wbg.__wbg_stack_658279fe44541cf6 = function(arg0, arg1) {
          const ret = getObject(arg1).stack;
          const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
          const len1 = WASM_VECTOR_LEN;
          getInt32Memory0()[arg0 / 4 + 1] = len1;
          getInt32Memory0()[arg0 / 4 + 0] = ptr1;
        };
        imports.wbg.__wbg_error_f851667af71bcfc6 = function(arg0, arg1) {
          let deferred0_0;
          let deferred0_1;
          try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            console.error(getStringFromWasm0(arg0, arg1));
          } finally {
            wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
          }
        };
        imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
          takeObject(arg0);
        };
        imports.wbg.__wbg_crypto_c48a774b022d20ac = function(arg0) {
          const ret = getObject(arg0).crypto;
          return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_is_object = function(arg0) {
          const val = getObject(arg0);
          const ret = typeof val === "object" && val !== null;
          return ret;
        };
        imports.wbg.__wbg_process_298734cf255a885d = function(arg0) {
          const ret = getObject(arg0).process;
          return addHeapObject(ret);
        };
        imports.wbg.__wbg_versions_e2e78e134e3e5d01 = function(arg0) {
          const ret = getObject(arg0).versions;
          return addHeapObject(ret);
        };
        imports.wbg.__wbg_node_1cd7a5d853dbea79 = function(arg0) {
          const ret = getObject(arg0).node;
          return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_is_string = function(arg0) {
          const ret = typeof getObject(arg0) === "string";
          return ret;
        };
        imports.wbg.__wbg_msCrypto_bcb970640f50a1e8 = function(arg0) {
          const ret = getObject(arg0).msCrypto;
          return addHeapObject(ret);
        };
        imports.wbg.__wbg_require_8f08ceecec0f4fee = function() {
          return handleError(function() {
            const ret = module.require;
            return addHeapObject(ret);
          }, arguments);
        };
        imports.wbg.__wbindgen_is_function = function(arg0) {
          const ret = typeof getObject(arg0) === "function";
          return ret;
        };
        imports.wbg.__wbg_getRandomValues_37fa2ca9e4e07fab = function() {
          return handleError(function(arg0, arg1) {
            getObject(arg0).getRandomValues(getObject(arg1));
          }, arguments);
        };
        imports.wbg.__wbg_randomFillSync_dc1e9a60c158336d = function() {
          return handleError(function(arg0, arg1) {
            getObject(arg0).randomFillSync(takeObject(arg1));
          }, arguments);
        };
        imports.wbg.__wbg_newnoargs_581967eacc0e2604 = function(arg0, arg1) {
          const ret = new Function(getStringFromWasm0(arg0, arg1));
          return addHeapObject(ret);
        };
        imports.wbg.__wbg_call_cb65541d95d71282 = function() {
          return handleError(function(arg0, arg1) {
            const ret = getObject(arg0).call(getObject(arg1));
            return addHeapObject(ret);
          }, arguments);
        };
        imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
          const ret = getObject(arg0);
          return addHeapObject(ret);
        };
        imports.wbg.__wbg_self_1ff1d729e9aae938 = function() {
          return handleError(function() {
            const ret = self.self;
            return addHeapObject(ret);
          }, arguments);
        };
        imports.wbg.__wbg_window_5f4faef6c12b79ec = function() {
          return handleError(function() {
            const ret = window.window;
            return addHeapObject(ret);
          }, arguments);
        };
        imports.wbg.__wbg_globalThis_1d39714405582d3c = function() {
          return handleError(function() {
            const ret = globalThis.globalThis;
            return addHeapObject(ret);
          }, arguments);
        };
        imports.wbg.__wbg_global_651f05c6a0944d1c = function() {
          return handleError(function() {
            const ret = global.global;
            return addHeapObject(ret);
          }, arguments);
        };
        imports.wbg.__wbindgen_is_undefined = function(arg0) {
          const ret = getObject(arg0) === void 0;
          return ret;
        };
        imports.wbg.__wbg_call_01734de55d61e11d = function() {
          return handleError(function(arg0, arg1, arg2) {
            const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
            return addHeapObject(ret);
          }, arguments);
        };
        imports.wbg.__wbg_getTime_5e2054f832d82ec9 = function(arg0) {
          const ret = getObject(arg0).getTime();
          return ret;
        };
        imports.wbg.__wbg_new0_c0be7df4b6bd481f = function() {
          const ret = /* @__PURE__ */ new Date();
          return addHeapObject(ret);
        };
        imports.wbg.__wbg_buffer_085ec1f694018c4f = function(arg0) {
          const ret = getObject(arg0).buffer;
          return addHeapObject(ret);
        };
        imports.wbg.__wbg_newwithbyteoffsetandlength_6da8e527659b86aa = function(arg0, arg1, arg2) {
          const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
          return addHeapObject(ret);
        };
        imports.wbg.__wbg_new_8125e318e6245eed = function(arg0) {
          const ret = new Uint8Array(getObject(arg0));
          return addHeapObject(ret);
        };
        imports.wbg.__wbg_set_5cf90238115182c3 = function(arg0, arg1, arg2) {
          getObject(arg0).set(getObject(arg1), arg2 >>> 0);
        };
        imports.wbg.__wbg_newwithlength_e5d69174d6984cd7 = function(arg0) {
          const ret = new Uint8Array(arg0 >>> 0);
          return addHeapObject(ret);
        };
        imports.wbg.__wbg_subarray_13db269f57aa838d = function(arg0, arg1, arg2) {
          const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
          return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_throw = function(arg0, arg1) {
          throw new Error(getStringFromWasm0(arg0, arg1));
        };
        imports.wbg.__wbindgen_memory = function() {
          const ret = wasm.memory;
          return addHeapObject(ret);
        };
        return imports;
      }
      function __wbg_init_memory(imports, maybe_memory) {
      }
      function __wbg_finalize_init(instance, module2) {
        wasm = instance.exports;
        __wbg_init.__wbindgen_wasm_module = module2;
        cachedInt32Memory0 = null;
        cachedUint8Memory0 = null;
        return wasm;
      }
      function initSync(module2) {
        if (wasm !== void 0)
          return wasm;
        const imports = __wbg_get_imports();
        __wbg_init_memory(imports);
        if (!(module2 instanceof WebAssembly.Module)) {
          module2 = new WebAssembly.Module(module2);
        }
        const instance = new WebAssembly.Instance(module2, imports);
        return __wbg_finalize_init(instance, module2);
      }
      async function __wbg_init(input) {
        if (wasm !== void 0)
          return wasm;
        if (typeof input === "undefined" && script_src !== "undefined") {
          input = script_src.replace(/\.js$/, "_bg.wasm");
        }
        const imports = __wbg_get_imports();
        if (typeof input === "string" || typeof Request === "function" && input instanceof Request || typeof URL === "function" && input instanceof URL) {
          input = fetch(input);
        }
        __wbg_init_memory(imports);
        const { instance, module: module2 } = await __wbg_load(await input, imports);
        return __wbg_finalize_init(instance, module2);
      }
      wasm_bindgen2 = Object.assign(__wbg_init, { initSync }, __exports);
    })();
  }
});

// src/wasm-bindings.ts
var import_wasm_chess = __toESM(require_wasm_chess());

// src/helpers.ts
function boardFromFen(fen) {
  if (fen == "startpos") {
    fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - - 0 1";
  }
  if (fen.startsWith("fen ")) {
    fen = fen.split("fen ")[1];
  }
  let board = [
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "]
  ];
  fen.split(" ")[0].split("/").map((row, rank) => {
    let file = 0;
    row.split("").map((piece) => {
      let pieceAsInt = parseInt(piece);
      if (isNaN(pieceAsInt)) {
        board[rank][file] = piece;
        file++;
      } else {
        file += pieceAsInt;
      }
    });
  });
  return board;
}
function boardString(board) {
  return [...board].map((row) => row.join("")).join("\n");
}
function resolveable() {
  let resolve;
  let promise = new Promise((r) => {
    resolve = r;
  });
  return [promise, resolve];
}
function indent_string(lines, indent) {
  let s = " ".repeat(indent);
  return lines.split("\n").map((line) => s + line).join("\n");
}
function prettyJson(json, indent) {
  if (!indent) {
    indent = 0;
  }
  if (Array.isArray(json)) {
    let result2 = "";
    for (let value of json) {
      result2 += "\n  " + value;
    }
    return result2;
  }
  let result = "{\n";
  for (let key in json) {
    let value = json[key];
    if (typeof value == "string") {
      if (value.indexOf("\n") != -1) {
        result += "  " + key + ": \n";
        result += indent_string(value, 4) + "\n";
      } else {
        result += "  " + key + ": " + value + "\n";
      }
    } else {
      result += "  " + key + ": " + value + "\n";
    }
  }
  return result;
}
function omit(obj, ...keys) {
  let result = {};
  for (let key in obj) {
    if (!keys.includes(key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

// src/worker/worker-types.ts
function isEmpty(msg) {
  if (msg.name === "log") {
    return msg.msg.length === 0;
  } else if (msg.name === "uci") {
    return msg.output.length === 0;
  } else if (msg.name === "uci-flush-output") {
    return msg.output.length === 0;
  }
  return false;
}
function isResponse(msg) {
  return msg.kind === "response" && msg.id !== void 0;
}
function responseMatchesRequest(msg, response) {
  return isResponse(response) && response.id === msg.id && response.name === msg.name;
}
function decodeReceiveFromWorker(msg) {
  return JSON.parse(msg);
}

// src/worker/worker-wrapper.ts
async function createWorker(url) {
  let worker = new Worker(url);
  let listeners2 = [
    (e) => {
      if (isEmpty(e)) {
        return;
      }
      if (e.name === "log") {
        console.log("log (wasm worker) =>", prettyJson(e.msg));
      } else if (e.name === "error") {
        console.error("error (wasm worker) =>", prettyJson(e.msg));
      } else if (e.name === "ready") {
        console.log("ready (wasm worker)");
      } else if (e.name === "uci") {
        if (e.output.length > 0) {
          console.log("uci sync response (wasm worker)", indent_string("\n" + e.output, 2));
        }
      } else if (e.name === "uci-flush-output") {
        if (e.output.length > 0) {
          console.log("uci async response (wasm worker)", e.output);
        }
      } else {
        console.log(e.kind, "(wasm worker) =>", prettyJson(omit(e, "name", "kind", "id")));
      }
    }
  ];
  worker.onmessage = (e) => {
    let data = decodeReceiveFromWorker(e.data);
    listeners2.forEach((l) => l(data));
  };
  async function waitFor(f) {
    return new Promise((resolve) => {
      let callback = (e) => {
        let t = f(e);
        if (t != null && t !== false) {
          listeners2 = listeners2.filter((l) => l !== callback);
          resolve(t);
        }
      };
      listeners2.push(callback);
    });
  }
  await waitFor((e) => {
    return e.name === "ready";
  });
  let responseId = 0;
  return {
    send: (data) => {
      worker.postMessage(JSON.stringify(data));
    },
    sendWithResponse: async (data) => {
      let id = responseId++;
      let sent = { ...data, id };
      worker.postMessage(JSON.stringify(sent));
      return await waitFor((e) => {
        if (responseMatchesRequest(sent, e)) {
          return e;
        }
      });
    },
    wait: waitFor,
    terminate: () => {
      worker.terminate();
    }
  };
}

// src/wasm-bindings.ts
var listeners = [];
globalThis.BindingsJs = {
  log_to_js: (message) => {
    message.split("\n").forEach((line) => {
      listeners.forEach((listener) => listener(line));
    });
  }
};
function jsWorkerForTesting() {
  const worker = new Worker("build/worker/js-worker-for-testing.js");
  return {
    echo: (message) => {
      const result = new Promise((resolve) => {
        worker.onmessage = (e) => {
          resolve(e.data);
          worker.onmessage = null;
        };
      });
      worker.postMessage(message);
      return result;
    },
    terminate: () => {
      worker.terminate();
    }
  };
}
async function wasmWorkerForTesting() {
  let worker = await createWorker("build/worker/wasm-worker-for-testing.js");
  return {
    counter: {
      go: function() {
        worker.send({ name: "counter-go" });
      },
      stop: async function() {
        let response = await worker.sendWithResponse({ name: "counter-count" });
        return response.counterResult;
      }
    },
    perft: {
      start: function(fen, depth) {
        worker.send({ name: "perft-setup", fen, depth });
      },
      stop: async function() {
        let response = await worker.sendWithResponse({ name: "perft-count" });
        return response.perftResult;
      }
    },
    terminate: () => worker.terminate
  };
}
async function newUciWasmWorker() {
  let worker = await createWorker("build/worker/uci-wasm-worker.js");
  return {
    handle_line: async function(line) {
      let response = await worker.sendWithResponse({
        name: "uci",
        line
      });
      return response.output;
    },
    terminate: () => worker.terminate
  };
}
var _workerUci = void 0;
async function singletonUciWorker() {
  if (!_workerUci) {
    _workerUci = newUciWasmWorker();
    _workerUci = Promise.resolve(await _workerUci);
  }
  return await Promise.resolve(_workerUci);
}
var _searchResults = /* @__PURE__ */ new Map();
async function searchWorker() {
  let worker = await singletonUciWorker();
  return {
    search: async (start, moves) => {
      let key = `${start}-${moves.join("-")}`;
      let result = _searchResults.get(key);
      if (result) {
        return await result;
      }
      let [promise, resolve] = resolveable();
      _searchResults.set(key, promise);
      await worker.handle_line("stop");
      let output = [];
      if (start === "startpos") {
        output.push(await worker.handle_line(`position ${start} moves ${moves.join(" ")}`));
      } else {
        output.push(await worker.handle_line(`position fen ${start} moves ${moves.join(" ")}`));
      }
      output.push(await worker.handle_line("go"));
      await new Promise((resolve2) => setTimeout(resolve2, 1e3));
      output.push(await worker.handle_line("stop"));
      let reversed = output.flatMap((line) => line.split("\n")).map((line) => line.trim()).filter((line) => line !== "").reverse();
      for (let line of reversed) {
        if (line.startsWith("bestmove")) {
          let result2 = line.split(" ")[1];
          resolve(result2);
          return result2;
        }
      }
      throw new Error("no bestmove found");
    },
    terminate: () => worker.terminate()
  };
}
var wasmLoaded = false;
async function loadWasmBindgen() {
  if (wasmLoaded) {
    return;
  }
  try {
    wasm_bindgen;
  } catch (e) {
    if (e instanceof ReferenceError) {
      throw new Error("wasm_bindgen is undefined, please include via <script> tag");
    }
  }
  await wasm_bindgen();
  wasmLoaded = true;
}
function syncWasmUci() {
  let uci = wasm_bindgen.UciForJs.new();
  function handleLineAndLog(line) {
    let result = uci.handle_line(line);
    return result;
  }
  return {
    currentFen: () => {
      let fen = "";
      let result = handleLineAndLog("d");
      for (let line of result.split("\n")) {
        if (line.indexOf("Fen: ") >= 0) {
          fen = line.split("Fen: ")[1].trim();
        }
      }
      return fen;
    },
    possibleMoves: () => {
      let moves = [];
      let result = handleLineAndLog("go perft 1");
      for (let line of result.split("\n")) {
        if (line.indexOf(":") === -1) {
          continue;
        }
        let split = line.split(":").filter((v) => v !== "").map((v) => v.trim());
        if (split.length !== 2) {
          continue;
        }
        let [move, perft] = split;
        if (perft !== "1") {
          continue;
        }
        if (move.length !== 4 && move.length !== 5) {
          continue;
        }
        moves.push(move);
      }
      return moves;
    },
    setPosition: (position, moves) => {
      if (position === "startpos") {
        handleLineAndLog(`position ${position} moves ${moves.join(" ")}`);
      } else {
        handleLineAndLog(`position fen ${position} moves ${moves.join(" ")}`);
      }
    }
  };
}

// src/wasm-bindings.test.ts
describe("wasm-bindings.test.ts", function() {
  beforeAll(async function() {
    await loadWasmBindgen();
  });
  it("d", function() {
    let uci = syncWasmUci();
    uci.setPosition("startpos", []);
    expect(uci.currentFen()).toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  });
  it("e2e4", function() {
    let uci = syncWasmUci();
    let start = "startpos";
    let moves = ["e2e4"];
    uci.setPosition(start, moves);
    expect(uci.currentFen()).toBe("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 1 1");
  });
  it("possibleMoves`", function() {
    let uci = syncWasmUci();
    let start = "startpos";
    let moves = ["e2e4"];
    uci.setPosition(start, moves);
    const expectedMoves = [
      "a7a6",
      "b7b6",
      "c7c6",
      "d7d6",
      "e7e6",
      "f7f6",
      "g7g6",
      "h7h6",
      "a7a5",
      "b7b5",
      "c7c5",
      "d7d5",
      "e7e5",
      "f7f5",
      "g7g5",
      "h7h5",
      "b8a6",
      "b8c6",
      "g8f6",
      "g8h6"
    ];
    expectedMoves.sort();
    const actualMoves = uci.possibleMoves();
    actualMoves.sort();
    expect(expectedMoves).toEqual(actualMoves);
  });
  it("echoWorkerForTesting()", async function() {
    const worker = jsWorkerForTesting();
    expect(await worker.echo("hello")).toBe("message received by worker: hello");
    expect(await worker.echo("bye")).toBe("message received by worker: bye");
    worker.terminate();
  });
  it("wasmWorkerForTesting() counter", async function() {
    const worker = await wasmWorkerForTesting();
    worker.counter.go();
    await new Promise((resolve) => setTimeout(resolve, 400));
    const result = await worker.counter.stop();
    expect(result).toBeGreaterThan(2);
    worker.terminate();
  });
  it("wasmWorkerForTesting() perft very short", async function() {
    const worker = await wasmWorkerForTesting();
    worker.perft.start("startpos", 2);
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    const result = await worker.perft.stop();
    expect(result).toBe(20);
    worker.terminate();
  });
  it("wasmWorkerForTesting() perft short", async function() {
    const worker = await wasmWorkerForTesting();
    worker.perft.start("startpos", 5);
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    const result = await worker.perft.stop();
    expect(result).toBe(197281);
    worker.terminate();
  });
  it("wasmWorkerForTesting() perft", async function() {
    const worker = await wasmWorkerForTesting();
    worker.perft.start("startpos", 7);
    await new Promise((resolve) => setTimeout(resolve, 1e3));
    const result = await worker.perft.stop();
    expect(result).toBeGreaterThan(197281);
    worker.terminate();
  });
  describe("wasmWorkerForTesting()", function() {
    let uciWorker;
    beforeEach(async function() {
      uciWorker = await searchWorker();
    });
    it("search via uci commands", async function() {
      let result1 = uciWorker.search("startpos", ["e2e4"]);
      let result2 = uciWorker.search("startpos", ["e2e4"]);
      let result3 = uciWorker.search("startpos", ["e2e4"]);
      expect((await result1).length).toBe(4);
      expect(await result2).toEqual(await result1);
      expect(await result3).toEqual(await result1);
    });
  });
});

// src/helpers.test.ts
describe("helpers.test.ts", function() {
  it("boardFromFen: should return the starting position", function() {
    let board = boardFromFen("startpos");
    expect(boardString(board)).toEqual(
      "rnbqkbnr\npppppppp\n        \n        \n        \n        \nPPPPPPPP\nRNBQKBNR"
    );
  });
});

// src/entry.test.ts
describe("entry.test.ts", function() {
  it("works", function() {
    expect(1).toEqual(1);
  });
});
var env = jasmine.getEnv();
env.execute();
new EventSource("/esbuild").addEventListener("change", () => location.reload());
//# sourceMappingURL=entry.test.js.map
