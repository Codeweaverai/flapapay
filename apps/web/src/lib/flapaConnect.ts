const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3005';

export interface FlapaConnectAppearance {
  variables?: {
    colorPrimary?: string;
    colorBackground?: string;
    colorText?: string;
    fontFamily?: string;
    borderRadius?: string;
  };
}

export interface FlapaConnectOptions {
  fetchClientSecret: () => Promise<string>;
  appearance?: FlapaConnectAppearance;
  locale?: string;
}

export interface FlapaConnectSession {
  portalToken: string;
  accountId: string;
  components: Record<string, { enabled: boolean; features?: Record<string, boolean> }>;
  expiresAt: number;
}

export class FlapaConnectInstance {
  private fetchClientSecret: () => Promise<string>;
  private session: FlapaConnectSession | null = null;
  private refreshPromise: Promise<FlapaConnectSession> | null = null;
  appearance: FlapaConnectAppearance;
  locale: string;

  constructor(options: FlapaConnectOptions) {
    this.fetchClientSecret = options.fetchClientSecret;
    this.appearance = options.appearance || {};
    this.locale = options.locale || navigator.language || 'en-US';
  }

  async getSession(): Promise<FlapaConnectSession> {
    if (this.session && Date.now() / 1000 < this.session.expiresAt - 60) {
      return this.session;
    }
    if (this.refreshPromise) return this.refreshPromise;

    this.refreshPromise = (async () => {
      const clientSecret = await this.fetchClientSecret();
      const res = await fetch(`${API_BASE}/v1/connect/account_sessions/${clientSecret}/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Session exchange failed');
      }
      const data = await res.json();
      this.session = {
        portalToken: data.portal_token,
        accountId: data.account_id,
        components: data.components || {},
        expiresAt: data.expires_at,
      };
      return this.session;
    })().finally(() => { this.refreshPromise = null; });

    return this.refreshPromise;
  }

  update(options: Pick<FlapaConnectOptions, 'appearance' | 'locale'>) {
    if (options.appearance) this.appearance = { ...this.appearance, ...options.appearance };
    if (options.locale) this.locale = options.locale;
  }

  logout() {
    this.session = null;
  }
}

export function loadFlapaConnect(options: FlapaConnectOptions): FlapaConnectInstance {
  return new FlapaConnectInstance(options);
}
