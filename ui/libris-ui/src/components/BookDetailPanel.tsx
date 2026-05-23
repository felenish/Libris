import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MoreHorizontal, Play, Pencil, Download } from 'lucide-react';
import { getBook, getCoverUrl } from '../api/books';
import { removeBook } from '../api/library';
import { getShelves } from '../api/shelves';
import { useLibrisStore } from '../store/useLibrisStore';
import type { BookSummaryDto } from '../api/types';

interface BookDetailPanelProps {
  bookId: string | null;
  onClose: () => void;
  onEditMetadata: (id: string, focusSearch?: boolean) => void;
}

function timeAgo(utc: string | null): string {
  if (!utc) return '';
  const diff = Date.now() - new Date(utc).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function BookDetailPanel({ bookId, onClose, onEditMetadata }: BookDetailPanelProps) {
  const queryClient = useQueryClient();
  const setReaderVisible = useLibrisStore(s => s.setReaderVisible);
  const setOpenBookId = useLibrisStore(s => s.setOpenBookId);
  const [coverError, setCoverError] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const { data: book } = useQuery({
    queryKey: ['book', bookId],
    queryFn: () => getBook(bookId!),
    enabled: bookId !== null,
  });

  const { data: shelves } = useQuery({
    queryKey: ['shelves'],
    queryFn: getShelves,
    enabled: bookId !== null && !!book?.seriesName,
  });

  const seriesBooks: BookSummaryDto[] = book?.seriesName
    ? (shelves ?? [])
        .flatMap(s => s.books)
        .filter((b, idx, arr) => b.seriesName === book.seriesName && arr.findIndex(x => x.id === b.id) === idx)
        .sort((a, b) => (a.seriesIndex ?? 0) - (b.seriesIndex ?? 0))
    : [];

  const seriesTotal = seriesBooks.length;

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

  if (!bookId) return null;

  return (
    <motion.div
      className="detail-page"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      {/* Top strip */}
      <div className="detail-topstrip">
        <button className="btn-outline" onClick={onClose} style={{ padding: '5px 14px', fontSize: 13 }}>
          <ArrowLeft size={14} />
          Library
        </button>
        <span className="detail-wordmark">Libris</span>
        <div style={{ position: 'relative' }}>
          <button className="btn-outline" style={{ padding: '5px 14px', fontSize: 13 }} onClick={() => setMoreOpen(o => !o)}>
            <MoreHorizontal size={14} />
            More
          </button>
          {moreOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '110%', zIndex: 10,
              background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              borderRadius: 8, padding: '6px 0', minWidth: 180,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
              <button
                style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: 'var(--danger)', fontFamily: 'inherit', fontSize: 13, padding: '8px 16px', textAlign: 'left', cursor: 'pointer' }}
                onClick={() => { setMoreOpen(false); handleRemove(); }}
              >
                Remove from Library
              </button>
            </div>
          )}
        </div>
      </div>

      {book ? (
        <>
          {/* Hero */}
          <div className="detail-hero">
            <div className="detail-hero-gradient" />

            {coverError ? (
              <div className="detail-cover-fallback">{book.title}</div>
            ) : (
              <img
                className="detail-cover"
                src={getCoverUrl(book.id)}
                alt={book.title}
                onError={() => setCoverError(true)}
              />
            )}

            <div className="detail-meta">
              {book.seriesName && (
                <p className="detail-eyebrow">
                  {book.seriesName}{book.seriesIndex != null && seriesTotal > 0 ? ` · Book ${book.seriesIndex} of ${seriesTotal}` : ''}
                </p>
              )}

              <h1 className="detail-title">{book.title}</h1>
              <p className="detail-author">{book.authors.join(', ')}</p>

              <div className="detail-pills">
                {book.genres.map(g => <span key={g} className="detail-pill">{g}</span>)}
                {book.publishedDate && <span className="detail-pill">{book.publishedDate.slice(0, 4)}</span>}
              </div>

              {book.description && (
                <div
                  className="detail-description"
                  dangerouslySetInnerHTML={{ __html: book.description }}
                />
              )}

              <div className="detail-actions">
                <button className="btn-primary" onClick={handleRead}>
                  <Play size={14} fill="currentColor" />
                  {book.percentage > 0 ? 'Continue reading' : 'Read'}
                </button>
                <button className="btn-outline" onClick={() => bookId && onEditMetadata(bookId)}>
                  <Pencil size={14} />
                  Edit metadata
                </button>
                <button className="btn-outline" onClick={() => bookId && onEditMetadata(bookId, true)}>
                  <Download size={14} />
                  Fetch info
                </button>
                {book.percentage > 0 && book.lastReadUtc && (
                  <span className="detail-whisper">
                    {book.percentage}% · {timeAgo(book.lastReadUtc)}
                  </span>
                )}
              </div>

              {book.percentage > 0 && (
                <div className="detail-progress">
                  <div className="detail-progress-fill" style={{ width: `${book.percentage}%` }} />
                </div>
              )}
            </div>
          </div>

          {!book.fileFound && (
            <div className="detail-warning">⚠ File not found — Relink coming in a future update</div>
          )}

          {/* More in this series */}
          {seriesBooks.length > 1 && (
            <div className="detail-series-section">
              <h2 className="detail-series-label">More in this series</h2>
              <div className="detail-series-scroll">
                {seriesBooks.map(b => (
                  <SeriesCard
                    key={b.id}
                    book={b}
                    seriesTotal={seriesTotal}
                    onOpen={() => { onClose(); setTimeout(() => onEditMetadata(b.id), 0); }}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="status-msg">Loading…</p>
      )}
    </motion.div>
  );
}

function SeriesCard({ book, seriesTotal, onOpen }: { book: BookSummaryDto; seriesTotal: number; onOpen: () => void }) {
  const [err, setErr] = useState(false);
  const setOpenBookId = useLibrisStore(s => s.setOpenBookId);
  const setReaderVisible = useLibrisStore(s => s.setReaderVisible);

  const openReader = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenBookId(book.id);
    setReaderVisible(true);
  };

  return (
    <motion.div
      className="series-card"
      whileHover={{ scale: 1.04 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      onClick={onOpen}
      onDoubleClick={openReader}
    >
      <div className="series-cover-wrap">
        {err ? (
          <div style={{ width: '100%', height: '100%', background: 'var(--bg-raised)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--fg-muted)', padding: 6, textAlign: 'center' }}>
            {book.title}
          </div>
        ) : (
          <img className="series-cover" src={getCoverUrl(book.id)} alt={book.title} onError={() => setErr(true)} />
        )}
        {book.seriesIndex != null && (
          <div className="series-label">{book.seriesIndex} of {seriesTotal}</div>
        )}
      </div>
    </motion.div>
  );
}
