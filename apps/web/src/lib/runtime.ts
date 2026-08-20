const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const stripWww = (host: string) => host.replace(/^www\./i, '');
const normalizeAssetPath = (pathname: string) => {
    if (pathname.startsWith('/src/assets/images/')) {
        return pathname.replace('/src/assets/images/', '/assets/images/');
    }
    return pathname;
};

const resolveApiBase = () => {
    const browserOrigin = trimTrailingSlash(window.location.origin);
    const envApi = trimTrailingSlash(import.meta.env.VITE_API_URL || '');
    if (!envApi) return browserOrigin;

    try {
        const envUrl = new URL(envApi);
        const browserUrl = new URL(browserOrigin);
        const sameBaseHost = stripWww(envUrl.hostname) === stripWww(browserUrl.hostname);
        const bothDefaultPorts = !envUrl.port && !browserUrl.port;
        const envPath = trimTrailingSlash(envUrl.pathname || '');

        // Preserve explicit API subpaths like /api on the same host.
        if (sameBaseHost && bothDefaultPorts && (!envPath || envPath === '')) {
            return browserOrigin;
        }
    } catch {
        return browserOrigin;
    }

    return envApi;
};

export const API_BASE = resolveApiBase();
export const APP_BASE = trimTrailingSlash(import.meta.env.VITE_APP_URL || window.location.origin);

export const assetUrl = (value?: string | null) => {
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) {
        try {
            const parsed = new URL(value);
            if (/^(localhost|127\.0\.0\.1)$/i.test(parsed.hostname)) {
                return `${APP_BASE}${normalizeAssetPath(parsed.pathname)}`;
            }
            return value;
        } catch {
            return value;
        }
    }
    if (value.startsWith('/assets/') || value.startsWith('/src/assets/')) {
        return `${APP_BASE}${normalizeAssetPath(value)}`;
    }
    if (value.startsWith('/')) {
        return `${APP_BASE}${value}`;
    }
    if (/\.(png|jpe?g|gif|webp|svg|avif)$/i.test(value) && !value.includes('/')) {
        return `${APP_BASE}/assets/images/avatars/${value}`;
    }
    return `${APP_BASE}/${value.replace(/^\/+/, '')}`;
};
