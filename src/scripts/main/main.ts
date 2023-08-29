'use strict';

window.onload = () => {
    // if supported in the current browser (and mode), then register the service
    // worker for the PWA. A browser might not support this for various reasons,
    // e.g. it simply does not support PWAs or it runs in private mode or the
    // connection to the site is untrusted/unencrypted.
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('worker.js');
    }
};

import init from "app";

init().then(() => {
    console.debug("Initialization done");

    // fade the loading screen out
    const loading_screen = document.getElementById("loading-animation");
    loading_screen?.animate([
        { opacity: "1" },
        { opacity: "0" },
    ], { duration: 500, });
    loading_screen?.style.setProperty("opacity", "0");
    loading_screen?.addEventListener("animationiteration", () => loading_screen?.remove());
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
