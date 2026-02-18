import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, NotebookTabs, Settings, PlusCircle, Moon, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Sidebar: React.FC = () => {
  const { state, dispatch } = useApp();

  const getLinkClass = ({ isActive }: { isActive: boolean }) => {
    return `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      isActive 
        ? 'bg-[#2E7D32]/10 text-[#2E7D32] dark:text-green-400 font-semibold' 
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
    }`;
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col shrink-0 transition-colors duration-300">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="text-[#2E7D32] dark:text-green-500" />
            <span>Tracker</span>
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <NavLink to="/" className={getLinkClass}>
          <BookOpen size={20} />
          <span>Library</span>
        </NavLink>
        <NavLink to="/notes" className={getLinkClass}>
          <NotebookTabs size={20} />
          <span>Notes</span>
        </NavLink>
        <NavLink to="/settings" className={getLinkClass}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
        {/* Dark Mode Toggle */}
        <button 
            onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
            className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        >
            <div className="flex items-center gap-2">
                {state.theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                <span>{state.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
        </button>

        <NavLink to="/add-book" className="flex items-center justify-center w-full py-3 bg-[#2E7D32] text-white rounded-xl font-semibold shadow-sm hover:bg-[#1b5e20] dark:hover:bg-[#388e3c] transition-colors gap-2">
            <PlusCircle size={20} />
            <span>Add Book</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;