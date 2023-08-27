use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn initialize() {
    web_sys::console::debug_1(&"[service worker] WASM running...".into());
}
