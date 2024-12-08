document.addEventListener('DOMContentLoaded', () => {
    const dynamicContent = document.getElementById('dynamicMenuContent');
    let sharedDataset = { headers: [], rows: [] };

    // Toolbar Section Handlers
    const toolbarHandlers = {
        'toolbar-predictions': `
            <section style="background: linear-gradient(115deg, #6dcfe7, #1e1e1e);">
                <div class="container py-4">
                    <h4 class="text-light">Predictions Section</h4>
                    <p class="text-light">Choose a prediction algorithm:</p>
                    <button id="linearRegression" class="btn btn-primary mb-2">Linear Regression</button>
                    <button id="logisticRegression" class="btn btn-primary mb-2">Logistic Regression</button>
                    <button id="decisionTree" class="btn btn-primary mb-2">Decision Tree</button>
                    <button id="kMeansClustering" class="btn btn-primary mb-2">K-Means Clustering</button>
                    <button id="pca" class="btn btn-primary mb-2">Principal Component Analysis (PCA)</button>
                    <div id="mlOutput" class="text-light mt-3"></div>
                </div>
            </section>`,
        'toolbar-correlations': `
            <section style="background: linear-gradient(115deg, #6dcfe7, #1e1e1e);">
                <div class="container py-4">
                    <h4 class="text-light">Correlations Section</h4>
                    <p class="text-light">Feature under development. You can add advanced correlation analyses here.</p>
                </div>
            </section>`,
        'toolbar-transformations': `
            <section style="background: linear-gradient(115deg, #6dcfe7, #1e1e1e);">
                <div class="container py-4">
                    <h4 class="text-light">Data Transformations Section</h4>
                    <p class="text-light">Feature under development. Add advanced data transformation logic here.</p>
                </div>
            </section>`
    };

     // Add Event Listeners for Static Toolbar Buttons
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

    // Implement Prediction Functionality
    function implementPredictionFunctionality() {
        document.getElementById('linearRegression').addEventListener('click', () => {
            if (!validateDataset()) return;
            performLinearRegression();
        });

        document.getElementById('logisticRegression').addEventListener('click', () => {
            if (!validateDataset()) return;
            performLogisticRegression();
        });

        document.getElementById('decisionTree').addEventListener('click', () => {
            if (!validateDataset()) return;
            performDecisionTree();
        });

        document.getElementById('kMeansClustering').addEventListener('click', () => {
            if (!validateDataset()) return;
            performKMeansClustering();
        });

        document.getElementById('pca').addEventListener('click', () => {
            if (!validateDataset()) return;
            performPCA();
        });
    }

    // Helper: Validate Dataset
    function validateDataset() {
        if (!sharedDataset.headers.length || !sharedDataset.rows.length) {
            alert('No data available. Please upload a valid dataset.');
            return false;
        }
        return true;
    }

    // Machine Learning Functions
    function performLinearRegression() {
        const output = document.getElementById('mlOutput');
        output.innerHTML = '<p>Performing Linear Regression...</p>';
        // Mock implementation for demonstration
        output.innerHTML += '<p>Linear Regression completed successfully!</p>';
    }

    function performLogisticRegression() {
        const output = document.getElementById('mlOutput');
        output.innerHTML = '<p>Performing Logistic Regression...</p>';
        // Mock implementation for demonstration
        output.innerHTML += '<p>Logistic Regression completed successfully!</p>';
    }

    function performDecisionTree() {
        const output = document.getElementById('mlOutput');
        output.innerHTML = '<p>Performing Decision Tree...</p>';
        // Mock implementation for demonstration
        output.innerHTML += '<p>Decision Tree completed successfully!</p>';
    }

    function performKMeansClustering() {
        const output = document.getElementById('mlOutput');
        output.innerHTML = '<p>Performing K-Means Clustering...</p>';
        // Mock implementation for demonstration
        output.innerHTML += '<p>K-Means Clustering completed successfully!</p>';
    }

    function performPCA() {
        const output = document.getElementById('mlOutput');
        output.innerHTML = '<p>Performing Principal Component Analysis (PCA)...</p>';
        // Mock implementation for demonstration
        output.innerHTML += '<p>PCA completed successfully!</p>';
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
                            <div class="col-md-4 bg-dark text-light p-3 rounded shadow-sm">
                                <h5>Summary Statistics</h5>
                                <select id="statsColumn" class="form-control mb-3"></select>
                                <button class="btn btn-primary mb-3" id="generateStats">Generate Statistics</button>
                                <div id="statsResult" class="text-light"></div>
                            </div>
                            <div class="col-md-4 bg-dark text-light p-3 rounded shadow-sm">
                                <h5>Correlation</h5>
                                <label>Select Column 1:</label>
                                <select id="correlationColumn1" class="form-control mb-3"></select>
                                <label>Select Column 2:</label>
                                <select id="correlationColumn2" class="form-control mb-3"></select>
                                <button class="btn btn-primary mb-3" id="calculateCorrelation">Calculate Correlation</button>
                                <div id="correlationResult" class="text-light"></div>
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
        const columnOptions = sharedDataset.headers.map(header => `<option value="${header}">${header}</option>`).join('');
        document.getElementById('statsColumn').innerHTML = `<option value="">Select Column</option>${columnOptions}`;
        document.getElementById('correlationColumn1').innerHTML = columnOptions;
        document.getElementById('correlationColumn2').innerHTML = columnOptions;
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



 // Implement Statistics Functionality
 function implementStatisticsFunctionality() {
    // Generate Summary Statistics
    document.getElementById('generateStats').addEventListener('click', () => {
        const column = document.getElementById('statsColumn').value;
        if (!column) {
            alert('Please select a column.');
            return;
        }

        const columnIndex = sharedDataset.headers.indexOf(column);
        const values = sharedDataset.rows.map(row => parseFloat(row[columnIndex])).filter(val => !isNaN(val));

        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        document.getElementById('statsResult').innerHTML = `
            <p>Mean: ${mean.toFixed(2)}</p>
            <p>Median: ${median.toFixed(2)}</p>
            <p>Variance: ${variance.toFixed(2)}</p>
            <p>Standard Deviation: ${stdDev.toFixed(2)}</p>
        `;
    });

    // Calculate Correlation
    document.getElementById('calculateCorrelation').addEventListener('click', () => {
        const column1 = document.getElementById('correlationColumn1').value;
        const column2 = document.getElementById('correlationColumn2').value;

        if (!column1 || !column2) {
            alert('Please select both columns.');
            return;
        }

        const columnIndex1 = sharedDataset.headers.indexOf(column1);
        const columnIndex2 = sharedDataset.headers.indexOf(column2);

        const values1 = sharedDataset.rows.map(row => parseFloat(row[columnIndex1])).filter(val => !isNaN(val));
        const values2 = sharedDataset.rows.map(row => parseFloat(row[columnIndex2])).filter(val => !isNaN(val));

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

// Placeholder for additional functionality (e.g., Data, Correlations, etc.)
});
