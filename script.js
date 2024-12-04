document.addEventListener('DOMContentLoaded', () => {
    // Global Variables
    let sharedDataset = { headers: [], rows: [] };

    // Define static layout for the Data section with persistent menu
    const dynamicContent = document.getElementById('dynamicMenuContent');
    const dataSectionContent = `
        <div class="row">
            <!-- Static Sidebar Menu -->
            <div class="col-md-3 bg-dark p-3 rounded shadow-sm menu-section">
                <h4 class="text-light">Menu</h4>
                <ul class="list-group">
                    <li class="list-group-item menu-item" id="menu-load-data">Load Data</li>
                    <li class="list-group-item menu-item" id="menu-clean-data">Clean Data</li>
                    <li class="list-group-item menu-item" id="menu-transform-data">Transform Data</li>
                    <li class="list-group-item menu-item" id="menu-filter-data">Filter Data</li>
                </ul>
            </div>
            <!-- Dynamic Content Area -->
            <div class="col-md-9 bg-light p-3 rounded shadow-sm" id="data-content">
                <h4 class="text-center">Select a menu item to see options</h4>
            </div>
        </div>
    `;

    // Toolbar Button for Data Section
    document.getElementById('toolbar-data').addEventListener('click', () => {
        dynamicContent.innerHTML = dataSectionContent;

        // Add event listeners for Data Menu actions
        document.getElementById('menu-load-data').addEventListener('click', loadDataSection);
        document.getElementById('menu-clean-data').addEventListener('click', cleanDataSection);
        document.getElementById('menu-transform-data').addEventListener('click', transformDataSection);
        document.getElementById('menu-filter-data').addEventListener('click', filterDataSection);
    });

    // Load Data Section
    function loadDataSection() {
        const contentArea = document.getElementById('data-content');
        contentArea.innerHTML = `
            <h4 class="text-dark">Load Data</h4>
            <p class="text-dark">Upload your dataset to view it in a professional data table.</p>
            <input type="file" id="dataFileInput" class="form-control mb-3" accept=".csv">
            <div class="table-container bg-dark rounded p-3">
                <table class="table table-dark table-striped">
                    <thead id="tableHead"></thead>
                    <tbody id="tableBody"></tbody>
                </table>
            </div>
        `;
        implementDataLoadingFunctionality();
    }

    // Implement Data Loading Functionality
    function implementDataLoadingFunctionality() {
        const fileInput = document.getElementById('dataFileInput');
        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const content = event.target.result.trim();
                    if (!content) {
                        alert('The file is empty. Please upload a valid dataset.');
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

                    console.log('Data loaded and table populated.');
                };
                reader.readAsText(file);
            } else {
                alert('No file selected. Please upload a valid dataset.');
            }
        });
    }

    // Data Cleaning Section
    function cleanDataSection() {
        const contentArea = document.getElementById('data-content');
        contentArea.innerHTML = `
            <h4 class="text-dark">Data Cleaning</h4>
            <button class="btn btn-primary mb-3" id="clean-missing">Remove Missing Values</button>
            <button class="btn btn-primary mb-3" id="clean-duplicates">Remove Duplicate Rows</button>
            <button class="btn btn-primary mb-3" id="trim-spaces">Trim Spaces from Text</button>
        `;

        document.getElementById('clean-missing').addEventListener('click', () => {
            const beforeCount = sharedDataset.rows.length;
            sharedDataset.rows = sharedDataset.rows.filter(row => !row.includes(''));
            const afterCount = sharedDataset.rows.length;
            alert(`Removed ${beforeCount - afterCount} rows with missing values.`);
        });

        document.getElementById('clean-duplicates').addEventListener('click', () => {
            const beforeCount = sharedDataset.rows.length;
            const uniqueRows = new Set(sharedDataset.rows.map(row => JSON.stringify(row)));
            sharedDataset.rows = Array.from(uniqueRows).map(row => JSON.parse(row));
            const afterCount = sharedDataset.rows.length;
            alert(`Removed ${beforeCount - afterCount} duplicate rows.`);
        });

        document.getElementById('trim-spaces').addEventListener('click', () => {
            sharedDataset.rows = sharedDataset.rows.map(row => row.map(cell => cell.trim()));
            alert("Trimmed leading and trailing spaces from all text cells.");
        });
    }

    // Data Transformation Section
    function transformDataSection() {
        const contentArea = document.getElementById('data-content');
        contentArea.innerHTML = `
            <h4 class="text-dark">Data Transformation</h4>
            <select id="transform-column" class="form-control mb-3"></select>
            <button class="btn btn-primary mb-3" id="normalize-data">Normalize</button>
            <button class="btn btn-primary mb-3" id="scale-data">Scale (Min-Max)</button>
            <button class="btn btn-primary mb-3" id="log-transform">Log Transformation</button>
        `;

        const columnSelector = document.getElementById('transform-column');
        columnSelector.innerHTML = sharedDataset.headers.map(header => `<option value="${header}">${header}</option>`).join('');

        document.getElementById('normalize-data').addEventListener('click', () => {
            const column = columnSelector.value;
            const columnIndex = sharedDataset.headers.indexOf(column);
            const values = sharedDataset.rows.map(row => parseFloat(row[columnIndex]));
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

            sharedDataset.rows = sharedDataset.rows.map(row => {
                row[columnIndex] = ((parseFloat(row[columnIndex]) - mean) / stdDev).toFixed(2);
                return row;
            });
            alert(`Normalized column: ${column}`);
        });

        document.getElementById('scale-data').addEventListener('click', () => {
            const column = columnSelector.value;
            const columnIndex = sharedDataset.headers.indexOf(column);
            const values = sharedDataset.rows.map(row => parseFloat(row[columnIndex]));
            const min = Math.min(...values);
            const max = Math.max(...values);

            sharedDataset.rows = sharedDataset.rows.map(row => {
                row[columnIndex] = ((parseFloat(row[columnIndex]) - min) / (max - min)).toFixed(2);
                return row;
            });
            alert(`Scaled column: ${column}`);
        });

        document.getElementById('log-transform').addEventListener('click', () => {
            const column = columnSelector.value;
            const columnIndex = sharedDataset.headers.indexOf(column);

            sharedDataset.rows = sharedDataset.rows.map(row => {
                row[columnIndex] = Math.log(parseFloat(row[columnIndex]) + 1).toFixed(2); // Log(x + 1) to handle zero values
                return row;
            });
            alert(`Log transformed column: ${column}`);
        });
    }
});



// Plot Section
document.getElementById('toolbar-plots').addEventListener('click', () => {
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
                    </select>
                    <button class="btn btn-primary w-100" id="generateChart">Generate Chart</button>
                </div>
                <div class="col-9">
                    <canvas id="chartCanvas" class="bg-white p-3 rounded shadow"></canvas>
                </div>
            </div>
        </section>
    `;
    populateColumnSelectors();
    implementPlotFunctionality();
});

function populateColumnSelectors() {
    const xAxisSelect = document.getElementById('xAxisColumn');
    const yAxisSelect = document.getElementById('yAxisColumn');
    xAxisSelect.innerHTML = sharedDataset.headers.map(header => `<option value="${header}">${header}</option>`).join('');
    yAxisSelect.innerHTML = sharedDataset.headers.map(header => `<option value="${header}">${header}</option>`).join('');
}

function implementPlotFunctionality() {
    let chart;

    document.getElementById('generateChart').addEventListener('click', () => {
        const xAxisColumn = document.getElementById('xAxisColumn').value;
        const yAxisColumn = document.getElementById('yAxisColumn').value;

        if (!xAxisColumn || !yAxisColumn) {
            alert('Please select both X and Y axes.');
            return;
        }

        const chartCanvas = document.getElementById('chartCanvas').getContext('2d');
        const labels = sharedDataset.rows.map(row => row[sharedDataset.headers.indexOf(xAxisColumn)]);
        const data = sharedDataset.rows.map(row => parseFloat(row[sharedDataset.headers.indexOf(yAxisColumn)]));

        if (chart) chart.destroy();

        chart = new Chart(chartCanvas, {
            type: document.getElementById('chartType').value,
            data: {
                labels: labels,
                datasets: [{
                    label: `${yAxisColumn} vs ${xAxisColumn}`,
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { title: { display: true, text: xAxisColumn } },
                    y: { title: { display: true, text: yAxisColumn } }
                }
            }
        });

        console.log('Chart generated successfully.');
    });
}

// Statistics Section
document.getElementById('toolbar-statistics').addEventListener('click', () => {
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
                        <select id="statsColumn" class="form-control mb-3">
                            <option value="">Select Column</option>
                        </select>
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
        </section>
    `;

    populateStatsSelectors();
    implementStatisticsFunctionality();
});

function populateStatsSelectors() {
    const columnOptions = sharedDataset.headers.map(header => `<option value="${header}">${header}</option>`).join('');
    document.getElementById('statsColumn').innerHTML = `<option value="">Select Column</option>${columnOptions}`;
    document.getElementById('correlationColumn1').innerHTML = columnOptions;
    document.getElementById('correlationColumn2').innerHTML = columnOptions;
}

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