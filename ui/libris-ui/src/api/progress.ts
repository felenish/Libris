import { api } from './client';
import type { ReadingProgressDto } from './types';

export const getProgress = (id: string) =>
  api.get<ReadingProgressDto>(`/api/books/${id}/progress`);

export const saveProgress = (id: string, cfi: string, percentage: number) =>
  api.put<void>(`/api/books/${id}/progress`, { cfi, percentage });
