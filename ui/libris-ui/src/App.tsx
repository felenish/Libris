import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Layout } from './components/Layout';
import { ShelfList } from './components/ShelfList';
import { BookDetailPanel } from './components/BookDetailPanel';
import { EpubReader } from './components/EpubReader';
import { MetadataEditor } from './components/MetadataEditor';
import { useLibrisStore } from './store/useLibrisStore';

function App() {
  const [detailBookId, setDetailBookId] = useState<string | null>(null);
  const [editorBookId, setEditorBookId] = useState<string | null>(null);
  const [editorFocusSearch, setEditorFocusSearch] = useState(false);
  const setOpenBookId = useLibrisStore(s => s.setOpenBookId);

  const handleBookSelect = (id: string) => {
    setDetailBookId(id);
    setOpenBookId(id);
  };

  const handleDetailClose = () => {
    setDetailBookId(null);
  };

  const handleEditMetadata = (id: string, focusSearch = false) => {
    setEditorBookId(id);
    setEditorFocusSearch(focusSearch);
  };

  const handleEditorClose = () => {
    setEditorBookId(null);
    setEditorFocusSearch(false);
  };

  return (
    <>
      <Layout>
        <ShelfList onBookSelect={handleBookSelect} />
      </Layout>

      <AnimatePresence>
        {detailBookId && (
          <BookDetailPanel
            key={detailBookId}
            bookId={detailBookId}
            onClose={handleDetailClose}
            onEditMetadata={handleEditMetadata}
          />
        )}
      </AnimatePresence>

      <EpubReader />

      <AnimatePresence>
        {editorBookId && (
          <MetadataEditor
            key={editorBookId}
            bookId={editorBookId}
            focusSearch={editorFocusSearch}
            onClose={handleEditorClose}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
