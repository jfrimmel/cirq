//! Entry point of the service worker, that powers the offline usage of the PWA.
//!
//! This script is merely a call to the WASM, that is the actual service worker.
//! Any actual work is done over on the Rust side.
importScripts("./service_worker.js");

/// Initialize the WASM in the service worker.
///
/// This function re-initializes the WASM despite it being loaded already before
/// running this script. This is required, as the service worker runs in a
/// different context.
async function initialize() {
    console.debug("[service worker] trying to load WASM...");
    await wasm_bindgen("./service_worker_bg.wasm");

    wasm_bindgen.initialize();
}
initialize();
