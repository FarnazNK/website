# Quantitative Investment Platform

A production-grade financial analytics platform built from scratch with vanilla JavaScript. No frameworks — custom implementations of EventEmitter, state management, module system, and data pipeline.

🌐 **Live Demo:** [farnaznasehi.com/portfolio.html](https://farnaznasehi.com/portfolio.html)

---

## Technical Highlights

- **6,500+ lines** of hand-written JavaScript across 5 architectural layers
- **Zero framework dependencies** — custom EventEmitter, Logger, PerformanceMonitor, ModuleState
- **8 design patterns** implemented
- **6 file format parsers** with auto-detection
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
│  │   - Type coercion                • Data quality scoring            │  │
│  │ • TSVParser                      • Duplicate detection             │  │
│  │ • ExcelParser (XLSX)             • Null percentage analysis        │  │
│  │ • JSONParser                                                       │  │
│  │ • XMLParser                      PROCESSORS                        │  │
│  │ • TextParser                     • AdvancedDataProcessors          │  │
│  │                                  • Column profiling (min/max/mean) │  │
│  │ TRANSFORMERS                     • Outlier detection (IQR method)  │  │
│  │ • FinancialDataTransformer       • Memory usage estimation         │  │
│  │   - Returns calculation          • Automatic date sorting          │  │
│  │   - Moving averages                                                │  │
│  │   - Rolling volatility                                             │  │
│  │   - Price normalization                                            │  │
│  └────────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────┤
│                         UI LAYER                                          │
│  ui-modules-layer.js (930 lines)                                         │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ • BaseModule — Lifecycle hooks (beforeInit, afterInit, destroy)    │  │
│  │ • BaseView — DOM rendering, event binding, visibility control      │  │
│  │ • ModuleState — Scoped state management per module                 │  │
│  │ • ToolbarView — Tab navigation with conditional enable/disable     │  │
│  │ • DataUploadView — Drag-drop zone, multi-source import forms       │  │
│  │ • ChartView — Chart.js wrapper with dynamic data updates           │  │
│  └────────────────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────────────────┤
│                         INFRASTRUCTURE LAYER                              │
│  utilities-config-layer.js (575 lines)                                   │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ • EventEmitter — on/off/emit/once with context binding & cleanup   │  │
│  │ • AppConfig — Environment detection, defaults, localStorage sync   │  │
│  │ • Logger — 5 levels (ERROR→TRACE), structured output, monitoring   │  │
│  │ • PerformanceMonitor — Timers, p95/p99 percentiles, slow alerts    │  │
│  │ • ModuleState — Immutable state updates with change tracking       │  │
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
| **Singleton** | `AppConfig`, `PerformanceMonitor` as global instances | utilities-config-layer.js |
| **Factory** | Parser selection by file extension at runtime | data-services-layer.js |
| **Decorator** | `ImprovedCSVParser extends CSVParser` adds auto-detection | data-services-layer.js |
| **Circuit Breaker** | Backend availability check with automatic frontend fallback | backend-integration.js |

---

## Data Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   INPUT     │    │   PARSE     │    │  VALIDATE   │    │   PROCESS   │
│             │    │             │    │             │    │             │
│ • CSV       │───▶│ Auto-detect │───▶│ Schema      │───▶│ Type coerce │
│ • Excel     │    │ delimiter   │    │ check       │    │ Date parse  │
│ • JSON      │    │ Handle      │    │ Financial   │    │ Null handle │
│ • XML       │    │ quotes      │    │ rules       │    │ Sort by     │
│ • TSV       │    │ Infer types │    │ Quality     │    │ date        │
│             │    │             │    │ score       │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                │
       ┌────────────────────────────────────────────────────────┘
       ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────────┐
│   PROFILE   │    │  TRANSFORM  │    │           OUTPUT                │
│             │    │             │    │                                 │
│ • Min/Max   │───▶│ Returns     │───▶│ {                               │
│ • Mean/Med  │    │ Moving avg  │    │   headers: [...],               │
│ • Std dev   │    │ Volatility  │    │   rows: [...],                  │
│ • Outliers  │    │ Normalize   │    │   metadata: {                   │
│ • Memory    │    │             │    │     qualityScore,               │
│             │    │             │    │     profile,                    │
│             │    │             │    │     calculatedReturns           │
└─────────────┘    └─────────────┘    │   }                             │
                                      │ }                               │
                                      └─────────────────────────────────┘
```

---

## Multi-Source Data Import

| Source | Method |
|--------|--------|
| **Local Files** | Drag-drop zone with file type validation |
| **Azure Blob** | SAS token authentication |
| **AWS S3** | Pre-signed URL support |
| **Google Sheets** | Sheets API v4 integration |
| **REST API** | Configurable method, headers, body |
| **Database** | Generic REST endpoint for queries |

---

## Financial Analytics

### Risk Metrics
| Metric | Description |
|--------|-------------|
| **Annualized Volatility** | Standard deviation of returns × √252 |
| **Value at Risk (95%)** | 5th percentile of return distribution |
| **Value at Risk (99%)** | 1st percentile of return distribution |
| **Sharpe Ratio** | Risk-adjusted return (return / volatility) |
| **Maximum Drawdown** | Largest peak-to-trough decline |

### Portfolio Optimization
| Method | Description |
|--------|-------------|
| **Equal Weight** | 1/n allocation across assets |
| **Minimum Volatility** | Minimize portfolio variance |
| **Maximum Sharpe** | Maximize risk-adjusted return |

### Strategy Backtesting
| Strategy | Logic |
|----------|-------|
| **Buy & Hold** | 100% invested from day one |
| **SMA Crossover** | Buy when price > SMA(n), sell when below |
| **Momentum** | Buy when price > price(n periods ago) |

---

## Backend API (Flask)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Parse CSV/Excel, return dataset ID |
| `/api/datasets` | GET | List all uploaded datasets |
| `/api/datasets/<id>` | GET | Retrieve dataset by ID |
| `/api/datasets/<id>` | DELETE | Delete dataset |
| `/api/datasets/<id>/risk-metrics` | POST | Calculate VaR, Sharpe, MDD |
| `/api/datasets/<id>/optimize-portfolio` | POST | Run portfolio optimization |
| `/api/datasets/<id>/backtest` | POST | Execute strategy backtest |
| `/api/datasets/<id>/column-stats/<col>` | GET | Get column statistics |
| `/api/health` | GET | Health check |

---

## Performance

| Metric | Frontend Mode | Backend Mode |
|--------|---------------|--------------|
| Max file size | 50MB | 100MB+ |
| Parse 10k rows | ~200ms | ~150ms |
| Risk calculation | ~50ms | ~30ms |
| Offline capable | ✅ | ❌ |

---

## Project Structure

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

**Total: ~6,500 lines of JavaScript + 380 lines Python**

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
window.DEBUG.getLogs()                      // All debug logs
window.DEBUG.getErrors()                    // Error log  
window.DEBUG.exportDebugInfo()              // Full diagnostic export
window.app.performanceMonitor.getMetrics()  // Performance report
```

---

## Browser Support

Chrome 90+ · Firefox 88+ · Safari 14+ · Edge 90+

---

## Tech Stack

| Category | Technologies |
|----------|--------------|
| **Core** | Vanilla JavaScript (ES6+), HTML5, CSS3 |
| **UI** | Bootstrap 4 |
| **Charts** | Chart.js |
| **Excel** | SheetJS (XLSX) |
| **Animations** | Particles.js, Animate.css |
| **Backend** | Flask, Pandas, NumPy |
| **Hosting** | GitHub Pages |
