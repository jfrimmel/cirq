//! Entry point of the service worker, that powers the offline usage of the PWA.
//!
//! This script is merely a call to the WASM, that is the actual service worker.
//! Any actual work is done over on the Rust side.
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as wasm from './service_worker.js';
// #endregion
/// Initialize the WASM in the service worker.
///
/// This function re-initializes the WASM despite it being loaded already before
/// running this script. This is required, as the service worker runs in a
/// different context.
function initialize() {
    return __awaiter(this, void 0, void 0, function* () {
        console.debug("[service worker] trying to load WASM...");
        yield wasm.default();
        wasm.initialize();
    });
}
initialize();
