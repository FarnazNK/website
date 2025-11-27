# Quantitative Investment Platform

A production-grade financial analytics platform built from scratch with vanilla JavaScript. No frameworks — custom implementations of EventEmitter, state management, module system, data pipeline, and more.

🌐 **Live Demo:** [farnaznasehi.com/portfolio.html](https://farnaznasehi.com/portfolio.html)

---

## Technical Highlights

- **6,500+ lines** of hand-written JavaScript across 5 architectural layers
- **Zero framework dependencies** — custom EventEmitter, Logger, PerformanceMonitor, ModuleState
- **8 design patterns** implemented: Pub/Sub, Strategy, Facade, Template Method, Singleton, Factory, Decorator, Circuit Breaker
- **6 file format parsers** with auto-detection: CSV, TSV, Excel, JSON, XML, Text
- **Multi-source data connectors**: Azure Blob, AWS S3, Google Sheets, REST APIs, databases
- **Financial analytics engine**: Risk metrics, portfolio optimization, strategy backtesting
- **Hybrid architecture**: Frontend-first with automatic backend fallback

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                                 │
│  app.js (1,790 lines)                                                    │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ • UIManager — Module orchestration, event delegation               │  │
│  │ • DataService — File parsing, dataset management                   │  │
│  │ • AnalyticsService — Risk metrics, portfolio optimization          │  │
│  │ • DataSourceConnector — Multi-source data import                   │  │
│  │ • Notification — Toast notification system                         │  │
│  │ • DebugLogger — Structured logging with export                     │  │
│  └────────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────┤
│                         SERVICE LAYER                                     │
│  backend-integration.js (529 lines)                                      │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ • BackendService — REST client with timeout, retry, progress       │  │
│  │ • HybridDataService — Backend-first with frontend fallback         │  │
│  │ • HybridAnalyticsService — Offload heavy computation to server     │  │
│  │ • Circuit breaker pattern for graceful degradation                 │  │
│  └────────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────┤
│                         DATA LAYER                                        │
│  data-services-layer.js (1,511 lines)                                    │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ PARSERS                          VALIDATORS                        │  │
│  │ • ImprovedCSVParser              • ComprehensiveDataValidators     │  │
│  │   - Auto-delimiter detection     • Financial data rules            │  │
│  │   - Quote handling               • Schema validation               │  │
│  │   - Type coercion                • Quality scoring                 │  │
│  │ • TSVParser                      • Duplicate detection             │  │
│  │ • ExcelParser (XLSX)             • Null percentage analysis        │  │
│  │ • JSONParser                                                       │  │
│  │ • XMLParser                      PROCESSORS                        │  │
│  │ • TextParser                     • AdvancedDataProcessors          │  │
│  │                                  • Column profiling (stats)        │  │
│  │ TRANSFORMERS                     • Outlier detection (IQR)         │  │
│  │ • FinancialDataTransformer       • Memory usage estimation         │  │
│  │   - calculate_returns            • Date column sorting             │  │
│  │   - calculate_moving_average                                       │  │
│  │   - calculate_volatility                                           │  │
│  │   - normalize_prices                                               │  │
│  │   - detect_outliers                                                │  │
│  └────────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────┤
│                         UI LAYER                                          │
│  ui-modules-layer.js (930 lines)                                         │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ • BaseModule — Lifecycle hooks (beforeInit, afterInit, destroy)    │  │
│  │ • BaseView — DOM rendering, event binding, show/hide/destroy       │  │
│  │ • ModuleState — Scoped state management per module                 │  │
│  │ • ToolbarView — Tab navigation with enable/disable logic           │  │
│  │ • DataUploadView — Drag-drop, multi-source import UI               │  │
│  │ • ChartView — Chart.js integration with dynamic updates            │  │
│  └────────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────┤
│                         INFRASTRUCTURE LAYER                              │
│  utilities-config-layer.js (575 lines)                                   │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ • EventEmitter — on/off/emit/once, context binding, cleanup        │  │
│  │ • AppConfig — Environment detection, hot reload, persistence       │  │
│  │ • Logger — Levels (ERROR→TRACE), structured output, monitoring     │  │
│  │ • PerformanceMonitor — Timers, percentiles (p95/p99), alerts       │  │
│  │ • ModuleState — Immutable updates, change tracking                 │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Design Patterns

| Pattern | Implementation | Location |
|---------|----------------|----------|
| **Pub/Sub (Observer)** | Custom `EventEmitter` with context binding and auto-cleanup | utilities-config-layer.js |
| **Strategy** | Pluggable parsers (CSV/Excel/JSON/XML), optimization algorithms | data-services-layer.js |
| **Facade** | `HybridDataService` hides backend/frontend complexity | backend-integration.js |
| **Template Method** | `BaseModule.initialize()` with lifecycle hooks | ui-modules-layer.js |
| **Singleton** | `AppConfig`, `PerformanceMonitor` (global instances) | utilities-config-layer.js |
| **Factory** | Parser selection by file extension at runtime | data-services-layer.js |
| **Decorator** | `ImprovedCSVParser extends CSVParser` adds auto-detection | data-services-layer.js |
| **Circuit Breaker** | Backend availability check → automatic frontend fallback | backend-integration.js |

---

## Core Implementations

### Custom EventEmitter
```javascript
class EventEmitter {
    constructor() {
        this.events = new Map();
    }
    
    on(event, callback, context = null) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push({ callback, context });
        return () => this.off(event, callback);  // Returns unsubscribe function
    }
    
    once(event, callback, context = null) {
        const unsubscribe = this.on(event, (data) => {
            unsubscribe();
            callback.call(context, data);
        });
        return unsubscribe;
    }
    
    emit(event, data = null) {
        if (!this.events.has(event)) return;
        this.events.get(event).forEach(({ callback, context }) => {
            callback.call(context, data);
        });
    }
}
```

### Auto-Detecting CSV Parser
```javascript
class ImprovedCSVParser extends CSVParser {
    detectDelimiter(line) {
        const delimiters = [',', ';', '\t', '|'];
        const counts = delimiters.map(d => (line.match(new RegExp(d, 'g')) || []).length);
        return delimiters[counts.indexOf(Math.max(...counts))];
    }
    
    parseValue(value) {
        // Handle percentages: "45%" → 0.45
        if (value.endsWith('%')) {
            const num = parseFloat(value.slice(0, -1));
            if (!isNaN(num)) return num / 100;
        }
        // Handle numbers with commas: "1,234.56" → 1234.56
        const num = parseFloat(value.replace(/,/g, ''));
        if (!isNaN(num) && isFinite(num)) return num;
        // Handle dates
        if (this.isDatePattern(value)) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) return date;
        }
        // Handle booleans
        const lower = value.toLowerCase();
        if (['true', 'yes', '1'].includes(lower)) return true;
        if (['false', 'no', '0'].includes(lower)) return false;
        return value || null;
    }
}
```

### Performance Monitor with Percentiles
```javascript
class PerformanceMonitor {
    startTimer(name) {
        performance.mark(`${name}-start`);
        return { end: () => this.endTimer(name) };
    }
    
    getMetrics() {
        const result = {};
        for (const [name, metric] of this.metrics) {
            result[name] = {
                count: metric.count,
                average: metric.total / metric.count,
                min: metric.min,
                max: metric.max,
                p95: this.calculatePercentile(metric.values, 0.95),
                p99: this.calculatePercentile(metric.values, 0.99)
            };
        }
        return result;
    }
    
    calculatePercentile(values, percentile) {
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * percentile) - 1;
        return sorted[index] || 0;
    }
}
```

### Hybrid Service with Circuit Breaker
```javascript
class HybridDataService extends DataService {
    async loadData(file) {
        if (this.useBackend && this.backendAvailable) {
            try {
                return await this.loadDataViaBackend(file);
            } catch (error) {
                DEBUG.log('HybridDataService', 'Backend failed, falling back to frontend');
                this.backendAvailable = false;  // Circuit breaker trips
            }
        }
        return await super.loadData(file);  // Frontend fallback
    }
}
```

### Module Lifecycle System
```javascript
class BaseModule extends EventEmitter {
    async initialize() {
        if (this.initialized) return;
        
        await this.beforeInit();      // Hook: setup dependencies
        this.setupEventListeners();   // Hook: bind events
        await this.render();          // Required: render UI
        await this.afterInit();       // Hook: post-render logic
        
        this.initialized = true;
        this.eventBus.emit(`module:${this.name}:initialized`);
    }
    
    destroy() {
        this.removeAllListeners();    // Prevent memory leaks
        this.view?.destroy();         // Cleanup DOM
        this.initialized = false;
    }
}
```

---

## Data Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   INPUT     │    │   PARSE     │    │  VALIDATE   │    │   PROCESS   │
│             │    │             │    │             │    │             │
│ • CSV       │───▶│ Auto-detect │───▶│ Schema      │───▶│ Type coerce │
│ • Excel     │    │ delimiter   │    │ Financial   │    │ Date parse  │
│ • JSON      │    │ Quote       │    │ rules       │    │ Null handle │
│ • XML       │    │ handling    │    │ Quality     │    │ Sort by     │
│ • TSV       │    │ Type infer  │    │ scoring     │    │ date        │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                │
       ┌────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────────┐
│   PROFILE   │    │  TRANSFORM  │    │           OUTPUT                │
│             │    │             │    │                                 │
│ • Min/Max   │───▶│ Returns     │───▶│ { headers, rows, metadata }     │
│ • Mean/Med  │    │ Moving avg  │    │                                 │
│ • Std dev   │    │ Volatility  │    │ metadata: {                     │
│ • Outliers  │    │ Normalize   │    │   qualityScore: 0-100,          │
│ • Memory    │    │ Outliers    │    │   profile: { columnStats },     │
│   estimate  │    │             │    │   calculatedReturns: {...}      │
└─────────────┘    └─────────────┘    │ }                               │
                                      └─────────────────────────────────┘
```

### Column Profiling
```javascript
profileColumn(column) {
    const nonNull = column.filter(val => val !== null && val !== undefined);
    
    if (typeof nonNull[0] === 'number') {
        return {
            count: nonNull.length,
            nullPercentage: ((column.length - nonNull.length) / column.length * 100),
            min: Math.min(...nonNull),
            max: Math.max(...nonNull),
            mean: nonNull.reduce((a, b) => a + b, 0) / nonNull.length,
            median: this.calculateMedian(nonNull),
            std: this.calculateStandardDeviation(nonNull),
            outliers: this.detectOutliers(nonNull)  // IQR method
        };
    }
}
```

---

## Multi-Source Data Import

| Source | Implementation |
|--------|----------------|
| **Local Files** | Drag-drop zone, file input with type validation |
| **Azure Blob** | SAS token auth, fetch API |
| **AWS S3** | Pre-signed URL support |
| **Google Sheets** | Sheets API v4 integration |
| **REST API** | Configurable method, headers, body |
| **Database** | Generic REST endpoint for SQL queries |

```javascript
class DataSourceConnector {
    async connectAzureBlob({ accountName, containerName, sasToken, blobName }) {
        const url = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
        const response = await fetch(url);
        const blob = await response.blob();
        return new File([blob], blobName, { type: blob.type });
    }
    
    async connectGoogleSheets({ sheetId, apiKey, range = 'A:Z' }) {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        // Convert to { headers, rows } format
    }
}
```

---

## Financial Analytics

### Risk Metrics
| Metric | Formula | Implementation |
|--------|---------|----------------|
| **Volatility** | σ × √252 | Annualized standard deviation of returns |
| **VaR (95%)** | -percentile(returns, 5) | 5th percentile of return distribution |
| **VaR (99%)** | -percentile(returns, 1) | 1st percentile of return distribution |
| **Sharpe Ratio** | (μ × 252) / (σ × √252) | Risk-adjusted return |
| **Max Drawdown** | max((peak - trough) / peak) | Largest peak-to-trough decline |

```javascript
calculateRiskMetrics(data) {
    const returns = this.calculateReturns(data);
    const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (returns.length - 1);
    const volatility = Math.sqrt(variance) * Math.sqrt(252);
    
    const sortedReturns = [...returns].sort((a, b) => a - b);
    
    return {
        mean: mean * 252,
        volatility,
        var95: -sortedReturns[Math.floor(0.05 * sortedReturns.length)],
        var99: -sortedReturns[Math.floor(0.01 * sortedReturns.length)],
        sharpeRatio: (mean * 252) / volatility,
        maxDrawdown: this.calculateMaxDrawdown(data)
    };
}
```

### Portfolio Optimization
- **Equal Weight** — 1/n allocation
- **Minimum Volatility** — Minimize portfolio variance
- **Maximum Sharpe** — Maximize risk-adjusted return

### Strategy Backtesting
| Strategy | Logic |
|----------|-------|
| **Buy & Hold** | 100% invested from start |
| **SMA Crossover** | Buy when price > SMA(n), sell when price < SMA(n) |
| **Momentum** | Buy when price > price(n periods ago), else sell |

---

## Backend API (Flask)

REST API with Pandas/NumPy for server-side computation:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Parse CSV/Excel, return dataset ID |
| `/api/datasets` | GET | List all datasets |
| `/api/datasets/<id>` | GET/DELETE | Get or delete dataset |
| `/api/datasets/<id>/risk-metrics` | POST | Calculate VaR, Sharpe, MDD |
| `/api/datasets/<id>/optimize-portfolio` | POST | Portfolio optimization |
| `/api/datasets/<id>/backtest` | POST | Run strategy backtest |
| `/api/datasets/<id>/column-stats/<col>` | GET | Column statistics |
| `/api/health` | GET | Health check |

---

## Configuration System

Environment-aware configuration with persistence:

```javascript
class AppConfig {
    detectEnvironment() {
        if (window.location.hostname === 'localhost') return 'development';
        if (window.location.hostname.includes('staging')) return 'staging';
        return 'production';
    }
    
    loadDefaults() {
        this.config.set('data.maxFileSize', 50 * 1024 * 1024);  // 50MB
        this.config.set('data.maxRows', 1000000);
        this.config.set('charts.maxDataPoints', 10000);
        this.config.set('performance.debounceMs', 300);
        this.config.set('performance.batchSize', 1000);
        // ...
    }
}
```

---

## Performance

| Metric | Frontend Mode | Backend Mode |
|--------|---------------|--------------|
| Max file size | 50MB | 100MB+ |
| Parse 10k rows | ~200ms | ~150ms |
| Risk calculation | ~50ms | ~30ms |
| Offline capable | ✅ | ❌ |

---

## File Structure

```
├── app.js                      # Main orchestrator (1,790 lines)
├── data-services-layer.js      # Parsers, validators, processors (1,511 lines)
├── backend-integration.js      # Hybrid services, circuit breaker (529 lines)
├── ui-modules-layer.js         # BaseModule, BaseView, components (930 lines)
├── utilities-config-layer.js   # EventEmitter, Logger, Config (575 lines)
├── integration-layer.js        # Application bootstrap
│
├── flask_backend.py            # Python REST API (380 lines)
├── django_backend.py           # Alternative Django implementation
│
├── portfolio.html              # Platform entry point
└── styles.css                  # Dark theme, responsive design
```

---

## Quick Start

**Frontend only:**
```bash
git clone https://github.com/FarnazNK/website.git
open portfolio.html
```

**With backend:**
```bash
pip install flask flask-cors pandas numpy
python flask_backend.py
# Configure backend URL in settings modal
```

---

## Debug Console

```javascript
// Browser console on portfolio.html
window.DEBUG.getLogs()                          // All debug logs
window.DEBUG.getErrors()                        // Error log
window.DEBUG.exportDebugInfo()                  // Full diagnostic export

window.app.dataService.getCurrentDataset()      // Current dataset
window.app.dataService.getNumericColumns()      // Numeric columns
window.app.analyticsService.calculateRiskMetrics(data)

window.app.performanceMonitor?.getMetrics()     // Performance report
```

---

## Browser Support

Chrome 90+ · Firefox 88+ · Safari 14+ · Edge 90+

**ES6+ Features Used:**
- Classes with inheritance
- async/await
- Map/Set
- Optional chaining (?.)
- Nullish coalescing (??)
- Spread operator
- Destructuring
- Template literals
- Arrow functions
- Promises

---

## Technologies

| Category | Stack |
|----------|-------|
| **Core** | Vanilla JavaScript (ES6+), HTML5, CSS3 |
| **UI Framework** | Bootstrap 4 |
| **Charts** | Chart.js |
| **Excel Parsing** | SheetJS (XLSX) |
| **Animations** | Particles.js, Animate.css |
| **Backend** | Flask / Django, Pandas, NumPy |
| **Deployment** | GitHub Pages |
