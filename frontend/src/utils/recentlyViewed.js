/**
 * Recently Viewed Decisions Manager
 * Stores last 5 viewed decisions in localStorage per user
 */

const STORAGE_KEY_PREFIX = 'rationaleiq_recent_decisions';
const MAX_RECENT = 5;

/**
 * Get storage key for current user
 */
const getStorageKey = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user._id ? `${STORAGE_KEY_PREFIX}_${user._id}` : STORAGE_KEY_PREFIX;
  } catch {
    return STORAGE_KEY_PREFIX;
  }
};

/**
 * Clear recently viewed when user changes (on logout/login)
 */
const clearOnUserChange = () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const lastUserId = localStorage.getItem('last_user_id');
    
    // If user changed, clear all old recently viewed data
    if (lastUserId && currentUser._id && lastUserId !== currentUser._id) {
      // Clear old user's data
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}_${lastUserId}`);
    }
    
    // Update last user ID
    if (currentUser._id) {
      localStorage.setItem('last_user_id', currentUser._id);
    }
  } catch (error) {
    console.error('Error checking user change:', error);
  }
};

export const recentlyViewedManager = {
  /**
   * Add a decision to recently viewed
   * @param {Object} decision - Decision object with id, decision (title), category, extractedAt
   */
  add: (decision) => {
    try {
      clearOnUserChange();
      const recent = recentlyViewedManager.getAll();
      
      // Remove if already exists (to avoid duplicates)
      const filtered = recent.filter(d => d.id !== decision.id);
      
      // Add to beginning
      const updated = [
        {
          id: decision.id,
          title: decision.decision,
          category: decision.category,
          extractedAt: decision.extractedAt,
          viewedAt: new Date().toISOString()
        },
        ...filtered
      ].slice(0, MAX_RECENT); // Keep only last 5
      
      localStorage.setItem(getStorageKey(), JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recently viewed:', error);
    }
  },

  /**
   * Get all recently viewed decisions
   * @returns {Array} Array of recent decisions
   */
  getAll: () => {
    try {
      clearOnUserChange();
      const stored = localStorage.getItem(getStorageKey());
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading recently viewed:', error);
      return [];
    }
  },

  /**
   * Clear all recently viewed
   */
  clear: () => {
    try {
      localStorage.removeItem(getStorageKey());
    } catch (error) {
      console.error('Error clearing recently viewed:', error);
    }
  },

  /**
   * Remove a specific decision from recently viewed
   * @param {string} decisionId - Decision ID to remove
   */
  remove: (decisionId) => {
    try {
      const recent = recentlyViewedManager.getAll();
      const filtered = recent.filter(d => d.id !== decisionId);
      localStorage.setItem(getStorageKey(), JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing from recently viewed:', error);
    }
  }
};

export default recentlyViewedManager;
