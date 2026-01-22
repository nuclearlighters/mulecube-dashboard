/**
 * MuleCube Dashboard - Unified JavaScript
 * Handles: Stats polling, Service status, Search, Theme toggle, Slideshow, Recently Used
 * 
 * v0.4.1 - Fixed: Recently Used click tracking now uses event delegation
 */

(function() {
    'use strict';

    // ==========================================
    // Configuration
    // ==========================================
    const CONFIG = {
        statsEndpoint: '/stats.json',
        statsPollInterval: 5000,
        serviceCheckTimeout: 3000,
        slideshowInterval: 5000,
        recentlyUsedMax: 5
    };

    // ==========================================
    // Mode Detection
    // ==========================================
    const ModeManager = {
        isDemo: false,
        
        init() {
            // Check for demo mode meta tag
            const metaTag = document.querySelector('meta[name="mulecube-mode"]');
            this.isDemo = metaTag && metaTag.content === 'demo';
            
            if (this.isDemo) {
                document.body.classList.add('demo-mode');
                this.injectDemoBanner();
            }
            
            return this.isDemo;
        },
        
        injectDemoBanner() {
            const banner = document.createElement('div');
            banner.className = 'demo-banner';
            banner.innerHTML = `
                <span class="demo-label">Demo Mode</span>
                <span class="demo-text">This is a preview — on a real MuleCube, services run locally</span>
                <a href="https://mulecube.com/products/" class="demo-cta">Get Your MuleCube →</a>
            `;
            document.body.insertBefore(banner, document.body.firstChild);
        }
    };

    // ==========================================
    // Recently Used Manager
    // FIX: Now uses event delegation for click tracking
    // ==========================================
    const RecentlyUsedManager = {
        storageKey: 'mulecube-recently-used',
        container: null,
        emptyState: null,
        
        init() {
            this.container = document.getElementById('recentlyUsedGrid');
            this.emptyState = document.getElementById('recentlyUsedEmpty');
            
            if (!this.container) return;
            
            // FIX: Use event delegation on document to catch ALL service card clicks
            // This handles: Start Here, Recently Used, Categories, Admin sections
            document.addEventListener('click', (e) => {
                const card = e.target.closest('.service-card');
                if (card) {
                    const serviceName = card.dataset.service;
                    if (serviceName) {
                        this.trackUsage(serviceName);
                        // Re-render to update the Recently Used section
                        // Use setTimeout to let the navigation happen first
                        setTimeout(() => this.render(), 100);
                    }
                }
            });
            
            // Render initial state
            this.render();
        },
        
        getRecent() {
            try {
                const data = localStorage.getItem(this.storageKey);
                return data ? JSON.parse(data) : [];
            } catch {
                return [];
            }
        },
        
        trackUsage(serviceName) {
            let recent = this.getRecent();
            
            // Remove if already exists
            recent = recent.filter(s => s !== serviceName);
            
            // Add to front
            recent.unshift(serviceName);
            
            // Limit to max
            recent = recent.slice(0, CONFIG.recentlyUsedMax);
            
            localStorage.setItem(this.storageKey, JSON.stringify(recent));
        },
        
        render() {
            if (!this.container) return;
            
            const recent = this.getRecent();
            
            // Show empty state if no recent items
            if (recent.length === 0) {
                this.container.style.display = 'none';
                if (this.emptyState) this.emptyState.style.display = 'block';
                return;
            }
            
            // Hide empty state
            if (this.emptyState) this.emptyState.style.display = 'none';
            this.container.style.display = 'grid';
            
            // Clear and rebuild
            this.container.innerHTML = '';
            
            // Find and clone service cards for recently used
            recent.forEach(serviceName => {
                const originalCard = document.querySelector(`.service-category .service-card[data-service="${serviceName}"]`);
                if (originalCard) {
                    const clone = originalCard.cloneNode(true);
                    clone.classList.add('recently-used-card');
                    // Keep status indicator - will be updated by ServiceManager
                    this.container.appendChild(clone);
                }
            });
            
            // Update status dots on newly cloned cards
            // Need to sync with ServiceManager's current status
            if (typeof ServiceManager !== 'undefined' && ServiceManager.serviceStatus) {
                recent.forEach(serviceName => {
                    const status = ServiceManager.serviceStatus[serviceName];
                    if (status) {
                        ServiceManager.updateServiceStatus(serviceName, status);
                    }
                });
            }
        }
    };

    // ==========================================
    // Stats Manager
    // ==========================================
    const StatsManager = {
        elements: {},
        
        init() {
            this.elements = {
                cpu: document.getElementById('cpuValue'),
                memory: document.getElementById('memValue'),
                disk: document.getElementById('diskValue'),
                wifi: document.getElementById('wifiValue'),
                ethernet: document.getElementById('ethValue'),
                hostname: document.getElementById('hostname'),
                uptime: document.getElementById('uptime'),
                temperature: document.getElementById('tempValue'),
                batteryContainer: document.getElementById('batteryContainer'),
                batteryIcon: document.getElementById('batteryIcon'),
                batteryValue: document.getElementById('batteryValue'),
                batteryTime: document.getElementById('batteryTime')
            };
            
            if (ModeManager.isDemo) {
                this.startDemoStats();
            } else {
                this.fetchStats();
                setInterval(() => this.fetchStats(), CONFIG.statsPollInterval);
            }
        },
        
        async fetchStats() {
            try {
                const response = await fetch(CONFIG.statsEndpoint, { 
                    cache: 'no-store',
                    signal: AbortSignal.timeout(CONFIG.serviceCheckTimeout)
                });
                
                if (!response.ok) throw new Error('Stats fetch failed');
                
                const data = await response.json();
                this.updateDisplay(data);
            } catch (error) {
                console.warn('Stats fetch error:', error);
                // Keep last values on error
            }
        },
        
        updateDisplay(data) {
            if (this.elements.cpu) this.elements.cpu.textContent = `${data.cpu}%`;
            if (this.elements.memory) this.elements.memory.textContent = `${data.memory}%`;
            if (this.elements.disk) this.elements.disk.textContent = `${data.disk}%`;
            if (this.elements.wifi) this.elements.wifi.textContent = data.wifi || 'N/A';
            if (this.elements.ethernet) this.elements.ethernet.textContent = data.ethernet || 'N/A';
            if (this.elements.hostname) this.elements.hostname.textContent = data.hostname || 'mulecube';
            if (this.elements.uptime) this.elements.uptime.textContent = data.uptime || '--';
            
            // Temperature with color coding
            if (this.elements.temperature && data.temperature) {
                this.elements.temperature.textContent = `${data.temperature}°C`;
                this.elements.temperature.style.color = data.temperature > 80 ? '#ef4444' : data.temperature > 70 ? '#f59e0b' : '#22c55e';
            }
            
            // Battery (only show when available)
            if (this.elements.batteryContainer && data.battery_available) {
                this.elements.batteryContainer.style.display = 'flex';
                if (this.elements.batteryIcon) this.elements.batteryIcon.innerHTML = '<img src="/images/icons/stat-battery.svg" class="stat-icon">';
                if (this.elements.batteryValue) {
                    this.elements.batteryValue.textContent = `${data.battery_percent}%`;
                    this.elements.batteryValue.style.color = data.battery_percent < 20 ? '#ef4444' : data.battery_percent < 50 ? '#f59e0b' : '#22c55e';
                }
                if (this.elements.batteryTime) this.elements.batteryTime.textContent = data.battery_time ? `(${data.battery_time})` : '';
            } else if (this.elements.batteryContainer) {
                this.elements.batteryContainer.style.display = 'none';
            }
        },
        
        startDemoStats() {
            // Simulate realistic stats for demo
            const updateDemo = () => {
                const data = {
                    cpu: Math.floor(Math.random() * 30) + 5,
                    memory: Math.floor(Math.random() * 20) + 40,
                    disk: Math.floor(Math.random() * 5) + 60,
                    wifi: `${Math.floor(Math.random() * 5)} clients`,
                    ethernet: 'Disconnected',
                    hostname: 'mulecube-demo',
                    uptime: '12d 4h 32m',
                    temperature: Math.floor(Math.random() * 15) + 45,
                    battery_available: true,
                    battery_percent: Math.floor(Math.random() * 30) + 60,
                    battery_charging: Math.random() > 0.5,
                    battery_time: '3h 45m'
                };
                this.updateDisplay(data);
            };
            
            updateDemo();
            setInterval(updateDemo, CONFIG.statsPollInterval);
        }
    };

    // ==========================================
    // Service Status Manager - Per-service tracking
    // ==========================================
    const ServiceManager = {
        statusBanner: null,
        statusText: null,
        serviceStatus: {},  // Track status per service ID: { kiwix: 'online', openwebui: 'offline', ... }
        
        init() {
            this.statusBanner = document.getElementById('statusBanner');
            this.statusText = document.getElementById('statusText');
            
            if (ModeManager.isDemo) {
                this.simulateOnline();
            } else {
                this.checkAllServices();
                // Re-check every 30 seconds
                setInterval(() => this.checkAllServices(), 30000);
            }
        },
        
        // Update all cards with a given service ID to a specific status
        updateServiceStatus(serviceId, status) {
            this.serviceStatus[serviceId] = status;
            
            // Find ALL cards with this service ID (categories, Start Here, Recently Used, Admin)
            document.querySelectorAll(`.service-card[data-service="${serviceId}"]`).forEach(card => {
                const statusDot = card.querySelector('.service-status');
                if (statusDot) {
                    statusDot.className = 'service-status' + (status === 'offline' ? ' offline' : status === 'checking' ? ' checking' : '');
                }
            });
        },
        
        async checkAllServices() {
            // Get unique services from category cards (source of truth)
            const categoryCards = document.querySelectorAll('.service-category .service-card');
            const uniqueServices = new Map();
            
            categoryCards.forEach(card => {
                const serviceId = card.getAttribute('data-service');
                const url = card.getAttribute('href');
                if (serviceId && !uniqueServices.has(serviceId)) {
                    uniqueServices.set(serviceId, url);
                }
            });
            
            // Set all to checking state
            uniqueServices.forEach((url, serviceId) => {
                this.updateServiceStatus(serviceId, 'checking');
            });
            
            // Check each unique service
            let online = 0;
            const total = uniqueServices.size;
            
            const checks = Array.from(uniqueServices.entries()).map(async ([serviceId, url]) => {
                if (!url || url === '#' || url.startsWith('http')) {
                    // External or no URL - assume online
                    this.updateServiceStatus(serviceId, 'online');
                    return true;
                }
                
                try {
                    await fetch(url, {
                        method: 'HEAD',
                        mode: 'no-cors',
                        signal: AbortSignal.timeout(CONFIG.serviceCheckTimeout)
                    });
                    
                    this.updateServiceStatus(serviceId, 'online');
                    return true;
                } catch (error) {
                    this.updateServiceStatus(serviceId, 'offline');
                    return false;
                }
            });
            
            const results = await Promise.all(checks);
            online = results.filter(r => r).length;
            
            this.updateStatusBanner(online, total);
        },
        
        updateStatusBanner(online, total) {
            if (!this.statusBanner || !this.statusText) return;
            
            const offline = total - online;
            const offlinePercent = (offline / total) * 100;
            
            // Remove all state classes
            this.statusBanner.classList.remove('error', 'warning');
            
            if (offline === 0) {
                // All services operational - green
                this.statusText.innerHTML = `All ${total} services operational`;
            } else if (offlinePercent <= 20) {
                // Minor issue (1-20% offline) - warning/orange
                this.statusBanner.classList.add('warning');
                this.statusText.innerHTML = `${online} services online <span class="status-count offline">${offline} offline</span>`;
            } else {
                // Major issue (>20% offline) - error/red
                this.statusBanner.classList.add('error');
                this.statusText.innerHTML = `${online}/${total} services online <span class="status-count offline">${offline} offline</span>`;
            }
        },
        
        simulateOnline() {
            // Get all unique service IDs from category cards
            const categoryCards = document.querySelectorAll('.service-category .service-card');
            const serviceIds = new Set();
            
            categoryCards.forEach(card => {
                const serviceId = card.getAttribute('data-service');
                if (serviceId) serviceIds.add(serviceId);
            });
            
            // Set each service to online - this updates ALL cards with that service ID
            serviceIds.forEach(serviceId => {
                this.updateServiceStatus(serviceId, 'online');
            });
            
            if (this.statusText) {
                this.statusText.textContent = `All ${serviceIds.size} services simulated`;
            }
        }
    };

    // ==========================================
    // Search Manager
    // ==========================================
    const SearchManager = {
        input: null,
        services: [],
        categories: [],
        quickStart: null,
        advancedSection: null,
        
        init() {
            this.input = document.getElementById('serviceSearch');
            // Only search within service-category containers
            this.services = document.querySelectorAll('.service-category .service-card');
            this.categories = document.querySelectorAll('.service-category');
            this.quickStart = document.querySelector('.quick-start');
            this.advancedSection = document.getElementById('advancedSection');
            
            if (!this.input) return;
            
            this.input.addEventListener('input', (e) => this.filter(e.target.value));
            
            // Clear on Escape
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.input.value = '';
                    this.filter('');
                    this.input.blur();
                }
            });
        },
        
        filter(query) {
            const search = query.toLowerCase().trim();
            
            if (!search) {
                // Reset - show all cards, restore category visibility
                this.services.forEach(card => card.classList.remove('hidden'));
                this.categories.forEach(cat => cat.style.display = '');
                if (this.quickStart) this.quickStart.style.display = '';
                // Restore advanced section to its toggle state
                const advToggleBtn = document.getElementById('advancedToggle');
                if (this.advancedSection && advToggleBtn && !advToggleBtn.classList.contains('active')) {
                    this.advancedSection.style.display = 'none';
                }
                return;
            }
            
            // Hide Quick Start during search
            if (this.quickStart) this.quickStart.style.display = 'none';
            
            // Show advanced section during search so those services are searchable
            if (this.advancedSection) this.advancedSection.style.display = 'block';
            
            // Filter individual cards
            this.services.forEach(card => {
                const name = card.querySelector('h3')?.textContent.toLowerCase() || '';
                const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
                const match = name.includes(search) || desc.includes(search);
                card.classList.toggle('hidden', !match);
            });
            
            // Hide categories with no visible cards
            this.categories.forEach(cat => {
                const visibleCards = cat.querySelectorAll('.service-card:not(.hidden)');
                cat.style.display = visibleCards.length === 0 ? 'none' : '';
            });
        }
    };

    // ==========================================
    // Theme Manager
    // ==========================================
    const ThemeManager = {
        toggle: null,
        
        init() {
            this.toggle = document.getElementById('themeToggle');
            
            // Load saved theme or use system preference
            const saved = localStorage.getItem('theme');
            const system = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
            const theme = saved || system;
            
            document.documentElement.setAttribute('data-theme', theme);
            this.updateIcon(theme);
            
            if (this.toggle) {
                this.toggle.addEventListener('click', () => this.toggleTheme());
            }
        },
        
        toggleTheme() {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            this.updateIcon(next);
        },
        
        updateIcon(theme) {
            if (this.toggle) {
                this.toggle.innerHTML = theme === 'dark' 
                    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
                    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
                this.toggle.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
            }
        }
    };

    // ==========================================
    // Hero Slideshow
    // ==========================================
    const Slideshow = {
        slides: [],
        currentIndex: 0,
        interval: null,
        
        init() {
            this.slides = document.querySelectorAll('.hero-slide');
            if (this.slides.length <= 1) return;
            
            this.start();
            
            // Pause on hover
            const hero = document.querySelector('.hero');
            if (hero) {
                hero.addEventListener('mouseenter', () => this.pause());
                hero.addEventListener('mouseleave', () => this.start());
            }
            
            // Pause when tab hidden
            document.addEventListener('visibilitychange', () => {
                document.hidden ? this.pause() : this.start();
            });
        },
        
        start() {
            if (this.interval) return;
            this.interval = setInterval(() => this.next(), CONFIG.slideshowInterval);
        },
        
        pause() {
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
        },
        
        next() {
            this.slides[this.currentIndex].classList.remove('active');
            this.currentIndex = (this.currentIndex + 1) % this.slides.length;
            this.slides[this.currentIndex].classList.add('active');
        }
    };

    // ==========================================
    // Mobile Menu
    // ==========================================
    const MobileMenu = {
        init() {
            const toggle = document.querySelector('.menu-toggle');
            const nav = document.querySelector('.nav-links');
            
            if (!toggle || !nav) return;
            
            toggle.addEventListener('click', () => {
                nav.classList.toggle('active');
                toggle.classList.toggle('active');
            });
            
            // Close on link click
            nav.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    nav.classList.remove('active');
                    toggle.classList.remove('active');
                });
            });
        }
    };

    // ==========================================
    // Smooth Scroll
    // ==========================================
    const SmoothScroll = {
        init() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = document.querySelector(anchor.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
        }
    };

    // ==========================================
    // Advanced Toggle
    // ==========================================
    const AdvancedToggle = {
        init() {
            const btn = document.getElementById('advancedToggle');
            const section = document.getElementById('advancedSection');
            
            if (!btn || !section) return;
            
            btn.addEventListener('click', () => {
                const isVisible = section.style.display !== 'none';
                section.style.display = isVisible ? 'none' : 'block';
                btn.classList.toggle('active', !isVisible);
                
                // Update button text with icon
                const iconHtml = '<img src="/images/icons/ui-chevron.svg" alt="" class="toggle-icon">';
                btn.innerHTML = isVisible 
                    ? iconHtml + ' Show Admin Tools' 
                    : iconHtml + ' Hide Admin Tools';
                
                if (!isVisible) {
                    setTimeout(() => section.classList.add('visible'), 10);
                } else {
                    section.classList.remove('visible');
                }
            });
        }
    };

    // ==========================================
    // Category Collapse/Expand
    // ==========================================
    const CategoryToggle = {
        storageKey: 'mulecube-collapsed-categories',
        
        init() {
            const categories = document.querySelectorAll('.service-category');
            const collapsed = this.getCollapsed();
            
            categories.forEach(cat => {
                const title = cat.querySelector('.category-title');
                const grid = cat.querySelector('.service-grid');
                const categoryName = title?.textContent.trim();
                
                if (!title || !grid || !categoryName) return;
                
                // Make title clickable
                title.style.cursor = 'pointer';
                title.classList.add('collapsible');
                
                // Add toggle indicator
                const indicator = document.createElement('span');
                indicator.className = 'category-toggle-indicator';
                indicator.innerHTML = '▼';
                title.appendChild(indicator);
                
                // Restore collapsed state
                if (collapsed.includes(categoryName)) {
                    grid.classList.add('collapsed');
                    indicator.classList.add('collapsed');
                }
                
                // Toggle on click
                title.addEventListener('click', () => {
                    grid.classList.toggle('collapsed');
                    indicator.classList.toggle('collapsed');
                    this.saveState(categoryName, grid.classList.contains('collapsed'));
                });
            });
        },
        
        getCollapsed() {
            try {
                const data = localStorage.getItem(this.storageKey);
                return data ? JSON.parse(data) : [];
            } catch {
                return [];
            }
        },
        
        saveState(categoryName, isCollapsed) {
            let collapsed = this.getCollapsed();
            if (isCollapsed && !collapsed.includes(categoryName)) {
                collapsed.push(categoryName);
            } else if (!isCollapsed) {
                collapsed = collapsed.filter(c => c !== categoryName);
            }
            localStorage.setItem(this.storageKey, JSON.stringify(collapsed));
        }
    };

    // ==========================================
    // Hero Toggle - Click status banner to collapse/expand hero
    // CHANGED: Now defaults to COLLAPSED
    // ==========================================
    const HeroToggle = {
        hero: null,
        statusBanner: null,
        isCollapsed: true, // Default to collapsed
        
        init() {
            this.hero = document.querySelector('.hero');
            this.statusBanner = document.getElementById('statusBanner');
            
            if (!this.hero || !this.statusBanner) return;
            
            // Load saved state - DEFAULT TO COLLAPSED (!== 'false' means collapsed unless explicitly set to false)
            const saved = localStorage.getItem('heroCollapsed');
            this.isCollapsed = saved !== 'false'; // Collapsed unless user explicitly expanded
            
            if (this.isCollapsed) {
                this.collapse(false); // No animation on initial load
            }
            
            // Click handler for status banner
            this.statusBanner.addEventListener('click', () => {
                this.toggle();
            });
            
            // Add tooltip
            this.statusBanner.title = 'Click to show/hide hero section';
        },
        
        toggle() {
            if (this.isCollapsed) {
                this.expand();
            } else {
                this.collapse(true);
            }
        },
        
        collapse(animate = true) {
            if (!this.hero) return;
            
            this.isCollapsed = true;
            this.hero.classList.add('collapsed');
            this.statusBanner.classList.add('hero-hidden');
            localStorage.setItem('heroCollapsed', 'true');
        },
        
        expand() {
            if (!this.hero) return;
            
            this.isCollapsed = false;
            this.hero.classList.remove('collapsed');
            this.statusBanner.classList.remove('hero-hidden');
            localStorage.setItem('heroCollapsed', 'false');
        }
    };

    // ==========================================
    // Initialize
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        ModeManager.init();
        StatsManager.init();
        RecentlyUsedManager.init();  // Must run before ServiceManager to populate cards
        ServiceManager.init();       // Then update all status dots including Recently Used
        SearchManager.init();
        ThemeManager.init();
        Slideshow.init();
        MobileMenu.init();
        SmoothScroll.init();
        AdvancedToggle.init();
        CategoryToggle.init();
        HeroToggle.init();
        
        console.log('MuleCube Dashboard v0.4.1 initialized', ModeManager.isDemo ? '(Demo Mode)' : '');
    });

})();
