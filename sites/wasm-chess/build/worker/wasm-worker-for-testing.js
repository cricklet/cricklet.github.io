// src/worker/worker-types.ts
function decodeSendToWorker(msg) {
  return JSON.parse(msg);
}
function encodeReceiveFromWorker(msg) {
  return JSON.stringify(msg);
}

// src/worker/wasm-worker-for-testing.ts
importScripts("../../lib/wasm-pack/wasm_chess.js");
function send(msg) {
  self.postMessage(encodeReceiveFromWorker(msg));
}
globalThis.BindingsJs = {
  log_to_js: function(msg) {
    send({ kind: "message", name: "log", msg: [msg] });
  }
};
async function setupCounterForJs() {
  let counterForJs = await wasm_bindgen.CounterForJs.new();
  let counterThinkLoop = void 0;
  return {
    handleEvent: (e) => {
      let data = decodeSendToWorker(e.data);
      switch (data.name) {
        case "counter-go":
          counterThinkLoop = setInterval(() => {
            counterForJs.think();
          });
          return true;
        case "counter-count":
          clearInterval(counterThinkLoop);
          send({ kind: "message", name: "log", msg: ["perft done"] });
          let counterResult = counterForJs.count();
          send({ kind: "response", name: "counter-count", id: data.id, counterResult });
          return true;
        default:
          return false;
      }
    }
  };
}
async function setupPerftForJs() {
  let perftForJs = await wasm_bindgen.PerftForJs.new();
  let perftThinkLoop = void 0;
  return {
    handleEvent: (e) => {
      let data = decodeSendToWorker(e.data);
      switch (data.name) {
        case "perft-setup":
          perftForJs.setup(data.fen, data.depth);
          perftThinkLoop = setInterval(() => {
            send({ kind: "message", name: "log", msg: ["perft thinking"] });
            let done = perftForJs.think_and_return_done();
            if (done) {
              send({ kind: "message", name: "log", msg: ["perft finished naturally"] });
              clearInterval(perftThinkLoop);
            }
          });
          return true;
        case "perft-count":
          clearInterval(perftThinkLoop);
          let perftResult = perftForJs.count();
          send({ kind: "response", name: "perft-count", id: data.id, perftResult });
          return true;
        default:
          return false;
      }
    }
  };
}
async function init_wasm_in_worker() {
  await wasm_bindgen("../../lib/wasm-pack/wasm_chess_bg.wasm");
  let counter = await setupCounterForJs();
  let perft = await setupPerftForJs();
  self.onmessage = async (e) => {
    let data = decodeSendToWorker(e.data);
    if (counter.handleEvent(e)) {
      return;
    }
    if (perft.handleEvent(e)) {
      return;
    }
    send({ kind: "message", name: "error", msg: `unknown message: ${data}` });
  };
  send({ kind: "message", name: "ready" });
}
init_wasm_in_worker();
//# sourceMappingURL=wasm-worker-for-testing.js.map
