import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { openFileDialog } from '../api/shell';
import { importBook } from '../api/library';

export function TopBar() {
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    if (importing) return;
    try {
      setImporting(true);
      const paths = await openFileDialog();
      for (const path of paths) {
        await importBook(path);
      }
      queryClient.invalidateQueries({ queryKey: ['shelves'] });
    } catch (e) {
      console.error('Import failed:', e);
    } finally {
      setImporting(false);
    }
  };

  return (
    <header className="top-bar">
      <span className="app-title">Libris</span>
      <input className="search-input" placeholder="Search..." disabled />
      <button className="btn-import" onClick={handleImport} disabled={importing}>
        {importing ? 'Importing…' : 'Import'}
      </button>
    </header>
  );
}
