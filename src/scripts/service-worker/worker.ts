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

/** A sentinel for checking for an available update of the PWA. */
class UpdateService {
    /** Will eventually hold the PWA version at the time of construction. */
    private installed_version: Promise<number>;

    /** Create a new UpdateService with the current server version as basis. */
    public constructor() {
        this.installed_version = this.fetch_version().catch(_ => 0);
    }

    /**
     * Check, if there is an update available.
     * @returns `true` if the current server version is newer than the version
     * when creating this update service (e.g. on installing the service worker)
     */
    public async is_update_available(): Promise<boolean> {
        try {
            const current = await this.installed_version;
            const potentially_new = await this.fetch_version();
            return potentially_new > current;
        } catch (e) { return false; }
    }

    /**
     * Query the current version on the server and return its numeric value.
     * @returns The eventually resolved content of the `./.version`-file.
     */
    private async fetch_version(): Promise<number> {
        if (!navigator.onLine) throw new Error("offline");
        const response = await fetch('./.version');
        if (!response.ok) throw new Error(response.statusText);
        const version = parseInt(await response.text());
        console.debug("[service worker] current server version", version);
        return version;
    }
}

/** A service checking for updates compared to version at installation time. */
const update_service = new UpdateService();

/**
 * The cached site for full offline-support.
 *
 * This class represents the whole PWA (all of its files) of a specific version,
 * which can be populated once (e.g. at the service worker installation) and
 * potentially update later on. All the site assets, i.e. all HTML, CSS, JS,
 * etc., are cached. On a lookup of a specific request, only the cached versions
 * are considered: this implements the cache-only-strategy.
 */
class OfflineSite {
    private cache: Promise<Cache>;
    private version: number;
    /** List all assets to cache */
    private readonly static_files: string[] = [
        "/", // make sure to include the `/` as this is most likely used.
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
        //"./worker.js",
    ];

    /** Create a new offline-site-storage without populating anything */
    constructor() {
        this.version = 1;
        this.cache = caches.open(`cirq-${this.version}`);
    }

    /** Populate the cache (should be done only once). */
    public async populate() {
        const cache = await this.cache;
        await cache.addAll(this.static_files);
    }

    /**
     * Lookup a specific request in the offline cache.
     * 
     * This lookup is only done in the cache and is never attempted on the
     * network. Files not present in the cache are responded with an error 404.
     */
    public async lookup(request: Request): Promise<Response> {
        const cache = await this.cache;
        const response = await cache.match(request);
        console.debug("looking for", request.url, ", found", response?.url);
        if (response !== undefined) return response;
        return new Response("Cannot find resource", { status: 404 });
    }
}

/** The cached site assets for offline use. */
const offline_site = new OfflineSite();

async function on_install() {
    console.log("[service worker] Installing service worker");
    offline_site.populate();
    self.skipWaiting();
}

async function on_fetch(request: Request): Promise<Response> {
    console.debug("[service worker] Trying to fetch ", request.url);
    return await offline_site.lookup(request);
}

self.addEventListener("install", event => event.waitUntil(on_install()));
self.addEventListener("fetch", event => event.respondWith(on_fetch(event.request)));
