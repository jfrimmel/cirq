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
//! The update procedure is very simple: the service worker source file changes
//! on any release (thanks to the monotonically increasing version number, that
//! is inserted at build time), which causes the browser to install a new ver-
//! sion of the service worker. On installation, this new service worker will
//! fetch all the resources of the current PWA version. This way a new version
//! is automatically installed on every new version on the server. The user can
//! then be notified to reload the site to switch to the new worker.
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

/** The version of this PWA build. */
// `$version` is replaced at build time with the actual version
const VERSION = "v$version";

/**
 * The list of files to cache.
 *
 * This list must include all static files except for the server version. Note,
 * that this list must also include all names to all files, e.g. often `/` is
 * an alternative name for `/index.html`, so both must be in the list. This list
 * can be generated automatically using the following pipeline:
 * ```bash
 * find build/site/ -type f |
 *     sort |
 *     grep -v 'build/site/worker.js' |
 *     sed -e 's@build/site/\(.*\)@"\1",@' -e '1i"/",'`
 * ```
 * Do not include the service worker file itself, as this prevents PWA updates.
 */
const SITE_RESOURCES = [
    "/",
    "css/style.css",
    "favicon.ico",
    "icons/128px.png",
    "icons/256px.png",
    "icons/512px.png",
    "icons/64px.png",
    "icons/icon.svg",
    "images/warning.svg",
    "index.html",
    "manifest.json",
    "scripts/app_bg.wasm",
    "scripts/app.js",
    "scripts/main.js",
    ".version",
];

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
