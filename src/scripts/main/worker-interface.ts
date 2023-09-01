/** Interface to the service worker. */
export class WorkerInterface {
    /**
     * Create a new service worker and the interface to it.
     * @param worker_script_name The name of the service worker script.
     * @throws ServiceWorkerUnsupported if the service worker API is not
     * available, e.g. due to lack of browser support or because there is no
     * safe context available.
     */
    constructor(worker_script_name: string) {
        if (!navigator.serviceWorker) throw new ServiceWorkerUnsupported();

        navigator.serviceWorker.register(worker_script_name);
    }

    /**
     * Enable the update check. Depending on the browser support, this might
     * either use the experimental "periodic sync API" or use a rather simple
     * fallback mechanism of scheduling a timeout.
     * 
     * The check will send an event to the service worker with a rather large
     * time interval in between events. The actual time depends on the API or
     * fallback-usage and on how the site is used.
     */
    public async enable_update_check() {
        const worker = await navigator.serviceWorker.ready;

        if (await this.is_periodic_sync_available()) {
            console.debug("Periodic-sync-API available, using it");
            await worker.periodicSync.register("update-check", {
                minInterval: 24 * 60 * 60 * 1000, // try roughly once per day
            });
        } else {
            console.debug("Periodic-sync-API unavailable, using fallback");

            function callback() {
                worker.active?.postMessage("update-check");
                setTimeout(callback, 2 * 60 * 60 * 1000); // try every 2h
            }
            callback();
        }
    }

    /** Check, if the "periodic sync API" can be used. */
    private async is_periodic_sync_available(): Promise<boolean> {
        const worker = await navigator.serviceWorker.ready;
        if (!worker.periodicSync) return false;

        const status = await navigator.permissions.query({
            name: <any>"periodic-background-sync",
        });
        return status.state == "granted";
    }
}

/** An exception, that is thrown if the service worker is not supported. */
export class ServiceWorkerUnsupported extends Error { }


// #region typescript-experimental-types
interface RegisterOptions {
    /** minimum interval between invocations in milliseconds */
    minInterval?: number,
}
interface PeriodicSyncManager {
    register(tag: string, options?: RegisterOptions): Promise<undefined>;
    getTags(): Promise<string[]>;
    unregister(tag: string): Promise<void>;
}
declare global {
    interface ServiceWorkerRegistration {
        readonly periodicSync: PeriodicSyncManager;
    }
}
// #endregion
