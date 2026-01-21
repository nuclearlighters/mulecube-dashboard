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
                <span class="demo-label">🎭 Demo Mode</span>
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
                if (this.elements.batteryIcon) this.elements.batteryIcon.textContent = data.battery_charging ? '⚡' : '🔋';
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
                    ethernet: 'Connected',
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
            this.services = document.querySelectorAll('.service-card');
            
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
                    card.classList.remove('offline');
                    return true;
                } catch (error) {
                    if (status) status.className = 'service-status offline';
                    card.classList.add('offline');
                    return false;
                }
            });
            
            const results = await Promise.all(checks);
            online = results.filter(r => r).length;
            
            this.updateBanner(online, total);
        },
        
        updateBanner(online, total) {
            if (!this.statusBanner || !this.statusText) return;
            
            const dot = this.statusBanner.querySelector('.status-dot');
            
            if (online === total) {
                this.statusBanner.className = 'status-banner';
                if (dot) dot.className = 'status-dot';
                this.statusText.textContent = `All ${total} services operational`;
            } else {
                this.statusBanner.className = 'status-banner warning';
                if (dot) dot.className = 'status-dot warning';
                this.statusText.textContent = `${online}/${total} services online`;
            }
        },
        
        simulateOnline() {
            const total = this.services.length;
            this.services.forEach(card => {
                const status = card.querySelector('.service-status');
                if (status) status.className = 'service-status';
            });
            this.updateBanner(total, total);
        }
    };

    // ==========================================
    // Search/Filter Manager
    // ==========================================
    const SearchManager = {
        input: null,
        
        init() {
            this.input = document.getElementById('serviceSearch');
            if (!this.input) return;
            
            this.input.addEventListener('input', (e) => this.filter(e.target.value));
            
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
            const cards = document.querySelectorAll('.service-card');
            const categories = document.querySelectorAll('.service-category');
            
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
                this.toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
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
        
        console.log('🟩 MuleCube Dashboard initialized', ModeManager.isDemo ? '(Demo Mode)' : '');
    });

})();
