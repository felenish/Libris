import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Layout } from './components/Layout';
import { ShelfList } from './components/ShelfList';
import { BookDetailPanel } from './components/BookDetailPanel';
import { EpubReader } from './components/EpubReader';
import { MetadataEditor } from './components/MetadataEditor';
import { useLibrisStore } from './store/useLibrisStore';

function App() {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [editorBookId, setEditorBookId] = useState<string | null>(null);
  const setOpenBookId = useLibrisStore(s => s.setOpenBookId);

  const handleBookSelect = (id: string) => {
    setSelectedBookId(id);
    setOpenBookId(id);
  };

  const handleDetailClose = () => {
    setSelectedBookId(null);
    setOpenBookId(null);
  };

  return (
    <>
      <Layout>
        <ShelfList onBookSelect={handleBookSelect} />
      </Layout>
      <BookDetailPanel
        bookId={selectedBookId}
        onClose={handleDetailClose}
        onEditMetadata={id => setEditorBookId(id)}
      />
      <EpubReader />
      <AnimatePresence>
        {editorBookId && (
          <MetadataEditor
            bookId={editorBookId}
            onClose={() => setEditorBookId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
