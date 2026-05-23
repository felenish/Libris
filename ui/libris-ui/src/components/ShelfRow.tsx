import { useRef } from 'react';
import { BookCard } from './BookCard';
import type { BookSummaryDto } from '../api/types';

interface ShelfRowProps {
  label: string;
  books: BookSummaryDto[];
  onBookSelect: (id: string) => void;
}

export function ShelfRow({ label, books, onBookSelect }: ShelfRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -480 : 480, behavior: 'smooth' });
  };

  return (
    <div className="shelf-section">
      <h2 className="shelf-label">{label}</h2>
      <div className="shelf-row-wrap">
        <button className="scroll-btn scroll-btn-left" onClick={() => scroll('left')}>‹</button>
        <div className="shelf-scroll" ref={scrollRef}>
          {books.map(book => (
            <BookCard key={book.id} book={book} onDetailOpen={onBookSelect} />
          ))}
        </div>
        <button className="scroll-btn scroll-btn-right" onClick={() => scroll('right')}>›</button>
      </div>
    </div>
  );
}
