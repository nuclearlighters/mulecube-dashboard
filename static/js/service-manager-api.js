/**
 * MuleCube Service Manager API Integration
 * v5.0.0 - Fixed enable workflow, better button styling, improved UX
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
        
        // Initial fetch
        await this.fetchServiceStatus();
        
        // Poll for updates
        setInterval(() => this.fetchServiceStatus(), this.pollInterval);
        
        this.initialized = true;
        console.log('ServiceManagerAPI: Initialized with', Object.keys(this.services).length, 'services');
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
    
    setupStatusBannerToggle() {
        const statusBanner = document.getElementById('statusBanner');
        if (statusBanner) {
            statusBanner.style.cursor = 'pointer';
            statusBanner.addEventListener('click', () => this.toggleDisabledSection());
        }
    },
    
    toggleDisabledSection() {
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
        
        statusBanner.classList.remove('error', 'warning', 'has-disabled');
        
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
            
            if (toggleHint) {
                toggleHint.style.display = 'inline';
                toggleHint.textContent = this.isExpanded ? '▲' : '▼';
            }
        } else {
            if (toggleHint) toggleHint.style.display = 'none';
            
            if (this.isExpanded) {
                this.isExpanded = false;
                const section = document.getElementById('disabledServicesSection');
                if (section) section.style.display = 'none';
                statusBanner.classList.remove('expanded');
            }
        }
        
        statusText.innerHTML = html;
    },
    
    updateAllCards() {
        // Update all cards in categories and start-here
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
        
        // Remove loading state if present
        card.classList.remove('service-loading');
        
        if (!isEnabled) {
            card.classList.add('service-disabled-hidden');
            card.style.display = 'none';
        } else {
            // Re-enable the card
            card.classList.remove('service-disabled-hidden');
            card.style.display = '';
            
            // Update status dot
            const statusDot = card.querySelector('.service-status');
            if (statusDot) {
                statusDot.className = 'service-status ' + (status === 'running' ? 'online' : 'offline');
                statusDot.style.background = ''; // Clear any inline styles
            }
            
            // Add disable button (not in start-here)
            if (!card.closest('.start-here')) {
                this.addDisableButton(card, serviceData);
            }
        }
    },
    
    addDisableButton(card, serviceData) {
        let btn = card.querySelector('.service-disable-btn');
        if (btn) btn.remove();
        
        if (!serviceData.enabled) return;
        
        btn = document.createElement('button');
        btn.className = 'service-disable-btn';
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
        
        if (count === 0 && this.isExpanded) {
            section.style.display = 'none';
            this.isExpanded = false;
        }
        
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
            statusDot.className = 'service-status disabled';
        }
        
        // Remove existing buttons
        card.querySelectorAll('.service-disable-btn').forEach(b => b.remove());
        
        // Add enable button
        const btn = document.createElement('button');
        btn.className = 'service-enable-btn';
        btn.innerHTML = '<span class="enable-icon">▶</span> Enable';
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.enableService(serviceData.name, btn);
        };
        card.appendChild(btn);
        
        // Prevent navigation
        card.onclick = (e) => {
            if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
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
            <div class="service-status disabled"></div>
        `;
        
        const btn = document.createElement('button');
        btn.className = 'service-enable-btn';
        btn.innerHTML = '<span class="enable-icon">▶</span> Enable';
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.enableService(serviceData.name, btn);
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
    
    async enableService(containerName, btnElement) {
        const card = btnElement?.closest('.service-card');
        
        // Show loading state
        if (card) {
            card.classList.add('service-loading');
        }
        if (btnElement) {
            btnElement.disabled = true;
            btnElement.innerHTML = '<span class="enable-icon spinning">◐</span> Starting...';
        }
        
        this.showToast(`Starting ${containerName}...`, 'info');
        
        try {
            const response = await fetch(`${this.endpoint}/${containerName}/enable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(`${containerName} enabled!`, 'success');
                // Refresh status to update UI
                await this.fetchServiceStatus();
            } else {
                throw new Error(result.message || 'Enable failed');
            }
        } catch (error) {
            this.showToast(`Failed: ${error.message}`, 'error');
            if (card) {
                card.classList.remove('service-loading');
            }
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.innerHTML = '<span class="enable-icon">▶</span> Enable';
            }
        }
    },
    
    async disableService(containerName, force = false) {
        const card = document.querySelector(`.service-category .service-card[data-container="${containerName}"]`) ||
                    document.querySelector(`.service-category .service-card[data-service="${containerName}"]`);
        
        if (card) {
            card.classList.add('service-loading');
        }
        
        this.showToast(`Stopping ${containerName}...`, 'info');
        
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
                if (card) card.classList.remove('service-loading');
                const deps = result.affected_services?.join(', ') || 'other services';
                if (confirm(`${deps} depend on ${containerName}. Disable anyway?`)) {
                    await this.disableService(containerName, true);
                }
            } else {
                throw new Error(result.message || 'Disable failed');
            }
        } catch (error) {
            this.showToast(`Failed: ${error.message}`, 'error');
            if (card) card.classList.remove('service-loading');
        }
    },
    
    // Manual sync trigger
    syncNow() {
        this.showToast('Syncing...', 'info');
        this.fetchServiceStatus().then(() => {
            this.showToast('Sync complete!', 'success');
        });
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
