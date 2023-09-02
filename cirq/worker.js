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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/** The version of this PWA build. */
// `32` is replaced at build time with the actual version
const VERSION = "v32";
const CACHE_NAME = `cirq-${VERSION}`;
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
// #endregion
/** Cache all static files on installation or prevent the install on errors */
function on_install() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("[service worker] Installing service worker");
        const cache = yield caches.open(CACHE_NAME);
        try {
            yield cache.addAll(SITE_RESOURCES);
        }
        catch (e) {
            // when this happens, the static file list is out of date and must be
            // regenerated or there was another issue receiving one or more files,
            // e.g. the network was disconnected just as the `addAll()`-call is on-
            // going.
            console.warn("Static file list out of date or other network error:", e);
            throw e; // rethrow in order to prevent the service worker installation
        }
    });
}
/** Delete all older caches in order to save disk-space and claim all clients */
function on_activate() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("[service worker] Activating service worker");
        // delete all other caches
        const names = yield caches.keys();
        const deletions = names
            .filter(name => name != CACHE_NAME)
            .map(name => caches.delete(name));
        yield Promise.all(deletions);
        // use this service worker for all clients
        yield self.clients.claim();
    });
}
/** Look up the requests in the cache or return 404 if the file is not cached */
function on_fetch(request) {
    return __awaiter(this, void 0, void 0, function* () {
        console.debug("[service worker] Trying to fetch ", request.url);
        const cache = yield caches.open(CACHE_NAME);
        const response = yield cache.match(request);
        if (response)
            return response;
        else
            return new Response("file not cached", { status: 404 });
    });
}
/** Handle messages from clients, e.g. to reload the worker and application */
function on_message(event) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (event.data === "perform-update") {
            console.debug("[service worker] skipping the waiting of the new one");
            yield self.skipWaiting();
            yield self.clients.claim();
            (_a = event.source) === null || _a === void 0 ? void 0 : _a.postMessage("done");
        }
        else {
            console.warn("unknown message: ", event.data, "@", event);
        }
    });
}
self.addEventListener("install", event => event.waitUntil(on_install()));
self.addEventListener("activate", event => event.waitUntil(on_activate()));
self.addEventListener("fetch", event => event.respondWith(on_fetch(event.request)));
self.addEventListener("message", event => event.waitUntil(on_message(event)));
