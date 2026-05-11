import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex" style={{ background: '#F8FAFC' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col ml-60 min-w-0">
        <TopBar title={title} />
        <main className="flex-1 pt-16 overflow-auto">
          <div className="p-6 max-w-[1440px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
