import { useQuery } from '@tanstack/react-query';
import { getShelves } from '../api/shelves';
import { ShelfRow } from './ShelfRow';

interface ShelfListProps {
  onBookSelect: (id: string) => void;
}

export function ShelfList({ onBookSelect }: ShelfListProps) {
  const { data: shelves, isLoading, isError } = useQuery({
    queryKey: ['shelves'],
    queryFn: getShelves,
  });

  if (isLoading) return <p className="status-msg">Loading library…</p>;
  if (isError) return <p className="status-msg">Failed to load library.</p>;
  if (!shelves?.length) {
    return (
      <div className="empty-state">
        <p>Your library is empty.</p>
        <p>Use the Import button to add EPUB files.</p>
      </div>
    );
  }

  return (
    <div className="shelf-list">
      {shelves.map(shelf => (
        <ShelfRow
          key={shelf.id}
          label={shelf.label}
          books={shelf.books}
          onBookSelect={onBookSelect}
        />
      ))}
    </div>
  );
}
