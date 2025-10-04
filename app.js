// =============================================================================
// QUANTITATIVE INVESTMENT PLATFORM - COMPLETE CODE WITH MULTI-SOURCE SUPPORT
// =============================================================================

// DEBUG LOGGER
class DebugLogger {
    constructor() {
        this.logs = [];
        this.errors = [];
        this.enabled = true;
    }

    log(category, message, data = null) {
        const entry = {
            timestamp: new Date().toISOString(),
            category,
            message,
            data
        };
        this.logs.push(entry);
        if (this.enabled) {
            console.log(`[${category}] ${message}`, data || '');
        }
    }

    error(category, message, error = null) {
        const entry = {
            timestamp: new Date().toISOString(),
            category,
            message,
            error: error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : null
        };
        this.errors.push(entry);
        console.error(`[${category}] ERROR: ${message}`, error || '');
    }

    getLogs() {
        return this.logs;
    }

    getErrors() {
        return this.errors;
    }

    exportDebugInfo() {
        return {
            logs: this.logs,
            errors: this.errors,
            browser: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
    }
}

const DEBUG = new DebugLogger();

// EVENT EMITTER
class EventEmitter {
    constructor() {
        this.events = new Map();
        DEBUG.log('EventEmitter', 'Initialized');
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
        DEBUG.log('EventEmitter', `Registered listener for: ${event}`);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (!this.events.has(event)) return;
        const listeners = this.events.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) {
            listeners.splice(index, 1);
            DEBUG.log('EventEmitter', `Removed listener for: ${event}`);
        }
    }

    emit(event, data = null) {
        DEBUG.log('EventEmitter', `Emitting event: ${event}`, data);
        if (!this.events.has(event)) {
            DEBUG.log('EventEmitter', `No listeners for: ${event}`);
            return;
        }
        this.events.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                DEBUG.error('EventEmitter', `Error in event listener for ${event}`, error);
            }
        });
    }
}

// NOTIFICATION SYSTEM
class Notification {
    constructor(options = {}) {
        this.type = options.type || 'info';
        this.message = options.message || '';
        this.duration = options.duration || 5000;
    }

    show() {
        DEBUG.log('Notification', `Showing ${this.type}: ${this.message}`);
        const div = document.createElement('div');
        div.className = `alert alert-${this.getAlertClass()} alert-dismissible`;
        div.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;`;
        div.innerHTML = `
            <span>${this.message}</span>
            <button type="button" class="close" onclick="this.parentElement.remove()">
                <span>&times;</span>
            </button>
        `;
        document.body.appendChild(div);

        if (this.duration > 0) {
            setTimeout(() => div.remove(), this.duration);
        }
        return this;
    }

    getAlertClass() {
        const map = { 'success': 'success', 'error': 'danger', 'warning': 'warning', 'info': 'info' };
        return map[this.type] || 'info';
    }

    static success(message) { return new Notification({ type: 'success', message }).show(); }
    static error(message) { return new Notification({ type: 'error', message }).show(); }
    static warning(message) { return new Notification({ type: 'warning', message }).show(); }
    static info(message) { return new Notification({ type: 'info', message }).show(); }
}

// DATA SOURCE CONNECTOR
class DataSourceConnector {
    constructor() {
        this.connections = new Map();
    }

    async connectAzureBlob(config) {
        DEBUG.log('DataSourceConnector', 'Connecting to Azure Blob Storage...');
        
        const { accountName, containerName, sasToken, blobName } = config;
        const url = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Azure Blob fetch failed: ${response.statusText}`);
            
            const blob = await response.blob();
            const file = new File([blob], blobName, { type: blob.type });
            
            DEBUG.log('DataSourceConnector', `Azure blob retrieved: ${blobName}`);
            return file;
        } catch (error) {
            DEBUG.error('DataSourceConnector', 'Azure connection failed', error);
            throw new Error(`Azure connection failed: ${error.message}`);
        }
    }

    async connectAWS_S3(config) {
        DEBUG.log('DataSourceConnector', 'Connecting to AWS S3...');
        
        const { presignedUrl, key } = config;
        
        if (presignedUrl) {
            try {
                const response = await fetch(presignedUrl);
                if (!response.ok) throw new Error(`S3 fetch failed: ${response.statusText}`);
                
                const blob = await response.blob();
                const file = new File([blob], key || 'data', { type: blob.type });
                
                DEBUG.log('DataSourceConnector', `S3 object retrieved: ${key}`);
                return file;
            } catch (error) {
                DEBUG.error('DataSourceConnector', 'S3 connection failed', error);
                throw new Error(`S3 connection failed: ${error.message}`);
            }
        } else {
            throw new Error('S3 requires pre-signed URL for browser access');
        }
    }

    async connectAPI(config) {
        DEBUG.log('DataSourceConnector', 'Connecting to API...');
        
        const { url, method = 'GET', headers = {}, body = null } = config;
        
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                }
            };
            
            if (body && method !== 'GET') {
                options.body = JSON.stringify(body);
            }
            
            const response = await fetch(url, options);
            if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);
            
            const data = await response.json();
            DEBUG.log('DataSourceConnector', 'API data retrieved');
            
            return this.jsonToDataset(data);
        } catch (error) {
            DEBUG.error('DataSourceConnector', 'API connection failed', error);
            throw new Error(`API connection failed: ${error.message}`);
        }
    }

    async connectGoogleSheets(config) {
        DEBUG.log('DataSourceConnector', 'Connecting to Google Sheets...');
        
        const { sheetId, apiKey, range = 'A:Z' } = config;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Google Sheets fetch failed: ${response.statusText}`);
            
            const data = await response.json();
            const values = data.values;
            
            if (!values || values.length === 0) {
                throw new Error('No data found in sheet');
            }
            
            const headers = values[0];
            const rows = values.slice(1).map(row => {
                return row.map(cell => {
                    const num = parseFloat(cell);
                    return isNaN(num) ? cell : num;
                });
            });
            
            DEBUG.log('DataSourceConnector', `Google Sheets data retrieved: ${rows.length} rows`);
            return { headers, rows };
        } catch (error) {
            DEBUG.error('DataSourceConnector', 'Google Sheets connection failed', error);
            throw new Error(`Google Sheets connection failed: ${error.message}`);
        }
    }

    jsonToDataset(data) {
        if (Array.isArray(data)) {
            if (data.length === 0) throw new Error('Empty array');
            
            const headers = Object.keys(data[0]);
            const rows = data.map(obj => headers.map(h => obj[h]));
            
            return { headers, rows };
        } else if (data.headers && data.rows) {
            return data;
        } else {
            throw new Error('Unsupported JSON structure');
        }
    }
}

// DATA SERVICE
class DataService extends EventEmitter {
    constructor() {
        super();
        this.currentDataset = null;
        DEBUG.log('DataService', 'Constructor called');
    }

    async initialize() {
        DEBUG.log('DataService', 'Initializing...');
        try {
            DEBUG.log('DataService', 'Initialized successfully');
        } catch (error) {
            DEBUG.error('DataService', 'Initialization failed', error);
            throw error;
        }
    }

    async loadData(file) {
        DEBUG.log('DataService', `Loading file: ${file.name} (${file.size} bytes, type: ${file.type})`);
        
        try {
            this.emit('data:loading', { filename: file.name });
            
            const dataset = await this.parseFile(file);
            DEBUG.log('DataService', `Parsed dataset: ${dataset.rows.length} rows, ${dataset.headers.length} columns`);
            
            this.currentDataset = dataset;
            
            this.emit('data:loaded', { data: dataset });
            DEBUG.log('DataService', 'Data loaded successfully');
            return dataset;
        } catch (error) {
            DEBUG.error('DataService', 'Data loading failed', error);
            this.emit('data:error', { error });
            throw error;
        }
    }

    async parseFile(file) {
        DEBUG.log('DataService', `Parsing file: ${file.name}`);
        
        try {
            const extension = file.name.split('.').pop().toLowerCase();
            DEBUG.log('DataService', `File extension: ${extension}`);
            
            if (extension === 'csv') {
                const text = await file.text();
                return this.parseCSV(text);
            } else if (extension === 'json') {
                const text = await file.text();
                return JSON.parse(text);
            } else if (extension === 'xlsx' || extension === 'xls') {
                return await this.parseExcel(file);
            } else {
                throw new Error(`Unsupported file format: ${extension}`);
            }
        } catch (error) {
            DEBUG.error('DataService', 'File parsing failed', error);
            throw error;
        }
    }

    parseCSV(text) {
        DEBUG.log('DataService', 'Parsing CSV...');
        
        try {
            const lines = text.split('\n').filter(line => line.trim());
            DEBUG.log('DataService', `CSV has ${lines.length} lines`);
            
            if (lines.length === 0) throw new Error('Empty CSV file');

            const parseLine = (line) => {
                const result = [];
                let current = '';
                let inQuotes = false;
                
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        result.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                result.push(current.trim());
                return result.map(cell => cell.replace(/^"|"$/g, ''));
            };

            const headers = parseLine(lines[0]);
            DEBUG.log('DataService', `CSV headers: ${headers.join(', ')}`);
            
            const rows = [];
            for (let i = 1; i < lines.length; i++) {
                try {
                    const parsedLine = parseLine(lines[i]);
                    const row = parsedLine.map(cell => {
                        const trimmed = cell.trim();
                        const num = parseFloat(trimmed);
                        return isNaN(num) ? trimmed : num;
                    });
                    rows.push(row);
                } catch (error) {
                    DEBUG.error('DataService', `Error parsing line ${i}`, error);
                }
            }
            
            DEBUG.log('DataService', `Parsed ${rows.length} data rows`);
            return { headers, rows };
            
        } catch (error) {
            DEBUG.error('DataService', 'CSV parsing failed', error);
            throw error;
        }
    }

    async parseExcel(file) {
        DEBUG.log('DataService', 'Parsing Excel file...');
        
        if (typeof XLSX === 'undefined') {
            throw new Error('Excel support not available. XLSX library not loaded.');
        }
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            const firstSheetName = workbook.SheetNames[0];
            DEBUG.log('DataService', `Reading sheet: ${firstSheetName}`);
            
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
            
            if (jsonData.length === 0) {
                throw new Error('Empty Excel file');
            }
            
            const headers = jsonData[0].map(h => String(h).trim());
            const rows = jsonData.slice(1).map(row => {
                return row.map(cell => {
                    if (cell === null || cell === undefined || cell === '') return null;
                    const num = parseFloat(cell);
                    return isNaN(num) ? String(cell) : num;
                });
            });
            
            DEBUG.log('DataService', `Parsed Excel: ${rows.length} rows, ${headers.length} columns`);
            return { headers, rows };
            
        } catch (error) {
            DEBUG.error('DataService', 'Excel parsing failed', error);
            throw error;
        }
    }

    getCurrentDataset() {
        return this.currentDataset;
    }

    getNumericColumns() {
        if (!this.currentDataset) {
            DEBUG.log('DataService', 'No dataset available for getNumericColumns');
            return [];
        }
        
        const numericCols = this.currentDataset.headers.filter((header, index) => {
            return this.currentDataset.rows.some(row => typeof row[index] === 'number');
        });
        
        DEBUG.log('DataService', `Found ${numericCols.length} numeric columns: ${numericCols.join(', ')}`);
        return numericCols;
    }

    getColumnData(columnName) {
        if (!this.currentDataset) {
            DEBUG.log('DataService', 'No dataset available for getColumnData');
            return [];
        }
        
        const index = this.currentDataset.headers.indexOf(columnName);
        if (index === -1) {
            DEBUG.log('DataService', `Column not found: ${columnName}`);
            return [];
        }
        
        const data = this.currentDataset.rows
            .map(row => row[index])
            .filter(val => typeof val === 'number');
        
        DEBUG.log('DataService', `Retrieved ${data.length} numeric values from column: ${columnName}`);
        return data;
    }
}

// ANALYTICS SERVICE
class AnalyticsService extends EventEmitter {
    constructor() {
        super();
        DEBUG.log('AnalyticsService', 'Constructor called');
    }

    async initialize() {
        DEBUG.log('AnalyticsService', 'Initialized');
    }

    calculateReturns(prices, type = 'simple') {
        DEBUG.log('AnalyticsService', `Calculating ${type} returns for ${prices.length} prices`);
        
        if (!Array.isArray(prices) || prices.length < 2) {
            DEBUG.log('AnalyticsService', 'Insufficient data for returns calculation');
            return [];
        }
        
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            if (type === 'simple') {
                returns.push((prices[i] - prices[i-1]) / prices[i-1]);
            } else if (type === 'log') {
                returns.push(Math.log(prices[i] / prices[i-1]));
            }
        }
        
        DEBUG.log('AnalyticsService', `Calculated ${returns.length} returns`);
        return returns;
    }

    calculateRiskMetrics(data) {
        DEBUG.log('AnalyticsService', `Calculating risk metrics for ${data.length} data points`);
        
        if (!Array.isArray(data) || data.length < 2) {
            DEBUG.log('AnalyticsService', 'Insufficient data for risk metrics');
            return null;
        }
        
        try {
            const returns = this.calculateReturns(data);
            const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
            const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (returns.length - 1);
            const volatility = Math.sqrt(variance);
            const annualizedVol = volatility * Math.sqrt(252);
            
            const sortedReturns = [...returns].sort((a, b) => a - b);
            const var95 = -sortedReturns[Math.floor(0.05 * sortedReturns.length)];
            const var99 = -sortedReturns[Math.floor(0.01 * sortedReturns.length)];
            
            const metrics = {
                mean: mean * 252,
                volatility: annualizedVol,
                var95: var95,
                var99: var99,
                sharpeRatio: annualizedVol > 0 ? (mean * 252) / annualizedVol : 0,
                maxDrawdown: this.calculateMaxDrawdown(data)
            };
            
            DEBUG.log('AnalyticsService', 'Risk metrics calculated', metrics);
            return metrics;
            
        } catch (error) {
            DEBUG.error('AnalyticsService', 'Risk metrics calculation failed', error);
            return null;
        }
    }

    calculateMaxDrawdown(prices) {
        let maxDrawdown = 0;
        let peak = prices[0];
        
        for (let i = 1; i < prices.length; i++) {
            if (prices[i] > peak) {
                peak = prices[i];
            }
            const drawdown = (peak - prices[i]) / peak;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }
        return maxDrawdown;
    }

    calculateMovingAverage(data, period) {
        DEBUG.log('AnalyticsService', `Calculating ${period}-period moving average`);
        const result = [];
        for (let i = period - 1; i < data.length; i++) {
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
        return result;
    }

    optimizePortfolio(returns, method = 'equalWeight') {
        DEBUG.log('AnalyticsService', `Optimizing portfolio using ${method} for ${returns.length} assets`);
        
        const numAssets = returns.length;
        let weights = new Array(numAssets).fill(1 / numAssets);

        return {
            weights: weights,
            expectedReturn: this.calculatePortfolioReturn(returns, weights),
            volatility: this.calculatePortfolioVolatility(returns, weights)
        };
    }

    calculatePortfolioReturn(returns, weights) {
        let portfolioReturn = 0;
        for (let i = 0; i < returns.length; i++) {
            const assetMean = returns[i].reduce((sum, r) => sum + r, 0) / returns[i].length;
            portfolioReturn += weights[i] * assetMean;
        }
        return portfolioReturn * 252;
    }

    calculatePortfolioVolatility(returns, weights) {
        let portfolioVar = 0;
        for (let i = 0; i < returns.length; i++) {
            const assetVar = this.calculateVariance(returns[i]);
            portfolioVar += weights[i] * weights[i] * assetVar;
        }
        return Math.sqrt(portfolioVar) * Math.sqrt(252);
    }

    calculateVariance(data) {
        const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
        return data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1);
    }
}

// UI MANAGER
class UIManager {
    constructor(dataService, analyticsService) {
        this.dataService = dataService;
        this.analyticsService = analyticsService;
        this.activeModule = 'dataManager';
        this.currentChart = null;
        this.dataConnector = new DataSourceConnector();
        DEBUG.log('UIManager', 'Constructor called');
        
        this.setupEventListeners();
    }

    async initialize() {
        DEBUG.log('UIManager', 'Initializing...');
        
        try {
            this.setupFileUpload();
            this.setupDataListeners();
            this.createMissingModules();
            this.setupDataSourceConnections();
            DEBUG.log('UIManager', 'Initialized successfully');
        } catch (error) {
            DEBUG.error('UIManager', 'Initialization failed', error);
            throw error;
        }
    }

    createMissingModules() {
        DEBUG.log('UIManager', 'Creating missing modules...');
        
        const container = document.getElementById('moduleContainer');
        if (!container) {
            DEBUG.error('UIManager', 'Module container not found');
            return;
        }

        const modulesHTML = `
            <!-- Visualizations Module -->
            <div class="module-content" id="plotManagerModule" style="display: none;">
                <h4><i class="fas fa-chart-bar mr-2"></i>Data Visualizations</h4>
                <div class="row mb-4">
                    <div class="col-md-6">
                        <label>Select Column for Analysis:</label>
                        <select class="form-control" id="plotColumn">
                            <option value="">Choose a column...</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label>Chart Type:</label>
                        <select class="form-control" id="chartType">
                            <option value="line">Line Chart</option>
                            <option value="bar">Bar Chart</option>
                        </select>
                    </div>
                </div>
                <button class="btn btn-primary mb-3" id="generateChart">
                    <i class="fas fa-chart-line mr-2"></i>Generate Chart
                </button>
                <div style="height: 400px; position: relative;">
                    <canvas id="dataChart"></canvas>
                </div>
            </div>

            <!-- Risk Analytics Module -->
            <div class="module-content" id="riskAnalyticsModule" style="display: none;">
                <h4><i class="fas fa-calculator mr-2"></i>Risk Analytics</h4>
                <div class="row mb-4">
                    <div class="col-md-12">
                        <label>Price/Returns Column:</label>
                        <select class="form-control" id="riskColumn">
                            <option value="">Choose a column...</option>
                        </select>
                    </div>
                </div>
                <button class="btn btn-primary mb-3" id="calculateRisk">
                    <i class="fas fa-calculator mr-2"></i>Calculate Risk Metrics
                </button>
                <div class="row" id="riskMetrics"></div>
            </div>

            <!-- Portfolio Optimization Module -->
            <div class="module-content" id="portfolioManagerModule" style="display: none;">
                <h4><i class="fas fa-briefcase mr-2"></i>Portfolio Optimization</h4>
                <div class="row mb-3">
                    <div class="col-md-8">
                        <label>Select Assets (hold Ctrl to select multiple):</label>
                        <select class="form-control" id="assetSelection" multiple size="5"></select>
                    </div>
                    <div class="col-md-4">
                        <label>Optimization Method:</label>
                        <select class="form-control" id="optimizationMethod">
                            <option value="equalWeight">Equal Weight</option>
                            <option value="minVolatility">Minimum Volatility</option>
                            <option value="maxSharpe">Maximum Sharpe Ratio</option>
                        </select>
                        <button class="btn btn-success mt-3 w-100" id="optimizePortfolio">
                            <i class="fas fa-magic mr-2"></i>Optimize Portfolio
                        </button>
                    </div>
                </div>
                <div id="portfolioResults" style="display: none;"></div>
            </div>

            <!-- Strategy Backtesting Module -->
            <div class="module-content" id="strategyBacktestModule" style="display: none;">
                <h4><i class="fas fa-chart-line mr-2"></i>Strategy Backtesting</h4>
                <div class="row mb-4">
                    <div class="col-md-4">
                        <label>Price Column:</label>
                        <select class="form-control" id="priceColumn">
                            <option value="">Choose a column...</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label>Strategy Type:</label>
                        <select class="form-control" id="strategyType">
                            <option value="buyhold">Buy & Hold</option>
                            <option value="sma">Simple Moving Average</option>
                            <option value="momentum">Momentum Strategy</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label>Parameters:</label>
                        <input type="number" class="form-control" id="strategyParam" value="20">
                    </div>
                </div>
                <button class="btn btn-primary mb-3" id="runBacktest">
                    <i class="fas fa-play mr-2"></i>Run Backtest
                </button>
                <div class="row" id="backtestResults"></div>
            </div>
        `;

        const aiModule = document.getElementById('aiInsightsModule');
        if (aiModule) {
            aiModule.insertAdjacentHTML('beforebegin', modulesHTML);
            DEBUG.log('UIManager', 'Modules HTML inserted');
        }

        setTimeout(() => {
            this.setupModuleEventListeners();
        }, 100);
    }

    setupEventListeners() {
        DEBUG.log('UIManager', 'Setting up event listeners...');
        
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-tool')) {
                const button = e.target.closest('.btn-tool');
                const module = button.dataset.module;
                DEBUG.log('UIManager', `Toolbar button clicked: ${module}`);
                if (!button.disabled) {
                    this.switchModule(module);
                }
            }
        });
    }

    setupModuleEventListeners() {
        DEBUG.log('UIManager', 'Setting up module-specific event listeners...');
        
        const buttons = {
            'generateChart': () => this.generateChart(),
            'calculateRisk': () => this.calculateRiskMetrics(),
            'optimizePortfolio': () => this.optimizePortfolio(),
            'runBacktest': () => this.runBacktest(),
            'analyzeBtn': () => this.handleAIAnalysis()
        };

        for (const [id, handler] of Object.entries(buttons)) {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', handler);
                DEBUG.log('UIManager', `Event listener attached to: ${id}`);
            }
        }
    }

    setupFileUpload() {
        DEBUG.log('UIManager', 'Setting up file upload...');
        
        const dropZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');
        const browseBtn = document.getElementById('browseFiles');

        if (!dropZone || !fileInput || !browseBtn) {
            DEBUG.error('UIManager', 'File upload elements not found');
            return;
        }

        browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            DEBUG.log('UIManager', 'Browse button clicked');
            fileInput.click();
        });
        
        dropZone.addEventListener('click', (e) => {
            if (e.target === browseBtn || browseBtn.contains(e.target)) {
                return;
            }
            DEBUG.log('UIManager', 'Drop zone clicked');
            fileInput.click();
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const file = e.dataTransfer.files[0];
            if (file) {
                DEBUG.log('UIManager', `File dropped: ${file.name}`);
                this.handleFileUpload(file);
            }
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                DEBUG.log('UIManager', `File selected: ${file.name}`);
                this.handleFileUpload(file);
            }
            fileInput.value = '';
        });
        
        DEBUG.log('UIManager', 'File upload setup complete');
    }

    setupDataSourceConnections() {
        DEBUG.log('UIManager', 'Setting up data source connections...');
        
        document.getElementById('azureForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAzureConnect();
        });
        
        document.getElementById('s3Form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleS3Connect();
        });
        
        document.getElementById('googleSheetsForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleGoogleSheetsConnect();
        });
        
        document.getElementById('databaseForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleDatabaseConnect();
        });
        
        document.getElementById('apiForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAPIConnect();
        });
        
        document.getElementById('apiMethod')?.addEventListener('change', (e) => {
            const bodyGroup = document.getElementById('apiBodyGroup');
            if (bodyGroup) {
                bodyGroup.style.display = e.target.value === 'POST' ? 'block' : 'none';
            }
        });
    }

    async handleAzureConnect() {
        try {
            this.showLoading();
            
            const config = {
                accountName: document.getElementById('azureAccount').value,
                containerName: document.getElementById('azureContainer').value,
                blobName: document.getElementById('azureBlob').value,
                sasToken: document.getElementById('azureSAS').value
            };
            
            const file = await this.dataConnector.connectAzureBlob(config);
            await this.dataService.loadData(file);
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    async handleS3Connect() {
        try {
            this.showLoading();
            
            const config = {
                bucket: document.getElementById('s3Bucket').value,
                key: document.getElementById('s3Key').value,
                presignedUrl: document.getElementById('s3PresignedUrl').value
            };
            
            const file = await this.dataConnector.connectAWS_S3(config);
            await this.dataService.loadData(file);
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    async handleGoogleSheetsConnect() {
        try {
            this.showLoading();
            
            const config = {
                sheetId: document.getElementById('gSheetId').value,
                apiKey: document.getElementById('gApiKey').value,
                range: document.getElementById('gRange').value
            };
            
            const dataset = await this.dataConnector.connectGoogleSheets(config);
            this.dataService.currentDataset = dataset;
            this.dataService.emit('data:loaded', { data: dataset });
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    async handleDatabaseConnect() {
        try {
            this.showLoading();
            
            const headers = {};
            const auth = document.getElementById('dbAuth').value;
            if (auth) headers['Authorization'] = auth;
            
            const config = {
                url: document.getElementById('dbApiUrl').value,
                method: 'POST',
                headers,
                body: {
                    dbType: document.getElementById('dbType').value,
                    query: document.getElementById('dbQuery').value
                }
            };
            
            const dataset = await this.dataConnector.connectAPI(config);
            this.dataService.currentDataset = dataset;
            this.dataService.emit('data:loaded', { data: dataset });
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    async handleAPIConnect() {
        try {
            this.showLoading();
            
            const headersText = document.getElementById('apiHeaders').value;
            const headers = headersText ? JSON.parse(headersText) : {};
            
            const config = {
                url: document.getElementById('apiUrl').value,
                method: document.getElementById('apiMethod').value,
                headers
            };
            
            if (config.method === 'POST') {
                const bodyText = document.getElementById('apiBody').value;
                config.body = bodyText ? JSON.parse(bodyText) : null;
            }
            
            const dataset = await this.dataConnector.connectAPI(config);
            this.dataService.currentDataset = dataset;
            this.dataService.emit('data:loaded', { data: dataset });
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    setupDataListeners() {
        DEBUG.log('UIManager', 'Setting up data listeners...');
        
        this.dataService.on('data:loading', () => {
            DEBUG.log('UIManager', 'Data loading event received');
            this.showLoading();
        });
        
        this.dataService.on('data:loaded', (event) => {
            DEBUG.log('UIManager', 'Data loaded event received');
            this.handleDataLoaded(event.data);
        });
        
        this.dataService.on('data:error', (event) => {
            DEBUG.log('UIManager', 'Data error event received');
            this.showError(event.error.message);
        });
    }

    switchModule(moduleId) {
        DEBUG.log('UIManager', `Switching to module: ${moduleId}`);
        
        const requiresData = ['plotManager', 'riskAnalytics', 'portfolioManager', 'strategyBacktest', 'aiInsights'];
        
        if (requiresData.includes(moduleId) && !this.dataService.getCurrentDataset()) {
            DEBUG.log('UIManager', 'Module requires data but none loaded');
            Notification.warning('Please load data first before accessing this module');
            return;
        }

        document.querySelectorAll('.btn-tool').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-module="${moduleId}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        document.querySelectorAll('.module-content').forEach(module => {
            module.style.display = 'none';
        });

        const moduleElement = document.getElementById(`${moduleId}Module`);
        if (moduleElement) {
            moduleElement.style.display = 'block';
            DEBUG.log('UIManager', `Module ${moduleId} displayed`);
        } else {
            DEBUG.error('UIManager', `Module element not found: ${moduleId}Module`);
        }

        this.activeModule = moduleId;

        if (moduleId === 'plotManager') this.initializePlotModule();
        else if (moduleId === 'riskAnalytics') this.initializeRiskModule();
        else if (moduleId === 'portfolioManager') this.initializePortfolioModule();
        else if (moduleId === 'strategyBacktest') this.initializeStrategyModule();
        else if (moduleId === 'aiInsights') this.initializeAIModule();
    }

    async handleFileUpload(file) {
        DEBUG.log('UIManager', `Handling file upload: ${file.name}`);
        
        try {
            await this.dataService.loadData(file);
        } catch (error) {
            DEBUG.error('UIManager', 'File upload failed', error);
            this.showError(`Failed to load data: ${error.message}`);
        }
    }

    handleDataLoaded(dataset) {
        DEBUG.log('UIManager', 'Handling data loaded');
        
        this.hideLoading();
        this.showDataPreview(dataset);
        this.enableDataDependentModules();
        Notification.success('Data loaded successfully!');
    }

    showDataPreview(dataset) {
        DEBUG.log('UIManager', 'Showing data preview');
        
        const welcome = document.getElementById('welcomeScreen');
        const preview = document.getElementById('dataPreview');
        
        if (welcome) welcome.style.display = 'none';
        if (preview) {
            preview.style.display = 'block';
            this.renderDataTable(dataset);
            this.renderDatasetInfo(dataset);
        }
    }

    renderDataTable(dataset) {
        DEBUG.log('UIManager', 'Rendering data table');
        
        const container = document.getElementById('dataTable');
        if (!container || !dataset.headers || !dataset.rows) {
            DEBUG.error('UIManager', 'Cannot render table - missing container or data');
            return;
        }

        const table = document.createElement('table');
        table.className = 'table table-dark table-sm table-striped';
        
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        dataset.headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            th.style.position = 'sticky';
            th.style.top = '0';
            th.style.backgroundColor = '#343a40';
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        const rowsToShow = dataset.rows.slice(0, 50);
        
        rowsToShow.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell !== null && cell !== undefined ? cell : '';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        container.innerHTML = '';
        container.appendChild(table);
        
        if (dataset.rows.length > 50) {
            const info = document.createElement('div');
            info.className = 'text-muted mt-2 small text-center';
            info.textContent = `Showing first 50 rows of ${dataset.rows.length} total rows`;
            container.appendChild(info);
        }
        
        DEBUG.log('UIManager', 'Data table rendered');
    }

    renderDatasetInfo(dataset) {
        DEBUG.log('UIManager', 'Rendering dataset info');
        
        const container = document.getElementById('datasetInfo');
        if (!container) return ;

        const numericColumns = this.dataService.getNumericColumns();
        
        container.innerHTML = `
            <div class="card bg-dark text-light">
                <div class="card-header">
                    <h6 class="mb-0"><i class="fas fa-info-circle mr-2"></i>Dataset Information</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-6"><strong>Rows:</strong> ${dataset.rows.length.toLocaleString()}</div>
                        <div class="col-6"><strong>Columns:</strong> ${dataset.headers.length}</div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6"><strong>Numeric:</strong> ${numericColumns.length}</div>
                        <div class="col-6"><strong>Text:</strong> ${dataset.headers.length - numericColumns.length}</div>
                    </div>
                    <hr>
                    <h6>Columns</h6>
                    <div class="column-list" style="max-height: 200px; overflow-y: auto;">
                        ${dataset.headers.map(header => {
                            const isNumeric = numericColumns.includes(header);
                            const icon = isNumeric ? 'fa-hashtag' : 'fa-font';
                            return `<div class="mb-1"><i class="fas ${icon} mr-2 text-muted"></i>${header}</div>`;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    enableDataDependentModules() {
        DEBUG.log('UIManager', 'Enabling data-dependent modules');
        
        const moduleIds = ['plotManager', 'riskAnalytics', 'portfolioManager', 'strategyBacktest', 'aiInsights'];
        moduleIds.forEach(id => {
            const button = document.querySelector(`[data-module="${id}"]`);
            if (button) {
                button.disabled = false;
                DEBUG.log('UIManager', `Enabled module: ${id}`);
            }
        });
    }

    initializePlotModule() {
        DEBUG.log('UIManager', 'Initializing plot module');
        
        const plotColumn = document.getElementById('plotColumn');
        if (plotColumn) {
            const numericColumns = this.dataService.getNumericColumns();
            plotColumn.innerHTML = '<option value="">Choose a column...</option>' +
                numericColumns.map(col => `<option value="${col}">${col}</option>`).join('');
        }
    }

    initializeRiskModule() {
        DEBUG.log('UIManager', 'Initializing risk module');
        
        const riskColumn = document.getElementById('riskColumn');
        if (riskColumn) {
            const numericColumns = this.dataService.getNumericColumns();
            riskColumn.innerHTML = '<option value="">Choose a column...</option>' +
                numericColumns.map(col => `<option value="${col}">${col}</option>`).join('');
        }
    }

    initializePortfolioModule() {
        DEBUG.log('UIManager', 'Initializing portfolio module');
        
        const assetSelection = document.getElementById('assetSelection');
        if (assetSelection) {
            const numericColumns = this.dataService.getNumericColumns();
            assetSelection.innerHTML = numericColumns.map(col => 
                `<option value="${col}">${col}</option>`).join('');
        }
    }

    initializeStrategyModule() {
        DEBUG.log('UIManager', 'Initializing strategy module');
        
        const priceColumn = document.getElementById('priceColumn');
        if (priceColumn) {
            const numericColumns = this.dataService.getNumericColumns();
            priceColumn.innerHTML = '<option value="">Choose a column...</option>' +
                numericColumns.map(col => `<option value="${col}">${col}</option>`).join('');
        }
    }

    initializeAIModule() {
        DEBUG.log('UIManager', 'Initializing AI module');
        
        const dataset = this.dataService.getCurrentDataset();
        if (dataset) {
            this.showAIOptions();
        } else {
            this.showNoDataMessage();
        }
    }

    generateChart() {
        DEBUG.log('UIManager', 'Generate chart clicked');
        
        const columnName = document.getElementById('plotColumn')?.value;
        const chartType = document.getElementById('chartType')?.value || 'line';
        
        DEBUG.log('UIManager', `Chart config: column=${columnName}, type=${chartType}`);
        
        if (!columnName) {
            Notification.warning('Please select a column to plot');
            return;
        }

        const data = this.dataService.getColumnData(columnName);
        DEBUG.log('UIManager', `Retrieved ${data.length} data points`);
        
        if (data.length === 0) {
            Notification.error('No numeric data found in selected column');
            return;
        }

        this.createChart(data, columnName, chartType);
    }

    createChart(data, label, type) {
        DEBUG.log('UIManager', `Creating chart: ${type} chart with ${data.length} points`);
        
        const ctx = document.getElementById('dataChart');
        if (!ctx) {
            DEBUG.error('UIManager', 'Canvas element not found');
            Notification.error('Chart canvas not found');
            return;
        }

        if (typeof Chart === 'undefined') {
            DEBUG.log('UIManager', 'Chart.js not loaded yet, retrying...');
            setTimeout(() => this.createChart(data, label, type), 100);
            return;
        }

        try {
            if (this.currentChart) {
                DEBUG.log('UIManager', 'Destroying existing chart');
                this.currentChart.destroy();
            }

            const chartData = {
                labels: data.map((_, i) => i + 1),
                datasets: [{
                    label: label,
                    data: data,
                    borderColor: '#007bff',
                    backgroundColor: type === 'bar' ? '#007bff' : 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 2,
                    fill: type === 'line'
                }]
            };

            this.currentChart = new Chart(ctx, {
                type: type,
                data: chartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#fff' }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: '#fff' }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: '#fff' } }
                    }
                }
            });

            DEBUG.log('UIManager', 'Chart created successfully');
            Notification.success('Chart generated successfully!');
            
        } catch (error) {
            DEBUG.error('UIManager', 'Chart creation failed', error);
            Notification.error('Failed to create chart: ' + error.message);
        }
    }

    calculateRiskMetrics() {
        DEBUG.log('UIManager', 'Calculate risk metrics clicked');
        
        const columnName = document.getElementById('riskColumn')?.value;
        
        if (!columnName) {
            Notification.warning('Please select a column for risk analysis');
            return;
        }

        const data = this.dataService.getColumnData(columnName);
        if (data.length < 10) {
            Notification.error('Insufficient data for risk analysis (minimum 10 points required)');
            return;
        }

        const metrics = this.analyticsService.calculateRiskMetrics(data);
        if (!metrics) {
            Notification.error('Failed to calculate risk metrics');
            return;
        }

        this.displayRiskMetrics(metrics);
    }

    displayRiskMetrics(metrics) {
        DEBUG.log('UIManager', 'Displaying risk metrics', metrics);
        
        const container = document.getElementById('riskMetrics');
        if (!container) return;

        container.innerHTML = `
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-value">${(metrics.mean * 100).toFixed(2)}%</div>
                    <div class="metric-label">Annual Return</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-value">${(metrics.volatility * 100).toFixed(2)}%</div>
                    <div class="metric-label">Volatility</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-value">${metrics.sharpeRatio.toFixed(3)}</div>
                    <div class="metric-label">Sharpe Ratio</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-value">${(metrics.var95 * 100).toFixed(2)}%</div>
                    <div class="metric-label">VaR (95%)</div>
                </div>
            </div>
        `;

        Notification.success('Risk metrics calculated successfully!');
    }

    optimizePortfolio() {
        DEBUG.log('UIManager', 'Optimize portfolio clicked');
        
        const selectedAssets = Array.from(document.getElementById('assetSelection')?.selectedOptions || [])
            .map(option => option.value);
        const method = document.getElementById('optimizationMethod')?.value || 'equalWeight';

        DEBUG.log('UIManager', `Selected assets: ${selectedAssets.join(', ')}, method: ${method}`);

        if (selectedAssets.length < 2) {
            Notification.warning('Please select at least 2 assets for portfolio optimization');
            return;
        }

        const returnsData = selectedAssets.map(asset => {
            const prices = this.dataService.getColumnData(asset);
            return this.analyticsService.calculateReturns(prices);
        });

        const result = this.analyticsService.optimizePortfolio(returnsData, method);
        this.displayPortfolioResults(selectedAssets, result);
    }

    displayPortfolioResults(assets, result) {
        DEBUG.log('UIManager', 'Displaying portfolio results');
        
        const container = document.getElementById('portfolioResults');
        if (!container) return;

        container.style.display = 'block';
        container.innerHTML = `
            <h6><i class="fas fa-chart-pie mr-2"></i>Optimization Results</h6>
            <div class="row">
                <div class="col-md-6">
                    <h6>Asset Weights:</h6>
                    ${assets.map((asset, i) => `
                        <div class="d-flex justify-content-between mb-2">
                            <span>${asset}:</span>
                            <span class="font-weight-bold">${(result.weights[i] * 100).toFixed(2)}%</span>
                        </div>
                    `).join('')}
                </div>
                <div class="col-md-6">
                    <div class="metric-card">
                        <div class="metric-value">${(result.expectedReturn * 100).toFixed(2)}%</div>
                        <div class="metric-label">Expected Return</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${(result.volatility * 100).toFixed(2)}%</div>
                        <div class="metric-label">Portfolio Volatility</div>
                    </div>
                </div>
            </div>
        `;

        Notification.success('Portfolio optimized successfully!');
    }

    runBacktest() {
        DEBUG.log('UIManager', 'Run backtest clicked');
        
        const columnName = document.getElementById('priceColumn')?.value;
        const strategyType = document.getElementById('strategyType')?.value || 'buyhold';
        const param = parseInt(document.getElementById('strategyParam')?.value) || 20;

        DEBUG.log('UIManager', `Backtest config: column=${columnName}, strategy=${strategyType}, param=${param}`);

        if (!columnName) {
            Notification.warning('Please select a price column for backtesting');
            return;
        }

        const prices = this.dataService.getColumnData(columnName);
        if (prices.length < 50) {
            Notification.error('Insufficient data for backtesting (minimum 50 points required)');
            return;
        }

        const result = this.runStrategy(prices, strategyType, param);
        this.displayBacktestResults(result);
    }

    runStrategy(prices, strategyType, param) {
        DEBUG.log('UIManager', `Running ${strategyType} strategy`);
        
        let signals = [];
        let position = 0;
        let cash = 10000;
        let portfolio = [];

        switch (strategyType) {
            case 'buyhold':
                signals = new Array(prices.length).fill(1);
                break;
            case 'sma':
                const sma = this.analyticsService.calculateMovingAverage(prices, param);
                signals = prices.map((price, i) => {
                    if (i < param) return 0;
                    return price > sma[i - param] ? 1 : 0;
                });
                break;
            case 'momentum':
                signals = prices.map((price, i) => {
                    if (i < param) return 0;
                    const pastPrice = prices[i - param];
                    return price > pastPrice ? 1 : 0;
                });
                break;
            default:
                signals = new Array(prices.length).fill(1);
        }

        for (let i = 0; i < prices.length; i++) {
            const signal = signals[i];
            const price = prices[i];

            if (signal === 1 && position === 0) {
                position = cash / price;
                cash = 0;
            } else if (signal === 0 && position > 0) {
                cash = position * price;
                position = 0;
            }

            const portfolioValue = cash + (position * price);
            portfolio.push(portfolioValue);
        }

        const returns = this.analyticsService.calculateReturns(portfolio);
        const metrics = this.analyticsService.calculateRiskMetrics(portfolio);

        return {
            portfolioValues: portfolio,
            returns: returns,
            metrics: metrics,
            finalValue: portfolio[portfolio.length - 1]
        };
    }

    displayBacktestResults(result) {
        DEBUG.log('UIManager', 'Displaying backtest results');
        
        const container = document.getElementById('backtestResults');
        if (!container) return;

        const totalReturn = ((result.finalValue - 10000) / 10000) * 100;

        container.innerHTML = `
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-value">${totalReturn.toFixed(2)}%</div>
                    <div class="metric-label">Total Return</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-value">${(result.metrics.volatility * 100).toFixed(2)}%</div>
                    <div class="metric-label">Volatility</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-value">${result.metrics.sharpeRatio.toFixed(3)}</div>
                    <div class="metric-label">Sharpe Ratio</div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-value">${(result.metrics.maxDrawdown * 100).toFixed(2)}%</div>
                    <div class="metric-label">Max Drawdown</div>
                </div>
            </div>
        `;

        Notification.success('Backtest completed successfully!');
    }

    async handleAIAnalysis() {
        DEBUG.log('UIManager', 'AI analysis clicked');
        
        const container = document.getElementById('aiInsightsContainer');
        const query = document.getElementById('aiQuery')?.value || '';
        const dataset = this.dataService.getCurrentDataset();

        if (!dataset) {
            this.showNoDataMessage();
            return;
        }

        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary mb-3"></div>
                <p class="text-muted">AI is analyzing your data...</p>
            </div>
        `;

        await new Promise(resolve => setTimeout(resolve, 2000));

        const numericColumns = this.dataService.getNumericColumns();
        const analysis = this.generateAdvancedAnalysis(dataset, numericColumns, query);

        container.innerHTML = `
            <div class="card bg-dark text-light">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0"><i class="fas fa-brain mr-2"></i>AI Analysis Result</h6>
                    <small class="text-muted">${new Date().toLocaleString()}</small>
                </div>
                <div class="card-body">
                    <div class="analysis-content">${analysis}</div>
                </div>
            </div>
        `;
    }

    generateAdvancedAnalysis(dataset, numericColumns, query) {
        const insights = [];
        
        insights.push(`<h6>Dataset Overview</h6>`);
        insights.push(`<p>Your dataset contains ${dataset.rows.length.toLocaleString()} observations across ${dataset.headers.length} variables. Of these, ${numericColumns.length} are numeric and suitable for quantitative analysis.</p>`);

        if (numericColumns.length > 0) {
            insights.push(`<h6>Quantitative Analysis</h6>`);
            insights.push(`<p>The numeric columns (${numericColumns.join(', ')}) can be used for:</p>`);
            insights.push(`<ul>
                <li>Risk-return analysis and portfolio optimization</li>
                <li>Statistical modeling and correlation analysis</li>
                <li>Time series analysis if data is sequential</li>
                <li>Strategy backtesting and performance evaluation</li>
            </ul>`);
        }

        if (query) {
            insights.push(`<h6>Response to Your Query</h6>`);
            insights.push(`<p><em>"${query}"</em></p>`);
            
            if (query.toLowerCase().includes('risk')) {
                insights.push(`<p>For risk analysis, I recommend focusing on the volatility patterns in your numeric columns. Consider calculating Value at Risk (VaR) and examining correlation structures between assets.</p>`);
            } else if (query.toLowerCase().includes('portfolio')) {
                insights.push(`<p>For portfolio analysis, you can use the Portfolio Optimization module to explore different allocation strategies. Consider comparing equal-weight, minimum volatility, and maximum Sharpe ratio approaches.</p>`);
            } else if (query.toLowerCase().includes('trend')) {
                insights.push(`<p>To identify trends, use the Visualizations module to create time series plots of your data. Look for momentum patterns and consider applying moving averages.</p>`);
            } else {
                insights.push(`<p>Based on your query, I suggest exploring the relationships between variables using correlation analysis and examining the statistical properties of your data.</p>`);
            }
        }

        insights.push(`<h6>Recommendations</h6>`);
        insights.push(`<ul>
            <li>Start with basic visualizations to understand data patterns</li>
            <li>Calculate risk metrics for each numeric variable</li>
            <li>If working with price data, consider log returns for analysis</li>
            <li>Use portfolio optimization to find efficient allocations</li>
            <li>Backtest any trading strategies before implementation</li>
        </ul>`);

        return insights.join('');
    }

    showAIOptions() {
        const container = document.getElementById('aiInsightsContainer');
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="fas fa-robot fa-3x mb-3"></i>
                <p>Ready for AI analysis. Enter your query above and click "Analyze with AI".</p>
            </div>
        `;
    }

    showNoDataMessage() {
        const container = document.getElementById('aiInsightsContainer');
        container.innerHTML = `
            <div class="text-center py-5 text-muted">
                <i class="fas fa-database fa-3x mb-3"></i>
                <p>Please load data first before using AI insights</p>
            </div>
        `;
    }

    showLoading() {
        const loading = document.getElementById('uploadLoading');
        if (loading) loading.style.display = 'block';
    }

    hideLoading() {
        const loading = document.getElementById('uploadLoading');
        if (loading) loading.style.display = 'none';
    }

    showError(message) {
        this.hideLoading();
        Notification.error(message);
    }
}

class Application {
    constructor() {
        // Load backend config
        const backendConfig = typeof BackendConfig !== 'undefined' ? BackendConfig.load() : { url: '', enabled: false };
        
        // Use Hybrid services if backend integration is loaded and enabled
        if (typeof HybridDataService !== 'undefined' && backendConfig.enabled && backendConfig.url) {
            DEBUG.log('Application', `Initializing with backend: ${backendConfig.url}`);
            this.dataService = new HybridDataService(backendConfig.url);
            this.analyticsService = new HybridAnalyticsService(this.dataService);
        } else {
            DEBUG.log('Application', 'Initializing in frontend-only mode');
            this.dataService = new DataService();
            this.analyticsService = new AnalyticsService();
        }
        
        this.uiManager = null;
        this.initialized = false;
        DEBUG.log('Application', 'Constructor called');
    }

    async initialize() {
        if (this.initialized) {
            DEBUG.log('Application', 'Already initialized');
            return;
        }

        try {
            DEBUG.log('Application', 'Starting initialization...');
            
            await this.dataService.initialize();
            await this.analyticsService.initialize();
            
            this.uiManager = new UIManager(this.dataService, this.analyticsService);
            await this.uiManager.initialize();
            
            this.initialized = true;
            
            // Show backend status
            if (this.dataService.isUsingBackend && this.dataService.isUsingBackend()) {
                const status = this.dataService.getBackendStatus();
                console.log('%c✓ Application Ready (Backend Mode)', 'color: green; font-size: 16px; font-weight: bold');
                console.log('%cBackend: ' + status.url, 'color: cyan');
            } else {
                console.log('%c✓ Application Ready (Frontend Mode)', 'color: green; font-size: 16px; font-weight: bold');
            }
            
            console.log('%cDebug Console Available:', 'color: blue; font-weight: bold');
            console.log('  window.DEBUG.getLogs() - View all logs');
            console.log('  window.DEBUG.getErrors() - View all errors');
            console.log('  window.DEBUG.exportDebugInfo() - Export debug data');
            
            window.app = this;
            window.DEBUG = DEBUG;
            
        } catch (error) {
            DEBUG.error('Application', 'Initialization failed', error);
            this.showErrorBoundary(error);
        }
    }

    showErrorBoundary(error) {
        const errorBoundary = document.getElementById('error-boundary');
        if (errorBoundary) {
            errorBoundary.style.display = 'block';
            const errorDetails = document.getElementById('errorDetails');
            if (errorDetails) {
                errorDetails.textContent = error.message + '\n' + (error.stack || '');
            }
        }
    }
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', async () => {
    DEBUG.log('Bootstrap', 'DOM Content Loaded');
    
    try {
        if (typeof particlesJS !== 'undefined') {
            DEBUG.log('Bootstrap', 'Initializing particles...');
            particlesJS("particles-js", {
                particles: {
                    number: { value: 80, density: { enable: true, value_area: 800 } },
                    color: { value: ["#007bff", "#6610f2", "#6f42c1"] },
                    shape: { type: "circle" },
                    opacity: { value: 0.5, random: true },
                    size: { value: 3, random: true },
                    line_linked: { enable: true, distance: 150, color: "#6dcfe7", opacity: 0.4, width: 1 },
                    move: { enable: true, speed: 2, direction: "none", random: true }
                },
                interactivity: {
                    detect_on: "canvas",
                    events: { onhover: { enable: true, mode: "grab" }, onclick: { enable: true, mode: "push" } },
                    modes: { grab: { distance: 140 }, push: { particles_nb: 4 } }
                },
                retina_detect: true
            });
        }

        DEBUG.log('Bootstrap', `Chart.js available: ${typeof Chart !== 'undefined'}`);
        DEBUG.log('Bootstrap', `XLSX available: ${typeof XLSX !== 'undefined'}`);

        const app = new Application();
        await app.initialize();
        
    } catch (error) {
        DEBUG.error('Bootstrap', 'Failed to start application', error);
        console.error('FATAL ERROR:', error);
    }
});

window.Application = Application;
window.Notification = Notification;
window.DebugLogger = DebugLogger;
