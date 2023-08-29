//! Entry point of the service worker, that powers the offline usage of the PWA.
//!
//! This script provides the implementation of the service worker for `cirq`.
//! Being a service worker, it intercepts `fetch`es from the PWA and may handle
//! them differently, e.g. by serving it from a cache, so that the application
//! supports offline-usage.
//!
//! # Strategy
//! This worker has a strict "offline-only"-strategy: for normal resources it
//! will never contact the network. Instead, all its resources are fetched when
//! the service worker is installed. Therefore the application is truly static
//! and won't communicate to any server.
//!
//! # Updates
//! The only exception to this is the searching for updates once in a while. If
//! the worker should search for an update (e.g. because the update interval has
//! ended), the worker will contact the PWA-server and check, if there is a new
//! version of the application (if the device is currently offline, this is fine
//! and just nothing happens). If there is a newer version available, the
//! resources are downloaded automatically and stored in a newer cache version,
//! while keeping the current version active. Only if the page is reloaded by
//! the user, the newer versions of the resources are used.
//!
//! The user should actively decide to update the page, e.g. by clicking on a
//! button, that only is visible if there is an update (this needs to be
//! communicated by the service worker to the actual PWA).
//!
//! # Script vs WASM
//! In a perfect world, this would just forward to a WASM as well, but this is
//! currently not that easy for multiple reasons:
//! * one needs to register the event handlers on the first execution (i.e. on
//!   the top-level) of the worker script. This prevents registering the WASM
//!   doing it altogether.
//! * TypeScript only plays nice with modules, but [at the moment], Firefox does
//!   not support service workers as modules, as this feature is experimental.
//!   Therefore one cannot do simply `import * as wasm from "service_worker"` to
//!   get the WASM code loaded. The alternative is to use `importScripts()`, but
//!   then the type annotations are missing for TypeScript. Dynamic imports are
//!   forbidden by the specification altogether.
//! In conclusion, there is ([at the moment]) no real benefit for using WASM in
//! the service worker, when cross-browser-support is required (it is!). So, the
//! whole service worker is implemented in this single script, which makes it
//! work in all browsers, that support service workers, regardless of such
//! experimental features like module-support.
//!
//! [at the moment]: https://caniuse.com/mdn-api_serviceworker_ecmascript_modules
'use strict';

// #region typescript-workaround-for-service-worker-type
declare var self: ServiceWorkerGlobalScope;
export default null;
// #endregion

async function on_install() {
    console.log("[service worker] Installing service worker");
}

async function on_activate() {
    console.log("[service worker] Activating service worker");
}

async function on_fetch(request: Request): Promise<Response> {
    console.debug("[service worker] Trying to fetch ", request.url);
    return await fetch(request);
}

self.addEventListener("install", event => event.waitUntil(on_install()));
self.addEventListener("activate", event => event.waitUntil(on_activate()));
self.addEventListener("fetch", event => event.waitUntil(on_fetch(event.request)));
