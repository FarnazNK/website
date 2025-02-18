document.addEventListener('DOMContentLoaded', () => {
    const dynamicContent = document.getElementById('dynamicMenuContent');
    let sharedDataset = { headers: [], rows: [] };

    const toolbarHandlers = {
        'toolbar-predictions': `
            <section style="background: linear-gradient(115deg, #6dcfe7, #1e1e1e);">
                <div class="row">
                    <div class="col-md-3 bg-dark text-light p-3 rounded shadow-sm menu-section">
                        <h4 class="text-light">Prediction Models</h4>
                        <ul class="list-group">
                            <li class="list-group-item menu-item" id="menu-supervised">
                                Supervised Learning
                                <ul class="nested-submenu" id="submenu-supervised">
                                    <li class="nested-submenu-item" id="linearRegression">Linear Regression</li>
                                    <li class="nested-submenu-item" id="logisticRegression">Logistic Regression</li>
                                    <li class="nested-submenu-item" id="decisionTree">Decision Tree</li>
                                    <li class="nested-submenu-item" id="randomForest">Random Forest</li>
                                    <li class="nested-submenu-item" id="svm">Support Vector Machine (SVM)</li>
                                </ul>
                            </li>
                            <li class="list-group-item menu-item" id="menu-unsupervised">
                                Unsupervised Learning
                                <ul class="nested-submenu" id="submenu-unsupervised">
                                    <li class="nested-submenu-item" id="kMeansClustering">K-Means Clustering</li>
                                    <li class="nested-submenu-item" id="pca">Principal Component Analysis (PCA)</li>
                                    <li class="nested-submenu-item" id="hierarchicalClustering">Hierarchical Clustering</li>
                                    <li class="nested-submenu-item" id="dbscan">DBSCAN</li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                    <div class="col-md-9 bg-light p-3 rounded shadow-sm" id="model-content">
                        <h4 class="text-center">Select a model to see details</h4>
                    </div>
                </div>
            </section>`,
        'toolbar-transformations': `
            <section style="background: linear-gradient(115deg, #6dcfe7, #1e1e1e);">
                <div class="row">
                    <div class="col-md-3 bg-dark text-light p-3 rounded shadow-sm menu-section">
                        <h4 class="text-light">Data Transformations</h4>
                        <ul class="list-group">
                            <li class="list-group-item menu-item" id="normalize-data">Normalize Data</li>
                            <li class="list-group-item menu-item" id="scale-data">Scale Data</li>
                            <li class="list-group-item menu-item" id="log-transform">Log Transformation</li>
                            <li class="list-group-item menu-item" id="custom-transform">Custom Transformation</li>
                            <li class="list-group-item menu-item" id="sqrt-transform">Square Root Transformation</li>
                            <li class="list-group-item menu-item" id="exp-transform">Exponential Transformation</li>
                            <li class="list-group-item menu-item" id="inverse-transform">Inverse Transformation</li>
                            <li class="list-group-item menu-item" id="binning-data">Binning</li>
                            <li class="list-group-item menu-item" id="absolute-value">Absolute Value Transformation</li>
                            <li class="list-group-item menu-item" id="capping">Capping (Winsorizing)</li>
                            <li class="list-group-item menu-item" id="one-hot-encoding">One-Hot Encoding</li>
                            <li class="list-group-item menu-item" id="standardize-data">Standardize Data (Z-Score)</li>
                            <li class="list-group-item menu-item" id="clipping">Clipping</li>
                        </ul>
                    </div>
                    <div class="col-md-9 bg-light p-3 rounded shadow-sm" id="transformation-content">
                        <h4 class="text-center">Select a Transformation to Display Results</h4>
                        <div id="transformationOutput" class="text-dark mt-3"></div>
                    </div>
                </div>
            </section>`
    };

    // Attach Event Listeners to Toolbar Buttons
    Object.keys(toolbarHandlers).forEach(id => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', () => {
                dynamicContent.innerHTML = toolbarHandlers[id];
                // Ensure the DOM has been updated
                setTimeout(() => {
                    if (id === 'toolbar-predictions') {
                        implementPredictionFunctionality();
                    } else if (id === 'toolbar-transformations') {
                        implementTransformationFunctionality();
                    }
                }, 0);
            });
        }
    });

    function implementPredictionFunctionality() {
        document.getElementById('linearRegression').addEventListener('click', () => handleModelClick('Linear Regression', performLinearRegression));
        document.getElementById('logisticRegression').addEventListener('click', () => handleModelClick('Logistic Regression', performLogisticRegression));
        document.getElementById('decisionTree').addEventListener('click', () => handleModelClick('Decision Tree', performDecisionTree));
        document.getElementById('randomForest').addEventListener('click', () => handleModelClick('Random Forest', performRandomForest));
        document.getElementById('svm').addEventListener('click', () => handleModelClick('Support Vector Machine (SVM)', performSVM));
        document.getElementById('kMeansClustering').addEventListener('click', () => handleModelClick('K-Means Clustering', performKMeansClustering));
        document.getElementById('pca').addEventListener('click', () => handleModelClick('Principal Component Analysis (PCA)', performPCA));
        document.getElementById('hierarchicalClustering').addEventListener('click', () => handleModelClick('Hierarchical Clustering', performHierarchicalClustering));
        document.getElementById('dbscan').addEventListener('click', () => handleModelClick('DBSCAN', performDBSCAN));
    }

// Global variable to store the current Chart.js instance
let currentChart = null;

// Function to handle model selection and display
function handleModelClick(modelName, modelFunction) {
    const dynamicContent = document.getElementById('dynamicMenuContent');

    // Clear previous content and reset current chart
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }

    dynamicContent.innerHTML = `
        <div class="row">
            <div class="col-md-4 bg-dark text-light p-3">
                <h4>Data Options</h4>
                <p>Select data for analysis:</p>
                <div id="dataSelectionForm">
                    <label for="x-axis">X-axis:</label>
                    <select id="x-axis" class="form-control">
                        ${sharedDataset.headers.map(header => `<option>${header}</option>`).join('')}
                    </select>
                    <label for="y-axis">Y-axis:</label>
                    <select id="y-axis" class="form-control">
                        ${sharedDataset.headers.map(header => `<option>${header}</option>`).join('')}
                    </select>
                    <button class="btn btn-primary mt-3" id="plotButton">Plot</button>
                </div>
            </div>
            <div class="col-md-8 bg-light p-3">
                <h4>${modelName} Model</h4>
                <canvas id="chartCanvas" style="width: 100%; height: 400px;"></canvas>
            </div>
        </div>`;

    // Attach event listener for the Plot button
    const plotButton = document.getElementById('plotButton');
    plotButton.addEventListener('click', function () {
        if (currentChart) {
            currentChart.destroy(); // Ensure the previous chart is destroyed
        }
        modelFunction();
    });
}

// Function to perform linear regression
function performLinearRegression() {
    const xColumn = document.getElementById('x-axis').value;
    const yColumn = document.getElementById('y-axis').value;

    const xIndex = sharedDataset.headers.indexOf(xColumn);
    const yIndex = sharedDataset.headers.indexOf(yColumn);

    const xValues = getColumnData(xIndex);
    const yValues = getColumnData(yIndex);

    if (xValues.length !== yValues.length || xValues.length === 0) {
        alert('Invalid data: X and Y columns must have the same number of valid numeric entries.');
        return;
    }

    // Perform regression
    const regressionResults = calculateLinearRegression(xValues, yValues);
    console.log('Regression Results:', regressionResults); // Debugging
    plotRegressionResults(xValues, yValues, regressionResults.predictions, xColumn, yColumn);
}

// Function to plot regression results
function plotRegressionResults(xValues, yValues, predictions, xColumn, yColumn) {
    const canvasElement = document.getElementById('chartCanvas');
    if (!canvasElement) {
        alert('Chart canvas element not found.');
        return;
    }

    const chartCanvas = canvasElement.getContext('2d');
    if (!chartCanvas) {
        alert('Failed to get canvas context.');
        return;
    }

    // Destroy the existing chart if it exists
    if (currentChart) {
        currentChart.destroy();
    }

    // Create a new Chart.js instance
    currentChart = new Chart(chartCanvas, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Data Points',
                    data: xValues.map((x, i) => ({ x, y: yValues[i] })),
                    backgroundColor: '#4b9cdf',
                },
                {
                    label: 'Regression Line',
                    data: xValues.map((x, i) => ({ x, y: predictions[i] })),
                    type: 'line',
                    borderColor: '#ff6347',
                    fill: false,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                },
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: xColumn,
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: yColumn,
                    },
                },
            },
        },
    });
}

// Function to calculate linear regression
function calculateLinearRegression(xValues, yValues) {
    const n = xValues.length;
    const xMean = xValues.reduce((sum, val) => sum + val, 0) / n;
    const yMean = yValues.reduce((sum, val) => sum + val, 0) / n;

    const numerator = xValues.reduce((sum, x, i) => sum + (x - xMean) * (yValues[i] - yMean), 0);
    const denominator = xValues.reduce((sum, x) => sum + Math.pow(x - xMean, 2), 0);

    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;

    const predictions = xValues.map(x => slope * x + intercept);

    return { slope, intercept, predictions };
}

// Function to get column data
function getColumnData(columnIndex) {
    return sharedDataset.rows.map(row => parseFloat(row[columnIndex])).filter(val => !isNaN(val));
}

    
    

    function implementTransformationFunctionality() {
        document.getElementById('normalize-data').addEventListener('click', () => handleTransformationClick('Normalize Data', normalizeData));
        document.getElementById('scale-data').addEventListener('click', () => handleTransformationClick('Scale Data', scaleData));
        document.getElementById('log-transform').addEventListener('click', () => handleTransformationClick('Log Transformation', logTransformation));
        document.getElementById('custom-transform').addEventListener('click', () => handleTransformationClick('Custom Transformation', customTransformation));
        document.getElementById('sqrt-transform').addEventListener('click', () => handleTransformationClick('Square Root Transformation', sqrtTransformation));
        document.getElementById('exp-transform').addEventListener('click', () => handleTransformationClick('Exponential Transformation', expTransformation));
        document.getElementById('inverse-transform').addEventListener('click', () => handleTransformationClick('Inverse Transformation', inverseTransformation));
        document.getElementById('binning-data').addEventListener('click', () => handleTransformationClick('Binning', binningData));
        document.getElementById('absolute-value').addEventListener('click', () => handleTransformationClick('Absolute Value Transformation', absoluteValueTransformation));
        document.getElementById('capping').addEventListener('click', () => handleTransformationClick('Capping (Winsorizing)', cappingTransformation));
        document.getElementById('one-hot-encoding').addEventListener('click', () => handleTransformationClick('One-Hot Encoding', oneHotEncoding));
        document.getElementById('standardize-data').addEventListener('click', () => handleTransformationClick('Standardize Data (Z-Score)', standardizeData));
        document.getElementById('clipping').addEventListener('click', () => handleTransformationClick('Clipping', clipping));
    }
    function handleTransformationClick(transformationName, transformationFunction) {
        const transformationContent = document.getElementById('transformation-content');
        transformationContent.innerHTML = `
            <h4>${transformationName}</h4>
            <p>Applying ${transformationName}...</p>
            <div id="transformationOutput" class="text-dark mt-3"></div>`;
        transformationFunction();
    }

    function sqrtTransformation() {
        const column = prompt('Enter the column name to apply square root transformation:');
        if (!validateColumn(column)) return;
    
        const columnIndex = sharedDataset.headers.indexOf(column);
    
        sharedDataset.rows = sharedDataset.rows.map(row => {
            const value = parseFloat(row[columnIndex]);
            if (!isNaN(value) && value >= 0) row[columnIndex] = Math.sqrt(value).toFixed(2);
            return row;
        });
    
        updateTransformationOutput(`Applied square root transformation to column: ${column}`);
    }

    function expTransformation() {
        const column = prompt('Enter the column name to apply exponential transformation:');
        if (!validateColumn(column)) return;
    
        const columnIndex = sharedDataset.headers.indexOf(column);
    
        sharedDataset.rows = sharedDataset.rows.map(row => {
            const value = parseFloat(row[columnIndex]);
            if (!isNaN(value)) row[columnIndex] = Math.exp(value).toFixed(2);
            return row;
        });
    
        updateTransformationOutput(`Applied exponential transformation to column: ${column}`);
    }
    function inverseTransformation() {
        const column = prompt('Enter the column name to apply inverse transformation:');
        if (!validateColumn(column)) return;
    
        const columnIndex = sharedDataset.headers.indexOf(column);
    
        sharedDataset.rows = sharedDataset.rows.map(row => {
            const value = parseFloat(row[columnIndex]);
            if (!isNaN(value) && value !== 0) row[columnIndex] = (1 / value).toFixed(2);
            return row;
        });
    
        updateTransformationOutput(`Applied inverse transformation to column: ${column}`);
    }
    function binningData() {
        const column = prompt('Enter the column name for binning:');
        const bins = parseInt(prompt('Enter the number of bins:'), 10);
        if (!validateColumn(column) || isNaN(bins) || bins <= 0) return;
    
        const columnIndex = sharedDataset.headers.indexOf(column);
        const values = getColumnData(columnIndex);
    
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binSize = (max - min) / bins;
    
        sharedDataset.rows = sharedDataset.rows.map(row => {
            const value = parseFloat(row[columnIndex]);
            if (!isNaN(value)) {
                const bin = Math.floor((value - min) / binSize) + 1;
                row[columnIndex] = `Bin ${bin}`;
            }
            return row;
        });
    
        updateTransformationOutput(`Binned column: ${column} into ${bins} bins.`);
    }
    function absoluteValueTransformation() {
        const column = prompt('Enter the column name to apply absolute value transformation:');
        if (!validateColumn(column)) return;
    
        const columnIndex = sharedDataset.headers.indexOf(column);
    
        sharedDataset.rows = sharedDataset.rows.map(row => {
            const value = parseFloat(row[columnIndex]);
            if (!isNaN(value)) row[columnIndex] = Math.abs(value).toFixed(2);
            return row;
        });
    
        updateTransformationOutput(`Applied absolute value transformation to column: ${column}`);
    }
    function cappingTransformation() {
        const column = prompt('Enter the column name for capping:');
        const percentile = parseFloat(prompt('Enter the percentile threshold (e.g., 0.05 for 5%):'));
        if (!validateColumn(column) || isNaN(percentile) || percentile <= 0 || percentile >= 1) return;
    
        const columnIndex = sharedDataset.headers.indexOf(column);
        const values = getColumnData(columnIndex).sort((a, b) => a - b);
    
        const lowerIndex = Math.floor(percentile * values.length);
        const upperIndex = Math.ceil((1 - percentile) * values.length) - 1;
    
        const lowerCap = values[lowerIndex];
        const upperCap = values[upperIndex];
    
        sharedDataset.rows = sharedDataset.rows.map(row => {
            const value = parseFloat(row[columnIndex]);
            if (!isNaN(value)) {
                row[columnIndex] = Math.max(lowerCap, Math.min(value, upperCap)).toFixed(2);
            }
            return row;
        });
    
        updateTransformationOutput(`Capped column: ${column} to ${percentile * 100}% bounds.`);
    }
    function oneHotEncoding() {
        const column = prompt('Enter the column name for one-hot encoding:');
        if (!validateColumn(column)) return;
    
        const columnIndex = sharedDataset.headers.indexOf(column);
        const uniqueValues = [...new Set(sharedDataset.rows.map(row => row[columnIndex]))];
    
        uniqueValues.forEach(value => {
            sharedDataset.headers.push(`${column}_${value}`);
            sharedDataset.rows = sharedDataset.rows.map(row => {
                row.push(row[columnIndex] === value ? 1 : 0);
                return row;
            });
        });
    
        updateTransformationOutput(`Applied one-hot encoding to column: ${column}`);
    }
    function standardizeData() {
        const column = prompt('Enter the column name to standardize:');
        if (!validateColumn(column)) return;
    
        const columnIndex = sharedDataset.headers.indexOf(column);
        const values = getColumnData(columnIndex);
    
        const mean = calculateMean(values);
        const stdDev = calculateStdDev(values, mean);
    
        sharedDataset.rows = sharedDataset.rows.map(row => {
            const value = parseFloat(row[columnIndex]);
            if (!isNaN(value)) row[columnIndex] = ((value - mean) / stdDev).toFixed(2);
            return row;
        });
    
        updateTransformationOutput(`Standardized column: ${column}`);
    }
    function clipping() {
        const column = prompt('Enter the column name to clip:');
        const minValue = parseFloat(prompt('Enter the minimum value:'));
        const maxValue = parseFloat(prompt('Enter the maximum value:'));
        if (!validateColumn(column) || isNaN(minValue) || isNaN(maxValue) || minValue >= maxValue) return;
    
        const columnIndex = sharedDataset.headers.indexOf(column);
    
        sharedDataset.rows = sharedDataset.rows.map(row => {
            const value = parseFloat(row[columnIndex]);
            if (!isNaN(value)) row[columnIndex] = Math.max(minValue, Math.min(value, maxValue)).toFixed(2);
            return row;
        });
    
        updateTransformationOutput(`Clipped column: ${column} to range [${minValue}, ${maxValue}]`);
    }
                                
    function normalizeData() {
        const column = prompt('Enter the column name to normalize:');
        if (!validateColumn(column)) return;

        const columnIndex = sharedDataset.headers.indexOf(column);
        const values = getColumnData(columnIndex);

        const mean = calculateMean(values);
        const stdDev = calculateStdDev(values, mean);

        sharedDataset.rows = sharedDataset.rows.map(row => {
            const value = parseFloat(row[columnIndex]);
            if (!isNaN(value)) row[columnIndex] = ((value - mean) / stdDev).toFixed(2);
            return row;
        });

        updateTransformationOutput(`Normalized column: ${column}`);
    }

    function scaleData() {
        const column = prompt('Enter the column name to scale:');
        if (!validateColumn(column)) return;

        const columnIndex = sharedDataset.headers.indexOf(column);
        const values = getColumnData(columnIndex);

        const min = Math.min(...values);
        const max = Math.max(...values);

        sharedDataset.rows = sharedDataset.rows.map(row => {
            const value = parseFloat(row[columnIndex]);
            if (!isNaN(value)) row[columnIndex] = ((value - min) / (max - min)).toFixed(2);
            return row;
        });

        updateTransformationOutput(`Scaled column: ${column}`);
    }

    function logTransformation() {
        const column = prompt('Enter the column name to apply log transformation:');
        if (!validateColumn(column)) return;

        const columnIndex = sharedDataset.headers.indexOf(column);

        sharedDataset.rows = sharedDataset.rows.map(row => {
            const value = parseFloat(row[columnIndex]);
            if (!isNaN(value)) row[columnIndex] = Math.log(value + 1).toFixed(2);
            return row;
        });

        updateTransformationOutput(`Applied log transformation to column: ${column}`);
    }

    function customTransformation() {
        const column = prompt('Enter the column name for custom transformation:');
        if (!validateColumn(column)) return;

        const expression = prompt('Enter the transformation expression (e.g., x * 2 for doubling values):');
        if (!expression) {
            alert('Invalid transformation expression.');
            return;
        }

        const columnIndex = sharedDataset.headers.indexOf(column);

        sharedDataset.rows = sharedDataset.rows.map(row => {
            const value = parseFloat(row[columnIndex]);
            if (!isNaN(value)) {
                try {
                    row[columnIndex] = eval(expression.replace(/x/g, value)).toFixed(2);
                } catch (e) {
                    alert('Error in transformation expression.');
                }
            }
            return row;
        });

        updateTransformationOutput(`Applied custom transformation to column: ${column}`);
    }

    function validateColumn(column) {
        console.log('Validating column:', column); // Debug
        console.log('Current headers:', sharedDataset.headers); // Debug
        if (!sharedDataset.headers.includes(column)) {
            alert('Invalid column name.');
            return false;
        }
        return true;
    }
    

    function getColumnData(columnIndex) {
        return sharedDataset.rows.map(row => parseFloat(row[columnIndex])).filter(val => !isNaN(val));
    }

    function calculateMean(values) {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    function calculateStdDev(values, mean) {
        return Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    }

    function updateTransformationOutput(message) {
        const output = document.getElementById('transformationOutput');
        output.innerHTML = `<p>${message}</p>`;
    }


    // Add Event Listeners for Static Toolbar Buttons
    Object.keys(toolbarHandlers).forEach(id => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', () => {
                dynamicContent.innerHTML = toolbarHandlers[id];
            });
        }
    });

    const plotsButton = document.getElementById('toolbar-plots');
if (plotsButton) {
    plotsButton.addEventListener('click', () => {
        if (!sharedDataset.headers.length) {
            alert('No data available. Please upload data in the Data section.');
            return;
        }
        dynamicContent.innerHTML = `
            <section style="background: linear-gradient(115deg, #6dcfe7, #1e1e1e);">
                <div class="container py-4">
                    <div class="row">
                        <div class="col-3 bg-dark text-light p-3 rounded shadow-sm">
                            <h4>Plot Options</h4>
                            <label>Select X-Axis:</label>
                            <select id="xAxisColumn" class="form-control mb-3"></select>
                            <label>Select Y-Axis:</label>
                            <select id="yAxisColumn" class="form-control mb-3"></select>
                            <label>Chart Type:</label>
                            <select id="chartType" class="form-control mb-3">
                                <option value="bar">Bar Chart</option>
                                <option value="line">Line Chart</option>
                                <option value="scatter">Scatter Plot</option>
                                <option value="pie">Pie Chart</option>
                                <option value="doughnut">Doughnut Chart</option>
                                <option value="radar">Radar Chart</option>
                            </select>
                            <label>Chart Label:</label>
                            <input type="text" id="chartLabel" class="form-control mb-3" placeholder="Enter label (optional)">
                            <label>Chart Color:</label>
                            <input type="color" id="chartColor" class="form-control mb-3">
                            <label>Show Legend:</label>
                            <select id="showLegend" class="form-control mb-3">
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                            <label>X-Axis Range (Optional):</label>
                            <input type="text" id="xAxisRange" class="form-control mb-3" placeholder="e.g., 0,100">
                            <label>Y-Axis Range (Optional):</label>
                            <input type="text" id="yAxisRange" class="form-control mb-3" placeholder="e.g., 0,100">
                            <button class="btn btn-primary w-100 mb-2" id="generateChart">Generate Chart</button>
                            <button class="btn btn-secondary w-100" id="updateChart">Update Chart</button>
                        </div>
                        <div class="col-9">
                            <div id="chartsContainer" class="d-flex flex-wrap gap-3"></div>
                        </div>
                    </div>
                </div>
            </section>`;
        populateColumnSelectors();
        implementPlotFunctionality();
    });
} else {
    console.error('Button with id "toolbar-plots" not found.');
}


// Toolbar Button for Statistics Section
const statsButton = document.getElementById('toolbar-statistics');
if (statsButton) {
    statsButton.addEventListener('click', () => {
        if (!sharedDataset.headers.length) {
            alert('No data available. Please upload data in the Data section.');
            return;
        }
        dynamicContent.innerHTML = `
            <section style="background: linear-gradient(115deg, #6dcfe7, #1e1e1e);">
                <div class="container py-4">
                    <h4 class="text-light">Statistics Section</h4>
                    <div class="row">
                        <div class="col-md-6 bg-dark text-light p-3 rounded shadow-sm">
                            <h5>Summary Statistics</h5>
                            <select id="statsColumn" class="form-control mb-3"></select>
                            <button class="btn btn-primary mb-3" id="generateStats">Generate Statistics</button>
                            <div id="statsResult" class="text-light"></div>
                        </div>
                    </div>
                </div>
            </section>`;
        populateStatsSelectors();
        implementStatisticsFunctionality();
    });
} else {
    console.error('Button with id "toolbar-statistics" not found.');
}


    // Toolbar Button for Data Section
    const dataButton = document.getElementById('toolbar-data');
    if (dataButton) {
        dataButton.addEventListener('click', () => {
            dynamicContent.innerHTML = getDataSectionContent();
            attachDataMenuEventListeners();
        });
    } else {
        console.error('Button with id "toolbar-data" not found.');
    }

   // Helper Functions
function getDataSectionContent() {
    return `
        <div class="row">
            <div class="col-md-3 bg-dark p-3 rounded shadow-sm menu-section">
                <h4 class="text-light">Menu</h4>
                <ul class="list-group">
                    <li class="list-group-item menu-item" id="menu-load-data">Load Data</li>
                    <li class="list-group-item menu-item" id="menu-clean-data">Clean Data</li>
                    <li class="list-group-item menu-item" id="menu-filter-data">Filter Data</li>
                    <li class="list-group-item menu-item" id="menu-identify-types">Identify Column Types</li>
                </ul>
            </div>
            <div class="col-md-9 bg-light p-3 rounded shadow-sm" id="data-content">
                <h4 class="text-center">Select a menu item to see options</h4>
            </div>
        </div>`;
}

function attachDataMenuEventListeners() {
    document.getElementById('menu-load-data').addEventListener('click', loadDataSection);
    document.getElementById('menu-clean-data').addEventListener('click', cleanDataSection);
    document.getElementById('menu-filter-data').addEventListener('click', filterDataSection);
    document.getElementById('menu-identify-types').addEventListener('click', identifyColumnTypes);
}

// Function to Identify Column Types
function identifyColumnTypes() {
    if (!sharedDataset.headers.length) {
        alert('No data available. Please load data first.');
        return;
    }

    let columnTypes = sharedDataset.headers.map(header => {
        let values = sharedDataset.rows.map(row => row[sharedDataset.headers.indexOf(header)]);
        let detectedType = detectColumnType(values);
        return { column: header, type: detectedType };
    });

    // Generate Table
    let tableHTML = `
        <h4 class="text-center">Column Type Identification</h4>
        <table class="table table-striped table-bordered">
            <thead>
                <tr>
                    <th>Column Name</th>
                    <th>Detected Type</th>
                </tr>
            </thead>
            <tbody>
                ${columnTypes.map(col => `<tr><td>${col.column}</td><td>${col.type}</td></tr>`).join('')}
            </tbody>
        </table>`;

    document.getElementById('data-content').innerHTML = tableHTML;
}

// Function to Detect Column Type
function detectColumnType(values) {
    let uniqueValues = [...new Set(values.filter(v => v !== ""))]; 
    let numValues = uniqueValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
    
    if (uniqueValues.length === 2 && uniqueValues.every(v => v.toLowerCase() === "true" || v.toLowerCase() === "false" || v === "0" || v === "1")) {
        return "Boolean";
    }
    if (numValues.length === uniqueValues.length) {
        return numValues.some(v => v % 1 !== 0) ? "Numerical (Float)" : "Numerical (Integer)";
    }
    if (uniqueValues.every(v => !isNaN(Date.parse(v)))) {
        return "Date/Time";
    }
    if (uniqueValues.length < sharedDataset.rows.length * 0.1) {
        return "Categorical";
    }
    return "Text";
}

    function populateColumnSelectors() {
        const xAxisSelect = document.getElementById('xAxisColumn');
        const yAxisSelect = document.getElementById('yAxisColumn');
        xAxisSelect.innerHTML = sharedDataset.headers.map(header => `<option value="${header}">${header}</option>`).join('');
        yAxisSelect.innerHTML = sharedDataset.headers.map(header => `<option value="${header}">${header}</option>`).join('');
    }


// Implement Enhanced Plot Functionality
// Implement Enhanced Plot Functionality
function implementPlotFunctionality() {
    const chartsContainer = document.getElementById('chartsContainer');
    let chartInstances = [];

    // Generate Chart
    // Generate Chart with Improved Layout
document.getElementById('generateChart').addEventListener('click', () => {
    const xAxisColumn = document.getElementById('xAxisColumn').value;
    const yAxisColumn = document.getElementById('yAxisColumn').value;
    const chartType = document.getElementById('chartType').value;
    const chartLabel = document.getElementById('chartLabel').value || `${yAxisColumn} vs ${xAxisColumn}`;
    const chartColor = document.getElementById('chartColor').value || '#4b9cdf';
    const showLegend = document.getElementById('showLegend').value === 'true';

    if (!xAxisColumn || !yAxisColumn) {
        alert('Please select both X and Y axes.');
        return;
    }

    const labels = sharedDataset.rows.map(row => row[sharedDataset.headers.indexOf(xAxisColumn)]);
    const data = sharedDataset.rows.map(row => parseFloat(row[sharedDataset.headers.indexOf(yAxisColumn)]));

    if (data.every(isNaN)) {
        alert('The selected Y-axis column contains no valid numeric data.');
        return;
    }

    // Create Chart Wrapper
    const chartWrapper = document.createElement('div');
    chartWrapper.className = 'chart-wrapper';

    // Add Chart Title
    const chartTitle = document.createElement('h4');
    chartTitle.textContent = chartLabel;
    chartWrapper.appendChild(chartTitle);

    // Create Canvas for Chart
    const canvas = document.createElement('canvas');
    chartWrapper.appendChild(canvas);

    // Add Remove Button
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-chart-btn';
    removeButton.textContent = 'Remove Chart';
    removeButton.addEventListener('click', () => {
        chartsContainer.removeChild(chartWrapper);
    });
    chartWrapper.appendChild(removeButton);

    chartsContainer.appendChild(chartWrapper);

    // Create Chart
    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: chartLabel,
                data: data,
                backgroundColor: chartColor,
                borderColor: chartColor,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: showLegend
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: xAxisColumn
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisColumn
                    }
                }
            }
        }
    });
});


// Update Chart
document.getElementById('updateChart').addEventListener('click', () => {
    if (!chart) {
        alert('No chart is currently generated. Please generate a chart first.');
        return;
    }

    const newXAxisColumn = document.getElementById('xAxisColumn').value;
    const newYAxisColumn = document.getElementById('yAxisColumn').value;
    const newLabelText = document.getElementById('chartLabel').value || `${newYAxisColumn} vs ${newXAxisColumn}`;
    const newColor = document.getElementById('chartColor').value || '#4b9cdf';

    // Parse new X and Y axis range inputs
    const xAxisRangeInput = document.getElementById('xAxisRange').value.split(',').map(Number);
    const yAxisRangeInput = document.getElementById('yAxisRange').value.split(',').map(Number);

    const xAxisRange = xAxisRangeInput.length === 2 && xAxisRangeInput.every(val => !isNaN(val)) ? xAxisRangeInput : null;
    const yAxisRange = yAxisRangeInput.length === 2 && yAxisRangeInput.every(val => !isNaN(val)) ? yAxisRangeInput : null;

    if (!newXAxisColumn || !newYAxisColumn) {
        alert('Please select both X and Y axes.');
        return;
    }

    // Update Data and Labels
    const labels = sharedDataset.rows.map(row => row[sharedDataset.headers.indexOf(newXAxisColumn)]);
    const data = sharedDataset.rows.map(row => parseFloat(row[sharedDataset.headers.indexOf(newYAxisColumn)]));

    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.data.datasets[0].label = newLabelText;
    chart.data.datasets[0].backgroundColor = newColor;
    chart.data.datasets[0].borderColor = newColor;

    // Update Axes Ranges
    if (xAxisRange) {
        chart.options.scales.x.min = xAxisRange[0];
        chart.options.scales.x.max = xAxisRange[1];
    }
    if (yAxisRange) {
        chart.options.scales.y.min = yAxisRange[0];
        chart.options.scales.y.max = yAxisRange[1];
    }

    chart.update();
});
}

function populateStatsSelectors() {
    const columnOptions = sharedDataset.headers
        .map(header => `<option value="${header}">${header}</option>`)
        .join('');
    const statsColumn = document.getElementById('statsColumn');
    statsColumn.setAttribute('multiple', 'multiple'); // Enable multiple selection
    statsColumn.setAttribute('size', '5'); // Adjust size for better visibility
    statsColumn.innerHTML = `<option value="">Select Column(s)</option>${columnOptions}`;
}




    function loadDataSection() {
        document.getElementById('menu-load-data').addEventListener('click', () => {
            document.getElementById('data-content').innerHTML = `
                <div class="table-container bg-dark rounded p-3">
                    <table class="table table-dark table-striped">
                        <thead id="tableHead"></thead>
                        <tbody id="tableBody"></tbody>
                    </table>
                </div>`;
            triggerFileDialogAndLoadData();
        });
    }
    
    function triggerFileDialogAndLoadData() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.csv';
        fileInput.style.display = 'none';
    
        document.body.appendChild(fileInput);
    
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const content = event.target.result.trim();
                    if (!content) {
                        alert('The file is empty. Please upload a valid dataset.');
                        document.body.removeChild(fileInput);
                        return;
                    }
    
                    const rows = content.split('\n');
                    const headers = rows[0].split(',');
    
                    // Store data globally
                    sharedDataset.headers = headers;
                    sharedDataset.rows = rows.slice(1).map(row => row.split(','));
    
                    // Populate Table Head
                    const tableHead = document.getElementById('tableHead');
                    tableHead.innerHTML = `<tr>${headers.map(header => `<th>${header.trim()}</th>`).join('')}</tr>`;
    
                    // Populate Table Body
                    const tableBody = document.getElementById('tableBody');
                    tableBody.innerHTML = sharedDataset.rows.map(row => {
                        return `<tr>${row.map(cell => `<td>${cell.trim()}</td>`).join('')}</tr>`;
                    }).join('');
    
                    alert('Data loaded successfully!');
                };
                reader.readAsText(file);
            } else {
                alert('No file selected. Please upload a valid dataset.');
            }
            document.body.removeChild(fileInput);
        });
    
        fileInput.click();
    }

    // Clean Data Section with Dropdown Submenu
    function cleanDataSection() {
        let existingSubmenu = document.getElementById('clean-data-submenu');
        if (existingSubmenu) {
            existingSubmenu.remove(); // Toggle off if already exists
            return;
        }
    
        const submenuHTML = `
            <ul class="nested-submenu" id="clean-data-submenu">
                <li class="nested-submenu-item" id="remove-missing">Remove Missing Values</li>
                <li class="nested-submenu-item" id="remove-duplicates">Remove Duplicate Rows</li>
                <li class="nested-submenu-item submenu-item" id="text-cleaning">
                    Text Cleaning
                    <ul class="nested-menu">
                        <li class="nested-submenu-item" id="trim-spaces">Trim Spaces</li>
                        <li class="nested-submenu-item" id="convert-lowercase">Convert to Lowercase</li>
                    </ul>
                </li>
                <li class="nested-submenu-item" id="remove-outliers">Remove Outliers</li>
                <li class="nested-submenu-item submenu-item" id="numeric-operations">
                    Numeric Operations
                    <ul class="nested-menu">
                        <li class="nested-submenu-item" id="normalize-data">Normalize Data</li>
                        <li class="nested-submenu-item" id="scale-data">Scale Data</li>
                    </ul>
                </li>
                <li class="nested-submenu-item" id="filter-rows">Filter Rows</li>
            </ul>
        `;
    
        const cleanDataMenu = document.getElementById('menu-clean-data');
        cleanDataMenu.insertAdjacentHTML('afterend', submenuHTML);
    
        attachSubmenuEventListeners();
    }
    
    function attachSubmenuEventListeners() {
        // Remove Missing Values
        document.getElementById('remove-missing').addEventListener('click', () => {
            const beforeCount = sharedDataset.rows.length;
            sharedDataset.rows = sharedDataset.rows.filter(row => !row.includes(''));
            const afterCount = sharedDataset.rows.length;
            alert(`Removed ${beforeCount - afterCount} rows with missing values.`);
        });
    
        // Remove Duplicate Rows
        document.getElementById('remove-duplicates').addEventListener('click', () => {
            const beforeCount = sharedDataset.rows.length;
            const uniqueRows = new Set(sharedDataset.rows.map(row => JSON.stringify(row)));
            sharedDataset.rows = Array.from(uniqueRows).map(row => JSON.parse(row));
            const afterCount = sharedDataset.rows.length;
            alert(`Removed ${beforeCount - afterCount} duplicate rows.`);
        });
    
        // Text Cleaning: Trim Spaces
        document.getElementById('trim-spaces').addEventListener('click', () => {
            sharedDataset.rows = sharedDataset.rows.map(row => row.map(cell => cell.trim()));
            alert("Trimmed leading and trailing spaces from all text cells.");
        });
    
        // Text Cleaning: Convert to Lowercase
        document.getElementById('convert-lowercase').addEventListener('click', () => {
            sharedDataset.rows = sharedDataset.rows.map(row => row.map(cell => typeof cell === 'string' ? cell.toLowerCase() : cell));
            alert("Converted all text to lowercase.");
        });
    
        // Remove Outliers
        document.getElementById('remove-outliers').addEventListener('click', () => {
            const columnName = prompt('Enter the column name to remove outliers:');
            if (!columnName || !sharedDataset.headers.includes(columnName)) {
                alert('Invalid column name.');
                return;
            }
            const columnIndex = sharedDataset.headers.indexOf(columnName);
            const values = sharedDataset.rows.map(row => parseFloat(row[columnIndex])).filter(val => !isNaN(val));
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
            sharedDataset.rows = sharedDataset.rows.filter(row => {
                const value = parseFloat(row[columnIndex]);
                return !isNaN(value) && Math.abs(value - mean) <= 2 * stdDev;
            });
            alert(`Outliers removed from column "${columnName}".`);
        });
    
        // Numeric Operations: Normalize Data
        document.getElementById('normalize-data').addEventListener('click', () => {
            const columnName = prompt('Enter the column name to normalize:');
            if (!columnName || !sharedDataset.headers.includes(columnName)) {
                alert('Invalid column name.');
                return;
            }
            const columnIndex = sharedDataset.headers.indexOf(columnName);
            const values = sharedDataset.rows.map(row => parseFloat(row[columnIndex])).filter(val => !isNaN(val));
            const min = Math.min(...values);
            const max = Math.max(...values);
            sharedDataset.rows = sharedDataset.rows.map(row => {
                const value = parseFloat(row[columnIndex]);
                if (!isNaN(value)) {
                    row[columnIndex] = ((value - min) / (max - min)).toFixed(2);
                }
                return row;
            });
            alert(`Normalized column "${columnName}".`);
        });
    
        // Numeric Operations: Scale Data
        document.getElementById('scale-data').addEventListener('click', () => {
            const columnName = prompt('Enter the column name to scale:');
            if (!columnName || !sharedDataset.headers.includes(columnName)) {
                alert('Invalid column name.');
                return;
            }
            const columnIndex = sharedDataset.headers.indexOf(columnName);
            const values = sharedDataset.rows.map(row => parseFloat(row[columnIndex])).filter(val => !isNaN(val));
            const min = Math.min(...values);
            const max = Math.max(...values);
            sharedDataset.rows = sharedDataset.rows.map(row => {
                const value = parseFloat(row[columnIndex]);
                if (!isNaN(value)) {
                    row[columnIndex] = ((value - min) / (max - min)).toFixed(2);
                }
                return row;
            });
            alert(`Scaled column "${columnName}" to range [0, 1].`);
        });
    
        // Filter Rows
        document.getElementById('filter-rows').addEventListener('click', () => {
            const condition = prompt('Enter a condition to filter rows (e.g., age > 30):');
            if (!condition) {
                alert('Invalid filter condition.');
                return;
            }
            try {
                sharedDataset.rows = sharedDataset.rows.filter(row => {
                    return eval(condition.replace(/(\w+)/g, (_, key) => `row[sharedDataset.headers.indexOf("${key}")]`));
                });
                alert('Rows filtered successfully.');
            } catch (err) {
                alert('Invalid filter condition.');
            }
        });
    }
    
    
// Data Transformation Section
// Transform Data Section with Dropdown Submenu
function transformDataSection() {
    let existingSubmenu = document.getElementById('transform-data-submenu');
    if (existingSubmenu) {
        existingSubmenu.remove(); // Toggle off if already exists
        return;
    }

    const submenuHTML = `
        <ul class="nested-submenu" id="transform-data-submenu">
            <li class="nested-submenu-item" id="normalize-data">Normalize Data</li>
            <li class="nested-submenu-item" id="scale-data">Scale Data</li>
            <li class="nested-submenu-item" id="log-transform">Log Transformation</li>
        </ul>
    `;

    const transformDataMenu = document.getElementById('menu-transform-data');
    transformDataMenu.insertAdjacentHTML('afterend', submenuHTML);

    attachTransformSubmenuEventListeners();
}

// Attach Event Listeners for Transform Data Submenu
function attachTransformSubmenuEventListeners() {
    document.getElementById('normalize-data').addEventListener('click', normalizeData);
    document.getElementById('scale-data').addEventListener('click', scaleData);
    document.getElementById('log-transform').addEventListener('click', logTransformation);
}

// Normalize Data Function
function normalizeData() {
    const column = prompt('Enter the column name to normalize:');
    if (!sharedDataset.headers.includes(column)) {
        alert('Invalid column name.');
        return;
    }

    const columnIndex = sharedDataset.headers.indexOf(column);
    const values = sharedDataset.rows.map(row => parseFloat(row[columnIndex])).filter(val => !isNaN(val));

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

    sharedDataset.rows = sharedDataset.rows.map(row => {
        const value = parseFloat(row[columnIndex]);
        if (!isNaN(value)) {
            row[columnIndex] = ((value - mean) / stdDev).toFixed(2);
        }
        return row;
    });

    alert(`Normalized column: ${column}`);
}

// Scale Data Function
function scaleData() {
    const column = prompt('Enter the column name to scale:');
    if (!sharedDataset.headers.includes(column)) {
        alert('Invalid column name.');
        return;
    }

    const columnIndex = sharedDataset.headers.indexOf(column);
    const values = sharedDataset.rows.map(row => parseFloat(row[columnIndex])).filter(val => !isNaN(val));

    const min = Math.min(...values);
    const max = Math.max(...values);

    sharedDataset.rows = sharedDataset.rows.map(row => {
        const value = parseFloat(row[columnIndex]);
        if (!isNaN(value)) {
            row[columnIndex] = ((value - min) / (max - min)).toFixed(2);
        }
        return row;
    });

    alert(`Scaled column: ${column}`);
}

// Log Transformation Function
function logTransformation() {
    const column = prompt('Enter the column name to apply log transformation:');
    if (!sharedDataset.headers.includes(column)) {
        alert('Invalid column name.');
        return;
    }

    const columnIndex = sharedDataset.headers.indexOf(column);

    sharedDataset.rows = sharedDataset.rows.map(row => {
        const value = parseFloat(row[columnIndex]);
        if (!isNaN(value)) {
            row[columnIndex] = Math.log(value + 1).toFixed(2); // Log(x + 1) to handle zero values
        }
        return row;
    });

    alert(`Applied log transformation to column: ${column}`);
}





// Filter Data Section with Dropdown Submenu
function filterDataSection() {
    let existingSubmenu = document.getElementById('filter-data-submenu');
    if (existingSubmenu) {
        existingSubmenu.remove(); // Toggle off if already exists
        return;
    }

    const submenuHTML = `
        <ul class="nested-submenu" id="filter-data-submenu">
            <li class="nested-submenu-item" id="filter-condition">Filter by Condition</li>
            <li class="nested-submenu-item" id="filter-range">Filter by Range</li>
            <li class="nested-submenu-item" id="filter-top-n">Filter Top N Rows</li>
            <li class="nested-submenu-item" id="filter-column-null">Filter Rows with Null Column</li>
        </ul>
    `;

    const filterDataMenu = document.getElementById('menu-filter-data');
    filterDataMenu.insertAdjacentHTML('afterend', submenuHTML);

    attachFilterSubmenuEventListeners();
}

// Attach Event Listeners for Filter Data Submenu
function attachFilterSubmenuEventListeners() {
    document.getElementById('filter-condition').addEventListener('click', filterByCondition);
    document.getElementById('filter-range').addEventListener('click', filterByRange);
    document.getElementById('filter-top-n').addEventListener('click', filterTopNRows);
    document.getElementById('filter-column-null').addEventListener('click', filterRowsWithNullColumn);
}

// Filter by Condition Function
function filterByCondition() {
    const condition = prompt('Enter the condition (e.g., "age > 30"):');
    if (!condition) {
        alert('Invalid condition.');
        return;
    }

    try {
        sharedDataset.rows = sharedDataset.rows.filter(row => {
            return eval(condition.replace(/(\w+)/g, (_, key) => `row[sharedDataset.headers.indexOf("${key}")]`));
        });
        alert('Rows filtered successfully based on the condition.');
    } catch (err) {
        alert('Invalid condition syntax.');
    }
}

// Filter by Range Function
function filterByRange() {
    const column = prompt('Enter the column name to filter by range:');
    if (!sharedDataset.headers.includes(column)) {
        alert('Invalid column name.');
        return;
    }

    const minValue = parseFloat(prompt('Enter the minimum value:'));
    const maxValue = parseFloat(prompt('Enter the maximum value:'));

    if (isNaN(minValue) || isNaN(maxValue)) {
        alert('Invalid range values.');
        return;
    }

    const columnIndex = sharedDataset.headers.indexOf(column);
    sharedDataset.rows = sharedDataset.rows.filter(row => {
        const value = parseFloat(row[columnIndex]);
        return value >= minValue && value <= maxValue;
    });

    alert(`Rows filtered successfully for column "${column}" in range [${minValue}, ${maxValue}].`);
}

// Filter Top N Rows Function
function filterTopNRows() {
    const n = parseInt(prompt('Enter the number of top rows to keep (N):'), 10);
    if (isNaN(n) || n <= 0) {
        alert('Invalid value for N.');
        return;
    }

    sharedDataset.rows = sharedDataset.rows.slice(0, n);
    alert(`Top ${n} rows retained successfully.`);
}

// Filter Rows with Null Column Function
function filterRowsWithNullColumn() {
    const column = prompt('Enter the column name to check for null values:');
    if (!sharedDataset.headers.includes(column)) {
        alert('Invalid column name.');
        return;
    }

    const columnIndex = sharedDataset.headers.indexOf(column);
    sharedDataset.rows = sharedDataset.rows.filter(row => row[columnIndex] !== null && row[columnIndex] !== '');

    alert(`Rows with non-null values in column "${column}" retained successfully.`);
}


function implementStatisticsFunctionality() {
    // Add Menu Bar Dynamically
    const statsOptionsContainer = document.createElement('div');
    statsOptionsContainer.innerHTML = `
        <h5>Statistics Options:</h5>
        <label><input type="checkbox" id="optionMean" checked> Mean</label>
        <label><input type="checkbox" id="optionMedian" checked> Median</label>
        <label><input type="checkbox" id="optionVariance" checked> Variance</label>
        <label><input type="checkbox" id="optionStdDev" checked> Standard Deviation</label>
        <label><input type="checkbox" id="optionSkewness" checked> Skewness</label>
        <label><input type="checkbox" id="optionKurtosis" checked> Kurtosis</label>
        <label><input type="checkbox" id="optionOutliers" checked> Outliers</label>
        <label><input type="checkbox" id="optionANOVA" checked> ANOVA</label>
    `;
    document.getElementById('dynamicMenuContent').prepend(statsOptionsContainer);

    // Generate Summary Statistics
    document.getElementById('generateStats').addEventListener('click', () => {
        const statsColumn = document.getElementById('statsColumn');
        const selectedOptions = Array.from(statsColumn.selectedOptions).map(option => option.value);

        if (selectedOptions.length === 0) {
            alert('Please select at least one column.');
            return;
        }

        // Fetch selected statistics options
        const selectedStats = {
            mean: document.getElementById('optionMean').checked,
            median: document.getElementById('optionMedian').checked,
            variance: document.getElementById('optionVariance').checked,
            stdDev: document.getElementById('optionStdDev').checked,
            skewness: document.getElementById('optionSkewness').checked,
            kurtosis: document.getElementById('optionKurtosis').checked,
            outliers: document.getElementById('optionOutliers').checked,
            anova: document.getElementById('optionANOVA').checked
        };

        // Build table headers dynamically
        let tableHTML = `<table class="table table-dark table-striped">
                            <thead>
                                <tr>
                                    <th>Column</th>`;
        if (selectedStats.mean) tableHTML += '<th>Mean</th>';
        if (selectedStats.median) tableHTML += '<th>Median</th>';
        if (selectedStats.variance) tableHTML += '<th>Variance</th>';
        if (selectedStats.stdDev) tableHTML += '<th>Standard Deviation</th>';
        if (selectedStats.skewness) tableHTML += '<th>Skewness</th>';
        if (selectedStats.kurtosis) tableHTML += '<th>Kurtosis</th>';
        if (selectedStats.outliers) tableHTML += '<th>Outliers Detected</th>';
        if (selectedStats.anova) tableHTML += '<th>ANOVA p-value</th>';
        tableHTML += `</tr>
                            </thead>
                            <tbody>`;

        // Process each selected column
        selectedOptions.forEach(column => {
            const columnIndex = sharedDataset.headers.indexOf(column);

            if (columnIndex === -1) {
                tableHTML += `<tr>
                                <td>${column}</td>
                                <td colspan="${Object.keys(selectedStats).length}">Invalid column</td>
                              </tr>`;
                return;
            }

            const values = sharedDataset.rows.map(row => parseFloat(row[columnIndex])).filter(val => !isNaN(val));

            if (values.length === 0) {
                tableHTML += `<tr>
                                <td>${column}</td>
                                <td colspan="${Object.keys(selectedStats).length}">No numeric data</td>
                              </tr>`;
                return;
            }

            // Generate statistics based on selection
            let rowHTML = `<tr><td>${column}</td>`;
            if (selectedStats.mean) {
                const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
                rowHTML += `<td>${mean.toFixed(2)}</td>`;
            }
            if (selectedStats.median) {
                const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
                rowHTML += `<td>${median.toFixed(2)}</td>`;
            }
            if (selectedStats.variance) {
                const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
                const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
                rowHTML += `<td>${variance.toFixed(2)}</td>`;
            }
            if (selectedStats.stdDev) {
                const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
                const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
                const stdDev = Math.sqrt(variance);
                rowHTML += `<td>${stdDev.toFixed(2)}</td>`;
            }
            if (selectedStats.skewness) {
                const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
                const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
                const skewness = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) / values.length;
                rowHTML += `<td>${skewness.toFixed(2)}</td>`;
            }
            if (selectedStats.kurtosis) {
                const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
                const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
                const kurtosis = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) / values.length - 3;
                rowHTML += `<td>${kurtosis.toFixed(2)}</td>`;
            }
            if (selectedStats.outliers) {
                const sorted = [...values].sort((a, b) => a - b);
                const q1 = sorted[Math.floor(sorted.length / 4)];
                const q3 = sorted[Math.floor(sorted.length * 3 / 4)];
                const iqr = q3 - q1;
                const outliers = values.filter(val => val < q1 - 1.5 * iqr || val > q3 + 1.5 * iqr);
                rowHTML += `<td>${outliers.length}</td>`;
            }
            if (selectedStats.anova) {
                const quartileSize = Math.floor(values.length / 4);
                const groups = [
                    values.slice(0, quartileSize),
                    values.slice(quartileSize, quartileSize * 2),
                    values.slice(quartileSize * 2, quartileSize * 3),
                    values.slice(quartileSize * 3)
                ];
                const overallMean = values.reduce((sum, val) => sum + val, 0) / values.length;
                const betweenGroupSS = groups.reduce((sum, group) => {
                    const groupMean = group.reduce((sum, val) => sum + val, 0) / group.length;
                    return sum + group.length * Math.pow(groupMean - overallMean, 2);
                }, 0);
                const withinGroupSS = groups.reduce((sum, group) => {
                    const groupMean = group.reduce((sum, val) => sum + val, 0) / group.length;
                    return sum + group.reduce((sum, val) => sum + Math.pow(val - groupMean, 2), 0);
                }, 0);
                const dfBetween = groups.length - 1;
                const dfWithin = values.length - groups.length;
                const msBetween = betweenGroupSS / dfBetween;
                const msWithin = withinGroupSS / dfWithin;
                const fStatistic = msBetween / msWithin;
                const pValue = 1 - jStat.centralF.cdf(fStatistic, dfBetween, dfWithin); // Requires jStat library
                rowHTML += `<td>${pValue.toFixed(5)}</td>`;
            }
            rowHTML += `</tr>`;
            tableHTML += rowHTML;
        });

        tableHTML += '</tbody></table>';
        document.getElementById('statsResult').innerHTML = tableHTML;
    });
}



document.getElementById('toolbar-correlations').addEventListener('click', () => {
    const dynamicContent = document.getElementById('dynamicMenuContent');
    dynamicContent.innerHTML = `
        <section style="background: linear-gradient(115deg, #6dcfe7, #1e1e1e);">
            <div class="container py-4">
                <h4 class="text-light">Correlation Section</h4>
                <div class="row">
                    <div class="col-md-6 bg-dark text-light p-3 rounded shadow-sm">
                        <h5>Correlation Analysis</h5>
                        <label for="correlationColumn1">Select Column 1:</label>
                        <select id="correlationColumn1" class="form-control mb-3"></select>
                        <label for="correlationColumn2">Select Column 2:</label>
                        <select id="correlationColumn2" class="form-control mb-3"></select>
                        <button class="btn btn-primary mb-3" id="calculateCorrelation">Calculate Correlation</button>
                        <div id="correlationResult" class="text-light"></div>
                    </div>
                </div>
            </div>
        </section>
    `;

    populateCorrelationSelectors();
    implementCorrelationFunctionality();
});

// Populate column selectors for correlation
function populateCorrelationSelectors() {
    const columnOptions = sharedDataset.headers.map(header => `<option value="${header}">${header}</option>`).join('');
    document.getElementById('correlationColumn1').innerHTML = `<option value="">Select Column</option>${columnOptions}`;
    document.getElementById('correlationColumn2').innerHTML = `<option value="">Select Column</option>${columnOptions}`;
}

function implementCorrelationFunctionality() {
    document.getElementById('calculateCorrelation').addEventListener('click', () => {
        const column1 = document.getElementById('correlationColumn1').value;
        const column2 = document.getElementById('correlationColumn2').value;

        // Debugging
        console.log(`Column 1: ${column1}, Column 2: ${column2}`);

        if (!column1 || !column2) {
            alert('Please select both columns.');
            return;
        }

        const columnIndex1 = sharedDataset.headers.indexOf(column1);
        const columnIndex2 = sharedDataset.headers.indexOf(column2);

        if (columnIndex1 === -1 || columnIndex2 === -1) {
            alert('Selected columns are not valid.');
            return;
        }

        const values1 = sharedDataset.rows.map(row => parseFloat(row[columnIndex1])).filter(val => !isNaN(val));
        const values2 = sharedDataset.rows.map(row => parseFloat(row[columnIndex2])).filter(val => !isNaN(val));

        if (values1.length !== values2.length || values1.length === 0) {
            alert('Mismatch in column data lengths or invalid data.');
            return;
        }

        const mean1 = values1.reduce((sum, val) => sum + val, 0) / values1.length;
        const mean2 = values2.reduce((sum, val) => sum + val, 0) / values2.length;

        const numerator = values1.reduce((sum, val, i) => sum + (val - mean1) * (values2[i] - mean2), 0);
        const denominator = Math.sqrt(
            values1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) *
            values2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0)
        );

        const correlation = numerator / denominator;

        document.getElementById('correlationResult').innerHTML = `<p>Correlation: ${correlation.toFixed(2)}</p>`;
    });
}




});

function toggleDetails(card) {
    console.log('Card clicked:', card); // Debugging: Check if card is correct
    const details = card.querySelector('.skill-details');
    if (!details) {
        console.error('No element with class .skill-details found inside the card:', card);
        return;
    }
    details.classList.toggle('show');
    console.log('Toggled details visibility:', details); // Debugging: Confirm toggling
}

const OPENAI_API_KEY = "YOUR_OPENAI_API_KEY";

document.addEventListener('DOMContentLoaded', () => {
    // Prevent duplicate chatbot UI
    if (document.getElementById("chatbot")) return;

    // Create Chatbot UI
    const chatbotHTML = `
        <div id="chatbot" class="chatbot-container">
            <div class="chatbot-header">
                <h4>AI Data Assistant</h4>
                <button id="chatbot-close">✖</button>
            </div>
            <div id="chatbot-messages" class="chatbot-messages"></div>
            <div class="chatbot-input-container">
                <input type="text" id="chatbot-input" placeholder="Ask about your data...">
                <button id="chatbot-send">Send</button>
                <button id="interpret-data" class="interpret-btn">Interpret Data</button>
            </div>
        </div>`;

    document.body.insertAdjacentHTML("beforeend", chatbotHTML);

    // Chatbot Styles
    const chatbotStyles = document.createElement("style");
    chatbotStyles.innerHTML = `
        .chatbot-container { 
            position: fixed; bottom: 20px; right: 20px; width: 350px; 
            background: white; border-radius: 10px; overflow: hidden; 
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.99); 
            display: flex; flex-direction: column; z-index: 1000;
        }
        .chatbot-header { 
            background:rgb(0, 119, 255); color: white; padding: 12px; 
            display: flex; justify-content: space-between; align-items: center;
        }
        .chatbot-header h4 { margin: 0; font-size: 16px; }
        .chatbot-header button { background: none; border: none; color: white; cursor: pointer; font-size: 16px; }
        .chatbot-messages { 
            height: 300px; overflow-y: auto; padding: 12px; 
            background:rgb(1, 5, 8); font-size: 14px;
        }
        .chatbot-input-container { 
            display: flex; padding: 8px; background: #fff; 
            border-top: 1px solid #ddd;
        }
        #chatbot-input { flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 5px; }
        #chatbot-send, .interpret-btn { 
            padding: 8px 10px; border: none; background:rgb(0, 119, 255); 
            color: white; cursor: pointer; margin-left: 5px; border-radius: 5px;
        }
    `;
    document.head.appendChild(chatbotStyles);

    // Close Chatbot
    document.getElementById("chatbot-close").addEventListener("click", () => {
        document.getElementById("chatbot").style.display = "none";
    });

    // Chatbot Elements
    const chatbotInput = document.getElementById("chatbot-input");
    const chatbotMessages = document.getElementById("chatbot-messages");
    const chatbotSend = document.getElementById("chatbot-send");
    const interpretButton = document.getElementById("interpret-data");

    // Function to Add Messages
    function addChatMessage(sender, message) {
        chatbotMessages.innerHTML += `<div style='text-align: ${sender === "AI" ? "left" : "right"}; margin-bottom: 5px;'>
            <strong>${sender}:</strong> ${message}
        </div>`;
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    // OpenAI API Call
    async function fetchChatGPTResponse(query) {
        console.log("Sending Query to OpenAI:", query);  // Debugging Output
    
        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: "You are a data analytics AI assistant. Provide statistical insights." },
                        { role: "user", content: query }
                    ],
                    max_tokens: 500
                })
            });
    
            if (!response.ok) {
                const errorText = await response.text();
                console.error("OpenAI API Error:", errorText);
                throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
            }
    
            const result = await response.json();
            console.log("OpenAI Response:", result);
            return result.choices[0].message.content.trim();
        } catch (error) {
            console.error("Error fetching OpenAI response:", error);
            return `OpenAI API Error: ${error.message}`;
        }
    }
    

    // Send User Message
    chatbotSend.addEventListener("click", async () => {
        const userMessage = chatbotInput.value.trim();
        if (!userMessage) return;

        addChatMessage("You", userMessage);
        chatbotInput.value = "";

        const botResponse = await fetchChatGPTResponse(userMessage);
        addChatMessage("AI", botResponse);
    });

    // Enable Enter Key to Send Message
    chatbotInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            chatbotSend.click();
        }
    });

    // Interpret Data Button Click
    interpretButton.addEventListener("click", async () => {
        const activeTabData = extractActiveTabData();
        if (!activeTabData) {
            addChatMessage("AI", "No data found in the active tab. Please generate or load data first.");
            return;
        }

        addChatMessage("You", "Interpret the data from the active tab.");
        const botResponse = await fetchChatGPTResponse(activeTabData);
        addChatMessage("AI", botResponse);
    });

    // Extract Data from Active Tab
    function extractActiveTabData() {
        const dynamicContent = document.getElementById('dynamicMenuContent');
        if (!dynamicContent) return null;

        const tabText = dynamicContent.innerText.trim();

        if (tabText.includes("Summary Statistics")) {
            return extractSummaryStatistics();
        } else if (tabText.includes("Correlation")) {
            return extractCorrelationData();
        } else if (tabText.includes("Prediction Models")) {
            return extractPredictionDetails();
        } else if (tabText.includes("Data Transformations")) {
            return extractTransformationDetails();
        } else {
            return null;
        }
    }

    function extractSummaryStatistics() {
        const table = document.querySelector("#statsResult table");
        if (!table) return null;

        let summaryText = "Summary Statistics:\n";
        const rows = table.querySelectorAll("tbody tr");

        rows.forEach(row => {
            const cells = row.querySelectorAll("td");
            if (cells.length < 2) return;

            let rowText = `${cells[0].textContent.trim()}: `;
            for (let i = 1; i < cells.length; i++) {
                rowText += `${table.querySelector("thead").rows[0].cells[i].textContent.trim()} - ${cells[i].textContent.trim()}, `;
            }
            summaryText += rowText + "\n";
        });

        return summaryText;
    }
});

