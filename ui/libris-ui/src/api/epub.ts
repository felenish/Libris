import { api } from './client';
import type { SpineItemDto } from './types';

export const getSpine = (id: string) =>
  api.get<SpineItemDto[]>(`/api/epub/${id}/spine`);

export const getResourceUrl = (id: string, resourcePath: string) =>
  `/api/epub/${id}/content/${resourcePath}`;
