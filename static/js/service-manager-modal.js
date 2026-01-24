/**
 * MuleCube Service Manager Modal
 * Full-featured service management interface
 * v1.0.0
 */

const ServiceManagerModal = {
    isOpen: false,
    services: [],
    serviceDetails: {},
    refreshInterval: null,
    isDemo: false,
    
    /**
     * Initialize the modal system
     */
    init() {
        // Check demo mode
        const metaTag = document.querySelector('meta[name="mulecube-mode"]');
        this.isDemo = metaTag && metaTag.content === 'demo';
        
        // Inject modal HTML into page
        this.injectModalHTML();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup keyboard shortcut (M for Manage)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'm' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const activeEl = document.activeElement;
                const isInput = activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA';
                if (!isInput) {
                    e.preventDefault();
                    this.toggle();
                }
            }
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
        
        console.log('ServiceManagerModal: Initialized');
    },
    
    /**
     * Inject modal HTML structure
     */
    injectModalHTML() {
        const modal = document.createElement('div');
        modal.id = 'serviceManagerModal';
        modal.className = 'service-modal-overlay';
        modal.innerHTML = `
            <div class="service-modal">
                <div class="service-modal-header">
                    <div class="modal-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        <h2>Manage Services</h2>
                    </div>
                    <div class="modal-actions">
                        <button class="modal-refresh-btn" onclick="ServiceManagerModal.refresh()" title="Refresh">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M23 4v6h-6"></path>
                                <path d="M1 20v-6h6"></path>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                        </button>
                        <button class="modal-close-btn" onclick="ServiceManagerModal.close()" title="Close (Esc)">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="service-modal-summary" id="modalSummary">
                    <div class="summary-item">
                        <span class="summary-value" id="summaryTotal">--</span>
                        <span class="summary-label">Total</span>
                    </div>
                    <div class="summary-item running">
                        <span class="summary-value" id="summaryRunning">--</span>
                        <span class="summary-label">Running</span>
                    </div>
                    <div class="summary-item stopped">
                        <span class="summary-value" id="summaryStopped">--</span>
                        <span class="summary-label">Stopped</span>
                    </div>
                    <div class="summary-item ram">
                        <span class="summary-value" id="summaryRam">--</span>
                        <span class="summary-label">RAM Used</span>
                    </div>
                </div>
                
                <div class="service-modal-filters">
                    <input type="text" id="modalSearchInput" placeholder="Search services..." class="modal-search">
                    <select id="modalCategoryFilter" class="modal-filter">
                        <option value="">All Categories</option>
                    </select>
                    <select id="modalStatusFilter" class="modal-filter">
                        <option value="">All Status</option>
                        <option value="running">Running</option>
                        <option value="stopped">Stopped</option>
                    </select>
                </div>
                
                <div class="service-modal-body" id="modalBody">
                    <div class="modal-loading">
                        <div class="loading-spinner"></div>
                        <span>Loading services...</span>
                    </div>
                </div>
                
                <div class="service-modal-footer">
                    <span class="modal-hint">Press <kbd>M</kbd> to toggle • <kbd>Esc</kbd> to close</span>
                    <span class="modal-hint" id="lastRefresh">Last updated: --</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close on overlay click
        const overlay = document.getElementById('serviceManagerModal');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.close();
            }
        });
        
        // Search input
        const searchInput = document.getElementById('modalSearchInput');
        searchInput.addEventListener('input', () => this.filterServices());
        
        // Category filter
        const categoryFilter = document.getElementById('modalCategoryFilter');
        categoryFilter.addEventListener('change', () => this.filterServices());
        
        // Status filter
        const statusFilter = document.getElementById('modalStatusFilter');
        statusFilter.addEventListener('change', () => this.filterServices());
    },
    
    /**
     * Open the modal
     */
    async open() {
        const modal = document.getElementById('serviceManagerModal');
        modal.classList.add('open');
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
        
        // Load services
        await this.loadServices();
        
        // Start auto-refresh every 30 seconds (not 10, to reduce load)
        this.refreshInterval = setInterval(() => this.loadServices(true), 30000);
        
        // Focus search input
        setTimeout(() => {
            document.getElementById('modalSearchInput').focus();
        }, 100);
    },
    
    /**
     * Close the modal
     */
    close() {
        const modal = document.getElementById('serviceManagerModal');
        modal.classList.remove('open');
        this.isOpen = false;
        document.body.style.overflow = '';
        
        // Stop auto-refresh
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    },
    
    /**
     * Toggle modal open/close
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    },
    
    /**
     * Manual refresh
     */
    async refresh() {
        const btn = document.querySelector('.modal-refresh-btn');
        btn.classList.add('spinning');
        await this.loadServices();
        setTimeout(() => btn.classList.remove('spinning'), 500);
    },
    
    /**
     * Load services from API
     */
    async loadServices(silent = false) {
        const body = document.getElementById('modalBody');
        
        if (!silent) {
            body.innerHTML = `
                <div class="modal-loading">
                    <div class="loading-spinner"></div>
                    <span>Loading services...</span>
                </div>
            `;
        }
        
        try {
            if (this.isDemo) {
                // Demo mode: generate fake data only on first load
                if (this.services.length === 0) {
                    this.services = this.generateDemoServices();
                    this.generateDemoStats();
                }
                // Don't regenerate - keep user's changes
            } else {
                // Production: fetch from API (single call, no individual details)
                const response = await fetch('/api/services', {
                    signal: AbortSignal.timeout(15000)
                });
                const data = await response.json();
                this.services = data.services || [];
                
                // Skip individual detail calls - use estimates from list endpoint
                // The /api/services already includes ram_estimate_mb
            }
            
            // Update UI immediately with estimates
            this.renderServices();
            this.updateSummary();
            this.updateCategoryFilter();
            this.updateLastRefresh();
            
            // Then fetch real stats in background (non-blocking)
            if (!this.isDemo && !silent) {
                this.loadServiceDetailsBackground();
            }
            
        } catch (error) {
            console.error('Failed to load services:', error);
            body.innerHTML = `
                <div class="modal-error">
                    <span>Failed to load services</span>
                    <button onclick="ServiceManagerModal.loadServices()">Retry</button>
                </div>
            `;
        }
    },
    
    /**
     * Generate demo stats (called once)
     */
    generateDemoStats() {
        this.services.forEach(svc => {
            if (svc.status === 'running') {
                this.serviceDetails[svc.name] = {
                    cpu_percent: Math.random() * 15,
                    ram_current_mb: Math.floor(svc.ram_estimate_mb * (0.5 + Math.random() * 0.5))
                };
            }
        });
    },
    
    /**
     * Load detailed stats for each service - DISABLED for performance
     * The list endpoint already has ram_estimate_mb which is sufficient
     */
    async loadServiceDetails() {
        // Skip this - too slow with many services
        // Individual /api/services/{name} calls take too long
        return;
    },
    
    /**
     * Load service details in background (non-blocking)
     * Fetches real CPU/RAM stats after initial render
     */
    async loadServiceDetailsBackground() {
        const runningServices = this.services.filter(s => s.status === 'running');
        
        // Fetch in parallel with timeout
        const fetchPromises = runningServices.map(async (svc) => {
            try {
                const response = await fetch(`/api/services/${svc.name}`, {
                    signal: AbortSignal.timeout(5000)
                });
                if (response.ok) {
                    const detail = await response.json();
                    this.serviceDetails[svc.name] = {
                        cpu_percent: detail.cpu_percent,
                        ram_current_mb: detail.ram_current_mb
                    };
                }
            } catch (e) {
                // Ignore individual failures
            }
        });
        
        // Wait for all with overall timeout
        await Promise.race([
            Promise.all(fetchPromises),
            new Promise(resolve => setTimeout(resolve, 30000)) // 30s max
        ]);
        
        // Re-render with actual stats
        this.renderServices();
        this.updateSummary();
    },
    
    /**
     * Generate demo services data
     */
    generateDemoServices() {
        const categories = {
            ai: ['LibreTranslate', 'Open WebUI', 'Ollama'],
            knowledge: ['Kiwix', 'Calibre-Web', 'TileServer GL', 'Emergency Reference'],
            collaboration: ['CryptPad', 'Excalidraw', 'BentoPDF'],
            security: ['Vaultwarden'],
            files: ['File Browser', 'Syncthing', 'Linkwarden', 'Open Archiver'],
            communication: ['Element', 'Meshtastic', 'Conduit'],
            tools: ['IT-Tools', 'Network Tools', 'APK Repo', 'Signal K']
        };
        
        const services = [];
        let id = 0;
        
        for (const [category, names] of Object.entries(categories)) {
            for (const name of names) {
                const containerName = name.toLowerCase().replace(/ /g, '-');
                const isDisabled = containerName === 'bentopdf' || containerName === 'linkwarden';
                
                services.push({
                    name: containerName,
                    display_name: name,
                    description: `${name} service`,
                    category: category,
                    enabled: !isDisabled,
                    status: isDisabled ? 'exited' : 'running',
                    ram_estimate_mb: 128 + Math.floor(Math.random() * 384),
                    dependencies: [],
                    dependents: []
                });
                id++;
            }
        }
        
        return services;
    },
    
    /**
     * Render the services table
     */
    renderServices() {
        const body = document.getElementById('modalBody');
        const searchTerm = document.getElementById('modalSearchInput').value.toLowerCase();
        const categoryFilter = document.getElementById('modalCategoryFilter').value;
        const statusFilter = document.getElementById('modalStatusFilter').value;
        
        // Filter services
        let filtered = this.services.filter(svc => {
            // Search filter
            if (searchTerm && !svc.display_name.toLowerCase().includes(searchTerm) && 
                !svc.name.toLowerCase().includes(searchTerm)) {
                return false;
            }
            // Category filter
            if (categoryFilter && svc.category !== categoryFilter) {
                return false;
            }
            // Status filter
            if (statusFilter === 'running' && svc.status !== 'running') {
                return false;
            }
            if (statusFilter === 'stopped' && svc.status === 'running') {
                return false;
            }
            return true;
        });
        
        // Group by category
        const grouped = {};
        filtered.forEach(svc => {
            const cat = svc.category || 'other';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(svc);
        });
        
        // Category display names
        const categoryNames = {
            ai: 'AI Services',
            knowledge: 'Knowledge',
            collaboration: 'Collaboration',
            security: 'Security',
            files: 'Files & Sync',
            communication: 'Communication',
            tools: 'Tools',
            media: 'Media',
            other: 'Other'
        };
        
        // Render
        let html = '<div class="service-list">';
        
        for (const [category, services] of Object.entries(grouped)) {
            html += `
                <div class="service-category-group">
                    <div class="category-header">
                        <span class="category-name">${categoryNames[category] || category}</span>
                        <span class="category-count">${services.length}</span>
                    </div>
                    <div class="service-items">
            `;
            
            for (const svc of services) {
                const isRunning = svc.status === 'running';
                const details = this.serviceDetails[svc.name] || {};
                const cpuPercent = details.cpu_percent;
                const ramCurrent = details.ram_current_mb;
                
                // Show actual RAM if available, otherwise estimate
                const ramDisplay = ramCurrent ? `${ramCurrent}MB` : `~${svc.ram_estimate_mb}MB`;
                const ramTitle = ramCurrent ? 'Current RAM' : 'Estimated RAM';
                const ramClass = ramCurrent ? '' : 'estimate';
                
                html += `
                    <div class="service-row ${isRunning ? 'running' : 'stopped'}" data-service="${svc.name}">
                        <div class="service-main">
                            <span class="service-status-dot ${isRunning ? 'online' : 'offline'}"></span>
                            <span class="service-name">${svc.display_name}</span>
                            ${svc.dependencies?.length ? `<span class="service-badge dep" title="Depends on: ${svc.dependencies.join(', ')}">DEP</span>` : ''}
                            ${svc.dependents?.length ? `<span class="service-badge req" title="Required by: ${svc.dependents.join(', ')}">REQ</span>` : ''}
                        </div>
                        <div class="service-stats">
                            ${isRunning && cpuPercent !== undefined ? `
                                <span class="stat" title="CPU">${cpuPercent.toFixed(1)}%</span>
                            ` : ''}
                            <span class="stat ${ramClass}" title="${ramTitle}">${ramDisplay}</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" 
                                ${svc.enabled ? 'checked' : ''} 
                                onchange="ServiceManagerModal.toggleService('${svc.name}', this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                `;
            }
            
            html += '</div></div>';
        }
        
        if (Object.keys(grouped).length === 0) {
            html = `
                <div class="modal-empty">
                    <span>No services match your filters</span>
                </div>
            `;
        }
        
        html += '</div>';
        body.innerHTML = html;
    },
    
    /**
     * Filter services based on current filters
     */
    filterServices() {
        this.renderServices();
    },
    
    /**
     * Update summary stats
     */
    updateSummary() {
        const total = this.services.length;
        const running = this.services.filter(s => s.status === 'running').length;
        const stopped = total - running;
        
        // Calculate actual RAM used (from details) or fall back to estimates
        let actualRam = 0;
        let hasActualData = false;
        
        this.services.forEach(s => {
            if (s.status === 'running') {
                const details = this.serviceDetails[s.name];
                if (details && details.ram_current_mb) {
                    actualRam += details.ram_current_mb;
                    hasActualData = true;
                }
            }
        });
        
        document.getElementById('summaryTotal').textContent = total;
        document.getElementById('summaryRunning').textContent = running;
        document.getElementById('summaryStopped').textContent = stopped;
        
        // Show actual RAM if we have data, otherwise show "Loading..."
        if (hasActualData) {
            document.getElementById('summaryRam').textContent = `${actualRam}MB`;
        } else if (!this.isDemo) {
            document.getElementById('summaryRam').textContent = '...';
        }
    },
    
    /**
     * Update category filter dropdown
     */
    updateCategoryFilter() {
        const select = document.getElementById('modalCategoryFilter');
        const currentValue = select.value;
        
        // Get unique categories
        const categories = [...new Set(this.services.map(s => s.category))].sort();
        
        const categoryNames = {
            ai: 'AI Services',
            knowledge: 'Knowledge',
            collaboration: 'Collaboration',
            security: 'Security',
            files: 'Files & Sync',
            communication: 'Communication',
            tools: 'Tools',
            media: 'Media',
            other: 'Other'
        };
        
        select.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(cat => {
            const name = categoryNames[cat] || cat;
            select.innerHTML += `<option value="${cat}" ${cat === currentValue ? 'selected' : ''}>${name}</option>`;
        });
    },
    
    /**
     * Update last refresh timestamp
     */
    updateLastRefresh() {
        const el = document.getElementById('lastRefresh');
        const now = new Date();
        el.textContent = `Last updated: ${now.toLocaleTimeString()}`;
    },
    
    /**
     * Toggle a service on/off
     */
    async toggleService(serviceName, enable) {
        const row = document.querySelector(`.service-row[data-service="${serviceName}"]`);
        const toggle = row.querySelector('input[type="checkbox"]');
        
        // Show loading state
        row.classList.add('loading');
        toggle.disabled = true;
        
        try {
            if (this.isDemo) {
                // Demo mode: simulate toggle
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const svc = this.services.find(s => s.name === serviceName);
                if (svc) {
                    svc.enabled = enable;
                    svc.status = enable ? 'running' : 'exited';
                    
                    if (enable) {
                        this.serviceDetails[serviceName] = {
                            cpu_percent: Math.random() * 10,
                            ram_current_mb: Math.floor(svc.ram_estimate_mb * 0.7)
                        };
                    } else {
                        delete this.serviceDetails[serviceName];
                    }
                }
                
                this.showToast(`${serviceName} ${enable ? 'enabled' : 'disabled'}`, 'success');
            } else {
                // Production: call API
                const endpoint = enable ? 'enable' : 'disable';
                const response = await fetch(`/api/services/${serviceName}/${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ force: false })
                });
                
                const result = await response.json();
                
                if (result.requires_force) {
                    // Service has dependents
                    const deps = result.affected_services?.join(', ') || 'other services';
                    const confirmed = confirm(`${deps} depend on ${serviceName}. Disable anyway?`);
                    
                    if (confirmed) {
                        const forceResponse = await fetch(`/api/services/${serviceName}/disable`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ force: true })
                        });
                        const forceResult = await forceResponse.json();
                        
                        if (forceResult.success) {
                            this.showToast(`${serviceName} disabled (freed ${forceResult.ram_freed_mb || 0}MB)`, 'success');
                        } else {
                            throw new Error(forceResult.message || 'Failed');
                        }
                    } else {
                        // Revert toggle
                        toggle.checked = !enable;
                    }
                } else if (result.success) {
                    const msg = enable 
                        ? `${serviceName} enabled` 
                        : `${serviceName} disabled (freed ${result.ram_freed_mb || 0}MB)`;
                    this.showToast(msg, 'success');
                } else {
                    throw new Error(result.message || 'Failed');
                }
            }
            
            // Refresh to get updated state
            await this.loadServices(true);
            
            // Also update the main dashboard if ServiceManagerAPI is available
            if (typeof ServiceManagerAPI !== 'undefined' && ServiceManagerAPI.fetchServiceStatus) {
                ServiceManagerAPI.fetchServiceStatus();
            }
            
        } catch (error) {
            console.error('Toggle failed:', error);
            this.showToast(`Failed: ${error.message}`, 'error');
            toggle.checked = !enable; // Revert
        } finally {
            row.classList.remove('loading');
            toggle.disabled = false;
        }
    },
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Remove existing toast
        const existing = document.querySelector('.modal-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = `modal-toast ${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        
        const modal = document.querySelector('.service-modal');
        modal.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    ServiceManagerModal.init();
});

// Make globally accessible
window.ServiceManagerModal = ServiceManagerModal;
