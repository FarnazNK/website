// src/modules/BaseModule.js
/**
 * Base Module Class
 * Provides common functionality for all UI modules
 */
class BaseModule extends EventEmitter {
    constructor(services, eventBus, name) {
        super();
        this.services = services;
        this.eventBus = eventBus;
        this.name = name;
        this.state = new ModuleState();
        this.view = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        await this.beforeInit();
        this.setupEventListeners();
        await this.render();
        await this.afterInit();
        
        this.initialized = true;
        this.eventBus.emit(`module:${this.name}:initialized`);
    }

    async beforeInit() {
        // Override in subclasses
    }

    async afterInit() {
        // Override in subclasses
    }

    setupEventListeners() {
        // Override in subclasses
    }

    async render() {
        throw new Error('render() must be implemented by subclass');
    }

    setState(newState) {
        this.state.update(newState);
        this.eventBus.emit(`module:${this.name}:stateChanged`, this.state.get());
    }

    getState() {
        return this.state.get();
    }

    destroy() {
        this.removeAllListeners();
        if (this.view) {
            this.view.destroy();
        }
        this.initialized = false;
    }
}

// src/views/BaseView.js
/**
 * Base View Class
 * Handles UI rendering and interaction
 */
class BaseView {
    constructor(container) {
        this.container = typeof container === 'string' ? document.getElementById(container) : container;
        this.element = null;
        this.visible = false;
    }

    async render() {
        this.element = this.createElement();
        if (this.container && this.element) {
            this.container.appendChild(this.element);
        }
        this.bindEvents();
    }

    createElement() {
        throw new Error('createElement() must be implemented by subclass');
    }

    bindEvents() {
        // Override in subclasses
    }

    show() {
        if (this.element) {
            this.element.style.display = 'block';
            this.visible = true;
        }
    }

    hide() {
        if (this.element) {
            this.element.style.display = 'none';
            this.visible = false;
        }
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.visible = false;
    }

    updateContent(content) {
        if (this.element) {
            this.element.innerHTML = content;
        }
    }
}

// src/views/ToolbarView.js
/**
 * Toolbar View
 * Renders and manages the main navigation toolbar
 */
class ToolbarView extends BaseView {
    constructor(tabs, activeTab) {
        super('toolbarButtons');
        this.tabs = tabs;
        this.activeTab = activeTab;
    }

    createElement() {
        const container = document.createElement('div');
        container.className = 'toolbar-buttons d-flex flex-wrap justify-content-center';
        
        this.tabs.forEach(tab => {
            const button = this.createTabButton(tab);
            container.appendChild(button);
        });
        
        return container;
    }

    createTabButton(tab) {
        const button = document.createElement('button');
        button.className = 'btn btn-tool' + (tab.id === this.activeTab ? ' active' : '');
        button.dataset.module = tab.id;
        button.innerHTML = `<i class="${tab.icon} mr-2"></i>${tab.label}`;
        
        if (this.requiresData(tab.id)) {
            button.disabled = true;
        }
        
        return button;
    }

    requiresData(tabId) {
        return ['plots', 'statistics', 'portfolio', 'strategies', 'ai-insights'].includes(tabId);
    }

    enableTabs(tabIds) {
        tabIds.forEach(tabId => {
            const button = this.element.querySelector(`[data-module="${tabId}"]`);
            if (button) {
                button.disabled = false;
            }
        });
    }

    setActiveTab(tabId) {
        // Remove active class from all buttons
        const buttons = this.element.querySelectorAll('.btn-tool');
        buttons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to selected button
        const activeButton = this.element.querySelector(`[data-module="${tabId}"]`);
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        this.activeTab = tabId;
    }

    bindEvents() {
        if (this.element) {
            this.element.addEventListener('click', (e) => {
                if (e.target.closest('.btn-tool')) {
                    const button = e.target.closest('.btn-tool');
                    const tabId = button.dataset.module;
                    
                    if (!button.disabled) {
                        // Emit custom event that modules can listen for
                        window.dispatchEvent(new CustomEvent('toolbar:tabClicked', {
                            detail: { tabId }
                        }));
                    }
                }
            });
        }
    }
}

// src/views/DataManagerView.js
/**
 * Data Manager View
 * Handles data upload and management UI
 */
class DataManagerView extends BaseView {
    constructor() {
        super('moduleContainer');
        this.dropZone = null;
        this.fileInput = null;
    }

    getDropZone() {
        return this.dropZone;
    }

    getFileInput() {
        return this.fileInput;
    }

    showLoadingState() {
        const loading = document.getElementById('uploadLoading');
        if (loading) {
            loading.style.display = 'block';
        }
    }

    hideLoadingState() {
        const loading = document.getElementById('uploadLoading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    updateProgress(progress) {
        const progressBar = document.getElementById('loadingProgress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    showDataPreview(dataset) {
        const preview = document.getElementById('dataPreview');
        const welcome = document.getElementById('welcomeScreen');
        
        if (welcome) welcome.style.display = 'none';
        if (preview) {
            preview.style.display = 'block';
            this.renderDataTable(dataset);
            this.renderDatasetInfo(dataset);
        }
    }

    renderDataTable(dataset) {
        const tableContainer = document.getElementById('dataTable');
        if (!tableContainer || !dataset.headers || !dataset.rows) return;

        const table = document.createElement('table');
        table.className = 'table table-dark table-sm table-striped';
        
        // Create header
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
        
        // Create body (show first 50 rows)
        const tbody = document.createElement('tbody');
        const rowsToShow = dataset.rows.slice(0, 50);
        
        rowsToShow.forEach((row, index) => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell !== null && cell !== undefined ? cell : '';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        
        table.appendChild(tbody);
        
        // Clear and append
        tableContainer.innerHTML = '';
        tableContainer.appendChild(table);
        
        // Add row count info
        if (dataset.rows.length > 50) {
            const info = document.createElement('div');
            info.className = 'text-muted mt-2 small text-center';
            info.textContent = `Showing first 50 rows of ${dataset.rows.length} total rows`;
            tableContainer.appendChild(info);
        }
    }

    renderDatasetInfo(dataset) {
        const infoContainer = document.getElementById('datasetInfo');
        if (!infoContainer) return;

        const numericColumns = this.getNumericColumns(dataset);
        const dateColumns = this.getDateColumns(dataset);
        
        infoContainer.innerHTML = `
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
                            <strong>Text:</strong> ${dataset.headers.length - numericColumns.length - dateColumns.length}
                        </div>
                    </div>
                    <hr>
                    <h6>Columns</h6>
                    <div class="column-list" style="max-height: 200px; overflow-y: auto;">
                        ${dataset.headers.map(header => {
                            const type = numericColumns.includes(header) ? 'numeric' : 
                                        dateColumns.includes(header) ? 'date' : 'text';
                            const icon = type === 'numeric' ? 'fa-hashtag' : 
                                        type === 'date' ? 'fa-calendar' : 'fa-font';
                            return `<div class="mb-1"><i class="fas ${icon} mr-2 text-muted"></i>${header}</div>`;
                        }).join('')}
                    </div>
                    ${dataset.metadata && dataset.metadata.processedAt ? 
                        `<small class="text-muted mt-2 d-block">Loaded: ${new Date(dataset.metadata.processedAt).toLocaleString()}</small>` : 
                        ''
                    }
                </div>
            </div>
        `;
    }

    getNumericColumns(dataset) {
        return dataset.headers.filter((header, index) => {
            return dataset.rows.some(row => typeof row[index] === 'number');
        });
    }

    getDateColumns(dataset) {
        return dataset.headers.filter((header, index) => {
            return dataset.rows.some(row => row[index] instanceof Date);
        });
    }

    showError(message) {
        Notification.error(message);
    }

    showSuccess(message) {
        Notification.success(message);
    }
}

// src/views/AIInsightsView.js
/**
 * AI Insights View
 * Handles AI analysis interface
 */
class AIInsightsView extends BaseView {
    constructor() {
        super();
        this.analysisHistory = [];
    }

    showAnalysisLoading() {
        const container = document.getElementById('aiInsightsContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="sr-only">Analyzing...</span>
                    </div>
                    <p class="text-muted">AI is analyzing your data...</p>
                </div>
            `;
        }
    }

    hideAnalysisLoading() {
        // Loading will be replaced by results
    }

    displayAnalysisResult(result) {
        const container = document.getElementById('aiInsightsContainer');
        if (container) {
            container.innerHTML = `
                <div class="analysis-result">
                    <div class="card bg-dark text-light">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0"><i class="fas fa-brain mr-2"></i>AI Analysis Result</h6>
                            <small class="text-muted">${new Date().toLocaleString()}</small>
                        </div>
                        <div class="card-body">
                            <div class="analysis-content">
                                ${this.formatAnalysisContent(result)}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    formatAnalysisContent(result) {
        if (typeof result === 'string') {
            return `<p>${result}</p>`;
        } else if (typeof result === 'object') {
            return `<pre class="bg-secondary p-3 rounded">${JSON.stringify(result, null, 2)}</pre>`;
        }
        return '<p>Analysis completed</p>';
    }

    showAnalysisError(message) {
        const container = document.getElementById('aiInsightsContainer');
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <h6><i class="fas fa-exclamation-triangle mr-2"></i>Analysis Error</h6>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    showNoDataMessage() {
        const container = document.getElementById('aiInsightsContainer');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="fas fa-database fa-3x mb-3"></i>
                    <p>Please load data first before using AI insights</p>
                </div>
            `;
        }
    }

    updateAnalysisOptions(analyses) {
        const optionsContainer = document.querySelector('#analysisType');
        if (optionsContainer) {
            optionsContainer.innerHTML = analyses.map(analysis => 
                `<option value="${analysis.id}">${analysis.name}</option>`
            ).join('');
        }
    }

    updateAnalysisHistory(history) {
        this.analysisHistory = history;
        // Could implement history display here
    }
}

// src/modules/ToolbarModule.js
/**
 * Toolbar Module
 * Manages main application toolbar and navigation
 */
class ToolbarModule extends BaseModule {
    constructor(services, eventBus) {
        super(services, eventBus, 'toolbar');
        this.activeTab = 'dataManager';
        this.tabs = [
            { id: 'dataManager', label: 'Data', icon: 'fas fa-database' },
            { id: 'plotManager', label: 'Plots', icon: 'fas fa-chart-bar' },
            { id: 'riskAnalytics', label: 'Risk Metrics', icon: 'fas fa-calculator' },
            { id: 'portfolioManager', label: 'Portfolio', icon: 'fas fa-briefcase' },
            { id: 'strategyBacktest', label: 'Strategies', icon: 'fas fa-chart-line' },
            { id: 'aiInsights', label: 'AI Insights', icon: 'fas fa-brain' }
        ];
    }

    async render() {
        this.view = new ToolbarView(this.tabs, this.activeTab);
        await this.view.render();
    }

    setupEventListeners() {
        // Listen for tab clicks from the view
        window.addEventListener('toolbar:tabClicked', (e) => {
            this.handleTabClick(e.detail.tabId);
        });

        // Listen for data loaded events
        if (this.eventBus) {
            this.eventBus.on('data:loaded', this.handleDataLoaded.bind(this));
        }
    }

    handleTabClick(tabId) {
        if (this.activeTab === tabId) return;
        
        // Validate prerequisites
        if (this.requiresData(tabId) && !this.hasData()) {
            this.showDataRequiredMessage(tabId);
            return;
        }

        this.activeTab = tabId;
        this.setState({ activeTab: tabId });
        
        if (this.view) {
            this.view.setActiveTab(tabId);
        }
        
        // Emit navigation change event
        window.dispatchEvent(new CustomEvent('navigation:changed', {
            detail: { tab: tabId }
        }));
    }

    handleDataLoaded() {
        this.enableDataDependentTabs();
    }

    requiresData(tabId) {
        return ['plotManager', 'riskAnalytics', 'portfolioManager', 'strategyBacktest', 'aiInsights'].includes(tabId);
    }

    hasData() {
        const dataService = this.services?.get ? this.services.get('dataService') : null;
        return dataService && dataService.getCurrentDataset() !== null;
    }

    enableDataDependentTabs() {
        if (this.view) {
            this.view.enableTabs(['plotManager', 'riskAnalytics', 'portfolioManager', 'strategyBacktest', 'aiInsights']);
        }
    }

    showDataRequiredMessage(tabId) {
        const tabLabel = this.getTabLabel(tabId);
        Notification.warning(`Please load data before accessing ${tabLabel}`);
    }

    getTabLabel(tabId) {
        const tab = this.tabs.find(tab => tab.id === tabId);
        return tab ? tab.label : tabId;
    }
}

// src/modules/DataManagerModule.js
/**
 * Data Manager Module
 * Handles data upload, processing, and management
 */
class DataManagerModule extends BaseModule {
    constructor(services, eventBus) {
        super(services, eventBus, 'dataManager');
        this.uploadManager = new FileUploadManager();
        this.currentOperation = null;
    }

    async render() {
        this.view = new DataManagerView();
        await this.view.render();
        this.setupFileUpload();
    }

    setupEventListeners() {
        // Listen for navigation changes
        window.addEventListener('navigation:changed', (e) => {
            this.handleNavigationChange(e.detail);
        });

        // Listen for data service events if available
        const dataService = this.services?.get ? this.services.get('dataService') : null;
        if (dataService) {
            dataService.on('data:loaded', this.onDataLoaded.bind(this));
            dataService.on('data:error', this.onDataError.bind(this));
            dataService.on('data:loading', this.onDataLoading.bind(this));
        }
    }

    setupFileUpload() {
        this.uploadManager.setup({
            dropZone: this.view.getDropZone(),
            fileInput: this.view.getFileInput(),
            onProgress: this.handleUploadProgress.bind(this),
            onComplete: this.handleUploadComplete.bind(this),
            onError: this.handleUploadError.bind(this)
        });
    }

    async handleNavigationChange({ tab }) {
        if (tab === 'dataManager') {
            this.view.show();
        } else {
            this.view.hide();
        }
    }

    async handleUploadComplete(file) {
        try {
            this.currentOperation = `upload_${Date.now()}`;
            
            const dataService = this.services?.get ? this.services.get('dataService') : null;
            if (dataService) {
                await dataService.loadData(file);
            } else {
                // Fallback: basic file processing
                await this.processFileLocally(file);
            }
        } catch (error) {
            this.handleUploadError(error);
        }
    }

    async processFileLocally(file) {
        const text = await file.text();
        let dataset;

        if (file.name.endsWith('.csv')) {
            dataset = this.parseCSV(text);
        } else if (file.name.endsWith('.json')) {
            dataset = JSON.parse(text);
        } else {
            throw new Error('Unsupported file format');
        }

        this.onDataLoaded({ data: dataset });
    }

    parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());
        const rows = lines.slice(1).map(line => 
            line.split(',').map(cell => {
                const trimmed = cell.trim();
                const num = parseFloat(trimmed);
                return isNaN(num) ? trimmed : num;
            })
        );
        
        return { headers, rows };
    }

    handleUploadProgress(progress) {
        this.view.updateProgress(progress);
    }

    handleUploadError(error) {
        this.view.hideLoadingState();
        this.view.showError(`Upload failed: ${error.message}`);
    }

    onDataLoaded(eventData) {
        this.view.hideLoadingState();
        this.view.showDataPreview(eventData.data);
        this.view.showSuccess('Data loaded successfully!');
        
        // Notify other modules
        window.dispatchEvent(new CustomEvent('data:uploadComplete', {
            detail: eventData
        }));
    }

    onDataError(eventData) {
        this.view.hideLoadingState();
        this.view.showError(`Data loading failed: ${eventData.error.message}`);
    }

    onDataLoading(eventData) {
        this.view.showLoadingState();
    }
}

// src/modules/AIInsightsModule.js
/**
 * AI Insights Module
 * Manages LLM-powered analysis and insights
 */
class AIInsightsModule extends BaseModule {
    constructor(services, eventBus) {
        super(services, eventBus, 'ai-insights');
        this.analysisHistory = [];
        this.currentAnalysis = null;
    }

    async render() {
        this.view = new AIInsightsView();
        await this.view.render();
    }

    setupEventListeners() {
        // Listen for navigation changes
        window.addEventListener('navigation:changed', (e) => {
            this.handleNavigationChange(e.detail);
        });

        // Listen for analysis requests
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => {
                this.handleAnalysisRequest();
            });
        }
    }

    async handleNavigationChange({ tab }) {
        if (tab === 'aiInsights') {
            this.view.show();
            await this.initializeAnalysisOptions();
        } else {
            this.view.hide();
        }
    }

    async initializeAnalysisOptions() {
        const dataService = this.services?.get ? this.services.get('dataService') : null;
        const dataset = dataService ? dataService.getCurrentDataset() : null;
        
        if (!dataset) {
            this.view.showNoDataMessage();
            return;
        }

        const availableAnalyses = this.getAvailableAnalyses(dataset);
        this.view.updateAnalysisOptions(availableAnalyses);
    }

    getAvailableAnalyses(dataset) {
        const analyses = [];
        
        if (dataset) {
            analyses.push({
                id: 'data-summary',
                name: 'Data Summary & Insights',
                description: 'Get AI-powered insights about your dataset'
            });
        }

        return analyses;
    }

    async handleAnalysisRequest() {
        try {
            const analysisType = document.getElementById('analysisType')?.value || 'data-summary';
            const userContext = document.getElementById('aiQuery')?.value || '';

            this.currentAnalysis = analysisType;
            this.view.showAnalysisLoading();

            // Simulate AI analysis (replace with actual LLM service call)
            const result = await this.generateMockAnalysis(analysisType, userContext);
            
            this.view.displayAnalysisResult(result);
            this.addToHistory(analysisType, result, userContext);

        } catch (error) {
            this.view.showAnalysisError(error.message);
        }
    }

    async generateMockAnalysis(analysisType, userContext) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const dataService = this.services?.get ? this.services.get('dataService') : null;
        const dataset = dataService ? dataService.getCurrentDataset() : null;
        
        if (!dataset) {
            throw new Error('No dataset available for analysis');
        }

        // Mock analysis result
        return `Analysis of ${dataset.headers.length} columns and ${dataset.rows.length} rows:\n\n` +
               `The dataset appears to contain ${this.getNumericColumns(dataset).length} numeric columns ` +
               `and ${dataset.headers.length - this.getNumericColumns(dataset).length} text columns.\n\n` +
               `${userContext ? `Based on your query "${userContext}": ` : ''}` +
               `This dataset shows good structure for quantitative analysis. ` +
               `Consider examining correlations between numeric variables and ` +
               `checking for missing values before proceeding with statistical modeling.`;
    }

    getNumericColumns(dataset) {
        return dataset.headers.filter((header, index) => {
            return dataset.rows.some(row => typeof row[index] === 'number');
        });
    }

    addToHistory(type, result, context) {
        this.analysisHistory.push({
            type,
            result,
            context,
            timestamp: new Date(),
            id: this.generateId()
        });
        
        this.view.updateAnalysisHistory(this.analysisHistory);
    }

    generateId() {
        return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// src/upload/FileUploadManager.js
/**
 * File Upload Manager
 * Handles file upload operations and events
 */
class FileUploadManager {
    constructor() {
        this.handlers = {};
    }

    setup(options) {
        this.options = options;
        this.setupDropZone();
        this.setupFileInput();
    }

    setupDropZone() {
        const dropZone = this.options.dropZone;
        if (!dropZone) return;

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
                this.processFile(file);
            }
        });

        dropZone.addEventListener('click', () => {
            this.options.fileInput?.click();
        });
    }

    setupFileInput() {
        const fileInput = this.options.fileInput;
        if (!fileInput) return;

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processFile(file);
            }
        });
    }

    async processFile(file) {
        try {
            // Validate file
            this.validateFile(file);
            
            // Report progress
            if (this.options.onProgress) {
                this.options.onProgress(50);
            }

            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 500));

            if (this.options.onProgress) {
                this.options.onProgress(100);
            }

            // Complete
            if (this.options.onComplete) {
                this.options.onComplete(file);
            }

        } catch (error) {
            if (this.options.onError) {
                this.options.onError(error);
            }
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

// Export all classes to global scope
if (typeof window !== 'undefined') {
    window.BaseModule = BaseModule;
    window.BaseView = BaseView;
    window.ToolbarView = ToolbarView;
    window.DataManagerView = DataManagerView;
    window.AIInsightsView = AIInsightsView;
    window.ToolbarModule = ToolbarModule;
    window.DataManagerModule = DataManagerModule;
    window.AIInsightsModule = AIInsightsModule;
    window.FileUploadManager = FileUploadManager;
}