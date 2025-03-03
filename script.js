if (r === undefined) {
    // Fallback to predefined colors
    const predefinedColors = [
        'rgba(255, 99, 132, 0.7)',
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(199, 199, 199, 0.7)',
        'rgba(83, 102, 255, 0.7)',
        'rgba(255, 99, 255, 0.7)',
        'rgba(99, 255, 132, 0.7)'
    ];
    
    for (let i = 0; i < count; i++) {
        colors.push(predefinedColors[i % predefinedColors.length]);
    }
    
    return colors;
}

// Generate variations of the base color
for (let i = 0; i < count; i++) {
    // Shift hue by adjusting the RGB values
    const hueShift = i / count;
    const newR = Math.round(r * (1 - 0.3 * hueShift));
    const newG = Math.round(g * (1 - 0.2 * hueShift + 0.3 * (i % 2)));
    const newB = Math.round(b * (1 + 0.3 * (1 - hueShift)));
    
    colors.push(`rgba(${newR}, ${newG}, ${newB}, 0.7)`);
}

return colors;
}

function simpleLinearRegression(x, y) {
// Calculate simple linear regression: y = slope * x + intercept
const n = x.length;

// Calculate means
const meanX = x.reduce((sum, val) => sum + val, 0) / n;
const meanY = y.reduce((sum, val) => sum + val, 0) / n;

// Calculate slope
let numerator = 0;
let denominator = 0;

for (let i = 0; i < n; i++) {
    numerator += (x[i] - meanX) * (y[i] - meanY);
    denominator += Math.pow(x[i] - meanX, 2);
}

const slope = numerator / denominator;

// Calculate intercept
const intercept = meanY - slope * meanX;

return { slope, intercept };
}

function copyChartAsImage() {
const chartsContainer = document.getElementById('chartsContainer');

if (!chartsContainer || !chartsContainer.children.length) {
    ErrorHandler.showError('No charts available to copy.');
    return;
}

// Get the first chart
const chartWrapper = chartsContainer.children[0];
const canvas = chartWrapper.querySelector('canvas');

if (!canvas) {
    ErrorHandler.showError('Chart canvas not found.');
    return;
}

try {
    // Create a temporary link to download the image
    canvas.toBlob(function(blob) {
        // Create a URL for the blob
        const url = URL.createObjectURL(blob);
        
        // Create a temporary link
        const link = document.createElement('a');
        link.download = 'chart.png';
        link.href = url;
        link.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        
        UI.updateStatus('Chart copied as image. Check your downloads folder.');
    });
} catch (error) {
    ErrorHandler.handlePromiseError(error);
}
}

// ======== STATISTICS SECTION ========
function populateStatsSelectors() {
const columnOptions = sharedDataset.headers
    .map(header => `<option value="${header}">${header}</option>`)
    .join('');
const statsColumn = document.getElementById('statsColumn');

if (statsColumn) {
    statsColumn.setAttribute('multiple', 'multiple'); // Enable multiple selection
    statsColumn.setAttribute('size', '5'); // Adjust size for better visibility
    statsColumn.innerHTML = `<option value="">Select Column(s)</option>${columnOptions}`;
}
}

function implementStatisticsFunctionality() {
// Add Statistics Options UI
const statsOptionsContainer = document.createElement('div');
statsOptionsContainer.className = 'mb-4';
statsOptionsContainer.innerHTML = `
    <h5>Statistics Options:</h5>
    <div class="row">
        <div class="col-md-6">
            <div class="form-check">
                <input type="checkbox" id="optionMean" class="form-check-input" checked>
                <label class="form-check-label" for="optionMean">Mean</label>
            </div>
            <div class="form-check">
                <input type="checkbox" id="optionMedian" class="form-check-input" checked>
                <label class="form-check-label" for="optionMedian">Median</label>
            </div>
            <div class="form-check">
                <input type="checkbox" id="optionMode" class="form-check-input" checked>
                <label class="form-check-label" for="optionMode">Mode</label>
            </div>
            <div class="form-check">
                <input type="checkbox" id="optionMin" class="form-check-input" checked>
                <label class="form-check-label" for="optionMin">Minimum</label>
            </div>
            <div class="form-check">
                <input type="checkbox" id="optionMax" class="form-check-input" checked>
                <label class="form-check-label" for="optionMax">Maximum</label>
            </div>
        </div>
        <div class="col-md-6">
            <div class="form-check">
                <input type="checkbox" id="optionVariance" class="form-check-input" checked>
                <label class="form-check-label" for="optionVariance">Variance</label>
            </div>
            <div class="form-check">
                <input type="checkbox" id="optionStdDev" class="form-check-input" checked>
                <label class="form-check-label" for="optionStdDev">Standard Deviation</label>
            </div>
            <div class="form-check">
                <input type="checkbox" id="optionSkewness" class="form-check-input" checked>
                <label class="form-check-label" for="optionSkewness">Skewness</label>
            </div>
            <div class="form-check">
                <input type="checkbox" id="optionKurtosis" class="form-check-input" checked>
                <label class="form-check-label" for="optionKurtosis">Kurtosis</label>
            </div>
            <div class="form-check">
                <input type="checkbox" id="optionOutliers" class="form-check-input" checked>
                <label class="form-check-label" for="optionOutliers">Outliers</label>
            </div>
        </div>
    </div>`;

const statsContainer = document.querySelector('.bg-dark.text-light.p-3.rounded.shadow-sm');
if (statsContainer) {
    statsContainer.insertBefore(statsOptionsContainer, statsContainer.querySelector('select').parentNode);
}

// Generate Statistics Button
document.getElementById('generateStats').addEventListener('click', generateStatistics);
}

function generateStatistics() {
// Get selected columns and statistics options
const statsColumn = document.getElementById('statsColumn');
const selectedOptions = Array.from(statsColumn.selectedOptions).map(option => option.value);

if (selectedOptions.length === 0) {
    ErrorHandler.showError('Please select at least one column.');
    return;
}

// Get selected statistics
const selectedStats = {
    mean: document.getElementById('optionMean')?.checked || false,
    median: document.getElementById('optionMedian')?.checked || false,
    mode: document.getElementById('optionMode')?.checked || false,
    min: document.getElementById('optionMin')?.checked || false,
    max: document.getElementById('optionMax')?.checked || false,
    variance: document.getElementById('optionVariance')?.checked || false,
    stdDev: document.getElementById('optionStdDev')?.checked || false,
    skewness: document.getElementById('optionSkewness')?.checked || false,
    kurtosis: document.getElementById('optionKurtosis')?.checked || false,
    outliers: document.getElementById('optionOutliers')?.checked || false
};

// Build table headers based on selected statistics
let tableHTML = `
    <div class="table-responsive">
        <table class="table table-dark table-striped w-100">
            <thead>
                <tr>
                    <th>Column</th>
                    <th>Type</th>`;

if (selectedStats.mean) tableHTML += '<th>Mean</th>';
if (selectedStats.median) tableHTML += '<th>Median</th>';
if (selectedStats.mode) tableHTML += '<th>Mode</th>';
if (selectedStats.min) tableHTML += '<th>Min</th>';
if (selectedStats.max) tableHTML += '<th>Max</th>';
if (selectedStats.variance) tableHTML += '<th>Variance</th>';
if (selectedStats.stdDev) tableHTML += '<th>Standard Deviation</th>';
if (selectedStats.skewness) tableHTML += '<th>Skewness</th>';
if (selectedStats.kurtosis) tableHTML += '<th>Kurtosis</th>';
if (selectedStats.outliers) tableHTML += '<th>Outliers</th>';

tableHTML += `</tr>
            </thead>
            <tbody>`;

// Calculate statistics for each selected column
selectedOptions.forEach(column => {
    const columnIndex = sharedDataset.headers.indexOf(column);

    if (columnIndex === -1) {
        tableHTML += `<tr>
                        <td>${column}</td>
                        <td>Invalid</td>
                        <td colspan="${Object.values(selectedStats).filter(Boolean).length}">Column not found</td>
                      </tr>`;
        return;
    }

    // Get column values
    const allValues = sharedDataset.rows.map(row => row[columnIndex]);
    const values = allValues.map(val => parseFloat(val)).filter(val => !isNaN(val));
    
    // Detect column type
    const columnType = detectColumnType(allValues);

    if (values.length === 0) {
        tableHTML += `<tr>
                        <td>${column}</td>
                        <td>${columnType}</td>
                        <td colspan="${Object.values(selectedStats).filter(Boolean).length}">No numeric data</td>
                      </tr>`;
        return;
    }

    // Calculate statistics
    let rowHTML = `<tr><td>${column}</td><td>${columnType}</td>`;
    
    if (selectedStats.mean) {
        const mean = calculateMean(values);
        rowHTML += `<td>${formatNumber(mean)}</td>`;
    }
    
    if (selectedStats.median) {
        const sortedValues = [...values].sort((a, b) => a - b);
        const median = values.length % 2 === 0 
            ? (sortedValues[values.length/2 - 1] + sortedValues[values.length/2]) / 2
            : sortedValues[Math.floor(values.length/2)];
        rowHTML += `<td>${formatNumber(median)}</td>`;
    }
    
    if (selectedStats.mode) {
        const mode = calculateMode(values);
        rowHTML += `<td>${Array.isArray(mode) ? mode.map(formatNumber).join(', ') : formatNumber(mode)}</td>`;
    }
    
    if (selectedStats.min) {
        const min = Math.min(...values);
        rowHTML += `<td>${formatNumber(min)}</td>`;
    }
    
    if (selectedStats.max) {
        const max = Math.max(...values);
        rowHTML += `<td>${formatNumber(max)}</td>`;
    }
    
    if (selectedStats.variance) {
        const mean = calculateMean(values);
        const variance = calculateVariance(values, mean);
        rowHTML += `<td>${formatNumber(variance)}</td>`;
    }
    
    if (selectedStats.stdDev) {
        const mean = calculateMean(values);
        const variance = calculateVariance(values, mean);
        const stdDev = Math.sqrt(variance);
        rowHTML += `<td>${formatNumber(stdDev)}</td>`;
    }
    
    if (selectedStats.skewness) {
        const skewness = calculateSkewness(values);
        rowHTML += `<td>${formatNumber(skewness)}</td>`;
    }
    
    if (selectedStats.kurtosis) {
        const kurtosis = calculateKurtosis(values);
        rowHTML += `<td>${formatNumber(kurtosis)}</td>`;
    }
    
    if (selectedStats.outliers) {
        const outliers = detectOutliers(values);
        rowHTML += `<td>${outliers.length} (${formatNumber(outliers.length / values.length * 100)}%)</td>`;
    }
    
    rowHTML += `</tr>`;
    tableHTML += rowHTML;
});

tableHTML += '</tbody></table></div>';

// Add visualization button if there are numeric columns
tableHTML += `
    <div class="mt-3">
        <button id="visualizeStats" class="btn btn-primary">Visualize Statistics</button>
    </div>`;

// Update results container
const statsResult = document.getElementById('statsResult');
statsResult.innerHTML = tableHTML;

// Add event listener for visualization button
document.getElementById('visualizeStats')?.addEventListener('click', () => {
    visualizeStatistics(selectedOptions);
});
}

function detectColumnType(values) {
// Simple type detection based on values
const uniqueValues = [...new Set(values.filter(v => v !== null && v !== undefined && v !== ""))];

// Check if all values can be converted to numbers
const numericValues = uniqueValues.map(v => parseFloat(v)).filter(v => !isNaN(v));

if (numericValues.length === uniqueValues.length) {
    // All values are numeric
    if (numericValues.every(v => Math.floor(v) === v)) {
        return "Integer";
    } else {
        return "Float";
    }
}

// Check for boolean-like values
if (uniqueValues.length === 2 && 
    uniqueValues.every(v => ["true", "false", "0", "1", "yes", "no"].includes(String(v).toLowerCase()))) {
    return "Boolean";
}

// Check for date-like values
if (uniqueValues.every(v => !isNaN(Date.parse(v)))) {
    return "Date";
}

// If there are few unique values compared to total, might be categorical
if (uniqueValues.length < Math.min(10, values.length / 2)) {
    return "Categorical";
}

// Default to text
return "Text";
}

function calculateMode(values) {
// Count occurrences of each value
const counts = {};
let maxCount = 0;

for (const value of values) {
    counts[value] = (counts[value] || 0) + 1;
    maxCount = Math.max(maxCount, counts[value]);
}

// Find all values that occur with the maximum frequency
const modes = [];
for (const value in counts) {
    if (counts[value] === maxCount) {
        modes.push(parseFloat(value));
    }
}

// Return the mode(s)
return modes.length === 1 ? modes[0] : modes;
}

function calculateVariance(values, mean) {
if (!values.length) return 0;
return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}

function calculateSkewness(values) {
if (values.length < 3) return 0;

const mean = calculateMean(values);
const stdDev = Math.sqrt(calculateVariance(values, mean));

if (stdDev === 0) return 0;

// Moment calculation for skewness
let sum = 0;
for (const value of values) {
    sum += Math.pow((value - mean) / stdDev, 3);
}

return sum / values.length;
}

function calculateKurtosis(values) {
if (values.length < 4) return 0;

const mean = calculateMean(values);
const stdDev = Math.sqrt(calculateVariance(values, mean));

if (stdDev === 0) return 0;

// Moment calculation for kurtosis
let sum = 0;
for (const value of values) {
    sum += Math.pow((value - mean) / stdDev, 4);
}

return sum / values.length - 3; // Excess kurtosis (normal = 0)
}

function detectOutliers(values) {
if (values.length < 4) return [];

// Using IQR method (1.5 * IQR)
const sortedValues = [...values].sort((a, b) => a - b);

const q1Index = Math.floor(values.length / 4);
const q3Index = Math.floor(values.length * 3 / 4);

const q1 = sortedValues[q1Index];
const q3 = sortedValues[q3Index];

const iqr = q3 - q1;
const lowerBound = q1 - 1.5 * iqr;
const upperBound = q3 + 1.5 * iqr;

return values.filter(val => val < lowerBound || val > upperBound);
}

function formatNumber(value) {
// Format a number for display
if (value === null || value === undefined || isNaN(value)) return 'N/A';

// For large or small numbers, use scientific notation
if (Math.abs(value) > 10000 || (Math.abs(value) < 0.001 && value !== 0)) {
    return value.toExponential(4);
}

// Otherwise format to 4 decimal places
return parseFloat(value.toFixed(4)).toString();
}

function visualizeStatistics(columns) {
// Create a modal for the visualizations
const modal = document.createElement('div');
modal.className = 'modal fade';
modal.id = 'statsVisualizationModal';
modal.setAttribute('tabindex', '-1');

modal.innerHTML = `
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Statistical Visualizations</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <label for="vizType" class="form-label">Visualization Type:</label>
                    <select id="vizType" class="form-select">
                        <option value="histogram">Histogram</option>
                        <option value="boxplot">Box Plot</option>
                        <option value="scatter">Scatter Plot</option>
                        <option value="correlation">Correlation Matrix</option>
                    </select>
                </div>
                <div id="vizOptions" class="mb-3">
                    <!-- Visualization-specific options will go here -->
                </div>
                <div id="vizContainer" style="height: 400px;">
                    <canvas id="vizCanvas"></canvas>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>`;

// Remove any existing modal
document.getElementById('statsVisualizationModal')?.remove();

// Add the modal to the document
document.body.appendChild(modal);

// Initialize the Bootstrap modal
const modalElement = new bootstrap.Modal(document.getElementById('statsVisualizationModal'));
modalElement.show();

// Update options based on visualization type
const vizTypeSelect = document.getElementById('vizType');
vizTypeSelect.addEventListener('change', () => updateVisualizationOptions(columns));

// Initial options setup
updateVisualizationOptions(columns);
}

function updateVisualizationOptions(columns) {
const vizType = document.getElementById('vizType').value;
const optionsContainer = document.getElementById('vizOptions');

if (!optionsContainer) return;

let optionsHTML = '';

switch (vizType) {
    case 'histogram':
        optionsHTML = `
            <div class="mb-3">
                <label for="histColumn" class="form-label">Column:</label>
                <select id="histColumn" class="form-select">
                    ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
                </select>
            </div>
            <div class="mb-3">
                <label for="histBins" class="form-label">Number of Bins:</label>
                <input type="number" id="histBins" class="form-control" value="10" min="2" max="50">
            </div>
            <button id="generateViz" class="btn btn-primary">Generate Histogram</button>`;
        break;
    
    case 'boxplot':
        optionsHTML = `
            <div class="mb-3">
                <label class="form-label">Select Columns:</label>
                <div class="row">
                    ${columns.map(col => `
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input boxplot-column" type="checkbox" value="${col}" id="box_${col.replace(/\s+/g, '_')}" checked>
                                <label class="form-check-label" for="box_${col.replace(/\s+/g, '_')}">
                                    ${col}
                                </label>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <button id="generateViz" class="btn btn-primary">Generate Box Plot</button>`;
        break;
    
    case 'scatter':
        optionsHTML = `
            <div class="mb-3">
                <label for="scatterXColumn" class="form-label">X-Axis Column:</label>
                <select id="scatterXColumn" class="form-select">
                    ${columns.map(col => `<option value="${col}">${col}</option>`).join('')}
                </select>
            </div>
            <div class="mb-3">
                <label for="scatterYColumn" class="form-label">Y-Axis Column:</label>
                <select id="scatterYColumn" class="form-select">
                    ${columns.map((col, i) => `<option value="${col}" ${i === 1 ? 'selected' : ''}>${col}</option>`).join('')}
                </select>
            </div>
            <div class="form-check mb-3">
                <input type="checkbox" id="showRegression" class="form-check-input" checked>
                <label class="form-check-label" for="showRegression">Show Regression Line</label>
            </div>
            <button id="generateViz" class="btn btn-primary">Generate Scatter Plot</button>`;
        break;
    
    case 'correlation':
        optionsHTML = `
            <div class="mb-3">
                <label class="form-label">Select Columns:</label>
                <div class="row">
                    ${columns.map(col => `
                        <div class="col-md-4">
                            <div class="form-check">
                                <input class="form-check-input correlation-column" type="checkbox" value="${col}" id="corr_${col.replace(/\s+/g, '_')}" checked>
                                <label class="form-check-label" for="corr_${col.replace(/\s+/g, '_')}">
                                    ${col}
                                </label>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <button id="generateViz" class="btn btn-primary">Generate Correlation Matrix</button>`;
        break;
}

optionsContainer.innerHTML = optionsHTML;

// Add event listener to the generate button
document.getElementById('generateViz')?.addEventListener('click', () => generateVisualization(vizType));
}

function generateVisualization(vizType) {
// Clear any existing chart
const canvas = document.getElementById('vizCanvas');
if (canvas.chart) {
    canvas.chart.destroy();
}

switch (vizType) {
    case 'histogram':
        generateHistogram();
        break;
    
    case 'boxplot':
        generateBoxplot();
        break;
    
    case 'scatter':
        generateScatterplot();
        break;
    
    case 'correlation':
        generateCorrelationMatrix();
        break;
}
}

function generateHistogram() {
const column = document.getElementById('histColumn').value;
const bins = parseInt(document.getElementById('histBins').value) || 10;

if (!column) {
    ErrorHandler.showError('Please select a column.');
    return;
}

const columnIndex = sharedDataset.headers.indexOf(column);
if (columnIndex === -1) {
    ErrorHandler.showError('Selected column not found.');
    return;
}

// Get numeric values
const values = sharedDataset.rows
    .map(row => parseFloat(row[columnIndex]))
    .filter(val => !isNaN(val));

if (values.length === 0) {
    ErrorHandler.showError('No numeric data in selected column.');
    return;
}

// Calculate bins
const min = Math.min(...values);
const max = Math.max(...values);
const binWidth = (max - min) / bins;

// Count values in each bin
const binCounts = Array(bins).fill(0);
const binLabels = [];

for (let i = 0; i < bins; i++) {
    const binStart = min + i * binWidth;
    const binEnd = min + (i + 1) * binWidth;
    binLabels.push(`${binStart.toFixed(2)} - ${binEnd.toFixed(2)}`);
    
    // Count values in this bin
    for (const value of values) {
        if (value >= binStart && (value < binEnd || (i === bins - 1 && value <= binEnd))) {
            binCounts[i]++;
        }
    }
}

// Create histogram chart
const canvas = document.getElementById('vizCanvas');
const ctx = canvas.getContext('2d');

canvas.chart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: binLabels,
        datasets: [{
            label: 'Frequency',
            data: binCounts,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: `Histogram of ${column}`,
                font: {
                    size: 16
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `Count: ${context.raw} (${(context.raw / values.length * 100).toFixed(1)}%)`;
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: column
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Frequency'
                },
                beginAtZero: true
            }
        }
    }
});
}

function generateBoxplot() {
// Get selected columns
const selectedColumns = Array.from(document.querySelectorAll('.boxplot-column:checked'))
    .map(checkbox => checkbox.value);

if (selectedColumns.length === 0) {
    ErrorHandler.showError('Please select at least one column.');
    return;
}

// Prepare data for each column
const datasets = [];

for (const column of selectedColumns) {
    const columnIndex = sharedDataset.headers.indexOf(column);
    if (columnIndex === -1) continue;
    
    // Get numeric values
    const values = sharedDataset.rows
        .map(row => parseFloat(row[columnIndex]))
        .filter(val => !isNaN(val))
        .sort((a, b) => a - b);
    
    if (values.length === 0) continue;
    
    // Calculate box plot statistics
    const min = values[0];
    const max = values[values.length - 1];
    const q1 = values[Math.floor(values.length * 0.25)];
    const median = values.length % 2 === 0 
        ? (values[values.length/2 - 1] + values[values.length/2]) / 2
        : values[Math.floor(values.length/2)];
    const q3 = values[Math.floor(values.length * 0.75)];
    
    // Add dataset
    datasets.push({
        label: column,
        data: [{
            min,
            q1,
            median,
            q3,
            max
        }],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
    });
}

if (datasets.length === 0) {
    ErrorHandler.showError('No valid numeric data found in selected columns.');
    return;
}

// Create box plot chart
const canvas = document.getElementById('vizCanvas');
const ctx = canvas.getfunction oneHotEncoding() {
const values = getFormValues('transformationForm');
const column = values.column;

if (!DataValidator.isColumnValid(column)) return null;

const columnIndex = sharedDataset.headers.indexOf(column);

// Get unique values from the column
const uniqueValues = [...new Set(sharedDataset.rows.map(row => row[columnIndex]))];

// Create new column headers for each unique value
const newHeaders = uniqueValues.map(value => `${column}_${value}`);

// Add new columns to dataset
sharedDataset.headers.push(...newHeaders);

// Fill in binary values for each row
sharedDataset.rows = sharedDataset.rows.map(row => {
    const currentValue = row[columnIndex];
    const encodedValues = uniqueValues.map(value => currentValue === value ? 1 : 0);
    return [...row, ...encodedValues];
});

return { affectedRows: sharedDataset.rows.length, newColumns: newHeaders.length };
}

function standardizeData() {
const values = getFormValues('transformationForm');
const column = values.column;

if (!DataValidator.isColumnValid(column)) return null;

const columnIndex = sharedDataset.headers.indexOf(column);
if (!DataValidator.hasNumericData(columnIndex)) return null;

const numericValues = getColumnData(columnIndex);

const mean = calculateMean(numericValues);
const stdDev = calculateStdDev(numericValues, mean);

if (stdDev === 0) {
    ErrorHandler.showError('Cannot standardize: Standard deviation is zero (all values are the same).');
    return null;
}

let affectedRows = 0;

sharedDataset.rows = sharedDataset.rows.map(row => {
    const value = parseFloat(row[columnIndex]);
    if (!isNaN(value)) {
        row[columnIndex] = ((value - mean) / stdDev).toFixed(4);
        affectedRows++;
    }
    return row;
});

return { affectedRows };
}

function clipping() {
const values = getFormValues('transformationForm');
const column = values.column;
const minValue = values.min;
const maxValue = values.max;

if (!DataValidator.isColumnValid(column)) return null;
if (minValue === null || maxValue === null) {
    ErrorHandler.showError('Min and max values are required.');
    return null;
}
if (minValue >= maxValue) {
    ErrorHandler.showError('Min value must be less than max value.');
    return null;
}

const columnIndex = sharedDataset.headers.indexOf(column);
if (!DataValidator.hasNumericData(columnIndex)) return null;

let affectedRows = 0;

sharedDataset.rows = sharedDataset.rows.map(row => {
    const value = parseFloat(row[columnIndex]);
    if (!isNaN(value)) {
        const clippedValue = Math.max(minValue, Math.min(value, maxValue));
        row[columnIndex] = clippedValue.toFixed(4);
        if (value !== clippedValue) affectedRows++;
    }
    return row;
});

return { affectedRows };
}

function updateTransformationOutput(message) {
const output = document.getElementById('transformationOutput');
if (output) {
    output.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show mt-3" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`;
}
}

// ======== HELPER FUNCTIONS ========
function getColumnData(columnIndex) {
return sharedDataset.rows
    .map(row => parseFloat(row[columnIndex]))
    .filter(val => !isNaN(val));
}

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

function calculateR2(actual, predicted) {
const meanActual = actual.reduce((sum, val) => sum + val, 0) / actual.length;

let ssTotal = 0;
let ssResidual = 0;

for (let i = 0; i < actual.length; i++) {
    ssTotal += Math.pow(actual[i] - meanActual, 2);
    ssResidual += Math.pow(actual[i] - predicted[i], 2);
}

return 1 - (ssResidual / ssTotal);
}

// ======== PLOTS SECTION ========
const plotsButton = document.getElementById('toolbar-plots');
if (plotsButton) {
plotsButton.addEventListener('click', () => {
    if (!DataValidator.hasData()) return;
    
    dynamicContent.innerHTML = `
        <section style="background: linear-gradient(115deg, #6dcfe7, #1e1e1e);">
            <div class="container py-4">
                <div class="row">
                    <div class="col-md-4 bg-dark text-light p-3 rounded shadow-sm">
                        <h4 class="text-white">Plot Options</h4>
                        <form id="plotOptionsForm" class="mt-3">
                            <div class="mb-3">
                                <label for="xAxisColumn" class="form-label">X-Axis</label>
                                <select id="xAxisColumn" class="form-select"></select>
                            </div>
                            <div class="mb-3">
                                <label for="yAxisColumn" class="form-label">Y-Axis</label>
                                <select id="yAxisColumn" class="form-select"></select>
                            </div>
                            <div class="mb-3">
                                <label for="chartType" class="form-label">Chart Type</label>
                                <select id="chartType" class="form-select">
                                    <option value="bar">Bar Chart</option>
                                    <option value="line">Line Chart</option>
                                    <option value="scatter" selected>Scatter Plot</option>
                                    <option value="pie">Pie Chart</option>
                                    <option value="doughnut">Doughnut Chart</option>
                                    <option value="radar">Radar Chart</option>
                                    <option value="bubble">Bubble Chart</option>
                                    <option value="polarArea">Polar Area</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="chartTitle" class="form-label">Chart Title</label>
                                <input type="text" id="chartTitle" class="form-control" placeholder="Enter chart title">
                            </div>
                            <div class="mb-3">
                                <label for="chartColor" class="form-label">Chart Color</label>
                                <input type="color" id="chartColor" class="form-control form-control-color" value="#4b9cdf">
                            </div>
                            <div class="mb-3 form-check">
                                <input type="checkbox" id="showLegend" class="form-check-input" checked>
                                <label for="showLegend" class="form-check-label">Show Legend</label>
                            </div>
                            <div class="mb-3">
                                <label for="chartAnimationSpeed" class="form-label">Animation Speed</label>
                                <select id="chartAnimationSpeed" class="form-select">
                                    <option value="0">None</option>
                                    <option value="500">Fast</option>
                                    <option value="1000" selected>Medium</option>
                                    <option value="2000">Slow</option>
                                </select>
                            </div>
                            
                            <div id="chartSpecificOptions" class="mb-3">
                                <!-- Chart-specific options will be populated here -->
                            </div>
                            
                            <button type="button" id="generateChart" class="btn btn-primary w-100 mb-2">Generate Chart</button>
                            <button type="button" id="copyChartImage" class="btn btn-success w-100 mb-2 d-none">Copy Chart as Image</button>
                            <button type="button" id="clearCharts" class="btn btn-danger w-100">Clear All Charts</button>
                        </form>
                    </div>
                    <div class="col-md-8">
                        <div id="chartsContainer" class="d-flex flex-wrap gap-3 bg-light rounded p-3 shadow-sm"></div>
                    </div>
                </div>
            </div>
        </section>`;
        
    populateColumnSelectors();
    implementPlotFunctionality();
    updateChartSpecificOptions();
    
    // Add event listener for chart type change
    document.getElementById('chartType').addEventListener('change', updateChartSpecificOptions);
});
} else {
console.error('Button with id "toolbar-plots" not found.');
}

function populateColumnSelectors() {
const xAxisSelect = document.getElementById('xAxisColumn');
const yAxisSelect = document.getElementById('yAxisColumn');

if (!xAxisSelect || !yAxisSelect) return;

const columnOptions = sharedDataset.headers.map(header => 
    `<option value="${header}">${header}</option>`
).join('');

xAxisSelect.innerHTML = columnOptions;
yAxisSelect.innerHTML = columnOptions;

// Select different columns by default if possible
if (sharedDataset.headers.length > 1) {
    yAxisSelect.selectedIndex = 1;
}
}

function updateChartSpecificOptions() {
const chartType = document.getElementById('chartType').value;
const optionsContainer = document.getElementById('chartSpecificOptions');

if (!optionsContainer) return;

let optionsHTML = '';

switch(chartType) {
    case 'pie':
    case 'doughnut':
        optionsHTML = `
            <div class="mb-3 form-check">
                <input type="checkbox" id="showPercentages" class="form-check-input" checked>
                <label for="showPercentages" class="form-check-label">Show Percentages</label>
            </div>
            <div class="mb-3">
                <label for="sliceBorderWidth" class="form-label">Slice Border Width</label>
                <input type="number" id="sliceBorderWidth" class="form-control" value="1" min="0" max="10">
            </div>`;
        break;
        
    case 'bar':
        optionsHTML = `
            <div class="mb-3 form-check">
                <input type="checkbox" id="showValues" class="form-check-input" checked>
                <label for="showValues" class="form-check-label">Show Values on Bars</label>
            </div>
            <div class="mb-3 form-check">
                <input type="checkbox" id="isHorizontal" class="form-check-input">
                <label for="isHorizontal" class="form-check-label">Horizontal Bars</label>
            </div>`;
        break;
        
    case 'line':
        optionsHTML = `
            <div class="mb-3 form-check">
                <input type="checkbox" id="filled" class="form-check-input">
                <label for="filled" class="form-check-label">Fill Area Under Line</label>
            </div>
            <div class="mb-3 form-check">
                <input type="checkbox" id="curved" class="form-check-input" checked>
                <label for="curved" class="form-check-label">Curved Line</label>
            </div>
            <div class="mb-3">
                <label for="pointRadius" class="form-label">Point Size</label>
                <input type="number" id="pointRadius" class="form-control" value="3" min="0" max="10">
            </div>`;
        break;
        
    case 'scatter':
        optionsHTML = `
            <div class="mb-3">
                <label for="pointRadius" class="form-label">Point Size</label>
                <input type="number" id="pointRadius" class="form-control" value="5" min="1" max="20">
            </div>
            <div class="mb-3 form-check">
                <input type="checkbox" id="showRegression" class="form-check-input">
                <label for="showRegression" class="form-check-label">Show Regression Line</label>
            </div>`;
        break;
        
    case 'bubble':
        optionsHTML = `
            <div class="mb-3">
                <label for="bubbleSizeColumn" class="form-label">Bubble Size (Column)</label>
                <select id="bubbleSizeColumn" class="form-select">
                    ${sharedDataset.headers.map(header => 
                        `<option value="${header}">${header}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="mb-3">
                <label for="bubbleScaleFactor" class="form-label">Size Scale Factor</label>
                <input type="number" id="bubbleScaleFactor" class="form-control" value="10" min="1" max="50">
            </div>`;
        break;
}

optionsContainer.innerHTML = optionsHTML;
}

function implementPlotFunctionality() {
const generateButton = document.getElementById('generateChart');
const clearButton = document.getElementById('clearCharts');
const copyButton = document.getElementById('copyChartImage');

if (generateButton) {
    generateButton.addEventListener('click', generateNewChart);
}

if (clearButton) {
    clearButton.addEventListener('click', () => {
        const chartsContainer = document.getElementById('chartsContainer');
        if (chartsContainer) {
            chartsContainer.innerHTML = '';
            copyButton.classList.add('d-none');
        }
    });
}

if (copyButton) {
    copyButton.addEventListener('click', copyChartAsImage);
}
}

function generateNewChart() {
// Get form values
const xAxisColumn = document.getElementById('xAxisColumn').value;
const yAxisColumn = document.getElementById('yAxisColumn').value;
const chartType = document.getElementById('chartType').value;
const chartTitle = document.getElementById('chartTitle').value || `${yAxisColumn} vs ${xAxisColumn}`;
const chartColor = document.getElementById('chartColor').value || '#4b9cdf';
const showLegend = document.getElementById('showLegend').checked;
const animationSpeed = parseInt(document.getElementById('chartAnimationSpeed').value);

// Validate inputs
if (!xAxisColumn || !yAxisColumn) {
    ErrorHandler.showError('Please select both X and Y axes.');
    return;
}

// Extract data for the chart
const xIndex = sharedDataset.headers.indexOf(xAxisColumn);
const yIndex = sharedDataset.headers.indexOf(yAxisColumn);

if (xIndex === -1 || yIndex === -1) {
    ErrorHandler.showError('Selected columns are not valid.');
    return;
}

// Get chart data
const chartData = prepareChartData(xIndex, yIndex, chartType);
if (!chartData) return;

// Get chart-specific options
const chartOptions = getChartSpecificOptions(chartType);

// Create chart container
const chartWrapper = createChartContainer();

// Create chart
createChart(chartWrapper, chartType, chartData, {
    title: chartTitle,
    color: chartColor,
    showLegend: showLegend,
    animationSpeed: animationSpeed,
    xAxisLabel: xAxisColumn,
    yAxisLabel: yAxisColumn,
    ...chartOptions
});

// Show copy button
document.getElementById('copyChartImage').classList.remove('d-none');
}

function prepareChartData(xIndex, yIndex, chartType) {
// For most chart types, we need numeric y-values
let xValues = [];
let yValues = [];

// For categorical charts like pie/doughnut, we need to aggregate values
if (['pie', 'doughnut', 'polarArea'].includes(chartType)) {
    // Count occurrences of each unique x value
    const valueCount = {};
    
    for (const row of sharedDataset.rows) {
        const xValue = row[xIndex];
        if (xValue === null || xValue === undefined || xValue === '') continue;
        
        valueCount[xValue] = (valueCount[xValue] || 0) + 1;
    }
    
    xValues = Object.keys(valueCount);
    yValues = Object.values(valueCount);
} else {
    // For other charts, extract x and y values as pairs
    for (const row of sharedDataset.rows) {
        const xValue = row[xIndex];
        const yValue = parseFloat(row[yIndex]);
        
        if (xValue !== null && xValue !== undefined && xValue !== '' && !isNaN(yValue)) {
            xValues.push(xValue);
            yValues.push(yValue);
        }
    }
}

if (xValues.length === 0) {
    ErrorHandler.showError('No valid data points found for selected columns.');
    return null;
}

return { xValues, yValues };
}

function getChartSpecificOptions(chartType) {
const options = {};

switch(chartType) {
    case 'pie':
    case 'doughnut':
        options.showPercentages = document.getElementById('showPercentages')?.checked || false;
        options.sliceBorderWidth = parseInt(document.getElementById('sliceBorderWidth')?.value || 1);
        break;
        
    case 'bar':
        options.showValues = document.getElementById('showValues')?.checked || false;
        options.isHorizontal = document.getElementById('isHorizontal')?.checked || false;
        break;
        
    case 'line':
        options.filled = document.getElementById('filled')?.checked || false;
        options.curved = document.getElementById('curved')?.checked || false;
        options.pointRadius = parseInt(document.getElementById('pointRadius')?.value || 3);
        break;
        
    case 'scatter':
        options.pointRadius = parseInt(document.getElementById('pointRadius')?.value || 5);
        options.showRegression = document.getElementById('showRegression')?.checked || false;
        break;
        
    case 'bubble':
        const bubbleSizeColumn = document.getElementById('bubbleSizeColumn')?.value;
        options.bubbleSizeIndex = sharedDataset.headers.indexOf(bubbleSizeColumn);
        options.bubbleScaleFactor = parseInt(document.getElementById('bubbleScaleFactor')?.value || 10);
        break;
}

return options;
}

function createChartContainer() {
const chartsContainer = document.getElementById('chartsContainer');

// Create a new chart wrapper
const chartWrapper = document.createElement('div');
chartWrapper.className = 'chart-wrapper card m-2 p-2';
chartWrapper.style.width = '100%';
chartWrapper.style.height = '400px';
chartWrapper.style.position = 'relative';

// Create canvas for the chart
const canvas = document.createElement('canvas');
chartWrapper.appendChild(canvas);

// Add remove button
const removeButton = document.createElement('button');
removeButton.className = 'btn btn-sm btn-danger position-absolute';
removeButton.style.top = '5px';
removeButton.style.right = '5px';
removeButton.innerHTML = '&times;';
removeButton.addEventListener('click', () => {
    if (canvas.chartInstance) {
        canvas.chartInstance.destroy();
    }
    chartWrapper.remove();
    
    // Hide copy button if no charts remain
    if (chartsContainer.children.length === 0) {
        document.getElementById('copyChartImage').classList.add('d-none');
    }
});
chartWrapper.appendChild(removeButton);

chartsContainer.appendChild(chartWrapper);
return chartWrapper;
}

function createChart(container, type, data, options) {
const canvas = container.querySelector('canvas');

// Configure chart based on type and options
const config = createChartConfig(type, data, options);

// Create chart
const ctx = canvas.getContext('2d');
const chartInstance = new Chart(ctx, config);

// Store instance reference
canvas.chartInstance = chartInstance;

return chartInstance;
}

function createChartConfig(type, data, options) {
const { xValues, yValues } = data;
const { 
    title, color, showLegend, animationSpeed, 
    xAxisLabel, yAxisLabel, ...chartSpecificOptions 
} = options;

// Basic configuration for datasets
let datasets = [];

// Configure datasets based on chart type
switch(type) {
    case 'pie':
    case 'doughnut':
    case 'polarArea':
        // For these charts, we need a single dataset with multiple colors
        const colors = generateColors(xValues.length, color);
        
        datasets = [{
            data: yValues,
            backgroundColor: colors,
            borderColor: colors.map(c => c.replace(/[^,]+(?=\))/, '1')),
            borderWidth: chartSpecificOptions.sliceBorderWidth || 1
        }];
        break;
        
    case 'bubble':
        // For bubble chart, we need size data for each point
        let bubbleSizes = [];
        if (chartSpecificOptions.bubbleSizeIndex !== -1) {
            for (const row of sharedDataset.rows) {
                const sizeValue = parseFloat(row[chartSpecificOptions.bubbleSizeIndex]);
                if (!isNaN(sizeValue)) {
                    bubbleSizes.push(sizeValue * (chartSpecificOptions.bubbleScaleFactor || 10));
                }
            }
        }
        
        // Ensure we have the same number of sizes as data points
        if (bubbleSizes.length !== xValues.length) {
            bubbleSizes = Array(xValues.length).fill(20);
        }
        
        datasets = [{
            label: title,
            data: xValues.map((x, i) => ({ 
                x: typeof x === 'string' ? i : x, 
                y: yValues[i],
                r: bubbleSizes[i] / 10
            })),
            backgroundColor: color + '80', // Add transparency
            borderColor: color,
            borderWidth: 1
        }];
        break;
        
    case 'scatter':
        datasets = [{
            label: title,
            data: xValues.map((x, i) => ({ 
                x: typeof x === 'string' ? i : x, 
                y: yValues[i] 
            })),
            backgroundColor: color + '80', // Add transparency
            borderColor: color,
            borderWidth: 1,
            pointRadius: chartSpecificOptions.pointRadius || 5
        }];
        
        // Add regression line if requested
        if (chartSpecificOptions.showRegression) {
            // Convert string x values to numbers for regression
            const numericXValues = xValues.map(x => typeof x === 'string' ? NaN : x);
            const validIndices = [];
            
            for (let i = 0; i < numericXValues.length; i++) {
                if (!isNaN(numericXValues[i])) {
                    validIndices.push(i);
                }
            }
            
            if (validIndices.length > 1) {
                const validX = validIndices.map(i => numericXValues[i]);
                const validY = validIndices.map(i => yValues[i]);
                
                const { slope, intercept } = simpleLinearRegression(validX, validY);
                
                // Create points for regression line
                const minX = Math.min(...validX);
                const maxX = Math.max(...validX);
                
                datasets.push({
                    label: 'Regression Line',
                    data: [
                        { x: minX, y: slope * minX + intercept },
                        { x: maxX, y: slope * maxX + intercept }
                    ],
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    type: 'line'
                });
            }
        }
        break;
        
    case 'bar':
        datasets = [{
            label: title,
            data: yValues,
            backgroundColor: color + '80', // Add transparency
            borderColor: color,
            borderWidth: 1
        }];
        break;
        
    case 'line':
        datasets = [{
            label: title,
            data: yValues,
            backgroundColor: chartSpecificOptions.filled ? color + '40' : 'transparent',
            borderColor: color,
            borderWidth: 2,
            tension: chartSpecificOptions.curved ? 0.4 : 0,
            fill: chartSpecificOptions.filled,
            pointRadius: chartSpecificOptions.pointRadius || 3
        }];
        break;
        
    case 'radar':
        datasets = [{
            label: title,
            data: yValues,
            backgroundColor: color + '40',
            borderColor: color,
            borderWidth: 2
        }];
        break;
        
    default:
        datasets = [{
            label: title,
            data: yValues,
            backgroundColor: color + '80',
            borderColor: color,
            borderWidth: 1
        }];
}

// Common chart configuration
const config = {
    type: type,
    data: {
        labels: type === 'bubble' || type === 'scatter' ? null : xValues,
        datasets: datasets
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: !!title,
                text: title,
                font: {
                    size: 16
                }
            },
            legend: {
                display: showLegend,
                position: 'top'
            }
        },
        animation: {
            duration: animationSpeed
        }
    }
};

// Special configurations for different chart types
if (['pie', 'doughnut'].includes(type) && chartSpecificOptions.showPercentages) {
    config.options.plugins.tooltip = {
        callbacks: {
            label: function(context) {
                const label = context.label || '';
                const value = context.raw;
                const total = context.chart.data.datasets[0].data.reduce((sum, val) => sum + val, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${percentage}%`;
            }
        }
    };
}

if (type === 'bar' && chartSpecificOptions.isHorizontal) {
    config.options.indexAxis = 'y';
}

if (type === 'bar' && chartSpecificOptions.showValues) {
    config.options.plugins.datalabels = {
        display: true,
        anchor: 'end',
        align: 'top',
        formatter: Math.round
    };
}

// Configure scales for applicable chart types
if (!['pie', 'doughnut', 'polarArea', 'radar'].includes(type)) {
    config.options.scales = {
        x: {
            title: {
                display: true,
                text: xAxisLabel
            }
        },
        y: {
            title: {
                display: true,
                text: yAxisLabel
            }
        }
    };
}

return config;
}

function generateColors(count, baseColor) {
// Generate array of colors based on the base color
if (count <= 1) return [baseColor];

const colors = [];

// Parse the base color
let r, g, b;
if (baseColor.startsWith('#')) {
    r = parseInt(baseColor.slice(1, 3), 16);
    g = parseInt(baseColor.slice(3, 5), 16);
    b = parseInt(baseColor.slice(5, 7), 16);
} else if (baseColor.startsWith('rgb')) {
    const match = baseColor.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (match) {
        [, r, g, b] = match.map(Number);
    }
}

if (r === undefined) {
    // Fallback to predefined colors
    const predefinedColors = [
        'rgba(255, 99,// ======== TRANSFORMATION IMPLEMENTATION ========
function implementTransformationFunctionality() {
document.getElementById('normalize-data')?.addEventListener('click', () => handleTransformationClick('Normalize Data', normalizeData));
document.getElementById('scale-data')?.addEventListener('click', () => handleTransformationClick('Scale Data', scaleData));
document.getElementById('log-transform')?.addEventListener('click', () => handleTransformationClick('Log Transformation', logTransformation));
document.getElementById('custom-transform')?.addEventListener('click', () => handleTransformationClick('Custom Transformation', customTransformation));
document.getElementById('sqrt-transform')?.addEventListener('click', () => handleTransformationClick('Square Root Transformation', sqrtTransformation));
document.getElementById('exp-transform')?.addEventListener('click', () => handleTransformationClick('Exponential Transformation', expTransformation));
document.getElementById('inverse-transform')?.addEventListener('click', () => handleTransformationClick('Inverse Transformation', inverseTransformation));
document.getElementById('binning-data')?.addEventListener('click', () => handleTransformationClick('Binning', binningData));
document.getElementById('absolute-value')?.addEventListener('click', () => handleTransformationClick('Absolute Value Transformation', absoluteValueTransformation));
document.getElementById('capping')?.addEventListener('click', () => handleTransformationClick('Capping (Winsorizing)', cappingTransformation));
document.getElementById('one-hot-encoding')?.addEventListener('click', () => handleTransformationClick('One-Hot Encoding', oneHotEncoding));
document.getElementById('standardize-data')?.addEventListener('click', () => handleTransformationClick('Standardize Data (Z-Score)', standardizeData));
document.getElementById('clipping')?.addEventListener('click', () => handleTransformationClick('Clipping', clipping));
}

function handleTransformationClick(transformationName, transformationFunction) {
if (!DataValidator.hasData()) return;

const transformationContent = document.getElementById('transformation-content');

// Generate a form based on transformation type
const formConfig = getTransformationFormConfig(transformationName);

transformationContent.innerHTML = `
    <h4 class="mb-4">${transformationName}</h4>
    <div class="row">
        <div class="col-md-6">
            <form id="transformationForm">
                ${formConfig.map(field => generateFormField(field)).join('')}
                <button type="button" id="applyTransformation" class="btn btn-primary mt-3">Apply Transformation</button>
            </form>
        </div>
        <div class="col-md-6">
            <div id="transformationPreview" class="mt-3">
                <h5>Preview</h5>
                <div id="previewContent" class="p-3 border rounded bg-light">
                    Select column(s) and parameters to see a preview
                </div>
            </div>
        </div>
    </div>
    <div id="transformationOutput" class="text-dark mt-3"></div>`;

// Attach event listeners
document.getElementById('applyTransformation').addEventListener('click', () => {
    try {
        const result = transformationFunction();
        if (result) {
            UI.updateStatus(`Successfully applied ${transformationName} to ${result.affectedRows} row(s).`);
            updateTransformationPreview('Transformation applied successfully!');
        }
    } catch (error) {
        ErrorHandler.handlePromiseError(error);
    }
});

// Attach preview event listeners to form fields
const form = document.getElementById('transformationForm');
form.addEventListener('change', () => {
    try {
        updateTransformationPreview();
    } catch (error) {
        // Don't show errors during preview
        updateTransformationPreview('Invalid parameters', true);
    }
});
}

function getTransformationFormConfig(transformationName) {
const columnOptions = sharedDataset.headers.map(header => ({ value: header, label: header }));

// Common configs
const configs = {
    'Normalize Data': [
        { type: 'select', id: 'column', label: 'Column to Normalize', options: columnOptions, required: true }
    ],
    'Scale Data': [
        { type: 'select', id: 'column', label: 'Column to Scale', options: columnOptions, required: true },
        { type: 'number', id: 'min', label: 'Target Minimum Value', defaultValue: 0, step: 0.1 },
        { type: 'number', id: 'max', label: 'Target Maximum Value', defaultValue: 1, step: 0.1 }
    ],
    'Log Transformation': [
        { type: 'select', id: 'column', label: 'Column to Transform', options: columnOptions, required: true },
        { type: 'number', id: 'base', label: 'Logarithm Base', defaultValue: 10, min: 0, step: 'any' },
        { type: 'checkbox', id: 'addOne', label: 'Add 1 before transformation (for zero values)', defaultValue: true }
    ],
    'Square Root Transformation': [
        { type: 'select', id: 'column', label: 'Column to Transform', options: columnOptions, required: true }
    ],
    'Exponential Transformation': [
        { type: 'select', id: 'column', label: 'Column to Transform', options: columnOptions, required: true },
        { type: 'number', id: 'base', label: 'Exponent Base', defaultValue: Math.E, step: 'any' }
    ],
    'Inverse Transformation': [
        { type: 'select', id: 'column', label: 'Column to Transform', options: columnOptions, required: true }
    ],
    'Binning': [
        { type: 'select', id: 'column', label: 'Column to Bin', options: columnOptions, required: true },
        { type: 'number', id: 'bins', label: 'Number of Bins', defaultValue: 5, min: 2, step: 1 },
        { type: 'select', id: 'method', label: 'Binning Method', 
          options: [
            { value: 'equal_width', label: 'Equal Width' },
            { value: 'equal_freq', label: 'Equal Frequency' },
            { value: 'custom', label: 'Custom Breaks' }
          ]
        },
        { type: 'text', id: 'customBreaks', label: 'Custom Breaks (comma-separated)', defaultValue: '', 
          conditional: { field: 'method', value: 'custom' } 
        }
    ],
    'Absolute Value Transformation': [
        { type: 'select', id: 'column', label: 'Column to Transform', options: columnOptions, required: true }
    ],
    'Capping (Winsorizing)': [
        { type: 'select', id: 'column', label: 'Column to Cap', options: columnOptions, required: true },
        { type: 'number', id: 'lowerPercentile', label: 'Lower Percentile', defaultValue: 5, min: 0, max: 100, step: 0.1 },
        { type: 'number', id: 'upperPercentile', label: 'Upper Percentile', defaultValue: 95, min: 0, max: 100, step: 0.1 }
    ],
    'One-Hot Encoding': [
        { type: 'select', id: 'column', label: 'Column to Encode', options: columnOptions, required: true }
    ],
    'Standardize Data (Z-Score)': [
        { type: 'select', id: 'column', label: 'Column to Standardize', options: columnOptions, required: true }
    ],
    'Clipping': [
        { type: 'select', id: 'column', label: 'Column to Clip', options: columnOptions, required: true },
        { type: 'number', id: 'min', label: 'Minimum Value', required: true, step: 'any' },
        { type: 'number', id: 'max', label: 'Maximum Value', required: true, step: 'any' }
    ],
    'Custom Transformation': [
        { type: 'select', id: 'column', label: 'Column to Transform', options: columnOptions, required: true },
        { type: 'text', id: 'expression', label: 'Javascript Expression (use "x" for value)', 
          defaultValue: 'x * 2', required: true,
          placeholder: 'e.g., x * 2, Math.pow(x, 2), x + 10' }
    ]
};

return configs[transformationName] || [
    { type: 'select', id: 'column', label: 'Column', options: columnOptions, required: true }
];
}

function generateFormField(field) {
// Check if this field has a conditional display rule
const conditionalAttr = field.conditional 
    ? `data-conditional-field="${field.conditional.field}" data-conditional-value="${field.conditional.value}"` 
    : '';

// Field wrapper with conditional logic
const fieldWrapper = `<div class="mb-3" ${conditionalAttr}>`;

let fieldHtml = '';

switch (field.type) {
    case 'select':
        fieldHtml = `
            <label for="${field.id}" class="form-label">${field.label}${field.required ? ' *' : ''}</label>
            <select id="${field.id}" class="form-select" ${field.required ? 'required' : ''}>
                <option value="">Select ${field.label}</option>
                ${field.options.map(option => 
                    `<option value="${option.value}">${option.label}</option>`
                ).join('')}
            </select>`;
        break;
        
    case 'number':
        fieldHtml = `
            <label for="${field.id}" class="form-label">${field.label}${field.required ? ' *' : ''}</label>
            <input type="number" id="${field.id}" class="form-control" 
                ${field.min !== undefined ? `min="${field.min}"` : ''}
                ${field.max !== undefined ? `max="${field.max}"` : ''}
                ${field.step !== undefined ? `step="${field.step}"` : ''}
                ${field.defaultValue !== undefined ? `value="${field.defaultValue}"` : ''}
                ${field.required ? 'required' : ''}>`;
        break;
        
    case 'text':
        fieldHtml = `
            <label for="${field.id}" class="form-label">${field.label}${field.required ? ' *' : ''}</label>
            <input type="text" id="${field.id}" class="form-control" 
                ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
                ${field.defaultValue !== undefined ? `value="${field.defaultValue}"` : ''}
                ${field.required ? 'required' : ''}>`;
        break;
        
    case 'checkbox':
        fieldHtml = `
            <div class="form-check">
                <input type="checkbox" id="${field.id}" class="form-check-input" 
                    ${field.defaultValue ? 'checked' : ''}>
                <label class="form-check-label" for="${field.id}">${field.label}</label>
            </div>`;
        break;
}

return fieldWrapper + fieldHtml + '</div>';
}

function updateTransformationPreview(customMessage = null, isError = false) {
const previewContent = document.getElementById('previewContent');

if (customMessage) {
    previewContent.innerHTML = isError 
        ? `<div class="text-danger">${customMessage}</div>`
        : `<div class="text-success">${customMessage}</div>`;
    return;
}

// Get form values
const formValues = getFormValues('transformationForm');
if (!formValues.column) {
    previewContent.innerHTML = 'Select column(s) and parameters to see a preview';
    return;
}

// Get sample of original data
const columnIndex = sharedDataset.headers.indexOf(formValues.column);
if (columnIndex === -1) {
    previewContent.innerHTML = `Column ${formValues.column} not found`;
    return;
}

const originalData = sharedDataset.rows.slice(0, 5).map(row => row[columnIndex]);

// Apply preview transformation based on current transformation type
let transformedData;

try {
    const transformFunction = document.getElementById('applyTransformation').__transformationFunction;
    const previewConfig = { ...formValues, previewMode: true };
    
    transformedData = previewTransformation(originalData, previewConfig);
    
    // Display preview
    previewContent.innerHTML = `
        <table class="table table-sm">
            <thead>
                <tr>
                    <th>Original Value</th>
                    <th>Transformed Value</th>
                </tr>
            </thead>
            <tbody>
                ${originalData.map((val, i) => `
                    <tr>
                        <td>${val}</td>
                        <td>${transformedData[i]}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
} catch (error) {
    previewContent.innerHTML = `<div class="text-danger">Error generating preview: ${error.message}</div>`;
}
}

function previewTransformation(data, config) {
// Based on the transformation type, apply the appropriate transformation
const transformationType = document.querySelector('#transformation-content h4').textContent;

switch (transformationType) {
    case 'Normalize Data':
        return previewNormalizeData(data);
        
    case 'Scale Data':
        return previewScaleData(data, config.min, config.max);
        
    case 'Log Transformation':
        const base = parseFloat(config.base) || 10;
        const addOne = config.addOne;
        return data.map(val => {
            const value = parseFloat(val);
            if (isNaN(value)) return val;
            return addOne ? Math.log(value + 1) / Math.log(base) : Math.log(value) / Math.log(base);
        });
        
    case 'Square Root Transformation':
        return data.map(val => {
            const value = parseFloat(val);
            if (isNaN(value) || value < 0) return val;
            return Math.sqrt(value);
        });
        
    case 'Exponential Transformation':
        const expBase = parseFloat(config.base) || Math.E;
        return data.map(val => {
            const value = parseFloat(val);
            if (isNaN(value)) return val;
            return Math.pow(expBase, value);
        });
        
    case 'Inverse Transformation':
        return data.map(val => {
            const value = parseFloat(val);
            if (isNaN(value) || value === 0) return val;
            return 1 / value;
        });
        
    case 'Binning':
        // Complex, would need the full dataset for proper binning - just show placeholder
        return data.map(val => `Bin X`);
        
    case 'Absolute Value Transformation':
        return data.map(val => {
            const value = parseFloat(val);
            if (isNaN(value)) return val;
            return Math.abs(value);
        });
        
    case 'Custom Transformation':
        try {
            const expr = config.expression || 'x';
            return data.map(val => {
                const x = parseFloat(val);
                if (isNaN(x)) return val;
                return eval(expr);
            });
        } catch (e) {
            return data.map(() => 'Error in expression');
        }
        
    default:
        return data.map(val => `${val} (transformed)`);
}
}

function previewNormalizeData(data) {
const values = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
if (values.length === 0) return data;

const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

return data.map(val => {
    const value = parseFloat(val);
    if (isNaN(value)) return val;
    return ((value - mean) / stdDev).toFixed(2);
});
}

function previewScaleData(data, targetMin = 0, targetMax = 1) {
const values = data.map(val => parseFloat(val)).filter(val => !isNaN(val));
if (values.length === 0) return data;

const min = Math.min(...values);
const max = Math.max(...values);
const range = max - min;

return data.map(val => {
    const value = parseFloat(val);
    if (isNaN(value)) return val;
    return (((value - min) / range) * (targetMax - targetMin) + targetMin).toFixed(2);
});
}

function getFormValues(formId) {
const form = document.getElementById(formId);
if (!form) return {};

const values = {};

// Process all inputs, selects, and checkboxes
form.querySelectorAll('input, select').forEach(el => {
    if (el.type === 'checkbox') {
        values[el.id] = el.checked;
    } else if (el.type === 'number') {
        values[el.id] = el.value === '' ? null : parseFloat(el.value);
    } else {
        values[el.id] = el.value;
    }
});

return values;
}

// Implement actual transformation functions
function normalizeData() {
const values = getFormValues('transformationForm');
const column = values.column;

if (!DataValidator.isColumnValid(column)) return null;

const columnIndex = sharedDataset.headers.indexOf(column);
if (!DataValidator.hasNumericData(columnIndex)) return null;

const numericValues = getColumnData(columnIndex).sort((a, b) => a - b);

const lowerIndex = Math.floor(lowerPercentile * numericValues.length);
const upperIndex = Math.floor(upperPercentile * numericValues.length);

const lowerCap = numericValues[lowerIndex];
const upperCap = numericValues[upperIndex];

let affectedRows = 0;

sharedDataset.rows = sharedDataset.rows.map(row => {
    const value = parseFloat(row[columnIndex]);
    if (!isNaN(value)) {
        const cappedValue = Math.max(lowerCap, Math.min(value, upperCap));
        row[columnIndex] = cappedValue.toFixed(4);
        if (value !== cappedValue) affectedRows++;
    }
    return row;
});

return { affectedRows };
}Index)) return null;

const numericValues = getColumnData(columnIndex);

const mean = calculateMean(numericValues);
const stdDev = calculateStdDev(numericValues, mean);

if (stdDev === 0) {
    ErrorHandler.showError('Cannot normalize: Standard deviation is zero (all values are the same).');
    return null;
}

let affectedRows = 0;

sharedDataset.rows = sharedDataset.rows.map(row => {
    const value = parseFloat(row[columnIndex]);
    if (!isNaN(value)) {
        row[columnIndex] = ((value - mean) / stdDev).toFixed(4);
        affectedRows++;
    }
    return row;
});

return { affectedRows };
}

function scaleData() {
const values = getFormValues('transformationForm');
const column = values.column;
const targetMin = values.min !== null ? values.min : 0;
const targetMax = values.max !== null ? values.max : 1;

if (!DataValidator.isColumnValid(column)) return null;

const columnIndex = sharedDataset.headers.indexOf(column);
if (!DataValidator.hasNumericData(columnIndex)) return null;

const numericValues = getColumnData(columnIndex);

const min = Math.min(...numericValues);
const max = Math.max(...numericValues);

if (min === max) {
    ErrorHandler.showError('Cannot scale: All values are the same.');
    return null;
}

let affectedRows = 0;

sharedDataset.rows = sharedDataset.rows.map(row => {
    const value = parseFloat(row[columnIndex]);
    if (!isNaN(value)) {
        row[columnIndex] = (((value - min) / (max - min)) * (targetMax - targetMin) + targetMin).toFixed(4);
        affectedRows++;
    }
    return row;
});

return { affectedRows };
}

function logTransformation() {
const values = getFormValues('transformationForm');
const column = values.column;
const base = values.base !== null ? values.base : 10;
const addOne = values.addOne;

if (!DataValidator.isColumnValid(column)) return null;

const columnIndex = sharedDataset.headers.indexOf(column);
if (!DataValidator.hasNumericData(columnIndex)) return null;

let affectedRows = 0;

sharedDataset.rows = sharedDataset.rows.map(row => {
    const value = parseFloat(row[columnIndex]);
    if (!isNaN(value)) {
        // Skip negative values for log
        if (addOne || value > 0) {
            const logValue = addOne ? 
                Math.log(value + 1) / Math.log(base) : 
                Math.log(value) / Math.log(base);
            row[columnIndex] = logValue.toFixed(4);
            affectedRows++;
        }
    }
    return row;
});

return { affectedRows };
}

function customTransformation() {
const values = getFormValues('transformationForm');
const column = values.column;
const expression = values.expression;

if (!DataValidator.isColumnValid(column)) return null;
if (!expression) {
    ErrorHandler.showError('No transformation expression provided.');
    return null;
}

const columnIndex = sharedDataset.headers.indexOf(column);
if (!DataValidator.hasNumericData(columnIndex)) return null;

let affectedRows = 0;

try {
    // Validate expression with a test value
    const testValue = 5;
    const x = testValue;
    eval(expression);
    
    sharedDataset.rows = sharedDataset.rows.map(row => {
        const value = parseFloat(row[columnIndex]);
        if (!isNaN(value)) {
            try {
                const x = value;
                const result = eval(expression);
                row[columnIndex] = isFinite(result) ? result.toFixed(4) : 'Error';
                affectedRows++;
            } catch (e) {
                row[columnIndex] = 'Error';
            }
        }
        return row;
    });
} catch (error) {
    ErrorHandler.showError(`Invalid transformation expression: ${error.message}`);
    return null;
}

return { affectedRows };
}

function sqrtTransformation() {
const values = getFormValues('transformationForm');
const column = values.column;

if (!DataValidator.isColumnValid(column)) return null;

const columnIndex = sharedDataset.headers.indexOf(column);
if (!DataValidator.hasNumericData(columnIndex)) return null;

let affectedRows = 0;

sharedDataset.rows = sharedDataset.rows.map(row => {
    const value = parseFloat(row[columnIndex]);
    if (!isNaN(value) && value >= 0) {
        row[columnIndex] = Math.sqrt(value).toFixed(4);
        affectedRows++;
    }
    return row;
});

return { affectedRows };
}

function expTransformation() {
const values = getFormValues('transformationForm');
const column = values.column;
const base = values.base !== null ? values.base : Math.E;

if (!DataValidator.isColumnValid(column)) return null;

const columnIndex = sharedDataset.headers.indexOf(column);
if (!DataValidator.hasNumericData(columnIndex)) return null;

let affectedRows = 0;

sharedDataset.rows = sharedDataset.rows.map(row => {
    const value = parseFloat(row[columnIndex]);
    if (!isNaN(value)) {
        const result = Math.pow(base, value);
        if (isFinite(result)) {
            row[columnIndex] = result.toFixed(4);
            affectedRows++;
        } else {
            row[columnIndex] = 'Overflow';
        }
    }
    return row;
});

return { affectedRows };
}

function inverseTransformation() {
const values = getFormValues('transformationForm');
const column = values.column;

if (!DataValidator.isColumnValid(column)) return null;

const columnIndex = sharedDataset.headers.indexOf(column);
if (!DataValidator.hasNumericData(columnIndex)) return null;

let affectedRows = 0;

sharedDataset.rows = sharedDataset.rows.map(row => {
    const value = parseFloat(row[columnIndex]);
    if (!isNaN(value) && value !== 0) {
        row[columnIndex] = (1 / value).toFixed(4);
        affectedRows++;
    }
    return row;
});

return { affectedRows };
}

function binningData() {
const values = getFormValues('transformationForm');
const column = values.column;
const bins = parseInt(values.bins) || 5;
const method = values.method || 'equal_width';

if (!DataValidator.isColumnValid(column)) return null;
if (bins <= 0) {
    ErrorHandler.showError('Number of bins must be positive.');
    return null;
}

const columnIndex = sharedDataset.headers.indexOf(column);
if (!DataValidator.hasNumericData(columnIndex)) return null;

const numericValues = getColumnData(columnIndex);
let breakpoints = [];

if (method === 'equal_width') {
    // Equal width binning
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    const width = (max - min) / bins;
    
    breakpoints = Array(bins + 1).fill(0).map((_, i) => min + width * i);
} else if (method === 'equal_freq') {
    // Equal frequency binning
    const sortedValues = [...numericValues].sort((a, b) => a - b);
    const step = sortedValues.length / bins;
    
    breakpoints = Array(bins + 1).fill(0).map((_, i) => {
        const index = Math.min(Math.floor(i * step), sortedValues.length - 1);
        return sortedValues[index];
    });
    
    // Ensure the last breakpoint is slightly larger than the max value
    breakpoints[bins] = sortedValues[sortedValues.length - 1] * 1.001;
} else if (method === 'custom') {
    // Custom breakpoints
    const customBreaksStr = values.customBreaks || '';
    breakpoints = customBreaksStr.split(',')
        .map(b => parseFloat(b.trim()))
        .filter(b => !isNaN(b))
        .sort((a, b) => a - b);
    
    if (breakpoints.length < 2) {
        ErrorHandler.showError('At least two custom breakpoints are required.');
        return null;
    }
}

let affectedRows = 0;

sharedDataset.rows = sharedDataset.rows.map(row => {
    const value = parseFloat(row[columnIndex]);
    if (!isNaN(value)) {
        // Find the bin this value belongs to
        let binIndex = 0;
        while (binIndex < breakpoints.length - 1 && value > breakpoints[binIndex + 1]) {
            binIndex++;
        }
        
        // Assign bin label
        if (binIndex < breakpoints.length - 1) {
            row[columnIndex] = `Bin ${binIndex + 1}`;
            affectedRows++;
        }
    }
    return row;
});

return { affectedRows };
}

function absoluteValueTransformation() {
const values = getFormValues('transformationForm');
const column = values.column;

if (!DataValidator.isColumnValid(column)) return null;

const columnIndex = sharedDataset.headers.indexOf(column);
if (!DataValidator.hasNumericData(columnIndex)) return null;

let affectedRows = 0;

sharedDataset.rows = sharedDataset.rows.map(row => {
    const value = parseFloat(row[columnIndex]);
    if (!isNaN(value)) {
        row[columnIndex] = Math.abs(value).toFixed(4);
        affectedRows++;
    }
    return row;
});

return { affectedRows };
}

function cappingTransformation() {
const values = getFormValues('transformationForm');
const column = values.column;
const lowerPercentile = values.lowerPercentile !== null ? values.lowerPercentile / 100 : 0.05;
const upperPercentile = values.upperPercentile !== null ? values.upperPercentile / 100 : 0.95;

if (!DataValidator.isColumnValid(column)) return null;
if (lowerPercentile >= upperPercentile) {
    ErrorHandler.showError('Lower percentile must be less than upper percentile.');
    return null;
}

const columnIndex = sharedDataset.headers.indexOf(column);
if (!DataValidator.hasNumericData(columndocument.addEventListener('DOMContentLoaded', () => {
const dynamicContent = document.getElementById('dynamicMenuContent');
let sharedDataset = { headers: [], rows: [] };
let currentChart = null;

// ======== TOOLBAR HANDLERS ========
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
                    <div id="loader" class="text-center d-none">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
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

// ======== ERROR HANDLING UTILITIES ========
const ErrorHandler = {
    showError: function(message, container = null) {
        console.error(message);
        if (container) {
            container.innerHTML = `
                <div class="alert alert-danger">
                    <strong>Error:</strong> ${message}
                </div>`;
        } else {
            alert(message);
        }
    },
    
    handlePromiseError: function(error, container = null) {
        const message = error.message || 'An unexpected error occurred';
        this.showError(message, container);
    }
};

// ======== DATA VALIDATION UTILITIES ========
const DataValidator = {
    hasData: function() {
        if (!sharedDataset.headers.length || !sharedDataset.rows.length) {
            ErrorHandler.showError('No data available. Please upload data first.');
            return false;
        }
        return true;
    },
    
    isColumnValid: function(column) {
        if (!sharedDataset.headers.includes(column)) {
            ErrorHandler.showError(`Column "${column}" does not exist in the dataset.`);
            return false;
        }
        return true;
    },
    
    hasNumericData: function(columnIndex) {
        const values = getColumnData(columnIndex);
        if (!values.length) {
            ErrorHandler.showError(`Column contains no valid numeric data.`);
            return false;
        }
        return true;
    },
    
    validateRequiredLibrar                y: { 
                title: { display: true, text: yColumn },
                min: -1.5,
                max: 1.5,
                ticks: {
                    callback: function(value) {
                        if (value === -1 || value === 1) return value;
                        return '';
                    }
                },
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            },
        },
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        }
    },
});
}

// Plot DBSCAN Results
function plotDBSCANResults(xValues, yValues, clusterLabels, centroids, xColumn, yColumn) {
// Similar to plotClusteringResults but with special handling for noise points
plotClusteringResults(xValues, yValues, clusterLabels, centroids, xColumn, yColumn);
} function(libraryName, libraryObj) {
        if (!libraryObj) {
            ErrorHandler.showError(`Required library ${libraryName} is not loaded.`);
            return false;
        }
        return true;
    }
};

// ======== UI UTILITIES ========
const UI = {
    showLoader: function(show = true) {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.toggle('d-none', !show);
        }
    },
    
    updateStatus: function(message, isError = false) {
        const statusClass = isError ? 'alert-danger' : 'alert-success';
        const statusElement = document.createElement('div');
        statusElement.className = `alert ${statusClass} alert-dismissible fade show`;
        statusElement.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        // Find an appropriate container
        const container = document.getElementById('transformationOutput') || 
                         document.getElementById('model-content') || 
                         dynamicContent;
        
        if (container) {
            container.prepend(statusElement);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                statusElement.remove();
            }, 5000);
        }
    }
};

// ======== ATTACH TOOLBAR EVENT LISTENERS ========
Object.keys(toolbarHandlers).forEach(id => {
    const button = document.getElementById(id);
    if (button) {
        button.addEventListener('click', () => {
            dynamicContent.innerHTML = toolbarHandlers[id];
            setTimeout(() => {
                if (id === 'toolbar-predictions') {
                    implementPredictionFunctionality();
                } else if (id === 'toolbar-transformations') {
                    implementTransformationFunctionality();
                }
            }, 0);
        });
    } else {
        console.warn(`Button with ID ${id} not found.`);
    }
});

// ======== PREDICTION MODELS IMPLEMENTATION ========
function implementPredictionFunctionality() {
    // Connect event listeners to model options
    document.getElementById('linearRegression')?.addEventListener('click', () => handleModelClick('Linear Regression', performLinearRegression));
    document.getElementById('logisticRegression')?.addEventListener('click', () => handleModelClick('Logistic Regression', performLogisticRegression));
    document.getElementById('decisionTree')?.addEventListener('click', () => handleModelClick('Decision Tree', performDecisionTree));
    document.getElementById('randomForest')?.addEventListener('click', () => handleModelClick('Random Forest', performRandomForest));
    document.getElementById('svm')?.addEventListener('click', () => handleModelClick('Support Vector Machine (SVM)', performSVM));
    document.getElementById('kMeansClustering')?.addEventListener('click', () => handleModelClick('K-Means Clustering', performKMeansClustering));
    document.getElementById('pca')?.addEventListener('click', () => handleModelClick('Principal Component Analysis (PCA)', performPCA));
    document.getElementById('hierarchicalClustering')?.addEventListener('click', () => handleModelClick('Hierarchical Clustering', performHierarchicalClustering));
    document.getElementById('dbscan')?.addEventListener('click', () => handleModelClick('DBSCAN', performDBSCAN));
}

function handleModelClick(modelName, modelFunction) {
    if (!DataValidator.hasData()) return;
    
    const modelContent = document.getElementById('model-content');
    modelContent.innerHTML = `
        <div class="row">
            <div class="col-md-4 bg-dark text-light p-3">
                <h4 class="text-light">${modelName}</h4>
                <div class="mb-3">
                    <label for="x-axis" class="form-label">X-axis:</label>
                    <select id="x-axis" class="form-select">
                        ${sharedDataset.headers.map(header => `<option>${header}</option>`).join('')}
                    </select>
                </div>
                <div class="mb-3">
                    <label for="y-axis" class="form-label">Y-axis:</label>
                    <select id="y-axis" class="form-select">
                        ${sharedDataset.headers.map(header => `<option>${header}</option>`).join('')}
                    </select>
                </div>
                
                <div id="model-specific-options" class="mb-3">
                    <!-- Model-specific options will be inserted here -->
                </div>
                
                <button class="btn btn-primary w-100" id="plotButton">Apply Model</button>
            </div>
            <div class="col-md-8 bg-white p-3">
                <div id="model-description" class="mb-3">
                    ${getModelDescription(modelName)}
                </div>
                <div id="model-results" class="d-none">
                    <h5>Model Results</h5>
                    <div id="model-metrics" class="mb-3"></div>
                    <canvas id="chartCanvas" style="width: 100%; height: 300px;"></canvas>
                </div>
                <div id="loader" class="text-center d-none">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        </div>`;

    // Add model-specific options
    addModelSpecificOptions(modelName);

    // Attach event listener to plot button
    document.getElementById('plotButton').addEventListener('click', async () => {
        try {
            UI.showLoader(true);
            if (currentChart) currentChart.destroy();
            await modelFunction();
            document.getElementById('model-results').classList.remove('d-none');
        } catch (error) {
            ErrorHandler.handlePromiseError(error, document.getElementById('model-metrics'));
        } finally {
            UI.showLoader(false);
        }
    });
}

function addModelSpecificOptions(modelName) {
    const optionsContainer = document.getElementById('model-specific-options');
    if (!optionsContainer) return;
    
    switch(modelName) {
        case 'Linear Regression':
            optionsContainer.innerHTML = `
                <div class="mb-3">
                    <label for="lr-learning-rate" class="form-label">Learning Rate:</label>
                    <input type="number" id="lr-learning-rate" class="form-control" value="0.03" min="0.001" max="1" step="0.001">
                </div>
                <div class="mb-3">
                    <label for="lr-epochs" class="form-label">Epochs:</label>
                    <input type="number" id="lr-epochs" class="form-control" value="100" min="10" max="1000" step="10">
                </div>`;
            break;
            
        case 'K-Means Clustering':
            optionsContainer.innerHTML = `
                <div class="mb-3">
                    <label for="km-clusters" class="form-label">Number of Clusters:</label>
                    <input type="number" id="km-clusters" class="form-control" value="3" min="2" max="10" step="1">
                </div>
                <div class="mb-3">
                    <label for="km-iterations" class="form-label">Max Iterations:</label>
                    <input type="number" id="km-iterations" class="form-control" value="100" min="10" max="500" step="10">
                </div>`;
            break;
            
        // Add more model-specific options as needed
        default:
            optionsContainer.innerHTML = ''; // No specific options
    }
}

function getModelDescription(modelName) {
    const descriptions = {
        'Linear Regression': 'Linear regression attempts to model the relationship between two variables by fitting a linear equation to observed data. It predicts a dependent variable based on one or more independent variables.',
        'Logistic Regression': 'Logistic regression is used when the dependent variable is categorical. It estimates the probability that a given input point belongs to a certain class.',
        'Decision Tree': 'Decision trees use a tree-like model of decisions. They split the data into branches to construct a tree for classification or regression tasks.',
        'Random Forest': 'Random forests are an ensemble learning method that constructs multiple decision trees during training and outputs the class that is the mode of the classes of the individual trees.',
        'Support Vector Machine (SVM)': 'SVMs are supervised learning models that analyze data for classification and regression. They find a hyperplane that best divides a dataset into classes.',
        'K-Means Clustering': 'K-means clustering is an unsupervised learning algorithm that groups similar data points together into a predefined number of clusters.',
        'Principal Component Analysis (PCA)': 'PCA is a dimensionality-reduction technique that transforms a large set of variables into a smaller one that still contains most of the information.',
        'Hierarchical Clustering': 'Hierarchical clustering builds a hierarchy of clusters, either bottom-up or top-down, and doesn\'t require specifying the number of clusters beforehand.',
        'DBSCAN': 'DBSCAN is a density-based clustering algorithm that groups together points that are closely packed, while marking points in low-density regions as outliers.'
    };
    
    return descriptions[modelName] || 'No description available for this model.';
}

// Linear Regression using TensorFlow.js
async function performLinearRegression() {
    if (!window.tf) {
        ErrorHandler.showError('TensorFlow.js is required but not loaded. Please include it in your project.');
        return;
    }
    
    const xColumn = document.getElementById('x-axis').value;
    const yColumn = document.getElementById('y-axis').value;
    const learningRate = parseFloat(document.getElementById('lr-learning-rate')?.value || 0.03);
    const epochs = parseInt(document.getElementById('lr-epochs')?.value || 100);
    
    if (!DataValidator.isColumnValid(xColumn) || !DataValidator.isColumnValid(yColumn)) return;
    
    const xIndex = sharedDataset.headers.indexOf(xColumn);
    const yIndex = sharedDataset.headers.indexOf(yColumn);
    
    if (!DataValidator.hasNumericData(xIndex) || !DataValidator.hasNumericData(yIndex)) return;
    
    const xValues = getColumnData(xIndex);
    const yValues = getColumnData(yIndex);
    
    if (xValues.length !== yValues.length) {
        ErrorHandler.showError('X and Y columns must have the same number of valid entries.');
        return;
    }

    // Create and train the model
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
    
    model.compile({ 
        optimizer: tf.train.sgd(learningRate),
        loss: 'meanSquaredError',
        metrics: ['mse', 'mae']
    });

    const xs = tf.tensor2d(xValues, [xValues.length, 1]);
    const ys = tf.tensor2d(yValues, [yValues.length, 1]);

    // Define callbacks for logging
    const metricsContainer = document.getElementById('model-metrics');
    metricsContainer.innerHTML = '<div class="progress mb-3"><div class="progress-bar" role="progressbar" style="width: 0%"></div></div>';
    const progressBar = metricsContainer.querySelector('.progress-bar');
    
    const callbacks = {
        onEpochEnd: (epoch, logs) => {
            const progress = Math.round((epoch + 1) / epochs * 100);
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${progress}%`;
        }
    };

    // Train the model
    const result = await model.fit(xs, ys, { 
        epochs: epochs,
        callbacks: callbacks
    });

    // Make predictions
    const predictions = model.predict(xs).dataSync();
    
    // Calculate metrics
    const mse = result.history.mse[result.history.mse.length - 1];
    const mae = result.history.mae[result.history.mae.length - 1];
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const xRange = xMax - xMin;
    const r2 = calculateR2(yValues, predictions);
    
    // Update metrics display
    metricsContainer.innerHTML = `
        <table class="table table-sm">
            <tr><th>Mean Squared Error (MSE)</th><td>${mse.toFixed(4)}</td></tr>
            <tr><th>Mean Absolute Error (MAE)</th><td>${mae.toFixed(4)}</td></tr>
            <tr><th>R² Score</th><td>${r2.toFixed(4)}</td></tr>
        </table>`;
    
    // Plot results
    plotRegressionResults(xValues, yValues, predictions, xColumn, yColumn);
    
    // Clean up tensors
    xs.dispose();
    ys.dispose();
    
    return { model, mse, mae, r2 };
}

// Logistic Regression using TensorFlow.js
async function performLogisticRegression() {
    if (!window.tf) {
        ErrorHandler.showError('TensorFlow.js is required but not loaded.');
        return;
    }
    
    const xColumn = document.getElementById('x-axis').value;
    const yColumn = document.getElementById('y-axis').value;
    
    if (!DataValidator.isColumnValid(xColumn) || !DataValidator.isColumnValid(yColumn)) return;
    
    const xIndex = sharedDataset.headers.indexOf(xColumn);
    const yIndex = sharedDataset.headers.indexOf(yColumn);
    
    if (!DataValidator.hasNumericData(xIndex) || !DataValidator.hasNumericData(yIndex)) return;
    
    const xValues = getColumnData(xIndex);
    
    // For logistic regression, convert y values to binary (0 or 1)
    const yValues = getColumnData(yIndex).map(val => val > 0.5 ? 1 : 0);
    
    if (xValues.length !== yValues.length) {
        ErrorHandler.showError('X and Y columns must have the same number of valid entries.');
        return;
    }

    // Create and train the model
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 1, inputShape: [1], activation: 'sigmoid' }));
    
    model.compile({ 
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
    });

    const xs = tf.tensor2d(xValues, [xValues.length, 1]);
    const ys = tf.tensor2d(yValues, [yValues.length, 1]);

    // Define callbacks for logging
    const metricsContainer = document.getElementById('model-metrics');
    metricsContainer.innerHTML = '<div class="progress mb-3"><div class="progress-bar" role="progressbar" style="width: 0%"></div></div>';
    const progressBar = metricsContainer.querySelector('.progress-bar');
    
    const callbacks = {
        onEpochEnd: (epoch, logs) => {
            const progress = Math.round((epoch + 1) / 100 * 100);
            progressBar.style.width = `${progress}%`;
            progressBar.textContent = `${progress}%`;
        }
    };

    // Train the model
    const result = await model.fit(xs, ys, { 
        epochs: 100,
        callbacks: callbacks
    });

    // Make predictions
    const predictions = model.predict(xs).dataSync();
    
    // Calculate metrics
    const loss = result.history.loss[result.history.loss.length - 1];
    const accuracy = result.history.acc[result.history.acc.length - 1];
    
    // Update metrics display
    metricsContainer.innerHTML = `
        <table class="table table-sm">
            <tr><th>Loss</th><td>${loss.toFixed(4)}</td></tr>
            <tr><th>Accuracy</th><td>${(accuracy * 100).toFixed(2)}%</td></tr>
        </table>`;
    
    // Plot results
    plotClassificationResults(xValues, yValues, predictions, xColumn, yColumn);
    
    // Clean up tensors
    xs.dispose();
    ys.dispose();
    
    return { model, loss, accuracy };
}

// K-Means Clustering Implementation
async function performKMeansClustering() {
    const xColumn = document.getElementById('x-axis').value;
    const yColumn = document.getElementById('y-axis').value;
    const numClusters = parseInt(document.getElementById('km-clusters')?.value || 3);
    const maxIterations = parseInt(document.getElementById('km-iterations')?.value || 100);
    
    if (!DataValidator.isColumnValid(xColumn) || !DataValidator.isColumnValid(yColumn)) return;
    
    const xIndex = sharedDataset.headers.indexOf(xColumn);
    const yIndex = sharedDataset.headers.indexOf(yColumn);
    
    if (!DataValidator.hasNumericData(xIndex) || !DataValidator.hasNumericData(yIndex)) return;
    
    const xValues = getColumnData(xIndex);
    const yValues = getColumnData(yIndex);
    
    if (xValues.length !== yValues.length) {
        ErrorHandler.showError('X and Y columns must have the same number of valid entries.');
        return;
    }
    
    // Create data points array
    const points = xValues.map((x, i) => [x, yValues[i]]);
    
    // Implement K-means algorithm
    const clusters = await kMeans(points, numClusters, maxIterations);
    
    // Plot results
    plotClusteringResults(xValues, yValues, clusters.assignments, clusters.centroids, xColumn, yColumn);
    
    // Update metrics
    const metricsContainer = document.getElementById('model-metrics');
    metricsContainer.innerHTML = `
        <table class="table table-sm">
            <tr><th>Number of clusters</th><td>${numClusters}</td></tr>
            <tr><th>Iterations performed</th><td>${clusters.iterations}</td></tr>
            <tr><th>Inertia (sum of distances to centroids)</th><td>${clusters.inertia.toFixed(4)}</td></tr>
        </table>`;
    
    return clusters;
}

// K-means clustering algorithm implementation
async function kMeans(points, k, maxIterations = 100) {
    // Initialize centroids randomly
    let centroids = [];
    for (let i = 0; i < k; i++) {
        const randomIndex = Math.floor(Math.random() * points.length);
        centroids.push([...points[randomIndex]]); // Clone the point
    }
    
    let assignments = Array(points.length).fill(0);
    let oldAssignments = Array(points.length).fill(-1);
    let iterations = 0;
    let inertia = Infinity;
    
    // Progress tracking
    const metricsContainer = document.getElementById('model-metrics');
    metricsContainer.innerHTML = '<div class="progress mb-3"><div class="progress-bar" role="progressbar" style="width: 0%"></div></div>';
    const progressBar = metricsContainer.querySelector('.progress-bar');
    
    // Iterate until convergence or max iterations
    while (iterations < maxIterations && !arraysEqual(assignments, oldAssignments)) {
        // Update progress
        const progress = Math.round((iterations + 1) / maxIterations * 100);
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `${progress}%`;
        
        // Store old assignments for convergence check
        oldAssignments = [...assignments];
        
        // Assign points to nearest centroid
        for (let i = 0; i < points.length; i++) {
            let minDist = Infinity;
            let minIndex = 0;
            
            for (let j = 0; j < centroids.length; j++) {
                const dist = euclideanDistance(points[i], centroids[j]);
                if (dist < minDist) {
                    minDist = dist;
                    minIndex = j;
                }
            }
            
            assignments[i] = minIndex;
        }
        
        // Update centroids
        for (let j = 0; j < centroids.length; j++) {
            const clusterPoints = points.filter((_, i) => assignments[i] === j);
            
            if (clusterPoints.length > 0) {
                // Calculate mean position
                const newCentroid = [0, 0];
                for (const point of clusterPoints) {
                    newCentroid[0] += point[0];
                    newCentroid[1] += point[1];
                }
                newCentroid[0] /= clusterPoints.length;
                newCentroid[1] /= clusterPoints.length;
                centroids[j] = newCentroid;
            }
        }
        
        // Slight delay to allow UI updates
        await new Promise(resolve => setTimeout(resolve, 10));
        
        iterations++;
    }
    
    // Calculate inertia (sum of squared distances to centroids)
    inertia = 0;
    for (let i = 0; i < points.length; i++) {
        const centroidIndex = assignments[i];
        inertia += Math.pow(euclideanDistance(points[i], centroids[centroidIndex]), 2);
    }
    
    return { centroids, assignments, iterations, inertia };
}

// Helper function to calculate Euclidean distance
function euclideanDistance(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

// Helper function to check if arrays are equal
function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    return true;
}

// PCA Implementation
async function performPCA() {
    const xColumn = document.getElementById('x-axis').value;
    const yColumn = document.getElementById('y-axis').value;
    
    if (!DataValidator.isColumnValid(xColumn) || !DataValidator.isColumnValid(yColumn)) return;
    
    const xIndex = sharedDataset.headers.indexOf(xColumn);
    const yIndex = sharedDataset.headers.indexOf(yColumn);
    
    if (!DataValidator.hasNumericData(xIndex) || !DataValidator.hasNumericData(yIndex)) return;
    
    const xValues = getColumnData(xIndex);
    const yValues = getColumnData(yIndex);
    
    if (xValues.length !== yValues.length) {
        ErrorHandler.showError('X and Y columns must have the same number of valid entries.');
        return;
    }
    
    // Create data matrix
    const dataMatrix = xValues.map((x, i) => [x, yValues[i]]);
    
    // Standardize the data
    const standardizedData = standardizeData(dataMatrix);
    
    // Calculate covariance matrix
    const covMatrix = calculateCovMatrix(standardizedData);
    
    // Calculate eigenvectors and eigenvalues
    const { eigenvectors, eigenvalues } = calculateEigens(covMatrix);
    
    // Sort eigenvectors by descending eigenvalues
    const sortedIndices = eigenvalues.map((val, idx) => [val, idx])
                                    .sort((a, b) => b[0] - a[0])
                                    .map(pair => pair[1]);
    
    const sortedEigenvectors = sortedIndices.map(idx => eigenvectors[idx]);
    const sortedEigenvalues = sortedIndices.map(idx => eigenvalues[idx]);
    
    // Project data onto principal components
    const pcaData = projectData(standardizedData, sortedEigenvectors);
    
    // Calculate explained variance
    const totalVariance = eigenvalues.reduce((sum, val) => sum + val, 0);
    const explainedVariance = eigenvalues.map(val => val / totalVariance * 100);
    
    // Plot PCA results
    plotPCAResults(standardizedData, pcaData, sortedEigenvectors, explainedVariance, xColumn, yColumn);
    
    // Update metrics
    const metricsContainer = document.getElementById('model-metrics');
    metricsContainer.innerHTML = `
        <table class="table table-sm">
            <tr><th>Principal Component 1 Explained Variance</th><td>${explainedVariance[0].toFixed(2)}%</td></tr>
            <tr><th>Principal Component 2 Explained Variance</th><td>${explainedVariance[1].toFixed(2)}%</td></tr>
            <tr><th>Total Explained Variance</th><td>${(explainedVariance[0] + explainedVariance[1]).toFixed(2)}%</td></tr>
        </table>`;
    
    return { eigenvectors: sortedEigenvectors, eigenvalues: sortedEigenvalues, pcaData, explainedVariance };
}

// Helper functions for PCA
function standardizeData(data) {
    // Calculate means for each feature
    const means = [0, 0];
    for (const point of data) {
        means[0] += point[0];
        means[1] += point[1];
    }
    means[0] /= data.length;
    means[1] /= data.length;
    
    // Calculate standard deviations
    const stds = [0, 0];
    for (const point of data) {
        stds[0] += Math.pow(point[0] - means[0], 2);
        stds[1] += Math.pow(point[1] - means[1], 2);
    }
    stds[0] = Math.sqrt(stds[0] / data.length);
    stds[1] = Math.sqrt(stds[1] / data.length);
    
    // Standardize data
    return data.map(point => [
        (point[0] - means[0]) / stds[0],
        (point[1] - means[1]) / stds[1]
    ]);
}

function calculateCovMatrix(data) {
    const n = data.length;
    const covMatrix = [
        [0, 0],
        [0, 0]
    ];
    
    // Calculate covariance matrix
    for (const point of data) {
        covMatrix[0][0] += point[0] * point[0];
        covMatrix[0][1] += point[0] * point[1];
        covMatrix[1][0] += point[1] * point[0];
        covMatrix[1][1] += point[1] * point[1];
    }
    
    covMatrix[0][0] /= n;
    covMatrix[0][1] /= n;
    covMatrix[1][0] /= n;
    covMatrix[1][1] /= n;
    
    return covMatrix;
}

function calculateEigens(matrix) {
    // For 2x2 matrix, we can directly calculate eigenvalues and eigenvectors
    const a = matrix[0][0];
    const b = matrix[0][1];
    const c = matrix[1][0];
    const d = matrix[1][1];
    
    // Calculate eigenvalues
    const trace = a + d;
    const determinant = a * d - b * c;
    const discriminant = Math.sqrt(trace * trace - 4 * determinant);
    
    const eigenvalue1 = (trace + discriminant) / 2;
    const eigenvalue2 = (trace - discriminant) / 2;
    
    // Calculate eigenvectors
    let eigenvector1, eigenvector2;
    
    if (b !== 0) {
        eigenvector1 = [eigenvalue1 - d, c];
        eigenvector2 = [eigenvalue2 - d, c];
    } else if (c !== 0) {
        eigenvector1 = [b, eigenvalue1 - a];
        eigenvector2 = [b, eigenvalue2 - a];
    } else {
        eigenvector1 = [1, 0];
        eigenvector2 = [0, 1];
    }
    
    // Normalize eigenvectors
    const norm1 = Math.sqrt(eigenvector1[0] * eigenvector1[0] + eigenvector1[1] * eigenvector1[1]);
    const norm2 = Math.sqrt(eigenvector2[0] * eigenvector2[0] + eigenvector2[1] * eigenvector2[1]);
    
    eigenvector1 = [eigenvector1[0] / norm1, eigenvector1[1] / norm1];
    eigenvector2 = [eigenvector2[0] / norm2, eigenvector2[1] / norm2];
    
    return {
        eigenvalues: [eigenvalue1, eigenvalue2],
        eigenvectors: [eigenvector1, eigenvector2]
    };
}

function projectData(data, eigenvectors) {
    // Project data onto principal components
    return data.map(point => [
        point[0] * eigenvectors[0][0] + point[1] * eigenvectors[0][1],
        point[0] * eigenvectors[1][0] + point[1] * eigenvectors[1][1]
    ]);
}