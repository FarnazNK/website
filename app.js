// =============================================================================
// QUANTITATIVE PLATFORM - WORKING VERSION
// =============================================================================

// 1. BASE UTILITIES
// =============================================================================

class EventEmitter {
    constructor() {
        this.events = new Map();
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        if (!this.events.has(event)) return;
        const listeners = this.events.get(event);
        const index = listeners.indexOf(callback);
        if (index > -1) listeners.splice(index, 1);
    }

    emit(event, data = null) {
        if (!this.events.has(event)) return;
        this.events.get(event).forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Event error for ${event}:`, error);
            }
        });
    }
}

class Notification {
    constructor(options = {}) {
        this.type = options.type || 'info';
        this.message = options.message || '';
        this.duration = options.duration || 5000;
    }

    show() {
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

// 2. DATA SERVICES
// =============================================================================

class DataService extends EventEmitter {
    constructor() {
        super();
        this.currentDataset = null;
    }

    async initialize() {
        console.log('✅ DataService initialized');
    }

    async loadData(file) {
        try {
            this.emit('data:loading', { filename: file.name });
            
            const dataset = await this.parseFile(file);
            this.currentDataset = dataset;
            
            this.emit('data:loaded', { data: dataset });
            return dataset;
        } catch (error) {
            this.emit('data:error', { error });
            throw error;
        }
    }

    async parseFile(file) {
        const text = await file.text();
        const extension = file.name.split('.').pop().toLowerCase();
        
        if (extension === 'csv') {
            return this.parseCSV(text);
        } else if (extension === 'json') {
            return JSON.parse(text);
        } else {
            throw new Error('Unsupported file format');
        }
    }

    parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) throw new Error('Empty CSV file');

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = lines.slice(1).map(line => {
            return line.split(',').map(cell => {
                const trimmed = cell.trim().replace(/"/g, '');
                const num = parseFloat(trimmed);
                return isNaN(num) ? trimmed : num;
            });
        });
        
        return { headers, rows };
    }

    getCurrentDataset() {
        return this.currentDataset;
    }

    getNumericColumns() {
        if (!this.currentDataset) return [];
        return this.currentDataset.headers.filter((header, index) => {
            return this.currentDataset.rows.some(row => typeof row[index] === 'number');
        });
    }

    getColumnData(columnName) {
        if (!this.currentDataset) return [];
        const index = this.currentDataset.headers.indexOf(columnName);
        if (index === -1) return [];
        return this.currentDataset.rows.map(row => row[index]).filter(val => typeof val === 'number');
    }
}

class AnalyticsService extends EventEmitter {
    constructor() {
        super();
    }

    async initialize() {
        console.log('📊 AnalyticsService initialized');
    }

    calculateReturns(prices, type = 'simple') {
        if (!Array.isArray(prices) || prices.length < 2) return [];
        
        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            if (type === 'simple') {
                returns.push((prices[i] - prices[i-1]) / prices[i-1]);
            } else if (type === 'log') {
                returns.push(Math.log(prices[i] / prices[i-1]));
            }
        }
        return returns;
    }

    calculateRiskMetrics(data) {
        if (!Array.isArray(data) || data.length < 2) return null;
        
        const returns = this.calculateReturns(data);
        const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
        const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (returns.length - 1);
        const volatility = Math.sqrt(variance);
        const annualizedVol = volatility * Math.sqrt(252);
        
        const sortedReturns = [...returns].sort((a, b) => a - b);
        const var95 = -sortedReturns[Math.floor(0.05 * sortedReturns.length)];
        const var99 = -sortedReturns[Math.floor(0.01 * sortedReturns.length)];
        
        return {
            mean: mean * 252,
            volatility: annualizedVol,
            var95: var95,
            var99: var99,
            sharpeRatio: annualizedVol > 0 ? (mean * 252) / annualizedVol : 0,
            maxDrawdown: this.calculateMaxDrawdown(data)
        };
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
        const result = [];
        for (let i = period - 1; i < data.length; i++) {
            const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
            result.push(sum / period);
        }
        return result;
    }

    optimizePortfolio(returns, method = 'equalWeight') {
        const numAssets = returns.length;
        let weights;

        switch (method) {
            case 'equalWeight':
                weights = new Array(numAssets).fill(1 / numAssets);
                break;
            case 'minVolatility':
                // Simplified minimum volatility (equal weight for demo)
                weights = new Array(numAssets).fill(1 / numAssets);
                break;
            case 'maxSharpe':
                // Simplified max Sharpe (equal weight for demo)
                weights = new Array(numAssets).fill(1 / numAssets);
                break;
            case 'riskParity':
                // Simplified risk parity (equal weight for demo)
                weights = new Array(numAssets).fill(1 / numAssets);
                break;
            default:
                weights = new Array(numAssets).fill(1 / numAssets);
        }

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
        return portfolioReturn * 252; // Annualized
    }

    calculatePortfolioVolatility(returns, weights) {
        // Simplified volatility calculation
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

// 3. UI MANAGER WITH ALL MODULES
// =============================================================================

class UIManager {
    constructor(dataService, analyticsService) {
        this.dataService = dataService;
        this.analyticsService = analyticsService;
        this.activeModule = 'dataManager';
        this.currentChart = null;
        
        this.setupEventListeners();
    }

    async initialize() {
        this.setupFileUpload();
        this.setupDataListeners();
        this.createMissingModules(); // Create the missing module HTML
        console.log('🎨 UI initialized');
    }

    createMissingModules() {
        const container = document.getElementById('moduleContainer');
        if (!container) return;

        // Add missing modules HTML
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
                            <option value="histogram">Histogram</option>
                        </select>
                    </div>
                </div>
                <button class="btn btn-primary mb-3" id="generateChart">
                    <i class="fas fa-chart-line mr-2"></i>Generate Chart
                </button>
                <div class="chart-container">
                    <canvas id="dataChart" width="400" height="200"></canvas>
                </div>
            </div>

            <!-- Risk Analytics Module -->
            <div class="module-content" id="riskAnalyticsModule" style="display: none;">
                <h4><i class="fas fa-calculator mr-2"></i>Risk Analytics</h4>
                <div class="row mb-4">
                    <div class="col-md-6">
                        <label>Price/Returns Column:</label>
                        <select class="form-control" id="riskColumn">
                            <option value="">Choose a column...</option>
                        </select>
                    </div>
                    <div class="col-md-6">
                        <label>Analysis Period:</label>
                        <select class="form-control" id="riskPeriod">
                            <option value="30">30 Days</option>
                            <option value="60">60 Days</option>
                            <option value="90" selected>90 Days</option>
                            <option value="252">1 Year</option>
                        </select>
                    </div>
                </div>
                <button class="btn btn-primary mb-3" id="calculateRisk">
                    <i class="fas fa-calculator mr-2"></i>Calculate Risk Metrics
                </button>
                <div class="row" id="riskMetrics">
                    <!-- Risk metrics will be populated here -->
                </div>
            </div>

            <!-- Portfolio Optimization Module -->
            <div class="module-content" id="portfolioManagerModule" style="display: none;">
                <h4><i class="fas fa-briefcase mr-2"></i>Portfolio Optimization</h4>
                <div class="portfolio-section">
                    <h6>Asset Selection</h6>
                    <div class="row mb-3">
                        <div class="col-md-8">
                            <label>Select Assets (hold Ctrl to select multiple):</label>
                            <select class="form-control" id="assetSelection" multiple size="5">
                                <!-- Will be populated with numeric columns -->
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label>Optimization Method:</label>
                            <select class="form-control" id="optimizationMethod">
                                <option value="equalWeight">Equal Weight</option>
                                <option value="minVolatility">Minimum Volatility</option>
                                <option value="maxSharpe">Maximum Sharpe Ratio</option>
                                <option value="riskParity">Risk Parity</option>
                            </select>
                            <button class="btn btn-success mt-3 w-100" id="optimizePortfolio">
                                <i class="fas fa-magic mr-2"></i>Optimize Portfolio
                            </button>
                        </div>
                    </div>
                </div>
                <div class="optimization-result" id="portfolioResults" style="display: none;">
                    <!-- Optimization results will appear here -->
                </div>
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
                        <input type="number" class="form-control" id="strategyParam" placeholder="e.g., 20 for 20-day MA" value="20">
                    </div>
                </div>
                <button class="btn btn-primary mb-3" id="runBacktest">
                    <i class="fas fa-play mr-2"></i>Run Backtest
                </button>
                <div class="row" id="backtestResults">
                    <!-- Backtest results will be populated here -->
                </div>
            </div>
        `;

        // Insert the modules before the existing aiInsightsModule
        const aiModule = document.getElementById('aiInsightsModule');
        if (aiModule) {
            aiModule.insertAdjacentHTML('beforebegin', modulesHTML);
        }

        // Setup module-specific event listeners
        this.setupModuleEventListeners();
    }

    setupEventListeners() {
        // Toolbar navigation
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-tool')) {
                const button = e.target.closest('.btn-tool');
                const module = button.dataset.module;
                if (!button.disabled) {
                    this.switchModule(module);
                }
            }
        });
    }

    setupModuleEventListeners() {
        // Charts module
        document.addEventListener('click', (e) => {
            if (e.target.id === 'generateChart') {
                this.generateChart();
            } else if (e.target.id === 'calculateRisk') {
                this.calculateRiskMetrics();
            } else if (e.target.id === 'optimizePortfolio') {
                this.optimizePortfolio();
            } else if (e.target.id === 'runBacktest') {
                this.runBacktest();
            } else if (e.target.id === 'analyzeBtn') {
                this.handleAIAnalysis();
            }
        });
    }

    setupFileUpload() {
        const dropZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');
        const browseBtn = document.getElementById('browseFiles');

        if (!dropZone || !fileInput || !browseBtn) return;

        // Click to browse
        browseBtn.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('click', () => fileInput.click());

        // Drag and drop
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
            if (file) this.handleFileUpload(file);
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.handleFileUpload(file);
        });
    }

    setupDataListeners() {
        this.dataService.on('data:loading', () => this.showLoading());
        this.dataService.on('data:loaded', (event) => this.handleDataLoaded(event.data));
        this.dataService.on('data:error', (event) => this.showError(event.error.message));
    }

    switchModule(moduleId) {
        // Check if module requires data
        const requiresData = ['plotManager', 'riskAnalytics', 'portfolioManager', 'strategyBacktest', 'aiInsights'];
        
        if (requiresData.includes(moduleId) && !this.dataService.getCurrentDataset()) {
            Notification.warning('Please load data first before accessing this module');
            return;
        }

        // Update active toolbar button
        document.querySelectorAll('.btn-tool').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-module="${moduleId}"]`)?.classList.add('active');

        // Show appropriate module content
        document.querySelectorAll('.module-content').forEach(module => {
            module.style.display = 'none';
        });

        const moduleElement = document.getElementById(`${moduleId}Module`);
        if (moduleElement) {
            moduleElement.style.display = 'block';
        }

        this.activeModule = moduleId;

        // Initialize module-specific functionality
        if (moduleId === 'plotManager') {
            this.initializePlotModule();
        } else if (moduleId === 'riskAnalytics') {
            this.initializeRiskModule();
        } else if (moduleId === 'portfolioManager') {
            this.initializePortfolioModule();
        } else if (moduleId === 'strategyBacktest') {
            this.initializeStrategyModule();
        } else if (moduleId === 'aiInsights') {
            this.initializeAIModule();
        }
    }

    async handleFileUpload(file) {
        try {
            await this.dataService.loadData(file);
        } catch (error) {
            this.showError(`Failed to load data: ${error.message}`);
        }
    }

    handleDataLoaded(dataset) {
        this.hideLoading();
        this.showDataPreview(dataset);
        this.enableDataDependentModules();
        Notification.success('Data loaded successfully!');
    }

    showDataPreview(dataset) {
        // Hide welcome screen and show preview
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
        const container = document.getElementById('dataTable');
        if (!container || !dataset.headers || !dataset.rows) return;

        const table = document.createElement('table');
        table.className = 'table table-dark table-sm table-striped';
        
        // Header
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
        
        // Body (first 50 rows)
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
        
        // Row count info
        if (dataset.rows.length > 50) {
            const info = document.createElement('div');
            info.className = 'text-muted mt-2 small text-center';
            info.textContent = `Showing first 50 rows of ${dataset.rows.length} total rows`;
            container.appendChild(info);
        }
    }

    renderDatasetInfo(dataset) {
        const container = document.getElementById('datasetInfo');
        if (!container) return;

        const numericColumns = this.dataService.getNumericColumns();
        
        container.innerHTML = `
            <div class="card bg-dark text-light">
                <div class="card-header">
                    <h6 class="mb-0"><i class="fas fa-info-circle mr-2"></i>Dataset Information</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-6">
                            <strong>Rows:</strong> ${dataset.rows.length.toLocaleString()}
                        </div>
                        <div class="col-6">
                            <strong>Columns:</strong> ${dataset.headers.length}
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">
                            <strong>Numeric:</strong> ${numericColumns.length}
                        </div>
                        <div class="col-6">
                            <strong>Text:</strong> ${dataset.headers.length - numericColumns.length}
                        </div>
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
        const moduleIds = ['plotManager', 'riskAnalytics', 'portfolioManager', 'strategyBacktest', 'aiInsights'];
        moduleIds.forEach(id => {
            const button = document.querySelector(`[data-module="${id}"]`);
            if (button) button.disabled = false;
        });
    }

    // MODULE INITIALIZERS
    // ===================

    initializePlotModule() {
        const plotColumn = document.getElementById('plotColumn');
        if (plotColumn) {
            const numericColumns = this.dataService.getNumericColumns();
            plotColumn.innerHTML = '<option value="">Choose a column...</option>' +
                numericColumns.map(col => `<option value="${col}">${col}</option>`).join('');
        }
    }

    initializeRiskModule() {
        const riskColumn = document.getElementById('riskColumn');
        if (riskColumn) {
            const numericColumns = this.dataService.getNumericColumns();
            riskColumn.innerHTML = '<option value="">Choose a column...</option>' +
                numericColumns.map(col => `<option value="${col}">${col}</option>`).join('');
        }
    }

    initializePortfolioModule() {
        const assetSelection = document.getElementById('assetSelection');
        if (assetSelection) {
            const numericColumns = this.dataService.getNumericColumns();
            assetSelection.innerHTML = numericColumns.map(col => 
                `<option value="${col}">${col}</option>`).join('');
        }
    }

    initializeStrategyModule() {
        const priceColumn = document.getElementById('priceColumn');
        if (priceColumn) {
            const numericColumns = this.dataService.getNumericColumns();
            priceColumn.innerHTML = '<option value="">Choose a column...</option>' +
                numericColumns.map(col => `<option value="${col}">${col}</option>`).join('');
        }
    }

    initializeAIModule() {
        const dataset = this.dataService.getCurrentDataset();
        if (dataset) {
            this.showAIOptions();
        } else {
            this.showNoDataMessage();
        }
    }

    // MODULE FUNCTIONALITY
    // ====================

    generateChart() {
        const columnName = document.getElementById('plotColumn')?.value;
        const chartType = document.getElementById('chartType')?.value || 'line';
        
        if (!columnName) {
            Notification.warning('Please select a column to plot');
            return;
        }

        const data = this.dataService.getColumnData(columnName);
        if (data.length === 0) {
            Notification.error('No numeric data found in selected column');
            return;
        }

        this.createChart(data, columnName, chartType);
    }

    createChart(data, label, type) {
        const ctx = document.getElementById('dataChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.currentChart) {
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
            type: type === 'histogram' ? 'bar' : type,
            data: chartData,
            options: {
                responsive: true,
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

        Notification.success('Chart generated successfully!');
    }

    calculateRiskMetrics() {
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
        const selectedAssets = Array.from(document.getElementById('assetSelection')?.selectedOptions || [])
            .map(option => option.value);
        const method = document.getElementById('optimizationMethod')?.value || 'equalWeight';

        if (selectedAssets.length < 2) {
            Notification.warning('Please select at least 2 assets for portfolio optimization');
            return;
        }

        // Get returns data for selected assets
        const returnsData = selectedAssets.map(asset => {
            const prices = this.dataService.getColumnData(asset);
            return this.analyticsService.calculateReturns(prices);
        });

        const result = this.analyticsService.optimizePortfolio(returnsData, method);
        this.displayPortfolioResults(selectedAssets, result);
    }

    displayPortfolioResults(assets, result) {
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
        const columnName = document.getElementById('priceColumn')?.value;
        const strategyType = document.getElementById('strategyType')?.value || 'buyhold';
        const param = parseInt(document.getElementById('strategyParam')?.value) || 20;

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
        let signals = [];
        let position = 0;
        let cash = 10000;
        let portfolio = [];

        switch (strategyType) {
            case 'buyhold':
                // Simple buy and hold
                signals = new Array(prices.length).fill(1);
                break;
            case 'sma':
                // Simple moving average crossover
                const sma = this.analyticsService.calculateMovingAverage(prices, param);
                signals = prices.map((price, i) => {
                    if (i < param) return 0;
                    return price > sma[i - param] ? 1 : 0;
                });
                break;
            case 'momentum':
                // Simple momentum strategy
                signals = prices.map((price, i) => {
                    if (i < param) return 0;
                    const pastPrice = prices[i - param];
                    return price > pastPrice ? 1 : 0;
                });
                break;
            default:
                signals = new Array(prices.length).fill(1);
        }

        // Simulate trading
        for (let i = 0; i < prices.length; i++) {
            const signal = signals[i];
            const price = prices[i];

            if (signal === 1 && position === 0) {
                // Buy
                position = cash / price;
                cash = 0;
            } else if (signal === 0 && position > 0) {
                // Sell
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
        const container = document.getElementById('aiInsightsContainer');
        const query = document.getElementById('aiQuery')?.value || '';
        const dataset = this.dataService.getCurrentDataset();

        if (!dataset) {
            this.showNoDataMessage();
            return;
        }

        // Show loading
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary mb-3"></div>
                <p class="text-muted">AI is analyzing your data...</p>
            </div>
        `;

        // Simulate AI analysis
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
                    <div class="analysis-content">
                        ${analysis}
                    </div>
                </div>
            </div>
        `;
    }

    generateAdvancedAnalysis(dataset, numericColumns, query) {
        const insights = [];
        
        // Dataset overview
        insights.push(`<h6>Dataset Overview</h6>`);
        insights.push(`<p>Your dataset contains ${dataset.rows.length.toLocaleString()} observations across ${dataset.headers.length} variables. Of these, ${numericColumns.length} are numeric and suitable for quantitative analysis.</p>`);

        // Column analysis
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

        // Query-specific response
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

        // Recommendations
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

// 4. FILE UPLOAD MANAGER
// =============================================================================

class FileUploadManager {
    constructor() {
        this.options = null;
    }

    setup(options) {
        this.options = options;
    }

    async processFile(file) {
        try {
            this.validateFile(file);
            
            if (this.options?.onProgress) this.options.onProgress(50);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (this.options?.onProgress) this.options.onProgress(100);
            if (this.options?.onComplete) this.options.onComplete(file);
            
        } catch (error) {
            if (this.options?.onError) this.options.onError(error);
        }
    }

    validateFile(file) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        const supportedTypes = ['csv', 'json', 'xlsx'];
        
        if (file.size > maxSize) {
            throw new Error('File size exceeds 50MB limit');
        }

        const extension = file.name.split('.').pop().toLowerCase();
        if (!supportedTypes.includes(extension)) {
            throw new Error(`Unsupported file type: ${extension}`);
        }
    }
}

// 5. APPLICATION MAIN
// =============================================================================

class Application {
    constructor() {
        this.dataService = new DataService();
        this.analyticsService = new AnalyticsService();
        this.uiManager = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            console.log('🚀 Initializing Quantitative Platform...');
            
            // Initialize services
            await this.dataService.initialize();
            await this.analyticsService.initialize();
            
            // Initialize UI
            this.uiManager = new UIManager(this.dataService, this.analyticsService);
            await this.uiManager.initialize();
            
            this.initialized = true;
            
            console.log('✅ Application initialized successfully');
            
            // Make available for debugging
            window.app = this;
            
        } catch (error) {
            console.error('❌ Application initialization failed:', error);
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

// 6. INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize particles background
        if (typeof particlesJS !== 'undefined') {
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

        // Initialize application
        const app = new Application();
        await app.initialize();
        
        console.log('🎉 Platform ready for use!');
        
    } catch (error) {
        console.error('Failed to start application:', error);
    }
});

// Export for global access
window.Application = Application;
window.Notification = Notification;
