/**
 * MuleCube Service Manager API Integration
 * v4.0.0 - Status banner toggles disabled section, proper counts, fixed styling
 */

const ServiceManagerAPI = {
    endpoint: '/api/services',
    services: {},
    containerMap: {},
    reverseMap: {},
    disabledServices: [],
    pollInterval: 30000,
    initialized: false,
    isExpanded: false,
    
    async init() {
        // Skip in demo mode
        if (typeof ModeManager !== 'undefined' && ModeManager.isDemo) {
            console.log('ServiceManagerAPI: Demo mode, skipping');
            return;
        }
        
        this.buildContainerMap();
        this.setupStatusBannerToggle();
        
        await this.fetchServiceStatus();
        setInterval(() => this.fetchServiceStatus(), this.pollInterval);
        
        this.initialized = true;
        console.log('ServiceManagerAPI: Initialized');
    },
    
    buildContainerMap() {
        document.querySelectorAll('.service-card[data-service]').forEach(card => {
            const serviceId = card.dataset.service;
            const container = card.dataset.container || serviceId;
            if (serviceId) {
                this.containerMap[serviceId] = container;
                this.reverseMap[container] = serviceId;
            }
        });
    },
    
    /**
     * Setup status banner to toggle disabled services section
     */
    setupStatusBannerToggle() {
        const statusBanner = document.getElementById('statusBanner');
        if (statusBanner) {
            statusBanner.style.cursor = 'pointer';
            statusBanner.addEventListener('click', () => this.toggleDisabledSection());
        }
    },
    
    /**
     * Toggle disabled services section visibility
     */
    toggleDisabledSection() {
        // Only toggle if there are disabled services
        if (this.disabledServices.length === 0) return;
        
        this.isExpanded = !this.isExpanded;
        const section = document.getElementById('disabledServicesSection');
        const hint = document.getElementById('statusToggleHint');
        const statusBanner = document.getElementById('statusBanner');
        
        if (section) {
            section.style.display = this.isExpanded ? 'block' : 'none';
        }
        if (hint) {
            hint.textContent = this.isExpanded ? '▲' : '▼';
        }
        if (statusBanner) {
            statusBanner.classList.toggle('expanded', this.isExpanded);
        }
    },
    
    async fetchServiceStatus() {
        try {
            const response = await fetch(this.endpoint, {
                signal: AbortSignal.timeout(10000)
            });
            
            if (!response.ok) throw new Error(`API returned ${response.status}`);
            
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
                
                this.updateAllCards();
                this.updateDisabledSection();
                this.updateStatusBanner();
            }
        } catch (error) {
            console.warn('ServiceManagerAPI: Failed to fetch status', error);
        }
    },
    
    /**
     * Update status banner with correct counts from API
     */
    updateStatusBanner() {
        const statusBanner = document.getElementById('statusBanner');
        const statusText = document.getElementById('statusText');
        const toggleHint = document.getElementById('statusToggleHint');
        
        if (!statusBanner || !statusText) return;
        
        let runningCount = 0;
        let enabledCount = 0;
        const disabledCount = this.disabledServices.length;
        
        Object.values(this.services).forEach(svc => {
            if (svc.enabled) {
                enabledCount++;
                if (svc.status === 'running') {
                    runningCount++;
                }
            }
        });
        
        const offlineCount = enabledCount - runningCount;
        
        // Remove state classes
        statusBanner.classList.remove('error', 'warning', 'has-disabled');
        
        // Build status text
        let html = '';
        
        if (offlineCount === 0) {
            html = `<span class="status-operational">${runningCount} services operational</span>`;
        } else {
            statusBanner.classList.add('warning');
            html = `<span class="status-warning">${runningCount}/${enabledCount} online</span>`;
        }
        
        if (disabledCount > 0) {
            statusBanner.classList.add('has-disabled');
            html += `<span class="status-disabled">${disabledCount} disabled</span>`;
            
            // Show toggle hint
            if (toggleHint) {
                toggleHint.style.display = 'inline';
                toggleHint.textContent = this.isExpanded ? '▲' : '▼';
            }
        } else {
            if (toggleHint) toggleHint.style.display = 'none';
            
            // Close section if no disabled services
            if (this.isExpanded) {
                this.isExpanded = false;
                const section = document.getElementById('disabledServicesSection');
                if (section) section.style.display = 'none';
            }
        }
        
        statusText.innerHTML = html;
    },
    
    updateAllCards() {
        document.querySelectorAll('.service-category .service-card[data-service], .start-here .service-card[data-service]').forEach(card => {
            const serviceId = card.dataset.service;
            const containerName = card.dataset.container || this.containerMap[serviceId] || serviceId;
            const serviceData = this.services[containerName];
            
            if (serviceData) {
                this.updateCard(card, serviceData);
            }
        });
    },
    
    updateCard(card, serviceData) {
        const isEnabled = serviceData.enabled;
        const status = serviceData.status;
        
        if (!isEnabled) {
            card.classList.add('service-disabled-hidden');
            card.style.display = 'none';
        } else {
            card.classList.remove('service-disabled-hidden');
            card.style.display = '';
            
            const statusDot = card.querySelector('.service-status');
            if (statusDot) {
                statusDot.className = 'service-status ' + (status === 'running' ? 'online' : 'offline');
            }
            
            // Add disable button (not in start-here)
            if (!card.closest('.start-here')) {
                this.addDisableButton(card, serviceData);
            }
        }
    },
    
    addDisableButton(card, serviceData) {
        let btn = card.querySelector('.service-action-btn');
        if (btn) btn.remove();
        
        if (!serviceData.enabled) return;
        
        btn = document.createElement('button');
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
    
    updateDisabledSection() {
        const section = document.getElementById('disabledServicesSection');
        const grid = document.getElementById('disabledServicesGrid');
        
        if (!section || !grid) return;
        
        const count = this.disabledServices.length;
        
        // If no disabled services and section is showing, hide it
        if (count === 0) {
            section.style.display = 'none';
            this.isExpanded = false;
        }
        
        // Clear and rebuild grid
        grid.innerHTML = '';
        
        this.disabledServices.forEach(containerName => {
            const serviceData = this.services[containerName];
            if (!serviceData) return;
            
            const serviceId = this.reverseMap[containerName] || containerName;
            const originalCard = document.querySelector(`.service-category .service-card[data-container="${containerName}"]`) ||
                                document.querySelector(`.service-category .service-card[data-service="${serviceId}"]`);
            
            const card = originalCard 
                ? this.createDisabledCard(originalCard, serviceData)
                : this.createDisabledCardFromData(serviceData);
            
            grid.appendChild(card);
        });
        
        this.updateCategoryCounts();
    },
    
    createDisabledCard(originalCard, serviceData) {
        const card = originalCard.cloneNode(true);
        card.className = 'service-card disabled-service-card';
        card.style.display = '';
        card.dataset.container = serviceData.name;
        
        // Grey status dot
        const statusDot = card.querySelector('.service-status');
        if (statusDot) {
            statusDot.className = 'service-status';
            statusDot.style.background = 'var(--color-text-muted)';
        }
        
        // Remove existing buttons
        card.querySelectorAll('.service-action-btn').forEach(b => b.remove());
        
        // Add enable button
        const btn = document.createElement('button');
        btn.className = 'service-enable-btn';
        btn.textContent = 'Enable';
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.enableService(serviceData.name);
        };
        card.appendChild(btn);
        
        // Prevent navigation
        card.onclick = (e) => {
            if (e.target.tagName !== 'BUTTON') {
                e.preventDefault();
            }
        };
        
        return card;
    },
    
    createDisabledCardFromData(serviceData) {
        const card = document.createElement('div');
        card.className = 'service-card disabled-service-card';
        card.dataset.service = serviceData.name;
        card.dataset.container = serviceData.name;
        
        card.innerHTML = `
            <div class="service-icon"><span style="font-size: 1.5rem; opacity: 0.5;">◆</span></div>
            <div class="service-info">
                <h3>${serviceData.display_name || serviceData.name}</h3>
                <p>${serviceData.description || ''}</p>
            </div>
            <div class="service-status" style="background: var(--color-text-muted);"></div>
        `;
        
        const btn = document.createElement('button');
        btn.className = 'service-enable-btn';
        btn.textContent = 'Enable';
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.enableService(serviceData.name);
        };
        card.appendChild(btn);
        
        return card;
    },
    
    updateCategoryCounts() {
        document.querySelectorAll('.service-category').forEach(category => {
            const visibleCards = category.querySelectorAll('.service-card:not(.service-disabled-hidden)');
            const countSpan = category.querySelector('.category-count');
            
            if (countSpan) {
                countSpan.textContent = `(${visibleCards.length})`;
            }
            
            category.style.display = visibleCards.length === 0 ? 'none' : '';
        });
    },
    
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
