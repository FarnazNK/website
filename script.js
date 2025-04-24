document.addEventListener('DOMContentLoaded', () => {
    const dynamicContent = document.getElementById('dynamicMenuContent');
    let sharedDataset = { headers: [], rows: [] };

    // UI components for different toolbar sections
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
                        <li class="list-group-item menu-item" id="menu-identify-types">Identify Column Types</li>
                    </ul>
                </div>
                <div class="col-md-9 bg-light p-3 rounded shadow-sm" id="data-content">
                    <h4 class="text-center" style="color: black;">Select a menu item to see options</h4>
                </div>
            </div>`;
        },
        'toolbar-plots': function() {
            return `
            <section style="background: linear-gradient(115deg, #6dcfe7, #1e1e1e);">
                <div class="container py-4">
                    <div class="row">
                        <div class="col-3 bg-dark text-light p-3 rounded shadow-sm">
                            <h4>Plot Options</h4>
                            <label>Select X-Axis:</label>
                            <select id="xAxisColumn" class="form-control mb-3">
                                ${sharedDataset.headers.map(header => 
                                    `<option value="${header}">${header}</option>`).join('')}
                            </select>
                            <label>Select Y-Axis:</label>
                            <select id="yAxisColumn" class="form-control mb-3">
                                ${sharedDataset.headers.map(header => 
                                    `<option value="${header}">${header}</option>`).join('')}
                            </select>
                            <label>Chart Type:</label>
                            <select id="chartType" class="form-control mb-3">
                                <option value="bar">Bar Chart</option>
                                <option value="line">Line Chart</option>
                                <option value="scatter">Scatter Plot</option>
                                <option value="pie">Pie Chart</option>
                                <option value="doughnut">Doughnut Chart</option>
                            </select>
                            <label>Chart Label:</label>
                            <input type="text" id="chartLabel" class="form-control mb-3" placeholder="Enter label (optional)">
                            <label>Chart Color:</label>
                            <input type="color" id="chartColor" class="form-control mb-3" value="#4b9cdf">
                            <label>Show Legend:</label>
                            <select id="showLegend" class="form-control mb-3">
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                            <button class="btn btn-primary w-100 mb-2" id="generateChart">Generate Chart</button>
                        </div>
                        <div class="col-9">
                            <div id="chartsContainer" class="d-flex flex-wrap gap-3"></div>
                        </div>
                    </div>
                </div>
            </section>`;
        },
        'toolbar-statistics': function() {
            return `
            <section style="background: linear-gradient(115deg, #6dcfe7, #1e1e1e);">
                <div class="container-fluid py-4">
                    <h4 class="text-light">Statistics Section</h4>
                    <div class="row">
                        <div class="col-md-12 bg-dark text-light p-3 rounded shadow-sm">
                            <h5>Summary Statistics</h5>
                            <div class="row mb-3">
                                <div class="col-md-8">
                                    <select id="statsColumn" class="form-control" multiple size="5">
                                        ${sharedDataset.headers.map(header => 
                                            `<option value="${header}">${header}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="optionMean" checked>
                                        <label class="form-check-label" for="optionMean">Mean</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="optionMedian" checked>
                                        <label class="form-check-label" for="optionMedian">Median</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="optionStdDev" checked>
                                        <label class="form-check-label" for="optionStdDev">Standard Deviation</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="optionOutliers" checked>
                                        <label class="form-check-label" for="optionOutliers">Outliers</label>
                                    </div>
                                </div>
                            </div>
                            <button class="btn btn-primary mb-3" id="generateStats">Generate Statistics</button>
                            <div id="statsResult" class="table-responsive text-light"></div>
                        </div>
                    </div>
                </div>
            </section>`;
        }
    };

    // Attach Event Listeners to Toolbar Buttons
    document.getElementById('toolbar-data').addEventListener('click', () => {
        dynamicContent.innerHTML = toolbarHandlers['toolbar-data']();
        attachDataMenuEventListeners();
    });

    document.getElementById('toolbar-plots').addEventListener('click', () => {
        if (!sharedDataset.headers.length) {
            alert('No data available. Please load data in the Data section first.');
            dynamicContent.innerHTML = toolbarHandlers['toolbar-data']();
            attachDataMenuEventListeners();
            return;
        }
        dynamicContent.innerHTML = toolbarHandlers['toolbar-plots']();
        implementPlotFunctionality();
    });

    document.getElementById('toolbar-statistics').addEventListener('click', () => {
        if (!sharedDataset.headers.length) {
            alert('No data available. Please load data in the Data section first.');
            dynamicContent.innerHTML = toolbarHandlers['toolbar-data']();
            attachDataMenuEventListeners();
            return;
        }
        dynamicContent.innerHTML = toolbarHandlers['toolbar-statistics']();
        implementStatisticsFunctionality();
    });

    // Data Section Event Listeners
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
            <div class="table-container bg-dark rounded p-3">
                <table class="table table-bordered">
                    <thead class="bg-primary text-white">
                        <tr>
                            <th>Column Name</th>
                            <th>Detected Type</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${columnTypes.map(col => `
                            <tr style="background-color: #f8f9fa; color: #212529;">
                                <td>${col.column}</td>
                                <td>${col.type}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;

        document.getElementById('data-content').innerHTML = tableHTML;
    }

    // Function to Detect Column Type
    function detectColumnType(values) {
        let uniqueValues = [...new Set(values.filter(v => v !== ""))]; 
        let numValues = uniqueValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
        
        if (uniqueValues.length === 2 && uniqueValues.every(v => 
            v.toString().toLowerCase() === "true" || 
            v.toString().toLowerCase() === "false" || 
            v === "0" || v === "1" || v === 0 || v === 1)) {
            return "Boolean";
        }
        
        if (numValues.length === uniqueValues.length) {
            return numValues.some(v => v % 1 !== 0) ? "Numerical (Float)" : "Numerical (Integer)";
        }
        
        if (uniqueValues.every(v => !isNaN(Date.parse(v)))) {
            return "Date/Time";
        }
        
        if (uniqueValues.length < Math.min(10, values.length * 0.1)) {
            return "Categorical";
        }
        
        return "Text";
    }
    
    // Load Data Section
    function loadDataSection() {
        document.getElementById('data-content').innerHTML = `
            <div class="p-3 text-center">
                <button class="btn btn-primary mb-3" id="load-data-button">
                    <i class="bi bi-upload"></i> Upload Data File
                </button>
                <p class="text-muted">Supported formats: CSV, Excel (.xlsx, .xls)</p>
            </div>
            <div id="data-preview"></div>
        `;
        
        document.getElementById('load-data-button').addEventListener('click', triggerFileDialogAndLoadData);
    }
    
    // File Dialog and Load Data Function
    function triggerFileDialogAndLoadData() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.csv, .xlsx, .xls';
        fileInput.style.display = 'none';

        document.body.appendChild(fileInput);

        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0];
            if (!file) {
                alert('No file selected. Please upload a valid dataset.');
                document.body.removeChild(fileInput);
                return;
            }

            const fileExtension = file.name.split('.').pop().toLowerCase();
            const reader = new FileReader();

            if (fileExtension === 'csv') {
                // Handle CSV File
                reader.onload = (event) => {
                    processCSV(event.target.result);
                };
                reader.readAsText(file);
            } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                // Handle Excel File (assuming XLSX library is included)
                reader.onload = async (event) => {
                    try {
                        const data = new Uint8Array(event.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });

                        // Assuming the first sheet is used
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                        processExcel(jsonData);
                    } catch (error) {
                        alert(`Error processing Excel file: ${error.message}`);
                    }
                };
                reader.readAsArrayBuffer(file);
            } else {
                alert('Invalid file type. Please upload a CSV or Excel file.');
            }

            document.body.removeChild(fileInput);
        });

        fileInput.click();
    }

    // Process CSV Data
    function processCSV(content) {
        if (!content.trim()) {
            alert('The file is empty. Please upload a valid dataset.');
            return;
        }

        try {
            // More robust CSV parsing
            const rows = [];
            const lines = content.split(/\r?\n/);
            
            for (const line of lines) {
                if (!line.trim()) continue;
                
                // Handle quoted values with commas
                const pattern = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
                const matches = [];
                let match;
                
                while ((match = pattern.exec(line)) !== null) {
                    let value = match[1];
                    // Remove quotes if present
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.substring(1, value.length - 1);
                    }
                    matches.push(value);
                }
                
                rows.push(matches.length ? matches : line.split(','));
            }
            
            if (!rows.length) {
                throw new Error("No valid data found in CSV");
            }
            
            updateSharedDataset(rows);
        } catch (error) {
            alert(`Error processing CSV: ${error.message}`);
        }
    }

    // Process Excel Data
    function processExcel(jsonData) {
        if (!jsonData.length) {
            alert('The Excel file is empty. Please upload a valid dataset.');
            return;
        }

        updateSharedDataset(jsonData);
    }

    // Update Global Dataset & Display Table
    function updateSharedDataset(rows) {
        sharedDataset.headers = rows[0].map(h => h.trim()); // First row as headers
        sharedDataset.rows = rows.slice(1); // Remaining rows as data

        // Save dataset for persistence (Optional)
        localStorage.setItem('savedDataset', JSON.stringify(sharedDataset));

        displayDataTable();
    }

    // Display Data Table
    function displayDataTable() {
        document.getElementById('data-content').innerHTML = `
            <div class="table-container bg-dark rounded p-3">
                <table class="table table-dark table-striped">
                    <thead id="tableHead"></thead>
                    <tbody id="tableBody"></tbody>
                </table>
            </div>`;

        const tableHead = document.getElementById('tableHead');
        tableHead.innerHTML = `<tr>${sharedDataset.headers.map(header => `<th>${header}</th>`).join('')}</tr>`;

        const tableBody = document.getElementById('tableBody');
        tableBody.innerHTML = sharedDataset.rows.map(row => {
            return `<tr>${row.map(cell => `<td>${cell ? cell.toString().trim() : ''}</td>`).join('')}</tr>`;
        }).join('');

        alert('Data loaded successfully!');
    }

    // Clean Data Section
    function cleanDataSection() {
        document.getElementById('data-content').innerHTML = `
            <div class="card bg-dark text-light mb-3">
                <div class="card-header">Data Cleaning Options</div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <button class="btn btn-outline-light mb-2 w-100" id="remove-missing">Remove Missing Values</button>
                            <button class="btn btn-outline-light mb-2 w-100" id="remove-duplicates">Remove Duplicate Rows</button>
                            <button class="btn btn-outline-light mb-2 w-100" id="trim-spaces">Trim Spaces</button>
                        </div>
                        <div class="col-md-6">
                            <button class="btn btn-outline-light mb-2 w-100" id="convert-lowercase">Convert to Lowercase</button>
                            <button class="btn btn-outline-light mb-2 w-100" id="remove-outliers">Remove Outliers</button>
                            <button class="btn btn-outline-light mb-2 w-100" id="filter-rows">Filter Rows</button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="cleaning-result"></div>
        `;
        
        attachDataCleaningEventListeners();
    }
    
    // Attach Data Cleaning Event Listeners
    function attachDataCleaningEventListeners() {
        // Remove Missing Values
        document.getElementById('remove-missing').addEventListener('click', () => {
            try {
                const beforeCount = sharedDataset.rows.length;
                sharedDataset.rows = sharedDataset.rows.filter(row => 
                    row.every(cell => cell !== null && cell !== ''));
                const afterCount = sharedDataset.rows.length;
                
                showSuccessMessage(`Removed ${beforeCount - afterCount} rows with missing values.`);
                document.getElementById('cleaning-result').innerHTML = renderDataTable();
            } catch (error) {
                showErrorMessage(error.message);
            }
        });
        
        // Remove Duplicate Rows
        document.getElementById('remove-duplicates').addEventListener('click', () => {
            try {
                const beforeCount = sharedDataset.rows.length;
                const uniqueRows = new Map();
                
                sharedDataset.rows.forEach(row => {
                    const key = JSON.stringify(row);
                    uniqueRows.set(key, row);
                });
                
                sharedDataset.rows = Array.from(uniqueRows.values());
                const afterCount = sharedDataset.rows.length;
                
                showSuccessMessage(`Removed ${beforeCount - afterCount} duplicate rows.`);
                document.getElementById('cleaning-result').innerHTML = renderDataTable();
            } catch (error) {
                showErrorMessage(error.message);
            }
        });
        
        // Trim Spaces
        document.getElementById('trim-spaces').addEventListener('click', () => {
            try {
                sharedDataset.rows = sharedDataset.rows.map(row => 
                    row.map(cell => typeof cell === 'string' ? cell.trim() : cell));
                
                showSuccessMessage("Trimmed leading and trailing spaces from all text cells.");
                document.getElementById('cleaning-result').innerHTML = renderDataTable();
            } catch (error) {
                showErrorMessage(error.message);
            }
        });
        
        // Convert to Lowercase
        document.getElementById('convert-lowercase').addEventListener('click', () => {
            try {
                sharedDataset.rows = sharedDataset.rows.map(row => 
                    row.map(cell => typeof cell === 'string' ? cell.toLowerCase() : cell));
                
                showSuccessMessage("Converted all text to lowercase.");
                document.getElementById('cleaning-result').innerHTML = renderDataTable();
            } catch (error) {
                showErrorMessage(error.message);
            }
        });
        
        // Remove Outliers
        document.getElementById('remove-outliers').addEventListener('click', () => {
            try {
                const column = prompt('Enter the column name to remove outliers:');
                if (!column) return;
                
                const columnIndex = getColumnIndex(column);
                const values = getColumnData(columnIndex);
                
                if (values.length === 0) {
                    throw new Error("No numeric data in the selected column");
                }
                
                const outliers = detectOutliers(values);
                const beforeCount = sharedDataset.rows.length;
                
                sharedDataset.rows = sharedDataset.rows.filter(row => {
                    const value = parseFloat(row[columnIndex]);
                    return isNaN(value) || !outliers.includes(value);
                });
                
                const afterCount = sharedDataset.rows.length;
                
                showSuccessMessage(`Removed ${beforeCount - afterCount} outliers from column "${column}".`);
                document.getElementById('cleaning-result').innerHTML = renderDataTable();
            } catch (error) {
                showErrorMessage(error.message);
            }
        });
        
        // Filter Rows
        document.getElementById('filter-rows').addEventListener('click', () => {
            try {
                const condition = prompt('Enter a condition to filter rows (e.g., "Age > 30"):');
                if (!condition) return;
                
                const beforeCount = sharedDataset.rows.length;
                
                // Parse condition into components
                const matches = condition.match(/(\w+)\s*([<>=!]+)\s*(.+)/);
                if (!matches || matches.length < 4) {
                    throw new Error("Invalid condition format. Example: Age > 30");
                }
                
                const [_, column, operator, valueStr] = matches;
                
                if (!sharedDataset.headers.includes(column)) {
                    throw new Error(`Column "${column}" not found in dataset`);
                }
                
                const columnIndex = sharedDataset.headers.indexOf(column);
                const value = isNaN(parseFloat(valueStr)) ? valueStr.trim() : parseFloat(valueStr);
                
                sharedDataset.rows = sharedDataset.rows.filter(row => {
                    const cellValue = row[columnIndex];
                    const numericCellValue = parseFloat(cellValue);
                    
                    // Compare based on operator
                    switch(operator) {
                        case '>': return !isNaN(numericCellValue) && numericCellValue > value;
                        case '<': return !isNaN(numericCellValue) && numericCellValue < value;
                        case '>=': return !isNaN(numericCellValue) && numericCellValue >= value;
                        case '<=': return !isNaN(numericCellValue) && numericCellValue <= value;
                        case '==': return cellValue == value; // loose equality for string/number comparison
                        case '===': return cellValue === value; // strict equality
                        case '!=': return cellValue != value;
                        case '!==': return cellValue !== value;
                        default: throw new Error(`Unsupported operator: ${operator}`);
                    }
                });
                
                const afterCount = sharedDataset.rows.length;
                
                showSuccessMessage(`Filtered ${beforeCount - afterCount} rows based on condition: ${condition}`);
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
                            <button class="btn btn-outline-light mb-2 w-100" id="filter-column-null">Filter Rows with Null Column</button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="filtering-result"></div>
        `;
        
        attachDataFilteringEventListeners();
    }
    
    // Attach Data Filtering Event Listeners
    function attachDataFilteringEventListeners() {
        // Filter by Condition - same as 'filter-rows' in cleaning section
        document.getElementById('filter-condition').addEventListener('click', () => {
            try {
                const condition = prompt('Enter a condition to filter rows (e.g., "Age > 30"):');
                if (!condition) return;
                
                const beforeCount = sharedDataset.rows.length;
                
                // Parse condition into components
                const matches = condition.match(/(\w+)\s*([<>=!]+)\s*(.+)/);
                if (!matches || matches.length < 4) {
                    throw new Error("Invalid condition format. Example: Age > 30");
                }
                
                const [_, column, operator, valueStr] = matches;
                
                if (!sharedDataset.headers.includes(column)) {
                    throw new Error(`Column "${column}" not found in dataset`);
                }
                
                const columnIndex = sharedDataset.headers.indexOf(column);
                const value = isNaN(parseFloat(valueStr)) ? valueStr.trim() : parseFloat(valueStr);
                
                sharedDataset.rows = sharedDataset.rows.filter(row => {
                    const cellValue = row[columnIndex];
                    const numericCellValue = parseFloat(cellValue);
                    
                    // Compare based on operator
                    switch(operator) {
                        case '>': return !isNaN(numericCellValue) && numericCellValue > value;
                        case '<': return !isNaN(numericCellValue) && numericCellValue < value;
                        case '>=': return !isNaN(numericCellValue) && numericCellValue >= value;
                        case '<=': return !isNaN(numericCellValue) && numericCellValue <= value;
                        case '==': return cellValue == value; // loose equality for string/number comparison
                        case '===': return cellValue === value; // strict equality
                        case '!=': return cellValue != value;
                        case '!==': return cellValue !== value;
                        default: throw new Error(`Unsupported operator: ${operator}`);
                    }
                });
                
                const afterCount = sharedDataset.rows.length;
                
                showSuccessMessage(`Filtered ${beforeCount - afterCount} rows based on condition: ${condition}`);
                document.getElementById('filtering-result').innerHTML = renderDataTable();
            } catch (error) {
                showErrorMessage(error.message);
            }
        });
        
        // Filter by Range
        document.getElementById('filter-range').addEventListener('click', () => {
            try {
                const column = prompt('Enter the column name to filter by range:');
                if (!column) return;
                
                const minValue = parseFloat(prompt('Enter the minimum value:'));
                const maxValue = parseFloat(prompt('Enter the maximum value:'));
                
                if (isNaN(minValue) || isNaN(maxValue) || minValue > maxValue) {
                    throw new Error("Invalid range values");
                }
                
                const columnIndex = getColumnIndex(column);
                const beforeCount = sharedDataset.rows.length;
                
                sharedDataset.rows = sharedDataset.rows.filter(row => {
                    const value = parseFloat(row[columnIndex]);
                    return !isNaN(value) && value >= minValue && value <= maxValue;
                });
                
                const afterCount = sharedDataset.rows.length;
                
                showSuccessMessage(`Filtered to ${afterCount} rows with column "${column}" in range [${minValue}, ${maxValue}]`);
                document.getElementById('filtering-result').innerHTML = renderDataTable();
            } catch (error) {
                showErrorMessage(error.message);
            }
        });
        
        // Filter Top N Rows
        document.getElementById('filter-top-n').addEventListener('click', () => {
            try {
                const n = parseInt(prompt('Enter the number of top rows to keep (N):'), 10);
                if (isNaN(n) || n <= 0) {
                    throw new Error("Invalid value for N");
                }
                
                const beforeCount = sharedDataset.rows.length;
                sharedDataset.rows = sharedDataset.rows.slice(0, n);
                
                showSuccessMessage(`Kept top ${n} rows (removed ${beforeCount - n} rows)`);
                document.getElementById('filtering-result').innerHTML = renderDataTable();
            } catch (error) {
                showErrorMessage(error.message);
            }
        });
        
        // Filter Rows with Null Column
        document.getElementById('filter-column-null').addEventListener('click', () => {
            try {
                const column = prompt('Enter the column name to check for null values:');
                if (!column) return;
                
                const columnIndex = getColumnIndex(column);
                const beforeCount = sharedDataset.rows.length;
                
                sharedDataset.rows = sharedDataset.rows.filter(row => 
                    row[columnIndex] !== null && row[columnIndex] !== '');
                
                const afterCount = sharedDataset.rows.length;
                
                showSuccessMessage(`Kept ${afterCount} rows with non-null values in column "${column}"`);
                document.getElementById('filtering-result').innerHTML = renderDataTable();
            } catch (error) {
                showErrorMessage(error.message);
            }
        });
    }

    // Implement Plot Functionality
    function implementPlotFunctionality() {
        document.getElementById('generateChart').addEventListener('click', generateChart);
    }

    // Generate Chart
    function generateChart() {
        try {
            const xAxisColumn = document.getElementById('xAxisColumn').value;
            const yAxisColumn = document.getElementById('yAxisColumn').value;
            const chartType = document.getElementById('chartType').value;
            const chartLabel = document.getElementById('chartLabel').value || `${yAxisColumn} vs ${xAxisColumn}`;
            const chartColor = document.getElementById('chartColor').value || '#4b9cdf';
            const showLegend = document.getElementById('showLegend').value === 'true';
            
            if (!xAxisColumn || !yAxisColumn) {
                throw new Error("Both X and Y axes must be selected");
            }
            
            const xColumnIndex = getColumnIndex(xAxisColumn);
            const yColumnIndex = getColumnIndex(yAxisColumn);
            
            const labels = sharedDataset.rows.map(row => row[xColumnIndex]);
            const data = sharedDataset.rows.map(row => parseFloat(row[yColumnIndex]));
            
            if (data.every(isNaN)) {
                throw new Error("The selected Y-axis column contains no valid numeric data");
            }
            
            // Create chart configuration
            const config = createChartConfig(chartType, labels, data, {
                chartLabel,
                chartColor,
                showLegend,
                xAxisColumn,
                yAxisColumn
            });
            
            // Create chart wrapper
            const chartWrapper = document.createElement('div');
            chartWrapper.className = 'chart-wrapper card m-2 p-2';
            chartWrapper.style.cssText = 'width: 45%; min-width: 300px; height: 400px; position: relative;';
            
            // Create canvas for chart
            const canvas = document.createElement('canvas');
            chartWrapper.appendChild(canvas);
            
            // Add remove button
            const removeButton = document.createElement('button');
            removeButton.textContent = '×';
            removeButton.style.cssText = 'position: absolute; top: 5px; right: 5px; border: none; background: transparent; font-size: 20px; cursor: pointer; color: #dc3545;';
            removeButton.addEventListener('click', () => {
                if (canvas.chartInstance) canvas.chartInstance.destroy();
                chartWrapper.remove();
            });
            chartWrapper.appendChild(removeButton);
            
            // Append to container
            document.getElementById('chartsContainer').appendChild(chartWrapper);
            
            // Create chart
            const ctx = canvas.getContext('2d');
            const chartInstance = new Chart(ctx, config);
            canvas.chartInstance = chartInstance;
        } catch (error) {
            showErrorMessage(error.message);
        }
    }
    
    // Create Chart Configuration
    function createChartConfig(type, labels, data, options) {
        let dataset = {};
        const pieTypes = ['pie', 'doughnut', 'radar'];
        
        if (pieTypes.includes(type)) {
            dataset = {
                data: data,
                backgroundColor: data.map(() => options.chartColor || '#4b9cdf'),
                borderWidth: 1
            };
        } else {
            dataset = {
                label: options.chartLabel,
                data: data,
                backgroundColor: options.chartColor || '#4b9cdf',
                borderColor: options.chartColor || '#4b9cdf',
                borderWidth: 1
            };
        }
        
        const config = {
            type: type,
            data: {
                labels: labels,
                datasets: [dataset]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: options.showLegend,
                        position: 'top'
                    }
                }
            }
        };
        
        // Add scales for non-pie charts
        if (!pieTypes.includes(type)) {
            config.options.scales = {
                x: {
                    title: {
                        display: true,
                        text: options.xAxisColumn
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: options.yAxisColumn
                    }
                }
            };
        }
        
        return config;
    }

    // Implement Statistics Functionality
    function implementStatisticsFunctionality() {
        document.getElementById('generateStats').addEventListener('click', () => {
            try {
                const statsColumn = document.getElementById('statsColumn');
                const selectedOptions = Array.from(statsColumn.selectedOptions).map(option => option.value);
                
                if (selectedOptions.length === 0) {
                    throw new Error("Please select at least one column");
                }
                
                // Get selected statistics options
                const selectedStats = {
                    mean: document.getElementById('optionMean').checked,
                    median: document.getElementById('optionMedian').checked,
                    stdDev: document.getElementById('optionStdDev').checked,
                    outliers: document.getElementById('optionOutliers').checked
                };
                
                // Build table headers based on selected stats
                let tableHTML = `
                    <div class="table-responsive">
                        <table class="table table-dark table-striped w-100">
                            <thead>
                                <tr>
                                    <th>Column</th>`;
                                    
                if (selectedStats.mean) tableHTML += '<th>Mean</th>';
                if (selectedStats.median) tableHTML += '<th>Median</th>';
                if (selectedStats.stdDev) tableHTML += '<th>Standard Deviation</th>';
                if (selectedStats.outliers) tableHTML += '<th>Outliers Detected</th>';
                
                tableHTML += `</tr>
                            </thead>
                            <tbody>`;
                
                // Process each selected column
                for (const column of selectedOptions) {
                    try {
                        const columnIndex = getColumnIndex(column);
                        const values = getColumnData(columnIndex);
                        
                        if (values.length === 0) {
                            tableHTML += `<tr>
                                <td>${column}</td>
                                <td colspan="${Object.values(selectedStats).filter(Boolean).length}">No numeric data</td>
                            </tr>`;
                            continue;
                        }
                        
                        let rowHTML = `<tr><td>${column}</td>`;
                        
                        if (selectedStats.mean) {
                            const mean = calculateMean(values);
                            rowHTML += `<td>${mean.toFixed(2)}</td>`;
                        }
                        
                        if (selectedStats.median) {
                            const median = calculateMedian(values);
                            rowHTML += `<td>${median.toFixed(2)}</td>`;
                        }
                        
                        if (selectedStats.stdDev) {
                            const mean = calculateMean(values);
                            const stdDev = calculateStdDev(values, mean);
                            rowHTML += `<td>${stdDev.toFixed(2)}</td>`;
                        }
                        
                        if (selectedStats.outliers) {
                            const outliers = detectOutliers(values);
                            rowHTML += `<td>${outliers.length}</td>`;
                        }
                        
                        rowHTML += `</tr>`;
                        tableHTML += rowHTML;
                    } catch (error) {
                        // Skip columns with errors
                        console.error(`Error processing column ${column}:`, error);
                    }
                }
                
                tableHTML += '</tbody></table></div>';
                document.getElementById('statsResult').innerHTML = tableHTML;
            } catch (error) {
                showErrorMessage(error.message);
            }
        });
    }

    // Helper Functions
    
    // Get Column Index
    function getColumnIndex(column) {
        if (!sharedDataset.headers.includes(column)) {
            throw new Error(`Invalid column name: ${column}`);
        }
        return sharedDataset.headers.indexOf(column);
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
    
    // Calculate Median
    function calculateMedian(values) {
        if (!values.length) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 
            ? (sorted[mid - 1] + sorted[mid]) / 2 
            : sorted[mid];
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
                            return `<tr>${row.map(cell => `<td>${cell ? cell.toString().trim() : ''}</td>`).join('')}</tr>`;
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
            <strong>Error:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const container = document.querySelector('#transformation-content, #data-content, #model-content, #filtering-result, #cleaning-result');
        if (container) {
            container.prepend(alertDiv);
            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                alertDiv.classList.remove('show');
                setTimeout(() => alertDiv.remove(), 500);
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
            <strong>Success:</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        
        const container = document.querySelector('#transformation-content, #data-content, #model-content, #filtering-result, #cleaning-result');
        if (container) {
            container.prepend(alertDiv);
            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                alertDiv.classList.remove('show');
                setTimeout(() => alertDiv.remove(), 500);
            }, 5000);
        } else {
            alert(message);
        }
    }

    // Initialize application - check for saved data
    const savedData = localStorage.getItem('savedDataset');
    if (savedData) {
        try {
            sharedDataset = JSON.parse(savedData);
            // Start with data section with loaded data
            dynamicContent.innerHTML = toolbarHandlers['toolbar-data']();
            attachDataMenuEventListeners();
            displayDataTable();
        } catch (error) {
            console.error("Error loading saved data:", error);
            // If error loading data, just start with empty data section
            dynamicContent.innerHTML = toolbarHandlers['toolbar-data']();
            attachDataMenuEventListeners();
        }
    } else {
        // No saved data, start with empty data section
        dynamicContent.innerHTML = toolbarHandlers['toolbar-data']();
        attachDataMenuEventListeners();
    }
});