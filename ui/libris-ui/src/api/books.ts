import { api } from './client';
import type { BookDetailDto } from './types';

export interface UpdateMetadataRequest {
  title?: string;
  authors?: string[];
  seriesName?: string | null;
  seriesIndex?: number | null;
  genres?: string[];
  publisher?: string | null;
  publishedDate?: string | null;
  description?: string | null;
  isbn?: string | null;
  language?: string | null;
  filePath?: string;
}

export const getBook = (id: string) => api.get<BookDetailDto>(`/api/books/${id}`);

export const updateMetadata = (id: string, data: UpdateMetadataRequest) =>
  api.put<BookDetailDto>(`/api/books/${id}/metadata`, data);

export const getCoverUrl = (id: string) => `/api/books/${id}/cover`;
