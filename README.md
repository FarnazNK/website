# Farnaz Nasehi - Professional Portfolio

This repository contains the source code for my professional portfolio website showcasing my skills, experience, and projects as a Full-Stack Developer.

## Live Website

The website is live at: https://farnaznasehi.com/

## Features

### Frontend
- Responsive design that works on all devices
- Interactive quantitative investment platform with:
  - Data visualization with Chart.js
  - Risk analytics and portfolio optimization
  - Trading strategy backtesting
  - AI-powered insights
- Animated UI elements with particles.js background
- Multi-source data import (Local files, Cloud storage, APIs, Databases)
- Real-time data processing and analysis

### Backend Integration (Optional)
- Hybrid architecture supporting both standalone and server-enhanced modes
- Flask/Django backend for heavy computational tasks
- Automatic fallback to frontend processing if backend unavailable
- Progress tracking for large file uploads
- Enhanced performance for big datasets

## Technologies Used

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Bootstrap 4.5.2 for responsive layout
- Chart.js 3.9.1 for data visualization
- SheetJS (XLSX) for Excel file processing
- Particles.js for interactive background
- FontAwesome 6.0 for icons

### Backend (Optional)
- **Flask Backend**: Python 3.8+, Flask, Flask-CORS, pandas, numpy
- **Django Backend**: Python 3.8+, Django, Django REST Framework, pandas, numpy
- Both support CSV, Excel, and JSON data processing
- RESTful API with CORS enabled for browser integration

## Architecture

The platform uses a **hybrid architecture** that can operate in two modes:

1. **Frontend-Only Mode** (Default)
   - All processing happens in the browser
   - No server required
   - Works offline after initial load
   - Suitable for datasets up to 50MB

2. **Backend-Enhanced Mode** (Optional)
   - Heavy computations offloaded to server
   - Faster processing for large datasets
   - Support for datasets over 50MB
   - Automatic fallback to frontend if backend fails

## Pages

- **Home** (`index.html`): Introduction and featured projects
- **About** (`about.html`): Background and professional information
- **Resume** (`resume.html`): Career history and achievements
- **Skills** (`skills.html`): Comprehensive breakdown of technical abilities
- **Portfolio** (`portfolio.html`): Quantitative Investment Platform
- **Contact** (`contact.html`): Contact information and form

## File Structure

```
├── index.html                      # Homepage
├── about.html                      # About page
├── resume.html                     # Experience page
├── skills.html                     # Skills page
├── portfolio.html                  # Investment platform
├── contact.html                    # Contact page
├── styles.css                      # Global styles
├── app.js                         # Main application logic
├── backend-integration.js          # Backend integration layer
├── data-services-layer.js          # Data processing utilities
├── ui-modules-layer.js             # UI components
├── utilities-config-layer.js       # Core utilities
├── integration-layer.js            # Service integration
├── flask_backend.py                # Flask backend (optional)
├── django_backend.py               # Django backend (optional)
└── manifest.json                   # PWA manifest
```

## Development

### Frontend Only

To run the frontend locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/portfolio.git
   cd portfolio
   ```

2. Open `portfolio.html` in your browser
   - No build process required
   - Works immediately

### With Backend (Optional)

#### Option 1: Flask Backend

1. Install dependencies:
   ```bash
   pip install flask flask-cors pandas numpy werkzeug
   ```

2. Start the Flask server:
   ```bash
   python flask_backend.py
   ```
   Server runs on `http://localhost:5000`

#### Option 2: Django Backend

1. Install dependencies:
   ```bash
   pip install django djangorestframework pandas numpy django-cors-headers
   ```

2. Setup Django project:
   ```bash
   django-admin startproject investment_platform
   cd investment_platform
   python manage.py startapp api
   ```

3. Add the code from `django_backend.py` to appropriate Django files

4. Run migrations and start server:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```
   Server runs on `http://localhost:8000`

#### Configure Frontend to Use Backend

1. Open the portfolio page in your browser
2. Click the settings icon (⚙️) in the navigation bar
3. Enter your backend URL:
   - Flask: `http://localhost:5000`
   - Django: `http://localhost:8000`
4. Check "Enable backend integration"
5. Click "Save & Reload"

The application will now use the backend for heavy computations while maintaining responsive UI.

## API Endpoints

When using the backend, the following endpoints are available:

### Flask/Django Common Endpoints

- `GET /` - Health check
- `POST /api/upload` - Upload data file
- `GET /api/datasets` - List all datasets
- `GET /api/datasets/<id>` - Get specific dataset
- `DELETE /api/datasets/<id>` - Delete dataset
- `POST /api/datasets/<id>/risk-metrics` - Calculate risk metrics
- `POST /api/datasets/<id>/optimize-portfolio` - Optimize portfolio
- `POST /api/datasets/<id>/backtest` - Backtest strategy
- `GET /api/datasets/<id>/column-stats/<column>` - Get column statistics

## Features in Detail

### Data Import
- **Local Files**: CSV, Excel (.xlsx, .xls), JSON
- **Cloud Storage**: Azure Blob Storage, AWS S3, Google Sheets
- **Databases**: PostgreSQL, MySQL, MongoDB, SQL Server, Oracle, DynamoDB, Cosmos DB (via API)
- **REST APIs**: Custom API endpoints with configurable headers and authentication

### Analytics Capabilities
- **Risk Analysis**: Volatility, Sharpe Ratio, Value at Risk (VaR), Maximum Drawdown
- **Portfolio Optimization**: Equal weight, Minimum volatility, Maximum Sharpe ratio
- **Strategy Backtesting**: Buy & Hold, Simple Moving Average (SMA), Momentum strategies
- **Visualizations**: Line charts, Bar charts, Time series analysis
- **AI Insights**: Pattern recognition and data analysis recommendations

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- **Frontend Mode**: Handles datasets up to 50MB efficiently
- **Backend Mode**: Supports datasets over 100MB with streaming
- All operations are non-blocking with progress indicators
- Automatic timeout and retry mechanisms
- Graceful degradation on errors

## Security Considerations

- CORS configured for backend endpoints
- No sensitive data stored in browser localStorage (except user preferences)
- File size limits enforced (50MB frontend, configurable backend)
- Input validation on all data sources
- XSS protection through content sanitization

## Deployment

### Frontend Deployment
Deploy to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront

### Backend Deployment
Deploy backend to:
- **Flask**: Heroku, AWS Elastic Beanstalk, Google Cloud Run
- **Django**: Heroku, AWS EC2, Google App Engine, DigitalOcean

Update the backend URL in the settings after deployment.

## Contributing

This is a personal portfolio project. However, suggestions and feedback are welcome through the contact form on the website.

## License

© 2025 Farnaz Nasehi. All Rights Reserved.

## Contact

- **Website**: https://farnaznasehi.com
- **Email**: fnasehikalajahi@gmail.com
- **LinkedIn**: [linkedin.com/in/farnaz-nasehi](https://linkedin.com/in/farnaz-nasehi)
- **GitHub**: [github.com/FarnazNK](https://github.com/FarnazNK)

## Acknowledgments

- Bootstrap team for the responsive framework
- Chart.js team for visualization library
- Particles.js for background effects
- All open-source contributors whose libraries made this possible
