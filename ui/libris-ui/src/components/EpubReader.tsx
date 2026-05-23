import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ePub from 'epubjs';
import { X } from 'lucide-react';
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

const CIRCUMFERENCE = 2 * Math.PI * 28;

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
  const [currentChapter, setCurrentChapter] = useState('');
  const [progress, setProgress] = useState(0);
  const [fontSize, setFontSize] = useState(100);
  const [orbOpen, setOrbOpen] = useState(false);

  const { data: bookDetail } = useQuery({
    queryKey: ['book', openBookId],
    queryFn: () => getBook(openBookId!),
    enabled: openBookId !== null,
  });

  useEffect(() => { openBookIdRef.current = openBookId; }, [openBookId]);

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
      manager: 'continuous',
      flow: 'scrolled',
      width: '100%',
      height: '100%',
      allowScriptedContent: true,
    });
    renditionRef.current = rendition;

    rendition.themes.register('libris', {
      'html, body': {
        'background': '#0c0c10 !important',
        'color': 'rgba(232,230,223,0.85) !important',
      },
      // Force all elements to inherit the body color so epub-specific
      // inline styles and element-level rules can't bleed through as dark text.
      '*': {
        'color': 'inherit !important',
      },
      'body': {
        'font-family': '"Source Serif 4", Georgia, serif !important',
        'font-size': '15px !important',
        'line-height': '1.7 !important',
        'max-width': '580px',
        'margin': '0 auto !important',
        'padding': '70px 24px 140px !important',
      },
      'h1, h2, h3, h4': {
        'font-family': '"Inter", system-ui, sans-serif !important',
      },
      'p': { 'margin': '0 0 14px !important' },
      'img': { 'max-width': '100% !important', 'height': 'auto !important' },
      'a': { 'color': '#c96442 !important' },
    });
    rendition.themes.select('libris');

    book.loaded.navigation.then((nav: { toc: TocItem[] }) => {
      setToc(nav.toc);
      tocRef.current = nav.toc;
    });

    // Generate locations then immediately refresh progress from current position.
    // percentage is always 0 until locations are ready.
    book.ready.then(async () => {
      await book.locations.generate(1024);
      const loc = renditionRef.current?.currentLocation();
      if (loc?.start?.cfi) {
        const pct = Math.round((loc.start.percentage ?? 0) * 100);
        setProgress(pct);
        lastLocationRef.current = { cfi: loc.start.cfi, percentage: loc.start.percentage ?? 0 };
      }
    });

    getProgress(openBookId)
      .then(p => {
        if (p?.currentCfi) {
          rendition.display(p.currentCfi).catch(console.error);
        } else {
          rendition.display().catch(console.error);
        }
      })
      .catch(() => { rendition.display().catch(console.error); });

    // relocated fires on spine-item changes — good for chapter tracking.
    rendition.on('relocated', (location: { start: { cfi: string; percentage: number; href: string } }) => {
      const cfi = location.start?.cfi ?? '';
      const href = location.start?.href ?? '';
      const pct = Math.round((location.start?.percentage ?? 0) * 100);

      setProgress(pct);
      setCurrentChapter(findChapterLabel(tocRef.current, href));
      lastLocationRef.current = { cfi, percentage: location.start?.percentage ?? 0 };

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        saveProgress(openBookId, cfi, location.start?.percentage ?? 0).catch(() => {});
      }, 2000);
    });

    // Continuous manager creates a single scrollable stage div as the first child
    // of our container. Attach one scroll listener to it after first render.
    rendition.on('rendered', () => {
      const stage = containerRef.current?.firstElementChild as HTMLElement | null;
      if (!stage || stage.dataset.librisScroll) return;
      stage.dataset.librisScroll = '1';
      stage.addEventListener('scroll', () => {
        const loc = renditionRef.current?.currentLocation();
        if (!loc?.start?.cfi) return;
        const pct = Math.round((loc.start.percentage ?? 0) * 100);
        setProgress(pct);
        lastLocationRef.current = { cfi: loc.start.cfi, percentage: loc.start.percentage ?? 0 };
      }, { passive: true });
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

  useEffect(() => {
    if (!readerVisible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); handleClose(); }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [readerVisible]);

  const handleClose = () => {
    flushProgress();
    setReaderVisible(false);
    setOrbOpen(false);
  };

  const arcOffset = CIRCUMFERENCE * 0.25;
  const arcDash = CIRCUMFERENCE * (progress / 100);

  return (
    <AnimatePresence>
      {readerVisible && openBookId && (
        <motion.div
          className="reader-overlay"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.26, ease: 'easeOut' }}
        >
          {/* Reading area — epub.js owns this div entirely */}
          <div className="reader-content" ref={containerRef} />

          {/* Floating close pill */}
          <button className="reader-close-pill" onClick={handleClose}>
            <X size={13} />
            Close
          </button>

          {/* Floating progress orb */}
          <button
            className="reader-orb"
            onClick={() => setOrbOpen(o => !o)}
            aria-label="Reading progress and settings"
          >
            <svg
              className="reader-orb-svg"
              width="64"
              height="64"
              viewBox="0 0 64 64"
            >
              {/* Dashed track */}
              <circle
                cx="32" cy="32" r="28"
                stroke="rgba(232,230,223,0.18)"
                strokeWidth="1.4"
                fill="none"
                strokeDasharray="2 3"
              />
              {/* Accent arc */}
              {progress > 0 && (
                <circle
                  cx="32" cy="32" r="28"
                  stroke="#c96442"
                  strokeWidth="2.6"
                  fill="none"
                  strokeDasharray={`${arcDash} ${CIRCUMFERENCE}`}
                  strokeDashoffset={arcOffset}
                  transform="rotate(-90 32 32)"
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div className="reader-orb-inner">
              <span className="reader-orb-pct">{progress}%</span>
            </div>
          </button>

          {/* Bottom whisper */}
          <div className="reader-whisper">
            {bookDetail?.title ?? ''}{currentChapter ? ` · ${currentChapter}` : ''}
          </div>

          {/* Orb popover */}
          <AnimatePresence>
            {orbOpen && (
              <motion.div
                className="reader-orb-popover"
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.15 }}
              >
                {toc.length > 0 && (
                  <div className="orb-popover-section">
                    <p className="orb-popover-label">Contents</p>
                    <ul className="toc-list">
                      {toc.map(item => (
                        <li key={item.id}>
                          <button
                            className="toc-item"
                            onClick={() => { renditionRef.current?.display(item.href); setOrbOpen(false); }}
                          >
                            {item.label.trim()}
                          </button>
                          {item.subitems?.map(sub => (
                            <button
                              key={sub.id}
                              className="toc-item toc-item-sub"
                              onClick={() => { renditionRef.current?.display(sub.href); setOrbOpen(false); }}
                            >
                              {sub.label.trim()}
                            </button>
                          ))}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="orb-popover-section" style={{ marginBottom: 0 }}>
                  <p className="orb-popover-label">Text size</p>
                  <div className="font-size-row">
                    <button className="font-size-btn" onClick={() => setFontSize(f => Math.max(70, f - 10))}>A−</button>
                    <span className="font-size-value">{fontSize}%</span>
                    <button className="font-size-btn" onClick={() => setFontSize(f => Math.min(200, f + 10))}>A+</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
