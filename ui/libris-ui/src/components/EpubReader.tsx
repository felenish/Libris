import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ePub from 'epubjs';
import { useQuery } from '@tanstack/react-query';
import { getBook } from '../api/books';
import { useLibrisStore } from '../store/useLibrisStore';

interface TocItem {
  id: string;
  href: string;
  label: string;
  subitems?: TocItem[];
}

export function EpubReader() {
  const openBookId = useLibrisStore(s => s.openBookId);
  const readerVisible = useLibrisStore(s => s.readerVisible);
  const setReaderVisible = useLibrisStore(s => s.setReaderVisible);

  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renditionRef = useRef<any>(null);

  const [toc, setToc] = useState<TocItem[]>([]);
  const tocRef = useRef<TocItem[]>([]);
  const [tocOpen, setTocOpen] = useState(false);
  const [currentChapter, setCurrentChapter] = useState('');
  const [progress, setProgress] = useState(0);
  const [fontSize, setFontSize] = useState(100);

  const { data: bookDetail } = useQuery({
    queryKey: ['book', openBookId],
    queryFn: () => getBook(openBookId!),
    enabled: openBookId !== null,
  });

  useEffect(() => {
    if (!readerVisible || !openBookId || !containerRef.current) return;

    bookRef.current?.destroy();

    const book = ePub(`/api/epub/${openBookId}/content/`);
    bookRef.current = book;

    const rendition = book.renderTo(containerRef.current, {
      width: '100%',
      height: '100%',
      spread: 'none',
      allowScriptedContent: true,
    });
    renditionRef.current = rendition;

    rendition.display().catch(console.error);

    book.loaded.navigation.then((nav: { toc: TocItem[] }) => {
      setToc(nav.toc);
      tocRef.current = nav.toc;
    });

    book.ready.then(() => {
      book.locations.generate(1024);
    });

    rendition.on('relocated', (location: { start: { percentage: number; href: string } }) => {
      setProgress(Math.round((location.start?.percentage ?? 0) * 100));
      const href = location.start?.href ?? '';
      setCurrentChapter(findChapterLabel(tocRef.current, href));
    });

    return () => {
      book.destroy();
      bookRef.current = null;
      renditionRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readerVisible, openBookId]);

  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${fontSize}%`);
  }, [fontSize]);

  const handleClose = () => {
    setReaderVisible(false);
    setTocOpen(false);
  };

  return (
    <AnimatePresence>
      {readerVisible && openBookId && (
        <motion.div
          className="reader-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* TOC sidebar */}
          <AnimatePresence>
            {tocOpen && (
              <motion.nav
                className="reader-toc"
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              >
                <p className="toc-heading">Contents</p>
                <ul className="toc-list">
                  {toc.map(item => (
                    <li key={item.id}>
                      <button
                        className="toc-item"
                        onClick={() => {
                          renditionRef.current?.display(item.href);
                          setTocOpen(false);
                        }}
                      >
                        {item.label.trim()}
                      </button>
                      {item.subitems?.map(sub => (
                        <button
                          key={sub.id}
                          className="toc-item toc-item-sub"
                          onClick={() => {
                            renditionRef.current?.display(sub.href);
                            setTocOpen(false);
                          }}
                        >
                          {sub.label.trim()}
                        </button>
                      ))}
                    </li>
                  ))}
                </ul>
              </motion.nav>
            )}
          </AnimatePresence>

          {/* Top chrome */}
          <div className="reader-chrome">
            <div className="chrome-left">
              <button className="chrome-btn" onClick={() => setTocOpen(o => !o)} title="Table of Contents">
                ☰
              </button>
            </div>
            <div className="chrome-center">
              <span className="chrome-title">{bookDetail?.title ?? ''}</span>
              {currentChapter && (
                <span className="chrome-chapter"> — {currentChapter}</span>
              )}
            </div>
            <div className="chrome-right">
              <button className="chrome-btn" onClick={() => setFontSize(f => Math.max(70, f - 10))} title="Decrease font size">
                A-
              </button>
              <button className="chrome-btn" onClick={() => setFontSize(f => Math.min(200, f + 10))} title="Increase font size">
                A+
              </button>
              <button className="chrome-btn chrome-close" onClick={handleClose} title="Close reader">
                ✕
              </button>
            </div>
          </div>

          {/* Reading area */}
          <div className="reader-body">
            <button className="reader-nav reader-nav-prev" onClick={() => renditionRef.current?.prev()}>
              ‹
            </button>
            <div className="reader-content" ref={containerRef} />
            <button className="reader-nav reader-nav-next" onClick={() => renditionRef.current?.next()}>
              ›
            </button>
          </div>

          {/* Progress bar */}
          <div className="reader-progress-wrap">
            <div className="reader-progress-track">
              <div className="reader-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="reader-progress-label">{progress}%</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function findChapterLabel(toc: TocItem[], href: string): string {
  for (const item of toc) {
    if (href.includes(item.href)) return item.label.trim();
    if (item.subitems) {
      const found = findChapterLabel(item.subitems, href);
      if (found) return found;
    }
  }
  return '';
}
