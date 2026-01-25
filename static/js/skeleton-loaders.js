/**
 * MuleCube Skeleton Loaders
 * CSS-only shimmer animations for loading states
 * 
 * v1.0.0 - Adapted for MuleCube Dashboard
 */

(function() {
    'use strict';

    const SkeletonLoaders = {
        // Template configurations
        templates: {
            serviceCard: {
                html: `
                    <div class="skeleton-card">
                        <div class="skeleton skeleton-icon"></div>
                        <div class="skeleton-content">
                            <div class="skeleton skeleton-title"></div>
                            <div class="skeleton skeleton-text"></div>
                        </div>
                        <div class="skeleton skeleton-status"></div>
                    </div>
                `
            },
            
            serviceGrid: {
                html: (count = 4) => `
                    <div class="skeleton-grid">
                        ${Array(count).fill('').map((_, i) => `
                            <div class="skeleton-card" style="animation-delay: ${i * 0.1}s">
                                <div class="skeleton skeleton-icon"></div>
                                <div class="skeleton-content">
                                    <div class="skeleton skeleton-title"></div>
                                    <div class="skeleton skeleton-text"></div>
                                </div>
                                <div class="skeleton skeleton-status"></div>
                            </div>
                        `).join('')}
                    </div>
                `
            },
            
            statsCard: {
                html: `
                    <div class="skeleton-stats">
                        <div class="skeleton skeleton-stat-value"></div>
                        <div class="skeleton skeleton-stat-label"></div>
                    </div>
                `
            },
            
            table: {
                html: (rows = 5) => `
                    <div class="skeleton-table">
                        <div class="skeleton-table-header">
                            <div class="skeleton skeleton-cell" style="width: 40%"></div>
                            <div class="skeleton skeleton-cell" style="width: 30%"></div>
                            <div class="skeleton skeleton-cell" style="width: 30%"></div>
                        </div>
                        ${Array(rows).fill('').map((_, i) => `
                            <div class="skeleton-table-row" style="animation-delay: ${i * 0.05}s">
                                <div class="skeleton skeleton-cell" style="width: 40%"></div>
                                <div class="skeleton skeleton-cell" style="width: 30%"></div>
                                <div class="skeleton skeleton-cell" style="width: 30%"></div>
                            </div>
                        `).join('')}
                    </div>
                `
            },
            
            textBlock: {
                html: (lines = 3) => `
                    <div class="skeleton-text-block">
                        ${Array(lines).fill('').map((_, i) => `
                            <div class="skeleton skeleton-line ${i === lines - 1 ? 'skeleton-line-short' : ''}" 
                                 style="animation-delay: ${i * 0.1}s"></div>
                        `).join('')}
                    </div>
                `
            },
            
            chart: {
                html: `
                    <div class="skeleton-chart">
                        <div class="skeleton-chart-bars">
                            ${Array(8).fill('').map((_, i) => `
                                <div class="skeleton skeleton-bar" 
                                     style="height: ${30 + Math.random() * 50}%; animation-delay: ${i * 0.05}s"></div>
                            `).join('')}
                        </div>
                        <div class="skeleton skeleton-chart-axis"></div>
                    </div>
                `
            }
        },
        
        /**
         * Show skeleton loader in container
         * @param {HTMLElement|string} container - Container element or selector
         * @param {string} type - Template type
         * @param {object} options - Additional options
         */
        show(container, type = 'serviceCard', options = {}) {
            const el = typeof container === 'string' 
                ? document.querySelector(container) 
                : container;
            
            if (!el) return;
            
            const template = this.templates[type];
            if (!template) {
                console.warn('[SkeletonLoaders] Unknown template:', type);
                return;
            }
            
            // Store original content
            if (!el.dataset.originalContent) {
                el.dataset.originalContent = el.innerHTML;
            }
            
            // Generate skeleton HTML
            let html;
            if (typeof template.html === 'function') {
                html = template.html(options.count || options.rows || options.lines);
            } else {
                html = template.html;
            }
            
            el.innerHTML = html;
            el.classList.add('skeleton-loading');
            
            // Announce to screen readers
            this.announceLoading(el);
        },
        
        /**
         * Hide skeleton loader and restore content
         * @param {HTMLElement|string} container - Container element or selector
         * @param {string} newContent - Optional new content to show
         */
        hide(container, newContent = null) {
            const el = typeof container === 'string' 
                ? document.querySelector(container) 
                : container;
            
            if (!el) return;
            
            el.classList.remove('skeleton-loading');
            
            if (newContent !== null) {
                el.innerHTML = newContent;
            } else if (el.dataset.originalContent) {
                el.innerHTML = el.dataset.originalContent;
                delete el.dataset.originalContent;
            }
            
            // Announce to screen readers
            this.announceLoaded(el);
        },
        
        /**
         * Replace "Loading..." text with skeleton loaders
         */
        replaceLoadingText() {
            document.querySelectorAll('.loading, .loading-text, [data-loading]').forEach(el => {
                if (el.textContent.includes('Loading') || el.textContent.includes('loading')) {
                    this.show(el, 'textBlock', { lines: 2 });
                }
            });
        },
        
        /**
         * Accessibility: announce loading state
         */
        announceLoading(el) {
            const liveRegion = this.getLiveRegion();
            liveRegion.textContent = 'Loading content...';
        },
        
        /**
         * Accessibility: announce loaded state
         */
        announceLoaded(el) {
            const liveRegion = this.getLiveRegion();
            liveRegion.textContent = 'Content loaded';
        },
        
        /**
         * Get or create ARIA live region
         */
        getLiveRegion() {
            let region = document.getElementById('skeleton-live-region');
            if (!region) {
                region = document.createElement('div');
                region.id = 'skeleton-live-region';
                region.className = 'sr-only';
                region.setAttribute('role', 'status');
                region.setAttribute('aria-live', 'polite');
                region.setAttribute('aria-atomic', 'true');
                document.body.appendChild(region);
            }
            return region;
        },
        
        /**
         * Create inline skeleton for specific element
         * @param {string} type - 'text', 'circle', 'rect'
         * @param {object} options - width, height
         */
        inline(type = 'text', options = {}) {
            const span = document.createElement('span');
            span.className = `skeleton skeleton-inline skeleton-${type}`;
            
            if (options.width) span.style.width = options.width;
            if (options.height) span.style.height = options.height;
            
            return span;
        }
    };

    // Make globally accessible
    window.SkeletonLoaders = SkeletonLoaders;

    // Auto-replace loading text on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Give other scripts time to run first
            setTimeout(() => SkeletonLoaders.replaceLoadingText(), 100);
        });
    } else {
        setTimeout(() => SkeletonLoaders.replaceLoadingText(), 100);
    }

})();
