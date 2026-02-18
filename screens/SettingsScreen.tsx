import React, { useRef } from 'react';
import { Download, Upload, Trash2, Info, AlertTriangle, Moon, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';

const SettingsScreen: React.FC = () => {
  const { state, dispatch } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `reading_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileObj = event.target.files && event.target.files[0];
    if (!fileObj) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target?.result as string);
            if (json.books && Array.isArray(json.books)) {
                if(confirm('This will overwrite your current library (metadata only). Continue?')) {
                    dispatch({ type: 'LOAD_DATA', payload: json });
                    alert('Library metadata imported successfully! Note: PDF files are not included in JSON backup.');
                }
            } else {
                alert('Invalid file format.');
            }
        } catch (error) {
            alert('Error parsing JSON file.');
        }
    };
    reader.readAsText(fileObj);
    
    // Reset input
    if (event.target) event.target.value = '';
  };

  const handleClearData = () => {
      if (confirm('WARNING: This will permanently delete ALL your books and notes, including uploaded PDF files. This action cannot be undone. Are you sure?')) {
          dispatch({ type: 'CLEAR_DATA' });
          alert('All data cleared.');
      }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="bg-white dark:bg-gray-800 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* About */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
             <div className="flex items-center space-x-3 mb-4">
                 <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                     <Info size={24} />
                 </div>
                 <h2 className="font-bold text-gray-900 dark:text-white text-lg">About</h2>
             </div>
             <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                 Reading Tracker v1.2.0 (PDF Edition)
                 <br/>
                 A local-first app to track reading progress and store PDF books directly in your browser.
             </p>
        </div>

        {/* Appearance (Mobile Only mostly, since Sidebar has it for Desktop) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden md:hidden">
            <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
                <h2 className="font-semibold text-gray-900 dark:text-white">Appearance</h2>
            </div>
             <button 
                onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <div className="flex items-center">
                    {state.theme === 'dark' ? <Moon size={20} className="text-gray-500 dark:text-gray-400 mr-4" /> : <Sun size={20} className="text-gray-500 mr-4" />}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</span>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${state.theme === 'dark' ? 'bg-[#2E7D32]' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${state.theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
            </button>
        </div>

        {/* Data Management */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
                <h2 className="font-semibold text-gray-900 dark:text-white">Data Management</h2>
            </div>
            
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                <button onClick={handleExport} className="w-full flex items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                    <Download size={20} className="text-gray-500 dark:text-gray-400 mr-4" />
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Export Library Metadata</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Save your book list & notes to JSON</p>
                    </div>
                </button>

                <button onClick={handleImportClick} className="w-full flex items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left">
                    <Upload size={20} className="text-gray-500 dark:text-gray-400 mr-4" />
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Import Library Metadata</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Restore from a backup file</p>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".json" 
                        className="hidden" 
                    />
                </button>
            </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 overflow-hidden">
             <div className="px-6 py-4 border-b border-red-50 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
                <div className="flex items-center text-red-600 dark:text-red-400">
                    <AlertTriangle size={18} className="mr-2" />
                    <h2 className="font-semibold text-sm">Danger Zone</h2>
                </div>
            </div>
            <button onClick={handleClearData} className="w-full flex items-center px-6 py-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left text-red-600 dark:text-red-400">
                <Trash2 size={20} className="mr-4" />
                <div>
                    <p className="text-sm font-medium">Clear All Data</p>
                    <p className="text-xs text-red-400 dark:text-red-400/70">Permanently remove all books, PDFs, and notes</p>
                </div>
            </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;