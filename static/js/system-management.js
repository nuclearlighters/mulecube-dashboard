/**
 * MuleCube System Management
 * Comprehensive GUI for the Service Manager API
 * v1.0.0
 * 
 * Panels: System Info, Network, Storage, Logs, Firewall, Backup, Processes
 */

(function() {
    'use strict';

    // ==========================================
    // Configuration
    // ==========================================
    const CONFIG = {
        apiBase: '/api',
        serviceManagerBase: 'http://servicemanager.mulecube.net',
        pollInterval: 5000,
        logRefreshInterval: 3000,
        maxLogLines: 500
    };
    // Check for demo mode
    const demoMeta = document.querySelector('meta[name="mulecube-mode"]');
    const IS_DEMO = demoMeta && demoMeta.content === 'demo';
    
    // Mock data for demo mode
    const MOCK_POWER_DATA = {
        battery: {
            voltage: 4.12 + Math.random() * 0.08,
            capacity: 75 + Math.random() * 20,
            voltage_raw: 52000 + Math.floor(Math.random() * 2000),
            capacity_raw: 20000 + Math.floor(Math.random() * 5000),
            status: 'good',
            health: 'good'
        },
        ac_power: {
            connected: true,
            status: 'ok'
        },
        charging: {
            enabled: true,
            active: true,
            status: 'charging'
        },
        ups_model: 'X1202',
        i2c_connected: true,
        estimated_runtime_minutes: null,
        timestamp: new Date().toISOString()
    };

    // Generate mock data functions for demo mode
    function generateMockOverview() {
        const uptime = 1080000 + Math.floor(Math.random() * 100000); // ~12 days
        const cpuPercent = 8 + Math.random() * 20;
        const memPercent = 50 + Math.random() * 15;
        const memTotal = 8 * 1024 * 1024 * 1024; // 8GB
        const memUsed = memTotal * (memPercent / 100);
        const temp = 48 + Math.random() * 15;
        
        return {
            hostname: 'mulecube-demo',
            model: 'Raspberry Pi 5 Model B Rev 1.0',
            serial: 'd83add36e17847c9',
            uptime_seconds: uptime,
            boot_time: new Date(Date.now() - uptime * 1000).toISOString(),
            cpu: {
                percent: cpuPercent,
                count: 4,
                freq_current: 1500 + Math.random() * 900,
                freq_max: 2400
            },
            memory: {
                percent: memPercent,
                total: memTotal,
                available: memTotal - memUsed,
                used: memUsed
            },
            temperature: {
                current: temp
            }
        };
    }

    function generateMockNetwork() {
        const deviceNames = ['iPhone-Sarah', 'MacBook-Pro', 'iPad-Kids', 'Android-Phone', 'Laptop-Work'];
        const numClients = 2 + Math.floor(Math.random() * 4);
        const clients = [];
        
        for (let i = 0; i < numClients; i++) {
            clients.push({
                mac_address: `${['AA','BB','CC','DD','EE','FF'][Math.floor(Math.random()*6)]}:${Math.floor(Math.random()*100).toString(16).padStart(2,'0')}:${Math.floor(Math.random()*100).toString(16).padStart(2,'0')}:${Math.floor(Math.random()*100).toString(16).padStart(2,'0')}:${Math.floor(Math.random()*100).toString(16).padStart(2,'0')}:${Math.floor(Math.random()*100).toString(16).padStart(2,'0')}`.toUpperCase(),
                ip_address: `192.168.42.${100 + i + Math.floor(Math.random() * 50)}`,
                hostname: deviceNames[i] || `device-${i}`,
                connected_since: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString()
            });
        }
        
        return {
            clients: clients,
            total_count: clients.length,
            interfaces: [
                {
                    name: 'wlan0',
                    type: 'wireless',
                    state: 'up',
                    mac: 'DC:A6:32:XX:XX:XX',
                    ipv4: '192.168.42.1',
                    ipv6: 'fe80::dea6:32ff:fexx:xxxx'
                },
                {
                    name: 'eth0',
                    type: 'ethernet',
                    state: Math.random() > 0.3 ? 'up' : 'down',
                    mac: 'DC:A6:32:YY:YY:YY',
                    ipv4: Math.random() > 0.3 ? '192.168.1.150' : null,
                    ipv6: null
                }
            ]
        };
    }

    function generateMockStorage() {
        const diskUsed = 180 + Math.random() * 60; // 180-240 GB
        const diskTotal = 256;
        
        return {
            disks: [{
                device: '/dev/mmcblk0p2',
                mountpoint: '/',
                fstype: 'ext4',
                total_bytes: diskTotal * 1024 * 1024 * 1024,
                used_bytes: diskUsed * 1024 * 1024 * 1024,
                free_bytes: (diskTotal - diskUsed) * 1024 * 1024 * 1024,
                percent_used: (diskUsed / diskTotal) * 100,
                total_human: `${diskTotal.toFixed(1)} GB`,
                used_human: `${diskUsed.toFixed(1)} GB`,
                free_human: `${(diskTotal - diskUsed).toFixed(1)} GB`
            }],
            volumes: [
                { name: 'kiwix_data', size: '45.2 GB', created: '2025-12-15' },
                { name: 'ollama_models', size: '12.8 GB', created: '2025-12-20' },
                { name: 'syncthing_data', size: '8.4 GB', created: '2025-12-18' },
                { name: 'pihole_config', size: '156 MB', created: '2025-12-10' },
                { name: 'vaultwarden_data', size: '24 MB', created: '2025-12-12' }
            ]
        };
    }

    function generateMockProcesses() {
        const processes = [
            { pid: 1, name: 'systemd', user: 'root', cpu: 0.1, memory: 0.8, status: 'S' },
            { pid: 892, name: 'dockerd', user: 'root', cpu: 2.3 + Math.random() * 2, memory: 3.2, status: 'S' },
            { pid: 1024, name: 'containerd', user: 'root', cpu: 1.1 + Math.random(), memory: 2.1, status: 'S' },
            { pid: 1156, name: 'nginx', user: 'www-data', cpu: 0.5 + Math.random() * 0.5, memory: 1.2, status: 'S' },
            { pid: 1289, name: 'pihole-FTL', user: 'pihole', cpu: 1.8 + Math.random(), memory: 2.8, status: 'S' },
            { pid: 1423, name: 'ollama', user: 'ollama', cpu: 5.2 + Math.random() * 10, memory: 8.5, status: 'S' },
            { pid: 1567, name: 'python3', user: 'root', cpu: 0.8 + Math.random(), memory: 1.5, status: 'S' },
            { pid: 1678, name: 'node', user: 'node', cpu: 2.1 + Math.random() * 2, memory: 4.2, status: 'S' },
            { pid: 1789, name: 'postgres', user: 'postgres', cpu: 1.2 + Math.random(), memory: 3.8, status: 'S' },
            { pid: 1890, name: 'redis-server', user: 'redis', cpu: 0.3 + Math.random() * 0.3, memory: 0.9, status: 'S' },
            { pid: 2001, name: 'kiwix-serve', user: 'kiwix', cpu: 0.2 + Math.random() * 0.5, memory: 2.1, status: 'S' },
            { pid: 2112, name: 'tileserver-gl', user: 'tileserver', cpu: 0.4 + Math.random() * 0.5, memory: 3.5, status: 'S' },
            { pid: 2223, name: 'uptime-kuma', user: 'node', cpu: 0.6 + Math.random() * 0.4, memory: 1.8, status: 'S' },
            { pid: 2334, name: 'dozzle', user: 'root', cpu: 0.2, memory: 0.5, status: 'S' },
            { pid: 2445, name: 'syncthing', user: 'syncthing', cpu: 1.5 + Math.random() * 2, memory: 2.4, status: 'S' }
        ];
        return processes;
    }

    function generateMockLogs() {
        const services = ['nginx', 'dockerd', 'pihole', 'systemd', 'kernel', 'ollama', 'syncthing'];
        const levels = ['info', 'info', 'info', 'info', 'warn', 'error'];
        const messages = [
            'Request completed successfully',
            'Connection established from 192.168.42.{n}',
            'Container started: {service}',
            'Health check passed',
            'DNS query blocked: tracking.example.com',
            'Model loaded successfully',
            'Sync completed with 0 conflicts',
            'Certificate renewed for mulecube.net',
            'Backup completed: 156 files',
            'Service restarted after config change',
            'Memory usage at {n}%',
            'CPU temperature: {n}°C',
            'New device connected: {mac}',
            'API request from 192.168.42.{n}',
            'Cache cleared successfully'
        ];
        
        const logs = [];
        const now = Date.now();
        
        for (let i = 0; i < 100; i++) {
            const timestamp = new Date(now - i * 30000 - Math.random() * 10000);
            const service = services[Math.floor(Math.random() * services.length)];
            const level = levels[Math.floor(Math.random() * levels.length)];
            let msg = messages[Math.floor(Math.random() * messages.length)]
                .replace('{n}', Math.floor(Math.random() * 100 + 100))
                .replace('{service}', service)
                .replace('{mac}', 'AA:BB:CC:DD:EE:FF');
            
            logs.push({
                timestamp: timestamp.toISOString(),
                service: service,
                level: level,
                message: `[${service}] ${msg}`,
                formatted: `${timestamp.toLocaleTimeString()} ${level.toUpperCase().padEnd(5)} ${service.padEnd(12)} ${msg}`
            });
        }
        return logs;
    }

    function generateMockFirewall() {
        return {
            ip_forwarding: true,
            nat_enabled: true,
            rules: [
                { chain: 'INPUT', action: 'ACCEPT', protocol: 'tcp', source: 'any', destination: 'any', port: '22', comment: 'SSH' },
                { chain: 'INPUT', action: 'ACCEPT', protocol: 'tcp', source: 'any', destination: 'any', port: '80', comment: 'HTTP' },
                { chain: 'INPUT', action: 'ACCEPT', protocol: 'tcp', source: 'any', destination: 'any', port: '443', comment: 'HTTPS' },
                { chain: 'INPUT', action: 'ACCEPT', protocol: 'udp', source: 'any', destination: 'any', port: '53', comment: 'DNS' },
                { chain: 'INPUT', action: 'ACCEPT', protocol: 'udp', source: 'any', destination: 'any', port: '67', comment: 'DHCP' },
                { chain: 'FORWARD', action: 'ACCEPT', protocol: 'all', source: '192.168.42.0/24', destination: 'any', port: '*', comment: 'LAN Forward' },
                { chain: 'POSTROUTING', action: 'MASQUERADE', protocol: 'all', source: '192.168.42.0/24', destination: 'any', port: '*', comment: 'NAT' },
                { chain: 'INPUT', action: 'DROP', protocol: 'all', source: 'any', destination: 'any', port: '*', comment: 'Default Drop' }
            ]
        };
    }

    function generateMockBackups() {
        return {
            backups: [
                { filename: 'mulecube-backup-2026-01-20-config.tar.gz', size: '2.4 MB', created: '2026-01-20 14:30:00', type: 'config' },
                { filename: 'mulecube-backup-2026-01-15-full.tar.gz', size: '45.8 MB', created: '2026-01-15 03:00:00', type: 'full' },
                { filename: 'mulecube-backup-2026-01-10-config.tar.gz', size: '2.3 MB', created: '2026-01-10 14:30:00', type: 'config' }
            ]
        };
    }

    function generateMockContainers() {
        const containers = [
            { name: 'kiwix', id: 'abc123', image: 'ghcr.io/kiwix/kiwix-serve:latest', status: 'Up 12 days', state: 'running' },
            { name: 'ollama', id: 'def456', image: 'ollama/ollama:latest', status: 'Up 12 days', state: 'running' },
            { name: 'open-webui', id: 'ghi789', image: 'ghcr.io/open-webui/open-webui:main', status: 'Up 12 days', state: 'running' },
            { name: 'pihole', id: 'jkl012', image: 'pihole/pihole:latest', status: 'Up 12 days (healthy)', state: 'running' },
            { name: 'nginx-proxy', id: 'mno345', image: 'nginx:alpine', status: 'Up 12 days', state: 'running' },
            { name: 'uptime-kuma', id: 'pqr678', image: 'louislam/uptime-kuma:latest', status: 'Up 12 days (healthy)', state: 'running' },
            { name: 'syncthing', id: 'stu901', image: 'syncthing/syncthing:latest', status: 'Up 12 days (healthy)', state: 'running' },
            { name: 'tileserver', id: 'vwx234', image: 'maptiler/tileserver-gl:latest', status: 'Up 12 days (healthy)', state: 'running' },
            { name: 'filebrowser', id: 'yza567', image: 'filebrowser/filebrowser:latest', status: 'Up 12 days (healthy)', state: 'running' },
            { name: 'vaultwarden', id: 'bcd890', image: 'vaultwarden/server:latest', status: 'Up 12 days (healthy)', state: 'running' }
        ];
        return { containers, count: containers.length };
    }



    // ==========================================
    // SVG Icons (inline for reliability)
    // ==========================================
    const ICONS = {
        system: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
        cpu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
        memory: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="10" y1="10" x2="10" y2="14"/><line x1="14" y1="10" x2="14" y2="14"/><line x1="18" y1="10" x2="18" y2="14"/></svg>',
        temp: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>',
        network: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
        storage: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
        logs: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
        firewall: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
        backup: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
        process: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
        clients: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
        power: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>',
        battery: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>',
        refresh: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
        close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        chevronDown: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
        warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
        download: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
        upload: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
        terminal: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
        settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
        play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>',
        stop: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>',
        lock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
    };

    // ==========================================
    // Utility Functions
    // ==========================================
    function formatBytes(bytes, decimals = 1) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
    }

    function formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        
        if (days > 0) return `${days}d ${hours}h ${mins}m`;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    }

    function formatDateTime(isoString) {
        if (!isoString) return 'Never';
        const date = new Date(isoString);
        return date.toLocaleString();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async function apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`${CONFIG.serviceManagerBase}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`API call failed: ${endpoint}`, error);
            throw error;
        }
    }

    // ==========================================
    // System Management Panel
    // ==========================================
    const SystemManagementPanel = {
        container: null,
        isOpen: false,
        activeTab: 'overview',
        refreshIntervals: {},
        
        init() {
            this.injectPanelHTML();
            this.setupEventListeners();
            this.addNavigationButton();
            console.log('SystemManagementPanel: Initialized');
        },
        
        addNavigationButton() {
            // Place "System" button in the stats control bar (next to reboot/shutdown)
            const statsControls = document.getElementById('statsControlsGroup');
            
            const btn = document.createElement('button');
            btn.className = 'power-btn system-btn';
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> System`;
            btn.onclick = () => this.toggle();
            btn.title = 'System Management (Ctrl+Shift+S)';
            btn.id = 'systemManagementBtn';
            
            if (statsControls) {
                // Insert at the beginning of the controls group (before Reboot)
                statsControls.insertBefore(btn, statsControls.firstChild);
                console.log('SystemManagementPanel: Button placed in stats controls bar');
            } else {
                // Fallback: try the status banner
                const statusBanner = document.getElementById('statusBanner');
                if (statusBanner) {
                    btn.className = 'system-panel-trigger top-bar-btn';
                    statusBanner.insertBefore(btn, statusBanner.firstChild);
                    console.log('SystemManagementPanel: Button placed in status banner (fallback)');
                }
            }
        },
        
        injectPanelHTML() {
            const panel = document.createElement('div');
            panel.id = 'systemManagementPanel';
            panel.className = 'system-panel-overlay';
            panel.innerHTML = `
                <div class="system-panel">
                    <div class="system-panel-header">
                        <div class="panel-title">
                            ${ICONS.settings}
                            <h2>System Management</h2>
                        </div>
                        <div class="panel-actions">
                            <button class="panel-refresh-btn" onclick="SystemManagementPanel.refreshCurrentTab()" title="Refresh">
                                ${ICONS.refresh}
                            </button>
                            <button class="panel-close-btn" onclick="SystemManagementPanel.close()" title="Close (Esc)">
                                ${ICONS.close}
                            </button>
                        </div>
                    </div>
                    
                    <div class="system-panel-tabs">
                        <button class="tab-btn active" data-tab="overview">${ICONS.system} Overview</button>
                        <button class="tab-btn" data-tab="services">${ICONS.settings} Services</button>
                        <button class="tab-btn" data-tab="network">${ICONS.network} Network</button>
                        <button class="tab-btn" data-tab="storage">${ICONS.storage} Storage</button>
                        <button class="tab-btn" data-tab="processes">${ICONS.process} Processes</button>
                        <button class="tab-btn" data-tab="logs">${ICONS.logs} Logs</button>
                        <button class="tab-btn" data-tab="firewall">${ICONS.firewall} Firewall</button>
                        <button class="tab-btn" data-tab="backup">${ICONS.backup} Backup</button>
                        <button class="tab-btn" data-tab="power">${ICONS.battery} Power</button>
                    </div>
                    
                    <div class="system-panel-body" id="systemPanelBody">
                        <div class="panel-loading">
                            <div class="loading-spinner"></div>
                            <span>Loading...</span>
                        </div>
                    </div>
                    
                    <div class="system-panel-footer">
                        <span class="panel-hint">Press <kbd>Ctrl+Shift+S</kbd> to toggle</span>
                        <div class="panel-footer-right">
                            <a href="http://servicemanager.mulecube.net/docs" target="_blank" class="footer-link">API Docs</a>
                            <span class="panel-version">Service Manager v1.0.0</span>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(panel);
            this.container = panel;
        },
        
        setupEventListeners() {
            // Close on overlay click
            this.container.addEventListener('click', (e) => {
                if (e.target === this.container) {
                    this.close();
                }
            });
            
            // Tab switching
            this.container.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.switchTab(btn.dataset.tab);
                });
            });
            
            // Keyboard shortcut
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                    e.preventDefault();
                    this.toggle();
                }
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        },
        
        toggle() {
            if (this.isOpen) {
                this.close();
            } else {
                this.open();
            }
        },
        
        async open() {
            this.container.classList.add('open');
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            await this.loadTab(this.activeTab);
        },
        
        close() {
            this.container.classList.remove('open');
            this.isOpen = false;
            document.body.style.overflow = '';
            this.stopAllRefresh();
        },
        
        switchTab(tabName) {
            this.stopAllRefresh();
            this.activeTab = tabName;
            
            // Update tab buttons
            this.container.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tabName);
            });
            
            this.loadTab(tabName);
        },
        
        async loadTab(tabName) {
            const body = document.getElementById('systemPanelBody');
            body.innerHTML = '<div class="panel-loading"><div class="loading-spinner"></div><span>Loading...</span></div>';
            
            try {
                switch (tabName) {
                    case 'overview':
                        await this.loadOverviewTab(body);
                        break;
                    case 'services':
                        await this.loadServicesTab(body);
                        break;
                    case 'network':
                        await this.loadNetworkTab(body);
                        break;
                    case 'storage':
                        await this.loadStorageTab(body);
                        break;
                    case 'processes':
                        await this.loadProcessesTab(body);
                        break;
                    case 'logs':
                        await this.loadLogsTab(body);
                        break;
                    case 'firewall':
                        await this.loadFirewallTab(body);
                        break;
                    case 'backup':
                        await this.loadBackupTab(body);
                        break;
                    case 'power':
                        await this.loadPowerTab(body);
                        break;
                    default:
                        body.innerHTML = '<div class="panel-error">Unknown tab</div>';
                }
            } catch (error) {
                body.innerHTML = `
                    <div class="panel-error">
                        ${ICONS.warning}
                        <p>Failed to load data</p>
                        <small>${error.message}</small>
                        <button class="btn btn-secondary" onclick="SystemManagementPanel.loadTab('${tabName}')">Retry</button>
                    </div>
                `;
            }
        },
        
        refreshCurrentTab() {
            this.loadTab(this.activeTab);
        },
        
        stopAllRefresh() {
            Object.values(this.refreshIntervals).forEach(id => clearInterval(id));
            this.refreshIntervals = {};
        },

        // ==========================================
        // Overview Tab
        // ==========================================
        async loadOverviewTab(container) {
            let info, stats;
            
            if (IS_DEMO) {
                const mockData = generateMockOverview();
                info = {
                    hostname: mockData.hostname,
                    pi_model: mockData.model,
                    pi_serial: mockData.serial,
                    uptime_seconds: mockData.uptime_seconds,
                    boot_time: mockData.boot_time
                };
                stats = {
                    cpu: {
                        percent: mockData.cpu.percent,
                        count: mockData.cpu.count,
                        frequency_current: mockData.cpu.freq_current,
                        frequency_max: mockData.cpu.freq_max
                    },
                    memory: {
                        percent: mockData.memory.percent,
                        total_bytes: mockData.memory.total,
                        used_bytes: mockData.memory.used,
                        available_bytes: mockData.memory.available
                    },
                    temperature: {
                        cpu_temp_c: mockData.temperature.current
                    }
                };
            } else {
                [info, stats] = await Promise.all([
                    apiCall('/api/system/info'),
                    apiCall('/api/system/stats')
                ]);
            }
            
            // Extract values using EXACT field names from API
            const cpuPercent = stats.cpu?.percent || 0;
            const cpuCores = stats.cpu?.count || stats.cpu?.count_logical || 4;
            const cpuFreqCurrent = stats.cpu?.frequency_current || 0;  // in MHz
            const cpuFreqMax = stats.cpu?.frequency_max || 0;  // in MHz
            
            const memPercent = stats.memory?.percent || 0;
            const memUsedBytes = stats.memory?.used_bytes || 0;
            const memTotalBytes = stats.memory?.total_bytes || 0;
            const memAvailBytes = stats.memory?.available_bytes || 0;
            
            const temp = stats.temperature?.cpu_temp_c || 0;
            const tempStatus = temp > 80 ? 'danger' : temp > 70 ? 'warning' : 'normal';
            
            container.innerHTML = `
                <div class="overview-grid">
                    <!-- System Info Card -->
                    <div class="info-card">
                        <div class="card-header">
                            ${ICONS.system}
                            <h3>System Information</h3>
                        </div>
                        <div class="card-body">
                            <div class="info-row">
                                <span class="info-label">Hostname</span>
                                <span class="info-value">${escapeHtml(info.hostname || 'Unknown')}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Model</span>
                                <span class="info-value">${escapeHtml(info.pi_model || 'Raspberry Pi')}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Serial</span>
                                <span class="info-value mono">${escapeHtml(info.pi_serial || 'N/A')}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Uptime</span>
                                <span class="info-value">${info.uptime_human || formatUptime(info.uptime_seconds || 0)}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Boot Time</span>
                                <span class="info-value">${formatDateTime(info.boot_time)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- CPU Stats Card -->
                    <div class="info-card">
                        <div class="card-header">
                            ${ICONS.cpu}
                            <h3>CPU</h3>
                            <span class="card-value">${cpuPercent.toFixed(1)}%</span>
                        </div>
                        <div class="card-body">
                            <div class="progress-bar-container">
                                <div class="progress-bar" style="width: ${cpuPercent}%"></div>
                            </div>
                            <div class="stats-row">
                                <div class="stat-item">
                                    <span class="stat-label">Cores</span>
                                    <span class="stat-value">${cpuCores}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Frequency</span>
                                    <span class="stat-value">${(cpuFreqCurrent / 1000).toFixed(1)} GHz</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Max Freq</span>
                                    <span class="stat-value">${(cpuFreqMax / 1000).toFixed(1)} GHz</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Memory Stats Card -->
                    <div class="info-card">
                        <div class="card-header">
                            ${ICONS.memory}
                            <h3>Memory</h3>
                            <span class="card-value">${memPercent.toFixed(1)}%</span>
                        </div>
                        <div class="card-body">
                            <div class="progress-bar-container">
                                <div class="progress-bar ${memPercent > 90 ? 'danger' : memPercent > 75 ? 'warning' : ''}" style="width: ${memPercent}%"></div>
                            </div>
                            <div class="stats-row">
                                <div class="stat-item">
                                    <span class="stat-label">Used</span>
                                    <span class="stat-value">${formatBytes(memUsedBytes)}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Total</span>
                                    <span class="stat-value">${formatBytes(memTotalBytes)}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Available</span>
                                    <span class="stat-value">${formatBytes(memAvailBytes)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Temperature Card -->
                    <div class="info-card">
                        <div class="card-header">
                            ${ICONS.temp}
                            <h3>Temperature</h3>
                            <span class="card-value ${tempStatus}">${temp.toFixed(1)}°C</span>
                        </div>
                        <div class="card-body">
                            <div class="temp-gauge">
                                <div class="temp-bar ${tempStatus}" style="width: ${Math.min(temp, 100)}%"></div>
                                <div class="temp-markers">
                                    <span>0°C</span>
                                    <span>50°C</span>
                                    <span>85°C</span>
                                </div>
                            </div>
                            <div class="temp-status ${tempStatus}">
                                ${temp > 80 ? 'Throttling may occur' : temp > 70 ? 'Running warm' : 'Normal operating temperature'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Auto-refresh stats - only if still on overview tab
            if (!this.refreshIntervals.overview) {
                this.refreshIntervals.overview = setInterval(async () => {
                    if (this.activeTab !== 'overview' || !this.isOpen) return;
                    try {
                        const newStats = await apiCall('/api/system/stats');
                        this.updateOverviewStats(newStats);
                    } catch (e) {
                        console.warn('Stats refresh failed:', e);
                    }
                }, CONFIG.pollInterval);
            }
        },
        
        updateOverviewStats(stats) {
            // Guard against running on wrong tab
            if (this.activeTab !== 'overview') return;
            
            // Update CPU - using exact API field names
            const cpuPercent = stats.cpu?.percent || 0;
            const cpuCard = document.querySelector('.overview-grid .info-card:nth-child(2)');
            if (cpuCard) {
                const valueEl = cpuCard.querySelector('.card-value');
                const barEl = cpuCard.querySelector('.progress-bar');
                if (valueEl) valueEl.textContent = `${cpuPercent.toFixed(1)}%`;
                if (barEl) barEl.style.width = `${cpuPercent}%`;
            }
            
            // Update Memory - using exact API field names
            const memPercent = stats.memory?.percent || 0;
            const memCard = document.querySelector('.overview-grid .info-card:nth-child(3)');
            if (memCard) {
                const valueEl = memCard.querySelector('.card-value');
                const barEl = memCard.querySelector('.progress-bar');
                if (valueEl) valueEl.textContent = `${memPercent.toFixed(1)}%`;
                if (barEl) barEl.style.width = `${memPercent}%`;
            }
            
            // Update Temperature - using exact API field names
            const temp = stats.temperature?.cpu_temp_c || 0;
            const tempCard = document.querySelector('.overview-grid .info-card:nth-child(4)');
            if (tempCard) {
                const tempStatus = temp > 80 ? 'danger' : temp > 70 ? 'warning' : 'normal';
                const valueEl = tempCard.querySelector('.card-value');
                if (valueEl) {
                    valueEl.textContent = `${temp.toFixed(1)}°C`;
                    valueEl.className = `card-value ${tempStatus}`;
                }
            }
        },
        
        confirmReboot() {
            // Use the existing modal from header.html
            const modal = document.getElementById('powerModal');
            const modalTitle = document.getElementById('powerModalTitle');
            const modalMessage = document.getElementById('powerModalMessage');
            const modalConfirm = document.getElementById('powerModalConfirm');
            
            if (modal && modalTitle && modalMessage && modalConfirm) {
                modalTitle.textContent = 'Reboot MuleCube?';
                modalMessage.textContent = 'System will restart in 1 minute. Services will be briefly unavailable.';
                modalConfirm.className = 'modal-btn confirm-btn reboot';
                modalConfirm.onclick = () => {
                    window.location.href = '/reboot.html?action=reboot&trigger=true';
                };
                modal.style.display = 'flex';
            } else {
                // Fallback: navigate directly
                if (confirm('Are you sure you want to reboot?')) {
                    window.location.href = '/reboot.html?action=reboot&trigger=true';
                }
            }
        },
        
        confirmShutdown() {
            // Use the existing modal from header.html
            const modal = document.getElementById('powerModal');
            const modalTitle = document.getElementById('powerModalTitle');
            const modalMessage = document.getElementById('powerModalMessage');
            const modalConfirm = document.getElementById('powerModalConfirm');
            
            if (modal && modalTitle && modalMessage && modalConfirm) {
                modalTitle.textContent = '⏻ Shut Down MuleCube?';
                modalMessage.textContent = 'System will power off in 1 minute. Physical access needed to restart!';
                modalConfirm.className = 'modal-btn confirm-btn';
                modalConfirm.onclick = () => {
                    window.location.href = '/reboot.html?action=shutdown&trigger=true';
                };
                modal.style.display = 'flex';
            } else {
                // Fallback: navigate directly
                if (confirm('Are you sure you want to shutdown?')) {
                    window.location.href = '/reboot.html?action=shutdown&trigger=true';
                }
            }
        },
        
        // Keep these for compatibility but they're no longer called directly
        async executeReboot() {
            window.location.href = '/reboot.html?action=reboot&trigger=true';
        },
        
        async executeShutdown() {
            window.location.href = '/reboot.html?action=shutdown&trigger=true';
        },

        // ==========================================
        // Services Tab
        // ==========================================
        async loadServicesTab(container) {
            // Fetch services data
            let services = [];
            if (IS_DEMO) {
                // In demo mode, try to get from ServiceManagerModal or generate mock data
                if (typeof ServiceManagerModal !== 'undefined' && ServiceManagerModal.services) {
                    services = ServiceManagerModal.services;
                }
            } else {
                try {
                    const response = await fetch(`${API_BASE}/api/services`);
                    if (response.ok) {
                        const data = await response.json();
                        // API returns { services: [...], categories: [...] }
                        services = data.services || data || [];
                    }
                } catch (e) {
                    console.warn('Failed to fetch services:', e);
                }
            }
            
            // Group services by category
            const userServices = services.filter(s => !this.isSystemService(s.name));
            const systemServices = services.filter(s => this.isSystemService(s.name));
            const running = services.filter(s => s.status === 'running').length;
            const stopped = services.filter(s => s.status !== 'running').length;
            
            container.innerHTML = `
                <div class="tab-content services-tab">
                    <div class="services-header">
                        <div class="services-summary">
                            <div class="summary-stat">
                                <span class="stat-value">${services.length}</span>
                                <span class="stat-label">Total Services</span>
                            </div>
                            <div class="summary-stat running">
                                <span class="stat-value">${running}</span>
                                <span class="stat-label">Running</span>
                            </div>
                            <div class="summary-stat stopped">
                                <span class="stat-value">${stopped}</span>
                                <span class="stat-label">Stopped</span>
                            </div>
                        </div>
                        <div class="services-actions">
                            <input type="text" id="servicesSearch" class="services-search" placeholder="Search services..." oninput="SystemManagementPanel.filterServices(this.value)">
                            <button class="btn btn-secondary" onclick="SystemManagementPanel.loadTab('services')">${ICONS.refresh} Refresh</button>
                        </div>
                    </div>
                    
                    <div class="services-section">
                        <h4 class="section-title">${ICONS.settings} User Services (${userServices.length})</h4>
                        <div class="services-grid" id="userServicesGrid">
                            ${userServices.length > 0 ? userServices.map(s => this.renderServiceCard(s)).join('') : '<p class="empty-hint">No user services found</p>'}
                        </div>
                    </div>
                    
                    <div class="services-section system-services">
                        <h4 class="section-title">${ICONS.system} System Services (${systemServices.length})</h4>
                        <p class="section-hint">System services cannot be disabled</p>
                        <div class="services-grid" id="systemServicesGrid">
                            ${systemServices.length > 0 ? systemServices.map(s => this.renderServiceCard(s, true)).join('') : '<p class="empty-hint">No system services found</p>'}
                        </div>
                    </div>
                </div>
            `;
        },
        
        renderServiceCard(service, isSystem = false) {
            const isRunning = service.status === 'running';
            const statusClass = isRunning ? 'running' : 'stopped';
            const statusText = isRunning ? 'Running' : 'Stopped';
            const displayName = service.display_name || service.name;
            
            return `
                <div class="service-card-mini ${statusClass} ${isSystem ? 'system' : ''}" data-service="${service.name}">
                    <div class="service-info">
                        <span class="service-name">${displayName}</span>
                        <span class="service-status">${statusText}</span>
                    </div>
                    ${!isSystem ? `
                        <button class="service-toggle-btn" onclick="SystemManagementPanel.toggleService('${service.name}', ${!isRunning})" title="${isRunning ? 'Stop' : 'Start'} service">
                            ${isRunning ? ICONS.stop : ICONS.play}
                        </button>
                    ` : `
                        <span class="system-badge">${ICONS.lock}</span>
                    `}
                </div>
            `;
        },
        
        isSystemService(name) {
            if (!name) return false;
            const systemServices = [
                'mulecube-service-manager', 'mulecube-hw-monitor', 'mulecube-reset',
                'mulecube-terminal', 'mulecube-terminal-ro', 'mulecube-status',
                'mulecube-diagnostics', 'mulecube-backup', 'mulecube-wifi-status',
                'mulecube-watchdog', 'mulecube-usb-monitor', 'mulecube-nettools',
                'mulecube-gpio', 'mulecube-dockge', 'mulecube-logs', 'mulecube-dashboard',
                'mulecube-homarr', 'nginx-proxy', 'pihole', 'uptime-kuma',
                'postgres', 'postgres-linkwarden', 'valkey', 'meilisearch',
                'meilisearch-linkwarden', 'tika'
            ];
            return systemServices.includes(name) ||
                   name.startsWith('mulecube-') ||
                   name.startsWith('watchtower-');
        },
        
        filterServices(query) {
            const q = query.toLowerCase();
            document.querySelectorAll('.services-tab .service-card-mini').forEach(card => {
                const name = card.dataset.service.toLowerCase();
                card.style.display = name.includes(q) ? '' : 'none';
            });
        },
        
        async toggleService(serviceName, enable) {
            try {
                const action = enable ? 'enable' : 'disable';
                const response = await fetch(`${API_BASE}/api/services/${serviceName}/${action}`, {
                    method: 'POST'
                });
                if (response.ok) {
                    // Refresh the services tab
                    setTimeout(() => this.loadTab('services'), 500);
                }
            } catch (e) {
                console.error('Failed to toggle service:', e);
            }
        },

        // ==========================================
        // Network Tab
        // ==========================================
        async loadNetworkTab(container) {
            let clients, interfaces;
            
            if (IS_DEMO) {
                const mockData = generateMockNetwork();
                clients = mockData.clients;
                interfaces = mockData.interfaces;
            } else {
                [clients, interfaces] = await Promise.all([
                    apiCall('/api/clients/').catch(() => []),
                    apiCall('/api/network/interfaces').catch(() => [])
                ]);
            }
            
            // API returns arrays directly, not wrapped in objects
            const wifiClients = Array.isArray(clients) ? clients : (clients.clients || []);
            const netInterfaces = Array.isArray(interfaces) ? interfaces : (interfaces.interfaces || []);
            
            // Filter to main interfaces (eth0, wlan0, etc. - exclude Docker bridges and veths)
            const mainInterfaces = netInterfaces.filter(i => 
                ['eth0', 'wlan0', 'wlan1', 'ap0', 'end0'].includes(i.name) ||
                (i.name?.startsWith('eth') && !i.name?.includes('veth')) ||
                (i.name?.startsWith('wlan'))
            );
            
            container.innerHTML = `
                <div class="network-section">
                    <!-- Connected Clients -->
                    <div class="info-card full-width">
                        <div class="card-header">
                            ${ICONS.clients}
                            <h3>Connected Clients</h3>
                            <span class="card-badge">${wifiClients.length} devices</span>
                        </div>
                        <div class="card-body">
                            ${wifiClients.length === 0 ? `
                                <div class="empty-state">
                                    <p>No devices connected to the WiFi access point</p>
                                </div>
                            ` : `
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Hostname</th>
                                            <th>IP Address</th>
                                            <th>MAC Address</th>
                                            <th>Connected</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${wifiClients.map(client => `
                                            <tr>
                                                <td>${escapeHtml(client.hostname || 'Unknown')}</td>
                                                <td class="mono">${escapeHtml(client.ip_address || client.ip || 'N/A')}</td>
                                                <td class="mono">${escapeHtml(client.mac_address || client.mac || 'N/A')}</td>
                                                <td>${client.connected_since ? formatDateTime(client.connected_since) : 'Active'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            `}
                        </div>
                    </div>
                    
                    <!-- Network Interfaces -->
                    <div class="info-card full-width">
                        <div class="card-header">
                            ${ICONS.network}
                            <h3>Network Interfaces</h3>
                        </div>
                        <div class="card-body">
                            ${mainInterfaces.length === 0 ? `
                                <div class="empty-state">
                                    <p>No network interfaces found</p>
                                </div>
                            ` : `
                                <div class="interfaces-grid">
                                    ${mainInterfaces.map(iface => `
                                        <div class="interface-card ${iface.is_up ? 'up' : 'down'}">
                                            <div class="interface-header">
                                                <span class="interface-name">${escapeHtml(iface.name)}</span>
                                                <span class="interface-status ${iface.is_up ? 'online' : 'offline'}">
                                                    ${iface.is_up ? 'Up' : 'Down'}
                                                </span>
                                            </div>
                                            <div class="interface-details">
                                                ${iface.ipv4_addresses?.length ? `<div class="detail"><span>IPv4:</span> <span class="mono">${escapeHtml(iface.ipv4_addresses[0])}</span></div>` : ''}
                                                ${iface.mac_address ? `<div class="detail"><span>MAC:</span> <span class="mono">${escapeHtml(iface.mac_address)}</span></div>` : ''}
                                                ${iface.speed_mbps ? `<div class="detail"><span>Speed:</span> ${iface.speed_mbps} Mbps</div>` : ''}
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            `;
        },

        // ==========================================
        // Storage Tab
        // ==========================================
        async loadStorageTab(container) {
            let disks, dockerVolumes;
            
            if (IS_DEMO) {
                const mockData = generateMockStorage();
                disks = mockData.disks;
                dockerVolumes = mockData.volumes;
            } else {
                [disks, dockerVolumes] = await Promise.all([
                    apiCall('/api/storage/disks').catch(() => []),
                    apiCall('/api/storage/docker').catch(() => [])
                ]);
            }
            
            // API returns arrays directly, not wrapped in objects
            const diskList = Array.isArray(disks) ? disks : (disks.disks || []);
            const volumes = Array.isArray(dockerVolumes) ? dockerVolumes : (dockerVolumes.volumes || []);
            
            // Prioritize showing the root partition (/)
            // First look for /, then fall back to /srv, then any mmcblk device
            let mainPartition = diskList.find(d => d.mountpoint === '/');
            if (!mainPartition) {
                mainPartition = diskList.find(d => d.mountpoint === '/srv');
            }
            if (!mainPartition) {
                mainPartition = diskList.find(d => d.device && d.device.includes('mmcblk'));
            }
            
            const uniqueDisks = mainPartition ? [mainPartition] : [];
            
            container.innerHTML = `
                <div class="storage-section">
                    <!-- Disk Usage -->
                    <div class="info-card full-width">
                        <div class="card-header">
                            ${ICONS.storage}
                            <h3>Disk Partitions</h3>
                        </div>
                        <div class="card-body">
                            ${uniqueDisks.length === 0 ? `
                                <div class="empty-state"><p>No disk information available</p></div>
                            ` : `
                                <div class="disk-grid">
                                    ${uniqueDisks.map(disk => {
                                        const usedPercent = disk.percent_used || disk.percent || 0;
                                        const status = usedPercent > 90 ? 'danger' : usedPercent > 75 ? 'warning' : 'normal';
                                        return `
                                            <div class="disk-card">
                                                <div class="disk-header">
                                                    <span class="disk-mount">${escapeHtml(disk.mountpoint)}</span>
                                                    <span class="disk-percent ${status}">${usedPercent.toFixed(1)}%</span>
                                                </div>
                                                <div class="progress-bar-container">
                                                    <div class="progress-bar ${status}" style="width: ${usedPercent}%"></div>
                                                </div>
                                                <div class="disk-details">
                                                    <span>${disk.used_human || formatBytes(disk.used_bytes || 0)} / ${disk.total_human || formatBytes(disk.total_bytes || 0)}</span>
                                                    <span class="disk-device mono">${escapeHtml(disk.device)}</span>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            `}
                        </div>
                    </div>
                    
                    <!-- Docker Volumes -->
                    <div class="info-card full-width">
                        <div class="card-header">
                            ${ICONS.storage}
                            <h3>Docker Volumes</h3>
                            <span class="card-badge">${volumes.length} volumes</span>
                        </div>
                        <div class="card-body">
                            ${volumes.length === 0 ? `
                                <div class="empty-state"><p>No Docker volumes found</p></div>
                            ` : `
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Volume Name</th>
                                            <th>Driver</th>
                                            <th>Created</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${volumes.slice(0, 20).map(vol => `
                                            <tr>
                                                <td class="mono">${escapeHtml(vol.name || 'Unknown')}</td>
                                                <td>${escapeHtml(vol.driver || 'local')}</td>
                                                <td>${vol.created ? formatDateTime(vol.created) : 'Unknown'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                                ${volumes.length > 20 ? `<p class="table-note">Showing 20 of ${volumes.length} volumes</p>` : ''}
                            `}
                        </div>
                    </div>
                </div>
            `;
        },

        // ==========================================
        // Processes Tab
        // ==========================================
        async loadProcessesTab(container) {
            // Render the processes (called by both initial load and refresh)
            await this.renderProcesses(container);
            
            // Set up auto-refresh ONLY if not already running
            if (!this.refreshIntervals.processes) {
                this.refreshIntervals.processes = setInterval(async () => {
                    // Only refresh if still on processes tab
                    if (this.activeTab === 'processes' && this.isOpen) {
                        await this.renderProcesses(container);
                    }
                }, CONFIG.pollInterval);
            }
        },
        
        async renderProcesses(container) {
            try {
                let processes;
                
                if (IS_DEMO) {
                    processes = generateMockProcesses();
                } else {
                    const data = await apiCall('/api/processes/');
                    processes = data.processes || [];
                }
                
                // Sort by CPU usage
                processes.sort((a, b) => (b.cpu_percent || b.cpu || 0) - (a.cpu_percent || a.cpu || 0));
                
                container.innerHTML = `
                    <div class="processes-section">
                        <div class="info-card full-width">
                            <div class="card-header">
                                ${ICONS.process}
                                <h3>Running Processes</h3>
                                <span class="card-badge">${processes.length} processes</span>
                            </div>
                            <div class="card-body">
                                <table class="data-table processes-table">
                                    <thead>
                                        <tr>
                                            <th>PID</th>
                                            <th>Name</th>
                                            <th>User</th>
                                            <th>CPU %</th>
                                            <th>Memory %</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${processes.slice(0, 50).map(proc => `
                                            <tr>
                                                <td class="mono">${proc.pid}</td>
                                                <td title="${escapeHtml(proc.cmdline || proc.name)}">${escapeHtml(proc.name)}</td>
                                                <td>${escapeHtml(proc.username || proc.user || 'root')}</td>
                                                <td class="${(proc.cpu_percent || proc.cpu || 0) > 50 ? 'highlight' : ''}">${(proc.cpu_percent || proc.cpu || 0).toFixed(1)}%</td>
                                                <td class="${(proc.memory_percent || proc.memory || 0) > 50 ? 'highlight' : ''}">${(proc.memory_percent || proc.memory || 0).toFixed(1)}%</td>
                                                <td><span class="status-badge ${proc.status}">${proc.status || 'running'}</span></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                                ${processes.length > 50 ? `<p class="table-note">Showing top 50 processes by CPU usage</p>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error('Failed to load processes:', error);
            }
        },

        // ==========================================
        // Logs Tab
        // ==========================================
        async loadLogsTab(container) {
            container.innerHTML = `
                <div class="logs-section">
                    <div class="logs-controls">
                        <select id="logSource" class="log-select">
                            <option value="system">System Journal</option>
                            <option value="container">Container Logs</option>
                        </select>
                        <select id="logContainer" class="log-select" style="display: none;">
                            <option value="">Select container...</option>
                        </select>
                        <input type="number" id="logLines" class="log-input" value="100" min="10" max="1000" title="Number of lines">
                        <button class="btn btn-secondary" onclick="SystemManagementPanel.fetchLogs()">
                            ${ICONS.refresh} Load Logs
                        </button>
                        <label class="log-checkbox">
                            <input type="checkbox" id="logAutoRefresh"> Auto-refresh
                        </label>
                    </div>
                    
                    <div class="log-viewer" id="logViewer">
                        <div class="loading-spinner"></div>
                        <p style="text-align:center; color: var(--color-text-muted);">Loading logs...</p>
                    </div>
                </div>
            `;
            
            // Auto-load logs when tab opens
            setTimeout(() => this.fetchLogs(), 100);
            
            // Setup log source change handler
            const sourceSelect = document.getElementById('logSource');
            const containerSelect = document.getElementById('logContainer');
            
            sourceSelect.addEventListener('change', async () => {
                if (sourceSelect.value === 'container') {
                    containerSelect.style.display = 'block';
                    // Fetch container list
                    try {
                        let containers;
                        if (IS_DEMO) {
                            const mockData = generateMockContainers();
                            containers = mockData.containers;
                        } else {
                            const data = await apiCall('/api/storage/docker/containers');
                            containers = data.containers || [];
                        }
                        containerSelect.innerHTML = '<option value="">Select container...</option>' +
                            containers.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${escapeHtml(c.state || c.status || '')})</option>`).join('');
                    } catch (e) {
                        console.error('Failed to fetch containers:', e);
                        containerSelect.innerHTML = '<option value="">Error loading containers</option>';
                    }
                } else {
                    containerSelect.style.display = 'none';
                }
            });
            
            // Auto-refresh checkbox
            const autoRefresh = document.getElementById('logAutoRefresh');
            autoRefresh.addEventListener('change', () => {
                if (autoRefresh.checked) {
                    this.refreshIntervals.logs = setInterval(() => {
                        this.fetchLogs();
                    }, CONFIG.logRefreshInterval);
                } else {
                    clearInterval(this.refreshIntervals.logs);
                }
            });
        },
        
        async fetchLogs() {
            const source = document.getElementById('logSource')?.value || 'system';
            const containerName = document.getElementById('logContainer')?.value;
            const lines = document.getElementById('logLines')?.value || 100;
            const viewer = document.getElementById('logViewer');
            
            if (!viewer) return;
            viewer.innerHTML = '<div class="loading-spinner"></div>';
            
            try {
                let logs;
                
                if (IS_DEMO) {
                    const mockLogs = generateMockLogs();
                    logs = { entries: mockLogs.map(l => l.formatted) };
                } else {
                    if (source === 'container' && containerName) {
                        logs = await apiCall(`/api/logs/container/${encodeURIComponent(containerName)}?lines=${lines}`);
                    } else {
                        logs = await apiCall(`/api/logs/journal?lines=${lines}`);
                    }
                }
                
                console.log('Logs API response:', logs);
                const entries = logs.entries || logs.logs || [];
                
                if (entries.length === 0) {
                    viewer.innerHTML = '<div class="empty-state"><p>No log entries found</p></div>';
                    return;
                }
                
                viewer.innerHTML = `
                    <pre class="log-content">${entries.map(entry => {
                        if (typeof entry === 'string') return escapeHtml(entry);
                        // Format: timestamp unit message
                        const ts = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : '';
                        const unit = entry.unit || '';
                        const msg = entry.message || JSON.stringify(entry);
                        return escapeHtml(`${ts} ${unit}: ${msg}`);
                    }).join('\n')}</pre>
                `;
                
                // Scroll to bottom
                viewer.scrollTop = viewer.scrollHeight;
            } catch (error) {
                console.error('Logs fetch error:', error);
                viewer.innerHTML = `<div class="panel-error">${ICONS.warning}<p>Failed to fetch logs: ${error.message}</p><p class="error-hint">Check if service-manager has sudo access to journalctl</p></div>`;
            }
        },

        // ==========================================
        // Firewall Tab
        // ==========================================
        async loadFirewallTab(container) {
            let data, natData, ipForward;
            
            if (IS_DEMO) {
                const mockFirewall = generateMockFirewall();
                data = { rules: mockFirewall.rules };
                natData = { enabled: mockFirewall.nat_enabled };
                ipForward = { enabled: mockFirewall.ip_forwarding };
            } else {
                data = await apiCall('/api/firewall/rules').catch(e => {
                    console.error('Firewall API error:', e);
                    return { rules: [] };
                });
                console.log('Firewall API response:', data);
                
                // Also get NAT status
                natData = await apiCall('/api/firewall/nat').catch(() => ({}));
                ipForward = await apiCall('/api/firewall/ip-forward').catch(() => ({}));
            }
            
            const rules = data.rules || [];
            
            container.innerHTML = `
                <div class="firewall-section">
                    <!-- Firewall Status -->
                    <div class="info-card">
                        <div class="card-header">
                            ${ICONS.firewall}
                            <h3>Firewall Status</h3>
                        </div>
                        <div class="card-body">
                            <div class="status-grid">
                                <div class="status-item">
                                    <span class="status-label">IP Forwarding</span>
                                    <span class="status-value ${ipForward.enabled ? 'text-success' : ''}">${ipForward.enabled ? 'Enabled' : 'Disabled'}</span>
                                </div>
                                <div class="status-item">
                                    <span class="status-label">NAT/Masquerade</span>
                                    <span class="status-value ${natData.masquerade_enabled ? 'text-success' : ''}">${natData.masquerade_enabled ? 'Enabled' : 'Disabled'}</span>
                                </div>
                                <div class="status-item">
                                    <span class="status-label">Filter Rules</span>
                                    <span class="status-value">${rules.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Rules Table -->
                    <div class="info-card full-width">
                        <div class="card-header">
                            ${ICONS.firewall}
                            <h3>Active Rules (filter table)</h3>
                            <span class="card-badge">${rules.length} rules</span>
                        </div>
                        <div class="card-body">
                            <div class="firewall-note">
                                <p>${ICONS.warning} Modifying firewall rules can lock you out. Proceed with caution.</p>
                            </div>
                            ${rules.length === 0 ? `
                                <div class="empty-state"><p>No firewall rules in filter table (default policy applies)</p></div>
                            ` : `
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Chain</th>
                                            <th>Target</th>
                                            <th>Protocol</th>
                                            <th>Interface</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${rules.map(rule => `
                                            <tr>
                                                <td>${escapeHtml(rule.chain || '-')}</td>
                                                <td><span class="action-badge ${(rule.target || '').toLowerCase()}">${escapeHtml(rule.target || '-')}</span></td>
                                                <td>${escapeHtml(rule.protocol || 'all')}</td>
                                                <td class="mono">${escapeHtml(rule.interface_in || rule.interface_out || '*')}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            `}
                        </div>
                    </div>
                </div>
            `;
        },

        // ==========================================
        // Backup Tab
        // ==========================================
        async loadBackupTab(container) {
            let data;
            
            if (IS_DEMO) {
                data = generateMockBackups();
            } else {
                data = await apiCall('/api/backup/').catch(() => ({ backups: [] }));
            }
            const backups = data.backups || [];
            
            container.innerHTML = `
                <div class="backup-section">
                    <!-- Create Backup -->
                    <div class="info-card">
                        <div class="card-header">
                            ${ICONS.upload}
                            <h3>Create Backup</h3>
                        </div>
                        <div class="card-body">
                            <p>Create a full backup of MuleCube configuration and data.</p>
                            <div class="backup-options">
                                <label class="checkbox-item">
                                    <input type="checkbox" id="backupConfig" checked> Configuration files
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" id="backupData"> User data (large)
                                </label>
                            </div>
                            <button class="btn btn-primary" onclick="SystemManagementPanel.createBackup()">
                                ${ICONS.upload} Create Backup
                            </button>
                        </div>
                    </div>
                    
                    <!-- Restore Backup -->
                    <div class="info-card">
                        <div class="card-header">
                            ${ICONS.download}
                            <h3>Restore Backup</h3>
                        </div>
                        <div class="card-body">
                            <p>Restore from a previously created backup file.</p>
                            <div class="file-upload">
                                <input type="file" id="restoreFile" accept=".tar.gz,.tgz,.zip">
                            </div>
                            <button class="btn btn-warning" onclick="SystemManagementPanel.restoreBackup()">
                                ${ICONS.download} Restore Backup
                            </button>
                        </div>
                    </div>
                    
                    <!-- Existing Backups -->
                    <div class="info-card full-width">
                        <div class="card-header">
                            ${ICONS.backup}
                            <h3>Available Backups</h3>
                            <span class="card-badge">${backups.length} backups</span>
                        </div>
                        <div class="card-body">
                            ${backups.length === 0 ? `
                                <div class="empty-state"><p>No backups found</p></div>
                            ` : `
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Filename</th>
                                            <th>Size</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${backups.map(backup => `
                                            <tr>
                                                <td class="mono">${escapeHtml(backup.filename)}</td>
                                                <td>${formatBytes(backup.size || 0)}</td>
                                                <td>${formatDateTime(backup.created)}</td>
                                                <td>
                                                    <button class="btn-icon" onclick="SystemManagementPanel.downloadBackup('${escapeHtml(backup.filename)}')" title="Download">
                                                        ${ICONS.download}
                                                    </button>
                                                    <button class="btn-icon danger" onclick="SystemManagementPanel.deleteBackup('${escapeHtml(backup.filename)}')" title="Delete">
                                                        ${ICONS.close}
                                                    </button>
                                                </td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            `}
                        </div>
                    </div>
                </div>
            `;
        },
        
        async createBackup() {
            const includeConfig = document.getElementById('backupConfig').checked;
            const includeData = document.getElementById('backupData').checked;
            
            try {
                const result = await apiCall('/api/backup/create', {
                    method: 'POST',
                    body: JSON.stringify({ include_config: includeConfig, include_data: includeData })
                });
                alert('Backup created successfully: ' + (result.filename || 'backup.tar.gz'));
                this.loadTab('backup');
            } catch (error) {
                alert('Failed to create backup: ' + error.message);
            }
        },
        
        async restoreBackup() {
            const fileInput = document.getElementById('restoreFile');
            if (!fileInput.files.length) {
                alert('Please select a backup file');
                return;
            }
            
            if (!confirm('This will overwrite current configuration. Are you sure?')) {
                return;
            }
            
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            
            try {
                const response = await fetch(`${CONFIG.serviceManagerBase}/api/backup/restore`, {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) throw new Error('Restore failed');
                
                alert('Backup restored successfully. System may need to restart.');
                this.loadTab('backup');
            } catch (error) {
                alert('Failed to restore backup: ' + error.message);
            }
        },
        
        downloadBackup(filename) {
            window.open(`${CONFIG.serviceManagerBase}/api/backup/download/${filename}`, '_blank');
        },
        
        async deleteBackup(filename) {
            if (!confirm(`Delete backup "${filename}"?`)) return;
            
            try {
                await apiCall(`/api/backup/${filename}`, { method: 'DELETE' });
                this.loadTab('backup');
            } catch (error) {
                alert('Failed to delete backup: ' + error.message);
            }
        },
        // ==========================================
        // Power/UPS Tab
        // ==========================================
        async loadPowerTab(container) {
            let powerData;
            
            // Use mock data in demo mode - share value with dashboard for consistency
            if (IS_DEMO) {
                // Use the same battery value as the dashboard status bar
                if (!window._demoBatteryPercent) {
                    window._demoBatteryPercent = Math.floor(Math.random() * 20) + 75;
                }
                const batteryFluctuation = (Math.random() - 0.5) * 2;
                const currentBattery = Math.min(99, Math.max(70, window._demoBatteryPercent + batteryFluctuation));
                
                powerData = JSON.parse(JSON.stringify(MOCK_POWER_DATA));
                powerData.battery.voltage = 4.10 + (currentBattery / 100) * 0.12; // 4.10V at 70%, 4.22V at 100%
                powerData.battery.capacity = currentBattery;
            } else {
                try {
                    powerData = await apiCall('/api/power/status');
                } catch (error) {
                    container.innerHTML = '<div class="panel-error">' + ICONS.warning + '<p>UPS not available</p><small>Power management API not responding.</small></div>';
                    return;
                }
            }
            
            const battery = powerData.battery || {};
            const acPower = powerData.ac_power || {};
            const charging = powerData.charging || {};
            
            let batteryColor = '#22c55e';
            let batteryBg = 'rgba(34, 197, 94, 0.1)';
            if (battery.status === 'critical') {
                batteryColor = '#ef4444';
                batteryBg = 'rgba(239, 68, 68, 0.1)';
            } else if (battery.status === 'low') {
                batteryColor = '#f59e0b';
                batteryBg = 'rgba(245, 158, 11, 0.1)';
            }
            
            let runtimeText = 'N/A';
            if (powerData.estimated_runtime_minutes) {
                const hours = Math.floor(powerData.estimated_runtime_minutes / 60);
                const mins = powerData.estimated_runtime_minutes % 60;
                runtimeText = hours > 0 ? hours + 'h ' + mins + 'm' : mins + 'm';
            }
            
            container.innerHTML = `
                <div class="tab-content power-tab">
                    <!-- Battery Status Card -->
                    <div class="info-card">
                        <div class="card-header">
                            ${ICONS.battery}
                            <h3>Battery Status</h3>
                            <span class="card-value" style="color: ${batteryColor};">${battery.capacity?.toFixed(0) || 0}%</span>
                        </div>
                        <div class="card-body">
                            <div class="battery-display">
                                <div class="battery-visual-large">
                                    <div class="battery-body-large" style="background: ${batteryBg}; border-color: ${batteryColor};">
                                        <div class="battery-level-large" style="width: ${Math.min(battery.capacity || 0, 100)}%; background: ${batteryColor};"></div>
                                    </div>
                                    <div class="battery-tip-large" style="background: ${batteryColor};"></div>
                                </div>
                                <div class="battery-info">
                                    <div class="battery-stat">
                                        <span class="stat-label">Voltage</span>
                                        <span class="stat-value">${battery.voltage?.toFixed(2) || '-.--'}V</span>
                                    </div>
                                    <div class="battery-stat">
                                        <span class="stat-label">Health</span>
                                        <span class="stat-value ${battery.health === 'good' ? 'text-success' : ''}">${battery.health || 'Unknown'}</span>
                                    </div>
                                    <div class="battery-stat">
                                        <span class="stat-label">Runtime</span>
                                        <span class="stat-value">${runtimeText}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Power Status Card -->
                    <div class="info-card">
                        <div class="card-header">
                            ${ICONS.power}
                            <h3>Power Status</h3>
                        </div>
                        <div class="card-body">
                            <div class="power-status-grid">
                                <div class="power-indicator-card ${acPower.connected ? 'active' : ''}">
                                    <div class="indicator-icon">${acPower.connected ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>'}</div>
                                    <div class="indicator-label">AC Power</div>
                                    <div class="indicator-status">${acPower.connected ? 'Connected' : 'Disconnected'}</div>
                                </div>
                                <div class="power-indicator-card ${charging.active ? 'active' : ''}">
                                    <div class="indicator-icon">${charging.active ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="10" x="2" y="7" rx="2" ry="2"/><line x1="22" y1="11" x2="22" y2="13"/><line x1="6" y1="11" x2="6" y2="13"/><line x1="10" y1="11" x2="10" y2="13"/><line x1="14" y1="11" x2="14" y2="13"/></svg>' : charging.status === 'full' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>'}</div>
                                    <div class="indicator-label">Charging</div>
                                    <div class="indicator-status">${charging.active ? 'Active' : charging.status === 'full' ? 'Full' : 'Inactive'}</div>
                                </div>
                                <div class="power-indicator-card">
                                    <div class="indicator-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/></svg></div>
                                    <div class="indicator-label">UPS Model</div>
                                    <div class="indicator-status">${powerData.ups_model || 'X1202'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Controls Card -->
                    <div class="info-card full-width">
                        <div class="card-header">
                            ${ICONS.settings}
                            <h3>Power Controls</h3>
                        </div>
                        <div class="card-body">
                            <div class="power-controls-grid">
                                <div class="control-group">
                                    <label class="control-label">Charging</label>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="chargingToggle" ${charging.enabled ? 'checked' : ''} 
                                               onchange="SystemManagementPanel.toggleCharging(this.checked)">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="control-group">
                                    <label class="control-label">Calibrate</label>
                                    <button class="btn btn-secondary btn-sm" onclick="SystemManagementPanel.calibrateFuelGauge()">
                                        Run Calibration
                                    </button>
                                </div>
                                <div class="control-group">
                                    <label class="control-label">Reboot System</label>
                                    <button class="btn btn-warning btn-sm" onclick="SystemManagementPanel.confirmReboot()">
                                        ${ICONS.refresh} Reboot
                                    </button>
                                </div>
                                <div class="control-group">
                                    <label class="control-label">Shutdown System</label>
                                    <button class="btn btn-danger btn-sm" onclick="SystemManagementPanel.confirmShutdown()">
                                        ${ICONS.power} Shutdown
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Debug Info -->
                    <div class="power-debug">
                        <span>I2C: ${powerData.i2c_connected ? 'Connected' : 'N/A'}</span>
                        <span>Raw: ${battery.voltage_raw || '-'}/${battery.capacity_raw || '-'}</span>
                    </div>
                </div>
            `;
            
            if (this.refreshIntervals.power) clearInterval(this.refreshIntervals.power);
            this.refreshIntervals.power = setInterval(() => {
                if (this.activeTab === 'power') this.loadPowerTab(container);
            }, 5000);
        },
        
        async toggleCharging(enabled) {
            if (IS_DEMO) {
                MOCK_POWER_DATA.charging.enabled = enabled;
                MOCK_POWER_DATA.charging.active = enabled;
                MOCK_POWER_DATA.charging.status = enabled ? 'charging' : 'disabled';
                setTimeout(() => this.loadTab('power'), 300);
                return;
            }
            try {
                await apiCall('/api/power/charging', {
                    method: 'POST',
                    body: JSON.stringify({ enabled: enabled })
                });
                setTimeout(() => this.loadTab('power'), 500);
            } catch (error) {
                alert('Failed to toggle charging: ' + error.message);
                document.getElementById('chargingToggle').checked = !enabled;
            }
        },
        
        async calibrateFuelGauge() {
            if (!confirm('Recalibrate fuel gauge? Battery percentage may change.')) return;
            if (IS_DEMO) {
                alert('Calibration initiated (demo mode)');
                this.loadTab('power');
                return;
            }
            try {
                const result = await apiCall('/api/power/calibrate', { method: 'POST' });
                alert(result.message || 'Calibration initiated');
                this.loadTab('power');
            } catch (error) {
                alert('Calibration failed: ' + error.message);
            }
        }

    };

    // ==========================================
    // Initialize on DOM ready
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        SystemManagementPanel.init();
    });

    // Make globally accessible
    window.SystemManagementPanel = SystemManagementPanel;

})();
