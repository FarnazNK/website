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
        PortfolioAllocation: typeof PortfolioAllocation !== 'undefined' ? PortfolioAllocation : null
    };

    // Debug library loading
    console.log('Dependencies:', {
        Papa: !!dependencies.Papa,
        XLSX: !!dependencies.XLSX,
        Chart: !!dependencies.Chart,
        PortfolioAllocation: !!dependencies.PortfolioAllocation
    });

    // Dependency check
    if (!dependencies.Papa) return showErrorMessage('Papa Parse is required for CSV parsing.');
    if (!dependencies.XLSX) return showErrorMessage('XLSX.js is required for Excel file support.');
    if (!dependencies.Chart) return showErrorMessage('Chart.js is required for plotting.');
    if (!dependencies.PortfolioAllocation) return showErrorMessage('Portfolio Allocation library is required for portfolio optimization.');

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
        setTimeout(() => $(alertDiv).alert('close'), 5000);
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
                            <option value="candlestick">Candlestick Chart</option>
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
                            <div class="col-md-8">
                                <select id="statsColumn" class="form-control" multiple size="5">
                                    ${sharedDataset.headers.filter(h => h !== 'Date').map(header => 
                                        `<option value="${header}">${header}</option>`).join('')}
                                </select>
                            </div>
                            <div class="col-md-4">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="optionSharpe" checked>
                                    <label class="form-check-label" for="optionSharpe">Sharpe Ratio</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="optionVaR" checked>
                                    <label class="form-check-label" for="optionVaR">Value at Risk (95%)</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="optionDrawdown" checked>
                                    <label class="form-check-label" for="optionDrawdown">Max Drawdown</label>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-primary mb-3" id="generateStats">Calculate Metrics</button>
                        <div id="statsResult" class="table-responsive text-light"></div>
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
            </div>`
    };

    // Attach toolbar event listeners
    Object.entries(toolbarHandlers).forEach(([toolbarId, handler]) => {
        const button = document.getElementById(toolbarId);
        if (button) {
            button.addEventListener('click', () => {
                if (['toolbar-plots', 'toolbar-statistics', 'toolbar-portfolio', 'toolbar-strategies'].includes(toolbarId) && !sharedDataset.headers.length) {
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

        document.getElementById('fetch-data-button').addEventListener('click', async () => {
            const ticker = sanitizeInput(document.getElementById('tickerInput').value.trim());
            const apiKey = document.getElementById('apiKeyInput').value.trim();
            if (!ticker || !apiKey) {
                showErrorMessage('Please enter a valid ticker and API key.', 'data-content');
                return;
            }
            document.getElementById('loadingSpinner').style.display = 'block';
            await fetchMarketData(ticker, apiKey);
        });

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
        document.getElementById('generateChart').addEventListener('click', () => {
            try {
                const ticker = document.getElementById('xAxisColumn').value;
                const chartType = document.getElementById('chartType').value;
                const chartLabel = document.getElementById('chartLabel').value || ticker;
                const chartColor = document.getElementById('chartColor').value;

                const closeIndex = getColumnIndex(ticker);
                const dates = sharedDataset.rows.map(row => row[0]);
                const closes = sharedDataset.rows.map(row => parseFloat(row[closeIndex])).filter(v => !isNaN(v));

                if (chartType === 'candlestick') {
                    const data = sharedDataset.rows.map(row => ({
                        x: row[0],
                        o: parseFloat(row[sharedDataset.headers.indexOf('Open')]),
                        h: parseFloat(row[sharedDataset.headers.indexOf('High')]),
                        l: parseFloat(row[sharedDataset.headers.indexOf('Low')]),
                        c: parseFloat(row[closeIndex])
                    })).filter(d => d.o && d.h && d.l && d.c);

                    createChart(chartType, data, chartLabel, chartColor, dates);
                } else {
                    createChart(chartType, closes, chartLabel, chartColor, dates);
                }
            } catch (error) {
                showErrorMessage(error.message, 'chartsContainer');
            }
        });
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
            type: type === 'candlestick' ? 'candlestick' : 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    borderColor: color,
                    backgroundColor: color,
                    fill: type !== 'candlestick'
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

    // Risk metrics functionality
    function implementRiskFunctionality() {
        document.getElementById('generateStats').addEventListener('click', () => {
            try {
                const statsColumn = document.getElementById('statsColumn');
                const selectedOptions = Array.from(statsColumn.selectedOptions).map(option => option.value);

                if (selectedOptions.length === 0) throw new Error('Please select at least one ticker.');

                const selectedStats = {
                    sharpe: document.getElementById('optionSharpe').checked,
                    var: document.getElementById('optionVaR').checked,
                    drawdown: document.getElementById('optionDrawdown').checked
                };

                let tableHTML = `
                    <div class="table-responsive">
                        <table class="table table-dark table-striped w-100">
                            <thead>
                                <tr>
                                    <th>Ticker</th>`;
                if (selectedStats.sharpe) tableHTML += '<th>Sharpe Ratio</th>';
                if (selectedStats.var) tableHTML += '<th>VaR (95%)</th>';
                if (selectedStats.drawdown) tableHTML += '<th>Max Drawdown</th>';
                tableHTML += `</tr>
                            </thead>
                            <tbody>`;

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

                        if (selectedStats.drawdown) {
                            const equity = [10000];
                            for (let i = 1; i < closes.length; i++) {
                                equity.push(equity[equity.length - 1] * (1 + (closes[i] - closes[i - 1]) / closes[i - 1]));
                            }
                            const maxDrawdown = calculateMaxDrawdown(equity);
                            rowHTML += `<td>${(maxDrawdown * 100).toFixed(2)} हु%</td>`;
                        }

                        rowHTML += `</tr>`;
                        tableHTML += rowHTML;
                    } catch (error) {
                        console.error(`Error processing ticker ${ticker}:`, error);
                    }
                }

                tableHTML += '</tbody></table></div>';
                document.getElementById('statsResult').innerHTML = tableHTML;
            } catch (error) {
                showErrorMessage(error.message, 'statsResult');
            }
        });
    }

    // Portfolio optimization functionality
    function implementPortfolioFunctionality() {
        let latestPortfolio = null; // Store latest optimization results for export
        let portfolioChartInstance = null; // Store chart instances for destruction
        let performanceChartInstance = null;

        document.getElementById('optimizePortfolio').addEventListener('click', () => {
            try {
                const tickers = Array.from(document.getElementById('portfolioTickers').selectedOptions).map(opt => opt.value);
                const riskFreeRate = parseFloat(document.getElementById('riskFreeRate').value) / 100;
                const transactionCost = parseFloat(document.getElementById('transactionCost').value) / 100;
                const allowNegativeWeights = document.getElementById('allowNegativeWeights').checked;
                const method = document.getElementById('optimizationMethod').value;

                // Input validation
                if (tickers.length < 2) throw new Error('Select at least two tickers.');
                if (isNaN(riskFreeRate) || riskFreeRate < 0) throw new Error('Invalid risk-free rate.');
                if (isNaN(transactionCost) || transactionCost < 0) throw new Error('Invalid transaction cost.');

                // Calculate returns for each ticker
                const returns = tickers.map(ticker => {
                    const closeIndex = sharedDataset.headers.indexOf(ticker);
                    const closes = sharedDataset.rows.map(row => parseFloat(row[closeIndex])).filter(v => !isNaN(v));
                    if (closes.length < 2) throw new Error(`Insufficient data for ticker ${ticker}.`);
                    return closes.slice(1).map((close, i) => (close - closes[i]) / closes[i]);
                });

                // Ensure all return series have the same length
                const minLength = Math.min(...returns.map(r => r.length));
                if (minLength < 10) throw new Error('Insufficient data points for optimization.');
                const alignedReturns = returns.map(r => r.slice(-minLength));

                // Calculate mean returns and covariance matrix (annualized)
                const meanReturns = alignedReturns.map(r => calculateMean(r) * 252);
                const covMatrix = calculateCovarianceMatrix(alignedReturns).map(row => row.map(v => v * 252));

                // Prepare transaction costs
                const transactionCosts = Array(tickers.length).fill(transactionCost);

                // Perform portfolio optimization
                const pa = dependencies.PortfolioAllocation;
                let weights;
                const options = { 
                    riskFreeRate, 
                    allowNegativeWeights, 
                    transactionCosts 
                };
                switch (method) {
                    case 'mean-variance':
                        weights = pa.meanVarianceOptimizationWeights(meanReturns, covMatrix, options);
                        break;
                    case 'min-volatility':
                        weights = pa.minimumVarianceWeights(covMatrix, options);
                        break;
                    case 'risk-parity':
                        weights = pa.riskParityWeights(covMatrix, options);
                        break;
                    default:
                        throw new Error('Invalid optimization method.');
                }

                // Calculate portfolio statistics
                const stats = pa.calculatePortfolioStats(weights, meanReturns, covMatrix, { riskFreeRate });

                // Store results for export
                latestPortfolio = { tickers, weights, stats };

                // Display weights table
                let tableHTML = `
                    <div class="table-responsive">
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
                        <table class="table table-dark table-striped mt-3">
                            <thead>
                                <tr>
                                    <th>Metric</th>
                                    <th>Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>Expected Return (%)</td><td>${(stats.return * 100).toFixed(2)}</td></tr>
                                <tr><td>Volatility (%)</td><td>${(stats.volatility * 100).toFixed(2)}</td></tr>
                                <tr><td>Sharpe Ratio</td><td>${stats.sharpeRatio.toFixed(2)}</td></tr>
                            </tbody>
                        </table>
                    </div>`;
                document.getElementById('portfolioResult').innerHTML = tableHTML;

                // Destroy existing charts
                if (portfolioChartInstance) portfolioChartInstance.destroy();
                if (performanceChartInstance) performanceChartInstance.destroy();

                // Plot portfolio weights
                const chartWrapper = document.createElement('div');
                chartWrapper.style.cssText = 'width: 400px; height: 400px;';
                const canvas = document.createElement('canvas');
                chartWrapper.appendChild(canvas);
                document.getElementById('portfolioChart').innerHTML = '';
                document.getElementById('portfolioChart').appendChild(chartWrapper);

                portfolioChartInstance = new dependencies.Chart(canvas.getContext('2d'), {
                    type: 'pie',
                    data: {
                        labels: tickers,
                        datasets: [{
                            data: weights.map(w => w * 100),
                            backgroundColor: ['#007bff', '#6610f2', '#6f42c1', '#e83e8c', '#20c997']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        title: { display: true, text: 'Portfolio Weights' }
                    }
                });

                // Calculate portfolio performance
                const portfolioReturns = sharedDataset.rows.map((row, i) => {
                    if (i === 0) return null;
                    let dailyReturn = 0;
                    tickers.forEach((ticker, j) => {
                        const closeIndex = sharedDataset.headers.indexOf(ticker);
                        const close = parseFloat(row[closeIndex]);
                        const prevClose = parseFloat(sharedDataset.rows[i - 1][closeIndex]);
                        if (!isNaN(close) && !isNaN(prevClose)) {
                            dailyReturn += weights[j] * (close - prevClose) / prevClose;
                        }
                    });
                    return dailyReturn;
                }).filter(r => r !== null);

                const equity = [10000];
                portfolioReturns.forEach(r => {
                    equity.push(equity[equity.length - 1] * (1 + r));
                });

                // Calculate volatility bands (1 standard deviation)
                const volatility = stats.volatility / Math.sqrt(252); // Daily volatility
                const upperBand = equity.slice(1).map(e => e * (1 + volatility));
                const lowerBand = equity.slice(1).map(e => e * (1 - volatility));

                // Plot portfolio performance with volatility bands
                const perfChartWrapper = document.createElement('div');
                perfChartWrapper.style.cssText = 'width: 100%; height: 400px;';
                const perfCanvas = document.createElement('canvas');
                perfChartWrapper.appendChild(perfCanvas);
                document.getElementById('portfolioPerformanceChart').innerHTML = '';
                document.getElementById('portfolioPerformanceChart').appendChild(perfChartWrapper);

                performanceChartInstance = new dependencies.Chart(perfCanvas.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: sharedDataset.rows.map(row => row[0]).slice(1),
                        datasets: [
                            {
                                label: 'Portfolio Equity',
                                data: equity.slice(1),
                                borderColor: '#007bff',
                                fill: false
                            },
                            {
                                label: 'Upper Volatility Band',
                                data: upperBand,
                                borderColor: '#28a745',
                                borderDash: [5, 5],
                                fill: false
                            },
                            {
                                label: 'Lower Volatility Band',
                                data: lowerBand,
                                borderColor: '#dc3545',
                                borderDash: [5, 5],
                                fill: false
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: { title: { display: true, text: 'Date' } },
                            y: { title: { display: true, text: 'Equity' } }
                        },
                        title: { display: true, text: 'Portfolio Performance' }
                    }
                });

                showSuccessMessage('Portfolio optimized successfully!', 'portfolioResult');
            } catch (error) {
                showErrorMessage(error.message, 'portfolioResult');
            }
        });

        // Export portfolio results
        document.getElementById('exportPortfolio').addEventListener('click', () => {
            if (!latestPortfolio) {
                showErrorMessage('No portfolio results to export.', 'portfolioResult');
                return;
            }

            const csv = [
                ['Ticker', 'Weight (%)'],
                ...latestPortfolio.tickers.map((ticker, i) => [ticker, (latestPortfolio.weights[i] * 100).toFixed(2)]),
                [],
                ['Metric', 'Value'],
                ['Expected Return (%)', (latestPortfolio.stats.return * 100).toFixed(2)],
                ['Volatility (%)', (latestPortfolio.stats.volatility * 100).toFixed(2)],
                ['Sharpe Ratio', latestPortfolio.stats.sharpeRatio.toFixed(2)]
            ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'portfolio_weights.csv';
            a.click();
            URL.revokeObjectURL(url);
            showSuccessMessage('Portfolio results exported successfully!', 'portfolioResult');
        });
    }

    // Trading strategy functionality
    function implementStrategyFunctionality() {
        document.getElementById('backtestStrategy').addEventListener('click', () => {
            try {
                const ticker = document.getElementById('strategyTicker').value;
                const strategyType = document.getElementById('strategyType').value;
                const fastPeriod = parseInt(document.getElementById('fastPeriod').value);
                const slowPeriod = parseInt(document.getElementById('slowPeriod').value);
                const transactionCost = parseFloat(document.getElementById('transactionCost').value) / 100;

                if (fastPeriod <= 0 || slowPeriod <= 0 || slowPeriod <= fastPeriod) {
                    throw new Error('Invalid periods: Fast period must be positive and less than slow period.');
                }
                if (transactionCost < 0) throw new Error('Transaction cost cannot be negative.');

                const closeIndex = sharedDataset.headers.indexOf(ticker);
                const closes = sharedDataset.rows.map(row => parseFloat(row[closeIndex])).filter(v => !isNaN(v)).reverse();
                const dates = sharedDataset.rows.map(row => row[0]).reverse();

                let signals = [];
                if (strategyType === 'sma-crossover') {
                    const fastSMA = calculateSMA(closes, fastPeriod);
                    const slowSMA = calculateSMA(closes, slowPeriod);
                    signals = closes.map((_, i) => {
                        if (i < slowPeriod) return 0;
                        return fastSMA[i] > slowSMA[i] ? 1 : fastSMA[i] < slowSMA[i] ? -1 : 0;
                    });
                } else if (strategyType === 'macd') {
                    const macd = calculateMACD(closes, fastPeriod, slowPeriod);
                    signals = macd.map((val, i) => {
                        if (i < slowPeriod) return 0;
                        return val > 0 ? 1 : val < 0 ? -1 : 0;
                    });
                }

                const { equity, returns, sharpeRatio, maxDrawdown } = backtestStrategy(closes, signals, transactionCost);

                let tableHTML = `
                    <div class="table-responsive">
                        <table class="table table-dark table-striped">
                            <thead>
                                <tr><th>Metric</th><th>Value</th></tr>
                            </thead>
                            <tbody>
                                <tr><td>Final Equity</td><td>${equity[equity.length - 1].toFixed(2)}</td></tr>
                                <tr><td>Sharpe Ratio</td><td>${sharpeRatio.toFixed(2)}</td></tr>
                                <tr><td>Max Drawdown (%)</td><td>${(maxDrawdown * 100).toFixed(2)}</td></tr>
                            </tbody>
                        </table>
                    </div>`;
                document.getElementById('strategyResult').innerHTML = tableHTML;

                const chartWrapper = document.createElement('div');
                chartWrapper.style.cssText = 'width: 100%; height: 400px;';
                const canvas = document.createElement('canvas');
                chartWrapper.appendChild(canvas);
                document.getElementById('strategyChart').innerHTML = '';
                document.getElementById('strategyChart').appendChild(chartWrapper);

                new dependencies.Chart(canvas.getContext('2d'), {
                    type: 'line',
                    data: {
                        labels: dates.slice(slowPeriod),
                        datasets: [{
                            label: 'Equity Curve',
                            data: equity.slice(slowPeriod),
                            borderColor: '#007bff',
                            fill: false
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: { title: { display: true, text: 'Date' } },
                            y: { title: { display: true, text: 'Equity' } }
                        }
                    }
                });

                showSuccessMessage('Strategy backtested successfully!', 'strategyResult');
            } catch (error) {
                showErrorMessage(error.message, 'strategyResult');
            }
        });
    }

    // Helper functions
    function calculateMean(values) {
        if (!values.length) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    function calculateStdDev(values, mean) {
        if (!values.length) return 0;
        return Math.sqrt(
            values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
        );
    }

    function detectOutliers(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const q1Index = Math.floor(sorted.length / 4);
        const q3Index = Math.floor(sorted.length * 3 / 4);
        const q1 = sorted[q1Index];
        const q3 = sorted[q3Index];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        return values.filter(val => val < lowerBound || val > upperBound);
    }

    function calculateMaxDrawdown(equity) {
        let maxDrawdown = 0;
        let peak = equity[0];
        for (let i = 1; i < equity.length; i++) {
            if (equity[i] > peak) peak = equity[i];
            const drawdown = (peak - equity[i]) / peak;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        }
        return maxDrawdown;
    }

    function calculateSMA(prices, period) {
        const sma = [];
        for (let i = 0; i < prices.length; i++) {
            if (i < period - 1) {
                sma.push(null);
            } else {
                const slice = prices.slice(i - period + 1, i + 1);
                sma.push(calculateMean(slice));
            }
        }
        return sma;
    }

    function calculateMACD(prices, fastPeriod, slowPeriod, signalPeriod = 9) {
        const fastEMA = calculateEMA(prices, fastPeriod);
        const slowEMA = calculateEMA(prices, slowPeriod);
        const macd = fastEMA.map((f, i) => i < slowPeriod ? null : f - slowEMA[i]);
        const signal = calculateEMA(macd.filter(v => v !== null), signalPeriod);
        return macd.map((m, i) => {
            if (i < slowPeriod + signalPeriod - 1) return null;
            return m - signal[i - (slowPeriod + signalPeriod - 1)];
        });
    }

    function calculateEMA(prices, period) {
        const k = 2 / (period + 1);
        const ema = [prices[0]];
        for (let i = 1; i < prices.length; i++) {
            ema.push(prices[i] * k + ema[i - 1] * (1 - k));
        }
        return ema;
    }

    function calculateCovarianceMatrix(returns) {
        const n = returns[0].length;
        const means = returns.map(r => calculateMean(r));
        const covMatrix = returns.map((r1, i) =>
            returns.map((r2, j) => {
                let sum = 0;
                for (let k = 0; k < n; k++) {
                    sum += (r1[k] - means[i]) * (r2[k] - means[j]);
                }
                return sum / (n - 1);
            })
        );
        return covMatrix;
    }

    function backtestStrategy(prices, signals, transactionCost) {
        let equity = [10000];
        let position = 0;
        let returns = [];

        for (let i = 1; i < prices.length; i++) {
            if (signals[i] === 1 && position !== 1) {
                position = 1;
                equity.push(equity[equity.length - 1] * (1 - transactionCost));
            } else if (signals[i] === -1 && position !== -1) {
                position = -1;
                equity.push(equity[equity.length - 1] * (1 - transactionCost));
            } else if (signals[i] === 0 && position !== 0) {
                position = 0;
                equity.push(equity[equity.length - 1] * (1 - transactionCost));
            } else {
                equity.push(equity[equity.length - 1]);
            }

            const dailyReturn = position * (prices[i] - prices[i - 1]) / prices[i - 1];
            equity[equity.length - 1] *= (1 + dailyReturn);
            returns.push(dailyReturn);
        }

        const sharpeRatio = calculateMean(returns) / calculateStdDev(returns, calculateMean(returns)) * Math.sqrt(252);
        const maxDrawdown = calculateMaxDrawdown(equity);

        return { equity, returns, sharpeRatio, maxDrawdown };
    }

    function renderDataTable() {
        return `
            <div class="table-container bg-dark rounded p-3">
                <table class="table table-dark table-striped">
                    <thead>
                        <tr>${sharedDataset.headers.map(header => `<th>${header}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${sharedDataset.rows.map(row => {
                            return `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`;
    }

    function showModal(title, bodyHTML, callback) {
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div class="modal fade" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content bg-dark text-light">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">×</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            ${bodyHTML}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="modalSubmit">Apply</button>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(modal);
        $(modal.querySelector('.modal')).modal('show');
        modal.querySelector('#modalSubmit').addEventListener('click', () => {
            const inputs = {};
            modal.querySelectorAll('input').forEach(input => {
                inputs[input.id] = input.value;
            });
            callback(inputs);
            $(modal.querySelector('.modal')).modal('hide');
        });
        $(modal.querySelector('.modal')).on('hidden.bs.modal', () => modal.remove());
    }

    // Initialize application
    const savedData = localStorage.getItem('savedDataset');
    if (savedData) {
        try {
            sharedDataset = JSON.parse(savedData);
            dynamicContent.innerHTML = toolbarHandlers['toolbar-data']();
            attachDataMenuEventListeners();
            displayDataTable();
        } catch (error) {
            console.error('Error loading saved data:', error);
            dynamicContent.innerHTML = toolbarHandlers['toolbar-data']();
            attachDataMenuEventListeners();
        }
    } else {
        dynamicContent.innerHTML = toolbarHandlers['toolbar-data']();
        attachDataMenuEventListeners();
    }
});