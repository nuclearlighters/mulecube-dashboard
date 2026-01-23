/**
 * MuleCube Dashboard - Unified JavaScript
 * Handles: Stats polling, Service status, Search, Theme toggle, Slideshow, Recently Used,
 *          Display Modes, Keyboard Shortcuts, Sync Status, Onboarding Wizard, System Functions
 * 
 * v0.5.0 - Major Update: Added display modes, keyboard shortcuts, sync status, onboarding wizard,
 *          accessibility improvements, system functions UI, contextual help
 */

(function() {
    'use strict';

    // ==========================================
    // Configuration
    // ==========================================
    const CONFIG = {
        statsEndpoint: '/stats.json',
        syncEndpoint: '/api/sync/status',
        statsPollInterval: 5000,
        serviceCheckTimeout: 3000,
        slideshowInterval: 5000,
        recentlyUsedMax: 5,
        wizardStorageKey: 'mulecube-wizard-completed',
        profileStorageKey: 'mulecube-user-profile',
        displayModeKey: 'mulecube-display-mode',
        version: '0.5.0'
    };

    // ==========================================
    // Display Mode Manager (Day/Night/Sunlight)
    // ==========================================
    const DisplayModeManager = {
        modes: ['day', 'night', 'sunlight'],
        currentMode: 'day',
        toggle: null,
        
        // SVG icons for each mode (inline for reliability)
        icons: {
            day: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
            night: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>',
            sunlight: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>'
        },
        
        init() {
            // Use the existing theme toggle button
            this.toggle = document.getElementById('themeToggle');
            
            // Load saved mode or detect from time
            const saved = localStorage.getItem(CONFIG.displayModeKey);
            if (saved && this.modes.includes(saved)) {
                this.currentMode = saved;
            } else {
                this.currentMode = this.detectModeFromTime();
            }
            
            this.applyMode(this.currentMode);
            
            // Replace existing click handler by cloning
            if (this.toggle) {
                const newToggle = this.toggle.cloneNode(true);
                this.toggle.parentNode.replaceChild(newToggle, this.toggle);
                this.toggle = newToggle;
                
                this.toggle.addEventListener('click', () => this.cycleMode());
                this.updateToggleIcon();
            }
        },
        
        detectModeFromTime() {
            const hour = new Date().getHours();
            if (hour >= 6 && hour < 20) return 'day';
            return 'night';
        },
        
        applyMode(mode) {
            this.currentMode = mode;
            document.documentElement.setAttribute('data-display-mode', mode);
            
            // Also set the base theme
            const theme = (mode === 'day') ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            
            localStorage.setItem(CONFIG.displayModeKey, mode);
            this.updateToggleIcon();
        },
        
        cycleMode() {
            const currentIndex = this.modes.indexOf(this.currentMode);
            const nextIndex = (currentIndex + 1) % this.modes.length;
            this.applyMode(this.modes[nextIndex]);
        },
        
        setMode(mode) {
            if (this.modes.includes(mode)) {
                this.applyMode(mode);
            }
        },
        
        updateToggleIcon() {
            if (!this.toggle) return;
            
            const labels = {
                day: 'Day mode (click for Night)',
                night: 'Night mode (click for Sunlight)',
                sunlight: 'Sunlight mode (click for Day)'
            };
            
            this.toggle.innerHTML = this.icons[this.currentMode];
            this.toggle.title = labels[this.currentMode];
            this.toggle.setAttribute('aria-label', labels[this.currentMode]);
        }
    };

    // ==========================================
    // Keyboard Shortcuts Manager
    // ==========================================
    const KeyboardShortcuts = {
        shortcuts: {},
        helpVisible: false,
        
        init() {
            this.shortcuts = {
                '/': () => this.focusSearch(),
                'Escape': () => this.handleEscape(),
                '?': () => this.toggleHelp(),
                't': () => DisplayModeManager.cycleMode(), // Theme toggle now cycles display modes
                'm': () => DisplayModeManager.cycleMode(),
                'h': () => window.scrollTo({ top: 0, behavior: 'smooth' }),
                's': () => SyncStatusManager.togglePanel()
            };
            
            document.addEventListener('keydown', (e) => this.handleKeydown(e));
        },
        
        handleKeydown(e) {
            // Ignore if typing in input/textarea
            const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
            
            if (isTyping) {
                // Only handle Escape while typing
                if (e.key === 'Escape') {
                    this.handleEscape();
                    e.target.blur();
                }
                return;
            }
            
            // Number keys 1-9 for quick launch
            if (e.key >= '1' && e.key <= '9' && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                this.quickLaunch(parseInt(e.key) - 1);
                return;
            }
            
            // Other shortcuts
            const handler = this.shortcuts[e.key];
            if (handler && !e.ctrlKey && !e.altKey && !e.metaKey) {
                e.preventDefault();
                handler();
            }
        },
        
        focusSearch() {
            const search = document.getElementById('serviceSearch');
            if (search) {
                search.focus();
                search.select();
            }
        },
        
        handleEscape() {
            // Close help overlay if open
            if (this.helpVisible) {
                this.toggleHelp();
                return;
            }
            
            // Close any open modals
            const modals = document.querySelectorAll('.modal-overlay, .wizard-overlay, .shortcuts-modal');
            modals.forEach(m => m.remove());
            
            // Clear search
            const search = document.getElementById('serviceSearch');
            if (search && search.value) {
                search.value = '';
                SearchManager.filter('');
            }
            
            // Close sync panel if open
            SyncStatusManager.closePanel();
        },
        
        quickLaunch(index) {
            const startHereCards = document.querySelectorAll('.start-here .service-card');
            if (startHereCards[index]) {
                startHereCards[index].click();
            }
        },
        
        toggleHelp() {
            if (this.helpVisible) {
                const modal = document.querySelector('.shortcuts-modal');
                if (modal) modal.remove();
                this.helpVisible = false;
                return;
            }
            
            this.showHelp();
        },
        
        showHelp() {
            const modal = document.createElement('div');
            modal.className = 'shortcuts-modal';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-labelledby', 'shortcuts-title');
            modal.innerHTML = `
                <div class="shortcuts-overlay" onclick="this.parentElement.remove()"></div>
                <div class="shortcuts-content">
                    <h3 id="shortcuts-title">Keyboard Shortcuts</h3>
                    <div class="shortcuts-grid">
                        <div class="shortcut-item">
                            <kbd>/</kbd>
                            <span>Focus search</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Esc</kbd>
                            <span>Clear/Close</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>1</kbd>-<kbd>9</kbd>
                            <span>Quick launch services</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>?</kbd>
                            <span>Show/hide this help</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>t</kbd>
                            <span>Toggle theme</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>m</kbd>
                            <span>Cycle display mode</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>h</kbd>
                            <span>Scroll to top</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>s</kbd>
                            <span>Toggle sync status</span>
                        </div>
                    </div>
                    <button class="shortcuts-close" onclick="this.closest('.shortcuts-modal').remove()">
                        Close <span class="key-hint">Esc</span>
                    </button>
                </div>
            `;
            document.body.appendChild(modal);
            this.helpVisible = true;
            
            // Focus the close button for accessibility
            modal.querySelector('.shortcuts-close').focus();
        }
    };

    // ==========================================
    // Sync Status Manager
    // ==========================================
    const SyncStatusManager = {
        container: null,
        panelOpen: false,
        status: {
            state: 'unknown', // synced, syncing, offline, error
            lastSync: null,
            pending: 0,
            services: []
        },
        
        init() {
            this.createWidget();
            this.updateStatus();
            
            // Poll for sync status every 30 seconds
            setInterval(() => this.updateStatus(), 30000);
        },
        
        createWidget() {
            // Find the status banner to add sync widget
            const statusBanner = document.getElementById('statusBanner');
            if (!statusBanner) return;
            
            // Create sync status widget
            this.container = document.createElement('div');
            this.container.className = 'sync-status-widget';
            this.container.id = 'syncStatusWidget';
            this.container.setAttribute('role', 'status');
            this.container.setAttribute('aria-live', 'polite');
            this.container.innerHTML = `
                <button class="sync-status-button" onclick="SyncStatusManager.togglePanel()" aria-expanded="false">
                    <span class="sync-icon">↻</span>
                    <span class="sync-text">Checking...</span>
                </button>
                <div class="sync-panel" id="syncPanel" hidden>
                    <div class="sync-panel-header">
                        <h4>Sync Status</h4>
                        <button class="sync-now-btn" onclick="SyncStatusManager.triggerSync()">Sync Now</button>
                    </div>
                    <div class="sync-panel-content">
                        <div class="sync-detail">
                            <span class="sync-label">Last sync:</span>
                            <span class="sync-value" id="lastSyncTime">Never</span>
                        </div>
                        <div class="sync-detail">
                            <span class="sync-label">Connection:</span>
                            <span class="sync-value" id="syncConnection">Checking...</span>
                        </div>
                        <div class="sync-detail" id="pendingContainer" hidden>
                            <span class="sync-label">Pending:</span>
                            <span class="sync-value" id="pendingCount">0 items</span>
                        </div>
                        <div class="sync-services" id="syncServices"></div>
                    </div>
                </div>
            `;
            
            // Insert before status text
            const statusText = document.getElementById('statusText');
            if (statusText) {
                statusText.parentNode.insertBefore(this.container, statusText);
            }
        },
        
        async updateStatus() {
            if (ModeManager.isDemo) {
                this.simulateStatus();
                return;
            }
            
            try {
                // Check if we have network connectivity to services
                const online = navigator.onLine;
                
                if (!online) {
                    this.setStatus('offline', null, 0);
                    return;
                }
                
                // Try to fetch sync status from API
                try {
                    const response = await fetch(CONFIG.syncEndpoint, {
                        signal: AbortSignal.timeout(3000)
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        this.setStatus(data.state, data.lastSync, data.pending, data.services);
                    } else {
                        // API exists but returned error
                        this.setStatus('synced', new Date().toISOString(), 0);
                    }
                } catch {
                    // No sync API - assume local operation (synced state)
                    this.setStatus('synced', new Date().toISOString(), 0);
                }
            } catch (error) {
                console.warn('Sync status check failed:', error);
                this.setStatus('offline', null, 0);
            }
        },
        
        setStatus(state, lastSync, pending, services = []) {
            this.status = { state, lastSync, pending, services };
            this.render();
        },
        
        simulateStatus() {
            // Demo mode simulation
            const states = ['synced', 'syncing', 'offline'];
            const state = states[Math.floor(Math.random() * 10) < 8 ? 0 : (Math.random() < 0.5 ? 1 : 2)];
            const pending = state === 'offline' ? Math.floor(Math.random() * 10) : 0;
            const lastSync = state !== 'offline' ? new Date(Date.now() - Math.random() * 600000).toISOString() : null;
            
            this.setStatus(state, lastSync, pending, [
                { name: 'Syncthing', status: state === 'offline' ? 'paused' : 'running' },
                { name: 'Vaultwarden', status: 'running' }
            ]);
        },
        
        render() {
            const button = this.container?.querySelector('.sync-status-button');
            const iconEl = this.container?.querySelector('.sync-icon');
            const textEl = this.container?.querySelector('.sync-text');
            
            if (!button || !iconEl || !textEl) return;
            
            const { state, lastSync, pending } = this.status;
            
            // Update icon and text
            const configs = {
                synced: { icon: '✓', text: this.formatLastSync(lastSync), class: 'synced' },
                syncing: { icon: '↻', text: 'Syncing...', class: 'syncing' },
                offline: { icon: '⚠', text: pending > 0 ? `${pending} pending` : 'Offline', class: 'offline' },
                error: { icon: '✕', text: 'Sync error', class: 'error' },
                unknown: { icon: '?', text: 'Checking...', class: 'unknown' }
            };
            
            const config = configs[state] || configs.unknown;
            iconEl.textContent = config.icon;
            textEl.textContent = config.text;
            button.className = `sync-status-button ${config.class}`;
            
            // Update panel details
            const lastSyncEl = document.getElementById('lastSyncTime');
            const connectionEl = document.getElementById('syncConnection');
            const pendingContainer = document.getElementById('pendingContainer');
            const pendingCountEl = document.getElementById('pendingCount');
            
            if (lastSyncEl) {
                lastSyncEl.textContent = lastSync ? new Date(lastSync).toLocaleString() : 'Never';
            }
            
            if (connectionEl) {
                connectionEl.textContent = state === 'offline' ? 'Offline (WiFi only)' : 'Local network';
                connectionEl.className = `sync-value ${state === 'offline' ? 'offline' : 'online'}`;
            }
            
            if (pendingContainer && pendingCountEl) {
                if (pending > 0) {
                    pendingContainer.hidden = false;
                    pendingCountEl.textContent = `${pending} item${pending !== 1 ? 's' : ''}`;
                } else {
                    pendingContainer.hidden = true;
                }
            }
            
            // Update services list
            this.renderServices();
        },
        
        renderServices() {
            const container = document.getElementById('syncServices');
            if (!container) return;
            
            if (this.status.services.length === 0) {
                container.innerHTML = '';
                return;
            }
            
            container.innerHTML = `
                <div class="sync-services-title">Services:</div>
                ${this.status.services.map(s => `
                    <div class="sync-service-item">
                        <span class="sync-service-dot ${s.status}"></span>
                        <span>${s.name}</span>
                    </div>
                `).join('')}
            `;
        },
        
        formatLastSync(isoString) {
            if (!isoString) return 'Never';
            
            const date = new Date(isoString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24) return `${diffHours}h ago`;
            
            return date.toLocaleDateString();
        },
        
        togglePanel() {
            this.panelOpen = !this.panelOpen;
            const panel = document.getElementById('syncPanel');
            const button = this.container?.querySelector('.sync-status-button');
            
            if (panel) {
                panel.hidden = !this.panelOpen;
            }
            if (button) {
                button.setAttribute('aria-expanded', this.panelOpen);
            }
        },
        
        closePanel() {
            this.panelOpen = false;
            const panel = document.getElementById('syncPanel');
            const button = this.container?.querySelector('.sync-status-button');
            
            if (panel) panel.hidden = true;
            if (button) button.setAttribute('aria-expanded', 'false');
        },
        
        async triggerSync() {
            this.setStatus('syncing', this.status.lastSync, this.status.pending);
            
            // Simulate sync for demo, or trigger real sync
            if (ModeManager.isDemo) {
                setTimeout(() => {
                    this.setStatus('synced', new Date().toISOString(), 0);
                }, 2000);
            } else {
                try {
                    await fetch('/api/sync/trigger', { method: 'POST' });
                    setTimeout(() => this.updateStatus(), 2000);
                } catch {
                    this.setStatus('synced', new Date().toISOString(), 0);
                }
            }
        }
    };
    
    // Make SyncStatusManager globally accessible for onclick handlers
    window.SyncStatusManager = SyncStatusManager;

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
    // Onboarding Wizard
    // ==========================================
    const OnboardingWizard = {
        profiles: {
            sailor: {
                name: 'Sailor / Maritime',
                icon: '⛵',
                description: 'Navigation, weather, emergency communications',
                services: ['kiwix', 'maps', 'meshtastic', 'openwebui', 'calibre', 'filebrowser']
            },
            expedition: {
                name: 'Expedition / Outdoor',
                icon: '🏔️',
                description: 'Offline maps, mesh networks, survival info',
                services: ['kiwix', 'maps', 'meshtastic', 'openwebui', 'filebrowser', 'excalidraw']
            },
            prepper: {
                name: 'Emergency Preparedness',
                icon: '🔦',
                description: 'Document storage, emergency comms, offline reference',
                services: ['kiwix', 'maps', 'meshtastic', 'vaultwarden', 'filebrowser', 'syncthing']
            },
            remote: {
                name: 'Remote Work',
                icon: '💼',
                description: 'Productivity tools, document collaboration, AI assistant',
                services: ['openwebui', 'cryptpad', 'excalidraw', 'filebrowser', 'libretranslate', 'calibre']
            },
            general: {
                name: 'Privacy / General',
                icon: '🔒',
                description: 'Explore all features at your own pace',
                services: [] // All services enabled
            }
        },
        
        currentStep: 0,
        selectedProfile: null,
        setupType: 'quick', // quick or advanced
        
        init() {
            // Check if wizard should show
            const completed = localStorage.getItem(CONFIG.wizardStorageKey);
            if (!completed) {
                // Small delay to let page render first
                setTimeout(() => this.show(), 500);
            }
            
            // Add settings link to re-run wizard
            this.addSettingsLink();
        },
        
        show() {
            this.currentStep = 0;
            this.createOverlay();
            this.renderStep();
        },
        
        createOverlay() {
            // Remove any existing overlay
            const existing = document.querySelector('.wizard-overlay');
            if (existing) existing.remove();
            
            const overlay = document.createElement('div');
            overlay.className = 'wizard-overlay';
            overlay.innerHTML = `
                <div class="wizard-container" role="dialog" aria-labelledby="wizard-title" aria-modal="true">
                    <div class="wizard-progress">
                        <div class="wizard-progress-bar" style="width: 0%"></div>
                    </div>
                    <div class="wizard-content" id="wizardContent">
                        <!-- Content rendered dynamically -->
                    </div>
                    <div class="wizard-footer">
                        <button class="wizard-btn wizard-btn-skip" onclick="OnboardingWizard.skip()">Skip Setup</button>
                        <div class="wizard-nav">
                            <button class="wizard-btn wizard-btn-back" onclick="OnboardingWizard.prevStep()" disabled>Back</button>
                            <button class="wizard-btn wizard-btn-next" onclick="OnboardingWizard.nextStep()">Next</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            
            // Prevent background scroll
            document.body.style.overflow = 'hidden';
        },
        
        renderStep() {
            const content = document.getElementById('wizardContent');
            const progressBar = document.querySelector('.wizard-progress-bar');
            const backBtn = document.querySelector('.wizard-btn-back');
            const nextBtn = document.querySelector('.wizard-btn-next');
            
            if (!content) return;
            
            const steps = this.getSteps();
            const totalSteps = steps.length;
            const progress = ((this.currentStep + 1) / totalSteps) * 100;
            
            if (progressBar) progressBar.style.width = `${progress}%`;
            if (backBtn) backBtn.disabled = this.currentStep === 0;
            if (nextBtn) {
                nextBtn.textContent = this.currentStep === totalSteps - 1 ? 'Finish' : 'Next';
            }
            
            content.innerHTML = steps[this.currentStep].render();
            
            // Add event listeners for interactive elements
            steps[this.currentStep].afterRender?.();
        },
        
        getSteps() {
            return [
                // Step 1: Welcome
                {
                    render: () => `
                        <div class="wizard-step wizard-welcome">
                            <div class="wizard-icon-large">📦</div>
                            <h2 id="wizard-title">Welcome to MuleCube</h2>
                            <p class="wizard-subtitle">Your portable offline knowledge server</p>
                            
                            <div class="wizard-concept-box">
                                <h3>📶 How MuleCube Works</h3>
                                <div class="wizard-concept-diagram">
                                    <div class="concept-item">📱<span>Your Device</span></div>
                                    <div class="concept-arrow">→ WiFi →</div>
                                    <div class="concept-item concept-mulecube">📦<span>MuleCube</span></div>
                                    <div class="concept-arrow">→</div>
                                    <div class="concept-item">📚<span>30+ Services</span></div>
                                </div>
                                <p class="wizard-concept-text">
                                    Your devices connect to MuleCube's WiFi network.<br>
                                    <strong>No internet needed</strong> — everything runs locally.
                                </p>
                            </div>
                            
                            <div class="wizard-features">
                                <div class="wizard-feature">✓ Works in remote locations</div>
                                <div class="wizard-feature">✓ Private by design</div>
                                <div class="wizard-feature">✓ No data leaves the device</div>
                                <div class="wizard-feature">✓ Available 24/7</div>
                            </div>
                        </div>
                    `
                },
                // Step 2: Profile Selection
                {
                    render: () => `
                        <div class="wizard-step wizard-profile">
                            <h2>How will you use MuleCube?</h2>
                            <p class="wizard-subtitle">We'll customize your experience based on your needs</p>
                            
                            <div class="wizard-profile-grid">
                                ${Object.entries(this.profiles).map(([key, profile]) => `
                                    <button class="wizard-profile-card ${this.selectedProfile === key ? 'selected' : ''}" 
                                            data-profile="${key}">
                                        <span class="profile-icon">${profile.icon}</span>
                                        <span class="profile-name">${profile.name}</span>
                                        <span class="profile-desc">${profile.description}</span>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    `,
                    afterRender: () => {
                        document.querySelectorAll('.wizard-profile-card').forEach(card => {
                            card.addEventListener('click', () => {
                                document.querySelectorAll('.wizard-profile-card').forEach(c => c.classList.remove('selected'));
                                card.classList.add('selected');
                                this.selectedProfile = card.dataset.profile;
                            });
                        });
                    }
                },
                // Step 3: Setup Type
                {
                    render: () => `
                        <div class="wizard-step wizard-setup-type">
                            <h2>Choose Setup Type</h2>
                            <p class="wizard-subtitle">How much control do you want?</p>
                            
                            <div class="wizard-setup-options">
                                <button class="wizard-setup-card ${this.setupType === 'quick' ? 'selected' : ''}" 
                                        data-type="quick">
                                    <span class="setup-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg></span>
                                    <span class="setup-name">Quick Setup</span>
                                    <span class="setup-time">~2 minutes</span>
                                    <span class="setup-desc">Get started immediately with recommended settings for your profile</span>
                                </button>
                                
                                <button class="wizard-setup-card ${this.setupType === 'advanced' ? 'selected' : ''}" 
                                        data-type="advanced">
                                    <span class="setup-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg></span>
                                    <span class="setup-name">Advanced Setup</span>
                                    <span class="setup-time">~10 minutes</span>
                                    <span class="setup-desc">Customize network settings, enable/disable services, configure security</span>
                                </button>
                            </div>
                        </div>
                    `,
                    afterRender: () => {
                        document.querySelectorAll('.wizard-setup-card').forEach(card => {
                            card.addEventListener('click', () => {
                                document.querySelectorAll('.wizard-setup-card').forEach(c => c.classList.remove('selected'));
                                card.classList.add('selected');
                                this.setupType = card.dataset.type;
                            });
                        });
                    }
                },
                // Step 4: Feature Tour
                {
                    render: () => `
                        <div class="wizard-step wizard-tour">
                            <h2>Quick Tour</h2>
                            <p class="wizard-subtitle">Here's what you can do with MuleCube</p>
                            
                            <div class="wizard-tour-items">
                                <div class="tour-item">
                                    <div class="tour-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
                                    <div class="tour-content">
                                        <strong>Search Services</strong>
                                        <p>Press <kbd>/</kbd> to quickly find any service</p>
                                    </div>
                                </div>
                                <div class="tour-item">
                                    <div class="tour-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg></div>
                                    <div class="tour-content">
                                        <strong>Status Bar</strong>
                                        <p>Monitor system health, battery, and connectivity</p>
                                    </div>
                                </div>
                                <div class="tour-item">
                                    <div class="tour-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg></div>
                                    <div class="tour-content">
                                        <strong>Display Modes</strong>
                                        <p>Switch between Day, Night, and Sunlight modes</p>
                                    </div>
                                </div>
                                <div class="tour-item">
                                    <div class="tour-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.001"/><path d="M10 8h.001"/><path d="M14 8h.001"/><path d="M18 8h.001"/><path d="M8 12h.001"/><path d="M12 12h.001"/><path d="M16 12h.001"/><path d="M7 16h10"/></svg></div>
                                    <div class="tour-content">
                                        <strong>Keyboard Shortcuts</strong>
                                        <p>Press <kbd>?</kbd> anytime to see all shortcuts</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `
                },
                // Step 5: Completion
                {
                    render: () => {
                        const profile = this.profiles[this.selectedProfile] || this.profiles.general;
                        return `
                            <div class="wizard-step wizard-complete">
                                <div class="wizard-icon-large">🎉</div>
                                <h2>You're All Set!</h2>
                                <p class="wizard-subtitle">Your MuleCube is ready to use</p>
                                
                                <div class="wizard-complete-profile">
                                    <span class="profile-icon">${profile.icon}</span>
                                    <span>Profile: <strong>${profile.name}</strong></span>
                                </div>
                                
                                <div class="wizard-quick-actions">
                                    <p>Suggested first steps:</p>
                                    <div class="quick-action-list">
                                        <a href="#knowledge" class="quick-action">📚 Browse Knowledge Base</a>
                                        <a href="#ai" class="quick-action">🤖 Try AI Assistant</a>
                                        <a href="#tools" class="quick-action">🛠️ Explore Tools</a>
                                    </div>
                                </div>
                                
                                <p class="wizard-settings-note">
                                    💡 You can re-run this wizard anytime from Admin Tools → Settings
                                </p>
                            </div>
                        `;
                    }
                }
            ];
        },
        
        nextStep() {
            const steps = this.getSteps();
            
            // Validate current step
            if (this.currentStep === 1 && !this.selectedProfile) {
                alert('Please select a profile to continue');
                return;
            }
            
            if (this.currentStep < steps.length - 1) {
                this.currentStep++;
                this.renderStep();
            } else {
                this.complete();
            }
        },
        
        prevStep() {
            if (this.currentStep > 0) {
                this.currentStep--;
                this.renderStep();
            }
        },
        
        skip() {
            if (confirm('Skip the setup wizard? You can run it again from Admin Tools → Settings.')) {
                this.complete();
            }
        },
        
        complete() {
            // Save completion state
            localStorage.setItem(CONFIG.wizardStorageKey, 'true');
            localStorage.setItem(CONFIG.profileStorageKey, this.selectedProfile || 'general');
            
            // Remove overlay
            const overlay = document.querySelector('.wizard-overlay');
            if (overlay) overlay.remove();
            
            // Restore scroll
            document.body.style.overflow = '';
            
            console.log('Onboarding wizard completed. Profile:', this.selectedProfile);
        },
        
        reset() {
            localStorage.removeItem(CONFIG.wizardStorageKey);
            localStorage.removeItem(CONFIG.profileStorageKey);
            this.selectedProfile = null;
            this.setupType = 'quick';
            this.currentStep = 0;
            this.show();
        },
        
        addSettingsLink() {
            // This will be called by templates to add "Re-run Setup Wizard" link
            window.resetOnboardingWizard = () => this.reset();
        }
    };
    
    // Make globally accessible
    window.OnboardingWizard = OnboardingWizard;

    // ==========================================
    // System Functions UI
    // ==========================================
    const SystemFunctions = {
        init() {
            // Add system functions to admin section if not already present
            this.injectSystemSection();
        },
        
        injectSystemSection() {
            const adminSection = document.getElementById('advancedSection');
            if (!adminSection) return;
            
            // Check if system functions already exist
            if (document.getElementById('systemFunctionsGrid')) return;
            
            // Create system functions category
            const systemCategory = document.createElement('div');
            systemCategory.className = 'service-category system-functions';
            systemCategory.innerHTML = `
                <h3 class="category-title">
                    <span class="category-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg></span>
                    System
                    <span class="category-toggle-indicator">▼</span>
                </h3>
                <div class="service-grid" id="systemFunctionsGrid">
                    <div class="service-card system-card" onclick="OnboardingWizard.reset()">
                        <div class="service-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg></div>
                        <div class="service-info">
                            <div class="service-name">Setup Wizard</div>
                            <div class="service-desc">Re-run first-time setup</div>
                        </div>
                    </div>
                    
                    <div class="service-card system-card" onclick="SystemFunctions.showServicesDialog()">
                        <div class="service-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18h8"/><path d="M4 6h8"/><path d="m14 6 2 2 4-4"/><path d="m14 12 2 2 4-4"/><path d="m14 18 2 2 4-4"/></svg></div>
                        <div class="service-info">
                            <div class="service-name">Manage Services</div>
                            <div class="service-desc">Enable/disable services</div>
                        </div>
                    </div>
                    
                    <div class="service-card system-card" onclick="SystemFunctions.showBackupDialog()">
                        <div class="service-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8"/><path d="m16 6-4 4-4-4"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 18h.01"/><path d="M10 18h.01"/></svg></div>
                        <div class="service-info">
                            <div class="service-name">Backup Config</div>
                            <div class="service-desc">Export all settings</div>
                        </div>
                    </div>
                    
                    <div class="service-card system-card" onclick="SystemFunctions.showRestoreDialog()">
                        <div class="service-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 6-4-4-4 4"/><path d="M12 2v8"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 18h.01"/><path d="M10 18h.01"/></svg></div>
                        <div class="service-info">
                            <div class="service-name">Restore Config</div>
                            <div class="service-desc">Import settings backup</div>
                        </div>
                    </div>
                    
                    <div class="service-card system-card" onclick="SystemFunctions.showRebootDialog()">
                        <div class="service-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg></div>
                        <div class="service-info">
                            <div class="service-name">Reboot</div>
                            <div class="service-desc">Restart MuleCube safely</div>
                        </div>
                    </div>
                    
                    <div class="service-card system-card" onclick="SystemFunctions.showShutdownDialog()">
                        <div class="service-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg></div>
                        <div class="service-info">
                            <div class="service-name">Shutdown</div>
                            <div class="service-desc">Power off MuleCube</div>
                        </div>
                    </div>
                </div>
            `;
            
            // Insert at the beginning of admin section
            adminSection.insertBefore(systemCategory, adminSection.firstChild);
        },
        
        showDialog(title, content, actions) {
            const modal = document.createElement('div');
            modal.className = 'system-modal-overlay';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
            modal.innerHTML = `
                <div class="system-modal">
                    <h3 class="system-modal-title">${title}</h3>
                    <div class="system-modal-content">${content}</div>
                    <div class="system-modal-actions">${actions}</div>
                </div>
            `;
            document.body.appendChild(modal);
        },
        
        showRebootDialog() {
            this.showDialog(
                'Reboot MuleCube?',
                '<p>System will restart in 1 minute. Services will be briefly unavailable.</p>',
                `<button class="system-btn system-btn-cancel" onclick="this.closest('.system-modal-overlay').remove()">Cancel</button>
                 <button class="system-btn system-btn-primary" onclick="SystemFunctions.executeReboot()">Confirm</button>`
            );
        },
        
        
        showShutdownDialog() {
            this.showDialog(
                '⏻ Shut Down MuleCube?',
                '<p>System will power off in 1 minute. Physical access needed to restart!</p>',
                `<button class="system-btn system-btn-cancel" onclick="this.closest('.system-modal-overlay').remove()">Cancel</button>
                 <button class="system-btn system-btn-danger" onclick="SystemFunctions.executeShutdown()">Confirm</button>`
            );
        },
        
        
        showBackupDialog() {
            const config = this.gatherConfig();
            const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const filename = `mulecube-backup-${new Date().toISOString().split('T')[0]}.json`;
            
            this.showDialog(
                'Backup Configuration',
                `<p>Your configuration backup is ready.</p>
                 <p>This includes:</p>
                 <ul>
                     <li>Dashboard preferences</li>
                     <li>Display mode settings</li>
                     <li>Recently used services</li>
                     <li>Collapsed categories</li>
                 </ul>`,
                `<button class="system-btn system-btn-cancel" onclick="this.closest('.system-modal-overlay').remove()">Cancel</button>
                 <a href="${url}" download="${filename}" class="system-btn system-btn-primary" onclick="setTimeout(() => this.closest('.system-modal-overlay').remove(), 100)">Download Backup</a>`
            );
        },
        
        showRestoreDialog() {
            this.showDialog(
                'Restore Configuration',
                `<p>Select a backup file to restore your settings.</p>
                 <input type="file" id="restoreFileInput" accept=".json" class="system-file-input">
                 <p class="system-note">This will replace your current dashboard settings.</p>`,
                `<button class="system-btn system-btn-cancel" onclick="this.closest('.system-modal-overlay').remove()">Cancel</button>
                 <button class="system-btn system-btn-primary" onclick="SystemFunctions.executeRestore()">Restore</button>`
            );
        },
        
        showServicesDialog() {
            this.showDialog(
                'Manage Services',
                `<p>Service management allows you to enable or disable services to conserve system resources.</p>
                 <p class="system-note">This feature requires backend API integration and is not available in the current version.</p>
                 <p>In a future update, you'll be able to:</p>
                 <ul>
                     <li>Toggle services on/off</li>
                     <li>See RAM/CPU usage per service</li>
                     <li>Set services to auto-start</li>
                 </ul>`,
                `<button class="system-btn" onclick="this.closest('.system-modal-overlay').remove()">OK</button>`
            );
        },
        
        gatherConfig() {
            return {
                version: CONFIG.version,
                created: new Date().toISOString(),
                device: 'mulecube',
                settings: {
                    theme: localStorage.getItem('theme') || 'dark',
                    displayMode: localStorage.getItem(CONFIG.displayModeKey) || 'day',
                    wizardCompleted: localStorage.getItem(CONFIG.wizardStorageKey) === 'true',
                    userProfile: localStorage.getItem(CONFIG.profileStorageKey) || 'general',
                    heroCollapsed: localStorage.getItem('heroCollapsed') === 'true',
                    recentlyUsed: JSON.parse(localStorage.getItem('mulecube-recently-used') || '[]'),
                    collapsedCategories: JSON.parse(localStorage.getItem('mulecube-collapsed-categories') || '[]')
                }
            };
        },
        
        async executeReboot() {
            try {
                document.querySelector('.system-modal-content').innerHTML = '<p>Rebooting...</p><div class="system-spinner"></div>';
                await fetch('/api/system/reboot', { method: 'POST' });
            } catch {
                document.querySelector('.system-modal-content').innerHTML = '<p class="system-error">Reboot API not available. Please reboot manually.</p>';
            }
        },
        
        async executeShutdown() {
            try {
                document.querySelector('.system-modal-content').innerHTML = '<p>Shutting down...</p><div class="system-spinner"></div>';
                await fetch('/api/system/shutdown', { method: 'POST' });
            } catch {
                document.querySelector('.system-modal-content').innerHTML = '<p class="system-error">Shutdown API not available. Please shutdown manually.</p>';
            }
        },
        
        executeRestore() {
            const input = document.getElementById('restoreFileInput');
            if (!input?.files?.length) {
                alert('Please select a backup file');
                return;
            }
            
            const file = input.files[0];
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const config = JSON.parse(e.target.result);
                    
                    if (!config.version || !config.settings) {
                        throw new Error('Invalid backup file format');
                    }
                    
                    // Restore settings
                    const s = config.settings;
                    if (s.theme) localStorage.setItem('theme', s.theme);
                    if (s.displayMode) localStorage.setItem(CONFIG.displayModeKey, s.displayMode);
                    if (s.userProfile) localStorage.setItem(CONFIG.profileStorageKey, s.userProfile);
                    if (s.heroCollapsed !== undefined) localStorage.setItem('heroCollapsed', s.heroCollapsed);
                    if (s.recentlyUsed) localStorage.setItem('mulecube-recently-used', JSON.stringify(s.recentlyUsed));
                    if (s.collapsedCategories) localStorage.setItem('mulecube-collapsed-categories', JSON.stringify(s.collapsedCategories));
                    
                    alert('Configuration restored! The page will now reload.');
                    window.location.reload();
                } catch (err) {
                    alert('Error restoring backup: ' + err.message);
                }
            };
            
            reader.readAsText(file);
        }
    };
    
    // Make globally accessible
    window.SystemFunctions = SystemFunctions;

    // ==========================================
    // Accessibility Improvements
    // ==========================================
    const AccessibilityManager = {
        init() {
            this.addSkipLink();
            this.enhanceFocusIndicators();
            this.addAriaLabels();
            this.setupReducedMotion();
        },
        
        addSkipLink() {
            const skipLink = document.createElement('a');
            skipLink.href = '#main-content';
            skipLink.className = 'skip-link';
            skipLink.textContent = 'Skip to main content';
            document.body.insertBefore(skipLink, document.body.firstChild);
            
            // Add main content landmark if missing
            const main = document.querySelector('main') || document.querySelector('.services');
            if (main && !main.id) {
                main.id = 'main-content';
            }
        },
        
        enhanceFocusIndicators() {
            // Add focus-visible class to body for CSS styling
            document.body.classList.add('js-focus-visible');
        },
        
        addAriaLabels() {
            // Theme toggle
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle && !themeToggle.getAttribute('aria-label')) {
                themeToggle.setAttribute('aria-label', 'Toggle light/dark theme');
            }
            
            // Search input
            const searchInput = document.getElementById('serviceSearch');
            if (searchInput && !searchInput.getAttribute('aria-label')) {
                searchInput.setAttribute('aria-label', 'Search services');
            }
            
            // Menu toggle
            const menuToggle = document.querySelector('.menu-toggle');
            if (menuToggle && !menuToggle.getAttribute('aria-label')) {
                menuToggle.setAttribute('aria-label', 'Toggle navigation menu');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        },
        
        setupReducedMotion() {
            // Check for reduced motion preference
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            
            const handleReducedMotion = (e) => {
                document.body.classList.toggle('reduce-motion', e.matches);
            };
            
            handleReducedMotion(mediaQuery);
            mediaQuery.addEventListener('change', handleReducedMotion);
        }
    };

    // ==========================================
    // Service Worker Registration
    // ==========================================
    const ServiceWorkerManager = {
        init() {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('Service Worker registered:', reg.scope))
                    .catch(err => console.warn('Service Worker registration failed:', err));
            }
        }
    };

    // ==========================================
    // Initialize
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        // Core functionality
        ModeManager.init();
        StatsManager.init();
        RecentlyUsedManager.init();
        ServiceManager.init();
        SearchManager.init();
        // ThemeManager.init(); // Handled by DisplayModeManager
        Slideshow.init();
        MobileMenu.init();
        SmoothScroll.init();
        AdvancedToggle.init();
        CategoryToggle.init();
        HeroToggle.init();
        
        // New features
        DisplayModeManager.init();
        KeyboardShortcuts.init();
        SyncStatusManager.init();
        OnboardingWizard.init();
        SystemFunctions.init();
        AccessibilityManager.init();
        ServiceWorkerManager.init();
        
        console.log(`MuleCube Dashboard v${CONFIG.version} initialized`, ModeManager.isDemo ? '(Demo Mode)' : '');
    });

})();
