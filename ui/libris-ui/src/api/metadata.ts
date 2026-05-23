import { api } from './client';
import type { ExternalBookMetadataDto } from './types';

export const searchMetadata = (title: string, author?: string) =>
  api.post<ExternalBookMetadataDto[]>('/api/metadata/search', { title, author });

export const fetchAndApplyMetadata = (id: string, selected: ExternalBookMetadataDto) =>
  api.post<void>(`/api/books/${id}/metadata/fetch`, selected);
