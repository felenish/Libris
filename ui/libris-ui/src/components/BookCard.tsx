import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pencil } from 'lucide-react';
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
  const [coverError, setCoverError] = useState(false);

  const openDetail = () => {
    setOpenBookId(book.id);
    onDetailOpen(book.id);
  };

  const openReader = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenBookId(book.id);
    setReaderVisible(true);
  };

  const showProgress = (book.readingStatus === 'Reading' || (book.percentage ?? 0) > 0) && book.readingStatus !== 'Finished';

  return (
    <motion.div
      className="book-card"
      whileHover={{ scale: 1.04 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      onClick={openDetail}
      onDoubleClick={openReader}
    >
      <div className="book-cover-wrap">
        {coverError ? (
          <div className="book-cover-fallback">{book.title}</div>
        ) : (
          <img
            className="book-cover"
            src={getCoverUrl(book.id)}
            alt={book.title}
            loading="lazy"
            onError={() => setCoverError(true)}
          />
        )}

        {book.readingStatus === 'Finished' && (
          <span className="badge-finished">Done</span>
        )}
        {!book.fileFound && (
          <span className="badge-missing">!</span>
        )}

        <div className="book-overlay">
          <button className="overlay-btn" onClick={openReader}>
            <Play size={10} />
            Read
          </button>
          <button className="overlay-btn" onClick={e => { e.stopPropagation(); openDetail(); }}>
            <Pencil size={10} />
            Edit
          </button>
        </div>
      </div>

      {showProgress && (
        <div className="book-progress-bar">
          <div className="book-progress-fill" style={{ width: `${book.percentage ?? 0}%` }} />
        </div>
      )}
    </motion.div>
  );
}
