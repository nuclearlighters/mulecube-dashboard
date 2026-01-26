/**
 * MuleCube Favorites Manager
 * Allows users to pin services for quick access
 * 
 * v1.0.0 - Adapted for MuleCube Dashboard
 */

(function() {
    'use strict';

    // SVG Icons (monochrome)
    const ICONS = {
        starOutline: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        starFilled: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        drag: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>'
    };

    const FavoritesManager = {
        STORAGE_KEY: 'mulecube_favorites',
        MAX_FAVORITES: 12,
        favorites: [],
        sectionContainer: null,
        draggedItem: null,
        
        init() {
            this.loadFavorites();
            this.injectFavoriteButtons();
            this.createFavoritesSection();
            this.render();
            
            // Watch for dynamically added service cards
            this.setupMutationObserver();
        },
        
        loadFavorites() {
            try {
                const stored = localStorage.getItem(this.STORAGE_KEY);
                this.favorites = stored ? JSON.parse(stored) : [];
            } catch (e) {
                console.warn('[FavoritesManager] Error loading favorites:', e);
                this.favorites = [];
            }
        },
        
        saveFavorites() {
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.favorites));
            } catch (e) {
                console.warn('[FavoritesManager] Error saving favorites:', e);
            }
        },
        
        createFavoritesSection() {
            // Check if section already exists
            if (document.getElementById('favoritesSection')) {
                this.sectionContainer = document.getElementById('favoritesSection');
                return;
            }
            
            // Create favorites section after status banner
            const servicesSection = document.getElementById('services') || 
                                   document.querySelector('.services-section');
            if (!servicesSection) return;
            
            // Find the search wrapper to insert after
            const searchWrapper = servicesSection.querySelector('.services-filter');
            
            this.sectionContainer = document.createElement('div');
            this.sectionContainer.id = 'favoritesSection';
            this.sectionContainer.className = 'favorites-section';
            this.sectionContainer.innerHTML = `
                <h3 class="category-title">
                    <span class="favorites-icon">${ICONS.starFilled}</span>
                    Your Favorites
                </h3>
                <p class="favorites-subtitle">Tap the star on any service to add it here</p>
                <div class="favorites-grid" id="favoritesGrid"></div>
                <div class="favorites-empty" id="favoritesEmpty">
                    <span class="empty-icon">${ICONS.starOutline}</span>
                    <p>Star services to pin them here for quick access</p>
                </div>
            `;
            
            // Insert after search or at start
            if (searchWrapper && searchWrapper.nextSibling) {
                searchWrapper.parentNode.insertBefore(this.sectionContainer, searchWrapper.nextSibling);
            } else {
                servicesSection.insertBefore(this.sectionContainer, servicesSection.querySelector('.start-here'));
            }
        },
        
        injectFavoriteButtons() {
            document.querySelectorAll('.service-card[data-service]').forEach(card => {
                this.addFavoriteButton(card);
            });
        },
        
        addFavoriteButton(card) {
            // Don't add if already has button
            if (card.querySelector('.favorite-btn')) return;
            
            const serviceId = card.dataset.service;
            if (!serviceId) return;
            
            // Skip system services
            if (this.isSystemService(serviceId)) return;
            
            const isFavorited = this.favorites.includes(serviceId);
            
            const button = document.createElement('button');
            button.type = 'button';  // Explicitly set type to prevent form submission
            button.className = `favorite-btn ${isFavorited ? 'favorited' : ''}`;
            button.setAttribute('aria-label', isFavorited ? 'Remove from favorites' : 'Add to favorites');
            button.innerHTML = isFavorited ? ICONS.starFilled : ICONS.starOutline;
            
            // Handler function for both click and touch
            const handleToggle = (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.toggleFavorite(serviceId, button);
                return false;
            };
            
            // Use capture phase to ensure we catch the event first
            button.addEventListener('click', handleToggle, true);
            
            // Touch events for mobile - touchend triggers the action
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                // Small delay to ensure touch is processed
                setTimeout(() => this.toggleFavorite(serviceId, button), 10);
                return false;
            }, { capture: true, passive: false });
            
            // Prevent touchstart from bubbling to card (prevents card navigation)
            button.addEventListener('touchstart', (e) => {
                e.stopPropagation();
            }, { capture: true, passive: true });
            
            // Also prevent mousedown from triggering card actions
            button.addEventListener('mousedown', (e) => {
                e.stopPropagation();
            });
            
            card.appendChild(button);
        },
        
        isSystemService(serviceId) {
            // Check if ServiceManagerAPI knows about system services
            if (typeof ServiceManagerAPI !== 'undefined' && ServiceManagerAPI.isSystemService) {
                return ServiceManagerAPI.isSystemService(serviceId);
            }
            
            // Fallback list
            const systemServices = [
                'nginx-proxy', 'pihole', 'uptime-kuma', 'postgres', 'valkey'
            ];
            return systemServices.includes(serviceId) || 
                   serviceId.startsWith('mulecube-');
        },
        
        toggleFavorite(serviceId, button) {
            // Reload favorites in case they were modified elsewhere
            this.loadFavorites();
            
            const index = this.favorites.indexOf(serviceId);
            
            if (index > -1) {
                // Remove from favorites
                this.favorites.splice(index, 1);
                if (button) {
                    button.classList.remove('favorited');
                    button.innerHTML = ICONS.starOutline;
                    button.setAttribute('aria-label', 'Add to favorites');
                }
                this.showToast('Removed from favorites');
            } else {
                // Add to favorites
                if (this.favorites.length >= this.MAX_FAVORITES) {
                    this.showToast('Maximum favorites reached (' + this.MAX_FAVORITES + ')');
                    return;
                }
                this.favorites.push(serviceId);
                if (button) {
                    button.classList.add('favorited');
                    button.innerHTML = ICONS.starFilled;
                    button.setAttribute('aria-label', 'Remove from favorites');
                }
                this.showToast('Added to favorites');
            }
            
            this.saveFavorites();
            this.render();
            
            // Sync button state across all instances of this service card
            this.syncButtonStates(serviceId);
        },
        
        syncButtonStates(serviceId) {
            const isFavorited = this.favorites.includes(serviceId);
            document.querySelectorAll(`.service-card[data-service="${serviceId}"] .favorite-btn`).forEach(btn => {
                btn.classList.toggle('favorited', isFavorited);
                btn.innerHTML = isFavorited ? ICONS.starFilled : ICONS.starOutline;
                btn.setAttribute('aria-label', isFavorited ? 'Remove from favorites' : 'Add to favorites');
            });
        },
        
        render() {
            const grid = document.getElementById('favoritesGrid');
            const empty = document.getElementById('favoritesEmpty');
            
            if (!grid || !empty) return;
            
            if (this.favorites.length === 0) {
                grid.style.display = 'none';
                empty.style.display = 'flex';
                this.sectionContainer.classList.add('empty');
                return;
            }
            
            grid.style.display = 'grid';
            empty.style.display = 'none';
            this.sectionContainer.classList.remove('empty');
            
            // Build favorite cards by cloning from existing cards
            grid.innerHTML = '';
            
            this.favorites.forEach((serviceId, index) => {
                const originalCard = document.querySelector(`.service-card[data-service="${serviceId}"]:not(.favorite-card)`);
                
                if (!originalCard) {
                    // Service not found, skip
                    return;
                }
                
                const clone = originalCard.cloneNode(true);
                clone.classList.add('favorite-card');
                clone.setAttribute('data-favorite-index', index);
                
                // Fix status LED - force green unless service is actually offline
                const clonedStatus = clone.querySelector('.service-status');
                if (clonedStatus) {
                    // Remove ALL status modifier classes - favorites default to green (healthy)
                    clonedStatus.classList.remove('checking', 'offline', 'online', 'loading', 'warning');
                    clonedStatus.style.animation = 'none';
                    clonedStatus.style.background = '';  // Let CSS handle it (green by default)
                    
                    // Only mark offline if original is explicitly offline (red)
                    const originalStatus = originalCard.querySelector('.service-status');
                    if (originalStatus && originalStatus.classList.contains('offline')) {
                        clonedStatus.classList.add('offline');
                    }
                }
                
                // Re-attach event listener to cloned favorite button (listeners don't clone)
                const clonedBtn = clone.querySelector('.favorite-btn');
                if (clonedBtn) {
                    // Remove old (non-functional) button and create fresh one
                    clonedBtn.remove();
                }
                // Add a fresh favorite button with working event handler
                this.addFavoriteButton(clone);
                
                // Add drag handle
                const dragHandle = document.createElement('span');
                dragHandle.className = 'drag-handle';
                dragHandle.innerHTML = ICONS.drag;
                dragHandle.setAttribute('aria-label', 'Drag to reorder');
                clone.insertBefore(dragHandle, clone.firstChild);
                
                // Make draggable
                clone.setAttribute('draggable', 'true');
                this.setupDragEvents(clone);
                
                grid.appendChild(clone);
            });
        },
        
        setupDragEvents(card) {
            card.addEventListener('dragstart', (e) => {
                this.draggedItem = card;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', card.dataset.favoriteIndex);
            });
            
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                this.draggedItem = null;
                document.querySelectorAll('.favorite-card.drag-over').forEach(el => {
                    el.classList.remove('drag-over');
                });
            });
            
            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (this.draggedItem && this.draggedItem !== card) {
                    card.classList.add('drag-over');
                }
            });
            
            card.addEventListener('dragleave', () => {
                card.classList.remove('drag-over');
            });
            
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                card.classList.remove('drag-over');
                
                if (!this.draggedItem || this.draggedItem === card) return;
                
                const fromIndex = parseInt(this.draggedItem.dataset.favoriteIndex);
                const toIndex = parseInt(card.dataset.favoriteIndex);
                
                this.reorder(fromIndex, toIndex);
            });
        },
        
        reorder(fromIndex, toIndex) {
            if (fromIndex === toIndex) return;
            
            const item = this.favorites.splice(fromIndex, 1)[0];
            this.favorites.splice(toIndex, 0, item);
            
            this.saveFavorites();
            this.render();
        },
        
        add(serviceId) {
            if (this.favorites.includes(serviceId)) return;
            if (this.favorites.length >= this.MAX_FAVORITES) return;
            
            this.favorites.push(serviceId);
            this.saveFavorites();
            this.render();
            this.syncButtonStates(serviceId);
        },
        
        remove(serviceId) {
            const index = this.favorites.indexOf(serviceId);
            if (index === -1) return;
            
            this.favorites.splice(index, 1);
            this.saveFavorites();
            this.render();
            this.syncButtonStates(serviceId);
        },
        
        isFavorite(serviceId) {
            return this.favorites.includes(serviceId);
        },
        
        setupMutationObserver() {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            if (node.classList && node.classList.contains('service-card') && 
                                node.dataset.service && !node.classList.contains('favorite-card')) {
                                this.addFavoriteButton(node);
                            } else if (node.querySelectorAll) {
                                node.querySelectorAll('.service-card[data-service]:not(.favorite-card)').forEach(card => {
                                    if (!card.querySelector('.favorite-btn')) {
                                        this.addFavoriteButton(card);
                                    }
                                });
                            }
                        }
                    });
                });
            });
            
            observer.observe(document.body, { childList: true, subtree: true });
        },
        
        showToast(message) {
            // Use existing toast system if available
            if (typeof ServiceManagerAPI !== 'undefined' && ServiceManagerAPI.showToast) {
                ServiceManagerAPI.showToast(message, 'info');
                return;
            }
            
            // Fallback toast
            const existing = document.querySelector('.favorites-toast');
            if (existing) existing.remove();
            
            const toast = document.createElement('div');
            toast.className = 'favorites-toast';
            toast.textContent = message;
            document.body.appendChild(toast);
            
            requestAnimationFrame(() => toast.classList.add('visible'));
            
            setTimeout(() => {
                toast.classList.remove('visible');
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        }
    };

    // Make globally accessible
    window.FavoritesManager = FavoritesManager;

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => FavoritesManager.init());
    } else {
        FavoritesManager.init();
    }

})();
