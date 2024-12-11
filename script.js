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
    };

    Object.keys(toolbarHandlers).forEach(id => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', () => {
                dynamicContent.innerHTML = toolbarHandlers[id];
                if (id === 'toolbar-predictions') {
                    implementPredictionFunctionality();
                }
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

    function handleModelClick(modelName, modelFunction) {
        const modelContent = document.getElementById('model-content');
        modelContent.innerHTML = `
            <h4>${modelName} Model</h4>
            <p>Performing ${modelName}...</p>
            <div id="mlOutput" class="text-dark mt-3"></div>`;
        modelFunction();
    }

    // Helper: Parse Dataset Columns
    function getColumnData(columnName) {
        const columnIndex = sharedDataset.headers.indexOf(columnName);
        return sharedDataset.rows.map(row => parseFloat(row[columnIndex])).filter(val => !isNaN(val));
    }

    // Model Functions
    function performLinearRegression() {
        const output = document.getElementById('mlOutput');
        const x = getColumnData(prompt('Enter the column name for the independent variable (X):'));
        const y = getColumnData(prompt('Enter the column name for the dependent variable (Y):'));
        if (x.length !== y.length || x.length === 0) {
            output.innerHTML += '<p>Invalid data for Linear Regression.</p>';
            return;
        }
        const n = x.length, meanX = x.reduce((a, b) => a + b, 0) / n, meanY = y.reduce((a, b) => a + b, 0) / n;
        const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
        const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);
        const slope = numerator / denominator, intercept = meanY - slope * meanX;
        output.innerHTML += `<p>Slope: ${slope.toFixed(2)}, Intercept: ${intercept.toFixed(2)}</p>`;
    }

    function performLogisticRegression() {
        const output = document.getElementById('mlOutput');
        const x = getColumnData(prompt('Enter the column name for the independent variable (X):'));
        const y = getColumnData(prompt('Enter the column name for the dependent variable (Y):'));
        if (x.length !== y.length || x.length === 0) {
            output.innerHTML += '<p>Invalid data for Logistic Regression.</p>';
            return;
        }
        const sigmoid = z => 1 / (1 + Math.exp(-z));
        const weights = Array(x.length).fill(0.5);
        const predictions = x.map((xi, i) => sigmoid(weights[i] * xi));
        output.innerHTML += `<p>Predictions: [${predictions.map(p => p.toFixed(2)).join(', ')}]</p>`;
    }

    function performDecisionTree() {
        const output = document.getElementById('mlOutput');
        output.innerHTML = '<p>Decision Tree implementation requires external libraries.</p>';
    }

    function performRandomForest() {
        const output = document.getElementById('mlOutput');
        output.innerHTML = '<p>Random Forest implementation requires external libraries.</p>';
    }

    function performSVM() {
        const output = document.getElementById('mlOutput');
        output.innerHTML = '<p>SVM implementation requires external libraries.</p>';
    }

    function performKMeansClustering() {
        const output = document.getElementById('mlOutput');
        const k = parseInt(prompt('Enter number of clusters (K):'), 10);
        const columnName = prompt('Enter column for clustering:');
        const data = getColumnData(columnName);
        if (!k || data.length < k) {
            output.innerHTML += '<p>Invalid data or insufficient rows for clustering.</p>';
            return;
        }
        const centroids = data.slice(0, k), assignments = Array(data.length).fill(0);
        for (let iteration = 0; iteration < 10; iteration++) {
            data.forEach((val, i) => assignments[i] = centroids.map(c => Math.abs(val - c)).indexOf(Math.min(...centroids.map(c => Math.abs(val - c)))));
            centroids.forEach((_, cluster) => centroids[cluster] = data.filter((_, i) => assignments[i] === cluster).reduce((a, b) => a + b, 0) / data.filter((_, i) => assignments[i] === cluster).length || centroids[cluster]);
        }
        output.innerHTML += `<p>Clusters: [${assignments.join(', ')}]</p>`;
    }

    function performPCA() {
        const output = document.getElementById('mlOutput');
        output.innerHTML = '<p>PCA implementation requires external libraries.</p>';
    }

    function performHierarchicalClustering() {
        const output = document.getElementById('mlOutput');
        output.innerHTML = '<p>Hierarchical Clustering implementation requires external libraries.</p>';
    }

    function performDBSCAN() {
        const output = document.getElementById('mlOutput');
        output.innerHTML = '<p>DBSCAN implementation requires external libraries.</p>';
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
                    <div class="container py-4 d-flex">
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
                            <canvas id="chartCanvas" class="bg-white p-3 rounded shadow"></canvas>
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
                        <li class="list-group-item menu-item" id="menu-transform-data">Transform Data</li>
                        <li class="list-group-item menu-item" id="menu-filter-data">Filter Data</li>
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
        document.getElementById('menu-transform-data').addEventListener('click', transformDataSection);
        document.getElementById('menu-filter-data').addEventListener('click', filterDataSection);
    }

    function populateColumnSelectors() {
        const xAxisSelect = document.getElementById('xAxisColumn');
        const yAxisSelect = document.getElementById('yAxisColumn');
        xAxisSelect.innerHTML = sharedDataset.headers.map(header => `<option value="${header}">${header}</option>`).join('');
        yAxisSelect.innerHTML = sharedDataset.headers.map(header => `<option value="${header}">${header}</option>`).join('');
    }


// Implement Enhanced Plot Functionality
function implementPlotFunctionality() {
    let chart;

    document.getElementById('generateChart').addEventListener('click', () => {
        const xAxisColumn = document.getElementById('xAxisColumn').value;
        const yAxisColumn = document.getElementById('yAxisColumn').value;
        const chartType = document.getElementById('chartType').value;
        const chartLabel = document.getElementById('chartLabel').value || `${yAxisColumn} vs ${xAxisColumn}`;
        const chartColor = document.getElementById('chartColor').value || '#4b9cdf';
        const showLegend = document.getElementById('showLegend').value === 'true';
        const xAxisRange = document.getElementById('xAxisRange').value.split(',').map(Number);
        const yAxisRange = document.getElementById('yAxisRange').value.split(',').map(Number);

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

        const chartCanvas = document.getElementById('chartCanvas').getContext('2d');

        if (chart) {
            chart.destroy();
        }

        chart = new Chart(chartCanvas, {
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
                        },
                        ...(xAxisRange.length === 2 && {
                            min: xAxisRange[0],
                            max: xAxisRange[1]
                        })
                    },
                    y: {
                        title: {
                            display: true,
                            text: yAxisColumn
                        },
                        ...(yAxisRange.length === 2 && {
                            min: yAxisRange[0],
                            max: yAxisRange[1]
                        })
                    }
                }
            }
        });
    });


    // Update Chart Axes or Settings
    document.getElementById('updateChart').addEventListener('click', () => {
        if (!chart) {
            alert('No chart is currently generated. Please generate a chart first.');
            return;
        }

        const newXAxisColumn = document.getElementById('xAxisColumn').value;
        const newYAxisColumn = document.getElementById('yAxisColumn').value;
        const newLabelText = document.getElementById('chartLabel').value || `${newYAxisColumn} vs ${newXAxisColumn}`;
        const newColor = document.getElementById('chartColor').value || 'rgba(75, 192, 192, 0.2)';

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

        // Update Chart
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
    // Generate Summary Statistics
    document.getElementById('generateStats').addEventListener('click', () => {
        const statsColumn = document.getElementById('statsColumn');
        const selectedOptions = Array.from(statsColumn.selectedOptions).map(option => option.value);

        if (selectedOptions.length === 0) {
            alert('Please select at least one column.');
            return;
        }

        // Prepare the table for statistics
        let tableHTML = `<table class="table table-dark table-striped">
                            <thead>
                                <tr>
                                    <th>Column</th>
                                    <th>Mean</th>
                                    <th>Median</th>
                                    <th>Variance</th>
                                    <th>Standard Deviation</th>
                                </tr>
                            </thead>
                            <tbody>`;

        selectedOptions.forEach(column => {
            const columnIndex = sharedDataset.headers.indexOf(column);

            if (columnIndex === -1) {
                tableHTML += `<tr>
                                <td>${column}</td>
                                <td colspan="4">Invalid column</td>
                              </tr>`;
                return;
            }

            const values = sharedDataset.rows.map(row => parseFloat(row[columnIndex])).filter(val => !isNaN(val));

            if (values.length === 0) {
                tableHTML += `<tr>
                                <td>${column}</td>
                                <td colspan="4">No numeric data</td>
                              </tr>`;
                return;
            }

            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
            const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);

            tableHTML += `<tr>
                            <td>${column}</td>
                            <td>${mean.toFixed(2)}</td>
                            <td>${median.toFixed(2)}</td>
                            <td>${variance.toFixed(2)}</td>
                            <td>${stdDev.toFixed(2)}</td>
                          </tr>`;
        });

        tableHTML += '</tbody></table>';

        // Update the results section
        document.getElementById('statsResult').innerHTML = tableHTML;
    });

    // Generate Frequency Distribution
    document.getElementById('generateFrequency').addEventListener('click', () => {
        const frequencyColumn = document.getElementById('frequencyColumn');
        const column = frequencyColumn.value;

        if (!column) {
            alert('Please select a column.');
            return;
        }

        const columnIndex = sharedDataset.headers.indexOf(column);
        if (columnIndex === -1) {
            alert(`Invalid column: ${column}`);
            return;
        }

        const values = sharedDataset.rows.map(row => row[columnIndex]);

        const frequency = values.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {});

        const frequencyHTML = Object.entries(frequency)
            .map(([key, count]) => `<p>${key}: ${count}</p>`)
            .join('');

        document.getElementById('frequencyResult').innerHTML = frequencyHTML;
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


