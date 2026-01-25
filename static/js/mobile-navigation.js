/**
 * MuleCube Mobile Bottom Navigation
 * iOS-inspired fixed bottom navigation for mobile devices
 * 
 * v1.0.0 - Adapted for MuleCube Dashboard
 */

(function() {
    'use strict';

    // SVG Icons (monochrome, Apple-style)
    const ICONS = {
        home: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        search: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
        star: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        settings: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>'
    };

    const MobileNavigation = {
        container: null,
        isVisible: false,
        activeItem: 'home',
        mobileBreakpoint: 768,
        
        navItems: [
            { id: 'home', label: 'Home', icon: ICONS.home },
            { id: 'search', label: 'Search', icon: ICONS.search },
            { id: 'favorites', label: 'Favorites', icon: ICONS.star },
            { id: 'system', label: 'System', icon: ICONS.settings }
        ],
        
        init() {
            // Only initialize on mobile
            if (window.innerWidth > this.mobileBreakpoint) {
                this.setupResizeListener();
                return;
            }
            
            this.create();
            this.setupResizeListener();
            this.updateActiveState();
        },
        
        create() {
            if (this.container) return;
            
            this.container = document.createElement('nav');
            this.container.className = 'mobile-bottom-nav';
            this.container.setAttribute('role', 'navigation');
            this.container.setAttribute('aria-label', 'Mobile navigation');
            
            this.container.innerHTML = `
                <div class="mobile-nav-items">
                    ${this.navItems.map(item => `
                        <button class="mobile-nav-item ${item.id === this.activeItem ? 'active' : ''}" 
                                data-nav="${item.id}"
                                aria-label="${item.label}">
                            <span class="nav-icon">${item.icon}</span>
                            <span class="nav-label">${item.label}</span>
                        </button>
                    `).join('')}
                </div>
            `;
            
            document.body.appendChild(this.container);
            this.isVisible = true;
            
            // Add body padding to prevent content being hidden
            document.body.style.paddingBottom = '80px';
            
            // Bind events
            this.bindEvents();
            
            // Animate in
            requestAnimationFrame(() => {
                this.container.classList.add('visible');
            });
        },
        
        bindEvents() {
            this.container.querySelectorAll('.mobile-nav-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const navId = e.currentTarget.dataset.nav;
                    this.handleNavClick(navId);
                });
            });
        },
        
        handleNavClick(navId) {
            // Haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
            
            switch (navId) {
                case 'home':
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    break;
                    
                case 'search':
                    this.openSearch();
                    break;
                    
                case 'favorites':
                    this.scrollToFavorites();
                    break;
                    
                case 'system':
                    this.openSystemPanel();
                    break;
            }
            
            this.setActive(navId);
        },
        
        openSearch() {
            // Focus the existing search input
            const searchInput = document.getElementById('serviceSearch');
            if (searchInput) {
                searchInput.focus();
                searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        },
        
        scrollToFavorites() {
            // Scroll to favorites section if it exists, otherwise start-here
            const favoritesSection = document.getElementById('favoritesSection') || 
                                    document.querySelector('.favorites-section');
            const startHere = document.querySelector('.start-here');
            
            const target = favoritesSection || startHere;
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        },
        
        openSystemPanel() {
            // Try to open the System Management Panel if it exists
            if (typeof SystemManagementPanel !== 'undefined' && SystemManagementPanel.open) {
                SystemManagementPanel.open();
            } else if (typeof SystemFunctions !== 'undefined' && SystemFunctions.openSettings) {
                SystemFunctions.openSettings();
            } else {
                // Fallback: scroll to admin section
                const advancedSection = document.getElementById('advancedSection');
                const advancedToggle = document.getElementById('advancedToggle');
                
                if (advancedSection && advancedToggle) {
                    if (advancedSection.style.display === 'none') {
                        advancedToggle.click();
                    }
                    advancedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        },
        
        setActive(navId) {
            this.activeItem = navId;
            
            this.container.querySelectorAll('.mobile-nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.nav === navId);
            });
        },
        
        updateActiveState() {
            // Update active state based on scroll position
            const scrollHandler = () => {
                const scrollY = window.scrollY;
                const viewportHeight = window.innerHeight;
                
                const favoritesSection = document.getElementById('favoritesSection') || 
                                        document.querySelector('.favorites-section') ||
                                        document.querySelector('.start-here');
                const servicesSection = document.getElementById('services');
                
                let newActive = 'home';
                
                if (favoritesSection) {
                    const rect = favoritesSection.getBoundingClientRect();
                    if (rect.top < viewportHeight / 2 && rect.bottom > 0) {
                        newActive = 'favorites';
                    }
                }
                
                if (scrollY < 100) {
                    newActive = 'home';
                }
                
                if (newActive !== this.activeItem) {
                    this.setActive(newActive);
                }
            };
            
            // Throttle scroll events
            let ticking = false;
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        scrollHandler();
                        ticking = false;
                    });
                    ticking = true;
                }
            }, { passive: true });
        },
        
        setupResizeListener() {
            let resizeTimer;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    if (window.innerWidth <= this.mobileBreakpoint) {
                        if (!this.isVisible) {
                            this.create();
                        }
                    } else {
                        this.destroy();
                    }
                }, 150);
            });
        },
        
        destroy() {
            if (this.container) {
                this.container.remove();
                this.container = null;
                this.isVisible = false;
                document.body.style.paddingBottom = '';
            }
        },
        
        hide() {
            if (this.container) {
                this.container.classList.remove('visible');
            }
        },
        
        show() {
            if (this.container) {
                this.container.classList.add('visible');
            }
        }
    };

    // Make globally accessible
    window.MobileNavigation = MobileNavigation;

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => MobileNavigation.init());
    } else {
        MobileNavigation.init();
    }

})();
