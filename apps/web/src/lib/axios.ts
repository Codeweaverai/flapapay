import axios from 'axios';
import { API_BASE } from './runtime';

export const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token if available
api.interceptors.request.use((config) => {
    const url = config.url || '';
    const environmentId = localStorage.getItem('flapapay_environment_id');
    if (environmentId) {
        config.headers['x-flapapay-environment-id'] = environmentId;
    }

    // For merchant-scoped endpoints, prefer the stored merchant secret key
    if (url.startsWith('/v1/connect') || url.startsWith('/v1/webhooks') || url.startsWith('/v1/charges')) {
        const testMode = localStorage.getItem('connect_test_mode') !== 'false';
        const merchantKey = testMode
            ? localStorage.getItem('merchant_sk_test')
            : localStorage.getItem('merchant_sk_live');
        if (merchantKey) {
            config.headers.Authorization = `Bearer ${merchantKey}`;
            return config;
        }
    }

    // Fall back to user JWT for all other endpoints
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
