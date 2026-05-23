import { AnimatePresence, motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getBook, getCoverUrl } from '../api/books';
import { removeBook } from '../api/library';
import { useLibrisStore } from '../store/useLibrisStore';

interface BookDetailPanelProps {
  bookId: string | null;
  onClose: () => void;
  onEditMetadata: (id: string) => void;
}

export function BookDetailPanel({ bookId, onClose, onEditMetadata }: BookDetailPanelProps) {
  const queryClient = useQueryClient();
  const setReaderVisible = useLibrisStore(s => s.setReaderVisible);
  const setOpenBookId = useLibrisStore(s => s.setOpenBookId);

  const { data: book } = useQuery({
    queryKey: ['book', bookId],
    queryFn: () => getBook(bookId!),
    enabled: bookId !== null,
  });

  const handleRemove = async () => {
    if (!bookId) return;
    await removeBook(bookId);
    queryClient.invalidateQueries({ queryKey: ['shelves'] });
    onClose();
  };

  const handleRead = () => {
    setOpenBookId(bookId);
    setReaderVisible(true);
  };

  return (
    <AnimatePresence>
      {bookId && (
        <motion.aside
          className="detail-panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          <button className="panel-close" onClick={onClose}>✕</button>

          {book ? (
            <>
              <img
                className="panel-cover"
                src={getCoverUrl(book.id)}
                alt={book.title}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <h2 className="panel-title">{book.title}</h2>
              <p className="panel-authors">{book.authors.join(', ')}</p>

              {book.seriesName && (
                <p className="panel-series">
                  {book.seriesName}{book.seriesIndex != null ? ` #${book.seriesIndex}` : ''}
                </p>
              )}

              {book.description && (
                <p className="panel-description">{book.description}</p>
              )}

              {book.genres.length > 0 && (
                <div className="panel-genres">
                  {book.genres.map(g => <span key={g} className="genre-tag">{g}</span>)}
                </div>
              )}

              {!book.fileFound && (
                <div className="panel-warning">⚠ File not found — Relink coming in Phase 14</div>
              )}

              <div className="panel-actions">
                <button className="btn-primary" onClick={handleRead}>Read</button>
                <button className="btn-secondary" onClick={() => bookId && onEditMetadata(bookId)}>Edit Metadata</button>
                <button className="btn-secondary" onClick={() => bookId && onEditMetadata(bookId)}>Fetch Metadata</button>
                <button className="btn-danger" onClick={handleRemove}>Remove</button>
              </div>
            </>
          ) : (
            <p className="status-msg">Loading…</p>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
