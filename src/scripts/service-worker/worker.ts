// #region typescript-workaround-for-service-worker-type
declare var self: ServiceWorkerGlobalScope;
export default null;
// #endregion
'use strict';

/** On install, try to cache all necessary resources */
self.addEventListener("install", async () => {
    console.debug("Installing service worker...");
});

/** On a fetch, first look in cache and if missing call to network */
self.addEventListener("fetch", event => {
    console.debug(`Trying to fetch ${event.request.url}...`);

    event.respondWith(fetch(event.request));
});
