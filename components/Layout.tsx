import React from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-full w-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-hidden text-gray-900 dark:text-gray-100">
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>
      {/* Mobile sidebar placeholder */}
      <div className="md:hidden absolute bottom-0 w-full z-50 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
      </div>

      <main className="flex-1 h-full overflow-hidden flex flex-col relative">
        {children}
      </main>
    </div>
  );
};

export default Layout;