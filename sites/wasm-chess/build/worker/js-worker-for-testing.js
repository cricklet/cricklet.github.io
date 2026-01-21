// src/worker/js-worker-for-testing.ts
async function init() {
  self.onmessage = async (event) => {
    let response = `message received by worker: ${event.data}`;
    self.postMessage(response);
  };
}
init();
//# sourceMappingURL=js-worker-for-testing.js.map
