'use strict';

window.onload = async () => {
    // if supported in the current browser (and mode), then register the service
    // worker for the PWA. A browser might not support this for various reasons,
    // e.g. it simply does not support PWAs or it runs in private mode or the
    // connection to the site is untrusted/unencrypted.
    if ('serviceWorker' in navigator) {
        const registry = await navigator.serviceWorker.register('worker.js');

        async function apply_update() {
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
            registry?.waiting?.postMessage("perform-update");
        }

        /** Show a minimal notification to either apply or dismiss the update */
        async function offer_update() {
            const message = document.getElementById("update-available");
            const accept_button = document.getElementById("update-accept");
            const close_button = document.getElementById("update-close");

            message?.style.setProperty("display", "unset");
            accept_button?.addEventListener("click", apply_update);
            close_button?.addEventListener("click", () => {
                message?.style.setProperty("display", "none");
            });
        }

        // refer to https://stackoverflow.com/a/37582216 for this construct
        if (registry.waiting) {
            offer_update();
        }
        registry.onupdatefound = () => {
            const new_worker = registry.installing;
            new_worker?.addEventListener("statechange", event => {
                if (new_worker.state == "installed" && registry.active) {
                    offer_update();
                }
            })
        }

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
