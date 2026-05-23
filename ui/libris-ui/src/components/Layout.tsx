import type { ReactNode } from 'react';
import { TopBar } from './TopBar';

interface LayoutProps {
  children?: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <TopBar />
      <main className="shelf-area">
        {children}
      </main>
    </div>
  );
}
