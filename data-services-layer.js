// =============================================================================
// IMPROVED DATA SERVICES LAYER - EXTENSIONS TO EXISTING MODULE
// =============================================================================

// Improved CSV Parser with auto-detection and better error handling
class ImprovedCSVParser extends CSVParser {
    async parse(file) {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
            throw new Error('Empty CSV file');
        }

        // Auto-detect delimiter
        const delimiter = this.detectDelimiter(lines[0]);
        
        const headers = this.parseCSVLine(lines[0], delimiter).map(h => h.trim());
        const rows = [];
        const parseErrors = [];

        for (let i = 1; i < lines.length; i++) {
            try {
                const row = this.parseCSVLine(lines[i], delimiter);
                if (row.length === headers.length) {
                    rows.push(row.map(cell => this.parseValue(cell)));
                } else if (row.some(cell => cell.trim())) {
                    parseErrors.push(`Row ${i}: Expected ${headers.length} columns, got ${row.length}`);
                }
            } catch (error) {
                parseErrors.push(`Row ${i}: ${error.message}`);
            }
        }

        return { 
            headers, 
            rows, 
            metadata: { 
                delimiter,
                parseErrors: parseErrors.slice(0, 10),
                totalRows: lines.length - 1,
                successfulRows: rows.length
            }
        };
    }

    detectDelimiter(line) {
        const delimiters = [',', ';', '\t', '|'];
        const counts = delimiters.map(delim => (line.match(new RegExp(delim, 'g')) || []).length);
        const maxIndex = counts.indexOf(Math.max(...counts));
        return delimiters[maxIndex];
    }

    parseValue(value) {
        value = value.replace(/^"(.*)"$/, '$1').trim();
        
        // Try number first (including percentages)
        if (value.endsWith('%')) {
            const num = parseFloat(value.slice(0, -1));
            if (!isNaN(num)) return num / 100;
        }
        
        const num = parseFloat(value.replace(/,/g, ''));
        if (!isNaN(num) && isFinite(num)) {
            return num;
        }
        
        // Try date patterns
        if (this.isDatePattern(value)) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) return date;
        }
        
        // Try boolean
        const lower = value.toLowerCase();
        if (['true', 'false', 'yes', 'no', '1', '0'].includes(lower)) {
            return ['true', 'yes', '1'].includes(lower);
        }
        
        return value || null;
    }

    isDatePattern(value) {
        const datePatterns = [
            /^\d{4}-\d{2}-\d{2}$/,
            /^\d{2}\/\d{2}\/\d{4}$/,
            /^\d{2}-\d{2}-\d{4}$/,
            /^\d{4}\/\d{2}\/\d{2}$/
        ];
        return datePatterns.some(pattern => pattern.test(value));
    }
}

// Additional parsers for more file types
class TSVParser extends ImprovedCSVParser {
    detectDelimiter() {
        return '\t';
    }
}

class TextParser {
    async parse(file) {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        return {
            headers: ['text'],
            rows: lines.map(line => [line.trim()]),
            metadata: {
                type: 'text',
                lineCount: lines.length,
                encoding: 'UTF-8'
            }
        };
    }
}

class XMLParser {
    async parse(file) {
        const text = await file.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');
        
        // Check for parsing errors
        const parseError = xml.querySelector('parsererror');
        if (parseError) {
            throw new Error('Invalid XML format');
        }
        
        // Convert XML to tabular format (simplified)
        const data = this.xmlToTabular(xml);
        return data;
    }

    xmlToTabular(xml) {
        const rows = [];
        const headers = new Set();
        
        // Find repeating elements (assume these are rows)
        const rootElement = xml.documentElement;
        const children = Array.from(rootElement.children);
        
        if (children.length === 0) {
            throw new Error('No data found in XML');
        }
        
        // Process each child as a row
        children.forEach(child => {
            const row = {};
            this.extractAttributes(child, row);
            this.extractElements(child, row);
            
            Object.keys(row).forEach(key => headers.add(key));
            rows.push(row);
        });
        
        const headerArray = Array.from(headers);
        const rowArray = rows.map(row => headerArray.map(header => row[header] || null));
        
        return {
            headers: headerArray,
            rows: rowArray,
            metadata: {
                type: 'xml',
                rootElement: rootElement.tagName
            }
        };
    }

    extractAttributes(element, row) {
        for (const attr of element.attributes) {
            row[`@${attr.name}`] = attr.value;
        }
    }

    extractElements(element, row) {
        for (const child of element.children) {
            if (child.children.length === 0) {
                row[child.tagName] = child.textContent;
            } else {
                row[child.tagName] = child.outerHTML;
            }
        }
    }
}

// Improved Data Validators with comprehensive checks
class ComprehensiveDataValidators extends DataValidators {
    async validateDataset(dataset) {
        await super.validateDataset(dataset);
        
        // Additional validations for financial data
        this.validateFinancialData(dataset);
        this.validateDataQuality(dataset);
        
        return dataset;
    }

    validateFinancialData(dataset) {
        const numericColumns = this.getNumericColumns(dataset);
        const warnings = [];
        
        // Check for negative prices (if price columns exist)
        const priceColumns = dataset.headers.filter(header => 
            header.toLowerCase().includes('price') || 
            header.toLowerCase().includes('close') ||
            header.toLowerCase().includes('open') ||
            header.toLowerCase().includes('high') ||
            header.toLowerCase().includes('low')
        );
        
        priceColumns.forEach(column => {
            const columnIndex = dataset.headers.indexOf(column);
            const hasNegative = dataset.rows.some(row => 
                typeof row[columnIndex] === 'number' && row[columnIndex] < 0
            );
            
            if (hasNegative) {
                warnings.push(`Warning: Negative values found in price column '${column}'`);
            }
        });
        
        // Check for potential volume columns
        const volumeColumns = dataset.headers.filter(header =>
            header.toLowerCase().includes('volume') ||
            header.toLowerCase().includes('shares') ||
            header.toLowerCase().includes('quantity')
        );
        
        volumeColumns.forEach(column => {
            const columnIndex = dataset.headers.indexOf(column);
            const hasNegative = dataset.rows.some(row =>
                typeof row[columnIndex] === 'number' && row[columnIndex] < 0
            );
            
            if (hasNegative) {
                warnings.push(`Warning: Negative values found in volume column '${column}'`);
            }
        });
        
        if (warnings.length > 0) {
            console.warn('Financial data validation warnings:', warnings);
        }
    }

    validateDataQuality(dataset) {
        const issues = [];
        
        // Check for high null percentage
        dataset.headers.forEach((header, index) => {
            const nullCount = dataset.rows.filter(row => 
                row[index] === null || row[index] === undefined || row[index] === ''
            ).length;
            
            const nullPercentage = (nullCount / dataset.rows.length) * 100;
            
            if (nullPercentage > 50) {
                issues.push(`Column '${header}' has ${nullPercentage.toFixed(1)}% missing values`);
            }
        });
        
        // Check for duplicate rows
        const uniqueRows = new Set(dataset.rows.map(row => JSON.stringify(row)));
        const duplicateCount = dataset.rows.length - uniqueRows.size;
        
        if (duplicateCount > 0) {
            issues.push(`${duplicateCount} duplicate rows found`);
        }
        
        // Check for inconsistent data types in columns
        dataset.headers.forEach((header, index) => {
            const types = new Set();
            dataset.rows.forEach(row => {
                const value = row[index];
                if (value !== null && value !== undefined) {
                    types.add(typeof value);
                }
            });
            
            if (types.size > 2) { // Allow for null + one type
                issues.push(`Column '${header}' has inconsistent data types: ${Array.from(types).join(', ')}`);
            }
        });
        
        if (issues.length > 0) {
            console.warn('Data quality issues detected:', issues);
            dataset.metadata = dataset.metadata || {};
            dataset.metadata.qualityIssues = issues;
        }
    }

    getNumericColumns(dataset) {
        return dataset.headers.filter((header, index) => {
            return dataset.rows.some(row => typeof row[index] === 'number');
        });
    }
}

// Advanced Data Processors with financial-specific features
class AdvancedDataProcessors extends DataProcessors {
    async processDataset(dataset) {
        // Run base processing
        dataset = await super.processDataset(dataset);
        
        // Add financial data processing
        dataset = this.processFinancialData(dataset);
        dataset = this.addDataProfile(dataset);
        
        return dataset;
    }

    processFinancialData(dataset) {
        const dateColumns = this.getDateColumns(dataset);
        const priceColumns = this.getPriceColumns(dataset);
        
        // Sort by date if date column exists
        if (dateColumns.length > 0) {
            const dateColumnIndex = dataset.headers.indexOf(dateColumns[0]);
            dataset.rows.sort((a, b) => {
                const dateA = a[dateColumnIndex];
                const dateB = b[dateColumnIndex];
                if (dateA instanceof Date && dateB instanceof Date) {
                    return dateA - dateB;
                }
                return 0;
            });
        }
        
        // Calculate returns if price columns exist
        if (priceColumns.length > 0 && dataset.rows.length > 1) {
            dataset.metadata.calculatedReturns = this.calculateReturns(dataset, priceColumns);
        }
        
        return dataset;
    }

    calculateReturns(dataset, priceColumns) {
        const returns = {};
        
        priceColumns.forEach(column => {
            const columnIndex = dataset.headers.indexOf(column);
            const prices = dataset.rows.map(row => row[columnIndex]).filter(price => 
                typeof price === 'number' && price > 0
            );
            
            if (prices.length > 1) {
                const simpleReturns = [];
                for (let i = 1; i < prices.length; i++) {
                    simpleReturns.push((prices[i] - prices[i-1]) / prices[i-1]);
                }
                
                returns[column] = {
                    simpleReturns,
                    averageReturn: simpleReturns.reduce((sum, r) => sum + r, 0) / simpleReturns.length,
                    volatility: this.calculateVolatility(simpleReturns)
                };
            }
        });
        
        return returns;
    }

    calculateVolatility(returns) {
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        return Math.sqrt(variance);
    }

    getPriceColumns(dataset) {
        return dataset.headers.filter(header => {
            const lower = header.toLowerCase();
            return lower.includes('price') || 
                   lower.includes('close') || 
                   lower.includes('open') || 
                   lower.includes('high') || 
                   lower.includes('low') ||
                   lower.includes('adj') ||
                   lower.includes('value');
        });
    }

    addDataProfile(dataset) {
        const profile = {
            shape: [dataset.rows.length, dataset.headers.length],
            memoryUsage: this.estimateMemoryUsage(dataset),
            columnProfiles: {}
        };
        
        dataset.headers.forEach((header, index) => {
            const column = dataset.rows.map(row => row[index]);
            profile.columnProfiles[header] = this.profileColumn(column);
        });
        
        dataset.metadata.profile = profile;
        return dataset;
    }

    profileColumn(column) {
        const nonNull = column.filter(val => val !== null && val !== undefined);
        const profile = {
            count: nonNull.length,
            nullCount: column.length - nonNull.length,
            nullPercentage: ((column.length - nonNull.length) / column.length * 100).toFixed(2)
        };
        
        if (nonNull.length === 0) {
            profile.type = 'empty';
            return profile;
        }
        
        // Determine primary type
        const types = {};
        nonNull.forEach(val => {
            const type = typeof val;
            types[type] = (types[type] || 0) + 1;
        });
        
        const primaryType = Object.keys(types).reduce((a, b) => types[a] > types[b] ? a : b);
        profile.type = primaryType;
        
        if (primaryType === 'number') {
            const numbers = nonNull.filter(val => typeof val === 'number');
            profile.min = Math.min(...numbers);
            profile.max = Math.max(...numbers);
            profile.mean = numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
            profile.median = this.calculateMedian(numbers);
            profile.std = this.calculateStandardDeviation(numbers);
            
            // Detect outliers
            profile.outliers = this.detectOutliers(numbers);
        } else if (primaryType === 'string') {
            profile.uniqueValues = new Set(nonNull).size;
            profile.averageLength = nonNull.reduce((sum, val) => sum + val.length, 0) / nonNull.length;
            profile.maxLength = Math.max(...nonNull.map(val => val.length));
            profile.minLength = Math.min(...nonNull.map(val => val.length));
        }
        
        return profile;
    }

    detectOutliers(numbers) {
        const sorted = [...numbers].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        
        return numbers.filter(num => num < lowerBound || num > upperBound);
    }

    calculateStandardDeviation(numbers) {
        const mean = numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
        const variance = numbers.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numbers.length;
        return Math.sqrt(variance);
    }

    estimateMemoryUsage(dataset) {
        const jsonString = JSON.stringify({
            headers: dataset.headers,
            rows: dataset.rows.slice(0, 100) // Sample for estimation
        });
        const sampleSize = new Blob([jsonString]).size;
        const estimatedTotal = (sampleSize / 100) * dataset.rows.length;
        return {
            estimated: estimatedTotal,
            formatted: this.formatBytes(estimatedTotal)
        };
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Improved DataTransformer with financial operations
class FinancialDataTransformer extends DataTransformer {
    constructor(config) {
        super(config);
        this.financialOperations = {
            'calculate_returns': this.calculateReturns.bind(this),
            'calculate_moving_average': this.calculateMovingAverage.bind(this),
            'calculate_volatility': this.calculateVolatility.bind(this),
            'normalize_prices': this.normalizePrices.bind(this),
            'detect_outliers': this.detectOutliers.bind(this)
        };
    }

    async applyTransformation(dataset, transformation) {
        const { type, options } = transformation;
        
        // Check if it's a financial operation
        if (this.financialOperations[type]) {
            return this.financialOperations[type](dataset, options);
        }
        
        // Fall back to base transformations
        return super.applyTransformation(dataset, transformation);
    }

    calculateReturns(dataset, options = {}) {
        const { priceColumn, returnType = 'simple', newColumnName } = options;
        
        if (!priceColumn) {
            throw new Error('Price column is required for return calculation');
        }
        
        const columnIndex = dataset.headers.indexOf(priceColumn);
        if (columnIndex === -1) {
            throw new Error(`Column '${priceColumn}' not found`);
        }
        
        const newColumn = newColumnName || `${priceColumn}_returns`;
        const newHeaders = [...dataset.headers, newColumn];
        const newRows = [];
        
        for (let i = 0; i < dataset.rows.length; i++) {
            const row = [...dataset.rows[i]];
            
            if (i === 0) {
                row.push(null); // First row has no return
            } else {
                const currentPrice = dataset.rows[i][columnIndex];
                const previousPrice = dataset.rows[i-1][columnIndex];
                
                let returnValue = null;
                if (typeof currentPrice === 'number' && typeof previousPrice === 'number' && previousPrice !== 0) {
                    if (returnType === 'simple') {
                        returnValue = (currentPrice - previousPrice) / previousPrice;
                    } else if (returnType === 'log') {
                        returnValue = Math.log(currentPrice / previousPrice);
                    }
                }
                
                row.push(returnValue);
            }
            
            newRows.push(row);
        }
        
        return {
            ...dataset,
            headers: newHeaders,
            rows: newRows
        };
    }

    calculateMovingAverage(dataset, options = {}) {
        const { priceColumn, window = 20, newColumnName } = options;
        
        if (!priceColumn) {
            throw new Error('Price column is required for moving average calculation');
        }
        
        const columnIndex = dataset.headers.indexOf(priceColumn);
        if (columnIndex === -1) {
            throw new Error(`Column '${priceColumn}' not found`);
        }
        
        const newColumn = newColumnName || `${priceColumn}_MA${window}`;
        const newHeaders = [...dataset.headers, newColumn];
        const newRows = [];
        
        for (let i = 0; i < dataset.rows.length; i++) {
            const row = [...dataset.rows[i]];
            
            if (i < window - 1) {
                row.push(null); // Not enough data for moving average
            } else {
                const windowData = [];
                for (let j = i - window + 1; j <= i; j++) {
                    const value = dataset.rows[j][columnIndex];
                    if (typeof value === 'number') {
                        windowData.push(value);
                    }
                }
                
                const average = windowData.length > 0 ? 
                    windowData.reduce((sum, val) => sum + val, 0) / windowData.length : null;
                
                row.push(average);
            }
            
            newRows.push(row);
        }
        
        return {
            ...dataset,
            headers: newHeaders,
            rows: newRows
        };
    }

    calculateVolatility(dataset, options = {}) {
        const { returnsColumn, window = 20, newColumnName } = options;
        
        if (!returnsColumn) {
            throw new Error('Returns column is required for volatility calculation');
        }
        
        const columnIndex = dataset.headers.indexOf(returnsColumn);
        if (columnIndex === -1) {
            throw new Error(`Column '${returnsColumn}' not found`);
        }
        
        const newColumn = newColumnName || `${returnsColumn}_vol${window}`;
        const newHeaders = [...dataset.headers, newColumn];
        const newRows = [];
        
        for (let i = 0; i < dataset.rows.length; i++) {
            const row = [...dataset.rows[i]];
            
            if (i < window - 1) {
                row.push(null);
            } else {
                const windowData = [];
                for (let j = i - window + 1; j <= i; j++) {
                    const value = dataset.rows[j][columnIndex];
                    if (typeof value === 'number') {
                        windowData.push(value);
                    }
                }
                
                if (windowData.length > 1) {
                    const mean = windowData.reduce((sum, val) => sum + val, 0) / windowData.length;
                    const variance = windowData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / windowData.length;
                    const volatility = Math.sqrt(variance);
                    row.push(volatility);
                } else {
                    row.push(null);
                }
            }
            
            newRows.push(row);
        }
        
        return {
            ...dataset,
            headers: newHeaders,
            rows: newRows
        };
    }

    normalizePrices(dataset, options = {}) {
        const { priceColumn, baseIndex = 0, newColumnName } = options;
        
        if (!priceColumn) {
            throw new Error('Price column is required for normalization');
        }
        
        const columnIndex = dataset.headers.indexOf(priceColumn);
        if (columnIndex === -1) {
            throw new Error(`Column '${priceColumn}' not found`);
        }
        
        const basePrice = dataset.rows[baseIndex][columnIndex];
        if (typeof basePrice !== 'number' || basePrice === 0) {
            throw new Error('Base price must be a valid non-zero number');
        }
        
        const newColumn = newColumnName || `${priceColumn}_normalized`;
        const newHeaders = [...dataset.headers, newColumn];
        const newRows = dataset.rows.map(row => {
            const price = row[columnIndex];
            const normalizedPrice = typeof price === 'number' ? (price / basePrice) * 100 : null;
            return [...row, normalizedPrice];
        });
        
        return {
            ...dataset,
            headers: newHeaders,
            rows: newRows
        };
    }

    detectOutliers(dataset, options = {}) {
        const { column, method = 'iqr', newColumnName } = options;
        
        if (!column) {
            throw new Error('Column is required for outlier detection');
        }
        
        const columnIndex = dataset.headers.indexOf(column);
        if (columnIndex === -1) {
            throw new Error(`Column '${column}' not found`);
        }
        
        const values = dataset.rows.map(row => row[columnIndex]).filter(val => typeof val === 'number');
        let outlierThresholds;
        
        if (method === 'iqr') {
            const sorted = [...values].sort((a, b) => a - b);
            const q1 = sorted[Math.floor(sorted.length * 0.25)];
            const q3 = sorted[Math.floor(sorted.length * 0.75)];
            const iqr = q3 - q1;
            outlierThresholds = {
                lower: q1 - 1.5 * iqr,
                upper: q3 + 1.5 * iqr
            };
        } else if (method === 'zscore') {
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
            outlierThresholds = {
                lower: mean - 3 * std,
                upper: mean + 3 * std
            };
        }
        
        const newColumn = newColumnName || `${column}_outlier`;
        const newHeaders = [...dataset.headers, newColumn];
        const newRows = dataset.rows.map(row => {
            const value = row[columnIndex];
            const isOutlier = typeof value === 'number' && 
                (value < outlierThresholds.lower || value > outlierThresholds.upper);
            return [...row, isOutlier];
        });
        
        return {
            ...dataset,
            headers: newHeaders,
            rows: newRows
        };
    }
}

// Multi-format Data Exporter
class MultiFormatDataExporter extends DataExporter {
    constructor(format, options = {}) {
        super(format);
        this.options = options;
    }

    async export(dataset) {
        switch (this.format) {
            case 'csv':
                return this.exportCSV(dataset);
            case 'tsv':
                return this.exportTSV(dataset);
            case 'json':
                return this.exportJSON(dataset);
            case 'xlsx':
                return this.exportExcel(dataset);
            case 'xml':
                return this.exportXML(dataset);
            default:
                throw new Error(`Unsupported export format: ${this.format}`);
        }
    }

    exportTSV(dataset) {
        const { includeHeaders = true } = this.options;
        
        const lines = [];
        
        if (includeHeaders) {
            lines.push(dataset.headers.join('\t'));
        }
        
        dataset.rows.forEach(row => {
            const tsvRow = row.map(cell => {
                if (cell === null || cell === undefined) return '';
                const str = cell.toString();
                // Escape tabs and newlines
                return str.replace(/\t/g, '\\t').replace(/\n/g, '\\n');
            }).join('\t');
            lines.push(tsvRow);
        });
        
        const tsvContent = lines.join('\n');
        this.downloadFile(tsvContent, 'exported_data.tsv', 'text/tab-separated-values');
    }

    exportXML(dataset) {
        const { rootElement = 'data', rowElement = 'row' } = this.options;
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}>\n`;
        
        dataset.rows.forEach((row, index) => {
            xml += `  <${rowElement} id="${index + 1}">\n`;
            
            row.forEach((cell, cellIndex) => {
                const header = dataset.headers[cellIndex];
                const value = cell !== null && cell !== undefined ? cell : '';
                xml += `    <${header}>${this.escapeXML(value.toString())}</${header}>\n`;
            });
            
            xml += `  </${rowElement}>\n`;
        });
        
        xml += `</${rootElement}>`;
        
        this.downloadFile(xml, 'exported_data.xml', 'application/xml');
    }

    escapeXML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

// Batch Processing Service
class BatchProcessingService {
    constructor(dataService) {
        this.dataService = dataService;
        this.processingQueue = [];
        this.isProcessing = false;
    }

    async processMultipleFiles(files) {
        const results = [];
        
        for (let i = 0; i < files.length; i++) {
            try {
                this.dataService.emit('batch:progress', { 
                    current: i + 1, 
                    total: files.length, 
                    fileName: files[i].name 
                });
                
                const result = await this.dataService.loadData(files[i]);
                results.push({ 
                    file: files[i].name, 
                    success: true, 
                    data: result 
                });
                
            } catch (error) {
                results.push({ 
                    file: files[i].name, 
                    success: false, 
                    error: error.message 
                });
            }
        }
        
        this.dataService.emit('batch:complete', { results });
        return results;
    }

    async mergeDatasets(datasets, mergeStrategy = 'union') {
        if (datasets.length === 0) {
            throw new Error('No datasets to merge');
        }
        
        if (datasets.length === 1) {
            return datasets[0];
        }
        
        switch (mergeStrategy) {
            case 'union':
                return this.unionMerge(datasets);
            case 'intersection':
                return this.intersectionMerge(datasets);
            case 'concatenate':
                return this.concatenateMerge(datasets);
            default:
                throw new Error(`Unknown merge strategy: ${mergeStrategy}`);
        }
    }

    unionMerge(datasets) {
        // Combine all unique columns
        const allHeaders = new Set();
        datasets.forEach(dataset => {
            dataset.headers.forEach(header => allHeaders.add(header));
        });
        
        const mergedHeaders = Array.from(allHeaders);
        const mergedRows = [];
        
        datasets.forEach(dataset => {
            dataset.rows.forEach(row => {
                const mergedRow = mergedHeaders.map(header => {
                    const columnIndex = dataset.headers.indexOf(header);
                    return columnIndex !== -1 ? row[columnIndex] : null;
                });
                mergedRows.push(mergedRow);
            });
        });
        
        return {
            headers: mergedHeaders,
            rows: mergedRows,
            metadata: {
                mergeStrategy: 'union',
                sourceDatasets: datasets.length,
                mergedAt: new Date().toISOString()
            }
        };
    }

    intersectionMerge(datasets) {
        // Find common columns
        let commonHeaders = new Set(datasets[0].headers);
        
        for (let i = 1; i < datasets.length; i++) {
            const currentHeaders = new Set(datasets[i].headers);
            commonHeaders = new Set([...commonHeaders].filter(header => currentHeaders.has(header)));
        }
        
        const mergedHeaders = Array.from(commonHeaders);
        const mergedRows = [];
        
        datasets.forEach(dataset => {
            dataset.rows.forEach(row => {
                const mergedRow = mergedHeaders.map(header => {
                    const columnIndex = dataset.headers.indexOf(header);
                    return row[columnIndex];
                });
                mergedRows.push(mergedRow);
            });
        });
        
        return {
            headers: mergedHeaders,
            rows: mergedRows,
            metadata: {
                mergeStrategy: 'intersection',
                sourceDatasets: datasets.length,
                mergedAt: new Date().toISOString()
            }
        };
    }

    concatenateMerge(datasets) {
        // Require all datasets to have same structure
        const referenceHeaders = datasets[0].headers;
        
        for (let i = 1; i < datasets.length; i++) {
            if (datasets[i].headers.length !== referenceHeaders.length ||
                !datasets[i].headers.every((header, index) => header === referenceHeaders[index])) {
                throw new Error('All datasets must have identical column structure for concatenation');
            }
        }
        
        const mergedRows = [];
        datasets.forEach(dataset => {
            mergedRows.push(...dataset.rows);
        });
        
        return {
            headers: referenceHeaders,
            rows: mergedRows,
            metadata: {
                mergeStrategy: 'concatenate',
                sourceDatasets: datasets.length,
                mergedAt: new Date().toISOString()
            }
        };
    }
}

// Data Quality Assessment Service
class DataQualityService {
    constructor() {
        this.qualityRules = [
            { name: 'completeness', check: this.checkCompleteness.bind(this) },
            { name: 'consistency', check: this.checkConsistency.bind(this) },
            { name: 'accuracy', check: this.checkAccuracy.bind(this) },
            { name: 'uniqueness', check: this.checkUniqueness.bind(this) },
            { name: 'validity', check: this.checkValidity.bind(this) }
        ];
    }

    assessQuality(dataset) {
        const results = {
            overallScore: 0,
            details: {},
            recommendations: []
        };

        let totalScore = 0;
        
        this.qualityRules.forEach(rule => {
            const ruleResult = rule.check(dataset);
            results.details[rule.name] = ruleResult;
            totalScore += ruleResult.score;
        });

        results.overallScore = totalScore / this.qualityRules.length;
        results.recommendations = this.generateRecommendations(results.details);

        return results;
    }

    checkCompleteness(dataset) {
        let totalCells = dataset.rows.length * dataset.headers.length;
        let nullCells = 0;

        dataset.rows.forEach(row => {
            row.forEach(cell => {
                if (cell === null || cell === undefined || cell === '') {
                    nullCells++;
                }
            });
        });

        const completeness = ((totalCells - nullCells) / totalCells) * 100;
        
        return {
            score: completeness,
            details: {
                totalCells,
                nullCells,
                completenessPercentage: completeness.toFixed(2)
            }
        };
    }

    checkConsistency(dataset) {
        let consistencyIssues = 0;
        const columnConsistency = {};

        dataset.headers.forEach((header, index) => {
            const types = new Set();
            const formats = new Set();
            
            dataset.rows.forEach(row => {
                const value = row[index];
                if (value !== null && value !== undefined) {
                    types.add(typeof value);
                    
                    if (typeof value === 'string') {
                        // Check for different date formats, number formats, etc.
                        if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                            formats.add('ISO_DATE');
                        } else if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                            formats.add('US_DATE');
                        } else if (value.match(/^\d+\.\d+$/)) {
                            formats.add('DECIMAL');
                        }
                    }
                }
            });

            const typeConsistency = types.size <= 1;
            const formatConsistency = formats.size <= 1;
            
            columnConsistency[header] = {
                typeConsistency,
                formatConsistency,
                types: Array.from(types),
                formats: Array.from(formats)
            };

            if (!typeConsistency || !formatConsistency) {
                consistencyIssues++;
            }
        });

        const consistencyScore = ((dataset.headers.length - consistencyIssues) / dataset.headers.length) * 100;

        return {
            score: consistencyScore,
            details: {
                columnConsistency,
                issueCount: consistencyIssues
            }
        };
    }

    checkAccuracy(dataset) {
        let accuracyIssues = 0;
        const issues = [];

        // Check for financial data accuracy
        dataset.headers.forEach((header, index) => {
            const lowerHeader = header.toLowerCase();
            
            // Check price columns for negative values
            if (lowerHeader.includes('price') || lowerHeader.includes('close') || lowerHeader.includes('open')) {
                dataset.rows.forEach((row, rowIndex) => {
                    const value = row[index];
                    if (typeof value === 'number' && value < 0) {
                        accuracyIssues++;
                        issues.push(`Negative price in ${header} at row ${rowIndex + 1}`);
                    }
                });
            }

            // Check volume columns for negative values
            if (lowerHeader.includes('volume') || lowerHeader.includes('shares')) {
                dataset.rows.forEach((row, rowIndex) => {
                    const value = row[index];
                    if (typeof value === 'number' && value < 0) {
                        accuracyIssues++;
                        issues.push(`Negative volume in ${header} at row ${rowIndex + 1}`);
                    }
                });
            }

            // Check for unrealistic percentage values
            if (lowerHeader.includes('percent') || lowerHeader.includes('rate') || lowerHeader.includes('yield')) {
                dataset.rows.forEach((row, rowIndex) => {
                    const value = row[index];
                    if (typeof value === 'number' && (value > 1000 || value < -1000)) {
                        accuracyIssues++;
                        issues.push(`Unrealistic percentage value in ${header} at row ${rowIndex + 1}: ${value}`);
                    }
                });
            }
        });

        const maxPossibleIssues = dataset.rows.length * dataset.headers.length;
        const accuracyScore = ((maxPossibleIssues - accuracyIssues) / maxPossibleIssues) * 100;

        return {
            score: accuracyScore,
            details: {
                issueCount: accuracyIssues,
                issues: issues.slice(0, 20) // Limit to first 20 issues
            }
        };
    }

    checkUniqueness(dataset) {
        // Check for duplicate rows
        const rowStrings = dataset.rows.map(row => JSON.stringify(row));
        const uniqueRows = new Set(rowStrings);
        const duplicateCount = dataset.rows.length - uniqueRows.size;

        // Check for columns that should be unique (like IDs)
        const uniquenessIssues = [];
        dataset.headers.forEach((header, index) => {
            const lowerHeader = header.toLowerCase();
            
            if (lowerHeader.includes('id') || lowerHeader.includes('key') || lowerHeader.includes('code')) {
                const values = dataset.rows.map(row => row[index]).filter(val => val !== null);
                const uniqueValues = new Set(values);
                
                if (values.length !== uniqueValues.size) {
                    uniquenessIssues.push({
                        column: header,
                        totalValues: values.length,
                        uniqueValues: uniqueValues.size,
                        duplicates: values.length - uniqueValues.size
                    });
                }
            }
        });

        const totalIssues = duplicateCount + uniquenessIssues.length;
        const maxIssues = dataset.rows.length + dataset.headers.length;
        const uniquenessScore = ((maxIssues - totalIssues) / maxIssues) * 100;

        return {
            score: uniquenessScore,
            details: {
                duplicateRows: duplicateCount,
                columnUniquenessIssues: uniquenessIssues
            }
        };
    }

    checkValidity(dataset) {
        let validityIssues = 0;
        const issues = [];

        dataset.headers.forEach((header, index) => {
            const lowerHeader = header.toLowerCase();
            
            dataset.rows.forEach((row, rowIndex) => {
                const value = row[index];
                
                if (value !== null && value !== undefined) {
                    // Check date validity
                    if (lowerHeader.includes('date') || lowerHeader.includes('time')) {
                        if (value instanceof Date && isNaN(value.getTime())) {
                            validityIssues++;
                            issues.push(`Invalid date in ${header} at row ${rowIndex + 1}`);
                        }
                    }

                    // Check email validity
                    if (lowerHeader.includes('email')) {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (typeof value === 'string' && !emailRegex.test(value)) {
                            validityIssues++;
                            issues.push(`Invalid email in ${header} at row ${rowIndex + 1}`);
                        }
                    }

                    // Check numeric ranges
                    if (typeof value === 'number') {
                        if (!isFinite(value)) {
                            validityIssues++;
                            issues.push(`Non-finite number in ${header} at row ${rowIndex + 1}`);
                        }
                    }
                }
            });
        });

        const maxIssues = dataset.rows.length * dataset.headers.length;
        const validityScore = ((maxIssues - validityIssues) / maxIssues) * 100;

        return {
            score: validityScore,
            details: {
                issueCount: validityIssues,
                issues: issues.slice(0, 20)
            }
        };
    }

    generateRecommendations(qualityDetails) {
        const recommendations = [];

        // Completeness recommendations
        if (qualityDetails.completeness.score < 90) {
            recommendations.push({
                type: 'completeness',
                priority: 'high',
                message: `Data is ${qualityDetails.completeness.details.completenessPercentage}% complete. Consider cleaning or removing incomplete records.`
            });
        }

        // Consistency recommendations
        if (qualityDetails.consistency.score < 80) {
            recommendations.push({
                type: 'consistency',
                priority: 'medium',
                message: 'Data types and formats are inconsistent across columns. Consider standardizing data formats.'
            });
        }

        // Accuracy recommendations
        if (qualityDetails.accuracy.details.issueCount > 0) {
            recommendations.push({
                type: 'accuracy',
                priority: 'high',
                message: `${qualityDetails.accuracy.details.issueCount} accuracy issues found. Review data for unrealistic values.`
            });
        }

        // Uniqueness recommendations
        if (qualityDetails.uniqueness.details.duplicateRows > 0) {
            recommendations.push({
                type: 'uniqueness',
                priority: 'medium',
                message: `${qualityDetails.uniqueness.details.duplicateRows} duplicate rows found. Consider removing duplicates.`
            });
        }

        return recommendations;
    }
}

// Improved DataService with all enhancements
class ImprovedDataService extends DataService {
    constructor(config) {
        super(config);
        
        // Add improved parsers
        this.parsers = {
            'csv': new ImprovedCSVParser(),
            'tsv': new TSVParser(),
            'xlsx': new ExcelParser(),
            'json': new JSONParser(),
            'txt': new TextParser(),
            'xml': new XMLParser()
        };
        
        // Add additional services
        this.qualityService = new DataQualityService();
        this.batchProcessor = new BatchProcessingService(this);
        this.dataHistory = [];
        this.maxHistorySize = 10;
    }

    async loadData(file) {
        const operationId = this.generateOperationId();
        
        try {
            this.emit('data:loading', { operationId, filename: file.name, size: file.size });
            
            // Use improved parsers
            const fileType = this.detectFileType(file);
            const rawData = await this.parseFile(file, fileType);
            
            // Use improved validators and processors
            const validators = new ComprehensiveDataValidators();
            const processors = new AdvancedDataProcessors();
            
            const validatedData = await validators.validateDataset(rawData);
            const processedData = await processors.processDataset(validatedData);
            
            // Assess data quality
            const qualityAssessment = this.qualityService.assessQuality(processedData);
            processedData.metadata.quality = qualityAssessment;
            
            // Store in history
            this.addToHistory(processedData, file.name);
            
            // Cache the processed data
            this.cache.set('dataset', processedData);
            await this.storageAdapter.save('dataset', processedData);
            
            this.emit('data:loaded', { 
                operationId, 
                data: processedData,
                metadata: this.generateMetadata(processedData, file),
                quality: qualityAssessment
            });
            
            this.trackCall();
            return processedData;
        } catch (error) {
            this.trackError(error);
            this.emit('data:error', { operationId, error, filename: file.name });
            throw new DataLoadError(`Failed to load data: ${error.message}`, error);
        }
    }

    async loadMultipleFiles(files) {
        return await this.batchProcessor.processMultipleFiles(files);
    }

    async mergeDatasets(datasets, strategy = 'union') {
        return await this.batchProcessor.mergeDatasets(datasets, strategy);
    }

    addToHistory(dataset, filename) {
        this.dataHistory.unshift({
            id: this.generateOperationId(),
            filename,
            timestamp: new Date(),
            rowCount: dataset.rows.length,
            columnCount: dataset.headers.length,
            quality: dataset.metadata?.quality?.overallScore || 0,
            dataset: JSON.parse(JSON.stringify(dataset)) // Deep copy
        });

        // Keep only recent history
        if (this.dataHistory.length > this.maxHistorySize) {
            this.dataHistory = this.dataHistory.slice(0, this.maxHistorySize);
        }
    }

    getHistory() {
        return this.dataHistory.map(item => ({
            id: item.id,
            filename: item.filename,
            timestamp: item.timestamp,
            rowCount: item.rowCount,
            columnCount: item.columnCount,
            quality: item.quality
        }));
    }

    async loadFromHistory(historyId) {
        const historyItem = this.dataHistory.find(item => item.id === historyId);
        if (!historyItem) {
            throw new Error('History item not found');
        }

        this.cache.set('dataset', historyItem.dataset);
        this.emit('data:loaded', { 
            data: historyItem.dataset,
            source: 'history',
            historyId
        });

        return historyItem.dataset;
    }

    async transformData(transformationConfig) {
        const dataset = this.getCurrentDataset();
        if (!dataset) {
            throw new NoDataError('No dataset loaded');
        }

        const transformer = new FinancialDataTransformer(transformationConfig);
        const transformedData = await transformer.transform(dataset);
        
        // Update cache and storage
        this.cache.set('dataset', transformedData);
        await this.storageAdapter.save('dataset', transformedData);
        
        this.emit('data:transformed', { 
            data: transformedData,
            transformation: transformationConfig
        });
        
        return transformedData;
    }

    async exportData(format, options = {}) {
        const dataset = this.getCurrentDataset();
        if (!dataset) {
            throw new NoDataError('No dataset to export');
        }

        const exporter = new MultiFormatDataExporter(format, options);
        return await exporter.export(dataset);
    }

    detectFileType(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        const typeMap = {
            'csv': 'csv',
            'tsv': 'tsv',
            'xlsx': 'xlsx',
            'xls': 'xlsx',
            'json': 'json',
            'txt': 'txt',
            'xml': 'xml'
        };
        
        return typeMap[extension] || 'unknown';
    }

    generateMetadata(dataset, file) {
        return {
            filename: file.name,
            fileSize: file.size,
            fileType: file.type || this.detectFileType(file),
            rowCount: dataset.rows.length,
            columnCount: dataset.headers.length,
            columns: dataset.headers,
            numericColumns: this.getNumericColumns(dataset),
            dateColumns: this.getDateColumns(dataset),
            loadedAt: new Date().toISOString(),
            dataProfile: dataset.metadata?.profile,
            quality: dataset.metadata?.quality
        };
    }

    getNumericColumns(dataset) {
        if (!dataset) return [];
        return dataset.headers.filter((header, index) => {
            return dataset.rows.some(row => typeof row[index] === 'number');
        });
    }

    getDateColumns(dataset) {
        if (!dataset) return [];
        return dataset.headers.filter((header, index) => {
            return dataset.rows.some(row => row[index] instanceof Date);
        });
    }

    getColumnStatistics(columnName) {
        const dataset = this.getCurrentDataset();
        if (!dataset) return null;

        const columnIndex = dataset.headers.indexOf(columnName);
        if (columnIndex === -1) return null;

        const values = dataset.rows.map(row => row[columnIndex]).filter(val => val !== null && val !== undefined);
        
        if (values.length === 0) {
            return { type: 'empty', count: 0 };
        }

        const numericValues = values.filter(val => typeof val === 'number');
        
        if (numericValues.length > 0) {
            const sorted = [...numericValues].sort((a, b) => a - b);
            return {
                type: 'numeric',
                count: numericValues.length,
                min: Math.min(...numericValues),
                max: Math.max(...numericValues),
                mean: numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length,
                median: sorted[Math.floor(sorted.length / 2)],
                q1: sorted[Math.floor(sorted.length * 0.25)],
                q3: sorted[Math.floor(sorted.length * 0.75)]
            };
        } else {
            return {
                type: 'categorical',
                count: values.length,
                uniqueValues: new Set(values).size,
                mostCommon: this.getMostCommonValue(values)
            };
        }
    }

    getMostCommonValue(values) {
        const counts = {};
        values.forEach(val => {
            counts[val] = (counts[val] || 0) + 1;
        });
        
        return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0];
    }
}

// Export all improved classes
if (typeof window !== 'undefined') {
    window.ImprovedDataService = ImprovedDataService;
    window.ImprovedCSVParser = ImprovedCSVParser;
    window.TSVParser = TSVParser;
    window.TextParser = TextParser;
    window.XMLParser = XMLParser;
    window.ComprehensiveDataValidators = ComprehensiveDataValidators;
    window.AdvancedDataProcessors = AdvancedDataProcessors;
    window.FinancialDataTransformer = FinancialDataTransformer;
    window.MultiFormatDataExporter = MultiFormatDataExporter;
    window.BatchProcessingService = BatchProcessingService;
    window.DataQualityService = DataQualityService;
}