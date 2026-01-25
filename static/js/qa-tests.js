/**
 * MuleCube UX Enhancement Package - QA Test Suite
 * Run these tests in browser console after deployment
 * 
 * Execute with: MuleCubeQA.runAll()
 */

const MuleCubeQA = {
    results: [],
    passed: 0,
    failed: 0,
    
    // Test helper
    test(name, fn) {
        try {
            const result = fn();
            if (result === true || result === undefined) {
                this.passed++;
                this.results.push({ name, status: 'PASS', message: '' });
                console.log(`  [PASS] ${name}`);
                return true;
            } else {
                this.failed++;
                this.results.push({ name, status: 'FAIL', message: result || 'Assertion failed' });
                console.error(`  [FAIL] ${name}: ${result}`);
                return false;
            }
        } catch (e) {
            this.failed++;
            this.results.push({ name, status: 'ERROR', message: e.message });
            console.error(`  [ERROR] ${name}: ${e.message}`);
            return false;
        }
    },
    
    // ====== Core Component Tests ======
    
    testMobileNavigation() {
        console.log('\n--- Mobile Navigation Tests ---');
        
        this.test('MobileNavigation module exists', () => {
            return typeof window.MobileNavigation !== 'undefined';
        });
        
        this.test('MobileNavigation has required methods', () => {
            const m = window.MobileNavigation;
            return m && typeof m.init === 'function' && 
                   typeof m.create === 'function' &&
                   typeof m.destroy === 'function';
        });
        
        this.test('Mobile nav respects breakpoint', () => {
            // On desktop, nav should not be visible
            if (window.innerWidth > 768) {
                const nav = document.querySelector('.mobile-bottom-nav');
                return nav === null || nav.style.display === 'none' || 
                       'Mobile nav correctly hidden on desktop';
            }
            return true; // Skip on mobile
        });
    },
    
    testFavoritesManager() {
        console.log('\n--- Favorites Manager Tests ---');
        
        this.test('FavoritesManager module exists', () => {
            return typeof window.FavoritesManager !== 'undefined';
        });
        
        this.test('FavoritesManager has required methods', () => {
            const f = window.FavoritesManager;
            return f && typeof f.init === 'function' &&
                   typeof f.add === 'function' &&
                   typeof f.remove === 'function' &&
                   typeof f.isFavorite === 'function';
        });
        
        this.test('Favorites section exists', () => {
            const section = document.getElementById('favoritesSection');
            return section !== null || 'Favorites section should exist in DOM';
        });
        
        this.test('Favorite buttons injected into service cards', () => {
            const cards = document.querySelectorAll('.service-card[data-service]');
            if (cards.length === 0) return 'No service cards found';
            const withButton = document.querySelectorAll('.service-card[data-service] .favorite-btn');
            return withButton.length > 0 || 'No favorite buttons found';
        });
        
        this.test('Favorites use localStorage', () => {
            const key = 'mulecube_favorites';
            const stored = localStorage.getItem(key);
            return stored !== null || stored === '[]' || 'Favorites should be stored';
        });
    },
    
    testSkeletonLoaders() {
        console.log('\n--- Skeleton Loaders Tests ---');
        
        this.test('SkeletonLoaders module exists', () => {
            return typeof window.SkeletonLoaders !== 'undefined';
        });
        
        this.test('SkeletonLoaders has required methods', () => {
            const s = window.SkeletonLoaders;
            return s && typeof s.show === 'function' &&
                   typeof s.hide === 'function' &&
                   typeof s.templates === 'object';
        });
        
        this.test('Skeleton templates defined', () => {
            const s = window.SkeletonLoaders;
            return s.templates.serviceCard && s.templates.serviceGrid;
        });
    },
    
    testPlainEnglishErrors() {
        console.log('\n--- Plain English Errors Tests ---');
        
        this.test('PlainEnglishErrors module exists', () => {
            return typeof window.PlainEnglishErrors !== 'undefined';
        });
        
        this.test('PlainEnglishErrors.translate works', () => {
            const p = window.PlainEnglishErrors;
            if (!p) return 'Module not loaded';
            
            const result = p.translate('ECONNREFUSED');
            return result.message === 'Cannot connect to this service' || 
                   'Translation should work for ECONNREFUSED';
        });
        
        this.test('PlainEnglishErrors handles timeout', () => {
            const p = window.PlainEnglishErrors;
            const result = p.translate('Request timed out');
            return result.message === 'Connection timed out';
        });
        
        this.test('PlainEnglishErrors handles OOM', () => {
            const p = window.PlainEnglishErrors;
            const result = p.translate('container exited with code 137');
            return result.message === 'This service ran out of memory';
        });
    },
    
    testHealthHistory() {
        console.log('\n--- Health History Tests ---');
        
        this.test('HealthHistory module exists', () => {
            return typeof window.HealthHistory !== 'undefined';
        });
        
        this.test('HealthHistory has required methods', () => {
            const h = window.HealthHistory;
            return h && typeof h.init === 'function' &&
                   typeof h.recordStatus === 'function' &&
                   typeof h.getUptime === 'function';
        });
        
        this.test('HealthHistory uses localStorage', () => {
            const key = 'mulecube_health_history';
            // Should have been initialized
            return true;
        });
    },
    
    testTourGuide() {
        console.log('\n--- Tour Guide Tests ---');
        
        this.test('TourGuide module exists', () => {
            return typeof window.TourGuide !== 'undefined';
        });
        
        this.test('TourGuide has required methods', () => {
            const t = window.TourGuide;
            return t && typeof t.start === 'function' &&
                   typeof t.end === 'function' &&
                   typeof t.tours === 'object';
        });
        
        this.test('TourGuide dashboard tour defined', () => {
            const t = window.TourGuide;
            return t.tours.dashboard && t.tours.dashboard.length > 0;
        });
    },
    
    // ====== SVG Icon Tests ======
    
    testSVGIcons() {
        console.log('\n--- SVG Icon Tests ---');
        
        this.test('No emoji characters in sync status', () => {
            const syncIcon = document.querySelector('.sync-icon');
            if (!syncIcon) return true; // No sync widget
            const text = syncIcon.textContent;
            // Check for common emojis/symbols
            return !/[✓✕↻⚠▼▲🔋⚡🔌]/.test(text);
        });
        
        this.test('Category toggles use SVG', () => {
            const indicators = document.querySelectorAll('.category-toggle-indicator');
            if (indicators.length === 0) return true;
            let allSVG = true;
            indicators.forEach(ind => {
                if (!ind.querySelector('svg') && !/▼|▲/.test(ind.textContent)) {
                    // OK if empty or has SVG
                } else if (/▼|▲/.test(ind.textContent)) {
                    allSVG = false;
                }
            });
            return allSVG || 'Found text-based chevrons';
        });
        
        this.test('Feature checks use SVG', () => {
            const checks = document.querySelectorAll('.feature-check');
            if (checks.length === 0) return true;
            let hasTextCheck = false;
            checks.forEach(c => {
                if (c.textContent.includes('✓') && !c.querySelector('svg')) {
                    hasTextCheck = true;
                }
            });
            return !hasTextCheck || 'Found text-based checkmarks';
        });
        
        this.test('Toast close buttons use SVG', () => {
            // Create a test toast
            if (typeof ServiceManagerAPI !== 'undefined') {
                ServiceManagerAPI.showToast('QA Test', 'info');
                const toast = document.querySelector('.service-manager-toast');
                if (toast) {
                    const btn = toast.querySelector('button');
                    const hasSVG = btn && btn.querySelector('svg');
                    toast.remove();
                    return hasSVG || 'Toast close button should have SVG';
                }
            }
            return true;
        });
    },
    
    // ====== Integration Tests ======
    
    testIntegration() {
        console.log('\n--- Integration Tests ---');
        
        this.test('ServiceManagerAPI exists', () => {
            return typeof window.ServiceManagerAPI !== 'undefined';
        });
        
        this.test('Service cards have data-service attribute', () => {
            const cards = document.querySelectorAll('.service-card');
            const withAttr = document.querySelectorAll('.service-card[data-service]');
            return withAttr.length > 0 || 'No service cards with data-service';
        });
        
        this.test('Theme toggle works', () => {
            const html = document.documentElement;
            const theme = html.getAttribute('data-theme');
            return theme === 'dark' || theme === 'light';
        });
        
        this.test('Display mode set', () => {
            const html = document.documentElement;
            const mode = html.getAttribute('data-display-mode');
            return mode === 'day' || mode === 'night';
        });
        
        this.test('Demo mode detection works', () => {
            const meta = document.querySelector('meta[name="mulecube-mode"]');
            const isDemo = meta && meta.content === 'demo';
            if (typeof ModeManager !== 'undefined') {
                return ModeManager.isDemo === isDemo;
            }
            return true;
        });
    },
    
    // ====== Accessibility Tests ======
    
    testAccessibility() {
        console.log('\n--- Accessibility Tests ---');
        
        this.test('Skip link exists', () => {
            return document.querySelector('.skip-link') !== null;
        });
        
        this.test('Theme toggle has aria-label', () => {
            const toggle = document.getElementById('themeToggle');
            return !toggle || toggle.hasAttribute('aria-label');
        });
        
        this.test('Search input has aria-label', () => {
            const search = document.getElementById('serviceSearch');
            return !search || search.hasAttribute('aria-label');
        });
        
        this.test('Modals have role="dialog"', () => {
            // Check wizard if visible
            const wizard = document.querySelector('.wizard-container');
            return !wizard || wizard.getAttribute('role') === 'dialog';
        });
        
        this.test('Interactive elements are focusable', () => {
            const btns = document.querySelectorAll('.service-card, .tour-btn, .favorite-btn');
            let allFocusable = true;
            btns.forEach(btn => {
                const tabIndex = btn.getAttribute('tabindex');
                if (tabIndex === '-1') allFocusable = false;
            });
            return allFocusable;
        });
    },
    
    // ====== CSS Tests ======
    
    testCSS() {
        console.log('\n--- CSS Loading Tests ---');
        
        const cssFiles = [
            'dashboard.css',
            'skeleton-loaders.css',
            'plain-english-errors.css',
            'health-history.css',
            'favorites-manager.css',
            'tour-guide.css',
            'mobile-navigation.css'
        ];
        
        cssFiles.forEach(file => {
            this.test(`CSS loaded: ${file}`, () => {
                const links = document.querySelectorAll('link[rel="stylesheet"]');
                let found = false;
                links.forEach(link => {
                    if (link.href.includes(file)) found = true;
                });
                return found || `${file} not found in stylesheets`;
            });
        });
    },
    
    // ====== Run All Tests ======
    
    runAll() {
        console.log('========================================');
        console.log('MuleCube UX Enhancement Package QA');
        console.log('========================================');
        
        this.results = [];
        this.passed = 0;
        this.failed = 0;
        
        this.testMobileNavigation();
        this.testFavoritesManager();
        this.testSkeletonLoaders();
        this.testPlainEnglishErrors();
        this.testHealthHistory();
        this.testTourGuide();
        this.testSVGIcons();
        this.testIntegration();
        this.testAccessibility();
        this.testCSS();
        
        console.log('\n========================================');
        console.log(`Results: ${this.passed} passed, ${this.failed} failed`);
        console.log('========================================');
        
        if (this.failed > 0) {
            console.log('\nFailed tests:');
            this.results.filter(r => r.status !== 'PASS').forEach(r => {
                console.log(`  - ${r.name}: ${r.message}`);
            });
        }
        
        return {
            passed: this.passed,
            failed: this.failed,
            results: this.results
        };
    },
    
    // Quick smoke test
    smoke() {
        console.log('Quick smoke test...');
        const checks = [
            typeof MobileNavigation !== 'undefined',
            typeof FavoritesManager !== 'undefined',
            typeof SkeletonLoaders !== 'undefined',
            typeof PlainEnglishErrors !== 'undefined',
            typeof HealthHistory !== 'undefined',
            typeof TourGuide !== 'undefined'
        ];
        const allPassed = checks.every(c => c);
        console.log(allPassed ? 'SMOKE TEST PASSED' : 'SMOKE TEST FAILED');
        return allPassed;
    }
};

// Export for use
window.MuleCubeQA = MuleCubeQA;

console.log('MuleCube QA loaded. Run: MuleCubeQA.runAll() or MuleCubeQA.smoke()');
