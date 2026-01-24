/**
 * MuleCube Service Manager API Integration
 * v8.0.0 - System service protection + profile support
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
    isDemo: false,
    
    // Long-press state
    longPressTimer: null,
    longPressDuration: 2500, // 2.5 seconds
    longPressTarget: null,
    
    // Demo mode: services to disable initially
    demoDisabledServices: ['bentopdf', 'linkwarden'],
    
    // System services that should never be toggled
    systemServices: [
        'mulecube-service-manager', 'mulecube-hw-monitor', 'mulecube-reset',
        'mulecube-terminal', 'mulecube-terminal-ro', 'mulecube-status',
        'mulecube-diagnostics', 'mulecube-backup', 'mulecube-wifi-status',
        'mulecube-watchdog', 'mulecube-usb-monitor', 'mulecube-nettools',
        'mulecube-gpio', 'mulecube-dockge', 'mulecube-logs', 'mulecube-dashboard',
        'mulecube-homarr', 'nginx-proxy', 'pihole', 'uptime-kuma',
        // Database backends
        'postgres', 'postgres-linkwarden', 'valkey', 'meilisearch',
        'meilisearch-linkwarden', 'tika'
    ],
    
    /**
     * Check if a container is a system service (non-toggleable)
     */
    isSystemService(containerName) {
        if (!containerName) return false;
        return this.systemServices.includes(containerName) ||
               containerName.startsWith('mulecube-') ||
               containerName.startsWith('watchtower-');
    },
    
    async init() {
        // Check for demo mode - check meta tag directly to avoid race condition with ModeManager
        const metaTag = document.querySelector('meta[name="mulecube-mode"]');
        this.isDemo = (metaTag && metaTag.content === 'demo') || 
                      (typeof ModeManager !== 'undefined' && ModeManager.isDemo);
        
        this.buildContainerMap();
        this.setupStatusBannerToggle();
        
        if (this.isDemo) {
            // Demo mode: simulate service data
            this.initDemoServices();
        } else {
            // Production: fetch from API
            await this.fetchServiceStatus();
            setInterval(() => this.fetchServiceStatus(), this.pollInterval);
        }
        
        this.initialized = true;
        console.log('ServiceManagerAPI: Initialized', this.isDemo ? '(demo mode)' : '(production)');
    },
    
    /**
     * Initialize demo mode with simulated service data
     */
    initDemoServices() {
        // Build service data from DOM
        document.querySelectorAll('.service-card[data-service]').forEach(card => {
            const serviceId = card.dataset.service;
            const container = card.dataset.container || serviceId;
            const nameEl = card.querySelector('h3');
            const descEl = card.querySelector('p');
            
            if (container && !this.services[container]) {
                const isDisabled = this.demoDisabledServices.includes(container.toLowerCase());
                
                this.services[container] = {
                    name: container,
                    display_name: nameEl ? nameEl.textContent : container,
                    description: descEl ? descEl.textContent : '',
                    enabled: !isDisabled,
                    status: isDisabled ? 'stopped' : 'running'
                };
                
                if (isDisabled) {
                    this.disabledServices.push(container);
                }
            }
        });
        
        // Set all visible status dots to green immediately
        this.setAllDotsOnline();
        
        // Update UI
        this.updateAllCards();
        this.updateDisabledSection();
        this.updateStatusBanner();
        
        // Watch for dynamically created cards (Recently Used, etc) and set them to green
        this.setupDemoMutationObserver();
        
        // Also update after delays to catch any dynamically created cards
        setTimeout(() => this.setAllDotsOnline(), 300);
        setTimeout(() => this.setAllDotsOnline(), 1000);
    },
    
    /**
     * Watch for new service cards being added to DOM and set their status to online
     */
    setupDemoMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Check if it's a service card or contains service cards
                        if (node.classList?.contains('service-card')) {
                            this.setCardOnline(node);
                        } else if (node.querySelectorAll) {
                            node.querySelectorAll('.service-card').forEach(card => {
                                this.setCardOnline(card);
                            });
                        }
                    }
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    },
    
    /**
     * Set a single card's status dot to online (for demo mode)
     */
    setCardOnline(card) {
        if (!card || card.classList.contains('disabled-service-card') || card.classList.contains('service-disabled-hidden')) {
            return;
        }
        const statusDot = card.querySelector('.service-status');
        if (statusDot && !statusDot.classList.contains('disabled')) {
            statusDot.className = 'service-status online';
        }
    },
    
    /**
     * Set all visible service status dots to online (green) - for demo mode
     */
    setAllDotsOnline() {
        document.querySelectorAll('.service-card .service-status').forEach(dot => {
            const card = dot.closest('.service-card');
            // Skip disabled cards
            if (card && !card.classList.contains('disabled-service-card') && !card.classList.contains('service-disabled-hidden')) {
                dot.className = 'service-status online';
            }
        });
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
        // Skip in demo mode
        if (this.isDemo) return;
        
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
        
        // If we don't have any service data yet, show loading state
        const serviceCount = Object.keys(this.services).length;
        if (serviceCount === 0 && !this.isDemo) {
            statusText.innerHTML = '<span class="status-checking">Checking services...</span>';
            statusBanner.classList.remove('error', 'warning', 'has-disabled');
            if (toggleHint) toggleHint.style.display = 'none';
            return;
        }
        
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
        // Update cards in all sections: categories, start-here, recently-used, and admin
        document.querySelectorAll('.service-category .service-card[data-service], .start-here .service-card[data-service], #recentlyUsedGrid .service-card[data-service], .advanced-section .service-card[data-service]').forEach(card => {
            const serviceId = card.dataset.service;
            const containerName = card.dataset.container || this.containerMap[serviceId] || serviceId;
            const serviceData = this.services[containerName];
            
            if (serviceData) {
                this.updateCard(card, serviceData);
            } else if (this.isDemo) {
                // In demo mode, set any card without service data to online
                const statusDot = card.querySelector('.service-status');
                if (statusDot) {
                    statusDot.className = 'service-status online';
                }
            }
        });
    },
    
    updateCard(card, serviceData) {
        const isEnabled = serviceData.enabled;
        const status = serviceData.status;
        
        // Don't touch cards that are being long-pressed
        if (card.classList.contains('long-pressing')) {
            return;
        }
        
        // Remove loading state
        card.classList.remove('service-loading');
        
        // Remove any stale progress rings
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
        // Don't setup twice
        if (card._longPressSetup) return;
        
        // Don't setup for system services - they can't be toggled
        if (this.isSystemService(serviceData.name)) {
            return;
        }
        
        card._longPressSetup = true;
        
        // Prevent drag ghost image
        card.setAttribute('draggable', 'false');
        
        let pressTimer = null;
        let progressRing = null;
        let startTime = null;
        
        const startPress = (e) => {
            // Don't trigger on right-click
            if (e.button && e.button !== 0) return;
            // Prevent default to stop drag behavior
            e.preventDefault();
            
            startTime = Date.now();
            card.classList.add('long-pressing');
            
            // Create progress ring with color based on action
            const ringColor = action === 'disable' ? 'var(--color-danger)' : 'var(--color-primary)';
            progressRing = document.createElement('div');
            progressRing.className = 'long-press-ring';
            progressRing.innerHTML = `
                <svg viewBox="0 0 36 36">
                    <circle class="ring-bg" cx="18" cy="18" r="16"/>
                    <circle class="ring-progress" cx="18" cy="18" r="16" style="stroke: ${ringColor}"/>
                </svg>
                <span class="ring-icon" style="color: ${ringColor}">${action === 'disable' ? '⏸' : '▶'}</span>
            `;
            card.appendChild(progressRing);
            
            // Animate the ring
            const ring = progressRing.querySelector('.ring-progress');
            ring.style.animation = `longPressProgress ${this.longPressDuration}ms linear forwards`;
            
            pressTimer = setTimeout(() => {
                // Long press completed
                card.classList.remove('long-pressing');
                if (progressRing && progressRing.parentNode) progressRing.remove();
                
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
            card.classList.remove('long-pressing');
            if (progressRing && progressRing.parentNode) {
                progressRing.remove();
            }
        };
        
        // Mouse events
        card.addEventListener('mousedown', startPress);
        card.addEventListener('mouseup', cancelPress);
        card.addEventListener('mouseleave', cancelPress);
        
        // Touch events
        card.addEventListener('touchstart', (e) => {
            startPress(e);
        }, { passive: true });
        card.addEventListener('touchend', cancelPress);
        card.addEventListener('touchcancel', cancelPress);
        
        // Allow normal click for navigation (short press)
        card.addEventListener('click', (e) => {
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
        
        // Don't rebuild if any card is being long-pressed
        if (grid.querySelector('.long-pressing')) {
            return;
        }
        
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
        // Create a div instead of cloning the anchor to prevent drag ghost
        const card = document.createElement('div');
        card.className = 'service-card disabled-service-card';
        card.dataset.service = originalCard.dataset.service;
        card.dataset.container = serviceData.name;
        
        // Copy the inner content from original
        card.innerHTML = originalCard.innerHTML;
        
        // Grey status dot
        const statusDot = card.querySelector('.service-status');
        if (statusDot) {
            statusDot.className = 'service-status disabled';
        }
        
        // Add hint text inside service-info
        const serviceInfo = card.querySelector('.service-info');
        if (serviceInfo) {
            // Remove any existing hint first
            const existingHint = serviceInfo.querySelector('.long-press-hint');
            if (existingHint) existingHint.remove();
            
            const hint = document.createElement('div');
            hint.className = 'long-press-hint';
            hint.textContent = 'Hold to enable';
            serviceInfo.appendChild(hint);
        }
        
        // Prevent dragging
        card.setAttribute('draggable', 'false');
        
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
                <div class="long-press-hint">Hold to enable</div>
            </div>
            <div class="service-status disabled"></div>
        `;
        
        card.setAttribute('draggable', 'false');
        this.setupLongPressForDisabled(card, serviceData);
        
        return card;
    },
    
    /**
     * Setup long-press for disabled cards (to enable)
     */
    setupLongPressForDisabled(card, serviceData) {
        // Prevent drag ghost
        card.setAttribute('draggable', 'false');
        
        let pressTimer = null;
        let progressRing = null;
        let startTime = null;
        
        const startPress = (e) => {
            if (e.button && e.button !== 0) return;
            e.preventDefault(); // Prevent drag behavior
            
            startTime = Date.now();
            card.classList.add('long-pressing');
            
            // Green ring for enable
            progressRing = document.createElement('div');
            progressRing.className = 'long-press-ring';
            progressRing.innerHTML = `
                <svg viewBox="0 0 36 36">
                    <circle class="ring-bg" cx="18" cy="18" r="16"/>
                    <circle class="ring-progress ring-enable" cx="18" cy="18" r="16"/>
                </svg>
                <span class="ring-icon ring-icon-enable">▶</span>
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
        // Block system services from being toggled
        if (this.isSystemService(containerName)) {
            console.log('ServiceManagerAPI: Cannot toggle system service:', containerName);
            return;
        }
        
        this.showToast(`Starting ${containerName}...`, 'info');
        
        if (this.isDemo) {
            // Demo mode: simulate enable
            await this.simulateDelay(1500);
            
            if (this.services[containerName]) {
                this.services[containerName].enabled = true;
                this.services[containerName].status = 'running';
                this.disabledServices = this.disabledServices.filter(s => s !== containerName);
            }
            
            // Sync with modal if open
            if (typeof ServiceManagerModal !== 'undefined' && ServiceManagerModal.services) {
                const svc = ServiceManagerModal.services.find(s => s.name === containerName);
                if (svc) {
                    svc.enabled = true;
                    svc.status = 'running';
                    ServiceManagerModal.serviceDetails[containerName] = {
                        cpu_percent: Math.random() * 10,
                        ram_current_mb: Math.floor((svc.ram_estimate_mb || 256) * 0.7)
                    };
                }
                if (ServiceManagerModal.isOpen) {
                    ServiceManagerModal.renderServices();
                    ServiceManagerModal.updateSummary();
                }
            }
            
            this.showToast(`${containerName} enabled!`, 'success');
            this.updateAllCards();
            this.updateDisabledSection();
            this.updateStatusBanner();
            return;
        }
        
        // Production mode
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
        // Block system services from being toggled
        if (this.isSystemService(containerName)) {
            console.log('ServiceManagerAPI: Cannot toggle system service:', containerName);
            return;
        }
        
        this.showToast(`Stopping ${containerName}...`, 'info');
        
        if (this.isDemo) {
            // Demo mode: simulate disable
            await this.simulateDelay(1500);
            
            if (this.services[containerName]) {
                this.services[containerName].enabled = false;
                this.services[containerName].status = 'stopped';
                if (!this.disabledServices.includes(containerName)) {
                    this.disabledServices.push(containerName);
                }
            }
            
            // Sync with modal if open
            if (typeof ServiceManagerModal !== 'undefined' && ServiceManagerModal.services) {
                const svc = ServiceManagerModal.services.find(s => s.name === containerName);
                if (svc) {
                    svc.enabled = false;
                    svc.status = 'exited';
                    delete ServiceManagerModal.serviceDetails[containerName];
                }
                if (ServiceManagerModal.isOpen) {
                    ServiceManagerModal.renderServices();
                    ServiceManagerModal.updateSummary();
                }
            }
            
            // Simulate RAM freed (random between 50-300MB)
            const ramFreed = Math.floor(Math.random() * 250) + 50;
            this.showToast(`${containerName} disabled. RAM freed: ${ramFreed}MB`, 'success');
            
            this.updateAllCards();
            this.updateDisabledSection();
            this.updateStatusBanner();
            return;
        }
        
        // Production mode
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
    
    /**
     * Simulate async delay for demo mode
     */
    simulateDelay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
