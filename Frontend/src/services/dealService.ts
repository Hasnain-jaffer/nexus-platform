import api, { normaliseId, normaliseList } from './api';
import { Deal, DealStage, DealStatus } from '../types';

const normaliseDeal = (raw: any): Deal => ({
  ...normaliseId(raw),
  investorId:     raw.investorId?._id    || raw.investorId,
  entrepreneurId: raw.entrepreneurId?._id || raw.entrepreneurId,
  investor:       raw.investorId?._id    ? normaliseId(raw.investorId)     : undefined,
  entrepreneur:   raw.entrepreneurId?._id ? normaliseId(raw.entrepreneurId) : undefined,
});

export const dealService = {
  /** POST /api/deals */
  createDeal: async (payload: {
    entrepreneurId: string;
    amount: string;
    equity?: string;
    stage: DealStage;
    notes?: string;
  }): Promise<Deal> => {
    const { data } = await api.post('/deals', payload);
    return normaliseDeal(data.deal);
  },

  /** GET /api/deals */
  getDeals: async (): Promise<Deal[]> => {
    const { data } = await api.get('/deals');
    return data.deals.map(normaliseDeal);
  },

  /** PATCH /api/deals/:id */
  updateDeal: async (id: string, updates: Partial<{ amount: string; equity: string; stage: DealStage; status: DealStatus; notes: string }>): Promise<Deal> => {
    const { data } = await api.patch(`/deals/${id}`, updates);
    return normaliseDeal(data.deal);
  },

  /** DELETE /api/deals/:id */
  deleteDeal: async (id: string): Promise<void> => {
    await api.delete(`/deals/${id}`);
  },
};
