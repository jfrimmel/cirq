var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// #endregion
'use strict';
/** On install, try to cache all necessary resources */
self.addEventListener("install", () => __awaiter(void 0, void 0, void 0, function* () {
    console.debug("Installing service worker...");
}));
/** On a fetch, first look in cache and if missing call to network */
self.addEventListener("fetch", event => {
    console.debug(`Trying to fetch ${event.request.url}...`);
    event.respondWith(fetch(event.request));
});
