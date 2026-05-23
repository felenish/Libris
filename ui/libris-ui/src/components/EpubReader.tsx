import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ePub from 'epubjs';
import { useQuery } from '@tanstack/react-query';
import { getBook } from '../api/books';
import { getProgress, saveProgress } from '../api/progress';
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLocationRef = useRef<{ cfi: string; percentage: number } | null>(null);
  const openBookIdRef = useRef<string | null>(null);

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
    openBookIdRef.current = openBookId;
  }, [openBookId]);

  const flushProgress = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const id = openBookIdRef.current;
    const loc = lastLocationRef.current;
    if (id && loc) {
      saveProgress(id, loc.cfi, loc.percentage).catch(() => {});
    }
  };

  useEffect(() => {
    if (!readerVisible || !openBookId || !containerRef.current) return;

    bookRef.current?.destroy();
    lastLocationRef.current = null;

    const book = ePub(`/api/epub/${openBookId}/content/`);
    bookRef.current = book;

    const rendition = book.renderTo(containerRef.current, {
      width: '100%',
      height: '100%',
      spread: 'none',
      allowScriptedContent: true,
    });
    renditionRef.current = rendition;

    book.loaded.navigation.then((nav: { toc: TocItem[] }) => {
      setToc(nav.toc);
      tocRef.current = nav.toc;
    });

    book.ready.then(() => {
      book.locations.generate(1024);
    });

    // Resume from saved CFI or start from beginning
    getProgress(openBookId)
      .then(p => {
        if (p?.currentCfi) {
          rendition.display(p.currentCfi).catch(console.error);
        } else {
          rendition.display().catch(console.error);
        }
      })
      .catch(() => {
        rendition.display().catch(console.error);
      });

    rendition.on('relocated', (location: { start: { cfi: string; percentage: number; href: string } }) => {
      const pct = Math.round((location.start?.percentage ?? 0) * 100);
      const cfi = location.start?.cfi ?? '';
      const href = location.start?.href ?? '';

      setProgress(pct);
      setCurrentChapter(findChapterLabel(tocRef.current, href));
      lastLocationRef.current = { cfi, percentage: location.start?.percentage ?? 0 };

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        saveProgress(openBookId, cfi, location.start?.percentage ?? 0).catch(() => {});
      }, 2000);
    });

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      book.destroy();
      bookRef.current = null;
      renditionRef.current = null;
      lastLocationRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readerVisible, openBookId]);

  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${fontSize}%`);
  }, [fontSize]);

  // Save on page unload (WPF window close)
  useEffect(() => {
    const handler = () => {
      const id = openBookIdRef.current;
      const loc = lastLocationRef.current;
      if (id && loc) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        fetch(`/api/books/${id}/progress`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cfi: loc.cfi, percentage: loc.percentage }),
          keepalive: true,
        }).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const handleClose = () => {
    flushProgress();
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
