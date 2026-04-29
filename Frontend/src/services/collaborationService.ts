import api, { normaliseId, normaliseList } from './api';
import { CollaborationRequest } from '../types';

const normaliseRequest = (raw: any): CollaborationRequest => ({
  ...normaliseId(raw),
  investorId:     raw.investorId?._id  || raw.investorId,
  entrepreneurId: raw.entrepreneurId?._id || raw.entrepreneurId,
  investor:       raw.investorId?._id  ? normaliseId(raw.investorId)     : undefined,
  entrepreneur:   raw.entrepreneurId?._id ? normaliseId(raw.entrepreneurId) : undefined,
});

export const collaborationService = {
  /** POST /api/collaboration */
  createRequest: async (entrepreneurId: string, message: string): Promise<CollaborationRequest> => {
    const { data } = await api.post('/collaboration', { entrepreneurId, message });
    return normaliseRequest(data.request);
  },

  /** GET /api/collaboration */
  getRequests: async (): Promise<CollaborationRequest[]> => {
    const { data } = await api.get('/collaboration');
    return data.requests.map(normaliseRequest);
  },

  /** PATCH /api/collaboration/:id */
  updateStatus: async (id: string, status: 'accepted' | 'rejected'): Promise<CollaborationRequest> => {
    const { data } = await api.patch(`/collaboration/${id}`, { status });
    return normaliseRequest(data.request);
  },
};
