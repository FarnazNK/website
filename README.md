# Quantitative Investment Platform

A production-grade, enterprise-level quantitative investment platform built with vanilla JavaScript, demonstrating advanced frontend architecture patterns, modular design, and hybrid client-server processing capabilities.

🌐 **Live Demo:** [farnaznasehi.com](https://farnaznasehi.com)

## Technical Highlights

- **Zero-dependency core architecture** — Custom-built EventEmitter, state management, and module system without framework overhead
- **Hybrid processing engine** — Intelligent workload distribution between browser and server with automatic fallback
- **Pluggable parser system** — Strategy pattern implementation supporting 6+ file formats with auto-detection
- **Event-driven architecture** — Fully decoupled components communicating via pub/sub pattern
- **Performance-first design** — Built-in monitoring, caching layer, and batch processing for large datasets

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              Application Layer                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Application Orchestrator (app.js)                                   │   │
│  │  • Dependency injection container                                    │   │
│  │  • Service initialization & lifecycle management                     │   │
│  │  • Error boundary with graceful degradation                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────────────────────────────┤
│                              Service Layer                                  │
│  ┌──────────────────────────┐    ┌──────────────────────────────────────┐  │
│  │  HybridDataService       │    │  HybridAnalyticsService              │  │
│  │  • Backend-first with    │    │  • Risk metrics (VaR, Sharpe, MDD)   │  │
│  │    frontend fallback     │    │  • Portfolio optimization            │  │
│  │  • Progress streaming    │    │  • Strategy backtesting engine       │  │
│  │  • Retry mechanisms      │    │  • Computation offloading            │  │
│  └──────────────────────────┘    └──────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────────────┤
│                              Data Layer                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Parser Registry          Validators           Processors            │   │
│  │  • CSVParser (auto-       • Schema validation  • Type coercion       │   │
│  │    delimiter detection)   • Financial data     • Null handling       │   │
│  │  • ExcelParser (XLSX)       rules (no neg     • Date parsing         │   │
│  │  • JSONParser               prices/volume)    • Outlier detection    │   │
│  │  • XMLParser              • Quality scoring   • Normalization        │   │
│  │  • TSVParser                                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────────────────────────────┤
│                              UI Layer                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  BaseModule / BaseView Pattern                                       │   │
│  │  • Lifecycle hooks (beforeInit, afterInit, destroy)                  │   │
│  │  • Scoped state management per module                                │   │
│  │  • Event delegation & cleanup                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
├────────────────────────────────────────────────────────────────────────────┤
│                              Core Infrastructure                            │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   │
│  │ EventEmitter  │ │ AppConfig     │ │ Logger        │ │ PerfMonitor   │   │
│  │ • on/off/emit │ │ • Environment │ │ • Levels      │ │ • Timers      │   │
│  │ • once()      │ │   detection   │ │ • Structured  │ │ • Percentiles │   │
│  │ • Namespaced  │ │ • Hot reload  │ │   output      │ │ • Alerts      │   │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
```

## Design Patterns Implemented

| Pattern | Implementation | Purpose |
|---------|----------------|---------|
| **Pub/Sub (Observer)** | `EventEmitter` class | Decoupled component communication across all layers |
| **Strategy** | Parser registry, optimization algorithms | Swappable algorithms without changing client code |
| **Facade** | `HybridDataService`, `HybridAnalyticsService` | Unified API hiding backend/frontend complexity |
| **Template Method** | `BaseModule.initialize()` lifecycle | Consistent initialization with customizable hooks |
| **Singleton** | `AppConfig`, `PerformanceMonitor` | Global configuration and metrics collection |
| **Decorator** | `ImprovedCSVParser extends CSVParser` | Extended functionality while preserving interface |
| **Factory** | Parser selection by file type | Dynamic object creation based on runtime conditions |
| **Circuit Breaker** | Backend availability check with fallback | Resilient service degradation |

## Key Engineering Decisions

### 1. Hybrid Processing Architecture
```javascript
// Automatic fallback pattern in HybridDataService
async loadData(file) {
    if (this.useBackend && this.backendAvailable) {
        try {
            return await this.loadDataViaBackend(file);
        } catch (error) {
            DEBUG.log('HybridDataService', 'Backend failed, falling back to frontend');
            // Graceful degradation - user experience uninterrupted
        }
    }
    return await super.loadData(file);
}
```

### 2. Event-Driven State Flow
```javascript
// Loosely coupled data flow
dataService.emit('data:loading', { filename });
dataService.emit('data:progress', { percent: 45 });
dataService.emit('data:loaded', { data, metadata, quality });
dataService.emit('data:error', { error, filename });

// Any component can subscribe without tight coupling
uiManager.dataService.on('data:loaded', (payload) => this.renderDataPreview(payload));
```

### 3. Pluggable Parser System
```javascript
// Strategy pattern - parsers are interchangeable
detectFileType(file) {
    const typeMap = {
        'csv': ImprovedCSVParser,
        'tsv': TSVParser,
        'xlsx': ExcelParser,
        'json': JSONParser,
        'xml': XMLParser
    };
    return typeMap[extension] || TextParser;
}

// Auto-delimiter detection in CSV parser
detectDelimiter(line) {
    const delimiters = [',', ';', '\t', '|'];
    const counts = delimiters.map(d => (line.match(new RegExp(d, 'g')) || []).length);
    return delimiters[counts.indexOf(Math.max(...counts))];
}
```

### 4. Performance Monitoring
```javascript
// Built-in performance tracking with percentile calculations
const timer = performanceMonitor.startTimer('data-load');
// ... operation
timer.end();

// Automatic slow operation alerts
if (duration > 5000) {
    console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
}

// Metrics API
performanceMonitor.getMetrics(); // { average, p95, p99, min, max }
```

### 5. Module Lifecycle Management
```javascript
class BaseModule extends EventEmitter {
    async initialize() {
        if (this.initialized) return;
        
        await this.beforeInit();      // Hook for subclass setup
        this.setupEventListeners();   // Declarative event binding
        await this.render();          // DOM rendering
        await this.afterInit();       // Hook for post-render logic
        
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

## Data Pipeline

```
Input                    Processing                         Output
─────                    ──────────                         ──────
                         ┌─────────────────┐
 CSV/Excel/JSON ────────▶│  Parser         │
                         │  (auto-detect)  │
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │  Validators     │
                         │  • Schema       │
                         │  • Financial    │
                         │    rules        │
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │  Processors     │
                         │  • Type coerce  │────────▶ { headers, rows, metadata }
                         │  • Null handle  │
                         │  • Date parse   │
                         └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │  Quality        │
                         │  Assessment     │────────▶ qualityScore: 0-100
                         └─────────────────┘
```

## Project Structure

```
├── Core Infrastructure
│   └── utilities-config-layer.js    # EventEmitter, AppConfig, Logger,
│                                    # PerformanceMonitor, ModuleState
│
├── Data Layer
│   └── data-services-layer.js       # Parsers, validators, processors,
│                                    # transformers, batch processing,
│                                    # DataQualityService
│
├── Service Layer
│   ├── backend-integration.js       # HybridDataService, HybridAnalyticsService,
│   │                                # BackendService, BackendConfig
│   └── integration-layer.js         # ApplicationBootstrap, service registry
│
├── UI Layer
│   └── ui-modules-layer.js          # BaseModule, BaseView, ToolbarView,
│                                    # component lifecycle
│
├── Application
│   └── app.js                       # Main orchestrator, UIManager,
│                                    # DataService, AnalyticsService
│
└── Backend (Optional)
    ├── flask_backend.py             # REST API with pandas/numpy
    └── django_backend.py            # Alternative Django implementation
```

## API Reference

### EventEmitter
```javascript
const emitter = new EventEmitter();
const unsubscribe = emitter.on('event', callback);  // Returns cleanup function
emitter.once('event', callback);                     // Auto-removes after first call
emitter.emit('event', data);
emitter.off('event', callback);
emitter.removeAllListeners('event');
```

### DataService
```javascript
await dataService.loadData(file);                    // Parse & validate
await dataService.loadMultipleFiles(files);          // Batch processing
await dataService.transformData(config);             // Apply transformations
await dataService.exportData('csv', options);        // Multi-format export
dataService.getColumnStatistics('price');            // Statistical analysis
dataService.getHistory();                            // Access previous datasets
```

### AnalyticsService
```javascript
analyticsService.calculateRiskMetrics(data);         // Volatility, Sharpe, VaR, MDD
analyticsService.optimizePortfolio(columns, method); // equal_weight | min_vol | max_sharpe
analyticsService.backtestStrategy(config);           // Buy&Hold, SMA, Momentum
```

## Performance Characteristics

| Metric | Frontend Mode | Backend Mode |
|--------|---------------|--------------|
| Max dataset size | 50MB | 100MB+ |
| Parse speed (10k rows) | ~200ms | ~150ms |
| Risk calculation | ~50ms | ~30ms |
| Memory efficiency | Streaming parsers | Server-side processing |
| Offline capable | ✅ Yes | ❌ No |

## Browser Compatibility

Chrome 90+ • Firefox 88+ • Safari 14+ • Edge 90+

Leverages: ES6+ classes, async/await, Map/Set, optional chaining, nullish coalescing

## Quick Start

```bash
# Frontend only (zero dependencies)
git clone https://github.com/FarnazNK/website.git
open portfolio.html

# With backend processing
pip install flask flask-cors pandas numpy
python flask_backend.py
# Configure backend URL via ⚙️ settings modal
```

## Debug Tools

```javascript
// Available in browser console
window.DEBUG.getLogs();           // All debug logs
window.DEBUG.getErrors();         // Error log
window.DEBUG.exportDebugInfo();   // Full diagnostic export

window.app.dataService.getHistory();  // Dataset history
window.app.performanceMonitor.generateReport();  // Performance report
```

