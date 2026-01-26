/**
 * MuleCube Interactive Tour Guide
 * Step-by-step walkthrough with element highlighting
 * 
 * v1.0.0 - Adapted for MuleCube Dashboard
 */

(function() {
    'use strict';

    // SVG Icons
    const ICONS = {
        box: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
        search: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
        grid: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>',
        folder: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>',
        hand: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>',
        status: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
        star: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        settings: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
        book: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
        brain: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>',
        map: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>'
    };

    const TourGuide = {
        STORAGE_KEY: 'mulecube_tour_complete',
        isActive: false,
        currentStep: 0,
        steps: [],
        overlay: null,
        tooltip: null,
        
        // Predefined tours
        tours: {
            dashboard: [
                {
                    target: 'a.logo, .site-header .logo',
                    title: 'Welcome to MuleCube',
                    content: 'This is your offline command center. Everything runs locally on this device - no internet needed.',
                    position: 'right',
                    icon: ICONS.box
                },
                {
                    target: '#serviceSearch, .search-input',
                    title: 'Find Services Fast',
                    content: 'Search through 60+ services instantly. Try typing "wiki" or "maps" to find what you need.',
                    position: 'bottom',
                    icon: ICONS.search
                },
                {
                    target: '.start-here .service-card[data-service="kiwix"]',
                    title: 'Service Cards',
                    content: 'Each card is a service you can use. Click to open it. The green dot means it is running.',
                    position: 'bottom',
                    icon: ICONS.grid
                },
                {
                    target: '.start-here .service-card[data-service="kiwix"]',
                    title: 'Pro Tip: Long Press',
                    content: 'Long-press (hold) any service card to enable or disable it. Disabled services save battery and RAM.',
                    position: 'right',
                    icon: ICONS.hand
                },
                {
                    target: '.service-category .category-title',
                    title: 'Organized by Category',
                    content: 'Services are grouped by type: AI, Knowledge, Files, and more. Click category headers to collapse them.',
                    position: 'right',
                    icon: ICONS.folder
                },
                {
                    target: '.stats-panel',
                    title: 'System Status',
                    content: 'Monitor CPU, memory, temperature, and connections. Click items for more details.',
                    position: 'bottom',
                    icon: ICONS.status
                },
                {
                    target: '#favoritesSection',
                    title: 'Your Favorites',
                    content: 'Star services to pin them here for quick access. Drag to reorder your favorites.',
                    position: 'bottom',
                    icon: ICONS.star
                },
                {
                    target: '#themeToggle, .theme-toggle',
                    title: 'Day/Night Mode',
                    content: 'Toggle between light and dark themes for comfortable viewing in any environment.',
                    position: 'left',
                    icon: ICONS.settings
                },
                {
                    target: '#systemManagementBtn, .system-btn',
                    title: 'System Management',
                    content: 'Click here to open the System Management panel with detailed hardware info, network settings, logs, and more.',
                    position: 'bottom',
                    icon: ICONS.settings
                },
                {
                    target: '#advancedToggle',
                    title: 'Admin Tools',
                    content: 'Click "Show Admin Tools" below to access system monitoring, container management, and settings.',
                    position: 'top',
                    icon: ICONS.settings
                },
                {
                    target: '.nav-links a[href*="Docs"], .nav-links a[href*="docs"]',
                    title: 'Learn More',
                    content: 'Visit the documentation for detailed guides on services, troubleshooting, and getting the most from MuleCube.',
                    position: 'left',
                    icon: ICONS.book
                }
            ],
            
            quickStart: [
                {
                    target: '[data-service="kiwix"], [data-container="kiwix"]',
                    title: 'Start Here: Wikipedia',
                    content: 'Offline Wikipedia with millions of articles. Perfect for research without internet.',
                    position: 'right',
                    icon: ICONS.book
                },
                {
                    target: '[data-service="open-webui"], [data-container="open-webui"]',
                    title: 'AI Assistant',
                    content: 'Chat with AI that runs 100% on this device. Your conversations stay private.',
                    position: 'right',
                    icon: ICONS.brain
                },
                {
                    target: '[data-service="tileserver-gl"], [data-container="tileserver-gl"]',
                    title: 'Offline Maps',
                    content: 'Navigate anywhere without cell signal. Pre-loaded map data for your region.',
                    position: 'right',
                    icon: ICONS.map
                }
            ],
            
            systemManagement: [
                {
                    target: '.system-management-panel, #system-panel, .advanced-section',
                    title: 'System Management',
                    content: 'Control your MuleCube from here. Monitor resources, manage services, and configure settings.',
                    position: 'center',
                    icon: ICONS.settings
                },
                {
                    target: '[data-tab="overview"], .tab-overview',
                    title: 'Overview Tab',
                    content: 'See CPU, memory, temperature, and storage at a glance.',
                    position: 'right',
                    icon: ICONS.status,
                    optional: true
                },
                {
                    target: '[data-tab="network"], .tab-network',
                    title: 'Network Tab',
                    content: 'View connected devices and network interfaces.',
                    position: 'right',
                    icon: ICONS.search,
                    optional: true
                }
            ]
        },
        
        init() {
            console.log('[TourGuide] Ready. Call TourGuide.start() to begin.');
        },
        
        start(tourName = 'dashboard') {
            if (this.isActive) return;
            
            const tour = this.tours[tourName];
            if (!tour) {
                console.error('[TourGuide] Tour not found:', tourName);
                return;
            }
            
            this.steps = tour;
            this.currentStep = 0;
            this.isActive = true;
            
            this.createOverlay();
            this.showStep(0);
            
            // Keyboard navigation
            this.boundKeyHandler = this.handleKeydown.bind(this);
            document.addEventListener('keydown', this.boundKeyHandler);
        },
        
        createOverlay() {
            this.destroy();
            
            this.overlay = document.createElement('div');
            this.overlay.className = 'tour-overlay';
            this.overlay.innerHTML = `
                <div class="tour-backdrop"></div>
                <div class="tour-highlight"></div>
            `;
            
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'tour-tooltip';
            this.tooltip.innerHTML = `
                <div class="tour-tooltip-header">
                    <span class="tour-icon"></span>
                    <h4 class="tour-title"></h4>
                </div>
                <p class="tour-content"></p>
                <div class="tour-footer">
                    <span class="tour-progress"></span>
                    <div class="tour-buttons">
                        <button class="tour-btn tour-skip">Skip</button>
                        <button class="tour-btn tour-prev">Back</button>
                        <button class="tour-btn tour-next primary">Next</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(this.overlay);
            document.body.appendChild(this.tooltip);
            
            // Event listeners
            this.tooltip.querySelector('.tour-skip').addEventListener('click', () => this.end(true));
            this.tooltip.querySelector('.tour-prev').addEventListener('click', () => this.prev());
            this.tooltip.querySelector('.tour-next').addEventListener('click', () => this.next());
            
            // Animate in
            requestAnimationFrame(() => {
                this.overlay.classList.add('visible');
                this.tooltip.classList.add('visible');
            });
        },
        
        showStep(index) {
            if (index < 0 || index >= this.steps.length) return;
            
            const step = this.steps[index];
            this.currentStep = index;
            
            // Find target element - try each selector in the comma-separated list
            let target = null;
            const selectors = step.target.split(',').map(s => s.trim());
            
            for (const selector of selectors) {
                target = document.querySelector(selector);
                if (target) {
                    console.log(`[TourGuide] Step ${index + 1}: Found "${selector}"`);
                    break;
                }
            }
            
            // If optional and not found, skip
            if (!target && step.optional) {
                console.log(`[TourGuide] Step ${index + 1}: Optional step skipped (no element found)`);
                if (index < this.steps.length - 1) {
                    this.showStep(index + 1);
                } else {
                    this.end();
                }
                return;
            }
            
            // Fallback to body if nothing found
            if (!target) {
                console.warn(`[TourGuide] Step ${index + 1}: Target not found for any selector:`, step.target);
                target = document.body;
            }
            
            // Log the element we're highlighting
            console.log(`[TourGuide] Step ${index + 1}: Highlighting`, target);
            
            // Update tooltip content first
            this.tooltip.querySelector('.tour-icon').innerHTML = step.icon || ICONS.box;
            this.tooltip.querySelector('.tour-title').textContent = step.title;
            this.tooltip.querySelector('.tour-content').textContent = step.content;
            this.tooltip.querySelector('.tour-progress').textContent = `${index + 1} of ${this.steps.length}`;
            
            // Update navigation
            const prevBtn = this.tooltip.querySelector('.tour-prev');
            const nextBtn = this.tooltip.querySelector('.tour-next');
            
            prevBtn.style.display = index === 0 ? 'none' : '';
            nextBtn.textContent = index === this.steps.length - 1 ? 'Finish' : 'Next';
            
            // Scroll target into view first
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Wait for scroll to complete, then position highlight and tooltip
            setTimeout(() => {
                this.highlightElement(target);
                this.positionTooltip(target, step.position || 'bottom');
            }, 400);
        },
        
        highlightElement(target) {
            const highlight = this.overlay.querySelector('.tour-highlight');
            const rect = target.getBoundingClientRect();
            
            const padding = 8;
            // Use viewport-relative positioning (getBoundingClientRect gives viewport coords)
            // Then add scrollY/scrollX to get document coords
            highlight.style.top = `${rect.top + window.scrollY - padding}px`;
            highlight.style.left = `${rect.left + window.scrollX - padding}px`;
            highlight.style.width = `${rect.width + padding * 2}px`;
            highlight.style.height = `${rect.height + padding * 2}px`;
        },
        
        positionTooltip(target, position) {
            const rect = target.getBoundingClientRect();
            const tooltip = this.tooltip;
            
            // Reset position classes
            tooltip.className = 'tour-tooltip visible';
            
            // Get tooltip dimensions after render
            const tooltipRect = tooltip.getBoundingClientRect();
            
            const gap = 16;
            let top, left;
            
            switch (position) {
                case 'top':
                    top = rect.top + window.scrollY - tooltipRect.height - gap;
                    left = rect.left + (rect.width - tooltipRect.width) / 2;
                    tooltip.classList.add('position-top');
                    break;
                case 'bottom':
                    top = rect.bottom + window.scrollY + gap;
                    left = rect.left + (rect.width - tooltipRect.width) / 2;
                    tooltip.classList.add('position-bottom');
                    break;
                case 'left':
                    top = rect.top + window.scrollY + (rect.height - tooltipRect.height) / 2;
                    left = rect.left - tooltipRect.width - gap;
                    tooltip.classList.add('position-left');
                    break;
                case 'right':
                    top = rect.top + window.scrollY + (rect.height - tooltipRect.height) / 2;
                    left = rect.right + gap;
                    tooltip.classList.add('position-right');
                    break;
                case 'center':
                    top = window.innerHeight / 2 - tooltipRect.height / 2 + window.scrollY;
                    left = window.innerWidth / 2 - tooltipRect.width / 2;
                    tooltip.classList.add('position-center');
                    break;
            }
            
            // Keep tooltip in viewport
            left = Math.max(16, Math.min(left, window.innerWidth - tooltipRect.width - 16));
            top = Math.max(16 + window.scrollY, top);
            
            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
        },
        
        next() {
            if (this.currentStep < this.steps.length - 1) {
                this.showStep(this.currentStep + 1);
            } else {
                this.end();
            }
        },
        
        prev() {
            if (this.currentStep > 0) {
                this.showStep(this.currentStep - 1);
            }
        },
        
        handleKeydown(e) {
            if (!this.isActive) return;
            
            switch (e.key) {
                case 'Escape':
                    this.end(true);
                    break;
                case 'ArrowRight':
                case 'Enter':
                    this.next();
                    break;
                case 'ArrowLeft':
                    this.prev();
                    break;
            }
        },
        
        end(skipped = false) {
            this.isActive = false;
            
            if (!skipped) {
                localStorage.setItem(this.STORAGE_KEY, 'true');
            }
            
            if (this.overlay) this.overlay.classList.remove('visible');
            if (this.tooltip) this.tooltip.classList.remove('visible');
            
            setTimeout(() => this.destroy(), 300);
            
            if (this.boundKeyHandler) {
                document.removeEventListener('keydown', this.boundKeyHandler);
            }
            
            window.dispatchEvent(new CustomEvent('tour:complete', {
                detail: { skipped }
            }));
        },
        
        destroy() {
            if (this.overlay) {
                this.overlay.remove();
                this.overlay = null;
            }
            if (this.tooltip) {
                this.tooltip.remove();
                this.tooltip = null;
            }
        },
        
        isComplete() {
            return localStorage.getItem(this.STORAGE_KEY) === 'true';
        },
        
        reset() {
            localStorage.removeItem(this.STORAGE_KEY);
        }
    };

    // Make globally accessible
    window.TourGuide = TourGuide;

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => TourGuide.init());
    } else {
        TourGuide.init();
    }

})();
