/**
 * MuleCube Service Manager API Integration
 * v3.0.0 - Disabled services banner (replaces hero), proper counting, fixed visibility
 */

const ServiceManagerAPI = {
    endpoint: '/api/services',
    services: {},           // Container name → service data
    containerMap: {},       // service ID → container name mapping
    reverseMap: {},         // container name → service ID mapping
    disabledServices: [],   // List of disabled container names
    pollInterval: 30000,
    initialized: false,
    isExpanded: false,
    
    async init() {
        // Skip in demo mode
        if (typeof ModeManager !== 'undefined' && ModeManager.isDemo) {
            console.log('ServiceManagerAPI: Demo mode, skipping');
            return;
        }
        
        // Build container mapping from data attributes
        this.buildContainerMap();
        
        // Setup banner toggle
        this.setupBannerToggle();
        
        // Initial fetch
        await this.fetchServiceStatus();
        
        // Poll for updates
        setInterval(() => this.fetchServiceStatus(), this.pollInterval);
        
        this.initialized = true;
        console.log('ServiceManagerAPI: Initialized');
    },
    
    /**
     * Build mapping from service IDs to container names and vice versa
     */
    buildContainerMap() {
        document.querySelectorAll('.service-card[data-service]').forEach(card => {
            const serviceId = card.dataset.service;
            const container = card.dataset.container || serviceId;
            if (serviceId) {
                this.containerMap[serviceId] = container;
                this.reverseMap[container] = serviceId;
            }
        });
        console.log('ServiceManagerAPI: Mapped', Object.keys(this.containerMap).length, 'services');
    },
    
    /**
     * Setup the disabled services banner toggle
     */
    setupBannerToggle() {
        const toggleBtn = document.getElementById('disabledBannerToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleBanner());
        }
    },
    
    /**
     * Toggle disabled services banner
     */
    toggleBanner() {
        this.isExpanded = !this.isExpanded;
        const content = document.getElementById('disabledBannerContent');
        const toggleBtn = document.getElementById('disabledBannerToggle');
        const chevron = toggleBtn?.querySelector('.disabled-banner-chevron');
        
        if (content) {
            content.style.display = this.isExpanded ? 'block' : 'none';
        }
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', this.isExpanded);
        }
        if (chevron) {
            chevron.textContent = this.isExpanded ? '▲' : '▼';
        }
    },
    
    /**
     * Fetch service status from API
     */
    async fetchServiceStatus() {
        try {
            const response = await fetch(this.endpoint, {
                signal: AbortSignal.timeout(10000)
            });
            
            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.services && Array.isArray(data.services)) {
                this.services = {};
                this.disabledServices = [];
                
                data.services.forEach(svc => {
                    this.services[svc.name] = svc;
                    if (!svc.enabled) {
                        this.disabledServices.push(svc.name);
                    }
                });
                
                // Update all UI components
                this.updateAllCards();
                this.updateDisabledBanner();
                this.updateStatusBanner();
            }
        } catch (error) {
            console.warn('ServiceManagerAPI: Failed to fetch status', error);
        }
    },
    
    /**
     * Update status banner with accurate counts from API
     */
    updateStatusBanner() {
        const statusBanner = document.getElementById('statusBanner');
        const statusText = document.getElementById('statusText');
        if (!statusBanner || !statusText) return;
        
        let enabledCount = 0;
        let runningCount = 0;
        let disabledCount = this.disabledServices.length;
        
        Object.values(this.services).forEach(svc => {
            if (svc.enabled) {
                enabledCount++;
                if (svc.status === 'running') {
                    runningCount++;
                }
            }
        });
        
        const offlineCount = enabledCount - runningCount;
        
        // Remove all state classes
        statusBanner.classList.remove('error', 'warning');
        
        if (offlineCount === 0 && disabledCount === 0) {
            statusText.innerHTML = `All ${runningCount} services operational`;
        } else if (offlineCount === 0 && disabledCount > 0) {
            statusText.innerHTML = `${runningCount} services operational <span class="status-count muted">${disabledCount} disabled</span>`;
        } else if (offlineCount > 0) {
            statusBanner.classList.add('warning');
            statusText.innerHTML = `${runningCount}/${enabledCount} services online <span class="status-count offline">${offlineCount} offline</span>`;
            if (disabledCount > 0) {
                statusText.innerHTML += ` <span class="status-count muted">${disabledCount} disabled</span>`;
            }
        }
    },
    
    /**
     * Update all service cards based on current status
     */
    updateAllCards() {
        // Process all service cards in categories (not in disabled banner)
        document.querySelectorAll('.service-category .service-card[data-service], .start-here .service-card[data-service]').forEach(card => {
            const serviceId = card.dataset.service;
            const containerName = card.dataset.container || this.containerMap[serviceId] || serviceId;
            const serviceData = this.services[containerName];
            
            if (serviceData) {
                this.updateCard(card, serviceData);
            }
        });
    },
    
    /**
     * Update a single card based on service data
     */
    updateCard(card, serviceData) {
        const isEnabled = serviceData.enabled;
        const status = serviceData.status;
        
        // Toggle visibility - hide disabled services from categories
        if (!isEnabled) {
            card.classList.add('service-disabled-hidden');
            card.style.display = 'none';
        } else {
            card.classList.remove('service-disabled-hidden');
            card.style.display = '';
            
            // Update status dot
            const statusDot = card.querySelector('.service-status');
            if (statusDot) {
                statusDot.className = 'service-status ' + (status === 'running' ? 'online' : 'offline');
            }
            
            // Add disable button on hover
            this.addDisableButton(card, serviceData);
        }
    },
    
    /**
     * Add disable button to enabled service cards
     */
    addDisableButton(card, serviceData) {
        // Skip if in start-here section (don't add disable buttons there)
        if (card.closest('.start-here')) return;
        
        // Remove existing button first
        const existingBtn = card.querySelector('.service-action-btn');
        if (existingBtn) existingBtn.remove();
        
        if (!serviceData.enabled) return;
        
        const btn = document.createElement('button');
        btn.className = 'service-action-btn service-disable-btn';
        btn.innerHTML = '⏸';
        btn.title = 'Disable this service';
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.disableService(serviceData.name);
        };
        
        card.appendChild(btn);
    },
    
    /**
     * Update the disabled services banner
     */
    updateDisabledBanner() {
        const banner = document.getElementById('disabledServicesBanner');
        const grid = document.getElementById('disabledServicesGrid');
        const countEl = document.getElementById('disabledBannerCount');
        
        if (!banner || !grid) return;
        
        const count = this.disabledServices.length;
        
        // Update count
        if (countEl) {
            countEl.textContent = `(${count})`;
        }
        
        // Show/hide banner
        banner.style.display = count > 0 ? 'block' : 'none';
        
        // Clear and rebuild grid
        grid.innerHTML = '';
        
        this.disabledServices.forEach(containerName => {
            const serviceData = this.services[containerName];
            if (!serviceData) return;
            
            // Find original card in categories
            const serviceId = this.reverseMap[containerName] || containerName;
            const originalCard = document.querySelector(`.service-category .service-card[data-container="${containerName}"]`) ||
                                document.querySelector(`.service-category .service-card[data-service="${serviceId}"]`);
            
            const card = originalCard 
                ? this.createDisabledCardFromOriginal(originalCard, serviceData)
                : this.createDisabledCardFromData(serviceData);
            
            grid.appendChild(card);
        });
        
        // Update category counts
        this.updateCategoryCounts();
    },
    
    /**
     * Create disabled card by cloning original
     */
    createDisabledCardFromOriginal(originalCard, serviceData) {
        const card = originalCard.cloneNode(true);
        card.className = 'service-card disabled-service-card';
        card.style.display = '';
        
        // Update status dot
        const statusDot = card.querySelector('.service-status');
        if (statusDot) {
            statusDot.className = 'service-status disabled';
        }
        
        // Remove any existing action buttons
        card.querySelectorAll('.service-action-btn').forEach(b => b.remove());
        
        // Add enable button
        const btn = document.createElement('button');
        btn.className = 'service-action-btn service-enable-btn';
        btn.innerHTML = '▶ Enable';
        btn.title = 'Enable this service';
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.enableService(serviceData.name);
        };
        card.appendChild(btn);
        
        // Prevent navigation
        card.onclick = (e) => {
            if (!e.target.closest('.service-action-btn')) {
                e.preventDefault();
                this.showToast(`${serviceData.display_name || serviceData.name} is disabled. Click "Enable" to start it.`, 'info');
            }
        };
        
        return card;
    },
    
    /**
     * Create disabled card from API data
     */
    createDisabledCardFromData(serviceData) {
        const card = document.createElement('div');
        card.className = 'service-card disabled-service-card';
        card.dataset.service = serviceData.name;
        card.dataset.container = serviceData.name;
        
        card.innerHTML = `
            <div class="service-icon"><span>◆</span></div>
            <div class="service-info">
                <h3>${serviceData.display_name || serviceData.name}</h3>
                <p>${serviceData.description || ''}</p>
            </div>
            <div class="service-status disabled"></div>
        `;
        
        const btn = document.createElement('button');
        btn.className = 'service-action-btn service-enable-btn';
        btn.innerHTML = '▶ Enable';
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.enableService(serviceData.name);
        };
        card.appendChild(btn);
        
        return card;
    },
    
    /**
     * Update category counts to reflect visible cards
     */
    updateCategoryCounts() {
        document.querySelectorAll('.service-category').forEach(category => {
            const allCards = category.querySelectorAll('.service-card');
            const visibleCards = category.querySelectorAll('.service-card:not(.service-disabled-hidden)');
            const countSpan = category.querySelector('.category-count');
            
            if (countSpan) {
                countSpan.textContent = `(${visibleCards.length})`;
            }
            
            // Hide category if no visible cards
            category.style.display = visibleCards.length === 0 ? 'none' : '';
        });
    },
    
    /**
     * Enable a service
     */
    async enableService(containerName) {
        this.showToast(`Enabling ${containerName}...`, 'info');
        
        const card = document.querySelector(`#disabledServicesGrid .service-card[data-container="${containerName}"]`);
        if (card) card.classList.add('service-loading');
        
        try {
            const response = await fetch(`${this.endpoint}/${containerName}/enable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(`${containerName} enabled!`, 'success');
                await this.fetchServiceStatus();
            } else {
                throw new Error(result.message || 'Enable failed');
            }
        } catch (error) {
            this.showToast(`Failed: ${error.message}`, 'error');
            if (card) card.classList.remove('service-loading');
        }
    },
    
    /**
     * Disable a service
     */
    async disableService(containerName, force = false) {
        this.showToast(`Disabling ${containerName}...`, 'info');
        
        try {
            const response = await fetch(`${this.endpoint}/${containerName}/disable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ force })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(`${containerName} disabled. RAM freed: ${result.ram_freed_mb || 0}MB`, 'success');
                await this.fetchServiceStatus();
            } else if (result.requires_force) {
                const deps = result.affected_services?.join(', ') || 'other services';
                if (confirm(`${deps} depend on ${containerName}. Disable anyway?`)) {
                    await this.disableService(containerName, true);
                }
            } else {
                throw new Error(result.message || 'Disable failed');
            }
        } catch (error) {
            this.showToast(`Failed: ${error.message}`, 'error');
        }
    },
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const existing = document.querySelector('.service-manager-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = `service-manager-toast ${type}`;
        toast.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()">✕</button>`;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.parentElement && toast.remove(), 4000);
    }
};

window.ServiceManagerAPI = ServiceManagerAPI;
document.addEventListener('DOMContentLoaded', () => ServiceManagerAPI.init());
