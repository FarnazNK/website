/**
 * Data Analytics Application
 * Enhanced version with better organization, error handling, and complete implementations
 */

document.addEventListener('DOMContentLoaded', () => {
    const dynamicContent = document.getElementById('dynamicMenuContent');
    
    // Centralized dataset management
    const DataStore = {
        dataset: { headers: [], rows: [] },
        
        getColumnData(columnIndex) {
            return this.dataset.rows
                .map(row => parseFloat(row[columnIndex]))
                .filter(val => !isNaN(val));
        },
        
        saveToLocalStorage() {
            localStorage.setItem('savedDataset', JSON.stringify(this.dataset));
        },
        
        loadFromLocalStorage() {
            const savedData = localStorage.getItem('savedDataset');
            if (savedData) {
                this.dataset = JSON.parse(savedData);
                return true;
            }
            return false;
        },
        
        validateColumn(column) {
            if (!this.dataset.headers.includes(column)) {
                throw new Error(`Invalid column name: ${column}`);
            }
            return true;
        },
        
        getColumnIndex(column) {
            this.validateColumn(column);
            return this.dataset.headers.indexOf(column);
        }
    };

    // Statistics Utilities
    const StatUtils = {
        mean(values) {
            if (!values.length) return 0;
            return values.reduce((sum, val) => sum + val, 0) / values.length;
        },
        
        median(values) {
            if (!values.length) return 0;
            const sorted = [...values].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 === 0 
                ? (sorted[mid - 1] + sorted[mid]) / 2 
                : sorted[mid];
        },
        
        variance(values) {
            if (!values.length) return 0;
            const mean = this.mean(values);
            return this.mean(values.map(val => Math.pow(val - mean, 2)));
        },
        
        stdDev(values) {
            return Math.sqrt(this.variance(values));
        },
        
        skewness(values) {
            if (!values.length) return 0;
            const mean = this.mean(values);
            const stdDev = this.stdDev(values);
            if (stdDev === 0) return 0;
            
            return values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) / values.length;
        },
        
        kurtosis(values) {
            if (!values.length) return 0;
            const mean = this.mean(values);
            const stdDev = this.stdDev(values);
            if (stdDev === 0) return 0;
            
            return (values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) / values.length) - 3;
        },
        
        quartiles(values) {
            if (!values.length) return [0, 0, 0];
            const sorted = [...values].sort((a, b) => a - b);
            const q1Index = Math.floor(sorted.length / 4);
            const q2Index = Math.floor(sorted.length / 2);
            const q3Index = Math.floor(sorted.length * 3 / 4);
            
            return [sorted[q1Index], sorted[q2Index], sorted[q3Index]];
        },
        
        detectOutliers(values) {
            const [q1, _, q3] = this.quartiles(values);
            const iqr = q3 - q1;
            const lowerBound = q1 - 1.5 * iqr;
            const upperBound = q3 + 1.5 * iqr;
            
            return values.filter(val => val < lowerBound || val > upperBound);
        },
        
        correlation(values1, values2) {
            if (values1.length !== values2.length || !values1.length) 
                throw new Error("Cannot calculate correlation: mismatched or empty datasets");
                
            const mean1 = this.mean(values1);
            const mean2 = this.mean(values2);
            
            const numerator = values1.reduce((sum, val, i) => 
                sum + (val - mean1) * (values2[i] - mean2), 0);
                
            const denominator = Math.sqrt(
                values1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) *
                values2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0)
            );
            
            return numerator / denominator;
        }
    };

    // Data Transformation Module
    const DataTransformer = {
        normalize(column) {
            const columnIndex = DataStore.getColumnIndex(column);
            const values = DataStore.getColumnData(columnIndex);
            
            if (!values.length) throw new Error("No numeric data to normalize");
            
            const mean = StatUtils.mean(values);
            const stdDev = StatUtils.stdDev(values);
            
            if (stdDev === 0) throw new Error("Cannot normalize: standard deviation is zero");
            
            DataStore.dataset.rows = DataStore.dataset.rows.map(row => {
                const value = parseFloat(row[columnIndex]);
                if (!isNaN(value)) {
                    row[columnIndex] = ((value - mean) / stdDev).toFixed(4);
                }
                return row;
            });
            
            return `Normalized column: ${column}`;
        },
        
        scale(column) {
            const columnIndex = DataStore.getColumnIndex(column);
            const values = DataStore.getColumnData(columnIndex);
            
            if (!values.length) throw new Error("No numeric data to scale");
            
            const min = Math.min(...values);
            const max = Math.max(...values);
            
            if (min === max) throw new Error("Cannot scale: min equals max");
            
            DataStore.dataset.rows = DataStore.dataset.rows.map(row => {
                const value = parseFloat(row[columnIndex]);
                if (!isNaN(value)) {
                    row[columnIndex] = ((value - min) / (max - min)).toFixed(4);
                }
                return row;
            });
            
            return `Scaled column: ${column} to range [0, 1]`;
        },
        
        logTransform(column) {
            const columnIndex = DataStore.getColumnIndex(column);
            const values = DataStore.getColumnData(columnIndex);
            
            if (!values.length) throw new Error("No numeric data to transform");
            if (Math.min(...values) <= 0) throw new Error("Cannot apply log transform to non-positive values");
            
            DataStore.dataset.rows = DataStore.dataset.rows.map(row => {
                const value = parseFloat(row[columnIndex]);
                if (!isNaN(value) && value > 0) {
                    row[columnIndex] = Math.log(value).toFixed(4);
                }
                return row;
            });
            
            return `Applied log transformation to column: ${column}`;
        },
        
        sqrtTransform(column) {
            const columnIndex = DataStore.getColumnIndex(column);
            const values = DataStore.getColumnData(columnIndex);
            
            if (!values.length) throw new Error("No numeric data to transform");
            if (Math.min(...values) < 0) throw new Error("Cannot apply sqrt transform to negative values");
            
            DataStore.dataset.rows = DataStore.dataset.rows.map(row => {
                const value = parseFloat(row[columnIndex]);
                if (!isNaN(value) && value >= 0) {
                    row[columnIndex] = Math.sqrt(value).toFixed(4);
                }
                return row;
            });
            
            return `Applied square root transformation to column: ${column}`;
        },
        
        expTransform(column) {
            const columnIndex = DataStore.getColumnIndex(column);
            const values = DataStore.getColumnData(columnIndex);
            
            if (!values.length) throw new Error("No numeric data to transform");
            
            DataStore.dataset.rows = DataStore.dataset.rows.map(row => {
                const value = parseFloat(row[columnIndex]);
                if (!isNaN(value)) {
                    row[columnIndex] = Math.exp(value).toFixed(4);
                }
                return row;
            });
            
            return `Applied exponential transformation to column: ${column}`;
        },
        
        inverseTransform(column) {
            const columnIndex = DataStore.getColumnIndex(column);
            const values = DataStore.getColumnData(columnIndex);
            
            if (!values.length) throw new Error("No numeric data to transform");
            if (values.some(val => val === 0)) throw new Error("Cannot apply inverse transform to zero values");
            
            DataStore.dataset.rows = DataStore.dataset.rows.map(row => {
                const value = parseFloat(row[columnIndex]);
                if (!isNaN(value) && value !== 0) {
                    row[columnIndex] = (1 / value).toFixed(4);
                }
                return row;
            });
            
            return `Applied inverse transformation to column: ${column}`;
        },
        
        binningTransform(column, bins) {
            const columnIndex = DataStore.getColumnIndex(column);
            const values = DataStore.getColumnData(columnIndex);
            
            if (!values.length) throw new Error("No numeric data to bin");
            if (bins <= 0) throw new Error("Number of bins must be positive");
            
            const min = Math.min(...values);
            const max = Math.max(...values);
            const binSize = (max - min) / bins;
            
            DataStore.dataset.rows = DataStore.dataset.rows.map(row => {
                const value = parseFloat(row[columnIndex]);
                if (!isNaN(value)) {
                    const bin = Math.min(Math.floor((value - min) / binSize) + 1, bins);
                    row[columnIndex] = `Bin ${bin}`;
                }
                return row;
            });
            
            return `Binned column: ${column} into ${bins} bins`;
        },
        
        absoluteValueTransform(column) {
            const columnIndex = DataStore.getColumnIndex(column);
            const values = DataStore.getColumnData(columnIndex);
            
            if (!values.length) throw new Error("No numeric data to transform");
            
            DataStore.dataset.rows = DataStore.dataset.rows.map(row => {
                const value = parseFloat(row[columnIndex]);
                if (!isNaN(value)) {
                    row[columnIndex] = Math.abs(value).toFixed(4);
                }
                return row;
            });
            
            return `Applied absolute value transformation to column: ${column}`;
        },
        
        cappingTransform(column, percentile) {
            const columnIndex = DataStore.getColumnIndex(column);
            const values = DataStore.getColumnData(columnIndex);
            
            if (!values.length) throw new Error("No numeric data to cap");
            if (percentile <= 0 || percentile >= 1) throw new Error("Percentile must be between 0 and 1");
            
            const sorted = [...values].sort((a, b) => a - b);
            const lowerIndex = Math.floor(percentile * sorted.length);
            const upperIndex = Math.ceil((1 - percentile) * sorted.length) - 1;
            
            const lowerCap = sorted[lowerIndex];
            const upperCap = sorted[upperIndex];
            
            DataStore.dataset.rows = DataStore.dataset.rows.map(row => {
                const value = parseFloat(row[columnIndex]);
                if (!isNaN(value)) {
                    row[columnIndex] = Math.max(lowerCap, Math.min(value, upperCap)).toFixed(4);
                }
                return row;
            });
            
            return `Capped column: ${column} to ${percentile * 100}% bounds`;
        },
        
        oneHotEncoding(column) {
            const columnIndex = DataStore.getColumnIndex(column);
            const uniqueValues = [...new Set(DataStore.dataset.rows.map(row => row[columnIndex]))];
            
            uniqueValues.forEach(value => {
                const encodedColName = `${column}_${value}`;
                DataStore.dataset.headers.push(encodedColName);
                DataStore.dataset.rows = DataStore.dataset.rows.map(row => {
                    row.push(row[columnIndex] === value ? 1 : 0);
                    return row;
                });
            });
            
            return `Applied one-hot encoding to column: ${column}`;
        },
        
        standardizeData(column) {
            return this.normalize(column); // Same implementation as normalize
        },
        
        clipping(column, minValue, maxValue) {
            const columnIndex = DataStore.getColumnIndex(column);
            
            if (isNaN(minValue) || isNaN(maxValue) || minValue >= maxValue) {
                throw new Error("Invalid range for clipping");
            }
            
            DataStore.dataset.rows = DataStore.dataset.rows.map(row => {
                const value = parseFloat(row[columnIndex]);
                if (!isNaN(value)) {
                    row[columnIndex] = Math.max(minValue, Math.min(value, maxValue)).toFixed(4);
                }
                return row;
            });
            
            return `Clipped column: ${column} to range [${minValue}, ${maxValue}]`;
        }
    };

    // Data Loading and File Processing Module
    const DataLoader = {
        processCSV(content) {
            if (!content.trim()) {
                throw new Error("The file is empty");
            }
            
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
            
            return rows;
        },
        
        processExcel(jsonData) {
            if (!jsonData.length) {
                throw new Error("The Excel file is empty");
            }
            
            return jsonData;
        },
        
        loadToDataStore(rows) {
            if (rows.length < 2) {
                throw new Error("Not enough data rows");
            }
            
            DataStore.dataset.headers = rows[0].map(h => h.trim());
            DataStore.dataset.rows = rows.slice(1);
            DataStore.saveToLocalStorage();
        },
        
        createFileInput() {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.csv, .xlsx, .xls';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);
            
            return new Promise((resolve, reject) => {
                fileInput.addEventListener('change', async (event) => {
                    const file = fileInput.files[0];
                    if (!file) {
                        document.body.removeChild(fileInput);
                        reject(new Error("No file selected"));
                        return;
                    }
                    
                    try {
                        const fileExtension = file.name.split('.').pop().toLowerCase();
                        const reader = new FileReader();
                        
                        if (fileExtension === 'csv') {
                            reader.onload = (event) => {
                                try {
                                    const rows = this.processCSV(event.target.result);
                                    this.loadToDataStore(rows);
                                    resolve("CSV data loaded successfully");
                                } catch (error) {
                                    reject(error);
                                }
                            };
                            reader.readAsText(file);
                        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                            reader.onload = async (event) => {
                                try {
                                    const data = new Uint8Array(event.target.result);
                                    const workbook = XLSX.read(data, { type: 'array' });
                                    const sheetName = workbook.SheetNames[0];
                                    const worksheet = workbook.Sheets[sheetName];
                                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                                    
                                    const rows = this.processExcel(jsonData);
                                    this.loadToDataStore(rows);
                                    resolve("Excel data loaded successfully");
                                } catch (error) {
                                    reject(error);
                                }
                            };
                            reader.readAsArrayBuffer(file);
                        } else {
                            reject(new Error("Invalid file type"));
                        }
                    } catch (error) {
                        reject(error);
                    } finally {
                        document.body.removeChild(fileInput);
                    }
                });
                
                fileInput.click();
            });
        }
    };

    // Visualization Module
    const Visualizer = {
        currentChart: null,
        
        createChartConfig(type, labels, data, options) {
            let dataset = {};
            const pieTypes = ['pie', 'doughnut', 'radar'];
            
            if (pieTypes.includes(type)) {
                dataset = {
                    data: data,
                    backgroundColor: data.map(() => options.chartColor || '#4b9cdf'),
                    borderWidth: (type === 'pie' && options.pieOptions) ? 
                        options.pieOptions.sliceBorderWidth : 1
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
                        },
                        min: options.xAxisRange ? options.xAxisRange[0] : undefined,
                        max: options.xAxisRange ? options.xAxisRange[1] : undefined
                    },
                    y: {
                        title: {
                            display: true,
                            text: options.yAxisColumn
                        },
                        min: options.yAxisRange ? options.yAxisRange[0] : undefined,
                        max: options.yAxisRange ? options.yAxisRange[1] : undefined
                    }
                };
            }
            
            // Add percentage tooltips for pie charts
            if (type === 'pie' && options.pieOptions && options.pieOptions.showPercentages) {
                config.options.plugins.tooltip = {
                    callbacks: {
                        label: function(context) {
                            const dataset = context.chart.data.datasets[0];
                            const total = dataset.data.reduce((sum, val) => sum + val, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return `${context.label}: ${percentage}%`;
                        }
                    }
                };
            }
            
            return config;
        },
        
        generateChart(options) {
            const {
                xAxisColumn, 
                yAxisColumn, 
                chartType, 
                chartLabel, 
                chartColor, 
                showLegend, 
                xAxisRange, 
                yAxisRange, 
                pieOptions
            } = options;
            
            if (!xAxisColumn || !yAxisColumn) {
                throw new Error("Both X and Y axes must be selected");
            }
            
            const xColumnIndex = DataStore.getColumnIndex(xAxisColumn);
            const yColumnIndex = DataStore.getColumnIndex(yAxisColumn);
            
            const labels = DataStore.dataset.rows.map(row => row[xColumnIndex]);
            const data = DataStore.dataset.rows.map(row => parseFloat(row[yColumnIndex]));
            
            if (data.every(isNaN)) {
                throw new Error("The selected Y-axis column contains no valid numeric data");
            }
            
            const chartOptions = {
                chartLabel: chartLabel || `${yAxisColumn} vs ${xAxisColumn}`,
                chartColor: chartColor || '#4b9cdf',
                showLegend: showLegend ?? true,
                xAxisColumn,
                yAxisColumn,
                xAxisRange,
                yAxisRange,
                pieOptions
            };
            
            const config = this.createChartConfig(chartType, labels, data, chartOptions);
            
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
            
            return chartInstance;
        },
        
        updateChart(chartInstance, options) {
            const {
                xAxisColumn,
                yAxisColumn,
                chartLabel,
                chartColor,
                xAxisRange,
                yAxisRange
            } = options;
            
            const xColumnIndex = DataStore.getColumnIndex(xAxisColumn);
            const yColumnIndex = DataStore.getColumnIndex(yAxisColumn);
            
            const newLabels = DataStore.dataset.rows.map(row => row[xColumnIndex]);
            const newData = DataStore.dataset.rows.map(row => parseFloat(row[yColumnIndex]));
            
            chartInstance.data.labels = newLabels;
            
            const isPieChart = ['pie', 'doughnut', 'radar'].includes(chartInstance.config.type);
            
            if (isPieChart) {
                chartInstance.data.datasets[0].data = newData;
                chartInstance.data.datasets[0].backgroundColor = newData.map(() => chartColor || '#4b9cdf');
            } else {
                chartInstance.data.datasets[0].data = newData;
                chartInstance.data.datasets[0].label = chartLabel || `${yAxisColumn} vs ${xAxisColumn}`;
                chartInstance.data.datasets[0].backgroundColor = chartColor || '#4b9cdf';
                chartInstance.data.datasets[0].borderColor = chartColor || '#4b9cdf';
            }
            
            // Update scales for non-pie charts
            if (!isPieChart) {
                if (chartInstance.options.scales.x) {
                    chartInstance.options.scales.x.title.text = xAxisColumn;
                    
                    if (xAxisRange) {
                        chartInstance.options.scales.x.min = xAxisRange[0];
                        chartInstance.options.scales.x.max = xAxisRange[1];
                    } else {
                        delete chartInstance.options.scales.x.min;
                        delete chartInstance.options.scales.x.max;
                    }
                }
                
                if (chartInstance.options.scales.y) {
                    chartInstance.options.scales.y.title.text = yAxisColumn;
                    
                    if (yAxisRange) {
                        chartInstance.options.scales.y.min = yAxisRange[0];
                        chartInstance.options.scales.y.max = yAxisRange[1];
                    } else {
                        delete chartInstance.options.scales.y.min;
                        delete chartInstance.options.scales.y.max;
                    }
                }
            }
            
            chartInstance.update();
        }
    };

    // Machine Learning Module
    const MLModule = {
        async performLinearRegression(xColumn, yColumn) {
            try {
                const xColumnIndex = DataStore.getColumnIndex(xColumn);
                const yColumnIndex = DataStore.getColumnIndex(yColumn);
                
                const xValues = DataStore.getColumnData(xColumnIndex);
                const yValues = DataStore.getColumnData(yColumnIndex);
                
                if (xValues.length !== yValues.length || xValues.length === 0) {
                    throw new Error("Invalid data: X and Y columns must have the same number of numeric entries");
                }
                
                // Create and train model
                const model = tf.sequential();
                model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
                model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });
                
                const xs = tf.tensor2d(xValues, [xValues.length, 1]);
                const ys = tf.tensor2d(yValues, [yValues.length, 1]);
                
                await model.fit(xs, ys, { epochs: 100 });
                
                // Generate predictions
                const predictions = model.predict(xs).dataSync();
                
                // Calculate metrics
                const r2 = this.calculateR2(yValues, predictions);
                const rmse = this.calculateRMSE(yValues, predictions);
                
                return {
                    xValues,
                    yValues,
                    predictions,
                    metrics: {
                        r2,
                        rmse,
                        equation: this.getEquation(model)
                    }
                };
            } catch (error) {
                console.error("Linear regression error:", error);
                throw error;
            }
        },
        
        async performLogisticRegression(xColumn, yColumn, threshold = 0.5) {
            try {
                const xColumnIndex = DataStore.getColumnIndex(xColumn);
                const yColumnIndex = DataStore.getColumnIndex(yColumn);
                
                const xValues = DataStore.getColumnData(xColumnIndex);
                const rawYValues = DataStore.getColumnData(yColumnIndex);
                
                // Convert Y values to binary (0 or 1)
                const yValues = rawYValues.map(y => y > threshold ? 1 : 0);
                
                if (xValues.length !== yValues.length || xValues.length === 0) {
                    throw new Error("Invalid data: X and Y columns must have the same number of entries");
                }
                
                // Create and train model
                const model = tf.sequential();
                model.add(tf.layers.dense({ units: 1, inputShape: [1], activation: 'sigmoid' }));
                model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });
                
                const xs = tf.tensor2d(xValues, [xValues.length, 1]);
                const ys = tf.tensor2d(yValues, [yValues.length, 1]);
                
                const result = await model.fit(xs, ys, { epochs: 100 });
                
                // Generate predictions
                const predictions = model.predict(xs).dataSync();
                
                // Calculate metrics
                const accuracy = this.calculateAccuracy(yValues, predictions.map(p => p > 0.5 ? 1 : 0));
                
                return {
                    xValues,
                    yValues,
                    predictions,
                    metrics: {
                        accuracy,
                        loss: result.history.loss[result.history.loss.length - 1],
                        equation: this.getEquation(model, 'logistic')
                    }
                };
            } catch (error) {
                console.error("Logistic regression error:", error);
                throw error;
            }
        },
        
        async performKMeans(xColumn, yColumn, k = 3) {
            try {
                const xColumnIndex = DataStore.getColumnIndex(xColumn);
                const yColumnIndex = DataStore.getColumnIndex(yColumn);
                
                const xValues = DataStore.getColumnData(xColumnIndex);
                const yValues = DataStore.getColumnData(yColumnIndex);
                
                if (xValues.length !== yValues.length || xValues.length === 0) {
                    throw new Error("Invalid data for clustering");
                }
                
                // Prepare data points
                const points = xValues.map((x, i) => [x, yValues[i]]);
                
                // Implementation using TensorFlow.js
                // Convert data to tensor
                const pointsTensor = tf.tensor2d(points);
                
                // Normalize data
                const { mean, variance } = tf.moments(pointsTensor, 0);
                const std = tf.sqrt(variance);
                const normalizedPoints = pointsTensor.sub(mean).div(std);
                
                // Initialize random centroids
                let centroids = tf.randomUniform([k, 2], -1, 1);
                
                // Implement K-means algorithm
                const maxIterations = 20;
                let iterations = 0;
                let oldCentroids = null;
                
                while (iterations < maxIterations) {
                    // Assign points to clusters
                    const distances = tf.tidy(() => {
                        const expandedPoints = normalizedPoints.expandDims(1);
                        const expandedCentroids = centroids.expandDims(0);
                        return expandedPoints.sub(expandedCentroids).pow(2).sum(2).sqrt();
                    });
                    
                    const assignments = distances.argMin(1);
                    
                    // Store old centroids
                    oldCentroids = centroids.clone();
                    
                    // Update centroids
                    for (let i = 0; i < k; i++) {
                        const mask = assignments.equal(tf.scalar(i, 'int32')).expandDims(1);
                        const pointsInCluster = normalizedPoints.mul(mask.cast('float32')).sum(0);
                        const numPointsInCluster = mask.sum();
                        
                        if (numPointsInCluster.dataSync()[0] > 0) {
                            const newCentroid = pointsInCluster.div(numPointsInCluster);
                            centroids = tf.tidy(() => {
                                const updated = centroids.buffer();
                                const newVals = newCentroid.dataSync();
                                updated.set(newVals[0], i, 0);
                                updated.set(newVals[1], i, 1);
                                return updated.toTensor();
                            });
                        }
                    }
                    
                    // Check for convergence
                    const centroidChange = oldCentroids.sub(centroids).pow(2).sum().sqrt().dataSync()[0];
                    if (centroidChange < 0.001) {
                        break;
                    }
                    
                    iterations++;
                }
                
                // Get final assignments
                const distances = tf.tidy(() => {
                    const expandedPoints = normalizedPoints.expandDims(1);
                    const expandedCentroids = centroids.expandDims(0);
                    return expandedPoints.sub(expandedCentroids).pow(2).sum(2).sqrt();
                });
                
                const assignments = distances.argMin(1).dataSync();
                
                // Transform centroids back to original scale
                const denormalizedCentroids = centroids.mul(std).add(mean);
                
                // Clean up tensors
                pointsTensor.dispose();
                normalizedPoints.dispose();
                distances.dispose();
                oldCentroids.dispose();
                
                return {
                    points: points,
                    centroids: denormalizedCentroids.arraySync(),
                    assignments: Array.from(assignments),
                    k: k
                };
            } catch (error) {
                console.error("K-means clustering error:", error);
                throw error;
            }
        },
        
        async performPCA(columns, numComponents = 2) {
            try {
                // Get data for selected columns
                const columnIndices = columns.map(col => DataStore.getColumnIndex(col));
                
                // Extract numeric data for all selected columns
                const data = DataStore.dataset.rows.map(row => 
                    columnIndices.map(index => parseFloat(row[index]))
                ).filter(row => row.every(val => !isNaN(val)));
                
                if (data.length === 0) {
                    throw new Error("No valid numeric data for PCA");
                }
                
                // Convert to tensor
                const dataTensor = tf.tensor2d(data);
                
                // Step 1: Standardize the data
                const { mean, variance } = tf.moments(dataTensor, 0);
                const std = tf.sqrt(variance);
                const standardized = dataTensor.sub(mean).div(std);
                
                // Step 2: Compute covariance matrix
                const transposed = standardized.transpose();
                const n = standardized.shape[0];
                const covariance = tf.matMul(transposed, standardized).div(tf.scalar(n - 1));
                
                // Step 3: Compute eigenvectors and eigenvalues
                // Note: TensorFlow.js doesn't have direct eigendecomposition,
                // so we'll use SVD which is related for symmetric matrices
                const { u, s } = tf.linalg.svd(covariance);
                
                // The principal components are the eigenvectors (u)
                // The explained variance is related to the singular values (s)
                
                // Step 4: Project data onto principal components
                const principalComponents = u.slice([0, 0], [u.shape[0], numComponents]);
                const projectedData = tf.matMul(standardized, principalComponents);
                
                // Calculate explained variance ratio
                const totalVariance = s.sum().dataSync()[0];
                const explainedVariance = s.slice(0, numComponents).dataSync();
                const explainedVarianceRatio = explainedVariance.map(v => v / totalVariance);
                
                // Clean up tensors
                dataTensor.dispose();
                standardized.dispose();
                transposed.dispose();
                covariance.dispose();
                
                return {
                    projectedData: projectedData.arraySync(),
                    components: principalComponents.arraySync(),
                    explainedVariance: explainedVariance,
                    explainedVarianceRatio: explainedVarianceRatio,
                    originalFeatures: columns
                };
            } catch (error) {
                console.error("PCA error:", error);
                throw error;
            }
        },
        
        // Helper methods for ML metrics
        calculateR2(actual, predicted) {
            const mean = actual.reduce((sum, val) => sum + val, 0) / actual.length;
            const ssTotal = actual.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
            const ssResidual = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
            return 1 - (ssResidual / ssTotal);
        },
        
        calculateRMSE(actual, predicted) {
            const mse = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0) / actual.length;
            return Math.sqrt(mse);
        },
        
        calculateAccuracy(actual, predicted) {
            const correct = actual.filter((val, i) => val === predicted[i]).length;
            return correct / actual.length;
        },
        
        getEquation(model, type = 'linear') {
            const weights = model.layers[0].getWeights()[0].dataSync()[0];
            const bias = model.layers[0].getWeights()[1].dataSync()[0];
            
            if (type === 'linear') {
                return `y = ${weights.toFixed(4)} × x + ${bias.toFixed(4)}`;
            } else if (type === 'logistic') {
                return `p = 1 / (1 + exp(-(${weights.toFixed(4)} × x + ${bias.toFixed(4)})))`;
            }
            
            return `Unknown equation type`;
        }
    };

    // UI Controller Module
    const UIController = {
        // Data Section UI
        renderDataSection() {
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
        
        renderDataTable() {
            const tableHead = `<tr>${DataStore.dataset.headers.map(header => 
                `<th>${header.trim()}</th>`).join('')}</tr>`;
                
            const tableBody = DataStore.dataset.rows.map(row => {
                return `<tr>${row.map(cell => 
                    `<td>${cell ? cell.toString().trim() : ''}</td>`).join('')}</tr>`;
            }).join('');
            
            return `
            <div class="table-container bg-dark rounded p-3">
                <table class="table table-dark table-striped">
                    <thead id="tableHead">${tableHead}</thead>
                    <tbody id="tableBody">${tableBody}</tbody>
                </table>
            </div>`;
        },
        
        // Transformations Section UI
        renderTransformationsSection() {
            return `
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
            </section>`;
        },
        
        // ML Predictions Section UI
        renderPredictionsSection() {
            return `
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
            </section>`;
        },
        
        // Statistics Section UI
        renderStatisticsSection() {
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
                                        ${DataStore.dataset.headers.map(header => 
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
        },
        
        // Plots Section UI
        renderPlotsSection() {
            return `
            <section style="background: linear-gradient(115deg, #6dcfe7, #1e1e1e);">
                <div class="container py-4">
                    <div class="row">
                        <div class="col-3 bg-dark text-light p-3 rounded shadow-sm">
                            <h4>Plot Options</h4>
                            <label>Select X-Axis:</label>
                            <select id="xAxisColumn" class="form-control mb-3">
                                ${DataStore.dataset.headers.map(header => 
                                    `<option value="${header}">${header}</option>`).join('')}
                            </select>
                            <label>Select Y-Axis:</label>
                            <select id="yAxisColumn" class="form-control mb-3">
                                ${DataStore.dataset.headers.map(header => 
                                    `<option value="${header}">${header}</option>`).join('')}
                            </select>
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
        
        showErrorMessage(message) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-danger alert-dismissible fade show';
            alertDiv.innerHTML = `
                <strong>Error:</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            
            const container = document.querySelector('#transformation-content, #data-content, #model-content');
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
        },
        
        showSuccessMessage(message, container) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-success alert-dismissible fade show';
            alertDiv.innerHTML = `
                <strong>Success:</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            
            container = container || document.querySelector('#transformation-content, #data-content, #model-content');
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
    };

    // Application Controller - Initializes and connects all modules
    const App = {
        init() {
            this.loadSavedData();
            this.attachToolbarEventListeners();
        },
        
        loadSavedData() {
            if (DataStore.loadFromLocalStorage()) {
                console.log("Loaded data from local storage");
            }
        },
        
        attachToolbarEventListeners() {
            // Data Section
            const dataButton = document.getElementById('toolbar-data');
            if (dataButton) {
                dataButton.addEventListener('click', () => {
                    dynamicContent.innerHTML = UIController.renderDataSection();
                    this.attachDataMenuEventListeners();
                });
            }
            
            // Transformations Section
            const transformationsButton = document.getElementById('toolbar-transformations');
            if (transformationsButton) {
                transformationsButton.addEventListener('click', () => {
                    if (!this.checkDataAvailable()) return;
                    
                    dynamicContent.innerHTML = UIController.renderTransformationsSection();
                    this.attachTransformationEventListeners();
                });
            }
            
            // Predictions Section
            const predictionsButton = document.getElementById('toolbar-predictions');
            if (predictionsButton) {
                predictionsButton.addEventListener('click', () => {
                    if (!this.checkDataAvailable()) return;
                    
                    dynamicContent.innerHTML = UIController.renderPredictionsSection();
                    this.attachPredictionEventListeners();
                });
            }
            
            // Statistics Section
            const statsButton = document.getElementById('toolbar-statistics');
            if (statsButton) {
                statsButton.addEventListener('click', () => {
                    if (!this.checkDataAvailable()) return;
                    
                    dynamicContent.innerHTML = UIController.renderStatisticsSection();
                    this.attachStatisticsEventListeners();
                });
            }
            
            // Plots Section
            const plotsButton = document.getElementById('toolbar-plots');
            if (plotsButton) {
                plotsButton.addEventListener('click', () => {
                    if (!this.checkDataAvailable()) return;
                    
                    dynamicContent.innerHTML = UIController.renderPlotsSection();
                    this.attachPlotEventListeners();
                });
            }
        },
        
        checkDataAvailable() {
            if (!DataStore.dataset.headers.length) {
                alert('No data available. Please load data in the Data section first.');
                dynamicContent.innerHTML = UIController.renderDataSection();
                this.attachDataMenuEventListeners();
                return false;
            }
            return true;
        },
        
        attachDataMenuEventListeners() {
            document.getElementById('menu-load-data').addEventListener('click', () => {
                document.getElementById('data-content').innerHTML = `
                    <div class="p-3 text-center">
                        <button class="btn btn-primary mb-3" id="load-data-button">
                            <i class="bi bi-upload"></i> Upload Data File
                        </button>
                        <p class="text-muted">Supported formats: CSV, Excel (.xlsx, .xls)</p>
                    </div>
                    <div id="data-preview"></div>
                `;
                
                document.getElementById('load-data-button').addEventListener('click', async () => {
                    try {
                        const result = await DataLoader.createFileInput();
                        document.getElementById('data-preview').innerHTML = UIController.renderDataTable();
                        UIController.showSuccessMessage(result, document.getElementById('data-content'));
                    } catch (error) {
                        UIController.showErrorMessage(error.message);
                    }
                });
            });
            
            document.getElementById('menu-clean-data').addEventListener('click', () => {
                if (!this.checkDataAvailable()) return;
                
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
                
                this.attachDataCleaningEventListeners();
            });
            
            document.getElementById('menu-filter-data').addEventListener('click', () => {
                if (!this.checkDataAvailable()) return;
                
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
                
                this.attachDataFilteringEventListeners();
            });
            
            document.getElementById('menu-identify-types').addEventListener('click', () => {
                if (!this.checkDataAvailable()) return;
                
                const columnTypes = DataStore.dataset.headers.map(header => {
                    const columnIndex = DataStore.dataset.headers.indexOf(header);
                    const values = DataStore.dataset.rows.map(row => row[columnIndex]);
                    const detectedType = this.detectColumnType(values);
                    return { column: header, type: detectedType };
                });
                
                const tableHTML = `
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
            });
        },
        
        detectColumnType(values) {
            const uniqueValues = [...new Set(values.filter(v => v !== ""))];
            const numValues = uniqueValues.map(v => parseFloat(v)).filter(v => !isNaN(v));
            
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
        },
        
        attachDataCleaningEventListeners() {
            // Remove Missing Values
            document.getElementById('remove-missing').addEventListener('click', () => {
                try {
                    const beforeCount = DataStore.dataset.rows.length;
                    DataStore.dataset.rows = DataStore.dataset.rows.filter(row => 
                        row.every(cell => cell !== null && cell !== ''));
                    const afterCount = DataStore.dataset.rows.length;
                    
                    DataStore.saveToLocalStorage();
                    UIController.showSuccessMessage(`Removed ${beforeCount - afterCount} rows with missing values.`);
                    document.getElementById('cleaning-result').innerHTML = UIController.renderDataTable();
                } catch (error) {
                    UIController.showErrorMessage(error.message);
                }
            });
            
            // Remove Duplicate Rows
            document.getElementById('remove-duplicates').addEventListener('click', () => {
                try {
                    const beforeCount = DataStore.dataset.rows.length;
                    const uniqueRows = new Map();
                    
                    DataStore.dataset.rows.forEach(row => {
                        const key = JSON.stringify(row);
                        uniqueRows.set(key, row);
                    });
                    
                    DataStore.dataset.rows = Array.from(uniqueRows.values());
                    const afterCount = DataStore.dataset.rows.length;
                    
                    DataStore.saveToLocalStorage();
                    UIController.showSuccessMessage(`Removed ${beforeCount - afterCount} duplicate rows.`);
                    document.getElementById('cleaning-result').innerHTML = UIController.renderDataTable();
                } catch (error) {
                    UIController.showErrorMessage(error.message);
                }
            });
            
            // Trim Spaces
            document.getElementById('trim-spaces').addEventListener('click', () => {
                try {
                    DataStore.dataset.rows = DataStore.dataset.rows.map(row => 
                        row.map(cell => typeof cell === 'string' ? cell.trim() : cell));
                    
                    DataStore.saveToLocalStorage();
                    UIController.showSuccessMessage("Trimmed leading and trailing spaces from all text cells.");
                    document.getElementById('cleaning-result').innerHTML = UIController.renderDataTable();
                } catch (error) {
                    UIController.showErrorMessage(error.message);
                }
            });
            
            // Convert to Lowercase
            document.getElementById('convert-lowercase').addEventListener('click', () => {
                try {
                    DataStore.dataset.rows = DataStore.dataset.rows.map(row => 
                        row.map(cell => typeof cell === 'string' ? cell.toLowerCase() : cell));
                    
                    DataStore.saveToLocalStorage();
                    UIController.showSuccessMessage("Converted all text to lowercase.");
                    document.getElementById('cleaning-result').innerHTML = UIController.renderDataTable();
                } catch (error) {
                    UIController.showErrorMessage(error.message);
                }
            });
            
            // Remove Outliers
            document.getElementById('remove-outliers').addEventListener('click', () => {
                try {
                    const column = prompt('Enter the column name to remove outliers:');
                    if (!column) return;
                    
                    const columnIndex = DataStore.getColumnIndex(column);
                    const values = DataStore.getColumnData(columnIndex);
                    
                    if (values.length === 0) {
                        throw new Error("No numeric data in the selected column");
                    }
                    
                    const outliers = StatUtils.detectOutliers(values);
                    const beforeCount = DataStore.dataset.rows.length;
                    
                    DataStore.dataset.rows = DataStore.dataset.rows.filter(row => {
                        const value = parseFloat(row[columnIndex]);
                        return isNaN(value) || !outliers.includes(value);
                    });
                    
                    const afterCount = DataStore.dataset.rows.length;
                    
                    DataStore.saveToLocalStorage();
                    UIController.showSuccessMessage(`Removed ${beforeCount - afterCount} outliers from column "${column}".`);
                    document.getElementById('cleaning-result').innerHTML = UIController.renderDataTable();
                } catch (error) {
                    UIController.showErrorMessage(error.message);
                }
            });
            
            // Filter Rows
            document.getElementById('filter-rows').addEventListener('click', () => {
                try {
                    const condition = prompt('Enter a condition to filter rows (e.g., "Age > 30"):');
                    if (!condition) return;
                    
                    const beforeCount = DataStore.dataset.rows.length;
                    
                    // Parse condition into components
                    const matches = condition.match(/(\w+)\s*([<>=!]+)\s*(.+)/);
                    if (!matches || matches.length < 4) {
                        throw new Error("Invalid condition format. Example: Age > 30");
                    }
                    
                    const [_, column, operator, valueStr] = matches;
                    
                    if (!DataStore.dataset.headers.includes(column)) {
                        throw new Error(`Column "${column}" not found in dataset`);
                    }
                    
                    const columnIndex = DataStore.dataset.headers.indexOf(column);
                    const value = isNaN(parseFloat(valueStr)) ? valueStr.trim() : parseFloat(valueStr);
                    
                    DataStore.dataset.rows = DataStore.dataset.rows.filter(row => {
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
                    
                    const afterCount = DataStore.dataset.rows.length;
                    
                    DataStore.saveToLocalStorage();
                    UIController.showSuccessMessage(`Filtered ${beforeCount - afterCount} rows based on condition: ${condition}`);
                    document.getElementById('cleaning-result').innerHTML = UIController.renderDataTable();
                } catch (error) {
                    UIController.showErrorMessage(error.message);
                }
            });
        },
        
        attachDataFilteringEventListeners() {
            // Filter by Condition - same as 'filter-rows' in cleaning section
            document.getElementById('filter-condition').addEventListener('click', () => {
                try {
                    const condition = prompt('Enter a condition to filter rows (e.g., "Age > 30"):');
                    if (!condition) return;
                    
                    const beforeCount = DataStore.dataset.rows.length;
                    
                    // Parse condition into components
                    const matches = condition.match(/(\w+)\s*([<>=!]+)\s*(.+)/);
                    if (!matches || matches.length < 4) {
                        throw new Error("Invalid condition format. Example: Age > 30");
                    }
                    
                    const [_, column, operator, valueStr] = matches;
                    
                    if (!DataStore.dataset.headers.includes(column)) {
                        throw new Error(`Column "${column}" not found in dataset`);
                    }
                    
                    const columnIndex = DataStore.dataset.headers.indexOf(column);
                    const value = isNaN(parseFloat(valueStr)) ? valueStr.trim() : parseFloat(valueStr);
                    
                    DataStore.dataset.rows = DataStore.dataset.rows.filter(row => {
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
                    
                    const afterCount = DataStore.dataset.rows.length;
                    
                    DataStore.saveToLocalStorage();
                    UIController.showSuccessMessage(`Filtered ${beforeCount - afterCount} rows based on condition: ${condition}`);
                    document.getElementById('filtering-result').innerHTML = UIController.renderDataTable();
                } catch (error) {
                    UIController.showErrorMessage(error.message);
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
                    
                    const columnIndex = DataStore.getColumnIndex(column);
                    const beforeCount = DataStore.dataset.rows.length;
                    
                    DataStore.dataset.rows = DataStore.dataset.rows.filter(row => {
                        const value = parseFloat(row[columnIndex]);
                        return !isNaN(value) && value >= minValue && value <= maxValue;
                    });
                    
                    const afterCount = DataStore.dataset.rows.length;
                    
                    DataStore.saveToLocalStorage();
                    UIController.showSuccessMessage(`Filtered to ${afterCount} rows with column "${column}" in range [${minValue}, ${maxValue}]`);
                    document.getElementById('filtering-result').innerHTML = UIController.renderDataTable();
                } catch (error) {
                    UIController.showErrorMessage(error.message);
                }
            });
            
            // Filter Top N Rows
            document.getElementById('filter-top-n').addEventListener('click', () => {
                try {
                    const n = parseInt(prompt('Enter the number of top rows to keep (N):'), 10);
                    if (isNaN(n) || n <= 0) {
                        throw new Error("Invalid value for N");
                    }
                    
                    const beforeCount = DataStore.dataset.rows.length;
                    DataStore.dataset.rows = DataStore.dataset.rows.slice(0, n);
                    
                    DataStore.saveToLocalStorage();
                    UIController.showSuccessMessage(`Kept top ${n} rows (removed ${beforeCount - n} rows)`);
                    document.getElementById('filtering-result').innerHTML = UIController.renderDataTable();
                } catch (error) {
                    UIController.showErrorMessage(error.message);
                }
            });
            
            // Filter Rows with Null Column
            document.getElementById('filter-column-null').addEventListener('click', () => {
                try {
                    const column = prompt('Enter the column name to check for null values:');
                    if (!column) return;
                    
                    const columnIndex = DataStore.getColumnIndex(column);
                    const beforeCount = DataStore.dataset.rows.length;
                    
                    DataStore.dataset.rows = DataStore.dataset.rows.filter(row => 
                        row[columnIndex] !== null && row[columnIndex] !== '');
                    
                    const afterCount = DataStore.dataset.rows.length;
                    
                    DataStore.saveToLocalStorage();
                    UIController.showSuccessMessage(`Kept ${afterCount} rows with non-null values in column "${column}"`);
                    document.getElementById('filtering-result').innerHTML = UIController.renderDataTable();
                } catch (error) {
                    UIController.showErrorMessage(error.message);
                }
            });
        },
        
        attachTransformationEventListeners() {
            const transformButtons = [
                { id: 'normalize-data', method: DataTransformer.normalize },
                { id: 'scale-data', method: DataTransformer.scale },
                { id: 'log-transform', method: DataTransformer.logTransform },
                { id: 'sqrt-transform', method: DataTransformer.sqrtTransform },
                { id: 'exp-transform', method: DataTransformer.expTransform },
                { id: 'inverse-transform', method: DataTransformer.inverseTransform },
                { id: 'absolute-value', method: DataTransformer.absoluteValueTransform },
                { id: 'standardize-data', method: DataTransformer.standardizeData },
            ];
            
            // Simple transformations that just need a column name
            transformButtons.forEach(button => {
                document.getElementById(button.id).addEventListener('click', () => {
                    try {
                        const column = prompt(`Enter the column name for ${button.id}:`);
                        if (!column) return;
                        
                        const result = button.method.call(DataTransformer, column);
                        DataStore.saveToLocalStorage();
                        
                        document.getElementById('transformation-content').innerHTML = `
                            <h4>Transformation Result</h4>
                            <div class="alert alert-success mb-3">${result}</div>
                            ${UIController.renderDataTable()}
                        `;
                    } catch (error) {
                        UIController.showErrorMessage(error.message);
                    }
                });
            });
            
            // Custom transformation
            document.getElementById('custom-transform').addEventListener('click', () => {
                try {
                    const column = prompt('Enter the column name for custom transformation:');
                    if (!column) return;
                    
                    const expression = prompt('Enter the transformation expression (e.g., x * 2 for doubling values):');
                    if (!expression) throw new Error("Invalid transformation expression");
                    
                    const columnIndex = DataStore.getColumnIndex(column);
                    
                    DataStore.dataset.rows = DataStore.dataset.rows.map(row => {
                        const value = parseFloat(row[columnIndex]);
                        if (!isNaN(value)) {
                            try {
                                // Using safer function constructor to evaluate expression
                                const calculate = new Function('x', `return ${expression}`);
                                row[columnIndex] = calculate(value).toFixed(4);
                            } catch (e) {
                                throw new Error("Error in transformation expression");
                            }
                        }
                        return row;
                    });
                    
                    DataStore.saveToLocalStorage();
                    
                    document.getElementById('transformation-content').innerHTML = `
                        <h4>Transformation Result</h4>
                        <div class="alert alert-success mb-3">Applied custom transformation to column: ${column}</div>
                        ${UIController.renderDataTable()}
                    `;
                } catch (error) {
                    UIController.showErrorMessage(error.message);
                }
            });
            
            // Binning
            document.getElementById('binning-data').addEventListener('click', () => {
                try {
                    const column = prompt('Enter the column name for binning:');
                    if (!column) return;
                    
                    const bins = parseInt(prompt('Enter the number of bins:'), 10);
                    if (isNaN(bins) || bins <= 0) throw new Error("Invalid number of bins");
                    
                    const result = DataTransformer.binningTransform(column, bins);
                    DataStore.saveToLocalStorage();
                    
                    document.getElementById('transformation-content').innerHTML = `
                        <h4>Transformation Result</h4>
                        <div class="alert alert-success mb-3">${result}</div>
                        ${UIController.renderDataTable()}
                    `;
                } catch (error) {
                    UIController.showErrorMessage(error.message);
                }
            });
            
            // Capping (Winsorizing)
            document.getElementById('capping').addEventListener('click', () => {
                try {
                    const column = prompt('Enter the column name for capping:');
                    if (!column) return;
                    
                    const percentile = parseFloat(prompt('Enter the percentile threshold (e.g., 0.05 for 5%):'));
                    if (isNaN(percentile) || percentile <= 0 || percentile >= 1) 
                        throw new Error("Percentile must be between 0 and 1");
                    
                    const result = DataTransformer.cappingTransform(column, percentile);
                    DataStore.saveToLocalStorage();
                    
                    document.getElementById('transformation-content').innerHTML = `
                        <h4>Transformation Result</h4>
                        <div class="alert alert-success mb-3">${result}</div>
                        ${UIController.renderDataTable()}
                    `;
                } catch (error) {
                    UIController.showErrorMessage(error.message);
                }
            });
            
            // One-Hot Encoding
            document.getElementById('one-hot-encoding').addEventListener('click', () => {
                try {
                    const column = prompt('Enter the column name for one-hot encoding:');
                    if (!column) return;
                    
                    const result = DataTransformer.oneHotEncoding(column);
                    DataStore.saveToLocalStorage();
                    
                    document.getElementById('transformation-content').innerHTML = `
                        <h4>Transformation Result</h4>
                        <div class="alert alert-success mb-3">${result}</div>
                        ${UIController.renderDataTable()}
                    `;
                } catch (error) {
                    UIController.showErrorMessage(error.message);
                }
            });
            
            // Clipping
            document.getElementById('clipping').addEventListener('click', () => {
                try {
                    const column = prompt('Enter the column name to clip:');
                    if (!column) return;
                    
                    const minValue = parseFloat(prompt('Enter the minimum value:'));
                    const maxValue = parseFloat(prompt('Enter the maximum value:'));
                    
                    if (isNaN(minValue) || isNaN(maxValue) || minValue >= maxValue) 
                        throw new Error("Invalid range for clipping");
                    
                    const result = DataTransformer.clipping(column, minValue, maxValue);
                    DataStore.saveToLocalStorage();
                    
                    document.getElementById('transformation-content').innerHTML = `
                        <h4>Transformation Result</h4>
                        <div class="alert alert-success mb-3">${result}</div>
                        ${UIController.renderDataTable()}
                    `;
                } catch (error) {
                    UIController.showErrorMessage(error.message);
                }
            });
        },
        
        attachStatisticsEventListeners() {
            document.getElementById('generateStats').addEventListener('click', async () => {
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
                            const columnIndex = DataStore.getColumnIndex(column);
                            const values = DataStore.getColumnData(columnIndex);
                            
                            if (values.length === 0) {
                                tableHTML += `<tr>
                                    <td>${column}</td>
                                    <td colspan="${Object.values(selectedStats).filter(Boolean).length}">No numeric data</td>
                                </tr>`;
                                continue;
                            }
                            
                            let rowHTML = `<tr><td>${column}</td>`;
                            
                            if (selectedStats.mean) {
                                const mean = StatUtils.mean(values);
                                rowHTML += `<td>${mean.toFixed(2)}</td>`;
                            }
                            
                            if (selectedStats.median) {
                                const median = StatUtils.median(values);
                                rowHTML += `<td>${median.toFixed(2)}</td>`;
                            }
                            
                            if (selectedStats.stdDev) {
                                const stdDev = StatUtils.stdDev(values);
                                rowHTML += `<td>${stdDev.toFixed(2)}</td>`;
                            }
                            
                            if (selectedStats.outliers) {
                                const outliers = StatUtils.detectOutliers(values);
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
                    UIController.showErrorMessage(error.message);
                }
            });
        },
        
        attachPlotEventListeners() {
            document.getElementById('generateChart').addEventListener('click', () => {
                try {
                    const xAxisColumn = document.getElementById('xAxisColumn').value;
                    const yAxisColumn = document.getElementById('yAxisColumn').value;
                    const chartType = document.getElementById('chartType').value;
                    const chartLabel = document.getElementById('chartLabel').value;
                    const chartColor = document.getElementById('chartColor').value;
                    const showLegend = document.getElementById('showLegend').value === 'true';
                    
                    // Parse axis ranges if provided
                    const xAxisRangeInput = document.getElementById('xAxisRange')?.value;
                    const yAxisRangeInput = document.getElementById('yAxisRange')?.value;
                    
                    let xAxisRange = null;
                    let yAxisRange = null;
                    
                    if (xAxisRangeInput) {
                        const parts = xAxisRangeInput.split(',').map(x => parseFloat(x.trim()));
                        if (parts.length === 2 && !parts.some(isNaN)) {
                            xAxisRange = parts;
                        }
                    }
                    
                    if (yAxisRangeInput) {
                        const parts = yAxisRangeInput.split(',').map(y => parseFloat(y.trim()));
                        if (parts.length === 2 && !parts.some(isNaN)) {
                            yAxisRange = parts;
                        }
                    }
                    
                    // Generate chart
                    Visualizer.generateChart({
                        xAxisColumn,
                        yAxisColumn,
                        chartType,
                        chartLabel,
                        chartColor,
                        showLegend,
                        xAxisRange,
                        yAxisRange
                    });
                    
                } catch (error) {
                    UIController.showErrorMessage(error.message);
                }
            });
        },
        
        attachPredictionEventListeners() {
            // Supervised Learning Models
            document.getElementById('linearRegression').addEventListener('click', () => this.handleModelClick('Linear Regression', this.setupLinearRegression));
            document.getElementById('logisticRegression').addEventListener('click', () => this.handleModelClick('Logistic Regression', this.setupLogisticRegression));
            document.getElementById('decisionTree').addEventListener('click', () => this.handleModelClick('Decision Tree', this.setupDecisionTree));
            document.getElementById('randomForest').addEventListener('click', () => this.handleModelClick('Random Forest', this.setupRandomForest));
            document.getElementById('svm').addEventListener('click', () => this.handleModelClick('Support Vector Machine', this.setupSVM));
            
            // Unsupervised Learning Models
            document.getElementById('kMeansClustering').addEventListener('click', () => this.handleModelClick('K-Means Clustering', this.setupKMeansClustering));
            document.getElementById('pca').addEventListener('click', () => this.handleModelClick('Principal Component Analysis', this.setupPCA));
            document.getElementById('hierarchicalClustering').addEventListener('click', () => this.handleModelClick('Hierarchical Clustering', this.setupHierarchicalClustering));
            document.getElementById('dbscan').addEventListener('click', () => this.handleModelClick('DBSCAN', this.setupDBSCAN));
        },
        
        handleModelClick(modelName, setupFn) {
            const modelContent = document.getElementById('model-content');
            modelContent.innerHTML = `
                <h4>${modelName}</h4>
                <div class="row">
                    <div class="col-md-4 bg-dark text-light p-3">
                        <h5>Model Configuration</h5>
                        <div id="model-config-form"></div>
                    </div>
                    <div class="col-md-8 bg-white p-3">
                        <h5>Results</h5>
                        <div id="model-results">
                            <p class="text-muted">Configure and run the model to see results</p>
                        </div>
                    </div>
                </div>`;
                
            setupFn.call(this);
        },
        
        setupLinearRegression() {
            const configForm = document.getElementById('model-config-form');
            configForm.innerHTML = `
                <label for="x-axis">Independent Variable (X):</label>
                <select id="x-axis" class="form-control mb-3">
                    ${DataStore.dataset.headers.map(header => `<option>${header}</option>`).join('')}
                </select>
                
                <label for="y-axis">Dependent Variable (Y):</label>
                <select id="y-axis" class="form-control mb-3">
                    ${DataStore.dataset.headers.map(header => `<option>${header}</option>`).join('')}
                </select>
                
                <button class="btn btn-primary mt-3" id="runModelBtn">Run Model</button>
            `;
            
            document.getElementById('runModelBtn').addEventListener('click', async () => {
                try {
                    const xColumn = document.getElementById('x-axis').value;
                    const yColumn = document.getElementById('y-axis').value;
                    
                    const results = await MLModule.performLinearRegression(xColumn, yColumn);
                    
                    // Display results
                    const resultsDiv = document.getElementById('model-results');
                    resultsDiv.innerHTML = `
                        <div class="alert alert-success">
                            <strong>Model trained successfully!</strong><br>
                            Equation: ${results.metrics.equation}<br>
                            R² Score: ${results.metrics.r2.toFixed(4)}<br>
                            RMSE: ${results.metrics.rmse.toFixed(4)}
                        </div>
                        
                        <canvas id="regressionChart" height="300"></canvas>
                    `;
                    
                    // Create scatter plot with regression line
                    const ctx = document.getElementById('regressionChart').getContext('2d');
                    new Chart(ctx, {
                        type: 'scatter',
                        data: {
                            datasets: [
                                {
                                    label: 'Data Points',
                                    data: results.xValues.map((x, i) => ({ x, y: results.yValues[i] })),
                                    backgroundColor: '#4b9cdf',
                                },
                                {
                                    label: 'Regression Line',
                                    data: results.xValues.map((x, i) => ({ x, y: results.predictions[i] })),
                                    type: 'line',
                                    borderColor: '#ff6347',
                                    borderWidth: 2,
                                    fill: false,
                                },
                            ],
                        },
                        options: {
                            responsive: true,
                            scales: {
                                x: { title: { display: true, text: xColumn } },
                                y: { title: { display: true, text: yColumn } },
                            },
                        },
                    });
                    
                } catch (error) {
                    UIController.showErrorMessage(error.message);
                }
            });
        },
        
        setupLogisticRegression() {
            const configForm = document.getElementById('model-config-form');
            configForm.innerHTML = `
                <label for="x-axis">Independent Variable (X):</label>
                <select id="x-axis" class="form-control mb-3">
                    ${DataStore.dataset.headers.map(header => `<option>${header}</option>`).join('')}
                </select>
                
                <label for="y-axis">Dependent Variable (Y):</label>
                <select id="y-axis" class="form-control mb-3">
                    ${DataStore.dataset.headers.map(header => `<option>${header}</option>`).join('')}
                </select>
                
                <label for="threshold">Classification Threshold:</label>
                <input type="number" id="threshold" class="form-control mb-3" min="0" max="1" step="0.1" value="0.5">
                
                <button class="btn btn-primary mt-3" id="runModelBtn">Run Model</button>
            `;
            
            document.getElementById('runModelBtn').addEventListener('click', async () => {
                try {
                    const xColumn = document.getElementById('x-axis').value;
                    const yColumn = document.getElementById('y-axis').value;
                    const threshold = parseFloat(document.getElementById('threshold').value);
                    
                    if (isNaN(threshold) || threshold < 0 || threshold > 1) {
                        throw new Error("Threshold must be between 0 and 1");
                    }
                    
                    const results = await MLModule.performLogisticRegression(xColumn, yColumn, threshold);
                    
                    // Display results
                    const resultsDiv = document.getElementById('model-results');
                    resultsDiv.innerHTML = `
                        <div class="alert alert-success">
                            <strong>Model trained successfully!</strong><br>
                            Equation: ${results.metrics.equation}<br>
                            Accuracy: ${(results.metrics.accuracy * 100).toFixed(2)}%<br>
                            Loss: ${results.metrics.loss.toFixed(4)}
                        </div>
                        
                        <canvas id="logisticChart" height="300"></canvas>
                    `;
                    
                    // Create logistic plot
                    const ctx = document.getElementById('logisticChart').getContext('2d');
                    new Chart(ctx, {
                        type: 'scatter',
                        data: {
                            datasets: [
                                {
                                    label: 'Data Points',
                                    data: results.xValues.map((x, i) => ({ 
                                        x, 
                                        y: results.yValues[i] 
                                    })),
                                    backgroundColor: points => {
                                        return points.raw.y === 1 ? '#4b9cdf' : '#ff6347';
                                    },
                                },
                                {
                                    label: 'Logistic Curve',
                                    data: results.xValues.map((x, i) => ({ 
                                        x, 
                                        y: results.predictions[i] 
                                    })),
                                    type: 'line',
                                    borderColor: '#32CD32',
                                    borderWidth: 2,
                                    fill: false,
                                },
                            ],
                        },
                        options: {
                            responsive: true,
                            scales: {
                                x: { title: { display: true, text: xColumn } },
                                y: { 
                                    title: { display: true, text: 'Probability' },
                                    min: 0,
                                    max: 1
                                },
                            },
                        },
                    });
                    
                } catch (error) {
                    UIController.showErrorMessage(error.message);
                }
            });
        },
        
        setupKMeansClustering() {
            const configForm = document.getElementById('model-config-form');
            configForm.innerHTML = `
                <label for="x-axis">X-axis Feature:</label>
                <select id="x-axis" class="form-control mb-3">
                    ${DataStore.dataset.headers.map(header => `<option>${header}</option>`).join('')}
                </select>
                
                <label for="y-axis">Y-axis Feature:</label>
                <select id="y-axis" class="form-control mb-3">
                    ${DataStore.dataset.headers.map(header => `<option>${header}</option>`).join('')}
                </select>
                
                <label for="k-clusters">Number of Clusters (k):</label>
                <input type="number" id="k-clusters" class="form-control mb-3" min="2" max="10" step="1" value="3">
                
                <button class="btn btn-primary mt-3" id="runModelBtn">Run Clustering</button>
            `;
            
            document.getElementById('runModelBtn').addEventListener('click', async () => {
                try {
                    const xColumn = document.getElementById('x-axis').value;
                    const yColumn = document.getElementById('y-axis').value;
                    const k = parseInt(document.getElementById('k-clusters').value);
                    
                    if (isNaN(k) || k < 2) {
                        throw new Error("Number of clusters must be at least 2");
                    }
                    
                    const results = await MLModule.performKMeans(xColumn, yColumn, k);
                    
                    // Display results
                    const resultsDiv = document.getElementById('model-results');
                    resultsDiv.innerHTML = `
                        <div class="alert alert-success">
                            <strong>Clustering completed successfully!</strong><br>
                            Number of clusters: ${results.k}<br>
                            Points analyzed: ${results.points.length}
                        </div>
                        
                        <canvas id="clusteringChart" height="300"></canvas>
                    `;
                    
                    // Generate colors for clusters
                    const generateColors = (count) => {
                        const colors = [];
                        for (let i = 0; i < count; i++) {
                            const hue = i * (360 / count);
                            colors.push(`hsl(${hue}, 70%, 60%)`);
                        }
                        return colors;
                    };
                    
                    const clusterColors = generateColors(results.k);
                    
                    // Create clustering plot
                    const ctx = document.getElementById('clusteringChart').getContext('2d');
                    
                    // Prepare data for points by cluster
                    const datasets = [];
                    
                    // Add datasets for each cluster's points
                    for (let i = 0; i < results.k; i++) {
                        const clusterPoints = results.points.filter((_, idx) => results.assignments[idx] === i);
                        
                        datasets.push({
                            label: `Cluster ${i + 1}`,
                            data: clusterPoints.map(point => ({ x: point[0], y: point[1] })),
                            backgroundColor: clusterColors[i],
                            pointRadius: 5
                        });
                    }
                    
                    // Add centroids
                    datasets.push({
                        label: 'Centroids',
                        data: results.centroids.map(c => ({ x: c[0], y: c[1] })),
                        backgroundColor: 'black',
                        pointRadius: 8,
                        pointStyle: 'triangle'
                    });
                    
                    new Chart(ctx, {
                        type: 'scatter',
                        data: { datasets },
                        options: {
                            responsive: true,
                            scales: {
                                x: { title: { display: true, text: xColumn } },
                                y: { title: { display: true, text: yColumn } },
                            },
                        }
                    });
                    
                } catch (error) {
                    UIController.showErrorMessage(error.message);
                }
            });
        },
        
        setupPCA() {
            const configForm = document.getElementById('model-config-form');
            
            // Create checkboxes for all columns
            const columnCheckboxes = DataStore.dataset.headers.map(header => 
                `<div class="form-check">
                    <input class="form-check-input pca-column-check" type="checkbox" value="${header}" id="check-${header}">
                    <label class="form-check-label" for="check-${header}">${header}</label>
                </div>`
            ).join('');
            
            configForm.innerHTML = `
                <div class="mb-3">
                    <label>Select Features for PCA:</label>
                    <div class="column-selection-container" style="max-height: 200px; overflow-y: auto;">
                        ${columnCheckboxes}
                    </div>
                </div>
                
                <label for="num-components">Number of Components:</label>
                <input type="number" id="num-components" class="form-control mb-3" min="2" max="10" step="1" value="2">
                
                <button class="btn btn-primary mt-3" id="runModelBtn">Run PCA</button>
            `;
            
            document.getElementById('runModelBtn').addEventListener('click', async () => {
                try {
                    const checkboxes = document.querySelectorAll('.pca-column-check:checked');
                    const columns = Array.from(checkboxes).map(cb => cb.value);
                    
                    if (columns.length < 2) {
                        throw new Error("Please select at least 2 columns for PCA");
                    }
                    
                    const numComponents = parseInt(document.getElementById('num-components').value);
                    if (isNaN(numComponents) || numComponents < 2 || numComponents > columns.length) {
                        throw new Error(`Number of components must be between 2 and ${columns.length}`);
                    }
                    
                    const results = await MLModule.performPCA(columns, numComponents);
                    
                    // Display results
                    const resultsDiv = document.getElementById('model-results');
                    
                    // Calculate total explained variance
                    const totalExplainedVariance = results.explainedVarianceRatio.reduce((sum, val) => sum + val, 0) * 100;
                    
                    resultsDiv.innerHTML = `
                        <div class="alert alert-success">
                            <strong>PCA completed successfully!</strong><br>
                            Number of components: ${numComponents}<br>
                            Total explained variance: ${totalExplainedVariance.toFixed(2)}%
                        </div>
                        
                        <div class="row">
                            <div class="col-md-8">
                                <canvas id="pcaScatterChart" height="300"></canvas>
                            </div>
                            <div class="col-md-4">
                                <h6>Explained Variance Ratio</h6>
                                <canvas id="pcaVarianceChart" height="200"></canvas>
                            </div>
                        </div>
                    `;
                    
                    // Create scatter plot for first two principal components
                    const scatterCtx = document.getElementById('pcaScatterChart').getContext('2d');
                    new Chart(scatterCtx, {
                        type: 'scatter',
                        data: {
                            datasets: [{
                                label: 'Projected Data',
                                data: results.projectedData.map(point => ({ 
                                    x: point[0], 
                                    y: numComponents > 1 ? point[1] : 0
                                })),
                                backgroundColor: '#4b9cdf',
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                x: { title: { display: true, text: 'Principal Component 1' } },
                                y: { title: { display: true, text: numComponents > 1 ? 'Principal Component 2' : '' } },
                            },
                        }
                    });
                    
                    // Create bar chart for explained variance
                    const varianceCtx = document.getElementById('pcaVarianceChart').getContext('2d');
                    new Chart(varianceCtx, {
                        type: 'bar',
                        data: {
                            labels: [...Array(numComponents).keys()].map(i => `PC ${i+1}`),
                            datasets: [{
                                label: 'Explained Variance Ratio',
                                data: results.explainedVarianceRatio.map(v => v * 100),
                                backgroundColor: '#32CD32',
                            }]
                        },
                        options: {
                            responsive: true,
                            scales: {
                                y: { 
                                    title: { display: true, text: 'Variance Explained (%)' },
                                    min: 0,
                                    max: 100
                                },
                            },
                        }
                    });
                    
                } catch (error) {
                    UIController.showErrorMessage(error.message);
                }
            });
        },
        
        setupDecisionTree() {
            const configForm = document.getElementById('model-config-form');
            configForm.innerHTML = `
                <div class="alert alert-info">
                    <strong>Decision Tree implementation is in progress.</strong><br>
                    This feature will be available in a future update.
                </div>
            `;
        },
        
        setupRandomForest() {
            const configForm = document.getElementById('model-config-form');
            configForm.innerHTML = `
                <div class="alert alert-info">
                    <strong>Random Forest implementation is in progress.</strong><br>
                    This feature will be available in a future update.
                </div>
            `;
        },
        
        setupSVM() {
            const configForm = document.getElementById('model-config-form');
            configForm.innerHTML = `
                <div class="alert alert-info">
                    <strong>SVM implementation is in progress.</strong><br>
                    This feature will be available in a future update.
                </div>
            `;
        },
        
        setupHierarchicalClustering() {
            const configForm = document.getElementById('model-config-form');
            configForm.innerHTML = `
                <div class="alert alert-info">
                    <strong>Hierarchical Clustering implementation is in progress.</strong><br>
                    This feature will be available in a future update.
                </div>
            `;
        },
        
        setupDBSCAN() {
            const configForm = document.getElementById('model-config-form');
            configForm.innerHTML = `
                <div class="alert alert-info">
                    <strong>DBSCAN implementation is in progress.</strong><br>
                    This feature will be available in a future update.
                </div>
            `;
        }
    };

    // Initialize application
    App.init();
});