import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { getBook, updateMetadata } from '../api/books';
import { searchMetadata, fetchAndApplyMetadata } from '../api/metadata';
import type { ExternalBookMetadataDto } from '../api/types';

interface FormState {
  title: string;
  authors: string[];
  seriesName: string;
  seriesIndex: string;
  genres: string[];
  publisher: string;
  publishedDate: string;
  description: string;
  isbn: string;
  language: string;
}

interface MetadataEditorProps {
  bookId: string;
  focusSearch?: boolean;
  onClose: () => void;
}

function matchQuality(r: ExternalBookMetadataDto): string {
  if (r.isbn) return 'ISBN';
  if (r.authors.length > 0) return 'Title+Author';
  return 'Title';
}

export function MetadataEditor({ bookId, focusSearch, onClose }: MetadataEditorProps) {
  const queryClient = useQueryClient();
  const { data: book } = useQuery({
    queryKey: ['book', bookId],
    queryFn: () => getBook(bookId),
  });

  const [form, setForm] = useState<FormState | null>(null);
  const [initialForm, setInitialForm] = useState<FormState | null>(null);
  const formInitialized = useRef(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<ExternalBookMetadataDto[]>([]);
  const [selectedResult, setSelectedResult] = useState<ExternalBookMetadataDto | null>(null);
  const [pendingCoverUrl, setPendingCoverUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (book && !formInitialized.current) {
      formInitialized.current = true;
      const f: FormState = {
        title: book.title,
        authors: [...book.authors],
        seriesName: book.seriesName ?? '',
        seriesIndex: book.seriesIndex?.toString() ?? '',
        genres: [...book.genres],
        publisher: book.publisher ?? '',
        publishedDate: book.publishedDate ?? '',
        description: book.description ?? '',
        isbn: book.isbn ?? '',
        language: book.language ?? '',
      };
      setForm(f);
      setInitialForm(f);
      setSearchQuery(`${book.title}${book.authors[0] ? ` · ${book.authors[0]}` : ''}`);

      if (focusSearch) {
        // auto-trigger search when opened via "Fetch info"
        triggerSearch(book.title, book.authors[0] ?? '');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book]);

  const triggerSearch = async (title: string, author: string) => {
    if (!title) return;
    setIsSearching(true);
    setHasSearched(false);
    setSearchError(null);
    setSearchResults([]);
    setSelectedResult(null);
    try {
      const results = await searchMetadata(title, author);
      setSearchResults(results);
      setHasSearched(true);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => {
    if (!form) return;
    triggerSearch(form.title, form.authors[0] ?? '');
  };

  const handleSelectResult = (result: ExternalBookMetadataDto) => {
    setSelectedResult(result);
    setForm(prev => prev ? {
      ...prev,
      title: result.title ?? prev.title,
      authors: result.authors.length > 0 ? result.authors : prev.authors,
      publisher: result.publisher ?? prev.publisher,
      publishedDate: result.publishedDate ?? prev.publishedDate,
      description: result.description ?? prev.description,
      isbn: result.isbn ?? prev.isbn,
      language: result.language ?? prev.language,
      genres: result.genres.length > 0 ? result.genres : prev.genres,
    } : prev);
    setPendingCoverUrl(result.coverUrl ?? null);
  };

  const isDirty = form && initialForm && JSON.stringify(form) !== JSON.stringify(initialForm);

  const handleBackdropClick = () => {
    if (isDirty) {
      if (!window.confirm('Discard unsaved changes?')) return;
    }
    onClose();
  };

  const handleSave = async () => {
    if (!form) return;
    setIsSaving(true);
    try {
      await updateMetadata(bookId, {
        title: form.title,
        authors: form.authors,
        seriesName: form.seriesName || null,
        seriesIndex: form.seriesIndex ? parseFloat(form.seriesIndex) : null,
        genres: form.genres,
        publisher: form.publisher || null,
        publishedDate: form.publishedDate || null,
        description: form.description || null,
        isbn: form.isbn || null,
        language: form.language || null,
      });

      if (pendingCoverUrl) {
        await fetchAndApplyMetadata(bookId, {
          title: null, authors: [], publisher: null, publishedDate: null,
          description: null, isbn: null, language: null, genres: [],
          coverUrl: pendingCoverUrl,
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['book', bookId] });
      await queryClient.invalidateQueries({ queryKey: ['shelves'] });
      onClose();
    } catch {
      // save failed silently for MVP
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      className="editor-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={handleBackdropClick}
    >
      <motion.div
        className="editor-modal"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Left pane — form */}
        <div className="editor-left">
          <div className="editor-header">
            <p className="editor-eyebrow">Edit metadata</p>
            <h2 className="editor-book-title">{book?.title ?? '…'}</h2>
          </div>

          <div className="editor-body">
            {!form ? (
              <p className="status-msg">Loading…</p>
            ) : (
              <>
                <div className="form-row">
                  <label className="form-label">Title</label>
                  <input className="form-input" value={form.title}
                    onChange={e => setForm(f => f ? { ...f, title: e.target.value } : f)} />
                </div>

                <div className="form-row">
                  <label className="form-label">Authors</label>
                  <TagInput tags={form.authors}
                    onChange={authors => setForm(f => f ? { ...f, authors } : f)} />
                </div>

                <div className="form-row-inline">
                  <div className="form-row">
                    <label className="form-label">Series</label>
                    <input className="form-input" value={form.seriesName} placeholder="Series name"
                      onChange={e => setForm(f => f ? { ...f, seriesName: e.target.value } : f)} />
                  </div>
                  <div className="form-row">
                    <label className="form-label">#</label>
                    <input className="form-input" value={form.seriesIndex} placeholder="0"
                      onChange={e => setForm(f => f ? { ...f, seriesIndex: e.target.value } : f)} />
                  </div>
                </div>

                <div className="form-row">
                  <label className="form-label">Genres</label>
                  <TagInput tags={form.genres}
                    onChange={genres => setForm(f => f ? { ...f, genres } : f)} />
                </div>

                <div className="form-row-half">
                  <div className="form-row">
                    <label className="form-label">ISBN</label>
                    <input className="form-input" value={form.isbn}
                      onChange={e => setForm(f => f ? { ...f, isbn: e.target.value } : f)} />
                  </div>
                  <div className="form-row">
                    <label className="form-label">Published</label>
                    <input className="form-input" value={form.publishedDate}
                      onChange={e => setForm(f => f ? { ...f, publishedDate: e.target.value } : f)} />
                  </div>
                </div>

                <div className="form-row-half">
                  <div className="form-row">
                    <label className="form-label">Publisher</label>
                    <input className="form-input" value={form.publisher}
                      onChange={e => setForm(f => f ? { ...f, publisher: e.target.value } : f)} />
                  </div>
                  <div className="form-row">
                    <label className="form-label">Language</label>
                    <input className="form-input" value={form.language}
                      onChange={e => setForm(f => f ? { ...f, language: e.target.value } : f)} />
                  </div>
                </div>

                <div className="form-row">
                  <label className="form-label">Description</label>
                  <textarea className="form-input form-textarea" value={form.description}
                    onChange={e => setForm(f => f ? { ...f, description: e.target.value } : f)} />
                </div>
              </>
            )}
          </div>

          <div className="editor-footer">
            <button className="btn-outline" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={isSaving || !form}>
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {/* Right pane — search */}
        <div className="editor-right">
          <p className="editor-eyebrow" style={{ margin: 0 }}>Search metadata</p>

          <div className="editor-search-bar">
            <Search size={13} color="var(--fg-muted)" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Title · Author"
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            />
            <button className="editor-search-btn" onClick={handleSearch} disabled={isSearching}>
              {isSearching ? '…' : <Search size={13} />}
            </button>
          </div>

          <div className="provider-pills">
            <button className="provider-pill active">Open Library ✓</button>
            <button className="provider-pill active">Google Books ✓</button>
          </div>

          {hasSearched && !searchError && (
            <p className="search-result-count">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} · ranked by match
            </p>
          )}
          {searchError && <p className="search-feedback search-feedback-error">{searchError}</p>}
          {hasSearched && !searchError && searchResults.length === 0 && (
            <p className="search-feedback">No results. Try a shorter title.</p>
          )}
          {!hasSearched && !isSearching && (
            <p className="search-feedback">Search to pull metadata from Open Library and Google Books.</p>
          )}

          <div className="search-results">
            {searchResults.map((r, i) => (
              <ResultCard
                key={i}
                result={r}
                selected={selectedResult === r}
                onSelect={() => handleSelectResult(r)}
              />
            ))}
          </div>

          <div className="editor-apply-footer">
            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={!selectedResult}
              onClick={() => { /* already applied on select */ onClose(); }}
            >
              Apply selected →
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ResultCard({ result, selected, onSelect }: {
  result: ExternalBookMetadataDto;
  selected: boolean;
  onSelect: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const quality = matchQuality(result);

  return (
    <button
      className={`search-result-item${selected ? ' selected' : ''}`}
      onClick={onSelect}
    >
      {result.coverUrl && !imgError ? (
        <img
          className="result-thumb"
          src={result.coverUrl}
          alt=""
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="result-thumb-fallback" />
      )}
      <div className="result-info">
        <p className="result-title">{result.title ?? '—'}</p>
        <p className="result-meta">
          {result.authors.slice(0, 2).join(', ')}{result.publishedDate ? ` · ${result.publishedDate.slice(0, 4)}` : ''}
        </p>
        <div className="result-pills">
          <span className={`result-pill result-pill-match`}>{quality}</span>
        </div>
      </div>
    </button>
  );
}

function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [inputValue, setInputValue] = useState('');

  const addTag = (value: string) => {
    const trimmed = value.trim().replace(/,$/, '').trim();
    if (trimmed && !tags.includes(trimmed)) onChange([...tags, trimmed]);
    setInputValue('');
  };

  return (
    <div className="tag-input" onClick={e => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
      {tags.map((tag, i) => (
        <span key={i} className="tag-chip">
          {tag}
          <button className="tag-chip-remove" onClick={() => onChange(tags.filter((_, j) => j !== i))}>×</button>
        </span>
      ))}
      <input
        className="tag-input-field"
        value={inputValue}
        placeholder={tags.length === 0 ? 'Type and press Enter…' : ''}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(inputValue); }
          if (e.key === 'Backspace' && !inputValue && tags.length > 0)
            onChange(tags.slice(0, -1));
        }}
        onBlur={() => { if (inputValue.trim()) addTag(inputValue); }}
      />
    </div>
  );
}
