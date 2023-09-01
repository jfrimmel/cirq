'use strict';

import { WorkerInterface, ServiceWorkerUnsupported } from "./worker-interface";

window.onload = async () => {
    try {
        const worker = new WorkerInterface("worker.js");
        await worker.enable_update_check();
    } catch (e) {
        console.error("Service worker could not be configured", e);
    }
};

import init from "app";

init().then(() => {
    console.debug("Initialization done");

    // fade the loading screen out
    const loading_screen = document.getElementById("loading-animation");
    const animation = loading_screen?.animate([
        { opacity: "1" },
        { opacity: "0" },
    ], { duration: 500, });
    animation?.addEventListener("finish", () => loading_screen?.remove());
    animation?.play();
}).catch((e: any) => {
    // the WASM file could not be initialized. This most likely is not caused by
    // non-functioning WASM main(), but rather by a browser, that either does
    // not support WebAssembly or has it disabled for security reasons.
    console.error("could not initialize wasm due to " + e);
    document.getElementById("loading-animation")?.remove();

    // unhide the warning about unsupported WASM
    const warning = document.getElementById("wasm-unsupported");
    warning?.style?.setProperty("display", "initial");
});
