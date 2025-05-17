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
 * - chartjs-chart-financial (candlestick charts)
 * - chartjs-plugin-zoom (zoom/pan functionality)
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
        FinancialChart: typeof window.ChartFinancial !== 'undefined' ? window.ChartFinancial : null,
        PortfolioAllocation: typeof PortfolioAllocation !== 'undefined' ? PortfolioAllocation : null,
        jQuery: typeof $ !== 'undefined' ? $ : null
    };

    // Debug library loading
    console.log('Dependencies:', {
        Papa: !!dependencies.Papa,
        XLSX: !!dependencies.XLSX,
        Chart: !!dependencies.Chart,
        FinancialChart: !!dependencies.FinancialChart,
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
                <span aria-hidden="true">&times;</span>
            </button>
        `;
        container.prepend(alertDiv);
        setTimeout(() => dependencies.jQuery(alertDiv).alert('close'), 5000);
    };

    const showErrorMessage = (message, containerId) => showMessage(message, 'danger', containerId);
    const showSuccessMessage = (message, containerId) => showMessage(message, 'success', containerId);

    const showModal = (title, bodyHTML, callback) => {
        const modalId = 'customModal';
        const modalHTML = `
            <div class="modal fade" id="${modalId}" tabindex="-1" role="dialog" aria-labelledby="${modalId}Label" aria-hidden="true">
                <div class="modal-dialog" role="document">
                    <div class="modal-content bg-dark text-light">
                        <div class="modal-header">
                            <h5 class="modal-title" id="${modalId}Label">${sanitizeInput(title)}</h5>
                            <button type="button" class="close text-light" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            ${bodyHTML}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" id="modalSubmit">Submit</button>
                        </div>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        dependencies.jQuery(`#${modalId}`).modal('show');

        document.getElementById('modalSubmit').addEventListener('click', () => {
            const inputs = {};
            document.querySelectorAll(`#${modalId} .modal-body input, #${modalId} .modal-body select`).forEach(input => {
                inputs[input.id] = input.value;
            });
            callback(inputs);
            dependencies.jQuery(`#${modalId}`).modal('hide').on('hidden.bs.modal', () => {
                document.getElementById(modalId).remove();
            });
        });

        dependencies.jQuery(`#${modalId}`).on('hidden.bs.modal', () => {
            document.getElementById(modalId).remove();
        });
    };

    const showWeightInputModal = (tickers, callback) => {
        let modalBody = tickers.map(ticker => `
            <div class="form-group">
                <label for="weight-${ticker}">Weight for ${ticker} (%):</label>
                <input type="number" class="form-control" id="weight-${ticker}" value="${100 / tickers.length}" step="0.01">
            </div>
        `).join('');

        showModal('Enter Portfolio Weights', modalBody, (inputs) => {
            const weights = tickers.map(ticker => {
                const weight = parseFloat(inputs[`weight-${ticker}`]) / 100;
                if (isNaN(weight) || weight < 0) throw new Error(`Invalid weight for ${ticker}`);
                return weight;
            });
            const totalWeight = weights.reduce((sum, w) => sum + w, 0);
            if (Math.abs(totalWeight - 1) > 0.01) throw new Error('Weights must sum to 100%');
            callback(weights);
        });
    };

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

    const renderDataTable = () => {
        return `
            <div class="table-responsive">
                <table class="table table-dark table-striped">
                    <thead>
                        <tr>${sharedDataset.headers.map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${sharedDataset.rows.slice(0, 10).map(row => `
                            <tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;
    };

    const calculateMean = (values) => {
        if (!values.length) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    };

    const calculateStdDev = (values, mean) => {
        if (!values.length) return 0;
        return Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    };

    const calculateMaxDrawdown = (equityCurve) => {
        let maxDD = 0;
        let peak = equityCurve[0];
        for (const value of equityCurve) {
            if (value > peak) peak = value;
            const dd = (peak - value) / peak;
            if (dd > maxDD) maxDD = dd;
        }
        return maxDD;
    };

    const calculateBeta = (assetReturns, benchmarkReturns) => {
        if (assetReturns.length !== benchmarkReturns.length || assetReturns.length === 0) return 0;
        const assetMean = calculateMean(assetReturns);
        const benchMean = calculateMean(benchmarkReturns);
        let covariance = 0;
        let benchVariance = 0;
        for (let i = 0; i < assetReturns.length; i++) {
            covariance += (assetReturns[i] - assetMean) * (benchmarkReturns[i] - benchMean);
            benchVariance += Math.pow(benchmarkReturns[i] - benchMean, 2);
        }
        covariance /= assetReturns.length;
        benchVariance /= assetReturns.length;
        return benchVariance > 0 ? covariance / benchVariance : 0;
    };

    const calculateCorrelation = (returns1, returns2) => {
        if (returns1.length !== returns2.length || returns1.length === 0) return 0;
        const mean1 = calculateMean(returns1);
        const mean2 = calculateMean(returns2);
        let cov = 0;
        let var1 = 0;
        let var2 = 0;
        for (let i = 0; i < returns1.length; i++) {
            const diff1 = returns1[i] - mean1;
            const diff2 = returns2[i] - mean2;
            cov += diff1 * diff2;
            var1 += diff1 * diff1;
            var2 += diff2 * diff2;
        }
        cov /= returns1.length;
        var1 /= returns1.length;
        var2 /= returns1.length;
        const stdDev = Math.sqrt(var1) * Math.sqrt(var2);
        return stdDev > 0 ? cov / stdDev : 0;
    };

    const calculateSMA = (prices, period) => {
        const sma = Array(prices.length).fill(NaN);
        for (let i = period - 1; i < prices.length; i++) {
            const slice = prices.slice(i - period + 1, i + 1);
            sma[i] = calculateMean(slice.filter(v => !isNaN(v)));
        }
        return sma;
    };

    const calculateEMA = (prices, period) => {
        const ema = Array(prices.length).fill(NaN);
        const multiplier = 2 / (period + 1);
        if (prices.length >= period) {
            ema[period - 1] = calculateMean(prices.slice(0, period));
            for (let i = period; i < prices.length; i++) {
                ema[i] = (prices[i] - ema[i - 1]) * multiplier + ema[i - 1];
            }
        }
        return ema;
    };

    const calculateMACD = (prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
        const fastEMA = calculateEMA(prices, fastPeriod);
        const slowEMA = calculateEMA(prices, slowPeriod);
        const macd = fastEMA.map((f, i) => !isNaN(f) && !isNaN(slowEMA[i]) ? f - slowEMA[i] : NaN);
        const signal = calculateEMA(macd.filter(v => !isNaN(v)), signalPeriod);
        const signalFull = Array(macd.length).fill(NaN);
        const offset = macd.length - signal.length;
        signal.forEach((v, i) => signalFull[i + offset] = v);
        return { macd, signal: signalFull };
    };

    const calculateSMACrossover = (prices, fastPeriod, slowPeriod) => {
        const fastSMA = calculateSMA(prices, fastPeriod);
        const slowSMA = calculateSMA(prices, slowPeriod);
        const signals = Array(prices.length).fill(0);
        for (let i = 1; i < prices.length; i++) {
            if (!isNaN(fastSMA[i]) && !isNaN(slowSMA[i]) && !isNaN(fastSMA[i - 1]) && !isNaN(slowSMA[i - 1])) {
                if (fastSMA[i - 1] < slowSMA[i - 1] && fastSMA[i] > slowSMA[i]) {
                    signals[i] = 1; // Buy
                } else if (fastSMA[i - 1] > slowSMA[i - 1] && fastSMA[i] < slowSMA[i]) {
                    signals[i] = -1; // Sell
                }
            }
        }
        return signals;
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
                        <label>Select Tickers:</label>
                        <select id="plotTickers" class="form-control mb-3" multiple size="5">
                            ${sharedDataset.headers.filter(h => h !== 'Date').map(header => 
                                `<option value="${header}">${header}</option>`).join('')}
                        </select>
                        <label>Chart Type:</label>
                        <select id="chartType" class="form-control mb-3">
                            <option value="line">Line Chart</option>
                            <option value="candlestick" ${!dependencies.FinancialChart ? 'disabled' : ''}>Candlestick Chart</option>
                            <option value="bar">Volume Bar Chart</option>
                            <option value="histogram">Returns Histogram</option>
                        </select>
                        <label>Date Range:</label>
                        <select id="dateRange" class="form-control mb-3">
                            <option value="all">All Data</option>
                            <option value="1y">1 Year</option>
                            <option value="6m">6 Months</option>
                            <option value="3m">3 Months</option>
                            <option value="1m">1 Month</option>
                        </select>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" id="logScale">
                            <label class="form-check-label" for="logScale">Logarithmic Scale</label>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" id="showMA">
                            <label class="form-check-label" for="showMA">Show 50-day MA</label>
                        </div>
                        <label>Chart Label:</label>
                        <input type="text" id="chartLabel" class="form-control mb-3" placeholder="Enter label">
                        <button class="btn btn-primary w-100 mb-2" id="generateChart">Generate Chart</button>
                        <button class="btn btn-secondary w-100" id="downloadChart">Download Chart</button>
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
                if (!ticker || !apiKey) {
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

    // Enhanced Plot Functionality
    function implementPlotFunctionality() {
        const generateChartButton = document.getElementById('generateChart');
        const downloadChartButton = document.getElementById('downloadChart');

        if (generateChartButton) {
            generateChartButton.addEventListener('click', () => {
                try {
                    const tickers = Array.from(document.getElementById('plotTickers').selectedOptions).map(o => o.value);
                    if (tickers.length === 0) throw new Error('Please select at least one ticker.');

                    const chartType = document.getElementById('chartType').value;
                    const dateRange = document.getElementById('dateRange').value;
                    const logScale = document.getElementById('logScale').checked;
                    const showMA = document.getElementById('showMA').checked;
                    const chartLabel = document.getElementById('chartLabel').value || tickers.join(', ');

                    // Determine data range
                    let periodRows = sharedDataset.rows.length;
                    switch (dateRange) {
                        case '1y': periodRows = 252; break;
                        case '6m': periodRows = 126; break;
                        case '3m': periodRows = 63; break;
                        case '1m': periodRows = 21; break;
                    }
                    periodRows = Math.min(periodRows, sharedDataset.rows.length);
                    const dataRows = sharedDataset.rows.slice(0, periodRows);

                    // Downsample for performance (max 1000 points)
                    const maxPoints = 1000;
                    const step = Math.max(1, Math.floor(dataRows.length / maxPoints));
                    const sampledRows = dataRows.filter((_, i) => i % step === 0);
                    const dates = sampledRows.map(row => row[0]);

                    if (chartType === 'candlestick') {
                        if (!dependencies.FinancialChart) {
                            throw new Error('Candlestick charts require chartjs-chart-financial plugin.');
                        }
                        if (tickers.length > 1) {
                            throw new Error('Candlestick chart supports only one ticker.');
                        }
                        createCandlestickChart(tickers[0], sampledRows, chartLabel, dates, logScale);
                    } else if (chartType === 'bar') {
                        if (tickers.length > 1) {
                            throw new Error('Volume bar chart supports only one ticker.');
                        }
                        createVolumeBarChart(tickers[0], sampledRows, chartLabel, dates);
                    } else if (chartType === 'histogram') {
                        if (tickers.length > 1) {
                            throw new Error('Returns histogram supports only one ticker.');
                        }
                        createReturnsHistogram(tickers[0], sampledRows, chartLabel);
                    } else {
                        createLineChart(tickers, sampledRows, chartLabel, dates, logScale, showMA);
                    }
                } catch (error) {
                    showErrorMessage(error.message, 'chartsContainer');
                }
            });
        }

        if (downloadChartButton) {
            downloadChartButton.addEventListener('click', () => {
                const charts = document.querySelectorAll('#chartsContainer .chart-wrapper canvas');
                if (charts.length === 0) {
                    showErrorMessage('No charts available to download.', 'chartsContainer');
                    return;
                }
                charts.forEach((canvas, i) => {
                    const link = document.createElement('a');
                    link.href = canvas.toDataURL('image/png');
                    link.download = `chart_${i + 1}.png`;
                    link.click();
                });
                showSuccessMessage('Charts downloaded successfully!', 'chartsContainer');
            });
        }
    }

    // Create Line Chart (Multiple Tickers)
    function createLineChart(tickers, dataRows, label, dates, logScale, showMA) {
        const chartWrapper = createChartWrapper();
        const canvas = chartWrapper.querySelector('canvas');
        const ctx = canvas.getContext('2d');

        const datasets = tickers.map((ticker, i) => {
            const closeIndex = getColumnIndex(ticker);
            const closes = dataRows
                .map(row => parseFloat(row[closeIndex]))
                .filter(v => !isNaN(v));

            const dataset = {
                label: ticker,
                data: closes,
                borderColor: `hsl(${i * 360 / tickers.length}, 70%, 50%)`,
                backgroundColor: `hsl(${i * 360 / tickers.length}, 70%, 50%)`,
                fill: false,
                tension: 0.1
            };

            if (showMA && closes.length >= 50) {
                const ma = calculateSMA(closes, 50);
                datasets.push({
                    label: `${ticker} 50-day MA`,
                    data: ma,
                    borderColor: `hsl(${i * 360 / tickers.length}, 70%, 30%)`,
                    backgroundColor: `hsl(${i * 360 / tickers.length}, 70%, 30%)`,
                    fill: false,
                    borderDash: [5, 5]
                });
            }

            return dataset;
        }).flat();

        const config = {
            type: 'line',
            data: { labels: dates, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: label },
                    zoom: {
                        zoom: {
                            wheel: { enabled: true },
                            pinch: { enabled: true },
                            mode: 'x'
                        },
                        pan: { enabled: true, mode: 'x' }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'Date' } },
                    y: {
                        title: { display: true, text: 'Price ($)' },
                        type: logScale ? 'logarithmic' : 'linear',
                        min: logScale ? null : 0
                    }
                }
            }
        };

        const chartInstance = new dependencies.Chart(ctx, config);
        canvas.chartInstance = chartInstance;
    }

    // Create Candlestick Chart
    function createCandlestickChart(ticker, dataRows, label, dates, logScale) {
        const chartWrapper = createChartWrapper();
        const canvas = chartWrapper.querySelector('canvas');
        const ctx = canvas.getContext('2d');

        const openIndex = getColumnIndex('Open');
        const highIndex = getColumnIndex('High');
        const lowIndex = getColumnIndex('Low');
        const closeIndex = getColumnIndex('Close');

        const data = dataRows.map((row, i) => ({
            x: dates[i],
            o: parseFloat(row[openIndex]),
            h: parseFloat(row[highIndex]),
            l: parseFloat(row[lowIndex]),
            c: parseFloat(row[closeIndex])
        })).filter(d => !isNaN(d.o) && !isNaN(d.h) && !isNaN(d.l) && !isNaN(d.c));

        if (data.length === 0) {
            throw new Error('No valid OHLC data available for candlestick chart.');
        }

        const config = {
            type: 'candlestick',
            data: {
                datasets: [{
                    label: ticker,
                    data,
                    borderColor: {
                        up: '#28a745',
                        down: '#dc3545',
                        unchanged: '#6c757d'
                    },
                    backgroundColor: {
                        up: '#28a745',
                        down: '#dc3545',
                        unchanged: '#6c757d'
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: label },
                    zoom: {
                        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
                        pan: { enabled: true, mode: 'x' }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => [
                                `Open: $${context.raw.o.toFixed(2)}`,
                                `High: $${context.raw.h.toFixed(2)}`,
                                `Low: $${context.raw.l.toFixed(2)}`,
                                `Close: $${context.raw.c.toFixed(2)}`
                            ]
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'Date' } },
                    y: {
                        title: { display: true, text: 'Price ($)' },
                        type: logScale ? 'logarithmic' : 'linear',
                        min: logScale ? null : 0
                    }
                }
            }
        };

        const chartInstance = new dependencies.Chart(ctx, config);
        canvas.chartInstance = chartInstance;
    }

    // Create Volume Bar Chart
    function createVolumeBarChart(ticker, dataRows, label, dates) {
        const chartWrapper = createChartWrapper();
        const canvas = chartWrapper.querySelector('canvas');
        const ctx = canvas.getContext('2d');

        const volumeIndex = getColumnIndex('Volume');
        const volumes = dataRows
            .map(row => parseFloat(row[volumeIndex]))
            .filter(v => !isNaN(v));

        if (volumes.length === 0) {
            throw new Error('No valid volume data available.');
        }

        const config = {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Volume',
                    data: volumes,
                    backgroundColor: '#007bff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: label },
                    zoom: {
                        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' },
                        pan: { enabled: true, mode: 'x' }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Volume: ${context.parsed.y.toLocaleString()}`
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'Date' } },
                    y: { title: { display: true, text: 'Volume' }, beginAtZero: true }
                }
            }
        };

        const chartInstance = new dependencies.Chart(ctx, config);
        canvas.chartInstance = chartInstance;
    }

    // Create Returns Histogram
    function createReturnsHistogram(ticker, dataRows, label) {
        const chartWrapper = createChartWrapper();
        const canvas = chartWrapper.querySelector('canvas');
        const ctx = canvas.getContext('2d');

        const closeIndex = getColumnIndex(ticker);
        const closes = dataRows
            .map(row => parseFloat(row[closeIndex]))
            .filter(v => !isNaN(v));

        if (closes.length < 2) {
            throw new Error('Insufficient data for returns histogram.');
        }

        const returns = closes.slice(1).map((close, i) => (close - closes[i]) / closes[i]);
        const bins = createHistogramBins(returns, 30); // 30 bins

        const config = {
            type: 'bar',
            data: {
                labels: bins.map(b => b.label),
                datasets: [{
                    label: 'Returns Distribution',
                    data: bins.map(b => b.count),
                    backgroundColor: '#28a745'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: label },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Count: ${context.parsed.y}`
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'Daily Return (%)' } },
                    y: { title: { display: true, text: 'Frequency' }, beginAtZero: true }
                }
            }
        };

        const chartInstance = new dependencies.Chart(ctx, config);
        canvas.chartInstance = chartInstance;
    }

    // Utility: Create Chart Wrapper
    function createChartWrapper() {
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
        return chartWrapper;
    }

    // Utility: Create Histogram Bins
    function createHistogramBins(returns, numBins) {
        const minReturn = Math.min(...returns);
        const maxReturn = Math.max(...returns);
        const binWidth = (maxReturn - minReturn) / numBins;
        const bins = Array(numBins).fill().map((_, i) => ({
            min: minReturn + i * binWidth,
            max: minReturn + (i + 1) * binWidth,
            count: 0
        }));

        returns.forEach(r => {
            const binIndex = Math.min(
                Math.floor((r - minReturn) / binWidth),
                numBins - 1
            );
            if (binIndex >= 0) bins[binIndex].count++;
        });

        return bins.map(b => ({
            label: `${(b.min * 100).toFixed(2)} to ${(b.max * 100).toFixed(2)}%`,
            count: b.count
        }));
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
 <option value="crash">Market Crash (-20%)</option>
                                    <option value="rally">Market Rally (+20%)</option>
                                    <option value="volatility">High Volatility (2x)</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <button class="btn btn-primary w-100 mt-4" id="runStressTest">Run Stress Test</button>
                                    </div>
                                </div>
                                <div id="stressTestResult" class="mt-3"></div>
                            </div>
                        </div>`;
                    }

                    // Correlation heatmap
                    if (correlationData && correlationData.length > 1) {
                        tableHTML += `
                        <div class="card bg-dark text-light mt-4">
                            <div class="card-header">
                                <h5>Correlation Heatmap</h5>
                            </div>
                            <div class="card-body">
                                <div style="height: 400px;">
                                    <canvas id="correlationHeatmap"></canvas>
                                </div>
                            </div>
                        </div>`;
                    }

                    document.getElementById('statsResult').innerHTML = tableHTML;

                    // Enable/disable Beta and Correlation based on benchmark selection
                    if (benchmarkTicker.value) {
                        document.getElementById('optionBeta').disabled = false;
                        document.getElementById('optionCorrelation').disabled = false;
                    } else {
                        document.getElementById('optionBeta').disabled = true;
                        document.getElementById('optionCorrelation').disabled = true;
                    }

                    // Generate correlation heatmap
                    if (correlationData && correlationData.length > 1) {
                        const labels = correlationData.map(d => d.ticker);
                        const matrix = labels.map((_, i) =>
                            labels.map((_, j) => {
                                if (i === j) return 1;
                                return calculateCorrelation(correlationData[i].returns, correlationData[j].returns);
                            })
                        );

                        const canvas = document.getElementById('correlationHeatmap');
                        if (canvas) {
                            const ctx = canvas.getContext('2d');
                            const chartInstance = new dependencies.Chart(ctx, {
                                type: 'matrix',
                                data: {
                                    labels,
                                    datasets: [{
                                        label: 'Correlation',
                                        data: matrix.flatMap((row, i) =>
                                            row.map((value, j) => ({
                                                x: j,
                                                y: i,
                                                v: value
                                            }))
                                        ),
                                        backgroundColor: (ctx) => {
                                            const value = ctx.dataset.data[ctx.dataIndex].v;
                                            const r = Math.floor(255 * (1 - Math.abs(value)));
                                            const g = Math.floor(255 * (1 - Math.abs(value)));
                                            const b = 255;
                                            return `rgb(${r}, ${g}, ${b})`;
                                        },
                                        borderColor: '#343a40',
                                        borderWidth: 1,
                                        width: ({ chart }) => (chart.chartArea.width / labels.length - 1),
                                        height: ({ chart }) => (chart.chartArea.height / labels.length - 1)
                                    }]
                                },
                                options: {
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                        title: { display: true, text: 'Correlation Heatmap' },
                                        tooltip: {
                                            callbacks: {
                                                label: (context) => {
                                                    const v = context.raw.v;
                                                    const xLabel = labels[context.raw.x];
                                                    const yLabel = labels[context.raw.y];
                                                    return `${xLabel} vs ${yLabel}: ${v.toFixed(2)}`;
                                                }
                                            }
                                        }
                                    },
                                    scales: {
                                        x: {
                                            type: 'category',
                                            labels,
                                            title: { display: true, text: 'Tickers' },
                                            grid: { display: false }
                                        },
                                        y: {
                                            type: 'category',
                                            labels: labels.slice().reverse(),
                                            title: { display: true, text: 'Tickers' },
                                            grid: { display: false }
                                        }
                                    }
                                }
                            });
                            canvas.chartInstance = chartInstance;
                        }
                    }

                    // Stress test handler
                    const stressTestButton = document.getElementById('runStressTest');
                    if (stressTestButton) {
                        stressTestButton.addEventListener('click', () => {
                            try {
                                const scenario = document.getElementById('stressScenario').value;
                                let stressResults = '<h5>Stress Test Results</h5><table class="table table-dark"><thead><tr><th>Ticker</th><th>Impact</th></tr></thead><tbody>';

                                for (const ticker of selectedOptions) {
                                    const columnIndex = getColumnIndex(ticker);
                                    const closes = getColumnData(columnIndex);
                                    const returns = closes.slice(1).map((close, i) => (close - closes[i]) / closes[i]);

                                    let impact = 0;
                                    if (scenario === 'crash') {
                                        impact = -0.2; // -20% return
                                    } else if (scenario === 'rally') {
                                        impact = 0.2; // +20% return
                                    } else if (scenario === 'volatility') {
                                        const stdDev = calculateStdDev(returns, calculateMean(returns));
                                        impact = stdDev * 2; // 2x standard deviation
                                    }

                                    stressResults += `<tr><td>${ticker}</td><td>${(impact * 100).toFixed(2)}%</td></tr>`;
                                }

                                stressResults += '</tbody></table>';
                                document.getElementById('stressTestResult').innerHTML = stressResults;
                                showSuccessMessage('Stress test completed.', 'statsResult');
                            } catch (error) {
                                showErrorMessage(`Stress test error: ${error.message}`, 'statsResult');
                            }
                        });
                    }
                } catch (error) {
                    showErrorMessage(error.message, 'statsResult');
                }
            });
        }

        // Update Beta/Correlation checkbox availability
        benchmarkTicker.addEventListener('change', () => {
            const hasBenchmark = !!benchmarkTicker.value;
            document.getElementById('optionBeta').disabled = !hasBenchmark;
            document.getElementById('optionCorrelation').disabled = !hasBenchmark;
        });
    }

    // Portfolio Optimization Implementation
    function implementPortfolioFunctionality() {
        const optimizeButton = document.getElementById('optimizePortfolio');
        const exportButton = document.getElementById('exportPortfolio');

        if (optimizeButton) {
            optimizeButton.addEventListener('click', () => {
                try {
                    const tickers = Array.from(document.getElementById('portfolioTickers').selectedOptions).map(o => o.value);
                    if (tickers.length < 2) throw new Error('Select at least two tickers for optimization.');

                    const riskFreeRate = parseFloat(document.getElementById('riskFreeRate').value) / 100;
                    const transactionCost = parseFloat(document.getElementById('transactionCost').value) / 100;
                    const allowNegativeWeights = document.getElementById('allowNegativeWeights').checked;
                    const method = document.getElementById('optimizationMethod').value;

                    // Collect returns data
                    const returnsData = tickers.map(ticker => {
                        const columnIndex = getColumnIndex(ticker);
                        const prices = getColumnData(columnIndex);
                        return prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
                    });

                    // Ensure all return series have the same length
                    const minLength = Math.min(...returnsData.map(r => r.length));
                    const alignedReturns = returnsData.map(returns => returns.slice(0, minLength));

                    // Calculate mean returns and covariance matrix
                    const meanReturns = alignedReturns.map(returns => calculateMean(returns) * 252);
                    const covMatrix = calculateCovarianceMatrix(alignedReturns);

                    let weights;
                    if (method === 'mean-variance') {
                        weights = dependencies.PortfolioAllocation.meanVarianceOptimization({
                            returns: meanReturns,
                            covMatrix,
                            riskFreeRate,
                            constraints: {
                                minWeights: allowNegativeWeights ? null : Array(tickers.length).fill(0),
                                maxWeights: Array(tickers.length).fill(1)
                            }
                        });
                    } else if (method === 'min-volatility') {
                        weights = dependencies.PortfolioAllocation.minimumVariance({
                            covMatrix,
                            constraints: {
                                minWeights: allowNegativeWeights ? null : Array(tickers.length).fill(0),
                                maxWeights: Array(tickers.length).fill(1)
                            }
                        });
                    } else if (method === 'risk-parity') {
                        weights = dependencies.PortfolioAllocation.riskParityWeights({
                            covMatrix
                        });
                    } else {
                        throw new Error('Unsupported optimization method.');
                    }

                    // Adjust for transaction costs
                    const adjustedWeights = weights.map(w => w * (1 - transactionCost));

                    // Calculate portfolio metrics
                    const portfolioReturn = meanReturns.reduce((sum, r, i) => sum + r * adjustedWeights[i], 0);
                    const portfolioVolatility = Math.sqrt(
                        adjustedWeights.reduce((sum, w_i, i) =>
                            sum + adjustedWeights.reduce((innerSum, w_j, j) =>
                                innerSum + w_i * w_j * covMatrix[i][j], 0), 0) * 252
                    );
                    const sharpeRatio = (portfolioReturn - riskFreeRate) / portfolioVolatility;

                    // Display results
                    let resultHTML = `
                        <div class="table-responsive">
                            <table class="table table-dark">
                                <thead>
                                    <tr>
                                        <th>Ticker</th>
                                        <th>Weight</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tickers.map((ticker, i) => `
                                        <tr>
                                            <td>${ticker}</td>
                                            <td>${(adjustedWeights[i] * 100).toFixed(2)}%</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        <div class="mt-3">
                            <p><strong>Expected Annual Return:</strong> ${(portfolioReturn * 100).toFixed(2)}%</p>
                            <p><strong>Annual Volatility:</strong> ${(portfolioVolatility * 100).toFixed(2)}%</p>
                            <p><strong>Sharpe Ratio:</strong> ${sharpeRatio.toFixed(2)}</p>
                        </div>`;

                    // Generate portfolio weights chart
                    const chartCanvas = document.createElement('canvas');
                    document.getElementById('portfolioChart').innerHTML = '';
                    document.getElementById('portfolioChart').appendChild(chartCanvas);
                    const ctx = chartCanvas.getContext('2d');

                    new dependencies.Chart(ctx, {
                        type: 'pie',
                        data: {
                            labels: tickers,
                            datasets: [{
                                data: adjustedWeights.map(w => w * 100),
                                backgroundColor: tickers.map((_, i) => `hsl(${i * 360 / tickers.length}, 70%, 50%)`)
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                title: { display: true, text: 'Portfolio Weights' },
                                tooltip: {
                                    callbacks: {
                                        label: (context) => `${context.label}: ${context.parsed.toFixed(2)}%`
                                    }
                                }
                            }
                        }
                    });

                    // Generate efficient frontier
                    const frontierReturns = [];
                    const frontierVolatilities = [];
                    const numPoints = 50;
                    const minReturn = Math.min(...meanReturns);
                    const maxReturn = Math.max(...meanReturns);

                    for (let i = 0; i < numPoints; i++) {
                        const targetReturn = minReturn + (maxReturn - minReturn) * i / (numPoints - 1);
                        try {
                            const frontierWeights = dependencies.PortfolioAllocation.meanVarianceOptimization({
                                returns: meanReturns,
                                covMatrix,
                                riskFreeRate,
                                targetReturn,
                                constraints: {
                                    minWeights: allowNegativeWeights ? null : Array(tickers.length).fill(0),
                                    maxWeights: Array(tickers.length).fill(1)
                                }
                            });
                            const vol = Math.sqrt(
                                frontierWeights.reduce((sum, w_i, i) =>
                                    sum + frontierWeights.reduce((innerSum, w_j, j) =>
                                        innerSum + w_i * w_j * covMatrix[i][j], 0), 0) * 252
                            );
                            frontierReturns.push(targetReturn * 100);
                            frontierVolatilities.push(vol * 100);
                        } catch (error) {
                            console.warn(`Failed to compute frontier point: ${error.message}`);
                        }
                    }

                    const frontierCanvas = document.createElement('canvas');
                    document.getElementById('portfolioPerformanceChart').innerHTML = '';
                    document.getElementById('portfolioPerformanceChart').appendChild(frontierCanvas);
                    const frontierCtx = frontierCanvas.getContext('2d');

                    new dependencies.Chart(frontierCtx, {
                        type: 'scatter',
                        data: {
                            datasets: [
                                {
                                    label: 'Efficient Frontier',
                                    data: frontierVolatilities.map((vol, i) => ({
                                        x: vol,
                                        y: frontierReturns[i]
                                    })),
                                    backgroundColor: '#007bff',
                                    pointRadius: 3
                                },
                                {
                                    label: 'Portfolio',
                                    data: [{
                                        x: portfolioVolatility * 100,
                                        y: portfolioReturn * 100
                                    }],
                                    backgroundColor: '#dc3545',
                                    pointRadius: 8
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                title: { display: true, text: 'Efficient Frontier' },
                                tooltip: {
                                    callbacks: {
                                        label: (context) => `Return: ${context.parsed.y.toFixed(2)}%, Volatility: ${context.parsed.x.toFixed(2)}%`
                                    }
                                }
                            },
                            scales: {
                                x: { title: { display: true, text: 'Volatility (%)' } },
                                y: { title: { display: true, text: 'Return (%)' } }
                            }
                        }
                    });

                    document.getElementById('portfolioResult').innerHTML = resultHTML;
                    showSuccessMessage('Portfolio optimization completed.', 'portfolioResult');
                } catch (error) {
                    showErrorMessage(`Optimization error: ${error.message}`, 'portfolioResult');
                }
            });
        }

        if (exportButton) {
            exportButton.addEventListener('click', () => {
                const table = document.querySelector('#portfolioResult table');
                if (!table) {
                    showErrorMessage('No portfolio data to export.', 'portfolioResult');
                    return;
                }

                const rows = Array.from(table.querySelectorAll('tr')).map(row =>
                    Array.from(row.querySelectorAll('th, td')).map(cell => cell.textContent)
                );
                const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'portfolio_weights.csv';
                a.click();
                URL.revokeObjectURL(url);
                showSuccessMessage('Portfolio exported successfully!', 'portfolioResult');
            });
        }
    }

    // Trading Strategies Implementation
    function implementStrategyFunctionality() {
        const backtestButton = document.getElementById('backtestStrategy');

        if (backtestButton) {
            backtestButton.addEventListener('click', () => {
                try {
                    const ticker = document.getElementById('strategyTicker').value;
                    const strategyType = document.getElementById('strategyType').value;
                    const fastPeriod = parseInt(document.getElementById('fastPeriod').value);
                    const slowPeriod = parseInt(document.getElementById('slowPeriod').value);
                    const transactionCost = parseFloat(document.getElementById('transactionCost').value) / 100;

                    if (!ticker) throw new Error('Please select a ticker.');
                    if (fastPeriod >= slowPeriod) throw new Error('Fast period must be less than slow period.');

                    const closeIndex = getColumnIndex(ticker);
                    const prices = getColumnData(closeIndex);
                    if (prices.length < slowPeriod) throw new Error('Insufficient data for the selected periods.');

                    let signals;
                    if (strategyType === 'sma-crossover') {
                        signals = calculateSMACrossover(prices, fastPeriod, slowPeriod);
                    } else if (strategyType === 'macd') {
                        const { macd, signal } = calculateMACD(prices, fastPeriod, slowPeriod, 9);
                        signals = Array(prices.length).fill(0);
                        for (let i = 1; i < macd.length; i++) {
                            if (!isNaN(macd[i]) && !isNaN(signal[i]) && !isNaN(macd[i - 1]) && !isNaN(signal[i - 1])) {
                                if (macd[i - 1] < signal[i - 1] && macd[i] > signal[i]) {
                                    signals[i] = 1; // Buy
                                } else if (macd[i - 1] > signal[i - 1] && macd[i] < signal[i]) {
                                    signals[i] = -1; // Sell
                                }
                            }
                        }
                    } else {
                        throw new Error('Unsupported strategy type.');
                    }

                    // Backtest
                    const initialCapital = 10000;
                    let cash = initialCapital;
                    let position = 0;
                    const equityCurve = [initialCapital];
                    const trades = [];

                    for (let i = 1; i < prices.length; i++) {
                        if (signals[i] === 1 && position === 0) {
                            // Buy
                            const shares = Math.floor(cash / prices[i]);
                            if (shares > 0) {
                                const cost = shares * prices[i] * (1 + transactionCost);
                                cash -= cost;
                                position = shares;
                                trades.push({ date: sharedDataset.rows[i][0], type: 'Buy', price: prices[i], shares });
                            }
                        } else if (signals[i] === -1 && position > 0) {
                            // Sell
                            const proceeds = position * prices[i] * (1 - transactionCost);
                            cash += proceeds;
                            trades.push({ date: sharedDataset.rows[i][0], type: 'Sell', price: prices[i], shares: position });
                            position = 0;
                        }
                        equityCurve.push(cash + position * prices[i]);
                    }

                    // Calculate performance metrics
                    const returns = equityCurve.slice(1).map((eq, i) => (eq - equityCurve[i]) / equityCurve[i]);
                    const annualizedReturn = calculateMean(returns) * 252;
                    const volatility = calculateStdDev(returns, calculateMean(returns)) * Math.sqrt(252);
                    const sharpeRatio = volatility > 0 ? (annualizedReturn - 0.02) / volatility : 0;
                    const maxDrawdown = calculateMaxDrawdown(equityCurve);

                    // Display results
                    let resultHTML = `
                        <div class="table-responsive">
                            <table class="table table-dark">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Price</th>
                                        <th>Shares</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${trades.map(trade => `
                                        <tr>
                                            <td>${trade.date}</td>
                                            <td>${trade.type}</td>
                                            <td>$${trade.price.toFixed(2)}</td>
                                            <td>${trade.shares}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        <div class="mt-3">
                            <p><strong>Final Equity:</strong> $${equityCurve[equityCurve.length - 1].toFixed(2)}</p>
                            <p><strong>Annualized Return:</strong> ${(annualizedReturn * 100).toFixed(2)}%</p>
                            <p><strong>Volatility:</strong> ${(volatility * 100).toFixed(2)}%</p>
                            <p><strong>Sharpe Ratio:</strong> ${sharpeRatio.toFixed(2)}</p>
                            <p><strong>Max Drawdown:</strong> ${(maxDrawdown * 100).toFixed(2)}%</p>
                        </div>`;

                    document.getElementById('strategyResult').innerHTML = resultHTML;

                    // Plot equity curve
                    const chartCanvas = document.createElement('canvas');
                    document.getElementById('strategyChart').innerHTML = '';
                    document.getElementById('strategyChart').appendChild(chartCanvas);
                    const ctx = chartCanvas.getContext('2d');

                    new dependencies.Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: sharedDataset.rows.slice(0, equityCurve.length).map(row => row[0]),
                            datasets: [{
                                label: 'Equity Curve',
                                data: equityCurve,
                                borderColor: '#28a745',
                                fill: false
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                title: { display: true, text: `${strategyType.toUpperCase()} Strategy Equity Curve` },
                                tooltip: {
                                    callbacks: {
                                        label: (context) => `Equity: $${context.parsed.y.toFixed(2)}`
                                    }
                                }
                            },
                            scales: {
                                x: { title: { display: true, text: 'Date' } },
                                y: { title: { display: true, text: 'Equity ($)' }, beginAtZero: false }
                            }
                        }
                    });

                    showSuccessMessage('Backtest completed successfully.', 'strategyResult');
                } catch (error) {
                    showErrorMessage(`Backtest error: ${error.message}`, 'strategyResult');
                }
            });
        }
    }

    // Basket Trading Implementation
    function implementBasketTradingFunctionality() {
        const availableTickers = document.getElementById('availableTickers');
        const selectedTickers = document.getElementById('selectedTickers');
        const addButton = document.getElementById('addToBasket');
        const removeButton = document.getElementById('removeFromBasket');
        const createButton = document.getElementById('createBasket');
        const exportButton = document.getElementById('exportBasket');
        const saveButton = document.getElementById('saveBasket');
        const loadButton = document.getElementById('loadSavedBasket');
        const analyzeButton = document.getElementById('analyzeBasket');

        // Load saved baskets
        const savedBaskets = JSON.parse(localStorage.getItem('savedBaskets') || '{}');
        const savedBasketsDropdown = document.getElementById('savedBasketsDropdown');
        Object.keys(savedBaskets).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            savedBasketsDropdown.appendChild(option);
        });

        // Add tickers to basket
        addButton.addEventListener('click', () => {
            Array.from(availableTickers.selectedOptions).forEach(option => {
                const newOption = document.createElement('option');
                newOption.value = option.value;
                newOption.textContent = option.textContent;
                selectedTickers.appendChild(newOption);
                option.remove();
            });
        });

        // Remove tickers from basket
        removeButton.addEventListener('click', () => {
            Array.from(selectedTickers.selectedOptions).forEach(option => {
                const newOption = document.createElement('option');
                newOption.value = option.value;
                newOption.textContent = option.textContent;
                availableTickers.appendChild(newOption);
                option.remove();
            });
        });

        // Create basket
        createButton.addEventListener('click', () => {
            try {
                const basketName = sanitizeInput(document.getElementById('basketName').value.trim());
                const tickers = Array.from(selectedTickers.options).map(o => o.value);
                const weightingMethod = document.getElementById('weightingMethod').value;

                if (!basketName) throw new Error('Please enter a basket name.');
                if (tickers.length === 0) throw new Error('Please select at least one ticker.');

                let weights;
                if (weightingMethod === 'equal') {
                    weights = Array(tickers.length).fill(1 / tickers.length);
                } else if (weightingMethod === 'market-cap') {
                    weights = calculateMarketCapWeights(tickers);
                } else if (weightingMethod === 'inverse-volatility') {
                    weights = calculateInverseVolatilityWeights(tickers);
                } else if (weightingMethod === 'custom') {
                    showWeightInputModal(tickers, (customWeights) => {
                        weights = customWeights;
                        displayBasket(basketName, tickers, weights);
                    });
                    return;
                }

                displayBasket(basketName, tickers, weights);
            } catch (error) {
                showErrorMessage(error.message, 'basketWeightsTable');
            }
        });

        // Display basket
        function displayBasket(basketName, tickers, weights) {
            // Display weights table
            let tableHTML = `
                <div class="table-responsive">
                    <table class="table table-dark">
                        <thead>
                            <tr>
                                <th>Ticker</th>
                                <th>Weight</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tickers.map((ticker, i) => `
                                <tr>
                                    <td>${ticker}</td>
                                    <td>${(weights[i] * 100).toFixed(2)}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`;

            document.getElementById('basketWeightsTable').innerHTML = tableHTML;

            // Display pie chart
            const chartCanvas = document.createElement('canvas');
            document.getElementById('basketPieChart').innerHTML = '';
            document.getElementById('basketPieChart').appendChild(chartCanvas);
            const ctx = chartCanvas.getContext('2d');

            new dependencies.Chart(ctx, {
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
                    plugins: {
                        title: { display: true, text: `${basketName} Weights` },
                        tooltip: {
                            callbacks: {
                                label: (context) => `${context.label}: ${context.parsed.toFixed(2)}%`
                            }
                        }
                    }
                }
            });

            showSuccessMessage('Basket created successfully.', 'basketWeightsTable');
        }

        // Save basket
        saveButton.addEventListener('click', () => {
            try {
                const basketName = sanitizeInput(document.getElementById('basketName').value.trim());
                const tickers = Array.from(selectedTickers.options).map(o => o.value);
                if (!basketName) throw new Error('Please enter a basket name.');
                if (tickers.length === 0) throw new Error('No tickers selected.');

                savedBaskets[basketName] = { tickers, weightingMethod: document.getElementById('weightingMethod').value };
                localStorage.setItem('savedBaskets', JSON.stringify(savedBaskets));

                const option = document.createElement('option');
                option.value = basketName;
                option.textContent = basketName;
                savedBasketsDropdown.appendChild(option);

                showSuccessMessage('Basket saved successfully.', 'basketWeightsTable');
            } catch (error) {
                showErrorMessage(error.message, 'basketWeightsTable');
            }
        });

        // Load saved basket
        loadButton.addEventListener('click', () => {
            try {
                const basketName = savedBasketsDropdown.value;
                if (!basketName) throw new Error('Please select a saved basket.');

                const basket = savedBaskets[basketName];
                document.getElementById('basketName').value = basketName;
                document.getElementById('weightingMethod').value = basket.weightingMethod;

                // Clear current selections
                Array.from(selectedTickers.options).forEach(o => {
                    const newOption = document.createElement('option');
                    newOption.value = o.value;
                    newOption.textContent = o.textContent;
                    availableTickers.appendChild(newOption);
                    o.remove();
                });

                // Add saved tickers
                basket.tickers.forEach(ticker => {
                    const option = Array.from(availableTickers.options).find(o => o.value === ticker);
                    if (option) {
                        const newOption = document.createElement('option');
                        newOption.value = option.value;
                        newOption.textContent = option.textContent;
                        selectedTickers.appendChild(newOption);
                        option.remove();
                    }
                });

                showSuccessMessage(`Loaded basket: ${basketName}`, 'basketWeightsTable');
            } catch (error) {
                showErrorMessage(error.message, 'basketWeightsTable');
            }
        });

        // Export basket
        exportButton.addEventListener('click', () => {
            const table = document.querySelector('#basketWeightsTable table');
            if (!table) {
                showErrorMessage('No basket data to export.', 'basketWeightsTable');
                return;
            }

            const rows = Array.from(table.querySelectorAll('tr')).map(row =>
                Array.from(row.querySelectorAll('th, td')).map(cell => cell.textContent)
            );
            const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'basket_weights.csv';
            a.click();
            URL.revokeObjectURL(url);
            showSuccessMessage('Basket exported successfully!', 'basketWeightsTable');
        });

        // Analyze basket performance
        analyzeButton.addEventListener('click', () => {
            try {
                const tickers = Array.from(selectedTickers.options).map(o => o.value);
                const benchmark = document.getElementById('basketBenchmark').value;
                const period = document.getElementById('basketPeriod').value;

                if (tickers.length === 0) throw new Error('No tickers in the basket.');

                // Determine data range
                let periodRows = sharedDataset.rows.length;
                switch (period) {
                    case '1y': periodRows = 252; break;
                    case '6m': periodRows = 126; break;
                    case '3m': periodRows = 63; break;
                    case '1m': periodRows = 21; break;
                }
                periodRows = Math.min(periodRows, sharedDataset.rows.length);
                const dataRows = sharedDataset.rows.slice(0, periodRows);

                // Calculate equal weights for simplicity
                const weights = Array(tickers.length).fill(1 / tickers.length);

                // Calculate basket returns
                const basketReturns = dataRows.slice(1).map((row, i) => {
                    let dailyReturn = 0;
                    tickers.forEach((ticker, j) => {
                        const columnIndex = getColumnIndex(ticker);
                        const price = parseFloat(row[columnIndex]);
                        const prevPrice = parseFloat(dataRows[i][columnIndex]);
                        if (!isNaN(price) && !isNaN(prevPrice) && prevPrice !== 0) {
                            dailyReturn += weights[j] * (price - prevPrice) / prevPrice;
                        }
                    });
                    return dailyReturn;
                });

                // Calculate benchmark returns if provided
                let benchmarkReturns = null;
                if (benchmark) {
                    const benchIndex = getColumnIndex(benchmark);
                    benchmarkReturns = dataRows.slice(1).map((row, i) => {
                        const price = parseFloat(row[benchIndex]);
                        const prevPrice = parseFloat(dataRows[i][benchIndex]);
                        return (!isNaN(price) && !isNaN(prevPrice) && prevPrice !== 0)
                            ? (price - prevPrice) / prevPrice
                            : 0;
                    });
                }

                // Calculate performance metrics
                const annualizedReturn = calculateMean(basketReturns) * 252;
                const volatility = calculateStdDev(basketReturns, calculateMean(basketReturns)) * Math.sqrt(252);
                const sharpeRatio = volatility > 0 ? (annualizedReturn - 0.02) / volatility : 0;
                const sortedReturns = [...basketReturns].sort((a, b) => a - b);
                const var95 = sortedReturns[Math.floor(sortedReturns.length * 0.05)] * Math.sqrt(252);

                // Equity curve
                const equityCurve = [10000];
                basketReturns.forEach(r => {
                    equityCurve.push(equityCurve[equityCurve.length - 1] * (1 + r));
                });
                const maxDrawdown = calculateMaxDrawdown(equityCurve);

                let metricsHTML = `
                    <div class="table-responsive">
                        <table class="table table-dark">
                            <thead>
                                <tr>
                                    <th>Metric</th>
                                    <th>Basket</th>
                                    ${benchmark ? '<th>Benchmark</th>' : ''}
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>Annualized Return</td><td>${(annualizedReturn * 100).toFixed(2)}%</td>
                                    ${benchmark ? `<td>${(calculateMean(benchmarkReturns) * 252 * 100).toFixed(2)}%</td>` : ''}
                                </tr>
                                <tr><td>Volatility</td><td>${(volatility * 100).toFixed(2)}%</td>
                                    ${benchmark ? `<td>${(calculateStdDev(benchmarkReturns, calculateMean(benchmarkReturns)) * Math.sqrt(252) * 100).toFixed(2)}%</td>` : ''}
                                </tr>
                                <tr><td>Sharpe Ratio</td><td>${sharpeRatio.toFixed(2)}</td>
                                    ${benchmark ? `<td>${((calculateMean(benchmarkReturns) * 252 - 0.02) / (calculateStdDev(benchmarkReturns, calculateMean(benchmarkReturns)) * Math.sqrt(252))).toFixed(2)}</td>` : ''}
                                </tr>
                                <tr><td>Max Drawdown</td><td>${(maxDrawdown * 100).toFixed(2)}%</td>
                                    ${benchmark ? `<td>${(calculateMaxDrawdown(benchmarkReturns.reduce((eq, r, i) => [...eq, (eq[i] || 10000) * (1 + r)], [10000])) * 100).toFixed(2)}%</td>` : ''}
                                </tr>
                                <tr><td>VaR (95%)</td><td>${(var95 * 100).toFixed(2)}%</td>
                                    ${benchmark ? `<td>${(([...benchmarkReturns].sort((a, b) => a - b)[Math.floor(benchmarkReturns.length * 0.05)] * Math.sqrt(252) * 100).toFixed(2))}%</td>` : ''}
                                </tr>
                            </tbody>
                        </table>
                    </div>`;

                document.getElementById('basketMetrics').innerHTML = metricsHTML;

                // Plot performance chart
                const chartCanvas = document.createElement('canvas');
                document.getElementById('basketPerformanceChart').innerHTML = '';
                document.getElementById('basketPerformanceChart').appendChild(chartCanvas);
                const ctx = chartCanvas.getContext('2d');

                const datasets = [
                    {
                        label: 'Basket Equity',
                        data: equityCurve,
                        borderColor: '#28a745',
                        fill: false
                    }
                ];

                if (benchmark) {
                    const benchEquity = [10000];
                    benchmarkReturns.forEach(r => {
                        benchEquity.push(benchEquity[benchEquity.length - 1] * (1 + r));
                    });
                    datasets.push({
                        label: 'Benchmark Equity',
                        data: benchEquity,
                        borderColor: '#007bff',
                        fill: false
                    });
                }

                new dependencies.Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: dataRows.slice(0, equityCurve.length).map(row => row[0]),
                        datasets
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: { display: true, text: 'Basket vs Benchmark Performance' },
                            tooltip: {
                                callbacks: {
                                    label: (context) => `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`
                                }
                            }
                        },
                        scales: {
                            x: { title: { display: true, text: 'Date' } },
                            y: { title: { display: true, text: 'Equity ($)' }, beginAtZero: false }
                        }
                    }
                });

                showSuccessMessage('Basket performance analysis completed.', 'basketMetrics');
            } catch (error) {
                showErrorMessage(error.message, 'basketMetrics');
            }
        });
    }

    // Utility Functions
    function detectOutliers(values) {
        const mean = calculateMean(values);
        const stdDev = calculateStdDev(values, mean);
        if (stdDev === 0) return [];
        return values.filter(v => Math.abs(v - mean) > 3 * stdDev);
    }

    function calculateCovarianceMatrix(returnsData) {
        const n = returnsData[0].length;
        const means = returnsData.map(returns => calculateMean(returns));
        const covMatrix = returnsData.map(() => Array(returnsData.length).fill(0));

        for (let i = 0; i < returnsData.length; i++) {
            for (let j = i; j < returnsData.length; j++) {
                let cov = 0;
                for (let k = 0; k < n; k++) {
                    cov += (returnsData[i][k] - means[i]) * (returnsData[j][k] - means[j]);
                }
                cov /= n;
                covMatrix[i][j] = cov;
                covMatrix[j][i] = cov;
            }
        }
        return covMatrix.map(row => row.map(v => v * 252)); // Annualize
    }

    function calculateMarketCapWeights(tickers) {
        // Placeholder: Assume equal weights as market cap data is not available
        console.warn('Market cap data not available; using equal weights.');
        return Array(tickers.length).fill(1 / tickers.length);
    }

    function calculateInverseVolatilityWeights(tickers) {
        const volatilities = tickers.map(ticker => {
            const columnIndex = getColumnIndex(ticker);
            const prices = getColumnData(columnIndex);
            const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
            return calculateStdDev(returns, calculateMean(returns)) * Math.sqrt(252);
        });

        const inverseVols = volatilities.map(v => v > 0 ? 1 / v : 0);
        const sumInverseVols = inverseVols.reduce((sum, v) => sum + v, 0);
        if (sumInverseVols === 0) {
            console.warn('All volatilities are zero; using equal weights.');
            return Array(tickers.length).fill(1 / tickers.length);
        }
        return inverseVols.map(v => v / sumInverseVols);
    }

    // Initialize the platform
    dynamicContent.innerHTML = toolbarHandlers['toolbar-data']();
    attachDataMenuEventListeners();
});