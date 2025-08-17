import { api } from './api';

export const securityService = {
  listMacs: (userId: string, headers: any) => api.get(`/api/security/mac-addresses/${userId}`, { headers }),
  addMac: (payload: { userId: string; macAddress: string; label?: string }, headers: any) => api.post('/api/security/mac-addresses', payload, { headers }),
  removeMac: (id: string, headers: any) => api.delete(`/api/security/mac-addresses/${id}`, { headers }),
};

