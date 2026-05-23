import { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -440 : 440, behavior: 'smooth' });
  };

  return (
    <div className="shelf-section">
      <div className="shelf-header">
        <h2 className="shelf-label">{label}</h2>
        <div className="shelf-chevrons">
          <button className="scroll-btn" onClick={() => scroll('left')} aria-label="Scroll left">
            <ChevronLeft size={16} />
          </button>
          <button className="scroll-btn" onClick={() => scroll('right')} aria-label="Scroll right">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="shelf-row-wrap">
        <div className="shelf-scroll" ref={scrollRef}>
          {books.map(book => (
            <BookCard key={book.id} book={book} onDetailOpen={onBookSelect} />
          ))}
        </div>
        <div className="shelf-fade" />
      </div>
    </div>
  );
}
