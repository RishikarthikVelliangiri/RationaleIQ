import React, { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

const ShortcutsHelp = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleShow = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    window.addEventListener('show-shortcuts-help', handleShow);
    window.addEventListener('close-active-modal', handleClose);

    return () => {
      window.removeEventListener('show-shortcuts-help', handleShow);
      window.removeEventListener('close-active-modal', handleClose);
    };
  }, []);

  if (!isOpen) return null;

  const shortcuts = [
    { keys: ['Ctrl', 'N'], description: 'Create new decision', mac: ['⌘', 'N'] },
    { keys: ['Ctrl', 'K'], description: 'Focus search', mac: ['⌘', 'K'] },
    { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts', mac: ['⌘', '/'] },
    { keys: ['Esc'], description: 'Close modal or dialog', mac: ['Esc'] },
  ];

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg">
              <Keyboard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-4 space-y-3">
          {shortcuts.map((shortcut, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1">
                {(isMac ? shortcut.mac : shortcut.keys).map((key, keyIdx) => (
                  <React.Fragment key={keyIdx}>
                    {keyIdx > 0 && (
                      <span className="text-gray-400 dark:text-gray-500 mx-0.5">+</span>
                    )}
                    <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono font-semibold text-gray-900 dark:text-white shadow-sm">
                      {key}
                    </kbd>
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-b-xl border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">Esc</kbd> or <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">{isMac ? '⌘' : 'Ctrl'}</kbd> + <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">/</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsHelp;
