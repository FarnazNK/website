document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll for navigation links with in-page anchors
    document.querySelectorAll('a.nav-link').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetPage = this.getAttribute('href');
            if (targetPage && targetPage.startsWith('#')) {
                e.preventDefault();
                const targetElement = document.getElementById(targetPage.substring(1));
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    console.log('Portfolio website interactions ready');
});

// Global variable to store shared data
let sharedDataset = { headers: [], rows: [] };

// Toolbar Logic
const dynamicContent = document.getElementById('dynamic-content');
const toolbarButtons = document.querySelectorAll('.btn');

toolbarButtons.forEach(button => {
    button.addEventListener('click', () => {
        toolbarButtons.forEach(btn => {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
        });
        button.classList.add('btn-primary');
        button.classList.remove('btn-secondary');
    });
});

// Data Button Handler
document.getElementById('toolbar-data').addEventListener('click', () => {
    dynamicContent.innerHTML = `
        <section style="background: linear-gradient(115deg, #6dcfe7, #1e1e1e);">
            <div class="container py-4">
                <h2 class="text-center text-light">Data</h2>
                <p class="text-center text-light">Upload your dataset to view it in a professional data table.</p>
                <input type="file" id="dataFileInput" class="form-control mb-3" accept=".csv">
                <div class="table-container bg-dark rounded p-3">
                    <table class="table table-dark table-striped">
                        <thead id="tableHead"></thead>
                        <tbody id="tableBody"></tbody>
                    </table>
                </div>
            </div>
        </section>
    `;
    implementDataLoadingFunctionality();
});

// Data Loading Functionality
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

// Plot Button Handler
document.getElementById('toolbar-plots').addEventListener('click', () => {
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
                    <label for="chartColor">Choose Plot Color:</label>
                    <input type="color" id="chartColor" class="form-control mb-3" value="#4bc0c0">
                    <label for="canvasWidth">Width (px):</label>
                    <input type="number" id="canvasWidth" class="form-control mb-3" value="800" min="100">
                    <label for="canvasHeight">Height (px):</label>
                    <input type="number" id="canvasHeight" class="form-control mb-3" value="400" min="100">
                    <div class="form-check mb-3">
                        <input class="form-check-input" type="checkbox" id="toggleLegend" checked>
                        <label class="form-check-label" for="toggleLegend">Show Legend</label>
                    </div>
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

// Populate column selectors for X and Y axes
function populateColumnSelectors() {
    const xAxisSelect = document.getElementById('xAxisColumn');
    const yAxisSelect = document.getElementById('yAxisColumn');
    xAxisSelect.innerHTML = sharedDataset.headers.map(header => `<option value="${header}">${header}</option>`).join('');
    yAxisSelect.innerHTML = sharedDataset.headers.map(header => `<option value="${header}">${header}</option>`).join('');
}

// Plot Functionality
function implementPlotFunctionality() {
    let chart;
    document.getElementById('generateChart').addEventListener('click', () => {
        if (sharedDataset.headers.length === 0 || sharedDataset.rows.length === 0) {
            alert('No data loaded. Please upload data in the Data section first.');
            return;
        }

        const xAxisColumn = document.getElementById('xAxisColumn').value;
        const yAxisColumn = document.getElementById('yAxisColumn').value;
        const chartType = document.getElementById('chartType').value;
        const chartColor = document.getElementById('chartColor').value;
        const canvasWidth = parseInt(document.getElementById('canvasWidth').value);
        const canvasHeight = parseInt(document.getElementById('canvasHeight').value);
        const showLegend = document.getElementById('toggleLegend').checked;

        const chartCanvas = document.getElementById('chartCanvas');
        chartCanvas.width = canvasWidth;
        chartCanvas.height = canvasHeight;
        const ctx = chartCanvas.getContext('2d');

        const xAxisIndex = sharedDataset.headers.indexOf(xAxisColumn);
        const yAxisIndex = sharedDataset.headers.indexOf(yAxisColumn);

        const labels = sharedDataset.rows.map(row => row[xAxisIndex]);
        const data = sharedDataset.rows.map(row => parseFloat(row[yAxisIndex]));

        if (chart) chart.destroy();

        chart = new Chart(ctx, {
            type: chartType,
            data: {
                labels: labels,
                datasets: [{
                    label: `${yAxisColumn} vs ${xAxisColumn}`,
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
                    x: { title: { display: true, text: xAxisColumn } },
                    y: { title: { display: true, text: yAxisColumn } }
                }
            }
        });
    });
}
