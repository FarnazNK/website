# Farnaz Nasehi - Professional Portfolio

A modern, responsive portfolio website showcasing my work as a Full-Stack Developer, featuring an interactive Quantitative Investment Platform with real-time data visualization and analytics.

🌐 **Live Site:** [farnaznasehi.com](https://farnaznasehi.com)

## Overview

This portfolio demonstrates expertise in hyperspectral imaging, financial analytics, and blockchain technologies through a clean, animated interface built with modern web technologies. The centerpiece is a fully functional quantitative investment platform with a modular, event-driven architecture that operates both standalone and with optional backend support.

## Key Features

**Quantitative Investment Platform**
- Real-time data visualization with Chart.js
- Risk analytics: Volatility, Sharpe Ratio, VaR (95/99%), Maximum Drawdown
- Portfolio optimization: Equal weight, minimum volatility, maximum Sharpe
- Strategy backtesting: Buy & Hold, SMA crossover, Momentum
- AI-powered data insights with query-based analysis

**Multi-Source Data Connectors**
- Local files: CSV, TSV, Excel (.xlsx/.xls), JSON, XML
- Cloud storage: Azure Blob Storage, AWS S3 (pre-signed URLs)
- APIs: REST endpoints with configurable headers/auth
- Google Sheets integration

**Modern UI/UX**
- Fully responsive across all devices
- Animated Particles.js background
- Scroll animations with AOS library
- Dynamic typewriter text effects
- Dark theme with configurable notifications

## Architecture

The platform uses a **layered, event-driven architecture** with 5 JavaScript modules:

```
┌─────────────────────────────────────────────────────────────┐
│                        app.js                               │
│                 (Main Application Orchestrator)             │
├─────────────────────────────────────────────────────────────┤
│  backend-integration.js  │  ui-modules-layer.js             │
│  (Hybrid Services Layer) │  (Component-Based UI)            │
├─────────────────────────────────────────────────────────────┤
│              data-services-layer.js                         │
│    (Parsers, Validators, Processors, Transformers)          │
├─────────────────────────────────────────────────────────────┤
│              utilities-config-layer.js                      │
│  (EventEmitter, Logger, AppConfig, PerformanceMonitor)      │
└─────────────────────────────────────────────────────────────┘
```

**Key Design Patterns:**
- Event-driven pub/sub (`EventEmitter`) for component communication
- Hybrid fallback: Backend → Frontend graceful degradation
- Strategy pattern for parsers and optimization algorithms
- Service registry for dependency injection

**Hybrid Mode:**
- Frontend-only: Works offline, handles datasets up to 50MB in-browser
- Backend-enhanced: Offloads heavy computation to Flask/Django, supports 100MB+ datasets, automatic fallback if backend unavailable

## Tech Stack

| Category | Technologies |
|----------|-------------|
| Frontend | HTML5, CSS3, JavaScript (ES6+), Bootstrap 4.5 |
| Visualization | Chart.js 3.9, Particles.js |
| Data Processing | SheetJS (XLSX), custom CSV/TSV/XML parsers |
| Backend (Optional) | Python 3.8+, Flask/Django, pandas, NumPy |
| Animations | Animate.css, AOS |
| State Management | Custom EventEmitter, ModuleState |

## Pages

| Page | Description |
|------|-------------|
| Home | Introduction with animated hero section and featured projects |
| About | Professional background and expertise areas |
| Resume | Career history, achievements, and experience timeline |
| Skills | Technical abilities with proficiency indicators |
| Portfolio | Quantitative Investment Platform (interactive demo) |
| Contact | Contact form and professional links |

## Quick Start

**Frontend Only (No Setup Required)**

```bash
git clone https://github.com/FarnazNK/website.git
cd website
# Open index.html in your browser
```

**With Flask Backend**

```bash
pip install flask flask-cors pandas numpy werkzeug
python flask_backend.py
# Server runs at http://localhost:5000
```

**With Django Backend**

```bash
pip install django djangorestframework pandas numpy django-cors-headers
python manage.py migrate
python manage.py runserver
# Server runs at http://localhost:8000
```

To connect the frontend to a backend, click the settings icon (⚙️) in the navigation bar and enter your backend URL.

## Project Structure

```
├── index.html                  # Homepage with hero section and featured projects
├── about.html                  # Professional background
├── resume.html                 # Work experience timeline
├── skills.html                 # Technical skills with proficiency indicators
├── portfolio.html              # Quantitative Investment Platform (main app)
├── contact.html                # Contact form and links
├── styles.css                  # Global styles (dark theme, animations)
│
├── app.js                      # Main orchestrator: Application, UIManager,
│                               # DataService, AnalyticsService, Notification
├── utilities-config-layer.js   # Core: EventEmitter, AppConfig, Logger,
│                               # PerformanceMonitor, ModuleState
├── data-services-layer.js      # Parsers (CSV/TSV/XML/Excel), validators,
│                               # processors, transformers, batch processing
├── ui-modules-layer.js         # BaseModule, BaseView, ToolbarView,
│                               # component lifecycle management
├── backend-integration.js      # BackendService, HybridDataService,
│                               # HybridAnalyticsService, BackendConfig
├── integration-layer.js        # ApplicationBootstrap, dependency injection
│
├── flask_backend.py            # Flask REST API (optional backend)
├── django_backend.py           # Django REST API (optional backend)
└── manifest.json               # PWA manifest
```

## API Endpoints

When using the optional backend:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/upload` | Upload data file |
| GET | `/api/datasets` | List all datasets |
| GET | `/api/datasets/<id>` | Get specific dataset |
| DELETE | `/api/datasets/<id>` | Delete dataset |
| POST | `/api/datasets/<id>/risk-metrics` | Calculate risk metrics |
| POST | `/api/datasets/<id>/optimize-portfolio` | Portfolio optimization |
| POST | `/api/datasets/<id>/backtest` | Strategy backtesting |

## Data Sources Supported

- **Local Files:** CSV (auto-delimiter detection), TSV, Excel (.xlsx/.xls), JSON, XML, plain text
- **Cloud Storage:** Azure Blob Storage (SAS token auth), AWS S3 (pre-signed URLs)
- **APIs:** REST endpoints with configurable method, headers, and body
- **Google Sheets:** Direct integration via public/shared sheet URLs

## Browser Support

Chrome 90+ • Firefox 88+ • Safari 14+ • Edge 90+

## Deployment

The frontend can be deployed to any static hosting service (GitHub Pages, Netlify, Vercel, AWS S3 + CloudFront). The optional backend can be deployed to Heroku, AWS, Google Cloud, or DigitalOcean.

