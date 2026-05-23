import { useState } from 'react';
import { Layout } from './components/Layout';
import { ShelfList } from './components/ShelfList';
import { BookDetailPanel } from './components/BookDetailPanel';
import { useLibrisStore } from './store/useLibrisStore';

function App() {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
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
      <BookDetailPanel bookId={selectedBookId} onClose={handleDetailClose} />
    </>
  );
}

export default App;
