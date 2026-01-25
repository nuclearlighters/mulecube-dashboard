/**
 * MuleCube Plain English Errors
 * Translates technical error messages to user-friendly language
 * 
 * v1.0.0 - Adapted for MuleCube Dashboard
 */

(function() {
    'use strict';

    // SVG Icons for error types
    const ICONS = {
        info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
        warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
        network: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
        memory: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="6" x="4" y="2" rx="2"/><rect width="16" height="6" x="4" y="16" rx="2"/><rect width="16" height="6" x="4" y="9" rx="2"/></svg>',
        storage: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><path d="M21 5v7"/><path d="M3 12h6"/></svg>',
        clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
    };

    const PlainEnglishErrors = {
        // Error pattern translations
        patterns: [
            // Container/Docker errors
            {
                match: /container exited|exited with code/i,
                message: 'This service has stopped',
                suggestion: 'Try restarting it from the dashboard',
                icon: 'warning'
            },
            {
                match: /container.*137|code 137|OOM|out of memory/i,
                message: 'This service ran out of memory',
                suggestion: 'Try disabling some services to free up RAM',
                icon: 'memory'
            },
            {
                match: /container.*143|code 143|SIGTERM/i,
                message: 'This service was asked to stop',
                suggestion: 'It should restart automatically',
                icon: 'info'
            },
            {
                match: /container.*1|code 1|exit 1/i,
                message: 'This service encountered an error',
                suggestion: 'Check the logs for more details',
                icon: 'error'
            },
            {
                match: /no such container|container not found/i,
                message: 'This service is not installed',
                suggestion: 'It may need to be set up first',
                icon: 'info'
            },
            {
                match: /image not found|no such image/i,
                message: 'The software for this service is missing',
                suggestion: 'Try updating MuleCube',
                icon: 'warning'
            },
            
            // Network errors
            {
                match: /ECONNREFUSED|connection refused/i,
                message: 'Cannot connect to this service',
                suggestion: 'The service may not be running',
                icon: 'network'
            },
            {
                match: /ETIMEDOUT|timeout|timed out/i,
                message: 'Connection timed out',
                suggestion: 'The service may be starting up or overloaded',
                icon: 'clock'
            },
            {
                match: /ENOTFOUND|DNS|name.*resolution/i,
                message: 'Cannot find this service',
                suggestion: 'Check that you are connected to MuleCube WiFi',
                icon: 'network'
            },
            {
                match: /network.*unreachable|no route/i,
                message: 'Network not available',
                suggestion: 'Check your WiFi connection to MuleCube',
                icon: 'network'
            },
            {
                match: /502|bad gateway/i,
                message: 'Service temporarily unavailable',
                suggestion: 'Wait a moment and try again',
                icon: 'warning'
            },
            {
                match: /503|service unavailable/i,
                message: 'Service is busy or starting up',
                suggestion: 'Give it a few seconds',
                icon: 'clock'
            },
            {
                match: /504|gateway timeout/i,
                message: 'Request took too long',
                suggestion: 'The service may be processing a heavy task',
                icon: 'clock'
            },
            {
                match: /fetch failed|failed to fetch/i,
                message: 'Could not load data',
                suggestion: 'Check your connection and try again',
                icon: 'network'
            },
            
            // Storage errors
            {
                match: /ENOSPC|no space|disk full/i,
                message: 'Storage is full',
                suggestion: 'Free up some space on MuleCube',
                icon: 'storage'
            },
            {
                match: /EROFS|read-?only/i,
                message: 'Cannot save changes',
                suggestion: 'Storage may be in read-only mode',
                icon: 'storage'
            },
            {
                match: /ENOENT|file not found|no such file/i,
                message: 'File not found',
                suggestion: 'The file may have been moved or deleted',
                icon: 'info'
            },
            {
                match: /EACCES|permission denied/i,
                message: 'Access denied',
                suggestion: 'You may not have permission for this action',
                icon: 'error'
            },
            
            // Database errors
            {
                match: /database.*locked|sqlite.*locked/i,
                message: 'Database is busy',
                suggestion: 'Wait a moment and try again',
                icon: 'clock'
            },
            {
                match: /database.*corrupt/i,
                message: 'Database error',
                suggestion: 'Contact support if this persists',
                icon: 'error'
            },
            
            // General errors
            {
                match: /500|internal.*error/i,
                message: 'Something went wrong',
                suggestion: 'Try again or check the logs',
                icon: 'error'
            },
            {
                match: /401|unauthorized/i,
                message: 'Login required',
                suggestion: 'You may need to sign in',
                icon: 'info'
            },
            {
                match: /403|forbidden/i,
                message: 'Access not allowed',
                suggestion: 'You may not have permission',
                icon: 'error'
            },
            {
                match: /404|not found/i,
                message: 'Page not found',
                suggestion: 'The page may have moved',
                icon: 'info'
            },
            {
                match: /rate.*limit|too many requests/i,
                message: 'Too many requests',
                suggestion: 'Please wait before trying again',
                icon: 'clock'
            }
        ],
        
        /**
         * Translate technical error to plain English
         * @param {string|Error} error - Error message or Error object
         * @returns {object} { message, suggestion, icon }
         */
        translate(error) {
            const errorText = typeof error === 'string' ? error : (error?.message || String(error));
            
            for (const pattern of this.patterns) {
                if (pattern.match.test(errorText)) {
                    return {
                        message: pattern.message,
                        suggestion: pattern.suggestion,
                        icon: ICONS[pattern.icon] || ICONS.warning,
                        iconType: pattern.icon,
                        original: errorText
                    };
                }
            }
            
            // Default fallback
            return {
                message: 'An error occurred',
                suggestion: 'Try again or check the system status',
                icon: ICONS.warning,
                iconType: 'warning',
                original: errorText
            };
        },
        
        /**
         * Create error display element
         * @param {string|Error} error - Error to display
         * @param {object} options - Display options
         * @returns {HTMLElement}
         */
        createDisplay(error, options = {}) {
            const translated = this.translate(error);
            const { compact = false, showOriginal = false } = options;
            
            const el = document.createElement('div');
            el.className = `plain-error ${translated.iconType} ${compact ? 'compact' : ''}`;
            
            if (compact) {
                el.innerHTML = `
                    <span class="error-icon">${translated.icon}</span>
                    <span class="error-message">${translated.message}</span>
                `;
            } else {
                el.innerHTML = `
                    <div class="error-header">
                        <span class="error-icon">${translated.icon}</span>
                        <span class="error-message">${translated.message}</span>
                    </div>
                    <p class="error-suggestion">${translated.suggestion}</p>
                    ${showOriginal ? `
                        <details class="error-technical">
                            <summary>Technical details</summary>
                            <code>${this.escapeHtml(translated.original)}</code>
                        </details>
                    ` : ''}
                `;
            }
            
            return el;
        },
        
        /**
         * Show error toast with plain English
         * @param {string|Error} error - Error to show
         */
        showToast(error) {
            const translated = this.translate(error);
            
            // Use existing toast system if available
            if (typeof ServiceManagerAPI !== 'undefined' && ServiceManagerAPI.showToast) {
                ServiceManagerAPI.showToast(translated.message, 'error');
                return;
            }
            
            // Fallback toast
            const existing = document.querySelector('.plain-error-toast');
            if (existing) existing.remove();
            
            const toast = document.createElement('div');
            toast.className = 'plain-error-toast';
            toast.innerHTML = `
                <span class="toast-icon">${translated.icon}</span>
                <div class="toast-content">
                    <span class="toast-message">${translated.message}</span>
                    <span class="toast-suggestion">${translated.suggestion}</span>
                </div>
                <button class="toast-close" aria-label="Dismiss">&times;</button>
            `;
            
            toast.querySelector('.toast-close').addEventListener('click', () => {
                toast.classList.remove('visible');
                setTimeout(() => toast.remove(), 300);
            });
            
            document.body.appendChild(toast);
            requestAnimationFrame(() => toast.classList.add('visible'));
            
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.classList.remove('visible');
                    setTimeout(() => toast.remove(), 300);
                }
            }, 5000);
        },
        
        /**
         * Auto-enhance error elements on page
         */
        enhanceErrors() {
            document.querySelectorAll('.error, .error-message, [data-error]').forEach(el => {
                if (el.dataset.enhanced) return;
                
                const errorText = el.textContent || el.dataset.error;
                if (!errorText) return;
                
                const translated = this.translate(errorText);
                
                // Only enhance if we have a better message
                if (translated.message !== 'An error occurred') {
                    el.innerHTML = `
                        <span class="error-icon">${translated.icon}</span>
                        <span>${translated.message}</span>
                    `;
                    el.dataset.enhanced = 'true';
                    el.title = translated.suggestion;
                }
            });
        },
        
        /**
         * Setup mutation observer to auto-enhance new errors
         */
        setupObserver() {
            const observer = new MutationObserver((mutations) => {
                let hasNewErrors = false;
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            if (node.classList && 
                                (node.classList.contains('error') || node.classList.contains('error-message'))) {
                                hasNewErrors = true;
                            } else if (node.querySelectorAll) {
                                if (node.querySelectorAll('.error, .error-message').length > 0) {
                                    hasNewErrors = true;
                                }
                            }
                        }
                    });
                });
                
                if (hasNewErrors) {
                    // Debounce enhancement
                    clearTimeout(this.enhanceTimeout);
                    this.enhanceTimeout = setTimeout(() => this.enhanceErrors(), 100);
                }
            });
            
            observer.observe(document.body, { childList: true, subtree: true });
        },
        
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        init() {
            this.enhanceErrors();
            this.setupObserver();
        }
    };

    // Make globally accessible
    window.PlainEnglishErrors = PlainEnglishErrors;

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => PlainEnglishErrors.init());
    } else {
        PlainEnglishErrors.init();
    }

})();
