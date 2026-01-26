/**
 * MuleCube Shared Preferences Manager
 * Syncs preferences across all devices connected to MuleCube
 * Falls back to localStorage if API unavailable
 */

const PreferencesManager = {
    // API endpoint - points to MuleCube service manager
    apiUrl: 'http://servicemanager.mulecube.net/api/preferences',
    
    // Cache for current preferences
    cache: null,
    
    // Debounce timer for saves
    saveTimer: null,
    
    // Default preferences structure
    defaults: {
        setupComplete: false,
        tourComplete: false,
        favorites: [],
        recentServices: [],
        theme: 'dark',
        collapsedCategories: [],
        adminExpanded: false
    },
    
    /**
     * Initialize preferences - load from server or localStorage
     */
    async init() {
        try {
            // Try to load from server first
            this.cache = await this.loadFromServer();
        } catch (e) {
            // Fall back to localStorage
            this.cache = this.loadFromLocalStorage();
        }
        
        // Apply preferences to UI
        this.applyToUI();
        
        return this.cache;
    },
    
    /**
     * Load preferences from server API
     */
    async loadFromServer() {
        const response = await fetch(this.apiUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Merge with defaults for any missing keys
        return { ...this.defaults, ...data };
    },
    
    /**
     * Load preferences from localStorage (fallback)
     */
    loadFromLocalStorage() {
        return {
            setupComplete: localStorage.getItem('mulecube_setup_complete') === 'true' ||
                          localStorage.getItem('mulecube_onboarding_complete') === 'true',
            tourComplete: localStorage.getItem('mulecube_tour_complete') === 'true',
            favorites: JSON.parse(localStorage.getItem('mulecube_favorites') || '[]'),
            recentServices: JSON.parse(localStorage.getItem('mulecube_recent_services') || '[]'),
            theme: localStorage.getItem('theme') || 'dark',
            collapsedCategories: JSON.parse(localStorage.getItem('mulecube_collapsed_categories') || '[]'),
            adminExpanded: localStorage.getItem('mulecube_admin_expanded') === 'true'
        };
    },
    
    /**
     * Save preferences to server (with debounce)
     */
    save(immediate = false) {
        // Clear existing timer
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        
        const doSave = async () => {
            try {
                await this.saveToServer();
            } catch (e) {
                // Fall back to localStorage
                this.saveToLocalStorage();
            }
        };
        
        if (immediate) {
            doSave();
        } else {
            // Debounce saves to avoid hammering the API
            this.saveTimer = setTimeout(doSave, 500);
        }
    },
    
    /**
     * Save preferences to server API
     */
    async saveToServer() {
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(this.cache)
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return response.json();
    },
    
    /**
     * Save preferences to localStorage (fallback)
     */
    saveToLocalStorage() {
        localStorage.setItem('mulecube_setup_complete', this.cache.setupComplete);
        localStorage.setItem('mulecube_onboarding_complete', this.cache.setupComplete);
        localStorage.setItem('mulecube_tour_complete', this.cache.tourComplete);
        localStorage.setItem('mulecube_favorites', JSON.stringify(this.cache.favorites));
        localStorage.setItem('mulecube_recent_services', JSON.stringify(this.cache.recentServices));
        localStorage.setItem('theme', this.cache.theme);
        localStorage.setItem('mulecube_collapsed_categories', JSON.stringify(this.cache.collapsedCategories));
        localStorage.setItem('mulecube_admin_expanded', this.cache.adminExpanded);
    },
    
    /**
     * Apply preferences to UI elements
     */
    applyToUI() {
        // Apply theme
        if (this.cache.theme === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    },
    
    // ==========================================
    // Getters and Setters for specific preferences
    // ==========================================
    
    /**
     * Check if setup wizard has been completed
     */
    isSetupComplete() {
        return this.cache?.setupComplete || false;
    },
    
    /**
     * Mark setup wizard as complete
     */
    setSetupComplete(complete = true) {
        if (this.cache) {
            this.cache.setupComplete = complete;
            this.save();
        }
    },
    
    /**
     * Check if tour has been completed
     */
    isTourComplete() {
        return this.cache?.tourComplete || false;
    },
    
    /**
     * Mark tour as complete
     */
    setTourComplete(complete = true) {
        if (this.cache) {
            this.cache.tourComplete = complete;
            this.save();
        }
    },
    
    /**
     * Get favorites list
     */
    getFavorites() {
        return this.cache?.favorites || [];
    },
    
    /**
     * Set favorites list
     */
    setFavorites(favorites) {
        if (this.cache) {
            this.cache.favorites = favorites;
            this.save();
        }
    },
    
    /**
     * Add a favorite
     */
    addFavorite(serviceId) {
        if (this.cache && !this.cache.favorites.includes(serviceId)) {
            this.cache.favorites.push(serviceId);
            this.save();
        }
    },
    
    /**
     * Remove a favorite
     */
    removeFavorite(serviceId) {
        if (this.cache) {
            this.cache.favorites = this.cache.favorites.filter(id => id !== serviceId);
            this.save();
        }
    },
    
    /**
     * Check if service is a favorite
     */
    isFavorite(serviceId) {
        return this.cache?.favorites?.includes(serviceId) || false;
    },
    
    /**
     * Get recent services
     */
    getRecentServices() {
        return this.cache?.recentServices || [];
    },
    
    /**
     * Add to recent services (max 10, no duplicates)
     */
    addRecentService(serviceId) {
        if (this.cache) {
            // Remove if already exists
            this.cache.recentServices = this.cache.recentServices.filter(id => id !== serviceId);
            // Add to front
            this.cache.recentServices.unshift(serviceId);
            // Keep max 10
            this.cache.recentServices = this.cache.recentServices.slice(0, 10);
            this.save();
        }
    },
    
    /**
     * Get theme
     */
    getTheme() {
        return this.cache?.theme || 'dark';
    },
    
    /**
     * Set theme
     */
    setTheme(theme) {
        if (this.cache) {
            this.cache.theme = theme;
            this.save();
            this.applyToUI();
        }
    },
    
    /**
     * Get collapsed categories
     */
    getCollapsedCategories() {
        return this.cache?.collapsedCategories || [];
    },
    
    /**
     * Toggle category collapsed state
     */
    toggleCategoryCollapsed(categoryId) {
        if (this.cache) {
            const idx = this.cache.collapsedCategories.indexOf(categoryId);
            if (idx === -1) {
                this.cache.collapsedCategories.push(categoryId);
            } else {
                this.cache.collapsedCategories.splice(idx, 1);
            }
            this.save();
        }
    },
    
    /**
     * Check if category is collapsed
     */
    isCategoryCollapsed(categoryId) {
        return this.cache?.collapsedCategories?.includes(categoryId) || false;
    },
    
    /**
     * Get admin tools expanded state
     */
    isAdminExpanded() {
        return this.cache?.adminExpanded || false;
    },
    
    /**
     * Set admin tools expanded state
     */
    setAdminExpanded(expanded) {
        if (this.cache) {
            this.cache.adminExpanded = expanded;
            this.save();
        }
    },
    
    /**
     * Reset all preferences to defaults
     */
    reset() {
        this.cache = { ...this.defaults };
        this.save(true);
        this.applyToUI();
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PreferencesManager.init());
} else {
    PreferencesManager.init();
}

// Export for use in other modules
window.PreferencesManager = PreferencesManager;
