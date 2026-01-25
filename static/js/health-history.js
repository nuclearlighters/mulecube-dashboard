/**
 * MuleCube Health History
 * GitHub-style uptime visualization for services
 * 
 * v1.0.0 - Adapted for MuleCube Dashboard
 */

(function() {
    'use strict';

    // SVG Icons
    const ICONS = {
        clock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        checkCircle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
        xCircle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        alertCircle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
    };

    const HealthHistory = {
        STORAGE_KEY: 'mulecube_health_history',
        RECORD_INTERVAL: 5 * 60 * 1000, // 5 minutes
        MAX_RECORDS: 24, // 24 data points = 24 hours at 1 per hour
        history: {},
        recordTimer: null,
        
        init() {
            this.loadHistory();
            this.startRecording();
            this.renderAll();
            
            // Re-render when service status updates
            document.addEventListener('serviceStatusUpdate', () => this.renderAll());
        },
        
        loadHistory() {
            try {
                const stored = localStorage.getItem(this.STORAGE_KEY);
                this.history = stored ? JSON.parse(stored) : {};
            } catch (e) {
                console.warn('[HealthHistory] Error loading history:', e);
                this.history = {};
            }
        },
        
        saveHistory() {
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.history));
            } catch (e) {
                console.warn('[HealthHistory] Error saving history:', e);
            }
        },
        
        startRecording() {
            // Record immediately
            this.recordCurrentStatus();
            
            // Then record at interval
            this.recordTimer = setInterval(() => {
                this.recordCurrentStatus();
            }, this.RECORD_INTERVAL);
        },
        
        recordCurrentStatus() {
            const timestamp = Date.now();
            
            // Get service status from ServiceManagerAPI if available
            let services = {};
            
            if (typeof ServiceManagerAPI !== 'undefined' && ServiceManagerAPI.services) {
                services = ServiceManagerAPI.services;
            } else {
                // Fallback: read from DOM
                document.querySelectorAll('.service-card[data-service]').forEach(card => {
                    const serviceId = card.dataset.service;
                    const statusDot = card.querySelector('.service-status');
                    let status = 'unknown';
                    
                    if (statusDot) {
                        if (statusDot.classList.contains('online')) status = 'online';
                        else if (statusDot.classList.contains('offline')) status = 'offline';
                        else if (statusDot.classList.contains('degraded')) status = 'degraded';
                    }
                    
                    services[serviceId] = { status };
                });
            }
            
            // Record each service's status
            for (const [serviceId, data] of Object.entries(services)) {
                const status = data.status || 'unknown';
                this.recordStatus(serviceId, status, timestamp);
            }
            
            this.saveHistory();
            this.renderAll();
        },
        
        recordStatus(serviceId, status, timestamp = Date.now()) {
            if (!this.history[serviceId]) {
                this.history[serviceId] = [];
            }
            
            // Normalize status
            const normalizedStatus = this.normalizeStatus(status);
            
            // Add new record
            this.history[serviceId].push({
                timestamp,
                status: normalizedStatus
            });
            
            // Keep only last MAX_RECORDS
            if (this.history[serviceId].length > this.MAX_RECORDS) {
                this.history[serviceId] = this.history[serviceId].slice(-this.MAX_RECORDS);
            }
        },
        
        normalizeStatus(status) {
            status = String(status).toLowerCase();
            
            if (['running', 'online', 'up', 'healthy'].includes(status)) {
                return 'online';
            }
            if (['stopped', 'offline', 'down', 'exited', 'dead'].includes(status)) {
                return 'offline';
            }
            if (['starting', 'degraded', 'unhealthy', 'restarting'].includes(status)) {
                return 'degraded';
            }
            return 'unknown';
        },
        
        getHistory(serviceId) {
            return this.history[serviceId] || [];
        },
        
        getUptime(serviceId) {
            const records = this.getHistory(serviceId);
            if (records.length === 0) return null;
            
            const online = records.filter(r => r.status === 'online').length;
            return Math.round((online / records.length) * 100);
        },
        
        getLongestOutage(serviceId) {
            const records = this.getHistory(serviceId);
            let maxOutage = 0;
            let currentOutage = 0;
            
            for (const record of records) {
                if (record.status === 'offline') {
                    currentOutage++;
                    maxOutage = Math.max(maxOutage, currentOutage);
                } else {
                    currentOutage = 0;
                }
            }
            
            // Convert to minutes (each record = 5 minutes)
            return maxOutage * 5;
        },
        
        renderAll() {
            // Inject health bars into service cards
            document.querySelectorAll('.service-card[data-service]').forEach(card => {
                const serviceId = card.dataset.service;
                this.injectHealthBar(card, serviceId);
            });
        },
        
        injectHealthBar(card, serviceId) {
            // Check if health bar already exists
            let healthBar = card.querySelector('.health-bar');
            
            const history = this.getHistory(serviceId);
            const uptime = this.getUptime(serviceId);
            
            // Don't show if no history
            if (history.length < 2) {
                if (healthBar) healthBar.style.display = 'none';
                return;
            }
            
            if (!healthBar) {
                healthBar = document.createElement('div');
                healthBar.className = 'health-bar';
                healthBar.setAttribute('role', 'img');
                healthBar.setAttribute('aria-label', `Service uptime: ${uptime}%`);
                
                // Insert before service status dot
                const statusDot = card.querySelector('.service-status');
                if (statusDot) {
                    statusDot.parentNode.insertBefore(healthBar, statusDot);
                } else {
                    card.appendChild(healthBar);
                }
            }
            
            healthBar.style.display = '';
            
            // Render segments
            const segments = history.map((record, i) => {
                const time = new Date(record.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                return `<div class="health-segment status-${record.status}" 
                             title="${time}: ${record.status}"
                             aria-hidden="true"></div>`;
            }).join('');
            
            // Uptime class
            let uptimeClass = 'excellent';
            if (uptime < 95) uptimeClass = 'good';
            if (uptime < 80) uptimeClass = 'poor';
            
            healthBar.innerHTML = `
                <div class="health-segments">${segments}</div>
                <span class="health-uptime ${uptimeClass}">${uptime}%</span>
            `;
            
            // Click to show detail
            healthBar.style.cursor = 'pointer';
            healthBar.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showDetail(serviceId);
            };
        },
        
        showDetail(serviceId) {
            const history = this.getHistory(serviceId);
            const uptime = this.getUptime(serviceId);
            const longestOutage = this.getLongestOutage(serviceId);
            
            // Get service name from DOM
            const card = document.querySelector(`.service-card[data-service="${serviceId}"]`);
            const serviceName = card?.querySelector('h3')?.textContent || serviceId;
            
            // Remove any existing modal
            const existing = document.querySelector('.health-detail-modal-overlay');
            if (existing) existing.remove();
            
            // Uptime class
            let uptimeClass = 'excellent';
            if (uptime < 95) uptimeClass = 'good';
            if (uptime < 80) uptimeClass = 'poor';
            
            // Create modal
            const modal = document.createElement('div');
            modal.className = 'health-detail-modal-overlay';
            modal.innerHTML = `
                <div class="health-detail-modal" role="dialog" aria-labelledby="health-modal-title">
                    <div class="modal-header">
                        <h3 id="health-modal-title">${serviceName}</h3>
                        <button class="modal-close" aria-label="Close">&times;</button>
                    </div>
                    
                    <div class="health-stats">
                        <div class="health-stat">
                            <span class="stat-value ${uptimeClass}">${uptime}%</span>
                            <span class="stat-label">Uptime (24h)</span>
                        </div>
                        <div class="health-stat">
                            <span class="stat-value">${history.length}</span>
                            <span class="stat-label">Checks</span>
                        </div>
                        <div class="health-stat">
                            <span class="stat-value">${longestOutage > 0 ? longestOutage + 'm' : '-'}</span>
                            <span class="stat-label">Longest Outage</span>
                        </div>
                    </div>
                    
                    <div class="health-timeline">
                        <h4>Last 24 Hours</h4>
                        <div class="health-bar-large">
                            ${history.map((record, i) => {
                                const time = new Date(record.timestamp).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                });
                                return `<div class="health-segment-large status-${record.status}" 
                                             title="${time}: ${record.status}"></div>`;
                            }).join('')}
                        </div>
                        <div class="timeline-labels">
                            <span>24h ago</span>
                            <span>Now</span>
                        </div>
                    </div>
                    
                    <p class="health-note">
                        Status is checked every 5 minutes. History is stored locally on this device.
                    </p>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Close handlers
            const closeModal = () => modal.remove();
            modal.querySelector('.modal-close').addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });
            document.addEventListener('keydown', function handler(e) {
                if (e.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', handler);
                }
            });
            
            // Focus close button
            modal.querySelector('.modal-close').focus();
        },
        
        clearHistory(serviceId = null) {
            if (serviceId) {
                delete this.history[serviceId];
            } else {
                this.history = {};
            }
            this.saveHistory();
            this.renderAll();
        }
    };

    // Make globally accessible
    window.HealthHistory = HealthHistory;

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => HealthHistory.init());
    } else {
        HealthHistory.init();
    }

})();
