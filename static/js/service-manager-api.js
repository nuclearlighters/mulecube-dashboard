/**
 * MuleCube Service Manager API Integration
 * v6.0.0 - Long-press to enable/disable (3 seconds with progress indicator)
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
    
    // Long-press state
    longPressTimer: null,
    longPressDuration: 2500, // 2.5 seconds
    longPressTarget: null,
    
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
        
        // Remove loading state
        card.classList.remove('service-loading', 'long-pressing');
        
        // Remove any progress rings
        const existingRing = card.querySelector('.long-press-ring');
        if (existingRing) existingRing.remove();
        
        if (!isEnabled) {
            card.classList.add('service-disabled-hidden');
            card.style.display = 'none';
        } else {
            card.classList.remove('service-disabled-hidden');
            card.style.display = '';
            
            const statusDot = card.querySelector('.service-status');
            if (statusDot) {
                statusDot.className = 'service-status ' + (status === 'running' ? 'online' : 'offline');
                statusDot.style.background = '';
            }
            
            // Add long-press to disable (not in start-here)
            if (!card.closest('.start-here')) {
                this.setupLongPress(card, serviceData, 'disable');
            }
        }
    },
    
    /**
     * Setup long-press handler on a card
     */
    setupLongPress(card, serviceData, action) {
        // Remove existing listeners by cloning
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);
        
        let pressTimer = null;
        let progressRing = null;
        let startTime = null;
        
        const startPress = (e) => {
            // Don't trigger on right-click
            if (e.button && e.button !== 0) return;
            
            startTime = Date.now();
            newCard.classList.add('long-pressing');
            
            // Create progress ring
            progressRing = document.createElement('div');
            progressRing.className = 'long-press-ring';
            progressRing.innerHTML = `
                <svg viewBox="0 0 36 36">
                    <circle class="ring-bg" cx="18" cy="18" r="16"/>
                    <circle class="ring-progress" cx="18" cy="18" r="16"/>
                </svg>
                <span class="ring-icon">${action === 'disable' ? '⏸' : '▶'}</span>
            `;
            newCard.appendChild(progressRing);
            
            // Animate the ring
            const ring = progressRing.querySelector('.ring-progress');
            ring.style.animation = `longPressProgress ${this.longPressDuration}ms linear forwards`;
            
            pressTimer = setTimeout(() => {
                // Long press completed
                newCard.classList.remove('long-pressing');
                if (progressRing) progressRing.remove();
                
                if (action === 'disable') {
                    this.disableService(serviceData.name);
                } else {
                    this.enableService(serviceData.name);
                }
            }, this.longPressDuration);
        };
        
        const cancelPress = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
            newCard.classList.remove('long-pressing');
            if (progressRing && progressRing.parentNode) {
                progressRing.remove();
            }
        };
        
        // Mouse events
        newCard.addEventListener('mousedown', startPress);
        newCard.addEventListener('mouseup', cancelPress);
        newCard.addEventListener('mouseleave', cancelPress);
        
        // Touch events
        newCard.addEventListener('touchstart', (e) => {
            startPress(e);
        }, { passive: true });
        newCard.addEventListener('touchend', cancelPress);
        newCard.addEventListener('touchcancel', cancelPress);
        
        // Allow normal click for navigation (short press)
        newCard.addEventListener('click', (e) => {
            const pressDuration = Date.now() - (startTime || 0);
            if (pressDuration > 500) {
                // Was a long press attempt, prevent navigation
                e.preventDefault();
            }
        });
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
        
        // Add hint text
        const hint = document.createElement('div');
        hint.className = 'long-press-hint';
        hint.textContent = 'Hold to enable';
        card.appendChild(hint);
        
        // Setup long-press to enable
        this.setupLongPressForDisabled(card, serviceData);
        
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
            <div class="long-press-hint">Hold to enable</div>
        `;
        
        this.setupLongPressForDisabled(card, serviceData);
        
        return card;
    },
    
    /**
     * Setup long-press for disabled cards (to enable)
     */
    setupLongPressForDisabled(card, serviceData) {
        let pressTimer = null;
        let progressRing = null;
        let startTime = null;
        
        const startPress = (e) => {
            if (e.button && e.button !== 0) return;
            
            startTime = Date.now();
            card.classList.add('long-pressing');
            
            progressRing = document.createElement('div');
            progressRing.className = 'long-press-ring';
            progressRing.innerHTML = `
                <svg viewBox="0 0 36 36">
                    <circle class="ring-bg" cx="18" cy="18" r="16"/>
                    <circle class="ring-progress" cx="18" cy="18" r="16"/>
                </svg>
                <span class="ring-icon">▶</span>
            `;
            card.appendChild(progressRing);
            
            const ring = progressRing.querySelector('.ring-progress');
            ring.style.animation = `longPressProgress ${this.longPressDuration}ms linear forwards`;
            
            pressTimer = setTimeout(() => {
                card.classList.remove('long-pressing');
                card.classList.add('service-loading');
                if (progressRing) progressRing.remove();
                this.enableService(serviceData.name);
            }, this.longPressDuration);
        };
        
        const cancelPress = () => {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
            card.classList.remove('long-pressing');
            if (progressRing && progressRing.parentNode) {
                progressRing.remove();
            }
        };
        
        card.addEventListener('mousedown', startPress);
        card.addEventListener('mouseup', cancelPress);
        card.addEventListener('mouseleave', cancelPress);
        card.addEventListener('touchstart', startPress, { passive: true });
        card.addEventListener('touchend', cancelPress);
        card.addEventListener('touchcancel', cancelPress);
        
        card.addEventListener('click', (e) => {
            e.preventDefault(); // Disabled cards shouldn't navigate
        });
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
        this.showToast(`Starting ${containerName}...`, 'info');
        
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
            await this.fetchServiceStatus();
        }
    },
    
    async disableService(containerName, force = false) {
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
                const deps = result.affected_services?.join(', ') || 'other services';
                if (confirm(`${deps} depend on ${containerName}. Disable anyway?`)) {
                    await this.disableService(containerName, true);
                } else {
                    await this.fetchServiceStatus();
                }
            } else {
                throw new Error(result.message || 'Disable failed');
            }
        } catch (error) {
            this.showToast(`Failed: ${error.message}`, 'error');
            await this.fetchServiceStatus();
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
