// The worker has its own scope and no direct access to functions/objects of the
// global scope. We import the generated JS file to make `wasm_bindgen`
// available which we need to initialize our Wasm code.
importScripts('../lib/wasm-pack/wasm_chess.js');

async function init_wasm_in_worker() {
    // load the wasm
    await wasm_bindgen('../lib/wasm-pack/wasm_chess_bg.wasm');

    // handle messages passed to the worker
    self.onmessage = async event => {
        self.postMessage('message received by worker:', event.data);
    };
};

init_wasm_in_worker();