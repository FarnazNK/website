// src/utils/EventEmitter.js
/**
 * Event Emitter Base Class
 * Provides event handling capabilities for other classes
 */
class EventEmitter {
    constructor() {
        this.events = new Map();
    }

    on(event, callback, context = null) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        
        this.events.get(event).push({ callback, context });
        
        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (!this.events.has(event)) return;
        
        const listeners = this.events.get(event);
        const index = listeners.findIndex(l => l.callback === callback);
        
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }

    emit(event, data = null) {
        if (!this.events.has(event)) return;
        
        const listeners = this.events.get(event);
        listeners.forEach(({ callback, context }) => {
            try {
                callback.call(context, data);
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        });
    }

    once(event, callback, context = null) {
        const unsubscribe = this.on(event, (data) => {
            unsubscribe();
            callback.call(context, data);
        });
        
        return unsubscribe;
    }

    removeAllListeners(event = null) {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
        }
    }
}

// src/config/AppConfig.js
/**
 * Application Configuration Manager
 * Centralized configuration with environment support
 */
class AppConfig {
    constructor() {
        this.config = new Map();
        this.environment = this.detectEnvironment();
        this.loadDefaults();
        this.loadEnvironmentConfig();
    }

    detectEnvironment() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'development';
        } else if (window.location.hostname.includes('staging')) {
            return 'staging';
        } else {
            return 'production';
        }
    }

loadDefaults() {
    const defaults = {
        // Application settings
        'app.name': 'Quantitative Investment Platform',
        'app.version': '2.0.0',
        'app.environment': this.environment,
        
        // Data settings
        'data.maxFileSize': 50 * 1024 * 1024, // 50MB
        'data.supportedFormats': ['csv', 'xlsx', 'json'],
        'data.maxRows': 1000000,
        'data.cacheTimeout': 300000, // 5 minutes
        
        // Chart settings
        'charts.defaultTheme': 'dark',
        'charts.maxDataPoints': 10000,
        'charts.defaultColors': ['#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1'],
        
        // LLM settings (improved)
        'llm.provider': 'openai',
        'llm.model': 'gpt-4o-mini',     // upgrade to better model
        'llm.maxTokens': 4000,          // higher token limit for richer analysis
        'llm.temperature': 0.2,         // lower temp = more deterministic results
        'llm.rateLimit': 20,            // requests per minute (frontend throttle guard)
        'llm.endpoint': '/api/llm',     // proxy endpoint (server-side)
        'llm.useServerProxy': true,     // don’t expose API key in browser
        
        // Performance settings
        'performance.enableCaching': true,
        'performance.debounceMs': 300,
        'performance.batchSize': 1000,
        
        // Security settings
        'security.enableCSP': true,
        'security.apiTimeout': 30000,
        
        // UI settings
        'ui.theme': 'dark',
        'ui.animations': true,
        'ui.notificationDuration': 5000
    };

    for (const [key, value] of Object.entries(defaults)) {
        this.config.set(key, value);
    }
}


    loadEnvironmentConfig() {
        const envConfigs = {
            development: {
                'llm.apiKey': localStorage.getItem('dev_llm_api_key'),
                'debug.enabled': true,
                'performance.enableCaching': false
            },
            staging: {
                'llm.apiKey': localStorage.getItem('staging_llm_api_key'),
                'debug.enabled': true
            },
            production: {
                'llm.apiKey': localStorage.getItem('llm_api_key'),
                'debug.enabled': false,
                'performance.enableCaching': true
            }
        };

        const envConfig = envConfigs[this.environment] || {};
        for (const [key, value] of Object.entries(envConfig)) {
            if (value !== null && value !== undefined) {
                this.config.set(key, value);
            }
        }
    }

    get(key, defaultValue = null) {
        return this.config.get(key) ?? defaultValue;
    }

    set(key, value) {
        this.config.set(key, value);
        this.persist();
    }

    has(key) {
        return this.config.has(key);
    }

    getAll() {
        return Object.fromEntries(this.config);
    }

    persist() {
        const userConfig = {};
        this.config.forEach((value, key) => {
            if (key.startsWith('user.') || key.includes('apiKey')) {
                userConfig[key] = value;
            }
        });
        localStorage.setItem('app_config', JSON.stringify(userConfig));
    }

    restore() {
        try {
            const userConfig = JSON.parse(localStorage.getItem('app_config') || '{}');
            for (const [key, value] of Object.entries(userConfig)) {
                this.config.set(key, value);
            }
        } catch (error) {
            console.warn('Failed to restore user config:', error);
        }
    }
}

// src/utils/Logger.js
/**
 * Centralized Logging System
 * Provides structured logging with levels and formatting
 */
class Logger {
    constructor(context = 'App') {
        this.context = context;
        this.level = this.getLogLevel();
        this.levels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3,
            TRACE: 4
        };
    }

    getLogLevel() {
        const stored = localStorage.getItem('log_level');
        if (stored) return stored;
        
        return window.location.hostname === 'localhost' ? 'DEBUG' : 'INFO';
    }

    error(message, data = null, error = null) {
        if (this.shouldLog('ERROR')) {
            console.error(this.formatMessage('ERROR', message), data, error);
            this.sendToMonitoring('ERROR', message, data, error);
        }
    }

    warn(message, data = null) {
        if (this.shouldLog('WARN')) {
            console.warn(this.formatMessage('WARN', message), data);
        }
    }

    info(message, data = null) {
        if (this.shouldLog('INFO')) {
            console.info(this.formatMessage('INFO', message), data);
        }
    }

    debug(message, data = null) {
        if (this.shouldLog('DEBUG')) {
            console.log(this.formatMessage('DEBUG', message), data);
        }
    }

    trace(message, data = null) {
        if (this.shouldLog('TRACE')) {
            console.trace(this.formatMessage('TRACE', message), data);
        }
    }

    shouldLog(level) {
        return this.levels[level] <= this.levels[this.level];
    }

    formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] ${level} [${this.context}] ${message}`;
    }

    sendToMonitoring(level, message, data, error) {
        // In production, send to monitoring service
        if (window.location.hostname !== 'localhost') {
            try {
                const errorData = {
                    level,
                    message,
                    context: this.context,
                    data,
                    error: error ? {
                        name: error.name,
                        message: error.message,
                        stack: error.stack
                    } : null,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent,
                    url: window.location.href
                };
                
                // Send to monitoring endpoint if available
                // fetch('/api/monitoring/error', { method: 'POST', body: JSON.stringify(errorData) });
            } catch (monitoringError) {
                console.error('Failed to send error to monitoring:', monitoringError);
            }
        }
    }

    createChildLogger(childContext) {
        return new Logger(`${this.context}:${childContext}`);
    }
}

// src/utils/PerformanceMonitor.js
/**
 * Performance Monitoring Utility
 * Tracks and reports application performance metrics
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = [];
        this.setupPerformanceObserver();
    }

    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.recordMetric(entry.name, entry.duration);
                    }
                });
                
                observer.observe({ entryTypes: ['measure', 'navigation'] });
                this.observers.push(observer);
            } catch (error) {
                console.warn('PerformanceObserver setup failed:', error);
            }
        }
    }

    startTimer(name) {
        performance.mark(`${name}-start`);
        return {
            end: () => this.endTimer(name)
        };
    }

    endTimer(name) {
        try {
            performance.mark(`${name}-end`);
            performance.measure(name, `${name}-start`, `${name}-end`);
            
            const measures = performance.getEntriesByName(name, 'measure');
            if (measures.length > 0) {
                const duration = measures[measures.length - 1].duration;
                this.recordMetric(name, duration);
                return duration;
            }
        } catch (error) {
            console.warn('Performance measurement failed:', error);
        }
    }

    recordMetric(name, value) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, {
                count: 0,
                total: 0,
                min: Infinity,
                max: -Infinity,
                values: []
            });
        }

        const metric = this.metrics.get(name);
        metric.count++;
        metric.total += value;
        metric.min = Math.min(metric.min, value);
        metric.max = Math.max(metric.max, value);
        metric.values.push(value);

        // Keep only last 100 values
        if (metric.values.length > 100) {
            metric.values.shift();
        }

        // Alert on performance issues
        if (value > 5000) { // 5 seconds threshold
            console.warn(`Slow operation detected: ${name} took ${value.toFixed(2)}ms`);
        }
    }

    getMetrics() {
        const result = {};
        
        for (const [name, metric] of this.metrics) {
            result[name] = {
                ...metric,
                average: metric.total / metric.count,
                p95: this.calculatePercentile(metric.values, 0.95),
                p99: this.calculatePercentile(metric.values, 0.99)
            };
            delete result[name].values; // Don't expose raw values
        }
        
        return result;
    }

    calculatePercentile(values, percentile) {
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * percentile) - 1;
        return sorted[index] || 0;
    }

    clearMetrics() {
        this.metrics.clear();
        if (typeof performance !== 'undefined' && performance.clearMarks) {
            performance.clearMarks();
            performance.clearMeasures();
        }
    }

    generateReport() {
        const metrics = this.getMetrics();
        const report = {
            timestamp: new Date().toISOString(),
            metrics,
            summary: {
                totalOperations: Object.values(metrics).reduce((sum, m) => sum + m.count, 0),
                averageResponseTime: Object.values(metrics).reduce((sum, m) => sum + m.average, 0) / Object.keys(metrics).length || 0,
                slowestOperation: Object.entries(metrics).reduce((slowest, [name, metric]) => 
                    metric.max > (slowest.duration || 0) ? { name, duration: metric.max } : slowest, {}
                )
            }
        };
        
        return report;
    }
}

// src/utils/ModuleState.js
/**
 * Module State Manager
 * Manages state for UI modules
 */
class ModuleState {
    constructor(initialState = {}) {
        this.state = { ...initialState };
        this.listeners = [];
    }

    get() {
        return { ...this.state };
    }

    update(newState) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };
        
        this.listeners.forEach(listener => {
            try {
                listener(this.state, oldState);
            } catch (error) {
                console.error('State listener error:', error);
            }
        });
    }

    subscribe(listener) {
        this.listeners.push(listener);
        
        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    reset() {
        this.state = {};
        this.listeners = [];
    }
}

// src/utils/Notification.js
/**
 * Notification System
 * Handles user notifications
 */
class Notification {
    constructor(options = {}) {
        this.type = options.type || 'info';
        this.message = options.message || '';
        this.duration = options.duration || 5000;
        this.element = null;
    }

    show() {
        this.element = this.createElement();
        document.body.appendChild(this.element);

        // Auto-hide after duration
        if (this.duration > 0) {
            setTimeout(() => {
                this.hide();
            }, this.duration);
        }

        return this;
    }

    hide() {
        if (this.element && this.element.parentNode) {
            this.element.classList.add('fade-out');
            setTimeout(() => {
                if (this.element && this.element.parentNode) {
                    this.element.parentNode.removeChild(this.element);
                }
            }, 300);
        }
    }

    createElement() {
        const div = document.createElement('div');
        div.className = `notification alert alert-${this.getAlertClass()} alert-dismissible`;
        div.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        div.innerHTML = `
            <span>${this.message}</span>
            <button type="button" class="close" onclick="this.parentElement.remove()">
                <span>&times;</span>
            </button>
        `;

        // Trigger animation
        setTimeout(() => {
            div.style.opacity = '1';
            div.style.transform = 'translateX(0)';
        }, 10);

        return div;
    }

    getAlertClass() {
        const map = {
            'success': 'success',
            'error': 'danger',
            'warning': 'warning',
            'info': 'info'
        };
        return map[this.type] || 'info';
    }

    static success(message, duration = 5000) {
        return new Notification({ type: 'success', message, duration }).show();
    }

    static error(message, duration = 5000) {
        return new Notification({ type: 'error', message, duration }).show();
    }

    static warning(message, duration = 5000) {
        return new Notification({ type: 'warning', message, duration }).show();
    }

    static info(message, duration = 5000) {
        return new Notification({ type: 'info', message, duration }).show();
    }
}

// Export all classes
if (typeof window !== 'undefined') {
    window.EventEmitter = EventEmitter;
    window.AppConfig = AppConfig;
    window.Logger = Logger;
    window.PerformanceMonitor = PerformanceMonitor;
    window.ModuleState = ModuleState;
    window.Notification = Notification;
}