import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNavigation = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: '#F8FAFC' }}>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} />

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-0 min-w-0">
        <TopBar title={title} onMenuToggle={handleSidebarToggle} menuOpen={sidebarOpen} />
        <MobileNav open={sidebarOpen} onToggle={handleSidebarToggle} />
        <main className="flex-1 pt-16 md:pt-16 overflow-auto">
          <div
            className="p-3 md:p-4 lg:p-6 max-w-[1440px] mx-auto w-full"
            onClick={handleNavigation}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
