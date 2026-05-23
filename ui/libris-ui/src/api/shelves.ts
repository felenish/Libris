import { api } from './client';
import type { ShelfDto } from './types';

export const getShelves = () => api.get<ShelfDto[]>('/api/shelves');

export const getContinueReading = () =>
  api.get<ShelfDto>('/api/shelves/continue-reading');
