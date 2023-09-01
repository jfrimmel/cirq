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
window.onload = () => __awaiter(void 0, void 0, void 0, function* () {
    // if supported in the current browser (and mode), then register the service
    // worker for the PWA. A browser might not support this for various reasons,
    // e.g. it simply does not support PWAs or it runs in private mode or the
    // connection to the site is untrusted/unencrypted.
    if ('serviceWorker' in navigator) {
        const registry = yield navigator.serviceWorker.register('worker.js');
        function apply_update() {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                console.log("applying update!");
                // Use a ping-pong-game to do a full application update. This is
                // necessary in order to update the service worker _and_ then update
                // the displayed contents by reloading the page. This is done with
                // two messages, that are sent from client to worker and vice versa.
                //
                //   clients                           service worker
                //      |                                    |
                // apply_update                              |
                //      |-----------perform-update---------->|
                //      |                                    |
                //      |                              skipWaiting()
                //      |                                    |
                //      |<---------------done----------------|
                //   reload()                                |
                //      |                                    |
                //      X                                    |
                navigator.serviceWorker.onmessage = () => window.location.reload();
                (_a = registry === null || registry === void 0 ? void 0 : registry.waiting) === null || _a === void 0 ? void 0 : _a.postMessage("perform-update");
            });
        }
        /** Show a minimal notification to either apply or dismiss the update */
        function offer_update() {
            return __awaiter(this, void 0, void 0, function* () {
                const message = document.getElementById("update-available");
                const accept_button = document.getElementById("update-accept");
                const close_button = document.getElementById("update-close");
                message === null || message === void 0 ? void 0 : message.style.setProperty("display", "unset");
                accept_button === null || accept_button === void 0 ? void 0 : accept_button.addEventListener("click", apply_update);
                close_button === null || close_button === void 0 ? void 0 : close_button.addEventListener("click", () => {
                    message === null || message === void 0 ? void 0 : message.style.setProperty("display", "none");
                });
            });
        }
        // refer to https://stackoverflow.com/a/37582216 for this construct
        if (registry.waiting) {
            offer_update();
        }
        registry.onupdatefound = () => {
            const new_worker = registry.installing;
            new_worker === null || new_worker === void 0 ? void 0 : new_worker.addEventListener("statechange", event => {
                if (new_worker.state == "installed" && registry.active) {
                    offer_update();
                }
            });
        };
    }
});
import init from './app.js';
init().then(() => {
    console.debug("Initialization done");
    // fade the loading screen out
    const loading_screen = document.getElementById("loading-animation");
    const animation = loading_screen === null || loading_screen === void 0 ? void 0 : loading_screen.animate([
        { opacity: "1" },
        { opacity: "0" },
    ], { duration: 500, });
    animation === null || animation === void 0 ? void 0 : animation.addEventListener("finish", () => loading_screen === null || loading_screen === void 0 ? void 0 : loading_screen.remove());
    animation === null || animation === void 0 ? void 0 : animation.play();
}).catch((e) => {
    var _a, _b;
    // the WASM file could not be initialized. This most likely is not caused by
    // non-functioning WASM main(), but rather by a browser, that either does
    // not support WebAssembly or has it disabled for security reasons.
    console.error("could not initialize wasm due to " + e);
    (_a = document.getElementById("loading-animation")) === null || _a === void 0 ? void 0 : _a.remove();
    // unhide the warning about unsupported WASM
    const warning = document.getElementById("wasm-unsupported");
    (_b = warning === null || warning === void 0 ? void 0 : warning.style) === null || _b === void 0 ? void 0 : _b.setProperty("display", "initial");
});
