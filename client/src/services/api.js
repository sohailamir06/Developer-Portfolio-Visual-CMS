import axios from 'axios';

/**
 * Axios client. The session is an HTTP-only cookie; the CSRF token is held in memory only
 * (never localStorage) and attached to every state-changing request.
 */
let csrfToken = null;
export const setCsrfToken = (t) => {
  csrfToken = t;
};

export const api = axios.create({ baseURL: '/api', withCredentials: true, timeout: 30000 });

api.interceptors.request.use((config) => {
  if (csrfToken && !['get', 'head', 'options'].includes((config.method || 'get').toLowerCase())) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

/** Normalises axios errors into { message, status, details }. */
export function toApiError(err) {
  if (axios.isCancel?.(err)) return { message: 'Request cancelled', status: 0, cancelled: true };
  const status = err?.response?.status ?? 0;
  const body = err?.response?.data?.error;
  let message = body?.message || (status === 0 ? 'Cannot reach the server. Check your connection.' : err.message);
  if (status === 429 && !body) message = 'Too many requests. Please wait and try again.';
  return { message, status, details: body?.details || [] };
}

const data = (p) => p.then((r) => r.data);

export const publicApi = {
  settings: () => data(api.get('/public/settings')),
  navigation: () => data(api.get('/public/navigation')),
  page: (slug) => data(api.get(`/public/pages/${encodeURIComponent(slug)}`)),
  projects: (params) => data(api.get('/public/projects', { params })),
  project: (slug) => data(api.get(`/public/projects/${encodeURIComponent(slug)}`)),
  skills: () => data(api.get('/public/skills')),
  experience: () => data(api.get('/public/experience')),
  resolveRedirect: (path) => data(api.get('/public/redirects/resolve', { params: { path } })),
  contact: (body) => data(api.post('/public/contact', body)),
};

const crud = (base) => ({
  list: (params) => data(api.get(base, { params })),
  get: (id) => data(api.get(`${base}/${id}`)),
  create: (body) => data(api.post(base, body)),
  update: (id, body) => data(api.put(`${base}/${id}`, body)),
  remove: (id) => data(api.delete(`${base}/${id}`)),
  reorder: (ids) => data(api.put(`${base}/reorder`, { ids })),
});

export const adminApi = {
  login: (body) => data(api.post('/auth/login', body)),
  logout: () => data(api.post('/auth/logout')),
  me: () => data(api.get('/auth/me')),
  health: () => data(api.get('/health')),
  dashboard: () => data(api.get('/admin/dashboard')),
  sectionTypes: () => data(api.get('/admin/section-types')),

  pages: {
    ...crud('/admin/pages'),
    updateMeta: (id, body) => data(api.put(`/admin/pages/${id}`, body)),
    saveDraft: (id, body) => data(api.put(`/admin/pages/${id}/draft`, body)),
    preview: (id) => data(api.get(`/admin/pages/${id}/preview`)),
    publish: (id, note) => data(api.post(`/admin/pages/${id}/publish`, { note })),
    unpublish: (id) => data(api.post(`/admin/pages/${id}/unpublish`)),
    discard: (id) => data(api.post(`/admin/pages/${id}/discard`)),
    revisions: (id) => data(api.get(`/admin/pages/${id}/revisions`)),
    restore: (id, revId) => data(api.post(`/admin/pages/${id}/revisions/${revId}/restore`)),
    updateSeo: (id, seo) => data(api.put(`/admin/pages/${id}/seo`, { seo })),
  },
  projects: { ...crud('/admin/projects'), revisions: (id) => data(api.get(`/admin/projects/${id}/revisions`)) },
  skills: crud('/admin/skills'),
  experience: crud('/admin/experience'),
  users: crud('/admin/users'),

  media: {
    list: (params) => data(api.get('/admin/media', { params })),
    upload: (files, onUploadProgress) => {
      const form = new FormData();
      for (const f of files) form.append('files', f);
      return data(api.post('/admin/media', form, { onUploadProgress, timeout: 120000 }));
    },
    update: (id, body) => data(api.patch(`/admin/media/${id}`, body)),
    usage: (id) => data(api.get(`/admin/media/${id}/usage`)),
    remove: (id, force = false) => data(api.delete(`/admin/media/${id}`, { params: force ? { force: 'true' } : {} })),
  },

  navigation: { get: () => data(api.get('/admin/navigation')), update: (body) => data(api.put('/admin/navigation', body)) },
  settings: { get: () => data(api.get('/admin/settings')), update: (body) => data(api.put('/admin/settings', body)) },
  revisions: {
    list: (contentType, contentId) => data(api.get('/admin/revisions', { params: { contentType, contentId } })),
    get: (id) => data(api.get(`/admin/revisions/${id}`)),
    restore: (id) => data(api.post(`/admin/revisions/${id}/restore`)),
  },
  seo: {
    overview: () => data(api.get('/admin/seo')),
    createRedirect: (body) => data(api.post('/admin/redirects', body)),
    deleteRedirect: (id) => data(api.delete(`/admin/redirects/${id}`)),
  },
  messages: {
    list: (params) => data(api.get('/admin/messages', { params })),
    update: (id, status) => data(api.patch(`/admin/messages/${id}`, { status })),
    remove: (id) => data(api.delete(`/admin/messages/${id}`)),
  },
};
