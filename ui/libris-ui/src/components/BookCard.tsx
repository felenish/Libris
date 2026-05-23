import { motion } from 'framer-motion';
import { getCoverUrl } from '../api/books';
import { useLibrisStore } from '../store/useLibrisStore';
import type { BookSummaryDto } from '../api/types';

interface BookCardProps {
  book: BookSummaryDto;
  onDetailOpen: (id: string) => void;
}

export function BookCard({ book, onDetailOpen }: BookCardProps) {
  const setOpenBookId = useLibrisStore(s => s.setOpenBookId);
  const setReaderVisible = useLibrisStore(s => s.setReaderVisible);

  const openDetail = () => {
    setOpenBookId(book.id);
    onDetailOpen(book.id);
  };

  const openReader = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenBookId(book.id);
    setReaderVisible(true);
  };

  return (
    <motion.div
      className="book-card"
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={openDetail}
      onDoubleClick={openReader}
    >
      <div className="book-cover-wrap">
        <img
          className="book-cover"
          src={getCoverUrl(book.id)}
          alt={book.title}
          loading="lazy"
          onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
        />
        {book.readingStatus === 'Finished' && (
          <span className="badge-finished">Finished</span>
        )}
        {!book.fileFound && (
          <span className="badge-missing">!</span>
        )}
        <div className="book-overlay">
          <button
            className="overlay-btn"
            onClick={e => { e.stopPropagation(); openDetail(); }}
          >
            Details
          </button>
          <button className="overlay-btn" onClick={openReader}>
            Open Reader
          </button>
        </div>
      </div>
      <div className="book-title">{book.title}</div>
      <div className="book-author">{book.authors[0] ?? ''}</div>
      {book.readingStatus === 'Reading' && (
        <div className="book-progress-track">
          <div className="book-progress-fill" style={{ width: `${book.percentage}%` }} />
        </div>
      )}
    </motion.div>
  );
}
