/**
 * MuleCube Service Manager API Integration
 * Fetches service enable/disable status and updates dashboard UI
 * 
 * Add this code to dashboard.js after the CONFIG section
 * and call ServiceManagerAPI.init() in the DOMContentLoaded handler
 */

// ==========================================
// Service Manager API Integration
// ==========================================
const ServiceManagerAPI = {
    endpoint: '/api/services',
    services: {},           // Container name → service data
    containerMap: {},       // service ID → container name mapping
    pollInterval: 30000,    // 30 seconds
    initialized: false,
    
    async init() {
        // Skip in demo mode
        if (typeof ModeManager !== 'undefined' && ModeManager.isDemo) {
            console.log('ServiceManagerAPI: Demo mode, skipping');
            return;
        }
        
        // Build container mapping from data attributes
        this.buildContainerMap();
        
        // Initial fetch
        await this.fetchServiceStatus();
        
        // Poll for updates
        setInterval(() => this.fetchServiceStatus(), this.pollInterval);
        
        this.initialized = true;
        console.log('ServiceManagerAPI: Initialized');
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
        
        console.log('ServiceManagerAPI: Container map built', this.containerMap);
    },
    
    /**
     * Fetch service status from API
     */
    async fetchServiceStatus() {
        try {
            const response = await fetch(this.endpoint, {
                signal: AbortSignal.timeout(5000)
            });
            
            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.services && Array.isArray(data.services)) {
                // Build services map by container name
                this.services = {};
                data.services.forEach(svc => {
                    this.services[svc.name] = svc;
                });
                
                // Update UI
                this.updateAllCards();
            }
        } catch (error) {
            console.warn('ServiceManagerAPI: Failed to fetch status', error);
            // Don't update UI on error - keep last known state
        }
    },
    
    /**
     * Update all service cards based on current status
     */
    updateAllCards() {
        // Iterate through all service cards
        document.querySelectorAll('.service-card[data-service]').forEach(card => {
            const serviceId = card.dataset.service;
            const containerName = card.dataset.container || this.containerMap[serviceId] || serviceId;
            
            const serviceData = this.services[containerName];
            
            if (serviceData) {
                this.updateCard(card, serviceData);
            }
        });
        
        // Update status banner count if needed
        this.updateStatusCounts();
    },
    
    /**
     * Update a single card based on service data
     */
    updateCard(card, serviceData) {
        const isEnabled = serviceData.enabled;
        const status = serviceData.status; // 'running', 'exited', 'paused', etc.
        
        // Toggle disabled class
        card.classList.toggle('disabled', !isEnabled);
        
        // Update status dot
        const statusDot = card.querySelector('.service-status');
        if (statusDot) {
            if (!isEnabled) {
                statusDot.className = 'service-status disabled';
            } else if (status === 'running') {
                statusDot.className = 'service-status online';
            } else {
                statusDot.className = 'service-status offline';
            }
        }
        
        // Update tooltip for disabled services
        if (!isEnabled) {
            card.setAttribute('data-tooltip', `${serviceData.display_name || serviceData.name} is disabled`);
        }
        
        // Handle click prevention for disabled cards
        if (!isEnabled && !card.dataset.disabledHandlerAttached) {
            card.addEventListener('click', this.handleDisabledClick.bind(this), true);
            card.dataset.disabledHandlerAttached = 'true';
        }
    },
    
    /**
     * Handle click on disabled card
     */
    handleDisabledClick(e) {
        const card = e.currentTarget;
        if (card.classList.contains('disabled')) {
            e.preventDefault();
            e.stopPropagation();
            
            const serviceName = card.querySelector('h3')?.textContent || 'This service';
            this.showToast(`${serviceName} is disabled. Enable it in Manage Services.`, 'info');
        }
    },
    
    /**
     * Update status counts in the banner
     */
    updateStatusCounts() {
        const statusText = document.getElementById('statusText');
        if (!statusText) return;
        
        let total = 0;
        let online = 0;
        let disabled = 0;
        
        // Count from services data
        Object.values(this.services).forEach(svc => {
            total++;
            if (!svc.enabled) {
                disabled++;
            } else if (svc.status === 'running') {
                online++;
            }
        });
        
        // Update banner text
        if (disabled > 0) {
            const enabledTotal = total - disabled;
            statusText.innerHTML = `${online}/${enabledTotal} services online <span class="status-count muted">${disabled} disabled</span>`;
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
            <button onclick="this.parentElement.remove()" style="margin-left: 1rem; background: none; border: none; color: inherit; cursor: pointer;">✕</button>
        `;
        document.body.appendChild(toast);
        
        // Auto-remove after 4 seconds
        setTimeout(() => toast.remove(), 4000);
    },
    
    /**
     * Enable a service (for future use with Manage Services UI)
     */
    async enableService(containerName) {
        try {
            const response = await fetch(`${this.endpoint}/${containerName}/enable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) throw new Error('Failed to enable service');
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(`${containerName} enabled`, 'success');
                await this.fetchServiceStatus();
            }
            
            return result;
        } catch (error) {
            this.showToast(`Failed to enable ${containerName}`, 'error');
            throw error;
        }
    },
    
    /**
     * Disable a service (for future use with Manage Services UI)
     */
    async disableService(containerName, force = false) {
        try {
            const response = await fetch(`${this.endpoint}/${containerName}/disable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ force })
            });
            
            if (!response.ok) throw new Error('Failed to disable service');
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(`${containerName} disabled`, 'success');
                await this.fetchServiceStatus();
            } else if (result.requires_force) {
                // Service has dependents
                const deps = result.affected_services.join(', ');
                this.showToast(`Cannot disable: ${deps} depend on this service`, 'error');
            }
            
            return result;
        } catch (error) {
            this.showToast(`Failed to disable ${containerName}`, 'error');
            throw error;
        }
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
        return svc ? svc.enabled : true; // Default to enabled if unknown
    }
};

// Make globally accessible
window.ServiceManagerAPI = ServiceManagerAPI;


/* ===========================================
   INTEGRATION INSTRUCTIONS
   ===========================================
   
   1. Add this code to dashboard.js after line ~27 (after the CONFIG object)
   
   2. In the DOMContentLoaded handler (around line 1931), add:
      ServiceManagerAPI.init();
   
   3. Add the CSS from service-manager.css to dashboard.css
   
   4. Update service-category.html partial to include data-container attribute:
      <a href="{{ $linkUrl }}" ... data-container="{{ .container | default .service }}">
   
   5. Update hugo.yaml to include container field for each service
   
   The ServiceManagerAPI will:
   - Fetch service status from /api/services every 30 seconds
   - Gray out disabled services with 'Disabled' label
   - Prevent clicking on disabled service cards
   - Show toast messages for user feedback
   - Update status counts in the banner
*/
document.addEventListener('DOMContentLoaded', () => ServiceManagerAPI.init());
