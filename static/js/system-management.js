/**
 * MuleCube System Management
 * Comprehensive GUI for the Service Manager API
 * v1.0.0
 * 
 * Panels: System Info, Network, Storage, Logs, Firewall, Backup, Processes
 */

(function() {
    'use strict';

    // ==========================================
    // Configuration
    // ==========================================
    const CONFIG = {
        apiBase: '/api',
        serviceManagerBase: 'http://servicemanager.mulecube.net',
        pollInterval: 5000,
        logRefreshInterval: 3000,
        maxLogLines: 500
    };

    // ==========================================
    // SVG Icons (inline for reliability)
    // ==========================================
    const ICONS = {
        system: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
        cpu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
        memory: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="10" y1="10" x2="10" y2="14"/><line x1="14" y1="10" x2="14" y2="14"/><line x1="18" y1="10" x2="18" y2="14"/></svg>',
        temp: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>',
        network: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
        storage: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
        logs: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
        firewall: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
        backup: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
        process: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
        clients: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        power: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>',
        refresh: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
        close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        chevronDown: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
        warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
        download: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
        upload: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
        terminal: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
        settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>'
    };

    // ==========================================
    // Utility Functions
    // ==========================================
    function formatBytes(bytes, decimals = 1) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    }

    function formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        
        if (days > 0) return `${days}d ${hours}h ${mins}m`;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    }

    function formatDateTime(isoString) {
        if (!isoString) return 'Never';
        const date = new Date(isoString);
        return date.toLocaleString();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async function apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`${CONFIG.serviceManagerBase}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`API call failed: ${endpoint}`, error);
            throw error;
        }
    }

    // ==========================================
    // System Management Panel
    // ==========================================
    const SystemManagementPanel = {
        container: null,
        isOpen: false,
        activeTab: 'overview',
        refreshIntervals: {},
        
        init() {
            this.injectPanelHTML();
            this.setupEventListeners();
            this.addNavigationButton();
            console.log('SystemManagementPanel: Initialized');
        },
        
        addNavigationButton() {
            // Add "System" button to the status banner area or nav
            const statusBanner = document.getElementById('statusBanner');
            if (statusBanner) {
                const btn = document.createElement('button');
                btn.className = 'system-panel-trigger';
                btn.innerHTML = `${ICONS.settings} <span>System</span>`;
                btn.onclick = () => this.toggle();
                btn.title = 'System Management (Ctrl+Shift+S)';
                
                // Insert at the beginning of the status banner
                statusBanner.insertBefore(btn, statusBanner.firstChild);
            }
        },
        
        injectPanelHTML() {
            const panel = document.createElement('div');
            panel.id = 'systemManagementPanel';
            panel.className = 'system-panel-overlay';
            panel.innerHTML = `
                <div class="system-panel">
                    <div class="system-panel-header">
                        <div class="panel-title">
                            ${ICONS.settings}
                            <h2>System Management</h2>
                        </div>
                        <div class="panel-actions">
                            <button class="panel-refresh-btn" onclick="SystemManagementPanel.refreshCurrentTab()" title="Refresh">
                                ${ICONS.refresh}
                            </button>
                            <button class="panel-close-btn" onclick="SystemManagementPanel.close()" title="Close (Esc)">
                                ${ICONS.close}
                            </button>
                        </div>
                    </div>
                    
                    <div class="system-panel-tabs">
                        <button class="tab-btn active" data-tab="overview">${ICONS.system} Overview</button>
                        <button class="tab-btn" data-tab="network">${ICONS.network} Network</button>
                        <button class="tab-btn" data-tab="storage">${ICONS.storage} Storage</button>
                        <button class="tab-btn" data-tab="processes">${ICONS.process} Processes</button>
                        <button class="tab-btn" data-tab="logs">${ICONS.logs} Logs</button>
                        <button class="tab-btn" data-tab="firewall">${ICONS.firewall} Firewall</button>
                        <button class="tab-btn" data-tab="backup">${ICONS.backup} Backup</button>
                    </div>
                    
                    <div class="system-panel-body" id="systemPanelBody">
                        <div class="panel-loading">
                            <div class="loading-spinner"></div>
                            <span>Loading...</span>
                        </div>
                    </div>
                    
                    <div class="system-panel-footer">
                        <span class="panel-hint">Press <kbd>Ctrl+Shift+S</kbd> to toggle</span>
                        <span class="panel-version">Service Manager v1.0.0</span>
                    </div>
                </div>
            `;
            
            document.body.appendChild(panel);
            this.container = panel;
        },
        
        setupEventListeners() {
            // Close on overlay click
            this.container.addEventListener('click', (e) => {
                if (e.target === this.container) {
                    this.close();
                }
            });
            
            // Tab switching
            this.container.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.switchTab(btn.dataset.tab);
                });
            });
            
            // Keyboard shortcut
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                    e.preventDefault();
                    this.toggle();
                }
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        },
        
        toggle() {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        },
        
        async open() {
            this.container.classList.add('open');
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            await this.loadTab(this.activeTab);
        },
        
        close() {
            this.container.classList.remove('open');
            this.isOpen = false;
            document.body.style.overflow = '';
            this.stopAllRefresh();
        },
        
        switchTab(tabName) {
            this.stopAllRefresh();
            this.activeTab = tabName;
            
            // Update tab buttons
            this.container.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tabName);
            });
            
            this.loadTab(tabName);
        },
        
        async loadTab(tabName) {
            const body = document.getElementById('systemPanelBody');
            body.innerHTML = '<div class="panel-loading"><div class="loading-spinner"></div><span>Loading...</span></div>';
            
            try {
                switch (tabName) {
                    case 'overview':
                        await this.loadOverviewTab(body);
                        break;
                    case 'network':
                        await this.loadNetworkTab(body);
                        break;
                    case 'storage':
                        await this.loadStorageTab(body);
                        break;
                    case 'processes':
                        await this.loadProcessesTab(body);
                        break;
                    case 'logs':
                        await this.loadLogsTab(body);
                        break;
                    case 'firewall':
                        await this.loadFirewallTab(body);
                        break;
                    case 'backup':
                        await this.loadBackupTab(body);
                        break;
                    default:
                        body.innerHTML = '<div class="panel-error">Unknown tab</div>';
                }
            } catch (error) {
                body.innerHTML = `
                    <div class="panel-error">
                        ${ICONS.warning}
                        <p>Failed to load data</p>
                        <small>${error.message}</small>
                        <button class="btn btn-secondary" onclick="SystemManagementPanel.loadTab('${tabName}')">Retry</button>
                    </div>
                `;
            }
        },
        
        refreshCurrentTab() {
            this.loadTab(this.activeTab);
        },
        
        stopAllRefresh() {
            Object.values(this.refreshIntervals).forEach(id => clearInterval(id));
            this.refreshIntervals = {};
        },

        // ==========================================
        // Overview Tab
        // ==========================================
        async loadOverviewTab(container) {
            const [info, stats] = await Promise.all([
                apiCall('/api/system/info'),
                apiCall('/api/system/stats')
            ]);
            
            // Extract values using EXACT field names from API
            const cpuPercent = stats.cpu?.percent || 0;
            const cpuCores = stats.cpu?.count || stats.cpu?.count_logical || 4;
            const cpuFreqCurrent = stats.cpu?.frequency_current || 0;  // in MHz
            const cpuFreqMax = stats.cpu?.frequency_max || 0;  // in MHz
            
            const memPercent = stats.memory?.percent || 0;
            const memUsedBytes = stats.memory?.used_bytes || 0;
            const memTotalBytes = stats.memory?.total_bytes || 0;
            const memAvailBytes = stats.memory?.available_bytes || 0;
            
            const temp = stats.temperature?.cpu_temp_c || 0;
            const tempStatus = temp > 80 ? 'danger' : temp > 70 ? 'warning' : 'normal';
            
            container.innerHTML = `
                <div class="overview-grid">
                    <!-- System Info Card -->
                    <div class="info-card">
                        <div class="card-header">
                            ${ICONS.system}
                            <h3>System Information</h3>
                        </div>
                        <div class="card-body">
                            <div class="info-row">
                                <span class="info-label">Hostname</span>
                                <span class="info-value">${escapeHtml(info.hostname || 'Unknown')}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Model</span>
                                <span class="info-value">${escapeHtml(info.pi_model || 'Raspberry Pi')}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Serial</span>
                                <span class="info-value mono">${escapeHtml(info.pi_serial || 'N/A')}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Uptime</span>
                                <span class="info-value">${info.uptime_human || formatUptime(info.uptime_seconds || 0)}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Boot Time</span>
                                <span class="info-value">${formatDateTime(info.boot_time)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- CPU Stats Card -->
                    <div class="info-card">
                        <div class="card-header">
                            ${ICONS.cpu}
                            <h3>CPU</h3>
                            <span class="card-value">${cpuPercent.toFixed(1)}%</span>
                        </div>
                        <div class="card-body">
                            <div class="progress-bar-container">
                                <div class="progress-bar" style="width: ${cpuPercent}%"></div>
                            </div>
                            <div class="stats-row">
                                <div class="stat-item">
                                    <span class="stat-label">Cores</span>
                                    <span class="stat-value">${cpuCores}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Frequency</span>
                                    <span class="stat-value">${(cpuFreqCurrent / 1000).toFixed(1)} GHz</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Max Freq</span>
                                    <span class="stat-value">${(cpuFreqMax / 1000).toFixed(1)} GHz</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Memory Stats Card -->
                    <div class="info-card">
                        <div class="card-header">
                            ${ICONS.memory}
                            <h3>Memory</h3>
                            <span class="card-value">${memPercent.toFixed(1)}%</span>
                        </div>
                        <div class="card-body">
                            <div class="progress-bar-container">
                                <div class="progress-bar ${memPercent > 90 ? 'danger' : memPercent > 75 ? 'warning' : ''}" style="width: ${memPercent}%"></div>
                            </div>
                            <div class="stats-row">
                                <div class="stat-item">
                                    <span class="stat-label">Used</span>
                                    <span class="stat-value">${formatBytes(memUsedBytes)}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Total</span>
                                    <span class="stat-value">${formatBytes(memTotalBytes)}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Available</span>
                                    <span class="stat-value">${formatBytes(memAvailBytes)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Temperature Card -->
                    <div class="info-card">
                        <div class="card-header">
                            ${ICONS.temp}
                            <h3>Temperature</h3>
                            <span class="card-value ${tempStatus}">${temp.toFixed(1)}°C</span>
                        </div>
                        <div class="card-body">
                            <div class="temp-gauge">
                                <div class="temp-bar ${tempStatus}" style="width: ${Math.min(temp, 100)}%"></div>
                                <div class="temp-markers">
                                    <span>0°C</span>
                                    <span>50°C</span>
                                    <span>85°C</span>
                                </div>
                            </div>
                            <div class="temp-status ${tempStatus}">
                                ${temp > 80 ? 'Throttling may occur' : temp > 70 ? 'Running warm' : 'Normal operating temperature'}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Power Controls -->
                <div class="power-controls-section">
                    <h3>Power Controls</h3>
                    <div class="power-buttons">
                        <button class="btn btn-warning" onclick="SystemManagementPanel.confirmReboot()">
                            ${ICONS.refresh} Reboot System
                        </button>
                        <button class="btn btn-danger" onclick="SystemManagementPanel.confirmShutdown()">
                            ${ICONS.power} Shutdown System
                        </button>
                    </div>
                </div>
            `;
            
            // Auto-refresh stats - only if still on overview tab
            if (!this.refreshIntervals.overview) {
                this.refreshIntervals.overview = setInterval(async () => {
                    if (this.activeTab !== 'overview' || !this.isOpen) return;
                    try {
                        const newStats = await apiCall('/api/system/stats');
                        this.updateOverviewStats(newStats);
                    } catch (e) {
                        console.warn('Stats refresh failed:', e);
                    }
                }, CONFIG.pollInterval);
            }
        },
        
        updateOverviewStats(stats) {
            // Guard against running on wrong tab
            if (this.activeTab !== 'overview') return;
            
            // Update CPU - using exact API field names
            const cpuPercent = stats.cpu?.percent || 0;
            const cpuCard = document.querySelector('.overview-grid .info-card:nth-child(2)');
            if (cpuCard) {
                const valueEl = cpuCard.querySelector('.card-value');
                const barEl = cpuCard.querySelector('.progress-bar');
                if (valueEl) valueEl.textContent = `${cpuPercent.toFixed(1)}%`;
                if (barEl) barEl.style.width = `${cpuPercent}%`;
            }
            
            // Update Memory - using exact API field names
            const memPercent = stats.memory?.percent || 0;
            const memCard = document.querySelector('.overview-grid .info-card:nth-child(3)');
            if (memCard) {
                const valueEl = memCard.querySelector('.card-value');
                const barEl = memCard.querySelector('.progress-bar');
                if (valueEl) valueEl.textContent = `${memPercent.toFixed(1)}%`;
                if (barEl) barEl.style.width = `${memPercent}%`;
            }
            
            // Update Temperature - using exact API field names
            const temp = stats.temperature?.cpu_temp_c || 0;
            const tempCard = document.querySelector('.overview-grid .info-card:nth-child(4)');
            if (tempCard) {
                const tempStatus = temp > 80 ? 'danger' : temp > 70 ? 'warning' : 'normal';
                const valueEl = tempCard.querySelector('.card-value');
                if (valueEl) {
                    valueEl.textContent = `${temp.toFixed(1)}°C`;
                    valueEl.className = `card-value ${tempStatus}`;
                }
            }
        },
        
        confirmReboot() {
            if (confirm('Are you sure you want to reboot the system? All services will be temporarily unavailable.')) {
                this.executeReboot();
            }
        },
        
        confirmShutdown() {
            if (confirm('Are you sure you want to shutdown the system? You will need physical access to power it back on.')) {
                this.executeShutdown();
            }
        },
        
        async executeReboot() {
            try {
                await apiCall('/api/system/reboot', { method: 'POST', body: JSON.stringify({ delay: 5 }) });
                window.location.href = '/reboot.html?action=reboot';
            } catch (error) {
                alert('Failed to initiate reboot: ' + error.message);
            }
        },
        
        async executeShutdown() {
            try {
                await apiCall('/api/system/shutdown', { method: 'POST', body: JSON.stringify({ delay: 5 }) });
                window.location.href = '/reboot.html?action=shutdown';
            } catch (error) {
                alert('Failed to initiate shutdown: ' + error.message);
            }
        },

        // ==========================================
        // Network Tab
        // ==========================================
        async loadNetworkTab(container) {
            const [clients, interfaces] = await Promise.all([
                apiCall('/api/clients/').catch(() => []),
                apiCall('/api/network/interfaces').catch(() => [])
            ]);
            
            // API returns arrays directly, not wrapped in objects
            const wifiClients = Array.isArray(clients) ? clients : (clients.clients || []);
            const netInterfaces = Array.isArray(interfaces) ? interfaces : (interfaces.interfaces || []);
            
            // Filter to main interfaces (eth0, wlan0, etc. - exclude Docker bridges and veths)
            const mainInterfaces = netInterfaces.filter(i => 
                ['eth0', 'wlan0', 'wlan1', 'ap0', 'end0'].includes(i.name) ||
                (i.name?.startsWith('eth') && !i.name?.includes('veth')) ||
                (i.name?.startsWith('wlan'))
            );
            
            container.innerHTML = `
                <div class="network-section">
                    <!-- Connected Clients -->
                    <div class="info-card full-width">
                        <div class="card-header">
                            ${ICONS.clients}
                            <h3>Connected Clients</h3>
                            <span class="card-badge">${wifiClients.length} devices</span>
                        </div>
                        <div class="card-body">
                            ${wifiClients.length === 0 ? `
                                <div class="empty-state">
                                    <p>No devices connected to the WiFi access point</p>
                                </div>
                            ` : `
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Hostname</th>
                                            <th>IP Address</th>
                                            <th>MAC Address</th>
                                            <th>Connected</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${wifiClients.map(client => `
                                            <tr>
                                                <td>${escapeHtml(client.hostname || 'Unknown')}</td>
                                                <td class="mono">${escapeHtml(client.ip || 'N/A')}</td>
                                                <td class="mono">${escapeHtml(client.mac || 'N/A')}</td>
                                                <td>${client.connected_since ? formatDateTime(client.connected_since) : 'Active'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            `}
                        </div>
                    </div>
                    
                    <!-- Network Interfaces -->
                    <div class="info-card full-width">
                        <div class="card-header">
                            ${ICONS.network}
                            <h3>Network Interfaces</h3>
                        </div>
                        <div class="card-body">
                            ${mainInterfaces.length === 0 ? `
                                <div class="empty-state">
                                    <p>No network interfaces found</p>
                                </div>
                            ` : `
                                <div class="interfaces-grid">
                                    ${mainInterfaces.map(iface => `
                                        <div class="interface-card ${iface.is_up ? 'up' : 'down'}">
                                            <div class="interface-header">
                                                <span class="interface-name">${escapeHtml(iface.name)}</span>
                                                <span class="interface-status ${iface.is_up ? 'online' : 'offline'}">
                                                    ${iface.is_up ? 'Up' : 'Down'}
                                                </span>
                                            </div>
                                            <div class="interface-details">
                                                ${iface.ipv4_addresses?.length ? `<div class="detail"><span>IPv4:</span> <span class="mono">${escapeHtml(iface.ipv4_addresses[0])}</span></div>` : ''}
                                                ${iface.mac_address ? `<div class="detail"><span>MAC:</span> <span class="mono">${escapeHtml(iface.mac_address)}</span></div>` : ''}
                                                ${iface.speed_mbps ? `<div class="detail"><span>Speed:</span> ${iface.speed_mbps} Mbps</div>` : ''}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            `;
        },

        // ==========================================
        // Storage Tab
        // ==========================================
        async loadStorageTab(container) {
            const [disks, dockerVolumes] = await Promise.all([
                apiCall('/api/storage/disks').catch(() => []),
                apiCall('/api/storage/docker').catch(() => [])
            ]);
            
            // API returns arrays directly, not wrapped in objects
            const diskList = Array.isArray(disks) ? disks : (disks.disks || []);
            const volumes = Array.isArray(dockerVolumes) ? dockerVolumes : (dockerVolumes.volumes || []);
            
            // Filter to unique mountpoints (API returns duplicates for bind mounts)
            const seenMounts = new Set();
            const uniqueDisks = diskList.filter(disk => {
                // Skip non-root partitions and keep only main storage
                if (seenMounts.has(disk.mountpoint)) return false;
                if (disk.mountpoint.startsWith('/etc/') || 
                    disk.mountpoint.startsWith('/var/lib/misc') ||
                    disk.mountpoint.startsWith('/host/')) {
                    return false;
                }
                seenMounts.add(disk.mountpoint);
                return true;
            });
            
            container.innerHTML = `
                <div class="storage-section">
                    <!-- Disk Usage -->
                    <div class="info-card full-width">
                        <div class="card-header">
                            ${ICONS.storage}
                            <h3>Disk Partitions</h3>
                        </div>
                        <div class="card-body">
                            ${uniqueDisks.length === 0 ? `
                                <div class="empty-state"><p>No disk information available</p></div>
                            ` : `
                                <div class="disk-grid">
                                    ${uniqueDisks.map(disk => {
                                        const usedPercent = disk.percent_used || disk.percent || 0;
                                        const status = usedPercent > 90 ? 'danger' : usedPercent > 75 ? 'warning' : 'normal';
                                        return `
                                            <div class="disk-card">
                                                <div class="disk-header">
                                                    <span class="disk-mount">${escapeHtml(disk.mountpoint)}</span>
                                                    <span class="disk-percent ${status}">${usedPercent.toFixed(1)}%</span>
                                                </div>
                                                <div class="progress-bar-container">
                                                    <div class="progress-bar ${status}" style="width: ${usedPercent}%"></div>
                                                </div>
                                                <div class="disk-details">
                                                    <span>${disk.used_human || formatBytes(disk.used_bytes || 0)} / ${disk.total_human || formatBytes(disk.total_bytes || 0)}</span>
                                                    <span class="disk-device mono">${escapeHtml(disk.device)}</span>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            `}
                        </div>
                    </div>
                    
                    <!-- Docker Volumes -->
                    <div class="info-card full-width">
                        <div class="card-header">
                            ${ICONS.storage}
                            <h3>Docker Volumes</h3>
                            <span class="card-badge">${volumes.length} volumes</span>
                        </div>
                        <div class="card-body">
                            ${volumes.length === 0 ? `
                                <div class="empty-state"><p>No Docker volumes found</p></div>
                            ` : `
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Volume Name</th>
                                            <th>Driver</th>
                                            <th>Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${volumes.slice(0, 20).map(vol => `
                                            <tr>
                                                <td class="mono">${escapeHtml(vol.name || 'Unknown')}</td>
                                                <td>${escapeHtml(vol.driver || 'local')}</td>
                                                <td>${vol.created ? formatDateTime(vol.created) : 'Unknown'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                                ${volumes.length > 20 ? `<p class="table-note">Showing 20 of ${volumes.length} volumes</p>` : ''}
                            `}
                        </div>
                    </div>
                </div>
            `;
        },

        // ==========================================
        // Processes Tab
        // ==========================================
        async loadProcessesTab(container) {
            // Render the processes (called by both initial load and refresh)
            await this.renderProcesses(container);
            
            // Set up auto-refresh ONLY if not already running
            if (!this.refreshIntervals.processes) {
                this.refreshIntervals.processes = setInterval(async () => {
                    // Only refresh if still on processes tab
                    if (this.activeTab === 'processes' && this.isOpen) {
                        await this.renderProcesses(container);
                    }
                }, CONFIG.pollInterval);
            }
        },
        
        async renderProcesses(container) {
            try {
                const data = await apiCall('/api/processes/');
                const processes = data.processes || [];
                
                // Sort by CPU usage
                processes.sort((a, b) => (b.cpu_percent || 0) - (a.cpu_percent || 0));
                
                container.innerHTML = `
                    <div class="processes-section">
                        <div class="info-card full-width">
                            <div class="card-header">
                                ${ICONS.process}
                                <h3>Running Processes</h3>
                                <span class="card-badge">${processes.length} processes</span>
                            </div>
                            <div class="card-body">
                                <table class="data-table processes-table">
                                    <thead>
                                        <tr>
                                            <th>PID</th>
                                            <th>Name</th>
                                            <th>User</th>
                                            <th>CPU %</th>
                                            <th>Memory %</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${processes.slice(0, 50).map(proc => `
                                            <tr>
                                                <td class="mono">${proc.pid}</td>
                                                <td title="${escapeHtml(proc.cmdline || proc.name)}">${escapeHtml(proc.name)}</td>
                                                <td>${escapeHtml(proc.username || 'root')}</td>
                                                <td class="${(proc.cpu_percent || 0) > 50 ? 'highlight' : ''}">${(proc.cpu_percent || 0).toFixed(1)}%</td>
                                                <td class="${(proc.memory_percent || 0) > 50 ? 'highlight' : ''}">${(proc.memory_percent || 0).toFixed(1)}%</td>
                                                <td><span class="status-badge ${proc.status}">${proc.status || 'running'}</span></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                                ${processes.length > 50 ? `<p class="table-note">Showing top 50 processes by CPU usage</p>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error('Failed to load processes:', error);
            }
        },

        // ==========================================
        // Logs Tab
        // ==========================================
        async loadLogsTab(container) {
            container.innerHTML = `
                <div class="logs-section">
                    <div class="logs-controls">
                        <select id="logSource" class="log-select">
                            <option value="system">System Journal</option>
                            <option value="container">Container Logs</option>
                        </select>
                        <select id="logContainer" class="log-select" style="display: none;">
                            <option value="">Select container...</option>
                        </select>
                        <input type="number" id="logLines" class="log-input" value="100" min="10" max="1000" title="Number of lines">
                        <button class="btn btn-secondary" onclick="SystemManagementPanel.fetchLogs()">
                            ${ICONS.refresh} Load Logs
                        </button>
                        <label class="log-checkbox">
                            <input type="checkbox" id="logAutoRefresh"> Auto-refresh
                        </label>
                    </div>
                    
                    <div class="log-viewer" id="logViewer">
                        <div class="empty-state">
                            <p>Select a log source and click "Load Logs"</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Setup log source change handler
            const sourceSelect = document.getElementById('logSource');
            const containerSelect = document.getElementById('logContainer');
            
            sourceSelect.addEventListener('change', async () => {
                if (sourceSelect.value === 'container') {
                    containerSelect.style.display = 'block';
                    // Fetch container list
                    try {
                        const data = await apiCall('/api/services/status');
                        const containers = data.containers || [];
                        containerSelect.innerHTML = '<option value="">Select container...</option>' +
                            containers.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
                    } catch (e) {
                        console.error('Failed to fetch containers:', e);
                    }
                } else {
                    containerSelect.style.display = 'none';
                }
            });
            
            // Auto-refresh checkbox
            const autoRefresh = document.getElementById('logAutoRefresh');
            autoRefresh.addEventListener('change', () => {
                if (autoRefresh.checked) {
                    this.refreshIntervals.logs = setInterval(() => {
                        this.fetchLogs();
                    }, CONFIG.logRefreshInterval);
                } else {
                    clearInterval(this.refreshIntervals.logs);
                }
            });
        },
        
        async fetchLogs() {
            const source = document.getElementById('logSource').value;
            const containerName = document.getElementById('logContainer').value;
            const lines = document.getElementById('logLines').value || 100;
            const viewer = document.getElementById('logViewer');
            
            viewer.innerHTML = '<div class="loading-spinner"></div>';
            
            try {
                let logs;
                if (source === 'container' && containerName) {
                    logs = await apiCall(`/api/logs/container/${containerName}?lines=${lines}`);
                } else {
                    logs = await apiCall(`/api/logs/system?lines=${lines}`);
                }
                
                const entries = logs.entries || logs.logs || [];
                
                viewer.innerHTML = `
                    <pre class="log-content">${entries.map(entry => {
                        const line = typeof entry === 'string' ? entry : entry.message || JSON.stringify(entry);
                        return escapeHtml(line);
                    }).join('\n')}</pre>
                `;
                
                // Scroll to bottom
                viewer.scrollTop = viewer.scrollHeight;
            } catch (error) {
                viewer.innerHTML = `<div class="panel-error">${ICONS.warning}<p>Failed to fetch logs: ${error.message}</p></div>`;
            }
        },

        // ==========================================
        // Firewall Tab
        // ==========================================
        async loadFirewallTab(container) {
            const data = await apiCall('/api/firewall/rules').catch(() => ({ rules: [] }));
            const rules = data.rules || [];
            
            container.innerHTML = `
                <div class="firewall-section">
                    <div class="info-card full-width">
                        <div class="card-header">
                            ${ICONS.firewall}
                            <h3>Firewall Rules (iptables)</h3>
                            <span class="card-badge">${rules.length} rules</span>
                        </div>
                        <div class="card-body">
                            <div class="firewall-note">
                                <p>${ICONS.warning} Modifying firewall rules can lock you out of the system. Proceed with caution.</p>
                            </div>
                            ${rules.length === 0 ? `
                                <div class="empty-state"><p>No custom firewall rules configured</p></div>
                            ` : `
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Chain</th>
                                            <th>Protocol</th>
                                            <th>Source</th>
                                            <th>Destination</th>
                                            <th>Port</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${rules.map(rule => `
                                            <tr>
                                                <td>${escapeHtml(rule.chain || 'INPUT')}</td>
                                                <td>${escapeHtml(rule.protocol || 'all')}</td>
                                                <td class="mono">${escapeHtml(rule.source || 'any')}</td>
                                                <td class="mono">${escapeHtml(rule.destination || 'any')}</td>
                                                <td>${rule.port || 'all'}</td>
                                                <td><span class="action-badge ${rule.action?.toLowerCase()}">${escapeHtml(rule.action || 'ACCEPT')}</span></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            `}
                        </div>
                    </div>
                </div>
            `;
        },

        // ==========================================
        // Backup Tab
        // ==========================================
        async loadBackupTab(container) {
            const data = await apiCall('/api/backup/').catch(() => ({ backups: [] }));
            const backups = data.backups || [];
            
            container.innerHTML = `
                <div class="backup-section">
                    <!-- Create Backup -->
                    <div class="info-card">
                        <div class="card-header">
                            ${ICONS.upload}
                            <h3>Create Backup</h3>
                        </div>
                        <div class="card-body">
                            <p>Create a full backup of MuleCube configuration and data.</p>
                            <div class="backup-options">
                                <label class="checkbox-item">
                                    <input type="checkbox" id="backupConfig" checked> Configuration files
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" id="backupData"> User data (large)
                                </label>
                            </div>
                            <button class="btn btn-primary" onclick="SystemManagementPanel.createBackup()">
                                ${ICONS.upload} Create Backup
                            </button>
                        </div>
                    </div>
                    
                    <!-- Restore Backup -->
                    <div class="info-card">
                        <div class="card-header">
                            ${ICONS.download}
                            <h3>Restore Backup</h3>
                        </div>
                        <div class="card-body">
                            <p>Restore from a previously created backup file.</p>
                            <div class="file-upload">
                                <input type="file" id="restoreFile" accept=".tar.gz,.tgz,.zip">
                            </div>
                            <button class="btn btn-warning" onclick="SystemManagementPanel.restoreBackup()">
                                ${ICONS.download} Restore Backup
                            </button>
                        </div>
                    </div>
                    
                    <!-- Existing Backups -->
                    <div class="info-card full-width">
                        <div class="card-header">
                            ${ICONS.backup}
                            <h3>Available Backups</h3>
                            <span class="card-badge">${backups.length} backups</span>
                        </div>
                        <div class="card-body">
                            ${backups.length === 0 ? `
                                <div class="empty-state"><p>No backups found</p></div>
                            ` : `
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Filename</th>
                                            <th>Size</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${backups.map(backup => `
                                            <tr>
                                                <td class="mono">${escapeHtml(backup.filename)}</td>
                                                <td>${formatBytes(backup.size || 0)}</td>
                                                <td>${formatDateTime(backup.created)}</td>
                                                <td>
                                                    <button class="btn-icon" onclick="SystemManagementPanel.downloadBackup('${escapeHtml(backup.filename)}')" title="Download">
                                                        ${ICONS.download}
                                                    </button>
                                                    <button class="btn-icon danger" onclick="SystemManagementPanel.deleteBackup('${escapeHtml(backup.filename)}')" title="Delete">
                                                        ${ICONS.close}
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            `}
                        </div>
                    </div>
                </div>
            `;
        },
        
        async createBackup() {
            const includeConfig = document.getElementById('backupConfig').checked;
            const includeData = document.getElementById('backupData').checked;
            
            try {
                const result = await apiCall('/api/backup/create', {
                    method: 'POST',
                    body: JSON.stringify({ include_config: includeConfig, include_data: includeData })
                });
                alert('Backup created successfully: ' + (result.filename || 'backup.tar.gz'));
                this.loadTab('backup');
            } catch (error) {
                alert('Failed to create backup: ' + error.message);
            }
        },
        
        async restoreBackup() {
            const fileInput = document.getElementById('restoreFile');
            if (!fileInput.files.length) {
                alert('Please select a backup file');
                return;
            }
            
            if (!confirm('This will overwrite current configuration. Are you sure?')) {
                return;
            }
            
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            
            try {
                const response = await fetch(`${CONFIG.serviceManagerBase}/api/backup/restore`, {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) throw new Error('Restore failed');
                
                alert('Backup restored successfully. System may need to restart.');
                this.loadTab('backup');
            } catch (error) {
                alert('Failed to restore backup: ' + error.message);
            }
        },
        
        downloadBackup(filename) {
            window.open(`${CONFIG.serviceManagerBase}/api/backup/download/${filename}`, '_blank');
        },
        
        async deleteBackup(filename) {
            if (!confirm(`Delete backup "${filename}"?`)) return;
            
            try {
                await apiCall(`/api/backup/${filename}`, { method: 'DELETE' });
                this.loadTab('backup');
            } catch (error) {
                alert('Failed to delete backup: ' + error.message);
            }
        }
    };

    // ==========================================
    // Initialize on DOM ready
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        SystemManagementPanel.init();
    });

    // Make globally accessible
    window.SystemManagementPanel = SystemManagementPanel;

})();
