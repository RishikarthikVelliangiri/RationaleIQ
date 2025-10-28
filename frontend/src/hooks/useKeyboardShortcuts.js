import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Global keyboard shortcuts hook
 * Usage: useKeyboardShortcuts()
 * 
 * Shortcuts:
 * - Ctrl/Cmd + N: New Decision
 * - Ctrl/Cmd + K: Focus Search
 * - Ctrl/Cmd + /: Show Shortcuts Help
 * - Esc: Close modals/overlays
 */
export const useKeyboardShortcuts = (options = {}) => {
  const navigate = useNavigate();
  const {
    onNewDecision,
    onSearch,
    onClose,
    onHelp,
    disabled = false
  } = options;

  useEffect(() => {
    if (disabled) return;

    const handleKeyPress = (e) => {
      // Check for Ctrl/Cmd key
      const isMod = e.ctrlKey || e.metaKey;

      // Ignore shortcuts when typing in input/textarea
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
      const isContentEditable = e.target.isContentEditable;

      // Ctrl/Cmd + N: New Decision
      if (isMod && e.key === 'n' && !isTyping) {
        e.preventDefault();
        if (onNewDecision) {
          onNewDecision();
        } else {
          navigate('/new-decision');
        }
        return;
      }

      // Ctrl/Cmd + K: Focus Search
      if (isMod && e.key === 'k' && !isTyping) {
        e.preventDefault();
        if (onSearch) {
          onSearch();
        } else {
          // Try to find search input (dashboard quick search or search page)
          const searchInput = document.querySelector('input[placeholder*="Ask anything"], input[type="search"], input[placeholder*="Search"]');
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          } else {
            // Navigate to search page if no search input found
            navigate('/search');
          }
        }
        return;
      }

      // Ctrl/Cmd + /: Show Shortcuts Help
      if (isMod && e.key === '/' && !isTyping && !isContentEditable) {
        e.preventDefault();
        if (onHelp) {
          onHelp();
        } else {
          // Dispatch custom event to show help modal
          window.dispatchEvent(new CustomEvent('show-shortcuts-help'));
        }
        return;
      }

      // Escape: Close modals/overlays
      if (e.key === 'Escape') {
        if (onClose) {
          onClose();
        } else {
          // Dispatch custom event to close active modals
          window.dispatchEvent(new CustomEvent('close-active-modal'));
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [navigate, onNewDecision, onSearch, onClose, onHelp, disabled]);
};

export default useKeyboardShortcuts;
