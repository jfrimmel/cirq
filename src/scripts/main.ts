/// <reference lib="esnext" />
/// <reference lib="dom" />
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

// @ts-ignore
import init, { } from "./wasm.js";

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
});
