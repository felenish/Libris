import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

interface FieldChecks {
  title: boolean;
  authors: boolean;
  publisher: boolean;
  publishedDate: boolean;
  description: boolean;
  isbn: boolean;
  language: boolean;
  genres: boolean;
  cover: boolean;
}

interface MetadataEditorProps {
  bookId: string;
  onClose: () => void;
}

export function MetadataEditor({ bookId, onClose }: MetadataEditorProps) {
  const queryClient = useQueryClient();
  const { data: book } = useQuery({
    queryKey: ['book', bookId],
    queryFn: () => getBook(bookId),
  });

  const [form, setForm] = useState<FormState | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<ExternalBookMetadataDto[]>([]);
  const [selectedResult, setSelectedResult] = useState<ExternalBookMetadataDto | null>(null);
  const [fieldChecks, setFieldChecks] = useState<FieldChecks | null>(null);
  const [pendingCoverUrl, setPendingCoverUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const formInitialized = useRef(false);

  useEffect(() => {
    if (book && !formInitialized.current) {
      formInitialized.current = true;
      setForm({
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
      });
    }
  }, [book]);

  const handleSearch = async () => {
    if (!form?.title) return;
    setIsSearching(true);
    setHasSearched(false);
    setSearchError(null);
    setSearchResults([]);
    setSelectedResult(null);
    try {
      const results = await searchMetadata(form.title, form.authors[0]);
      setSearchResults(results);
      setHasSearched(true);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (result: ExternalBookMetadataDto) => {
    setSelectedResult(result);
    setFieldChecks({
      title: !!result.title,
      authors: result.authors.length > 0,
      publisher: !!result.publisher,
      publishedDate: !!result.publishedDate,
      description: !!result.description,
      isbn: !!result.isbn,
      language: !!result.language,
      genres: result.genres.length > 0,
      cover: !!result.coverUrl,
    });
  };

  const handleApplyToForm = () => {
    if (!selectedResult || !fieldChecks || !form) return;
    setForm(prev => prev ? {
      ...prev,
      title: fieldChecks.title && selectedResult.title ? selectedResult.title : prev.title,
      authors: fieldChecks.authors && selectedResult.authors.length > 0 ? selectedResult.authors : prev.authors,
      publisher: fieldChecks.publisher && selectedResult.publisher ? selectedResult.publisher : prev.publisher,
      publishedDate: fieldChecks.publishedDate && selectedResult.publishedDate ? selectedResult.publishedDate : prev.publishedDate,
      description: fieldChecks.description && selectedResult.description ? selectedResult.description : prev.description,
      isbn: fieldChecks.isbn && selectedResult.isbn ? selectedResult.isbn : prev.isbn,
      language: fieldChecks.language && selectedResult.language ? selectedResult.language : prev.language,
      genres: fieldChecks.genres && selectedResult.genres.length > 0 ? selectedResult.genres : prev.genres,
    } : prev);
    setPendingCoverUrl(fieldChecks.cover && selectedResult.coverUrl ? selectedResult.coverUrl : null);
    setSelectedResult(null);
    setSearchResults([]);
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
      // save failed
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
      transition={{ duration: 0.15 }}
      onClick={onClose}
    >
      <motion.div
        className="editor-modal"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="editor-header">
          <span>Edit Metadata</span>
          <button className="editor-close-btn" onClick={onClose}>✕</button>
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

              <div className="form-row-inline">
                <div className="form-row">
                  <label className="form-label">Publisher</label>
                  <input className="form-input" value={form.publisher}
                    onChange={e => setForm(f => f ? { ...f, publisher: e.target.value } : f)} />
                </div>
                <div className="form-row">
                  <label className="form-label">Published</label>
                  <input className="form-input" value={form.publishedDate}
                    onChange={e => setForm(f => f ? { ...f, publishedDate: e.target.value } : f)} />
                </div>
              </div>

              <div className="form-row-inline">
                <div className="form-row">
                  <label className="form-label">ISBN</label>
                  <input className="form-input" value={form.isbn}
                    onChange={e => setForm(f => f ? { ...f, isbn: e.target.value } : f)} />
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

              {pendingCoverUrl && (
                <p className="pending-cover-note">
                  Cover image will be downloaded from search result on save.{' '}
                  <button className="link-btn" onClick={() => setPendingCoverUrl(null)}>Remove</button>
                </p>
              )}

              {/* Search section */}
              <p className="editor-section-title">Search for Metadata</p>

              <div className="search-controls">
                <button className="btn-secondary" onClick={handleSearch} disabled={isSearching || !form.title}>
                  {isSearching ? 'Searching…' : 'Search Online'}
                </button>
              </div>

              {searchError && (
                <p className="search-feedback search-feedback-error">{searchError}</p>
              )}
              {hasSearched && !searchError && searchResults.length === 0 && (
                <p className="search-feedback">No results found. Try a shorter or different title.</p>
              )}

              {searchResults.length > 0 && !selectedResult && (
                <div className="search-results">
                  {searchResults.map((r, i) => (
                    <button key={i} className="search-result-item" onClick={() => handleSelectResult(r)}>
                      <div className="result-title">{r.title}</div>
                      <div className="result-meta">
                        {r.authors.slice(0, 2).join(', ')}
                        {r.publishedDate ? ` · ${r.publishedDate}` : ''}
                        {` · ${r.genres.slice(0, 2).join(', ')}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedResult && fieldChecks && (
                <div className="field-checks">
                  <p className="field-checks-title">
                    From <strong>{selectedResult.title}</strong> — select fields to apply:
                  </p>
                  {selectedResult.title && (
                    <FieldCheck label="Title" value={selectedResult.title}
                      checked={fieldChecks.title}
                      onChange={v => setFieldChecks(c => c ? { ...c, title: v } : c)} />
                  )}
                  {selectedResult.authors.length > 0 && (
                    <FieldCheck label="Authors" value={selectedResult.authors.join(', ')}
                      checked={fieldChecks.authors}
                      onChange={v => setFieldChecks(c => c ? { ...c, authors: v } : c)} />
                  )}
                  {selectedResult.publisher && (
                    <FieldCheck label="Publisher" value={selectedResult.publisher}
                      checked={fieldChecks.publisher}
                      onChange={v => setFieldChecks(c => c ? { ...c, publisher: v } : c)} />
                  )}
                  {selectedResult.publishedDate && (
                    <FieldCheck label="Published" value={selectedResult.publishedDate}
                      checked={fieldChecks.publishedDate}
                      onChange={v => setFieldChecks(c => c ? { ...c, publishedDate: v } : c)} />
                  )}
                  {selectedResult.description && (
                    <FieldCheck label="Description" value={selectedResult.description.slice(0, 80) + (selectedResult.description.length > 80 ? '…' : '')}
                      checked={fieldChecks.description}
                      onChange={v => setFieldChecks(c => c ? { ...c, description: v } : c)} />
                  )}
                  {selectedResult.isbn && (
                    <FieldCheck label="ISBN" value={selectedResult.isbn}
                      checked={fieldChecks.isbn}
                      onChange={v => setFieldChecks(c => c ? { ...c, isbn: v } : c)} />
                  )}
                  {selectedResult.language && (
                    <FieldCheck label="Language" value={selectedResult.language}
                      checked={fieldChecks.language}
                      onChange={v => setFieldChecks(c => c ? { ...c, language: v } : c)} />
                  )}
                  {selectedResult.genres.length > 0 && (
                    <FieldCheck label="Genres" value={selectedResult.genres.join(', ')}
                      checked={fieldChecks.genres}
                      onChange={v => setFieldChecks(c => c ? { ...c, genres: v } : c)} />
                  )}
                  {selectedResult.coverUrl && (
                    <FieldCheck label="Cover image" value="Download from provider"
                      checked={fieldChecks.cover}
                      onChange={v => setFieldChecks(c => c ? { ...c, cover: v } : c)} />
                  )}
                  <div className="field-checks-actions">
                    <button className="btn-secondary" onClick={() => setSelectedResult(null)}>Back</button>
                    <button className="btn-primary" onClick={handleApplyToForm}>Apply to Form</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="editor-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={isSaving || !form}>
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </motion.div>
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

function FieldCheck({ label, value, checked, onChange }: {
  label: string; value: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="field-check-row">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span style={{ minWidth: 80, color: 'var(--text-muted)', fontSize: 11 }}>{label}</span>
      <span className="field-check-value">{value}</span>
    </label>
  );
}
