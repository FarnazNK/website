document.addEventListener('DOMContentLoaded', () => {
    const dynamicContent = document.getElementById('dynamicMenuContent');
    let sharedDataset = { headers: [], rows: [] };
    const rowsPerPage = 100; // For pagination

    // Dependency checks
    if (typeof Papa === 'undefined') {
        showErrorMessage('Papa Parse is required for CSV parsing.');
        return;
    }
    if (typeof XLSX === 'undefined') {
        showErrorMessage('XLSX.js is required for Excel file support.');
        return;
    }
    if (typeof Chart === 'undefined') {
        showErrorMessage('Chart.js is required for plotting.');
        return;
    }
    if (typeof PortfolioAllocation === 'undefined') {
        showErrorMessage('Portfolio Allocation library is required for portfolio optimization.');
        return;
    }

    // UI components for toolbar sections
    const toolbarHandlers = {
        'toolbar-data': function() {
            return `
            <div class="row">
                <div class="col-md-3 bg-dark p-3 rounded shadow-sm menu-section">
                    <h4 class="text-light">Menu</h4>
                    <ul class="list-group">
                        <li class="list-group-item menu-item" id="menu-load-data">Load Data</li>
                        <li class="list-group-item menu-item" id="menu-clean-data">Clean Data</li>
                        <li class="list-group-item menu-item" id="menu-filter-data">Filter Data</li>
                        <li class="list-group-item menu-item" id="menu-export-data">Export Data</li>
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
            </div>`;
        },
        'toolbar-plots': function() {
            return `
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
            </div>`;
        },
        'toolbar-statistics': function() {
            return `
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
            </div>`;
        },
        'toolbar-portfolio': function() {
            return `
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
                        <input type="number" id="riskFreeRate" class="form-control mb-3" value="2">
                        <label>Optimization Method:</label>
                        <select id="optimizationMethod" class="form-control mb-3">
                            <option value="mean-variance">Mean-Variance</option>
                            <option value="min-volatility">Minimum Volatility</option>
                        </select>
                        <button class="btn btn-primary w-100" id="optimizePortfolio">Optimize Portfolio</button>
                    </div>
                    <div class="col-md-9">
                        <div id="portfolioResult" class="table-responsive text-light"></div>
                        <div id="portfolioChart" class="mt-3"></div>
                    </div>
                </div>
            </div>`;
        },
        'toolbar-strategies': function() {
            return `
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
                        <input type="number" id="fastPeriod" class="form-control mb-3" value="12">
                        <label>Slow Period:</label>
                        <input type="number" id="slowPeriod" class="form-control mb-3" value="26">
                        <label>Transaction Cost (%):</label>
                        <input type="number" id="transactionCost" class="form-control mb-3" value="0.1">
                        <button class="btn btn-primary w-100" id="backtestStrategy">Backtest Strategy</button>
                    </div>
                    <div class="col-md-9">
                        <div id="strategyResult" class="table-responsive text-light"></div>
                        <div id="strategyChart" class="mt-3"></div>
                    </div>
                </div>
            </div>`;
        }
    };

    // Attach Toolbar Event Listeners
    Object.keys(toolbarHandlers).forEach(toolbarId => {
        const button = document.getElementById(toolbarId);
        if (button) {
            button.addEventListener('click', () => {
                if (['toolbar-plots', 'toolbar-statistics', 'toolbar-portfolio', 'toolbar-strategies'].includes(toolbarId) && !sharedDataset.headers.length) {
                    showErrorMessage('No data available. Please load data first.');
                    dynamicContent.innerHTML = toolbarHandlers['toolbar-data']();
                    attachDataMenuEventListeners();
                    return;
                }
                dynamicContent.innerHTML = toolbarHandlers[toolbarId]();
                if (toolbarId === 'toolbar-data') attachDataMenuEventListeners();
                if (toolbarId === 'toolbar-plots') implementPlotFunctionality();
                if (toolbarId === 'toolbar-statistics') implementRiskFunctionality();
                if (toolbarId === 'toolbar-portfolio') implementPortfolioFunctionality();
                if (toolbarId === 'toolbar-strategies') implementStrategyFunctionality();
            });
        }
    });

    // Data Section Event Listeners
    function attachDataMenuEventListeners() {
        document.getElementById('menu-load-data')?.addEventListener('click', loadDataSection);
        document.getElementById('menu-clean-data')?.addEventListener('click', cleanDataSection);
        document.getElementById('menu-filter-data')?.addEventListener('click', filterDataSection);
        document.getElementById('menu-export-data')?.addEventListener('click', exportDataSection);

        // Handle drag-and-drop and browse button
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

    // Load Data Section
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
                    <input type="text" id="apiKeyInput" class="form-control" placeholder="Enter Alpha Vantage API Key">
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

        document.getElementById('fetch-data-button').addEventListener('click', () => {
            const ticker = sanitizeInput(document.getElementById('tickerInput').value.trim());
            const apiKey = document.getElementById('apiKeyInput').value.trim();
            if (!ticker || !apiKey) {
                showErrorMessage('Please enter a valid ticker and API key.');
                return;
            }
            document.getElementById('loadingSpinner').style.display = 'block';
            fetchMarketData(ticker, apiKey);
        });

        attachDataMenuEventListeners();
    }

    // Fetch Market Data
    async function fetchMarketData(ticker, apiKey) {
        try {
            const response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${apiKey}&outputsize=compact`);
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
            showSuccessMessage(`Loaded data for ${ticker}`);
        } catch (error) {
            showErrorMessage(`Error fetching data: ${error.message}`);
        } finally {
            document.getElementById('loadingSpinner').style.display = 'none';
        }
    }

    // Process File
    function processFile(file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (fileExtension === 'csv') {
            Papa.parse(file, {
                complete: (result) => {
                    if (result.errors.length) {
                        showErrorMessage('Error parsing CSV: ' + result.errors[0].message);
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
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    processExcel(jsonData);
                } catch (error) {
                    showErrorMessage(`Error processing Excel file: ${error.message}`);
                } finally {
                    document.getElementById('loadingSpinner').style.display = 'none';
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            showErrorMessage('Invalid file type. Please upload a CSV or Excel file.');
            document.getElementById('loadingSpinner').style.display = 'none';
        }
    }

    // Process CSV Data
    function processCSV(data) {
        if (!data.length || !data[0].length) {
            showErrorMessage('The CSV file is empty.');
            document.getElementById('loadingSpinner').style.display = 'none';
            return;
        }
        updateSharedDataset(data);
    }

    // Process Excel Data
    function processExcel(jsonData) {
        if (!jsonData.length) {
            showErrorMessage('The Excel file is empty.');
            document.getElementById('loadingSpinner').style.display = 'none';
            return;
        }
        updateSharedDataset(jsonData);
    }

    // Update Shared Dataset
    function updateSharedDataset(rows) {
        sharedDataset.headers = rows[0].map(h => sanitizeInput(h.toString().trim()));
        sharedDataset.rows = rows.slice(1).map(row => row.map(cell => cell ? sanitizeInput(cell.toString().trim()) : ''));
        validateHeaders(sharedDataset.headers);
        localStorage.setItem('savedDataset', JSON.stringify(sharedDataset));
        displayDataTable();
        document.getElementById('loadingSpinner').style.display = 'none';
    }

    // Validate Headers
    function validateHeaders(headers) {
        const uniqueHeaders = new Set(headers);
        if (uniqueHeaders.size !== headers.length) {
            throw new Error('Duplicate column headers detected.');
        }
        if (headers.some(h => !h)) {
            throw new Error('Empty column headers are not allowed.');
        }
    }

    // Display Data Table with Pagination
    function displayDataTable(page = 1) {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        const paginatedRows = sharedDataset.rows.slice(start, end);

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
                        <li class="page-item">
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
                if (newPage > 0 && newPage <= Math.ceil(sharedDataset.rows.length / rowsPerPage)) {
                    displayDataTable(newPage);
                }
            });
        });

        showSuccessMessage('Data loaded successfully!');
    }

    // Clean Data Section
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
                showSuccessMessage(`Filled missing values in ${beforeCount - sharedDataset.rows.length} rows.`);
                document.getElementById('cleaning-result').innerHTML = renderDataTable();
            } catch (error) {
                showErrorMessage(error.message);
            }
        });

        document.getElementById('filter-low-volume').addEventListener('click', () => {
            showModal('Filter Low Volume Days', `
                <label for="volumeThreshold">Minimum Volume:</label>
                <input type="number" id="volumeThreshold" class="form-control" value="10000">
            `, (inputs) => {
                try {
                    const volumeThreshold = parseFloat(inputs.volumeThreshold);
                    if (isNaN(volumeThreshold)) throw new Error('Invalid volume threshold.');
                    const volumeIndex = sharedDataset.headers.indexOf('Volume');
                    if (volumeIndex === -1) throw new Error('Volume column not found.');
                    const beforeCount = sharedDataset.rows.length;
                    sharedDataset.rows = sharedDataset.rows.filter(row => parseFloat(row[volumeIndex]) >= volumeThreshold);
                    showSuccessMessage(`Removed ${beforeCount - sharedDataset.rows.length} low-volume days.`);
                    document.getElementById('cleaning-result').innerHTML = renderDataTable();
                } catch (error) {
                    showErrorMessage(error.message);
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
                    showSuccessMessage(`Removed ${beforeCount - sharedDataset.rows.length} outliers from "${column}".`);
                    document.getElementById('cleaning-result').innerHTML = renderDataTable();
                } catch (error) {
                    showErrorMessage(error.message);
                }
            });
        });

        document.getElementById('remove-duplicates').addEventListener('click', () => {
            try {
                const beforeCount = sharedDataset.rows.length;
                const uniqueRows = new Map();
                sharedDataset.rows.forEach(row => uniqueRows.set(JSON.stringify(row), row));
                sharedDataset.rows = Array.from(uniqueRows.values());
                showSuccessMessage(`Removed ${beforeCount - sharedDataset.rows.length} duplicate rows.`);
                document.getElementById('cleaning-result').innerHTML = renderDataTable();
            } catch (error) {
                showErrorMessage(error.message);
            }
        });
    }

    // Filter Data Section
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

                    showSuccessMessage(`Filtered ${beforeCount - sharedDataset.rows.length} rows.`);
                    document.getElementById('filtering-result').innerHTML = renderDataTable();
                } catch (error) {
                    showErrorMessage(error.message);
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
                    showSuccessMessage(`Filtered to ${sharedDataset.rows.length} rows in range [${minValue}, ${maxValue}].`);
                    document.getElementById('filtering-result').innerHTML = renderDataTable();
                } catch (error) {
                    showErrorMessage(error.message);
                }
            });
        });

        document.getElementById('filter-top-n').addEventListener('click', () => {
            showModal('Filter Top N Rows', `
                <label for="nRows">Number of Rows:</label>
                <input type="number" id="nRows" class="form-control" value="100">
            `, (inputs) => {
                try {
                    const n = parseInt(inputs.nRows, 10);
                    if (isNaN(n) || n <= 0) throw new Error('Invalid value for N.');
                    const beforeCount = sharedDataset.rows.length;
                    sharedDataset.rows = sharedDataset.rows.slice(0, n);
                    showSuccessMessage(`Kept top ${n} rows (removed ${beforeCount - n} rows).`);
                    document.getElementById('filtering-result').innerHTML = renderDataTable();
                } catch (error) {
                    showErrorMessage(error.message);
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
                    showSuccessMessage(`Kept ${sharedDataset.rows.length} non-null rows in "${column}".`);
                    document.getElementById('filtering-result').innerHTML = renderDataTable();
                } catch (error) {
                    showErrorMessage(error.message);
                }
            });
        });
    }

    // Export Data Section
    function exportDataSection() {
        if (!sharedDataset.headers.length) {
            showErrorMessage('No data available to export.');
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
        showSuccessMessage('Data exported successfully!');
    }

    // Plot Functionality
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
                showErrorMessage(error.message);
            }
        });
    }

    // Create Chart
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

        const chartInstance = new Chart(ctx, config);
        canvas.chartInstance = chartInstance;
    }

    // Risk Metrics Functionality
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
                            rowHTML += `<td>${(maxDrawdown * 100).toFixed(2)}%</td>`;
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
                showErrorMessage(error.message);
            }
        });
    }

    // Portfolio Optimization Functionality
    function implementPortfolioFunctionality() {
        document.getElementById('optimizePortfolio').addEventListener('click', () => {
            try {
                const tickers = Array.from(document.getElementById('portfolioTickers').selectedOptions).map(opt => opt.value);
                const riskFreeRate = parseFloat(document.getElementById('riskFreeRate').value) / 100;
                const method = document.getElementById('optimizationMethod').value;

                if (tickers.length < 2) throw new Error('Select at least two tickers.');

                const returns = tickers.map(ticker => {
                    const closeIndex = sharedDataset.headers.indexOf(ticker);
                    const closes = sharedDataset.rows.map(row => parseFloat(row[closeIndex])).filter(v => !isNaN(v));
                    return closes.slice(1).map((close, i) => (close - closes[i]) / closes[i]);
                });

                const meanReturns = returns.map(r => calculateMean(r) * 252);
                const covMatrix = calculateCovarianceMatrix(returns).map(row => row.map(v => v * 252));

                const pa = PortfolioAllocation;
                const weights = method === 'mean-variance'
                    ? pa.meanVarianceOptimizationWeights(meanReturns, covMatrix, { riskFreeRate })
                    : pa.minimumVarianceWeights(covMatrix);

                let tableHTML = `
                    <div class="table-responsive">
                        <table class="table table-dark table-striped">
                            <thead>
                                <tr><th>Ticker</th><th>Weight (%)</th></tr>
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
                    </div>`;
                document.getElementById('portfolioResult').innerHTML = tableHTML;

                // Plot portfolio weights
                const chartWrapper = document.createElement('div');
                chartWrapper.style.cssText = 'width: 400px; height: 400px;';
                const canvas = document.createElement('canvas');
                chartWrapper.appendChild(canvas);
                document.getElementById('portfolioChart').innerHTML = '';
                document.getElementById('portfolioChart').appendChild(chartWrapper);

                new Chart(canvas.getContext('2d'), {
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
                        maintainAspectRatio: false
                    }
                });

                showSuccessMessage('Portfolio optimized successfully!');
            } catch (error) {
                showErrorMessage(error.message);
            }
        });
    }

    // Trading Strategy Functionality
    function implementStrategyFunctionality() {
        document.getElementById('backtestStrategy').addEventListener('click', () => {
            try {
                const ticker = document.getElementById('strategyTicker').value;
                const strategyType = document.getElementById('strategyType').value;
                const fastPeriod = parseInt(document.getElementById('fastPeriod').value);
                const slowPeriod = parseInt(document.getElementById('slowPeriod').value);
                const transactionCost = parseFloat(document.getElementById('transactionCost').value) / 100;

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

                new Chart(canvas.getContext('2d'), {
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

                showSuccessMessage('Strategy backtested successfully!');
            } catch (error) {
                showErrorMessage(error.message);
            }
        });
    }

    // Helper Functions

    // Sanitize Input
    function sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    // Show Bootstrap Modal
    function showModal(title, bodyHTML, callback) {
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div class="modal fade" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content bg-dark text-light">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
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

    // Get Column Index
    function getColumnIndex(column) {
        const index = sharedDataset.headers.indexOf(column);
        if (index === -1) throw new Error(`Invalid column name: ${column}`);
        return index;
    }

    // Get Column Data
    function getColumnData(columnIndex) {
        return sharedDataset.rows
            .map(row => parseFloat(row[columnIndex]))
            .filter(val => !isNaN(val));
    }

    // Calculate Mean
    function calculateMean(values) {
        if (!values.length) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    // Calculate Standard Deviation
    function calculateStdDev(values, mean) {
        if (!values.length) return 0;
        return Math.sqrt(
            values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
        );
    }

    // Detect Outliers
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

    // Calculate Max Drawdown
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

    // Calculate Simple Moving Average
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

    // Calculate MACD
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

    // Calculate Exponential Moving Average
    function calculateEMA(prices, period) {
        const k = 2 / (period + 1);
        const ema = [prices[0]];
        for (let i = 1; i < prices.length; i++) {
            ema.push(prices[i] * k + ema[i - 1] * (1 - k));
        }
        return ema;
    }

    // Calculate Covariance Matrix
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

    // Backtest Strategy
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

    // Render Data Table
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

    // Show Error Message
    function showErrorMessage(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show';
        alertDiv.innerHTML = `
            <strong>Error:</strong> ${sanitizeInput(message)}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        `;
        const container = document.querySelector('#data-content, #filtering-result, #cleaning-result, #portfolioResult, #strategyResult, #statsResult');
        if (container) {
            container.prepend(alertDiv);
            setTimeout(() => {
                $(alertDiv).alert('close');
            }, 5000);
        } else {
            alert(message);
        }
    }

    // Show Success Message
    function showSuccessMessage(message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show';
        alertDiv.innerHTML = `
            <strong>Success:</strong> ${sanitizeInput(message)}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        `;
        const container = document.querySelector('#data-content, #filtering-result, #cleaning-result, #portfolioResult, #strategyResult, #statsResult');
        if (container) {
            container.prepend(alertDiv);
            setTimeout(() => {
                $(alertDiv).alert('close');
            }, 5000);
        } else {
            alert(message);
        }
    }

    // Initialize Application
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