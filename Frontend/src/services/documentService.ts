import api, { normaliseId, normaliseList } from './api';
import { Document } from '../types';

export const documentService = {
  /** POST /api/documents/upload — multipart form */
  upload: async (file: File, name?: string): Promise<Document> => {
    const form = new FormData();
    form.append('file', file);
    if (name) form.append('name', name);

    const { data } = await api.post('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return normaliseId(data.document) as Document;
  },

  /** GET /api/documents */
  getDocuments: async (): Promise<Document[]> => {
    const { data } = await api.get('/documents');
    return normaliseList(data.documents) as Document[];
  },

  /** GET /api/documents/:id/download — opens file in new tab */
  getDownloadUrl: (id: string): string => {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    return `${baseUrl}/documents/${id}/download`;
  },

  /** PATCH /api/documents/:id/share */
  share: async (id: string, userIds: string[], isPublic?: boolean): Promise<Document> => {
    const { data } = await api.patch(`/documents/${id}/share`, { userIds, isPublic });
    return normaliseId(data.document) as Document;
  },

  /** DELETE /api/documents/:id */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },

  /** Formats bytes into human-readable string */
  formatSize: (bytes: number): string => {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  },
};
