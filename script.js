/**
 * quantitative-investment-platform.js
 * 
 * A quantitative investment platform for data loading, cleaning, visualization,
 * risk analysis, portfolio optimization, and trading strategy backtesting.
 * 
 * Dependencies:
 * - Papa Parse (CSV parsing)
 * - XLSX.js (Excel file support)
 * - Chart.js (charting)
 * - PortfolioAllocation (portfolio optimization)
 * - jQuery (UI interactions)
 * - Bootstrap (styling and modals)
 * - Font Awesome (icons)
 * 
 * Usage:
 * Include this script after loading dependencies and portfolio-allocation.js.
 * The platform initializes on DOMContentLoaded and provides a UI for financial analysis.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Core variables
    const dynamicContent = document.getElementById('dynamicMenuContent');
    let sharedDataset = { headers: [], rows: [] };
    const rowsPerPage = 100;
    const dependencies = {
        Papa: typeof Papa !== 'undefined' ? Papa : null,
        XLSX: typeof XLSX !== 'undefined' ? XLSX : null,
        Chart: typeof Chart !== 'undefined' ? Chart : null,
        PortfolioAllocation: typeof PortfolioAllocation !== 'undefined' ? PortfolioAllocation : null,
        jQuery: typeof $ !== 'undefined' ? $ : null
    };

    // Debug library loading
    console.log('Dependencies:', {
        Papa: !!dependencies.Papa,
        XLSX: !!dependencies.XLSX,
        Chart: !!dependencies.Chart,
        PortfolioAllocation: !!dependencies.PortfolioAllocation,
        jQuery: !!dependencies.jQuery
    });

    // Dependency check
    if (!dependencies.Papa) return showErrorMessage('Papa Parse is required for CSV parsing.');
    if (!dependencies.XLSX) return showErrorMessage('XLSX.js is required for Excel file support.');
    if (!dependencies.Chart) return showErrorMessage('Chart.js is required for plotting.');
    if (!dependencies.PortfolioAllocation) return showErrorMessage('Portfolio Allocation library is required for portfolio optimization.');
    if (!dependencies.jQuery) return showErrorMessage('jQuery is required for UI interactions.');

    // Add Basket Trading button to toolbar
    const toolbarDiv = document.querySelector('.toolbar');
    if (toolbarDiv && !document.getElementById('toolbar-basket')) {
        const basketButton = document.createElement('button');
        basketButton.id = 'toolbar-basket';
        basketButton.className = 'btn btn-dark mx-1';
        basketButton.innerHTML = '<i class="fas fa-shopping-basket"></i> Basket';
        toolbarDiv.appendChild(basketButton);
    }

    // Utility functions
    const sanitizeInput = (input) => {
        // Using a simple sanitization for now; consider DOMPurify for production
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    };

    const showMessage = (message, type = 'success', containerId = 'dynamicMenuContent') => {
        const container = document.getElementById(containerId) || dynamicContent;
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            <strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong> ${sanitizeInput(message)}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">×</span>
            </button>
        `;
        container.prepend(alertDiv);
        setTimeout(() => dependencies.jQuery(alertDiv).alert('close'), 5000);
    };

    const showErrorMessage = (message, containerId) => showMessage(message, 'danger', containerId);
    const showSuccessMessage = (message, containerId) => showMessage(message, 'success', containerId);

    const getColumnIndex = (column) => {
        const index = sharedDataset.headers.indexOf(column);
        if (index === -1) throw new Error(`Invalid column name: ${column}`);
        return index;
    };

    const getColumnData = (columnIndex) => {
        return sharedDataset.rows
            .map(row => parseFloat(row[columnIndex]))
            .filter(val => !isNaN(val));
    };

    // Toolbar UI components
    const toolbarHandlers = {
        'toolbar-data': () => `
            <div class="row">
                <div class="col-md-3 bg-dark p-3 rounded shadow-sm menu-section">
                    <h4 class="text-light">Menu</h4>
                    <ul class="list-group">
                        <li class="list-group-item menu-item" id="menu-load-data">Load Data</li>
                        <li class="list-group-item menu-item" id="menu-clean-data">Clean Data</li>
                        <li class="list-group-item menu-item" id="menu-filter-data">Filter Data</li>
                        <li class="list-group-item menu-item" id="menu-export-data">Export Data</li>
                        <li class="list-group-item menu-item" id="menu-clear-data">Clear Data</li>
                    </ul>
                </div>
                <div class="col-md-9 bg-dark p-3 rounded shadow-lg" id="data-content">
                    <div class="welcome-screen text-center py-5">
                        <h4 class="mb-4">Welcome to the Quantitative Investment Platform</h4>
                        <p class="mb-5">Choose a menu item to start analyzing financial data.</p>
                        <div class="upload-zone p-5 mb-4 mx-auto">
                            <i class="fas fa-file-upload mb-3"></i>
                            <p>Drag and drop files here<br>or</p>
                            <button class="btn btn-primary btn-lg mt-2" id="browseFiles">
                                <i class="fas fa-folder-open mr-2"></i>Browse Files
                            </button>
                        </div>
                        <div class="supported-formats">
                            <p class="small text-muted">Supported formats: CSV, Excel (.xlsx, .xls)</p>
                        </div>
                        <div class="text-center mt-4">
                            <div class="spinner-border text-primary" role="status" id="loadingSpinner" style="display: none;">
                                <span class="sr-only">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`,
        'toolbar-plots': () => `
            <div class="container py-4">
                <div class="row">
                    <div class="col-md-3 bg-dark text-light p-3 rounded shadow-sm">
                        <h4>Plot Options</h4>
                        <label>Select Ticker:</label>
                        <select id="xAxisColumn" class="form-control mb-3">
                            ${sharedDataset.headers.filter(h => h !== 'Date').map(header => 
                                `<option value="${header}">${header}</option>`).join('')}
                        </select>
                        <label>Chart Type:</label>
                        <select id="chartType" class="form-control mb-3">
                            <option value="line">Line Chart</option>
                            <!-- Candlestick requires chartjs-chart-financial -->
                            <option value="candlestick" disabled>Candlestick Chart (Plugin Required)</option>
                        </select>
                        <label>Chart Label:</label>
                        <input type="text" id="chartLabel" class="form-control mb-3" placeholder="Enter label">
                        <label>Chart Color:</label>
                        <input type="color" id="chartColor" class="form-control mb-3" value="#007bff">
                        <button class="btn btn-primary w-100 mb-2" id="generateChart">Generate Chart</button>
                    </div>
                    <div class="col-md-9">
                        <div id="chartsContainer" class="d-flex flex-wrap gap-3"></div>
                    </div>
                </div>
            </div>`,
        'toolbar-statistics': () => `
            <div class="container py-4">
                <h4 class="text-light">Risk Metrics</h4>
                <div class="row">
                    <div class="col-md-12 bg-dark text-light p-3 rounded shadow-sm">
                        <h5>Financial Metrics</h5>
                        <div class="row mb-3">
                            <div class="col-md-7">
                                <label>Select Tickers:</label>
                                <select id="statsColumn" class="form-control" multiple size="5">
                                    ${sharedDataset.headers.filter(h => h !== 'Date').map(header => 
                                        `<option value="${header}">${header}</option>`).join('')}
                                </select>
                                <div class="mt-2">
                                    <label>Benchmark Ticker (for Beta/Correlation):</label>
                                    <select id="benchmarkTicker" class="form-control">
                                        <option value="">Select Benchmark...</option>
                                        ${sharedDataset.headers.filter(h => h !== 'Date').map(header => 
                                            `<option value="${header}">${header}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-5">
                                <h6>Risk Metrics:</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="optionSharpe" checked>
                                    <label class="form-check-label" for="optionSharpe">Sharpe Ratio</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="optionSortino">
                                    <label class="form-check-label" for="optionSortino">Sortino Ratio</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="optionVaR" checked>
                                    <label class="form-check-label" for="optionVaR">Value at Risk (95%)</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="optionCVaR">
                                    <label class="form-check-label" for="optionCVaR">Conditional VaR (95%)</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="optionDrawdown" checked>
                                    <label class="form-check-label" for="optionDrawdown">Max Drawdown</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="optionBeta" disabled>
                                    <label class="form-check-label" for="optionBeta">Beta</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="optionCorrelation" disabled>
                                    <label class="form-check-label" for="optionCorrelation">Correlation</label>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-primary mb-3" id="generateStats">Calculate Metrics</button>
                        <div id="statsResult" class="text-light"></div>
                    </div>
                </div>
            </div>`,
        'toolbar-portfolio': () => `
            <div class="container py-4">
                <h4 class="text-light">Portfolio Optimization</h4>
                <div class="row">
                    <div class="col-md-3 bg-dark text-light p-3 rounded shadow-sm">
                        <h5>Portfolio Settings</h5>
                        <label>Select Tickers:</label>
                        <select id="portfolioTickers" class="form-control" multiple size="5">
                            ${sharedDataset.headers.filter(h => h !== 'Date').map(header => 
                                `<option value="${header}">${header}</option>`).join('')}
                        </select>
                        <label>Risk-Free Rate (%):</label>
                        <input type="number" id="riskFreeRate" class="form-control mb-3" value="2" min="0" step="0.1">
                        <label>Transaction Cost (%):</label>
                        <input type="number" id="transactionCost" class="form-control mb-3" value="0.1" min="0" step="0.01">
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" id="allowNegativeWeights" checked>
                            <label class="form-check-label" for="allowNegativeWeights">Allow Negative Weights</label>
                        </div>
                        <label>Optimization Method:</label>
                        <select id="optimizationMethod" class="form-control mb-3">
                            <option value="mean-variance">Mean-Variance</option>
                            <option value="min-volatility">Minimum Volatility</option>
                            <option value="risk-parity">Risk Parity</option>
                        </select>
                        <button class="btn btn-primary w-100 mb-2" id="optimizePortfolio">Optimize Portfolio</button>
                        <button class="btn btn-secondary w-100" id="exportPortfolio">Export Results</button>
                    </div>
                    <div class="col-md-9">
                        <div id="portfolioResult" class="table-responsive text-light"></div>
                        <div id="portfolioChart" class="mt-3"></div>
                        <div id="portfolioPerformanceChart" class="mt-3"></div>
                    </div>
                </div>
            </div>`,
        'toolbar-strategies': () => `
            <div class="container py-4">
                <h4 class="text-light">Trading Strategies</h4>
                <div class="row">
                    <div class="col-md-3 bg-dark text-light p-3 rounded shadow-sm">
                        <h5>Strategy Settings</h5>
                        <label>Select Ticker:</label>
                        <select id="strategyTicker" class="form-control mb-3">
                            ${sharedDataset.headers.filter(h => h !== 'Date').map(header => 
                                `<option value="${header}">${header}</option>`).join('')}
                        </select>
                        <label>Strategy Type:</label>
                        <select id="strategyType" class="form-control mb-3">
                            <option value="sma-crossover">SMA Crossover</option>
                            <option value="macd">MACD</option>
                        </select>
                        <label>Fast Period:</label>
                        <input type="number" id="fastPeriod" class="form-control mb-3" value="12" min="1">
                        <label>Slow Period:</label>
                        <input type="number" id="slowPeriod" class="form-control mb-3" value="26" min="1">
                        <label>Transaction Cost (%):</label>
                        <input type="number" id="transactionCost" class="form-control mb-3" value="0.1" min="0" step="0.01">
                        <button class="btn btn-primary w-100" id="backtestStrategy">Backtest Strategy</button>
                    </div>
                    <div class="col-md-9">
                        <div id="strategyResult" class="table-responsive text-light"></div>
                        <div id="strategyChart" class="mt-3"></div>
                    </div>
                </div>
            </div>`,
        'toolbar-basket': () => `
            <div class="container py-4">
                <h4 class="text-light">Basket Trading</h4>
                <div class="row">
                    <div class="col-md-3 bg-dark text-light p-3 rounded shadow-sm">
                        <h5>Basket Settings</h5>
                        <div class="form-group">
                            <label>Basket Name:</label>
                            <input type="text" id="basketName" class="form-control mb-3" placeholder="My Basket">
                        </div>
                        <div class="form-group">
                            <label>Available Tickers:</label>
                            <select id="availableTickers" class="form-control" multiple size="8">
                                ${sharedDataset.headers.filter(h => h !== 'Date').map(header => 
                                    `<option value="${header}">${header}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group mt-2 text-center">
                            <button class="btn btn-sm btn-primary" id="addToBasket">↓</button>
                            <button class="btn btn-sm btn-secondary" id="removeFromBasket">↑</button>
                        </div>
                        <div class="form-group">
                            <label>Selected Tickers:</label>
                            <select id="selectedTickers" class="form-control" multiple size="8"></select>
                        </div>
                        <div class="form-group mt-3">
                            <label>Weighting Method:</label>
                            <select id="weightingMethod" class="form-control mb-3">
                                <option value="equal">Equal Weight</option>
                                <option value="market-cap">Market Cap Weight</option>
                                <option value="inverse-volatility">Inverse Volatility</option>
                                <option value="custom">Custom Weights</option>
                            </select>
                        </div>
                        <button class="btn btn-primary w-100 mb-2" id="createBasket">Create Basket</button>
                        <button class="btn btn-secondary w-100" id="exportBasket">Export Basket</button>
                        <button class="btn btn-info w-100 mt-2" id="saveBasket">Save Basket</button>
                        <div class="form-group mt-3">
                            <label>Saved Baskets:</label>
                            <select id="savedBasketsDropdown" class="form-control">
                                <option value="">Select a saved basket...</option>
                            </select>
                            <button class="btn btn-outline-light w-100 mt-2" id="loadSavedBasket">Load Basket</button>
                        </div>
                    </div>
                    <div class="col-md-9">
                        <div class="card bg-dark text-light mb-3">
                            <div class="card-header">Basket Composition</div>
                            <div class="card-body">
                                <div id="basketWeightsTable" class="table-responsive mb-3"></div>
                                <div id="basketPieChart" style="height: 300px;" class="mb-3"></div>
                            </div>
                        </div>
                        <div class="card bg-dark text-light">
                            <div class="card-header">Basket Performance Analysis</div>
                            <div class="card-body">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label>Benchmark:</label>
                                        <select id="basketBenchmark" class="form-control">
                                            <option value="">None</option>
                                            ${sharedDataset.headers.filter(h => h !== 'Date').map(header => 
                                                `<option value="${header}">${header}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label>Time Period:</label>
                                        <select id="basketPeriod" class="form-control">
                                            <option value="all">All Available Data</option>
                                            <option value="1y">1 Year</option>
                                            <option value="6m">6 Months</option>
                                            <option value="3m">3 Months</option>
                                            <option value="1m">1 Month</option>
                                        </select>
                                    </div>
                                </div>
                                <button class="btn btn-primary mb-3" id="analyzeBasket">Analyze Performance</button>
                                <div id="basketPerformanceChart" style="height: 300px;"></div>
                                <div id="basketMetrics" class="table-responsive mt-3"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`
    };

    // Attach toolbar event listeners
    Object.entries(toolbarHandlers).forEach(([toolbarId, handler]) => {
        const button = document.getElementById(toolbarId);
        if (button) {
            button.addEventListener('click', () => {
                if (['toolbar-plots', 'toolbar-statistics', 'toolbar-portfolio', 'toolbar-strategies', 'toolbar-basket'].includes(toolbarId) && !sharedDataset.headers.length) {
                    showErrorMessage('No data available. Please load data first.', 'data-content');
                    dynamicContent.innerHTML = toolbarHandlers['toolbar-data']();
                    attachDataMenuEventListeners();
                    return;
                }
                dynamicContent.innerHTML = handler();
                switch (toolbarId) {
                    case 'toolbar-data': attachDataMenuEventListeners(); break;
                    case 'toolbar-plots': implementPlotFunctionality(); break;
                    case 'toolbar-statistics': implementRiskFunctionality(); break;
                    case 'toolbar-portfolio': implementPortfolioFunctionality(); break;
                    case 'toolbar-strategies': implementStrategyFunctionality(); break;
                    case 'toolbar-basket': implementBasketTradingFunctionality(); break;
                }
            });
        }
    });

    // Data section event listeners
    function attachDataMenuEventListeners() {
        const menuItems = {
            'menu-load-data': loadDataSection,
            'menu-clean-data': cleanDataSection,
            'menu-filter-data': filterDataSection,
            'menu-export-data': exportDataSection,
            'menu-clear-data': clearDataSection
        };

        Object.entries(menuItems).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) element.addEventListener('click', handler);
        });

        const uploadZone = document.querySelector('.upload-zone');
        const browseButton = document.getElementById('browseFiles');
        const loadingSpinner = document.getElementById('loadingSpinner');

        if (uploadZone) {
            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZone.classList.add('border-primary');
            });

            uploadZone.addEventListener('dragleave', () => {
                uploadZone.classList.remove('border-primary');
            });

            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.classList.remove('border-primary');
                const file = e.dataTransfer.files[0];
                if (file) {
                    loadingSpinner.style.display = 'block';
                    processFile(file);
                }
            });
        }

        if (browseButton) {
            browseButton.addEventListener('click', () => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.csv, .xlsx, .xls';
                fileInput.style.display = 'none';
                document.body.appendChild(fileInput);
                fileInput.addEventListener('change', () => {
                    const file = fileInput.files[0];
                    if (file) {
                        loadingSpinner.style.display = 'block';
                        processFile(file);
                    }
                    document.body.removeChild(fileInput);
                });
                fileInput.click();
            });
        }
    }

    // Load data section
    function loadDataSection() {
        document.getElementById('data-content').innerHTML = `
            <div class="p-3 text-center">
                <div class="upload-zone p-5 mb-4 mx-auto">
                    <i class="fas fa-file-upload mb-3"></i>
                    <p>Drag and drop files here<br>or</p>
                    <button class="btn btn-primary btn-lg mt-2" id="browseFiles">
                        <i class="fas fa-folder-open mr-2"></i>Browse Files
                    </button>
                </div>
                <p class="text-muted">Supported formats: CSV, Excel (.xlsx, .xls)</p>
                <div class="input-group mb-3">
                    <input type="text" id="tickerInput" class="form-control" placeholder="Enter ticker (e.g., AAPL)">
                    <input type="password" id="apiKeyInput" class="form-control" placeholder="Enter Alpha Vantage API Key">
                    <button class="btn btn-primary" id="fetch-data-button">Fetch Market Data</button>
                </div>
                <div class="text-center mt-4">
                    <div class="spinner-border text-primary" role="status" id="loadingSpinner" style="display: none;">
                        <span class="sr-only">Loading...</span>
                    </div>
                </div>
            </div>
            <div id="data-preview"></div>
        `;

        const fetchButton = document.getElementById('fetch-data-button');
        if (fetchButton) {
            fetchButton.addEventListener('click', async () => {
                const ticker = sanitizeInput(document.getElementById('tickerInput').value.trim());
                const apiKey = document.getElementById('apiKeyInput').value.trim();
                if (!ticker || !	apiKey) {
                    showErrorMessage('Please enter a valid ticker and API key.', 'data-content');
                    return;
                }
                document.getElementById('loadingSpinner').style.display = 'block';
                await fetchMarketData(ticker, apiKey);
            });
        }

        attachDataMenuEventListeners();
    }

    // Fetch market data
    async function fetchMarketData(ticker, apiKey) {
        try {
            const response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${apiKey}&outputsize=compact`);
            if (!response.ok) throw new Error('Network error');
            const data = await response.json();
            if (data["Error Message"]) throw new Error(data["Error Message"]);

            const timeSeries = data["Time Series (Daily)"];
            const rows = Object.entries(timeSeries).map(([date, values]) => [
                date,
                parseFloat(values["1. open"]),
                parseFloat(values["2. high"]),
                parseFloat(values["3. low"]),
                parseFloat(values["4. close"]),
                parseFloat(values["5. volume"])
            ]);

            sharedDataset.headers = ["Date", "Open", "High", "Low", "Close", "Volume"];
            sharedDataset.rows = rows;
            validateHeaders(sharedDataset.headers);
            localStorage.setItem('savedDataset', JSON.stringify(sharedDataset));
            displayDataTable();
            showSuccessMessage(`Loaded data for ${ticker}`, 'data-content');
        } catch (error) {
            showErrorMessage(`Error fetching data: ${error.message}`, 'data-content');
        } finally {
            document.getElementById('loadingSpinner').style.display = 'none';
        }
    }

    // Process file
    function processFile(file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (fileExtension === 'csv') {
            dependencies.Papa.parse(file, {
                complete: (result) => {
                    if (result.errors.length) {
                        showErrorMessage('Error parsing CSV: ' + result.errors[0].message, 'data-content');
                        document.getElementById('loadingSpinner').style.display = 'none';
                        return;
                    }
                    processCSV(result.data);
                },
                header: false,
                skipEmptyLines: true
            });
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = dependencies.XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = dependencies.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    processExcel(jsonData);
                } catch (error) {
                    showErrorMessage(`Error processing Excel file: ${error.message}`, 'data-content');
                } finally {
                    document.getElementById('loadingSpinner').style.display = 'none';
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            showErrorMessage('Invalid file type. Please upload a CSV or Excel file.', 'data-content');
            document.getElementById('loadingSpinner').style.display = 'none';
        }
    }

    // Process CSV data
    function processCSV(data) {
        if (!data.length || !data[0].length) {
            showErrorMessage('The CSV file is empty.', 'data-content');
            document.getElementById('loadingSpinner').style.display = 'none';
            return;
        }
        updateSharedDataset(data);
    }

    // Process Excel data
    function processExcel(jsonData) {
        if (!jsonData.length) {
            showErrorMessage('The Excel file is empty.', 'data-content');
            document.getElementById('loadingSpinner').style.display = 'none';
            return;
        }
        updateSharedDataset(jsonData);
    }

    // Update shared dataset
    function updateSharedDataset(rows) {
        try {
            sharedDataset.headers = rows[0].map(h => sanitizeInput(h.toString().trim()));
            sharedDataset.rows = rows.slice(1).map(row => row.map(cell => cell ? sanitizeInput(cell.toString().trim()) : ''));
            validateHeaders(sharedDataset.headers);
            localStorage.setItem('savedDataset', JSON.stringify(sharedDataset));
            displayDataTable();
            showSuccessMessage('Data loaded successfully!', 'data-content');
        } catch (error) {
            showErrorMessage(error.message, 'data-content');
        } finally {
            document.getElementById('loadingSpinner').style.display = 'none';
        }
    }

    // Validate headers
    function validateHeaders(headers) {
        const uniqueHeaders = new Set(headers);
        if (uniqueHeaders.size !== headers.length) throw new Error('Duplicate column headers detected.');
        if (headers.some(h => !h)) throw new Error('Empty column headers are not allowed.');
    }

    // Display data table with pagination
    function displayDataTable(page = 1) {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginatedRows = sharedDataset.rows.slice(start, end);
        const totalPages = Math.ceil(sharedDataset.rows.length / rowsPerPage);

        document.getElementById('data-content').innerHTML = `
            <div class="table-container bg-dark rounded p-3">
                <table class="table table-dark table-striped">
                    <thead id="tableHead"></thead>
                    <tbody id="tableBody"></tbody>
                </table>
                <nav>
                    <ul class="pagination justify-content-center">
                        <li class="page-item ${page === 1 ? 'disabled' : ''}">
                            <a class="page-link" href="#" data-page="${page - 1}">Previous</a>
                        </li>
                        ${Array.from({length: totalPages}, (_, i) => `
                            <li class="page-item ${page === i + 1 ? 'active' : ''}">
                                <a class="page-link" href="#" data-page="${i + 1}">${i + 1}</a>
                            </li>
                        `).join('')}
                        <li class="page-item ${page === totalPages ? 'disabled' : ''}">
                            <a class="page-link" href="#" data-page="${page + 1}">Next</a>
                        </li>
                    </ul>
                </nav>
            </div>`;

        document.getElementById('tableHead').innerHTML = `<tr>${sharedDataset.headers.map(header => `<th>${header}</th>`).join('')}</tr>`;
        document.getElementById('tableBody').innerHTML = paginatedRows.map(row => {
            return `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
        }).join('');

        document.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const newPage = parseInt(e.target.dataset.page);
                if (newPage > 0 && newPage <= totalPages) displayDataTable(newPage);
            });
        });
    }

    // Clear data section
    function clearDataSection() {
        sharedDataset = { headers: [], rows: [] };
        localStorage.removeItem('savedDataset');
        document.getElementById('data-content').innerHTML = `
            <div class="text-center py-5">
                <h4>Data Cleared</h4>
                <p>Dataset has been cleared. Load new data to continue.</p>
                <button class="btn btn-primary" id="reloadData">Load Data</button>
            </div>`;
        document.getElementById('reloadData').addEventListener('click', loadDataSection);
        showSuccessMessage('Dataset cleared successfully!', 'data-content');
    }

    // Clean data section
    function cleanDataSection() {
        document.getElementById('data-content').innerHTML = `
            <div class="card bg-dark text-light mb-3">
                <div class="card-header">Financial Data Cleaning Options</div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <button class="btn btn-outline-light mb-2 w-100" id="fill-missing">Fill Missing OHLCV</button>
                            <button class="btn btn-outline-light mb-2 w-100" id="filter-low-volume">Filter Low Volume Days</button>
                        </div>
                        <div class="col-md-6">
                            <button class="btn btn-outline-light mb-2 w-100" id="remove-outliers">Remove Price Outliers</button>
                            <button class="btn btn-outline-light mb-2 w-100" id="remove-duplicates">Remove Duplicate Rows</button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="cleaning-result"></div>
        `;

        document.getElementById('fill-missing').addEventListener('click', () => {
            try {
                const beforeCount = sharedDataset.rows.length;
                sharedDataset.rows = sharedDataset.rows.map((row, i) => {
                    if (i === 0) return row;
                    return row.map((cell, j) => {
                        if (cell === '' || isNaN(parseFloat(cell))) {
                            return sharedDataset.rows[i - 1][j];
                        }
                        return cell;
                    });
                });
                showSuccessMessage(`Filled missing values in ${beforeCount - sharedDataset.rows.length} rows.`, 'cleaning-result');
                document.getElementById('cleaning-result').innerHTML = renderDataTable();
            } catch (error) {
                showErrorMessage(error.message, 'cleaning-result');
            }
        });

        document.getElementById('filter-low-volume').addEventListener('click', () => {
            showModal('Filter Low Volume Days', `
                <label for="volumeThreshold">Minimum Volume:</label>
                <input type="number" id="volumeThreshold" class="form-control" value="10000" min="0">
            `, (inputs) => {
                try {
                    const volumeThreshold = parseFloat(inputs.volumeThreshold);
                    if (isNaN(volumeThreshold) || volumeThreshold < 0) throw new Error('Invalid volume threshold.');
                    const volumeIndex = sharedDataset.headers.indexOf('Volume');
                    if (volumeIndex === -1) throw new Error('Volume column not found.');
                    const beforeCount = sharedDataset.rows.length;
                    sharedDataset.rows = sharedDataset.rows.filter(row => parseFloat(row[volumeIndex]) >= volumeThreshold);
                    showSuccessMessage(`Removed ${beforeCount - sharedDataset.rows.length} low-volume days.`, 'cleaning-result');
                    document.getElementById('cleaning-result').innerHTML = renderDataTable();
                } catch (error) {
                    showErrorMessage(error.message, 'cleaning-result');
                }
            });
        });

        document.getElementById('remove-outliers').addEventListener('click', () => {
            showModal('Remove Price Outliers', `
                <label for="columnName">Column Name:</label>
                <input type="text" id="columnName" class="form-control" placeholder="e.g., Close">
            `, (inputs) => {
                try {
                    const column = sanitizeInput(inputs.columnName);
                    const columnIndex = getColumnIndex(column);
                    const values = getColumnData(columnIndex);
                    if (values.length === 0) throw new Error('No numeric data in the selected column.');
                    const outliers = detectOutliers(values);
                    const beforeCount = sharedDataset.rows.length;
                    sharedDataset.rows = sharedDataset.rows.filter(row => {
                        const value = parseFloat(row[columnIndex]);
                        return isNaN(value) || !outliers.includes(value);
                    });
                    showSuccessMessage(`Removed ${beforeCount - sharedDataset.rows.length} outliers from "${column}".`, 'cleaning-result');
                    document.getElementById('cleaning-result').innerHTML = renderDataTable();
                } catch (error) {
                    showErrorMessage(error.message, 'cleaning-result');
                }
            });
        });

        document.getElementById('remove-duplicates').addEventListener('click', () => {
            try {
                const beforeCount = sharedDataset.rows.length;
                const uniqueRows = new Map();
                sharedDataset.rows.forEach(row => uniqueRows.set(JSON.stringify(row), row));
                sharedDataset.rows = Array.from(uniqueRows.values());
                showSuccessMessage(`Removed ${beforeCount - sharedDataset.rows.length} duplicate rows.`, 'cleaning-result');
                document.getElementById('cleaning-result').innerHTML = renderDataTable();
            } catch (error) {
                showErrorMessage(error.message, 'cleaning-result');
            }
        });
    }

    // Filter data section
    function filterDataSection() {
        document.getElementById('data-content').innerHTML = `
            <div class="card bg-dark text-light mb-3">
                <div class="card-header">Data Filtering Options</div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <button class="btn btn-outline-light mb-2 w-100" id="filter-condition">Filter by Condition</button>
                            <button class="btn btn-outline-light mb-2 w-100" id="filter-range">Filter by Range</button>
                        </div>
                        <div class="col-md-6">
                            <button class="btn btn-outline-light mb-2 w-100" id="filter-top-n">Filter Top N Rows</button>
                            <button class="btn btn-outline-light mb-2 w-100" id="filter-column-null">Filter Non-Null Rows</button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="filtering-result"></div>
        `;

        document.getElementById('filter-condition').addEventListener('click', () => {
            showModal('Filter by Condition', `
                <label for="condition">Condition (e.g., Close > 100):</label>
                <input type="text" id="condition" class="form-control" placeholder="e.g., Close > 100">
            `, (inputs) => {
                try {
                    const condition = sanitizeInput(inputs.condition);
                    const beforeCount = sharedDataset.rows.length;
                    const matches = condition.match(/(\w+)\s*([<>=!]+)\s*(.+)/);
                    if (!matches || matches.length < 4) throw new Error('Invalid condition format.');
                    const [, column, operator, valueStr] = matches;
                    const columnIndex = getColumnIndex(column);
                    const value = isNaN(parseFloat(valueStr)) ? valueStr.trim() : parseFloat(valueStr);

                    sharedDataset.rows = sharedDataset.rows.filter(row => {
                        const cellValue = row[columnIndex];
                        const numericCellValue = parseFloat(cellValue);
                        switch (operator) {
                            case '>': return !isNaN(numericCellValue) && numericCellValue > value;
                            case '<': return !isNaN(numericCellValue) && numericCellValue < value;
                            case '>=': return !isNaN(numericCellValue) && numericCellValue >= value;
                            case '<=': return !isNaN(numericCellValue) && numericCellValue <= value;
                            case '==': return cellValue == value;
                            case '!=': return cellValue != value;
                            default: throw new Error(`Unsupported operator: ${operator}`);
                        }
                    });

                    showSuccessMessage(`Filtered ${beforeCount - sharedDataset.rows.length} rows.`, 'filtering-result');
                    document.getElementById('filtering-result').innerHTML = renderDataTable();
                } catch (error) {
                    showErrorMessage(error.message, 'filtering-result');
                }
            });
        });

        document.getElementById('filter-range').addEventListener('click', () => {
            showModal('Filter by Range', `
                <label for="columnName">Column Name:</label>
                <input type="text" id="columnName" class="form-control" placeholder="e.g., Close">
                <label for="minValue">Minimum Value:</label>
                <input type="number" id="minValue" class="form-control">
                <label for="maxValue">Maximum Value:</label>
                <input type="number" id="maxValue" class="form-control">
            `, (inputs) => {
                try {
                    const column = sanitizeInput(inputs.columnName);
                    const minValue = parseFloat(inputs.minValue);
                    const maxValue = parseFloat(inputs.maxValue);
                    if (isNaN(minValue) || isNaN(maxValue) || minValue > maxValue) {
                        throw new Error('Invalid range values.');
                    }
                    const columnIndex = getColumnIndex(column);
                    const beforeCount = sharedDataset.rows.length;
                    sharedDataset.rows = sharedDataset.rows.filter(row => {
                        const value = parseFloat(row[columnIndex]);
                        return !isNaN(value) && value >= minValue && value <= maxValue;
                    });
                    showSuccessMessage(`Filtered to ${sharedDataset.rows.length} rows in range [${minValue}, ${maxValue}].`, 'filtering-result');
                    document.getElementById('filtering-result').innerHTML = renderDataTable();
                } catch (error) {
                    showErrorMessage(error.message, 'filtering-result');
                }
            });
        });

        document.getElementById('filter-top-n').addEventListener('click', () => {
            showModal('Filter Top N Rows', `
                <label for="nRows">Number of Rows:</label>
                <input type="number" id="nRows" class="form-control" value="100" min="1">
            `, (inputs) => {
                try {
                    const n = parseInt(inputs.nRows, 10);
                    if (isNaN(n) || n <= 0) throw new Error('Invalid value for N.');
                    const beforeCount = sharedDataset.rows.length;
                    sharedDataset.rows = sharedDataset.rows.slice(0, n);
                    showSuccessMessage(`Kept top ${n} rows (removed ${beforeCount - n} rows).`, 'filtering-result');
                    document.getElementById('filtering-result').innerHTML = renderDataTable();
                } catch (error) {
                    showErrorMessage(error.message, 'filtering-result');
                }
            });
        });

        document.getElementById('filter-column-null').addEventListener('click', () => {
            showModal('Filter Non-Null Rows', `
                <label for="columnName">Column Name:</label>
                <input type="text" id="columnName" class="form-control" placeholder="e.g., Close">
            `, (inputs) => {
                try {
                    const column = sanitizeInput(inputs.columnName);
                    const columnIndex = getColumnIndex(column);
                    const beforeCount = sharedDataset.rows.length;
                    sharedDataset.rows = sharedDataset.rows.filter(row => row[columnIndex] !== '' && row[columnIndex] !== null);
                    showSuccessMessage(`Kept ${sharedDataset.rows.length} non-null rows in "${column}".`, 'filtering-result');
                    document.getElementById('filtering-result').innerHTML = renderDataTable();
                } catch (error) {
                    showErrorMessage(error.message, 'filtering-result');
                }
            });
        });
    }

    // Export data section
    function exportDataSection() {
        if (!sharedDataset.headers.length) {
            showErrorMessage('No data available to export.', 'data-content');
            return;
        }

        const csv = [sharedDataset.headers, ...sharedDataset.rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exported_dataset.csv';
        a.click();
        URL.revokeObjectURL(url);
        showSuccessMessage('Data exported successfully!', 'data-content');
    }

    // Plot functionality
    function implementPlotFunctionality() {
        const generateChartButton = document.getElementById('generateChart');
        if (generateChartButton) {
            generateChartButton.addEventListener('click', () => {
                try {
                    const ticker = document.getElementById('xAxisColumn').value;
                    const chartType = document.getElementById('chartType').value;
                    const chartLabel = document.getElementById('chartLabel').value || ticker;
                    const chartColor = document.getElementById('chartColor').value;

                    const closeIndex = getColumnIndex(ticker);
                    const dates = sharedDataset.rows.map(row => row[0]);
                    const closes = sharedDataset.rows.map(row => parseFloat(row[closeIndex])).filter(v => !isNaN(v));

                    if (chartType === 'candlestick') {
                        showErrorMessage('Candlestick charts require chartjs-chart-financial plugin.', 'chartsContainer');
                        return;
                    } else {
                        createChart(chartType, closes, chartLabel, chartColor, dates);
                    }
                } catch (error) {
                    showErrorMessage(error.message, 'chartsContainer');
                }
            });
        }
    }

    // Create chart
    function createChart(type, data, label, color, labels) {
        const chartWrapper = document.createElement('div');
        chartWrapper.className = 'chart-wrapper card m-2 p-2';
        chartWrapper.style.cssText = 'width: 45%; min-width: 300px; height: 400px; position: relative;';
        const canvas = document.createElement('canvas');
        chartWrapper.appendChild(canvas);

        const removeButton = document.createElement('button');
        removeButton.textContent = '×';
        removeButton.style.cssText = 'position: absolute; top: 5px; right: 5px; border: none; background: transparent; font-size: 20px; cursor: pointer; color: #dc3545;';
        removeButton.addEventListener('click', () => {
            if (canvas.chartInstance) canvas.chartInstance.destroy();
            chartWrapper.remove();
        });
        chartWrapper.appendChild(removeButton);

        document.getElementById('chartsContainer').appendChild(chartWrapper);

        const ctx = canvas.getContext('2d');
        const config = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    borderColor: color,
                    backgroundColor: color,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: 'Date' } },
                    y: { title: { display: true, text: 'Price' } }
                }
            }
        };

        const chartInstance = new dependencies.Chart(ctx, config);
        canvas.chartInstance = chartInstance;
    }

    // Enhanced Risk Management Implementation
    function implementRiskFunctionality() {
        const statsColumn = document.getElementById('statsColumn');
        const benchmarkTicker = document.getElementById('benchmarkTicker');

        const generateStatsButton = document.getElementById('generateStats');
        if (generateStatsButton) {
            generateStatsButton.addEventListener('click', () => {
                try {
                    const selectedOptions = Array.from(statsColumn.selectedOptions).map(option => option.value);
                    if (selectedOptions.length === 0) throw new Error('Please select at least one ticker.');

                    const selectedStats = {
                        sharpe: document.getElementById('optionSharpe').checked,
                        var: document.getElementById('optionVaR').checked,
                        cvar: document.getElementById('optionCVaR').checked,
                        drawdown: document.getElementById('optionDrawdown').checked,
                        sortino: document.getElementById('optionSortino').checked,
                        beta: document.getElementById('optionBeta').checked,
                        correl: document.getElementById('optionCorrelation').checked
                    };

                    let benchmarkData = null;
                    if ((selectedStats.beta || selectedStats.correl) && !benchmarkTicker.value) {
                        throw new Error('Please select a benchmark for Beta/Correlation.');
                    }
                    if (selectedStats.beta || selectedStats.correl) {
                        const benchmarkIndex = getColumnIndex(benchmarkTicker.value);
                        benchmarkData = getColumnData(benchmarkIndex);
                        benchmarkData = benchmarkData.slice(1).map((price, i) => 
                            (price - benchmarkData[i]) / benchmarkData[i]);
                    }

                    let tableHTML = `
                        <div class="table-responsive">
                            <table class="table table-dark table-striped w-100">
                                <thead>
                                    <tr>
                                        <th>Ticker</th>`;
                    if (selectedStats.sharpe) tableHTML += '<th>Sharpe Ratio</th>';
                    if (selectedStats.var) tableHTML += '<th>VaR (95%)</th>';
                    if (selectedStats.cvar) tableHTML += '<th>CVaR (95%)</th>';
                    if (selectedStats.drawdown) tableHTML += '<th>Max Drawdown</th>';
                    if (selectedStats.sortino) tableHTML += '<th>Sortino Ratio</th>';
                    if (selectedStats.beta) tableHTML += '<th>Beta</th>';
                    if (selectedStats.correl) tableHTML += '<th>Correlation</th>';
                    tableHTML += `</tr>
                                </thead>
                                <tbody>`;

                    const correlationData = selectedStats.correl && selectedOptions.length > 1 ? [] : null;

                    for (const ticker of selectedOptions) {
                        try {
                            const columnIndex = getColumnIndex(ticker);
                            const closes = getColumnData(columnIndex);
                            const returns = closes.slice(1).map((close, i) => (close - closes[i]) / closes[i]);

                            if (returns.length === 0) {
                                tableHTML += `<tr>
                                    <td>${ticker}</td>
                                    <td colspan="${Object.values(selectedStats).filter(Boolean).length}">No valid data</td>
                                </tr>`;
                                continue;
                            }

                            let rowHTML = `<tr><td>${ticker}</td>`;

                            if (selectedStats.sharpe) {
                                const meanReturn = calculateMean(returns) * 252;
                                const stdDev = calculateStdDev(returns, calculateMean(returns)) * Math.sqrt(252);
                                const sharpe = stdDev > 0 ? (meanReturn - 0.02) / stdDev : 0;
                                rowHTML += `<td>${sharpe.toFixed(2)}</td>`;
                            }

                            if (selectedStats.var) {
                                const sortedReturns = [...returns].sort((a, b) => a - b);
                                const var95 = sortedReturns[Math.floor(sortedReturns.length * 0.05)] * Math.sqrt(252);
                                rowHTML += `<td>${(var95 * 100).toFixed(2)}%</td>`;
                            }

                            if (selectedStats.cvar) {
                                const sortedReturns = [...returns].sort((a, b) => a - b);
                                const cutoff = Math.floor(sortedReturns.length * 0.05);
                                const cvar95 = calculateMean(sortedReturns.slice(0, cutoff)) * Math.sqrt(252);
                                rowHTML += `<td>${(cvar95 * 100).toFixed(2)}%</td>`;
                            }

                            if (selectedStats.drawdown) {
                                const equity = [10000];
                                for (let i = 1; i < closes.length; i++) {
                                    equity.push(equity[equity.length - 1] * (1 + (closes[i] - closes[i - 1]) / closes[i - 1]));
                                }
                                const maxDrawdown = calculateMaxDrawdown(equity);
                                rowHTML += `<td>${(maxDrawdown * 100).toFixed(2)}%</td>`;
                            }

                            if (selectedStats.sortino) {
                                const targetReturn = 0;
                                const downReturns = returns.filter(r => r < targetReturn);
                                const downside = downReturns.length > 0 
                                    ? Math.sqrt(downReturns.reduce((sum, r) => sum + Math.pow(r - targetReturn, 2), 0) / downReturns.length) * Math.sqrt(252)
                                    : 0.0001;
                                const meanReturn = calculateMean(returns) * 252;
                                const sortino = (meanReturn - 0.02) / downside;
                                rowHTML += `<td>${sortino.toFixed(2)}</td>`;
                            }

                            if (selectedStats.beta) {
                                const beta = calculateBeta(returns, benchmarkData);
                                rowHTML += `<td>${beta.toFixed(2)}</td>`;
                            }

                            if (selectedStats.correl) {
                                const correlation = calculateCorrelation(returns, benchmarkData);
                                rowHTML += `<td>${correlation.toFixed(2)}</td>`;
                                if (correlationData) {
                                    correlationData.push({ ticker, returns });
                                }
                            }

                            rowHTML += `</tr>`;
                            tableHTML += rowHTML;
                        } catch (error) {
                            console.error(`Error processing ticker ${ticker}:`, error);
                        }
                    }

                    tableHTML += '</tbody></table></div>';

                    if (selectedStats.var || selectedStats.cvar) {
                        tableHTML += `
                        <div class="card bg-dark text-light mt-4">
                            <div class="card-header">
                                <h5>Stress Test Analysis</h5>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <label>Market Movement:</label>
                                        <select id="stressScenario" class="form-control mb-3">
                                            <option value="recession">Recession (-20%)</option>
                                            <option value="correction">Market Correction (-10%)</option>
                                            <option value="rate-hike">Rate Hike (-5%)</option>
                                            <option value="custom">Custom Scenario</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6" id="customStressDiv" style="display:none">
                                        <label>Custom Market Movement (%):</label>
                                        <input type="number" id="customStressValue" class="form-control mb-3" value="-15">
                                    </div>
                                </div>
                                <button class="btn btn-primary" id="runStressTest">Run Stress Test</button>
                                <div id="stressTestResults" class="mt-3"></div>
                            </div>
                        </div>`;
                    }

                    if (correlationData && correlationData.length > 1) {
                        tableHTML += `
                        <div class="card bg-dark text-light mt-4">
                            <div class="card-header">
                                <h5>Correlation Matrix</h5>
                            </div>
                            <div class="card-body">
                                <div id="correlationHeatmap" style="height: 400px;"></div>
                            </div>
                        </div>`;
                    }

                    document.getElementById('statsResult').innerHTML = tableHTML;

                    if (selectedStats.var || selectedStats.cvar) {
                        const stressScenarioSelect = document.getElementById('stressScenario');
                        if (stressScenarioSelect) {
                            stressScenarioSelect.addEventListener('change', (e) => {
                                document.getElementById('customStressDiv').style.display = e.target.value === 'custom' ? 'block' : 'none';
                            });
                        }

                        const runStressTestButton = document.getElementById('runStressTest');
                        if (runStressTestButton) {
                            runStressTestButton.addEventListener('click', () => {
                                runStressTest(selectedOptions);
                            });
                        }
                    }

                    if (correlationData && correlationData.length > 1) {
                        createCorrelationHeatmap(correlationData);
                    }

                } catch (error) {
                    showErrorMessage(error.message, 'statsResult');
                }
            });
        }

        if (benchmarkTicker) {
            benchmarkTicker.addEventListener('change', () => {
                const disabled = !benchmarkTicker.value;
                document.getElementById('optionBeta').disabled = disabled;
                document.getElementById('optionCorrelation').disabled = disabled;
                if (disabled) {
                    document.getElementById('optionBeta').checked = false;
                    document.getElementById('optionCorrelation').checked = false;
                }
            });
        }
    }

    // Updated Stress Test Functionality
    function runStressTest(tickers) {
        try {
            const scenario = document.getElementById('stressScenario').value;
            let marketShock;
            switch (scenario) {
                case 'recession': marketShock = -0.20; break;
                case 'correction': marketShock = -0.10; break;
                case 'rate-hike': marketShock = -0.05; break;
                case 'custom':
                    marketShock = parseFloat(document.getElementById('customStressValue').value) / 100;
                    if (isNaN(marketShock)) throw new Error('Invalid custom market movement.');
                    break;
                default: throw new Error('Invalid scenario.');
            }

            const benchmarkTicker = document.getElementById('benchmarkTicker').value;
            if (!benchmarkTicker) throw new Error('Benchmark ticker required for stress test.');

            const benchmarkIndex = getColumnIndex(benchmarkTicker);
            const benchmarkData = getColumnData(benchmarkIndex);
            const benchmarkReturns = benchmarkData.slice(1).map((price, i) => 
                (price - benchmarkData[i]) / benchmarkData[i]);

            showWeightInputModal(tickers, (weights) => {
                let resultsHTML = `
                    <table class="table table-dark table-striped mt-3">
                        <thead>
                            <tr>
                                <th>Ticker</th>
                                <th>Weight (%)</th>
                                <th>Beta</th>
                                <th>Expected Loss</th>
                                <th>Portfolio Impact</th>
                            </tr>
                        </thead>
                        <tbody>`;

                let totalLoss = 0;
                tickers.forEach((ticker, i) => {
                    try {
                        const columnIndex = getColumnIndex(ticker);
                        const closes = getColumnData(columnIndex);
                        const returns = closes.slice(1).map((close, i) => (close - closes[i]) / closes[i]);

                        const beta = calculateBeta(returns, benchmarkReturns);
                        const expectedLoss = beta * marketShock;
                        const portfolioImpact = expectedLoss * weights[i];
                        totalLoss += portfolioImpact;

                        resultsHTML += `
                            <tr>
                                <td>${ticker}</td>
                                <td>${(weights[i] * 100).toFixed(2)}</td>
                                <td>${beta.toFixed(2)}</td>
                                <td>${(expectedLoss * 100).toFixed(2)}%</td>
                                <td>${(portfolioImpact * 100).toFixed(2)}%</td>
                            </tr>`;
                    } catch (error) {
                        console.error(`Error in stress test for ${ticker}:`, error);
                    }
                });

                resultsHTML += `
                            <tr class="font-weight-bold">
                                <td colspan="4">Total Portfolio Impact:</td>
                                <td>${(totalLoss * 100).toFixed(2)}%</td>
                            </tr>
                        </tbody>
                    </table>`;

                document.getElementById('stressTestResults').innerHTML = resultsHTML;
            });
        } catch (error) {
            showErrorMessage(`Stress test error: ${error.message}`, 'stressTestResults');
        }
    }

    // Enhanced Correlation Heatmap with Chart.js
    function createCorrelationHeatmap(correlationData) {
        try {
            const tickers = correlationData.map(d => d.ticker);
            const n = tickers.length;
            const correlationMatrix = Array(n).fill().map(() => Array(n).fill(0));

            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    correlationMatrix[i][j] = i === j ? 1 : calculateCorrelation(
                        correlationData[i].returns,
                        correlationData[j].returns
                    );
                }
            }

            const container = document.getElementById('correlationHeatmap');
            container.innerHTML = '';
            const canvas = document.createElement('canvas');
            container.appendChild(canvas);

            new dependencies.Chart(canvas, {
                type: 'matrix',
                data: {
                    datasets: [{
                        label: 'Correlation Matrix',
                        data: correlationMatrix.flatMap((row, y) => 
                            row.map((value, x) => ({
                                x,
                                y,
                                v: value
                            }))
                        ),
                        backgroundColor(c) {
                            const value = c.raw.v;
                            const r = Math.max(0, Math.floor(255 * value));
                            const b = Math.max(0, Math.floor(255 * -value));
                            const g = Math.max(0, 255 - Math.abs(Math.floor(255 * value)));
                            return `rgb(${r}, ${g}, ${b})`;
                        },
                        borderColor: '#343a40',
                        borderWidth: 1,
                        width: ({chart}) => chart.chartArea.width / n,
                        height: ({chart}) => chart.chartArea.height / n
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: 'category',
                            labels: tickers,
                            title: { display: true, text: 'Tickers' }
                        },
                        y: {
                            type: 'category',
                            labels: tickers,
                            title: { display: true, text: 'Tickers' },
                            reverse: true
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (ctx) => `Correlation: ${ctx.raw.v.toFixed(2)}`
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating correlation heatmap:', error);
            showErrorMessage('Failed to render correlation heatmap.', 'correlationHeatmap');
        }
    }

    // Basket Trading Functionality
    function implementBasketTradingFunctionality() {
        let currentBasket = { name: '', tickers: [], weights: [] };
        let pieChartInstance = null;
        let performanceChartInstance = null;

        const addToBasketButton = document.getElementById('addToBasket');
        if (addToBasketButton) {
            addToBasketButton.addEventListener('click', () => {
                const availableTickers = document.getElementById('availableTickers');
                const selectedTickers = document.getElementById('selectedTickers');
                Array.from(availableTickers.selectedOptions).forEach(option => {
                    if (!Array.from(selectedTickers.options).some(o => o.value === option.value)) {
                        const newOption = document.createElement('option');
                        newOption.value = option.value;
                        newOption.text = option.text;
                        selectedTickers.add(newOption);
                    }
                });
            });
        }

        const removeFromBasketButton = document.getElementById('removeFromBasket');
        if (removeFromBasketButton) {
            removeFromBasketButton.addEventListener('click', () => {
                const selectedTickers = document.getElementById('selectedTickers');
                Array.from(selectedTickers.selectedOptions).reverse().forEach(option => 
                    selectedTickers.remove(option.index));
            });
        }

        const createBasketButton = document.getElementById('createBasket');
        if (createBasketButton) {
            createBasketButton.addEventListener('click', () => {
                try {
                    const basketName = sanitizeInput(document.getElementById('basketName').value.trim()) || 'My Basket';
                    const selectedTickers = Array.from(document.getElementById('selectedTickers').options).map(o => o.value);
                    const weightingMethod = document.getElementById('weightingMethod').value;

                    if (selectedTickers.length === 0) throw new Error('Please select at least one ticker for the basket.');

                    let weights = [];
                    switch (weightingMethod) {
                        case 'equal':
                            weights = selectedTickers.map(() => 1 / selectedTickers.length);
                            break;
                        case 'market-cap':
                            showSuccessMessage('Note: Using latest close as market cap proxy. For accurate weights, upload market cap data.', 'basketWeightsTable');
                            weights = selectedTickers.map(ticker => {
                                const closeIndex = getColumnIndex(ticker);
                                const latestClose = parseFloat(sharedDataset.rows[0][closeIndex]);
                                return isNaN(latestClose) ? 0 : latestClose;
                            });
                            const totalMarketCap = weights.reduce((sum, w) => sum + w, 0);
                            if (totalMarketCap === 0) throw new Error('Invalid market cap data.');
                            weights = weights.map(w => w / totalMarketCap);
                            break;
                        case 'inverse-volatility':
                            weights = selectedTickers.map(ticker => {
                                const closeIndex = getColumnIndex(ticker);
                                const closes = getColumnData(closeIndex);
                                const returns = closes.slice(1).map((close, i) => (close - closes[i]) / closes[i]);
                                const volatility = calculateStdDev(returns, calculateMean(returns));
                                return volatility > 0 ? 1 / volatility : 1;
                            });
                            const totalInverseVol = weights.reduce((sum, w) => sum + w, 0);
                            if (totalInverseVol === 0) throw new Error('Invalid volatility data.');
                            weights = weights.map(w => w / totalInverseVol);
                            break;
                        case 'custom':
                            showWeightInputModal(selectedTickers, newWeights => {
                                weights = newWeights;
                                currentBasket = { name: basketName, tickers: selectedTickers, weights };
                                updateBasketDisplay(basketName, selectedTickers, weights);
                            });
                            return;
                    }

                    currentBasket = { name: basketName, tickers: selectedTickers, weights };
                    updateBasketDisplay(basketName, selectedTickers, weights);

                } catch (error) {
                    showErrorMessage(error.message, 'basketWeightsTable');
                }
            });
        }

        const exportBasketButton = document.getElementById('exportBasket');
        if (exportBasketButton) {
            exportBasketButton.addEventListener('click', () => {
                if (!currentBasket.tickers.length) {
                    showErrorMessage('No basket available to export.', 'basketWeightsTable');
                    return;
                }

                const csv = [
                    ['Basket Name', currentBasket.name],
                    [],
                    ['Ticker', 'Weight (%)'],
                    ...currentBasket.tickers.map((ticker, i) => [ticker, (currentBasket.weights[i] * 100).toFixed(2)])
                ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${currentBasket.name.replace(/\s+/g, '_')}_basket.csv`;
                a.click();
                URL.revokeObjectURL(url);
                showSuccessMessage('Basket exported successfully!', 'basketWeightsTable');
            });
        }

        const saveBasketButton = document.getElementById('saveBasket');
        if (saveBasketButton) {
            saveBasketButton.addEventListener('click', () => {
                if (!currentBasket.tickers.length) {
                    showErrorMessage('No basket available to save.', 'basketWeightsTable');
                    return;
                }

                try {
                    let savedBaskets = JSON.parse(localStorage.getItem('savedBaskets') || '[]');
                    const existingIndex = savedBaskets.findIndex(b => b.name === currentBasket.name);
                    if (existingIndex >= 0) {
                        savedBaskets[existingIndex] = { ...currentBasket };
                    } else {
                        savedBaskets.push({ ...currentBasket });
                    }
                    localStorage.setItem('savedBaskets', JSON.stringify(savedBaskets));
                    updateSavedBasketsDropdown();
                    showSuccessMessage(`Basket "${currentBasket.name}" saved successfully!`, 'basketWeightsTable');
                } catch (error) {
                    showErrorMessage(`Error saving basket: ${error.message}`, 'basketWeightsTable');
                }
            });
        }

        const loadSavedBasketButton = document.getElementById('loadSavedBasket');
        if (loadSavedBasketButton) {
            loadSavedBasketButton.addEventListener('click', () => {
                const dropdown = document.getElementById('savedBasketsDropdown');
                const selectedValue = dropdown.value;

                if (!selectedValue) {
                    showErrorMessage('Please select a basket to load.', 'basketWeightsTable');
                    return;
                }

                try {
                    const savedBaskets = JSON.parse(localStorage.getItem('savedBaskets') || '[]');
                    const selectedBasket = savedBaskets.find(b => b.name === selectedValue);
                    if (!selectedBasket) throw new Error('Selected basket not found.');

                    currentBasket = { ...selectedBasket };
                    document.getElementById('basketName').value = currentBasket.name;
                    const selectedTickersSelect = document.getElementById('selectedTickers');
                    selectedTickersSelect.innerHTML = '';
                    currentBasket.tickers.forEach(ticker => {
                        const option = document.createElement('option');
                        option.value = ticker;
                        option.text = ticker;
                        selectedTickersSelect.add(option);
                    });
                    updateBasketDisplay(currentBasket.name, currentBasket.tickers, currentBasket.weights);
                    showSuccessMessage(`Basket "${currentBasket.name}" loaded successfully!`, 'basketWeightsTable');
                } catch (error) {
                    showErrorMessage(`Error loading basket: ${error.message}`, 'basketWeightsTable');
                }
            });
        }

        const analyzeBasketButton = document.getElementById('analyzeBasket');
        if (analyzeBasketButton) {
            analyzeBasketButton.addEventListener('click', () => {
                if (!currentBasket.tickers.length) {
                    showErrorMessage('No basket available to analyze.', 'basketMetrics');
                    return;
                }

                try {
                    const benchmark = document.getElementById('basketBenchmark').value;
                    const periodOption = document.getElementById('basketPeriod').value;

                    let periodRows = sharedDataset.rows.length;
                    switch (periodOption) {
                        case '1y': periodRows = 252; break;
                        case '6m': periodRows = 126; break;
                        case '3m': periodRows = 63; break;
                        case '1m': periodRows = 21; break;
                    }
                    periodRows = Math.min(periodRows, sharedDataset.rows.length);

                    const basketEquity = [100];
                    const dates = sharedDataset.rows.slice(0, periodRows).map(row => row[0]);

                    let benchmarkEquity = null;
                    if (benchmark) {
                        const benchmarkIndex = getColumnIndex(benchmark);
                        const benchmarkPrices = sharedDataset.rows.slice(0, periodRows)
                            .map(row => parseFloat(row[benchmarkIndex]))
                            .filter(p => !isNaN(p));
                        benchmarkEquity = [100];
                        for (let i = 1; i < benchmarkPrices.length; i++) {
                            const dailyReturn = (benchmarkPrices[i] - benchmarkPrices[i - 1]) / benchmarkPrices[i - 1];
                            benchmarkEquity.push(benchmarkEquity[benchmarkEquity.length - 1] * (1 + dailyReturn));
                        }
                    }

//
for (let rowIndex = 1; rowIndex < periodRows; rowIndex++) {
    let dailyReturn = 0;
    currentBasket.tickers.forEach((ticker, i) => {
        const weight = currentBasket.weights[i];
        const tickerIndex = getColumnIndex(ticker);
        const currentPrice = parseFloat(sharedDataset.rows[rowIndex][tickerIndex]);
        const prevPrice = parseFloat(sharedDataset.rows[rowIndex - 1][tickerIndex]);
        if (!isNaN(currentPrice) && !isNaN(prevPrice) && prevPrice !== 0) {
            dailyReturn += weight * ((currentPrice - prevPrice) / prevPrice);
        }
    });
    basketEquity.push(basketEquity[basketEquity.length - 1] * (1 + dailyReturn));
}
                    // Calculate performance metrics
                    const basketReturns = basketEquity.slice(1).map((equity, i) => 
                        (equity - basketEquity[i]) / basketEquity[i]);
                    const annualizedReturn = calculateMean(basketReturns) * 252;
                    const annualizedVolatility = calculateStdDev(basketReturns, calculateMean(basketReturns)) * Math.sqrt(252);
                    const sharpeRatio = annualizedVolatility > 0 ? (annualizedReturn - 0.02) / annualizedVolatility : 0;
                    const maxDrawdown = calculateMaxDrawdown(basketEquity);

                    let metricsHTML = `
                        <table class="table table-dark table-striped">
                            <thead>
                                <tr>
                                    <th>Metric</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>Annualized Return</td><td>${(annualizedReturn * 100).toFixed(2)}%</td></tr>
                                <tr><td>Annualized Volatility</td><td>${(annualizedVolatility * 100).toFixed(2)}%</td></tr>
                                <tr><td>Sharpe Ratio</td><td>${sharpeRatio.toFixed(2)}</td></tr>
                                <tr><td>Max Drawdown</td><td>${(maxDrawdown * 100).toFixed(2)}%</td></tr>
                    `;

                    if (benchmark && benchmarkEquity) {
                        const benchmarkReturns = benchmarkEquity.slice(1).map((equity, i) => 
                            (equity - benchmarkEquity[i]) / benchmarkEquity[i]);
                        const beta = calculateBeta(basketReturns, benchmarkReturns);
                        const correlation = calculateCorrelation(basketReturns, benchmarkReturns);
                        metricsHTML += `
                            <tr><td>Beta</td><td>${beta.toFixed(2)}</td></tr>
                            <tr><td>Correlation</td><td>${correlation.toFixed(2)}</td></tr>
                        `;
                    }

                    metricsHTML += `</tbody></table>`;
                    document.getElementById('basketMetrics').innerHTML = metricsHTML;

                    // Update performance chart
                    if (performanceChartInstance) {
                        performanceChartInstance.destroy();
                    }
                    const performanceCanvas = document.createElement('canvas');
                    document.getElementById('basketPerformanceChart').innerHTML = '';
                    document.getElementById('basketPerformanceChart').appendChild(performanceCanvas);

                    performanceChartInstance = new dependencies.Chart(performanceCanvas, {
                        type: 'line',
                        data: {
                            labels: dates,
                            datasets: [
                                {
                                    label: currentBasket.name,
                                    data: basketEquity,
                                    borderColor: '#007bff',
                                    fill: false
                                },
                                ...(benchmark && benchmarkEquity ? [{
                                    label: benchmark,
                                    data: benchmarkEquity,
                                    borderColor: '#dc3545',
                                    fill: false
                                }] : [])
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                x: { title: { display: true, text: 'Date' } },
                                y: { title: { display: true, text: 'Equity ($)' } }
                            }
                        }
                    });

                    showSuccessMessage('Basket performance analyzed successfully!', 'basketMetrics');
                } catch (error) {
                    showErrorMessage(`Error analyzing basket: ${error.message}`, 'basketMetrics');
                }
            });
        }

        // Initialize saved baskets dropdown
        updateSavedBasketsDropdown();

        function updateBasketDisplay(basketName, tickers, weights) {
            // Update weights table
            let tableHTML = `
                <table class="table table-dark table-striped">
                    <thead>
                        <tr>
                            <th>Ticker</th>
                            <th>Weight (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tickers.map((ticker, i) => `
                            <tr>
                                <td>${ticker}</td>
                                <td>${(weights[i] * 100).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;
            document.getElementById('basketWeightsTable').innerHTML = tableHTML;

            // Update pie chart
            if (pieChartInstance) {
                pieChartInstance.destroy();
            }
            const pieCanvas = document.createElement('canvas');
            document.getElementById('basketPieChart').innerHTML = '';
            document.getElementById('basketPieChart').appendChild(pieCanvas);

            pieChartInstance = new dependencies.Chart(pieCanvas, {
                type: 'pie',
                data: {
                    labels: tickers,
                    datasets: [{
                        data: weights.map(w => w * 100),
                        backgroundColor: tickers.map((_, i) => `hsl(${i * 360 / tickers.length}, 70%, 50%)`)
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: `${basketName} Composition`
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => `${context.label}: ${context.parsed.toFixed(2)}%`
                            }
                        }
                    }
                }
            });

            showSuccessMessage(`Basket "${basketName}" created successfully!`, 'basketWeightsTable');
        }

        function updateSavedBasketsDropdown() {
            const dropdown = document.getElementById('savedBasketsDropdown');
            try {
                const savedBaskets = JSON.parse(localStorage.getItem('savedBaskets') || '[]');
                dropdown.innerHTML = '<option value="">Select a saved basket...</option>' +
                    savedBaskets.map(basket => 
                        `<option value="${basket.name}">${basket.name}</option>`
                    ).join('');
            } catch (error) {
                console.error('Error updating saved baskets dropdown:', error);
            }
        }
    }

    // Portfolio Optimization Functionality
    function implementPortfolioFunctionality() {
        const optimizePortfolioButton = document.getElementById('optimizePortfolio');
        if (optimizePortfolioButton) {
            optimizePortfolioButton.addEventListener('click', () => {
                try {
                    const tickers = Array.from(document.getElementById('portfolioTickers').selectedOptions).map(o => o.value);
                    if (tickers.length === 0) throw new Error('Please select at least one ticker.');
                    const method = document.getElementById('optimizationMethod').value;
                    const riskFreeRate = parseFloat(document.getElementById('riskFreeRate').value) / 100;
                    const transactionCost = parseFloat(document.getElementById('transactionCost').value) / 100;
                    const allowNegativeWeights = document.getElementById('allowNegativeWeights').checked;

                    // Collect returns data
                    const returnsData = tickers.map(ticker => {
                        const columnIndex = getColumnIndex(ticker);
                        const closes = getColumnData(columnIndex);
                        return closes.slice(1).map((close, i) => (close - closes[i]) / closes[i]);
                    });

                    let weights;
                    switch (method) {
                        case 'mean-variance':
                            weights = dependencies.PortfolioAllocation.meanVarianceOptimizationWeights(
                                returnsData, { riskFreeRate, allowShort: allowNegativeWeights }
                            );
                            break;
                        case 'min-volatility':
                            weights = dependencies.PortfolioAllocation.minimumVarianceWeights(
                                returnsData, { allowShort: allowNegativeWeights }
                            );
                            break;
                        case 'risk-parity':
                            weights = dependencies.PortfolioAllocation.riskParityWeights(
                                returnsData, { allowShort: allowNegativeWeights }
                            );
                            break;
                        default:
                            throw new Error('Invalid optimization method.');
                    }

                    if (!weights || weights.length !== tickers.length) {
                        throw new Error('Optimization failed to produce valid weights.');
                    }

                    // Adjust for transaction costs (simplified)
                    const portfolioStats = dependencies.PortfolioAllocation.calculatePortfolioStats(
                        returnsData, weights, { transactionCost }
                    );

                    // Display results
                    let resultHTML = `
                        <table class="table table-dark table-striped">
                            <thead>
                                <tr>
                                    <th>Ticker</th>
                                    <th>Weight (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tickers.map((ticker, i) => `
                                    <tr>
                                        <td>${ticker}</td>
                                        <td>${(weights[i] * 100).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <h5 class="mt-3">Portfolio Metrics</h5>
                        <table class="table table-dark">
                            <tr><td>Expected Return</td><td>${(portfolioStats.expectedReturn * 100).toFixed(2)}%</td></tr>
                            <tr><td>Volatility</td><td>${(portfolioStats.volatility * 100).toFixed(2)}%</td></tr>
                            <tr><td>Sharpe Ratio</td><td>${portfolioStats.sharpeRatio.toFixed(2)}</td></tr>
                        </table>`;

                    document.getElementById('portfolioResult').innerHTML = resultHTML;

                    // Portfolio allocation chart
                    const portfolioCanvas = document.createElement('canvas');
                    document.getElementById('portfolioChart').innerHTML = '';
                    document.getElementById('portfolioChart').appendChild(portfolioCanvas);

                    new dependencies.Chart(portfolioCanvas, {
                        type: 'pie',
                        data: {
                            labels: tickers,
                            datasets: [{
                                data: weights.map(w => w * 100),
                                backgroundColor: tickers.map((_, i) => `hsl(${i * 360 / tickers.length}, 70%, 50%)`)
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                title: { display: true, text: 'Portfolio Allocation' }
                            }
                        }
                    });

                    showSuccessMessage('Portfolio optimized successfully!', 'portfolioResult');
                } catch (error) {
                    showErrorMessage(`Error optimizing portfolio: ${error.message}`, 'portfolioResult');
                }
            });
        }

        const exportPortfolioButton = document.getElementById('exportPortfolio');
        if (exportPortfolioButton) {
            exportPortfolioButton.addEventListener('click', () => {
                // Implementation similar to exportBasketButton
                showSuccessMessage('Portfolio export not fully implemented in this version.', 'portfolioResult');
            });
        }
    }

    // Trading Strategy Functionality
    function implementStrategyFunctionality() {
        const backtestStrategyButton = document.getElementById('backtestStrategy');
        if (backtestStrategyButton) {
            backtestStrategyButton.addEventListener('click', () => {
                try {
                    const ticker = document.getElementById('strategyTicker').value;
                    const strategyType = document.getElementById('strategyType').value;
                    const fastPeriod = parseInt(document.getElementById('fastPeriod').value);
                    const slowPeriod = parseInt(document.getElementById('slowPeriod').value);
                    const transactionCost = parseFloat(document.getElementById('transactionCost').value) / 100;

                    if (fastPeriod >= slowPeriod || fastPeriod < 1 || slowPeriod < 1) {
                        throw new Error('Invalid period parameters.');
                    }

                    const columnIndex = getColumnIndex(ticker);
                    const closes = getColumnData(columnIndex);
                    let signals = [];

                    if (strategyType === 'sma-crossover') {
                        signals = calculateSMACrossover(closes, fastPeriod, slowPeriod);
                    } else if (strategyType === 'macd') {
                        signals = calculateMACD(closes, fastPeriod, slowPeriod, 9);
                    } else {
                        throw new Error('Invalid strategy type.');
                    }

                    // Backtest
                    let equity = [10000];
                    let position = 0;
                    let trades = 0;

                    for (let i = 1; i < signals.length; i++) {
                        if (signals[i] === 1 && position === 0) {
                            position = 1;
                            trades++;
                            equity.push(equity[equity.length - 1] * (1 - transactionCost));
                        } else if (signals[i] === -1 && position === 1) {
                            position = 0;
                            trades++;
                            equity.push(equity[equity.length - 1] * (1 - transactionCost));
                        }
                        if (position === 1) {
                            const dailyReturn = (closes[i] - closes[i - 1]) / closes[i - 1];
                            equity.push(equity[equity.length - 1] * (1 + dailyReturn));
                        } else {
                            equity.push(equity[equity.length - 1]);
                        }
                    }

                    const returns = equity.slice(1).map((e, i) => (e - equity[i]) / equity[i]);
                    const annualizedReturn = calculateMean(returns) * 252;
                    const annualizedVolatility = calculateStdDev(returns, calculateMean(returns)) * Math.sqrt(252);
                    const sharpeRatio = annualizedVolatility > 0 ? (annualizedReturn - 0.02) / annualizedVolatility : 0;
                    const maxDrawdown = calculateMaxDrawdown(equity);

                    let resultHTML = `
                        <table class="table table-dark table-striped">
                            <thead>
                                <tr>
                                    <th>Metric</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>Annualized Return</td><td>${(annualizedReturn * 100).toFixed(2)}%</td></tr>
                                <tr><td>Annualized Volatility</td><td>${(annualizedVolatility * 100).toFixed(2)}%</td></tr>
                                <tr><td>Sharpe Ratio</td><td>${sharpeRatio.toFixed(2)}</td></tr>
                                <tr><td>Max Drawdown</td><td>${(maxDrawdown * 100).toFixed(2)}%</td></tr>
                                <tr><td>Total Trades</td><td>${trades}</td></tr>
                            </tbody>
                        </table>`;

                    document.getElementById('strategyResult').innerHTML = resultHTML;

                    // Equity curve chart
                    const strategyCanvas = document.createElement('canvas');
                    document.getElementById('strategyChart').innerHTML = '';
                    document.getElementById('strategyChart').appendChild(strategyCanvas);

                    new dependencies.Chart(strategyCanvas, {
                        type: 'line',
                        data: {
                            labels: sharedDataset.rows.map(row => row[0]).slice(0, equity.length),
                            datasets: [{
                                label: 'Equity Curve',
                                data: equity,
                                borderColor: '#007bff',
                                fill: false
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                x: { title: { display: true, text: 'Date' } },
                                y: { title: { display: true, text: 'Equity ($)' } }
                            }
                        }
                    });

                    showSuccessMessage('Strategy backtest completed successfully!', 'strategyResult');
                } catch (error) {
                    showErrorMessage(`Error backtesting strategy: ${error.message}`, 'strategyResult');
                }
            });
        }
    }

    // Missing Utility Functions
    function showWeightInputModal(tickers, callback) {
        let modalHTML = `
            <div class="modal fade" id="weightInputModal" tabindex="-1" role="dialog" aria-labelledby="weightInputModalLabel" aria-hidden="true">
                <div class="modal-dialog" role="document">
                    <div class="modal-content bg-dark text-light">
                        <div class="modal-header">
                            <h5 class="modal-title" id="weightInputModalLabel">Enter Portfolio Weights</h5>
                            <button type="button" class="close text-light" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="weightInputForm">
                                ${tickers.map((ticker, i) => `
                                    <div class="form-group">
                                        <label for="weight-${i}">${ticker} Weight (%):</label>
                                        <input type="number" class="form-control" id="weight-${i}" step="0.01" min="0" value="${100 / tickers.length}" required>
                                    </div>
                                `).join('')}
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="submitWeights">Submit</button>
                        </div>
                    </div>
                </div>
            </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = dependencies.jQuery('#weightInputModal');
        modal.modal('show');

        document.getElementById('submitWeights').addEventListener('click', () => {
            try {
                const weights = tickers.map((_, i) => {
                    const value = parseFloat(document.getElementById(`weight-${i}`).value) / 100;
                    if (isNaN(value) || value < 0) throw new Error(`Invalid weight for ${tickers[i]}.`);
                    return value;
                });
                const totalWeight = weights.reduce((sum, w) => sum + w, 0);
                if (Math.abs(totalWeight - 1) > 0.01) {
                    throw new Error('Weights must sum to 100%.');
                }
                callback(weights);
                modal.modal('hide');
            } catch (error) {
                showErrorMessage(error.message, 'weightInputModal');
            }
        });

        modal.on('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    function showModal(title, bodyContent, callback) {
        let modalHTML = `
            <div class="modal fade" id="genericModal" tabindex="-1" role="dialog" aria-labelledby="genericModalLabel" aria-hidden="true">
                <div class="modal-dialog" role="document">
                    <div class="modal-content bg-dark text-light">
                        <div class="modal-header">
                            <h5 class="modal-title" id="genericModalLabel">${sanitizeInput(title)}</h5>
                            <button type="button" class="close text-light" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="modalForm">
                                ${bodyContent}
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="submitModal">Submit</button>
                        </div>
                    </div>
                </div>
            </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = dependencies.jQuery('#genericModal');
        modal.modal('show');

        document.getElementById('submitModal').addEventListener('click', () => {
            try {
                const inputs = {};
                document.querySelectorAll('#modalForm input').forEach(input => {
                    inputs[input.id] = input.value;
                });
                callback(inputs);
                modal.modal('hide');
            } catch (error) {
                showErrorMessage(error.message, 'genericModal');
            }
        });

        modal.on('hidden.bs.modal', () => {
            modal.remove();
        });
    }

    function renderDataTable() {
        return `
            <div class="table-container bg-dark rounded p-3">
                <table class="table table-dark table-striped">
                    <thead>
                        <tr>${sharedDataset.headers.map(header => `<th>${header}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${sharedDataset.rows.slice(0, rowsPerPage).map(row => `
                            <tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;
    }

    function calculateMean(values) {
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    function calculateStdDev(values, mean) {
        if (values.length === 0) return 0;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    function calculateBeta(returns, benchmarkReturns) {
        if (returns.length !== benchmarkReturns.length || returns.length === 0) return 0;
        const meanReturns = calculateMean(returns);
        const meanBenchmark = calculateMean(benchmarkReturns);
        let covariance = 0;
        let benchmarkVariance = 0;
        for (let i = 0; i < returns.length; i++) {
            covariance += (returns[i] - meanReturns) * (benchmarkReturns[i] - meanBenchmark);
            benchmarkVariance += Math.pow(benchmarkReturns[i] - meanBenchmark, 2);
        }
        covariance /= returns.length;
        benchmarkVariance /= returns.length;
        return benchmarkVariance > 0 ? covariance / benchmarkVariance : 0;
    }

    function calculateCorrelation(returns1, returns2) {
        if (returns1.length !== returns2.length || returns1.length === 0) return 0;
        const mean1 = calculateMean(returns1);
        const mean2 = calculateMean(returns2);
        let covariance = 0;
        let variance1 = 0;
        let variance2 = 0;
        for (let i = 0; i < returns1.length; i++) {
            const dev1 = returns1[i] - mean1;
            const dev2 = returns2[i] - mean2;
            covariance += dev1 * dev2;
            variance1 += dev1 * dev1;
            variance2 += dev2 * dev2;
        }
        covariance /= returns1.length;
        variance1 /= returns1.length;
        variance2 /= returns1.length;
        const stdDevProduct = Math.sqrt(variance1 * variance2);
        return stdDevProduct > 0 ? covariance / stdDevProduct : 0;
    }

    function calculateMaxDrawdown(equity) {
        let maxDrawdown = 0;
        let peak = equity[0];
        for (const value of equity) {
            if (value > peak) peak = value;
            const drawdown = (peak - value) / peak;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        }
        return maxDrawdown;
    }

    function detectOutliers(values) {
        if (values.length === 0) return [];
        const mean = calculateMean(values);
        const stdDev = calculateStdDev(values, mean);
        if (stdDev === 0) return [];
        return values.filter(val => Math.abs(val - mean) > 3 * stdDev);
    }

    function calculateSMACrossover(prices, fastPeriod, slowPeriod) {
        const fastSMA = calculateSMA(prices, fastPeriod);
        const slowSMA = calculateSMA(prices, slowPeriod);
        const signals = Array(prices.length).fill(0);
        for (let i = 1; i < prices.length; i++) {
            if (fastSMA[i] > slowSMA[i] && fastSMA[i - 1] <= slowSMA[i - 1]) {
                signals[i] = 1; // Buy
            } else if (fastSMA[i] < slowSMA[i] && fastSMA[i - 1] >= slowSMA[i - 1]) {
                signals[i] = -1; // Sell
            }
        }
        return signals;
    }

    function calculateSMA(prices, period) {
        const sma = Array(prices.length).fill(NaN);
        for (let i = period - 1; i < prices.length; i++) {
            const slice = prices.slice(i - period + 1, i + 1);
            sma[i] = calculateMean(slice.filter(v => !isNaN(v)));
        }
        return sma;
    }

    function calculateMACD(prices, fastPeriod, slowPeriod, signalPeriod) {
        const fastEMA = calculateEMA(prices, fastPeriod);
        const slowEMA = calculateEMA(prices, slowPeriod);
        const macdLine = fastEMA.map((f, i) => f - slowEMA[i]);
        const signalLine = calculateEMA(macdLine.filter(v => !isNaN(v)), signalPeriod);
        const signals = Array(prices.length).fill(0);
        let signalIndex = 0;
        for (let i = 0; i < macdLine.length; i++) {
            if (isNaN(macdLine[i]) || signalIndex >= signalLine.length) continue;
            if (macdLine[i] > signalLine[signalIndex] && macdLine[i - 1] <= signalLine[signalIndex - 1]) {
                signals[i] = 1; // Buy
            } else if (macdLine[i] < signalLine[signalIndex] && macdLine[i - 1] >= signalLine[signalIndex - 1]) {
                signals[i] = -1; // Sell
            }
            if (!isNaN(macdLine[i])) signalIndex++;
        }
        return signals;
    }

    function calculateEMA(prices, period) {
        const k = 2 / (period + 1);
        const ema = Array(prices.length).fill(NaN);
        ema[0] = prices[0];
        for (let i = 1; i < prices.length; i++) {
            if (!isNaN(prices[i])) {
                ema[i] = prices[i] * k + ema[i - 1] * (1 - k);
            }
        }
        return ema;
    }

    // Initialize the platform
    dynamicContent.innerHTML = toolbarHandlers['toolbar-data']();
    attachDataMenuEventListeners();
});