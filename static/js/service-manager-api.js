/**
 * MuleCube Service Manager API Integration
 * Fetches service enable/disable status and manages Disabled Services section
 * 
 * v2.0.0 - Added Disabled Services section with enable/disable buttons
 */

// ==========================================
// Service Manager API Integration
// ==========================================
const ServiceManagerAPI = {
    endpoint: '/api/services',
    services: {},           // Container name → service data
    containerMap: {},       // service ID → container name mapping
    disabledServices: [],   // List of disabled container names
    pollInterval: 30000,    // 30 seconds
    initialized: false,
    isExpanded: false,      // Disabled section expanded state
    
    async init() {
        // Skip in demo mode
        if (typeof ModeManager !== 'undefined' && ModeManager.isDemo) {
            console.log('ServiceManagerAPI: Demo mode, skipping');
            return;
        }
        
        // Build container mapping from data attributes
        this.buildContainerMap();
        
        // Setup disabled services toggle
        this.setupDisabledToggle();
        
        // Initial fetch
        await this.fetchServiceStatus();
        
        // Poll for updates
        setInterval(() => this.fetchServiceStatus(), this.pollInterval);
        
        this.initialized = true;
        console.log('ServiceManagerAPI: Initialized with', Object.keys(this.containerMap).length, 'services mapped');
    },
    
    /**
     * Build mapping from service IDs (data-service) to container names (data-container)
     */
    buildContainerMap() {
        document.querySelectorAll('.service-card[data-container]').forEach(card => {
            const serviceId = card.dataset.service;
            const container = card.dataset.container;
            if (serviceId && container) {
                this.containerMap[serviceId] = container;
            }
        });
        
        // Fallback: if no data-container, assume service ID = container name
        document.querySelectorAll('.service-card[data-service]').forEach(card => {
            const serviceId = card.dataset.service;
            if (serviceId && !this.containerMap[serviceId]) {
                this.containerMap[serviceId] = serviceId;
            }
        });
    },
    
    /**
     * Setup the disabled services section toggle
     */
    setupDisabledToggle() {
        const toggleBtn = document.getElementById('disabledServicesToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleDisabledSection());
        }
    },
    
    /**
     * Toggle disabled services section visibility
     */
    toggleDisabledSection() {
        this.isExpanded = !this.isExpanded;
        const content = document.getElementById('disabledServicesContent');
        const toggleBtn = document.getElementById('disabledServicesToggle');
        
        if (content) {
            content.style.display = this.isExpanded ? 'block' : 'none';
        }
        if (toggleBtn) {
            toggleBtn.classList.toggle('active', this.isExpanded);
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
                // Build services map by container name
                this.services = {};
                this.disabledServices = [];
                
                data.services.forEach(svc => {
                    this.services[svc.name] = svc;
                    if (!svc.enabled) {
                        this.disabledServices.push(svc.name);
                    }
                });
                
                // Update UI
                this.updateAllCards();
                this.updateDisabledSection();
            }
        } catch (error) {
            console.warn('ServiceManagerAPI: Failed to fetch status', error);
        }
    },
    
    /**
     * Update all service cards based on current status
     */
    updateAllCards() {
        document.querySelectorAll('.service-card[data-service]').forEach(card => {
            // Skip cards in the disabled services grid
            if (card.closest('#disabledServicesGrid')) return;
            
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
        
        // Hide disabled cards from normal categories (they go to disabled section)
        if (!isEnabled) {
            card.style.display = 'none';
        } else {
            card.style.display = '';
        }
        
        // Update status dot for enabled services
        const statusDot = card.querySelector('.service-status');
        if (statusDot && isEnabled) {
            if (status === 'running') {
                statusDot.className = 'service-status online';
            } else {
                statusDot.className = 'service-status offline';
            }
        }
        
        // Add disable button on hover for enabled services
        this.addDisableButton(card, serviceData);
    },
    
    /**
     * Add disable button to enabled service cards
     */
    addDisableButton(card, serviceData) {
        // Remove existing button first
        const existingBtn = card.querySelector('.service-action-btn');
        if (existingBtn) existingBtn.remove();
        
        if (!serviceData.enabled) return;
        
        // Create disable button
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
     * Update the disabled services section
     */
    updateDisabledSection() {
        const section = document.getElementById('disabledServicesSection');
        const grid = document.getElementById('disabledServicesGrid');
        const countEl = document.getElementById('disabledCount');
        
        if (!section || !grid) return;
        
        const disabledCount = this.disabledServices.length;
        
        // Update count
        if (countEl) {
            countEl.textContent = `(${disabledCount})`;
        }
        
        // Show/hide section based on count
        section.style.display = disabledCount > 0 ? 'block' : 'none';
        
        // Clear and rebuild disabled services grid
        grid.innerHTML = '';
        
        this.disabledServices.forEach(containerName => {
            const serviceData = this.services[containerName];
            if (!serviceData) return;
            
            // Find original card to clone
            const originalCard = document.querySelector(`.service-category .service-card[data-container="${containerName}"]`) ||
                                document.querySelector(`.service-category .service-card[data-service="${containerName}"]`);
            
            if (originalCard) {
                const card = this.createDisabledCard(originalCard, serviceData);
                grid.appendChild(card);
            } else {
                // Create card from service data if original not found
                const card = this.createCardFromData(serviceData);
                grid.appendChild(card);
            }
        });
        
        // Update empty category visibility
        this.updateCategoryVisibility();
    },
    
    /**
     * Create a disabled service card with Enable button
     */
    createDisabledCard(originalCard, serviceData) {
        const card = originalCard.cloneNode(true);
        card.classList.add('disabled-service-card');
        card.style.display = ''; // Make sure it's visible
        
        // Remove existing status dot styling
        const statusDot = card.querySelector('.service-status');
        if (statusDot) {
            statusDot.className = 'service-status disabled';
        }
        
        // Remove any existing action buttons
        const existingBtn = card.querySelector('.service-action-btn');
        if (existingBtn) existingBtn.remove();
        
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
        
        // Prevent navigation when clicking disabled card
        card.addEventListener('click', (e) => {
            e.preventDefault();
            this.showToast(`${serviceData.display_name || serviceData.name} is disabled. Click "Enable" to start it.`, 'info');
        });
        
        return card;
    },
    
    /**
     * Create card from service data when original not found
     */
    createCardFromData(serviceData) {
        const card = document.createElement('div');
        card.className = 'service-card disabled-service-card';
        card.dataset.service = serviceData.name;
        card.dataset.container = serviceData.name;
        
        card.innerHTML = `
            <div class="service-icon">
                <span class="service-fallback">◆</span>
            </div>
            <div class="service-info">
                <h3>${serviceData.display_name || serviceData.name}</h3>
                <p>${serviceData.description || ''}</p>
            </div>
            <div class="service-status disabled"></div>
        `;
        
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
        
        return card;
    },
    
    /**
     * Update category visibility (hide empty categories)
     */
    updateCategoryVisibility() {
        document.querySelectorAll('.service-category').forEach(category => {
            const visibleCards = category.querySelectorAll('.service-card:not([style*="display: none"])');
            const categoryTitle = category.querySelector('.category-title');
            
            if (visibleCards.length === 0) {
                category.style.display = 'none';
            } else {
                category.style.display = '';
                // Update count in category title
                const countSpan = categoryTitle?.querySelector('.category-count');
                if (countSpan) {
                    countSpan.textContent = `(${visibleCards.length})`;
                }
            }
        });
    },
    
    /**
     * Enable a service
     */
    async enableService(containerName) {
        const card = document.querySelector(`#disabledServicesGrid .service-card[data-container="${containerName}"]`) ||
                    document.querySelector(`#disabledServicesGrid .service-card[data-service="${containerName}"]`);
        
        if (card) {
            card.classList.add('service-loading');
        }
        
        this.showToast(`Enabling ${containerName}...`, 'info');
        
        try {
            const response = await fetch(`${this.endpoint}/${containerName}/enable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) throw new Error('Failed to enable service');
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(`${containerName} enabled successfully!`, 'success');
                // Refresh status
                await this.fetchServiceStatus();
            } else {
                throw new Error(result.message || 'Enable failed');
            }
        } catch (error) {
            this.showToast(`Failed to enable ${containerName}: ${error.message}`, 'error');
            if (card) {
                card.classList.remove('service-loading');
            }
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
            
            if (!response.ok) throw new Error('Failed to disable service');
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(`${containerName} disabled. RAM freed: ${result.ram_freed_mb || 0}MB`, 'success');
                // Refresh status
                await this.fetchServiceStatus();
            } else if (result.requires_force) {
                // Service has dependents - ask for confirmation
                const deps = result.affected_services?.join(', ') || 'other services';
                if (confirm(`${deps} depend on ${containerName}. Disable anyway?`)) {
                    await this.disableService(containerName, true);
                }
            } else {
                throw new Error(result.message || 'Disable failed');
            }
        } catch (error) {
            this.showToast(`Failed to disable ${containerName}: ${error.message}`, 'error');
        }
    },
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        // Remove existing toast
        const existing = document.querySelector('.service-manager-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = `service-manager-toast ${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="margin-left: 1rem; background: none; border: none; color: inherit; cursor: pointer; font-size: 1.2em;">✕</button>
        `;
        document.body.appendChild(toast);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 4000);
    },
    
    /**
     * Get service info
     */
    getService(containerName) {
        return this.services[containerName] || null;
    },
    
    /**
     * Check if service is enabled
     */
    isEnabled(containerName) {
        const svc = this.services[containerName];
        return svc ? svc.enabled : true;
    }
};

// Make globally accessible
window.ServiceManagerAPI = ServiceManagerAPI;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => ServiceManagerAPI.init());
