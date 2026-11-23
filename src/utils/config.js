const envApiUrl = import.meta.env.VITE_API_URL;
const runtimeConfig = typeof window !== 'undefined' ? window.VOC_CONFIG || {} : {};
const rawApiUrl = envApiUrl !== undefined ? envApiUrl : runtimeConfig.API_URL || '';

export const VOC_API = String(rawApiUrl).replace(/\/+$/, '');
export const PROTOTIPE = VOC_API === '';
