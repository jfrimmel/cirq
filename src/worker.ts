/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
'use strict';

/** On install, try to cache all necessary resources */
self.addEventListener("install", async () => {
    console.debug("Installing service worker...");
});

/** On a fetch, first look in cache and if missing call to network */
self.addEventListener("fetch", (e: Event) => {
    let event: FetchEvent = e as FetchEvent;
    console.debug(`Trying to fetch ${event.request.url}...`);

    event.respondWith(fetch(event.request));
});
