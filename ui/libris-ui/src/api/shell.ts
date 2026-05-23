import { api } from './client';

export const openFileDialog = () =>
  api.post<string[]>('/api/shell/open-file-dialog');

export const openFolderDialog = () =>
  api.post<string>('/api/shell/open-folder-dialog');

export const revealInExplorer = (path: string) =>
  api.post<void>('/api/shell/reveal', { path });
