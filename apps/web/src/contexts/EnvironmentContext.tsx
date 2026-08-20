import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/axios';

export type MerchantEnvironment = {
    id: string;
    name: string;
    slug: string;
    kind: 'live' | 'sandbox';
    status: 'active' | 'inactive' | 'suspended';
    created_at?: string;
    updated_at?: string;
    complianceStatus?: string;
    isLiveEnabled?: boolean;
};

type EnvironmentContextValue = {
    environments: MerchantEnvironment[];
    activeEnvironment: MerchantEnvironment | null;
    loading: boolean;
    error: string | null;
    selectEnvironment: (environmentId: string) => Promise<MerchantEnvironment>;
    refreshEnvironments: () => Promise<void>;
};

const STORAGE_KEY = 'flapapay_environment_id';
const EnvironmentContext = createContext<EnvironmentContextValue | undefined>(undefined);

export const EnvironmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [environments, setEnvironments] = useState<MerchantEnvironment[]>([]);
    const [activeEnvironment, setActiveEnvironment] = useState<MerchantEnvironment | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshEnvironments = useCallback(async () => {
        if (!localStorage.getItem('token')) return;
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/merchant/environments');
            const nextEnvironments: MerchantEnvironment[] = response.data?.environments || [];
            setEnvironments(nextEnvironments);

            const storedId = localStorage.getItem(STORAGE_KEY);
            const stored = nextEnvironments.find(environment => environment.id === storedId);
            const live = nextEnvironments.find(environment => environment.kind === 'live');
            const sandbox = nextEnvironments.find(environment => environment.kind === 'sandbox');
            const liveReady = live && (live.complianceStatus === 'ACTIVE' && live.isLiveEnabled === true);
            const storedAllowed = stored && (stored.kind === 'sandbox' || liveReady);
            const nextActive = (storedAllowed ? stored : null) || (liveReady ? live : null) || sandbox || live || nextEnvironments[0] || null;
            setActiveEnvironment(nextActive);
            if (nextActive) localStorage.setItem(STORAGE_KEY, nextActive.id);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Unable to load merchant environments');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshEnvironments();
    }, [refreshEnvironments]);

    const selectEnvironment = useCallback(async (environmentId: string) => {
        const response = await api.post(`/merchant/environments/${environmentId}/select`);
        const selected: MerchantEnvironment = response.data.environment;
        setActiveEnvironment(selected);
        localStorage.setItem(STORAGE_KEY, selected.id);
        window.dispatchEvent(new CustomEvent('flapapay-environment-changed', { detail: selected }));
        return selected;
    }, []);

    const value = useMemo(() => ({
        environments,
        activeEnvironment,
        loading,
        error,
        selectEnvironment,
        refreshEnvironments,
    }), [environments, activeEnvironment, loading, error, selectEnvironment, refreshEnvironments]);

    return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
};

export const useEnvironment = () => {
    const context = useContext(EnvironmentContext);
    if (!context) throw new Error('useEnvironment must be used within an EnvironmentProvider');
    return context;
};
