/**
 * MuleCube Dashboard JavaScript
 * Handles: Theme toggle, stats polling, service status, hero slideshow
 * Supports both device mode (real stats) and demo mode (simulated)
 */

(function() {
    'use strict';

    // ========================================
    // Mode Detection
    // ========================================
    const ModeManager = {
        isDemo: false,
        
        init() {
            // Check if running in demo mode via meta tag or failed stats fetch
            const metaMode = document.querySelector('meta[name="mulecube-mode"]');
            if (metaMode && metaMode.content === 'demo') {
                this.setDemoMode();
            }
        },
        
        setDemoMode() {
            this.isDemo = true;
            document.body.classList.add('demo-mode');
            this.showDemoBanner();
            console.log('🎭 Running in demo mode');
        },
        
        showDemoBanner() {
            const banner = document.createElement('div');
            banner.className = 'demo-banner';
            banner.innerHTML = `
                <span>🎭 Demo Mode</span>
                <span class="demo-subtitle">This is a preview — on a real MuleCube, services run locally</span>
                <a href="https://mulecube.com/products" class="demo-cta">Get Your MuleCube →</a>
            `;
            document.body.prepend(banner);
        }
    };

    // ========================================
    // Theme Management
    // ========================================
    const ThemeManager = {
        STORAGE_KEY: 'mulecube-theme',
        
        init() {
            const savedTheme = localStorage.getItem(this.STORAGE_KEY);
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const theme = savedTheme || (prefersDark ? 'dark' : 'light');
            
            this.setTheme(theme);
            this.bindToggle();
        },
        
        setTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem(this.STORAGE_KEY, theme);
            this.updateToggleIcon(theme);
        },
        
        toggle() {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            this.setTheme(next);
        },
        
        updateToggleIcon(theme) {
            const btn = document.getElementById('themeToggle');
            if (btn) {
                btn.textContent = theme === 'dark' ? '🌙' : '☀️';
                btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
            }
        },
        
        bindToggle() {
            const btn = document.getElementById('themeToggle');
            if (btn) {
                btn.addEventListener('click', () => this.toggle());
            }
        }
    };

    // ========================================
    // Stats Polling
    // ========================================
    const StatsManager = {
        POLL_INTERVAL: 5000,
        DEMO_POLL_INTERVAL: 3000,
        demoStats: {
            cpu: { min: 15, max: 45, current: 23 },
            memory: { min: 40, max: 55, current: 47 },
            disk: { base: 62 }
        },
        
        init() {
            this.fetchStats();
            // In demo mode, animate stats more frequently
            const interval = ModeManager.isDemo ? this.DEMO_POLL_INTERVAL : this.POLL_INTERVAL;
            setInterval(() => this.fetchStats(), interval);
        },
        
        async fetchStats() {
            // If already in demo mode, just update demo stats
            if (ModeManager.isDemo) {
                this.updateDemoStats();
                return;
            }
            
            try {
                const response = await fetch('/stats.json');
                if (!response.ok) throw new Error('Stats unavailable');
                
                const stats = await response.json();
                this.updateUI(stats);
            } catch (error) {
                console.warn('Stats unavailable, switching to demo mode');
                ModeManager.setDemoMode();
                this.updateDemoStats();
            }
        },
        
        updateUI(stats) {
            this.updateElement('cpuValue', `${stats.cpu}%`);
            this.updateElement('memValue', `${stats.memory}%`);
            this.updateElement('diskValue', `${stats.disk}%`);
            this.updateElement('wifiValue', stats.wifi || 'N/A');
            this.updateElement('ethValue', stats.ethernet || 'N/A');
            this.updateElement('hostname', stats.hostname || 'mulecube');
            this.updateElement('uptime', stats.uptime || '--');
        },
        
        updateDemoStats() {
            // Simulate realistic fluctuating stats
            this.demoStats.cpu.current = this.fluctuate(
                this.demoStats.cpu.current, 
                this.demoStats.cpu.min, 
                this.demoStats.cpu.max, 
                5
            );
            this.demoStats.memory.current = this.fluctuate(
                this.demoStats.memory.current, 
                this.demoStats.memory.min, 
                this.demoStats.memory.max, 
                2
            );
            
            this.updateElement('cpuValue', `${this.demoStats.cpu.current}%`);
            this.updateElement('memValue', `${this.demoStats.memory.current}%`);
            this.updateElement('diskValue', `${this.demoStats.disk.base}%`);
            this.updateElement('wifiValue', 'MuleCube-AP');
            this.updateElement('ethValue', 'Connected');
            this.updateElement('hostname', 'mulecube');
            this.updateElement('uptime', '3d 14h 22m');
        },
        
        fluctuate(current, min, max, variance) {
            const change = (Math.random() - 0.5) * variance * 2;
            let newValue = Math.round(current + change);
            return Math.max(min, Math.min(max, newValue));
        },
        
        updateElement(id, value) {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        }
    };

    // ========================================
    // Service Status Checker
    // ========================================
    const ServiceChecker = {
        services: [],
        
        init() {
            this.services = Array.from(document.querySelectorAll('.service-card[data-service]'));
            
            if (ModeManager.isDemo) {
                // In demo mode, simulate all services online
                this.simulateAllOnline();
            } else {
                this.checkAllServices();
                setInterval(() => this.checkAllServices(), 30000);
            }
        },
        
        simulateAllOnline() {
            const totalCount = this.services.length;
            
            // Mark all services as online
            this.services.forEach(card => {
                card.classList.remove('down');
                const statusDot = card.querySelector('.service-status');
                if (statusDot) statusDot.classList.remove('down');
            });
            
            this.updateStatusBanner(totalCount, totalCount, true);
        },
        
        async checkAllServices() {
            let upCount = 0;
            let totalCount = this.services.length;
            
            for (const card of this.services) {
                const isUp = await this.checkService(card);
                if (isUp) upCount++;
            }
            
            this.updateStatusBanner(upCount, totalCount, false);
        },
        
        async checkService(card) {
            const url = card.getAttribute('href');
            const statusDot = card.querySelector('.service-status');
            
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 3000);
                
                const response = await fetch(url, {
                    method: 'HEAD',
                    mode: 'no-cors',
                    signal: controller.signal
                });
                
                clearTimeout(timeout);
                
                card.classList.remove('down');
                if (statusDot) statusDot.classList.remove('down');
                return true;
            } catch (error) {
                card.classList.add('down');
                if (statusDot) statusDot.classList.add('down');
                return false;
            }
        },
        
        updateStatusBanner(up, total, isDemo) {
            const banner = document.getElementById('statusBanner');
            const text = document.getElementById('statusText');
            const dot = banner?.querySelector('.status-dot');
            
            if (!banner || !text) return;
            
            if (up === total) {
                banner.classList.remove('some-down');
                if (isDemo) {
                    text.textContent = `All ${total} services simulated`;
                } else {
                    text.textContent = `All ${total} services operational`;
                }
                if (dot) dot.classList.remove('down');
            } else {
                banner.classList.add('some-down');
                text.textContent = `${up}/${total} services online`;
                if (dot) dot.classList.add('down');
            }
        }
    };

    // ========================================
    // Hero Slideshow
    // ========================================
    const HeroSlideshow = {
        INTERVAL: 6000,
        currentIndex: 0,
        slides: [],
        
        init() {
            this.slides = Array.from(document.querySelectorAll('.hero-slide'));
            if (this.slides.length <= 1) return;
            
            setInterval(() => this.next(), this.INTERVAL);
        },
        
        next() {
            this.slides[this.currentIndex].classList.remove('active');
            this.currentIndex = (this.currentIndex + 1) % this.slides.length;
            this.slides[this.currentIndex].classList.add('active');
        }
    };

    // ========================================
    // Smooth Scroll for Anchor Links
    // ========================================
    const SmoothScroll = {
        init() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    const href = anchor.getAttribute('href');
                    if (href === '#') return;
                    
                    const target = document.querySelector(href);
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        }
    };

    // ========================================
    // Initialize Everything
    // ========================================
    document.addEventListener('DOMContentLoaded', () => {
        ModeManager.init();
        ThemeManager.init();
        StatsManager.init();
        ServiceChecker.init();
        HeroSlideshow.init();
        SmoothScroll.init();
        
        console.log('🟩 MuleCube Dashboard initialized');
    });

})();
