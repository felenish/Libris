import { api } from './client';
import type { BookSummaryDto, ImportResultDto } from './types';

export const getBooks = () => api.get<BookSummaryDto[]>('/api/library/books');

export const importBook = (filePath: string) =>
  api.post<ImportResultDto>('/api/library/import', { filePath });

export const importFolder = (folderPath: string) =>
  api.post<ImportResultDto>('/api/library/import-folder', { folderPath });

export const removeBook = (id: string) =>
  api.delete<void>(`/api/library/books/${id}`);
