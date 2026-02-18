import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, NotebookTabs, Settings } from 'lucide-react';
import { COLORS } from '../types';

const TabBar: React.FC = () => {
  const getLinkClass = ({ isActive }: { isActive: boolean }) => {
    return `flex flex-col items-center justify-center w-full h-full space-y-1 ${
      isActive ? 'text-[#2E7D32]' : 'text-gray-400'
    }`;
  };

  return (
    <nav className="h-16 bg-white border-t border-gray-200 flex justify-around items-center shrink-0 z-50">
      <NavLink to="/" className={getLinkClass}>
        <BookOpen size={24} />
        <span className="text-xs font-medium">Library</span>
      </NavLink>
      <NavLink to="/notes" className={getLinkClass}>
        <NotebookTabs size={24} />
        <span className="text-xs font-medium">Notes</span>
      </NavLink>
      <NavLink to="/settings" className={getLinkClass}>
        <Settings size={24} />
        <span className="text-xs font-medium">Settings</span>
      </NavLink>
    </nav>
  );
};

export default TabBar;