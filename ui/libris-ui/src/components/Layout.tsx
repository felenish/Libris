import type { ReactNode } from 'react';

interface LayoutProps {
  children?: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <header className="top-bar">
        {/* TopBar — Phase 9 */}
      </header>
      <main className="shelf-area">
        {children}
      </main>
    </div>
  );
}
