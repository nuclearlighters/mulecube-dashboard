/**
 * MuleCube Dashboard - Unified JavaScript
 * Handles: Stats polling, Service status, Search, Theme toggle, Slideshow
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
        slideshowInterval: 5000
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
    // Service Status Manager
    // ==========================================
    const ServiceManager = {
        services: [],
        statusBanner: null,
        statusText: null,
        
        init() {
            this.statusBanner = document.getElementById('statusBanner');
            this.statusText = document.getElementById('statusText');
            // FIX #3: Only count services in .service-category, not Quick Start
            this.services = document.querySelectorAll('.service-category .service-card');
            
            if (ModeManager.isDemo) {
                this.simulateOnline();
            } else {
                this.checkAllServices();
                // Re-check every 30 seconds
                setInterval(() => this.checkAllServices(), 30000);
            }
        },
        
        async checkAllServices() {
            let online = 0;
            let total = this.services.length;
            
            // Set all to checking state
            this.services.forEach(card => {
                const status = card.querySelector('.service-status');
                if (status) status.className = 'service-status checking';
            });
            
            // Check each service
            const checks = Array.from(this.services).map(async (card) => {
                const url = card.getAttribute('href');
                const status = card.querySelector('.service-status');
                
                if (!url || url === '#' || url.startsWith('http')) {
                    // External or no URL - assume online
                    if (status) status.className = 'service-status';
                    return true;
                }
                
                try {
                    const response = await fetch(url, {
                        method: 'HEAD',
                        mode: 'no-cors',
                        signal: AbortSignal.timeout(CONFIG.serviceCheckTimeout)
                    });
                    
                    if (status) status.className = 'service-status';
                    return true;
                } catch (error) {
                    if (status) status.className = 'service-status offline';
                    return false;
                }
            });
            
            const results = await Promise.all(checks);
            online = results.filter(Boolean).length;
            
            this.updateBanner(online, total);
        },
        
        simulateOnline() {
            // In demo mode, show all services as online
            this.services.forEach(card => {
                const status = card.querySelector('.service-status');
                if (status) status.className = 'service-status';
            });
            
            this.updateBanner(this.services.length, this.services.length);
        },
        
        updateBanner(online, total) {
            if (!this.statusBanner || !this.statusText) return;
            
            if (online === total) {
                this.statusText.textContent = `All ${total} services operational`;
                this.statusBanner.classList.remove('error');
            } else {
                this.statusText.textContent = `${online}/${total} services online`;
                this.statusBanner.classList.add('error');
            }
        }
    };

    // ==========================================
    // Search Manager - FIX #4: Show individual cards, not categories
    // ==========================================
    const SearchManager = {
        input: null,
        
        init() {
            this.input = document.getElementById('serviceSearch');
            if (!this.input) return;
            
            this.input.addEventListener('input', (e) => {
                this.filter(e.target.value);
            });
            
            // Clear on Escape
            this.input.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.input.value = '';
                    this.filter('');
                }
            });
        },
        
        filter(query) {
            const normalized = query.toLowerCase().trim();
            // FIX #4: Only filter cards in .service-category, not Quick Start
            const cards = document.querySelectorAll('.service-category .service-card');
            const categories = document.querySelectorAll('.service-category');
            const quickStart = document.querySelector('.quick-start');
            const advancedToggle = document.querySelector('.advanced-toggle');
            const advancedSection = document.getElementById('advancedSection');
            
            // Hide Quick Start and Admin toggle when searching
            if (quickStart) {
                quickStart.style.display = normalized ? 'none' : '';
            }
            if (advancedToggle) {
                advancedToggle.style.display = normalized ? 'none' : '';
            }
            if (advancedSection && normalized) {
                // Show advanced section during search so those services are searchable
                advancedSection.style.display = 'block';
                advancedSection.classList.add('visible');
            }
            
            // FIX #4: Filter individual cards, toggle .hidden class
            cards.forEach(card => {
                const name = card.querySelector('h3')?.textContent.toLowerCase() || '';
                const desc = card.querySelector('p')?.textContent.toLowerCase() || '';
                const matches = !normalized || name.includes(normalized) || desc.includes(normalized);
                card.classList.toggle('hidden', !matches);
            });
            
            // Hide empty categories
            categories.forEach(cat => {
                const visibleCards = cat.querySelectorAll('.service-card:not(.hidden)');
                cat.style.display = visibleCards.length ? '' : 'none';
            });
            
            // Restore normal state when search is cleared
            if (!normalized) {
                if (advancedSection) {
                    // Check if admin tools were manually shown
                    const btn = document.getElementById('advancedToggle');
                    if (btn && !btn.classList.contains('active')) {
                        advancedSection.style.display = 'none';
                        advancedSection.classList.remove('visible');
                    }
                }
            }
        }
    };

    // ==========================================
    // Theme Manager
    // ==========================================
    const ThemeManager = {
        toggle: null,
        
        init() {
            this.toggle = document.getElementById('themeToggle');
            if (!this.toggle) return;
            
            // Load saved theme
            const saved = localStorage.getItem('theme');
            if (saved) {
                document.documentElement.setAttribute('data-theme', saved);
                this.updateIcon(saved);
            }
            
            this.toggle.addEventListener('click', () => this.toggleTheme());
        },
        
        toggleTheme() {
            const current = document.documentElement.getAttribute('data-theme') || 'dark';
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
    // FIX #5: Hero Toggle - Click status banner to collapse/expand hero
    // ==========================================
    const HeroToggle = {
        hero: null,
        statusBanner: null,
        isCollapsed: false,
        
        init() {
            this.hero = document.querySelector('.hero');
            this.statusBanner = document.getElementById('statusBanner');
            
            if (!this.hero || !this.statusBanner) return;
            
            // Load saved state
            this.isCollapsed = localStorage.getItem('heroCollapsed') === 'true';
            if (this.isCollapsed) {
                this.collapse(false); // No animation on initial load
            }
            
            // Click handler for status banner
            this.statusBanner.addEventListener('click', () => {
                this.toggle();
            });
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
        ServiceManager.init();
        SearchManager.init();
        ThemeManager.init();
        Slideshow.init();
        MobileMenu.init();
        SmoothScroll.init();
        AdvancedToggle.init();
        HeroToggle.init();  // FIX #5: Initialize hero toggle
        
        console.log('MuleCube Dashboard initialized', ModeManager.isDemo ? '(Demo Mode)' : '');
    });

})();
