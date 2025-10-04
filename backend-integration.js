// =============================================================================
// BACKEND INTEGRATION - ADD THIS FILE TO YOUR PROJECT
// =============================================================================
// File: backend-integration.js
// Add to HTML: <script src="backend-integration.js"></script> BEFORE app.js

class BackendService {
    constructor(baseUrl = null) {
        this.baseUrl = baseUrl;
        this.timeout = 30000;
        this.available = false;
        this.currentDatasetId = null;
        this.retryAttempts = 2;
    }

    async checkAvailability() {
        if (!this.baseUrl) return false;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const response = await fetch(`${this.baseUrl}/`, {
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            this.available = response.ok;
            return this.available;
        } catch (error) {
            this.available = false;
            return false;
        }
    }

    async fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: response.statusText }));
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Backend timeout - operation took too long');
            }
            throw error;
        }
    }

    async uploadFile(file, onProgress = null) {
        if (!this.available) {
            throw new Error('Backend not available');
        }

        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();

        return new Promise((resolve, reject) => {
            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percent = (e.loaded / e.total) * 100;
                        onProgress(percent);
                    }
                });
            }

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const result = JSON.parse(xhr.responseText);
                        this.currentDatasetId = result.id;
                        resolve(result);
                    } catch (error) {
                        reject(new Error('Invalid response from backend'));
                    }
                } else {
                    reject(new Error(`Upload failed: ${xhr.statusText}`));
                }
            });

            xhr.addEventListener('error', () => {
                reject(new Error('Network error during upload'));
            });

            xhr.addEventListener('timeout', () => {
                reject(new Error('Upload timeout'));
            });

            xhr.open('POST', `${this.baseUrl}/api/upload`);
            xhr.timeout = this.timeout;
            xhr.send(formData);
        });
    }

    async calculateRiskMetrics(column) {
        if (!this.currentDatasetId) {
            throw new Error('No dataset uploaded');
        }

        return await this.fetchWithTimeout(
            `${this.baseUrl}/api/datasets/${this.currentDatasetId}/risk-metrics`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ column })
            }
        );
    }

    async optimizePortfolio(columns, method = 'equal_weight') {
        if (!this.currentDatasetId) {
            throw new Error('No dataset uploaded');
        }

        return await this.fetchWithTimeout(
            `${this.baseUrl}/api/datasets/${this.currentDatasetId}/optimize-portfolio`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ columns, method })
            }
        );
    }

    async backtestStrategy(priceColumn, strategyType, parameter) {
        if (!this.currentDatasetId) {
            throw new Error('No dataset uploaded');
        }

        return await this.fetchWithTimeout(
            `${this.baseUrl}/api/datasets/${this.currentDatasetId}/backtest`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    price_column: priceColumn,
                    strategy_type: strategyType,
                    parameter: parameter
                })
            }
        );
    }
}

// Enhanced DataService with Backend Support
class HybridDataService extends DataService {
    constructor(backendUrl = null) {
        super();
        this.backend = new BackendService(backendUrl);
        this.useBackend = false;
        this.backendAvailable = false;
    }

    async initialize() {
        await super.initialize();
        
        if (this.backend.baseUrl) {
            DEBUG.log('HybridDataService', 'Checking backend availability...');
            this.backendAvailable = await this.backend.checkAvailability();
            
            if (this.backendAvailable) {
                DEBUG.log('HybridDataService', '✓ Backend is available');
                Notification.info('Backend connected - enhanced performance enabled');
                this.useBackend = true;
            } else {
                DEBUG.log('HybridDataService', '✗ Backend not available, using frontend mode');
            }
        }
    }

    async loadData(file) {
        if (this.useBackend && this.backendAvailable) {
            return await this.loadDataViaBackend(file);
        } else {
            return await super.loadData(file);
        }
    }

    async loadDataViaBackend(file) {
        DEBUG.log('HybridDataService', 'Loading via backend...');
        
        try {
            this.emit('data:loading', { filename: file.name, mode: 'backend' });

            const result = await this.backend.uploadFile(file, (percent) => {
                this.emit('data:progress', { percent: Math.round(percent) });
            });

            const dataset = {
                headers: result.headers,
                rows: result.rows,
                metadata: {
                    source: 'backend',
                    id: result.id,
                    rowCount: result.row_count,
                    columnCount: result.column_count
                }
            };

            this.currentDataset = dataset;
            this.emit('data:loaded', { data: dataset, mode: 'backend' });
            
            DEBUG.log('HybridDataService', 'Data loaded via backend successfully');
            return dataset;

        } catch (error) {
            DEBUG.error('HybridDataService', 'Backend load failed, falling back to frontend', error);
            Notification.warning('Backend failed, using frontend mode');
            
            this.useBackend = false;
            return await super.loadData(file);
        }
    }

    async calculateRiskMetrics(data, column) {
        if (this.useBackend && this.backendAvailable && this.backend.currentDatasetId) {
            try {
                DEBUG.log('HybridDataService', 'Calculating risk via backend...');
                return await this.backend.calculateRiskMetrics(column);
            } catch (error) {
                DEBUG.error('HybridDataService', 'Backend calculation failed, using frontend', error);
            }
        }
        
        // Fallback to frontend
        return this.analyticsService.calculateRiskMetrics(data);
    }

    async optimizePortfolio(columns, method) {
        if (this.useBackend && this.backendAvailable && this.backend.currentDatasetId) {
            try {
                DEBUG.log('HybridDataService', 'Optimizing portfolio via backend...');
                return await this.backend.optimizePortfolio(columns, method);
            } catch (error) {
                DEBUG.error('HybridDataService', 'Backend optimization failed, using frontend', error);
            }
        }
        
        // Fallback to frontend (handled by caller)
        return null;
    }

    async backtestStrategy(priceColumn, strategyType, parameter) {
        if (this.useBackend && this.backendAvailable && this.backend.currentDatasetId) {
            try {
                DEBUG.log('HybridDataService', 'Running backtest via backend...');
                const result = await this.backend.backtestStrategy(priceColumn, strategyType, parameter);
                
                // Transform backend response to match frontend format
                return {
                    portfolioValues: result.portfolio_values || [],
                    returns: [],
                    metrics: {
                        mean: result.total_return / 100,
                        volatility: result.volatility,
                        sharpeRatio: result.sharpe_ratio,
                        maxDrawdown: result.max_drawdown
                    },
                    finalValue: result.final_value
                };
            } catch (error) {
                DEBUG.error('HybridDataService', 'Backend backtest failed, using frontend', error);
            }
        }
        
        // Fallback to frontend (handled by caller)
        return null;
    }

    isUsingBackend() {
        return this.useBackend && this.backendAvailable;
    }

    getBackendStatus() {
        return {
            configured: !!this.backend.baseUrl,
            available: this.backendAvailable,
            active: this.useBackend,
            url: this.backend.baseUrl
        };
    }
}

// Enhanced AnalyticsService with Backend Support
class HybridAnalyticsService extends AnalyticsService {
    constructor(dataService) {
        super();
        this.dataService = dataService;
    }

    async calculateRiskMetrics(data, column = null) {
        if (this.dataService.isUsingBackend && column) {
            try {
                return await this.dataService.calculateRiskMetrics(data, column);
            } catch (error) {
                DEBUG.log('HybridAnalyticsService', 'Using frontend fallback for risk metrics');
            }
        }
        
        return super.calculateRiskMetrics(data);
    }
}

// Progress Indicator Component
class ProgressIndicator {
    constructor(containerId = 'uploadLoading') {
        this.container = document.getElementById(containerId);
        this.progressBar = null;
    }

    show(message = 'Processing...') {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary mb-2"></div>
                <p class="progress-message">${message}</p>
                <div class="progress" style="height: 25px; display: none;">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" 
                         role="progressbar" 
                         style="width: 0%"
                         id="uploadProgressBar">0%</div>
                </div>
            </div>
        `;
        
        this.container.style.display = 'block';
        this.progressBar = document.getElementById('uploadProgressBar');
    }

    updateProgress(percent) {
        if (this.progressBar) {
            const progressContainer = this.progressBar.parentElement;
            progressContainer.style.display = 'block';
            this.progressBar.style.width = `${percent}%`;
            this.progressBar.textContent = `${percent}%`;
        }
    }

    updateMessage(message) {
        const messageEl = this.container?.querySelector('.progress-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
    }

    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
}

// Backend Configuration UI
class BackendConfig {
    static STORAGE_KEY = 'backendConfig';

    static load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            DEBUG.error('BackendConfig', 'Failed to load config', error);
        }
        return { url: '', enabled: false };
    }

    static save(url, enabled) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ url, enabled }));
            return true;
        } catch (error) {
            DEBUG.error('BackendConfig', 'Failed to save config', error);
            return false;
        }
    }

    static createSettingsButton() {
        const navbar = document.querySelector('.navbar-nav');
        if (!navbar) return;

        const settingsItem = document.createElement('li');
        settingsItem.className = 'nav-item';
        settingsItem.innerHTML = `
            <a class="nav-link" href="#" id="backendSettingsBtn">
                <i class="fas fa-cog"></i>
            </a>
        `;
        navbar.appendChild(settingsItem);

        document.getElementById('backendSettingsBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showModal();
        });
    }

    static showModal() {
        const config = this.load();
        
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'backendSettingsModal';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content bg-dark text-light">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-server mr-2"></i>Backend Settings
                        </h5>
                        <button type="button" class="close text-light" data-dismiss="modal">
                            <span>&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle mr-2"></i>
                            Configure a backend server for enhanced performance with large datasets
                        </div>
                        <div class="form-group">
                            <label>Backend URL:</label>
                            <input type="text" class="form-control" id="backendUrlInput" 
                                   placeholder="http://localhost:5000" 
                                   value="${config.url}">
                            <small class="form-text text-muted">
                                Flask: http://localhost:5000 | Django: http://localhost:8000
                            </small>
                        </div>
                        <div class="form-check">
                            <input type="checkbox" class="form-check-input" id="backendEnabledCheck"
                                   ${config.enabled ? 'checked' : ''}>
                            <label class="form-check-label">
                                Enable backend integration
                            </label>
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-secondary btn-sm" id="testBackendBtn">
                                <i class="fas fa-vial mr-2"></i>Test Connection
                            </button>
                            <span id="testResult" class="ml-2"></span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="saveBackendSettings">
                            <i class="fas fa-save mr-2"></i>Save & Reload
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        $(modal).modal('show');

        $(modal).on('hidden.bs.modal', () => {
            modal.remove();
        });

        document.getElementById('testBackendBtn')?.addEventListener('click', async () => {
            const url = document.getElementById('backendUrlInput').value;
            const result = document.getElementById('testResult');
            
            result.innerHTML = '<span class="text-info">Testing...</span>';
            
            try {
                const response = await fetch(url + '/', { method: 'GET', timeout: 2000 });
                if (response.ok) {
                    result.innerHTML = '<span class="text-success">✓ Connected</span>';
                } else {
                    result.innerHTML = '<span class="text-danger">✗ Failed</span>';
                }
            } catch (error) {
                result.innerHTML = '<span class="text-danger">✗ Unreachable</span>';
            }
        });

        document.getElementById('saveBackendSettings')?.addEventListener('click', () => {
            const url = document.getElementById('backendUrlInput').value;
            const enabled = document.getElementById('backendEnabledCheck').checked;
            
            this.save(url, enabled);
            $(modal).modal('hide');
            
            Notification.success('Settings saved! Reloading application...');
            setTimeout(() => window.location.reload(), 1500);
        });
    }
}

// Auto-detect and configure on load
(function() {
    DEBUG.log('BackendIntegration', 'Loading backend integration...');
    
    // Create settings button
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            BackendConfig.createSettingsButton();
        });
    } else {
        BackendConfig.createSettingsButton();
    }

    // Export to global scope
    window.HybridDataService = HybridDataService;
    window.HybridAnalyticsService = HybridAnalyticsService;
    window.BackendService = BackendService;
    window.ProgressIndicator = ProgressIndicator;
    window.BackendConfig = BackendConfig;
    
    DEBUG.log('BackendIntegration', 'Backend integration loaded successfully');
})();