export interface MobileMoneyStatusSnapshot {
    status?: string;
    localStatus?: string;
    failureReason?: string | null;
    [key: string]: unknown;
}

interface StartMobileMoneyStatusPollingOptions<T extends MobileMoneyStatusSnapshot> {
    fetchStatus: () => Promise<T>;
    onPending?: (snapshot: T) => void | Promise<void>;
    onSuccess: (snapshot: T) => void | Promise<void>;
    onFailure: (snapshot: T) => void | Promise<void>;
    onError: (error: unknown) => void | Promise<void>;
    onTimeout?: () => void | Promise<void>;
    pollIntervalMs?: number;
    timeoutMs?: number;
}

export const startMobileMoneyStatusPolling = <T extends MobileMoneyStatusSnapshot>({
    fetchStatus,
    onPending,
    onSuccess,
    onFailure,
    onError,
    onTimeout,
    pollIntervalMs = 4000,
    timeoutMs = 120000,
}: StartMobileMoneyStatusPollingOptions<T>) => {
    let active = true;
    let intervalId: number | null = null;
    let timeoutId: number | null = null;

    const stop = () => {
        active = false;
        if (intervalId !== null) window.clearInterval(intervalId);
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        intervalId = null;
        timeoutId = null;
    };

    const poll = async () => {
        try {
            const snapshot = await fetchStatus();
            if (!active) return;

            const providerStatus = String(snapshot?.status || '').toLowerCase();
            const localStatus = String(snapshot?.localStatus || '').toUpperCase();

            if (localStatus === 'COMPLETED' || providerStatus === 'successful') {
                stop();
                await onSuccess(snapshot);
                return;
            }

            if (localStatus === 'FAILED' || providerStatus === 'failed') {
                stop();
                await onFailure(snapshot);
                return;
            }

            await onPending?.(snapshot);
        } catch (error) {
            if (!active) return;
            stop();
            await onError(error);
        }
    };

    poll();
    intervalId = window.setInterval(poll, pollIntervalMs);
    timeoutId = window.setTimeout(async () => {
        if (!active) return;
        stop();
        await onTimeout?.();
    }, timeoutMs);

    return stop;
};
