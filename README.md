# Farnaz Nasehi - Professional Portfolio

This repository contains the source code for my professional portfolio website showcasing my skills, experience, and projects as a Full-Stack Developer.

## Live Website
The website is live at: https://farnaznasehi.com/

## Overview

My portfolio demonstrates enterprise-level development capabilities through an interactive quantitative investment platform, alongside comprehensive information about my professional background, skills, and experience.

## Features

### Portfolio Website
- **Responsive Design**: Works seamlessly on all devices and screen sizes
- **Interactive Background**: Animated particles.js effects
- **Comprehensive Sections**: About, Experience, Skills, Projects, and Contact
- **Professional Presentation**: Clean, modern design showcasing my work

### Quantitative Investment Platform
The centerpiece of my portfolio - a sophisticated financial analysis tool:

- **Multi-format Data Import**: Support for CSV, Excel, JSON, and XML files with intelligent parsing
- **Interactive Data Visualization**: Dynamic charts and plots using Chart.js
- **Risk Analytics**: VaR calculations, volatility modeling, Sharpe ratios, and drawdown analysis
- **Portfolio Optimization**: Multiple optimization strategies (Equal Weight, Min Volatility, Max Sharpe, Risk Parity)
- **Strategy Backtesting**: Test trading strategies with performance metrics
- **AI-Powered Insights**: Simulated intelligent analysis and recommendations

### Technical Architecture
- **Modular Design**: Clean separation of concerns with dependency injection
- **Event-Driven Architecture**: Decoupled communication between components
- **Enterprise Patterns**: Observer, Factory, Strategy, and Template Method patterns
- **Performance Monitoring**: Built-in metrics tracking and optimization
- **Error Handling**: Comprehensive error boundaries and recovery mechanisms
- **Memory Management**: Efficient caching with automatic cleanup

## Technologies Used

### Frontend Technologies
- **HTML5 & CSS3**: Modern semantic markup and styling
- **JavaScript (ES6+)**: Advanced language features and modular programming
- **Bootstrap 4.5.2**: Responsive grid system and UI components
- **Chart.js**: Interactive data visualization and charting
- **Particles.js**: Animated background effects
- **FontAwesome**: Professional icon library
- **Animate.css**: Smooth CSS animations

### Development Tools & Libraries
- **XLSX.js**: Excel file processing
- **FastAPI**: Python backend framework (demonstration)
- **SQLite/PostgreSQL**: Database solutions
- **JWT**: Authentication tokens

### Pages & Sections
- **Home**: Introduction and featured projects
- **About**: Professional background and personal information
- **Work Experience**: Career history and key achievements
- **Skills**: Comprehensive breakdown of technical abilities
- **Quantitative Investment Platform**: Interactive financial analysis tool
- **Contact**: Professional contact information and form

## File Structure

### Portfolio Website Files
```
├── index.html              # Homepage with introduction
├── about.html              # Professional background
├── resume.html             # Work experience and career history
├── skills.html             # Technical skills and competencies
├── portfolio.html          # Quantitative investment platform
├── contact.html            # Contact information and form
├── styles.css              # Global styling and responsive design
└── scripts/
    ├── main.js             # Site-wide functionality
    └── animations.js       # Interactive animations
```

### Quantitative Platform Files
```
├── app.js                  # Complete working application
├── main.py                 # FastAPI backend demonstration
├── core-app-module.js      # Core application infrastructure
├── utilities-config-layer.js # Configuration and utility classes
├── ui-modules-layer.js     # UI components and modules
├── data-services-layer.js  # Enhanced data processing services
├── business-logic-layer.js # Financial calculations and algorithms
├── integration-layer.js    # Module registry and bootstrapping
└── manifest.json          # PWA configuration
```

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for CDN resources
- Local web server recommended for full functionality

### Development Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/FarnazNK/portfolio.git
   cd portfolio
   ```

2. For local development:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```

3. Open `http://localhost:8000` in your browser

### Quick Start for Quantitative Platform
1. Navigate to the Quantitative Investment Platform page
2. Upload sample financial data (CSV format recommended)
3. Explore the various analytical modules:
   - Data visualizations
   - Risk analytics calculations
   - Portfolio optimization
   - Strategy backtesting
   - AI-powered insights

### Sample Data Format
The platform accepts CSV files with the following structure:
```csv
Date,Symbol,Open,High,Low,Close,Volume
2024-01-01,AAPL,150.00,155.00,149.00,154.00,1000000
2024-01-02,AAPL,154.50,158.00,153.00,157.50,1200000
```

## Usage Guide

### Navigating the Portfolio
- **Home Page**: Overview of professional background and featured projects
- **About Section**: Detailed personal and professional information
- **Experience Page**: Career history with key achievements and responsibilities
- **Skills Section**: Technical competencies and proficiency levels
- **Portfolio Showcase**: Interactive quantitative investment platform
- **Contact Page**: Professional contact information and inquiry form

### Using the Quantitative Platform

#### Data Management
1. **Upload Data**: Drag and drop files or click browse
2. **Review Preview**: Examine data structure and quality metrics
3. **Column Detection**: Automatic identification of numeric/date columns

#### Analytics Modules

**Visualizations**
- Select columns for analysis
- Generate line charts, bar charts, or histograms
- Interactive chart controls with Chart.js

**Risk Analytics**
- Choose price/return columns
- Calculate volatility, VaR, Sharpe ratios
- Analyze maximum drawdown and risk metrics

**Portfolio Optimization**
- Select multiple assets
- Choose optimization method
- View optimal weights and expected performance

**Strategy Backtesting**
- Define trading strategies
- Set parameters (moving averages, momentum periods)
- Analyze backtest performance metrics

**AI Insights**
- Query-based analysis interface
- Contextual recommendations
- Data quality assessments

## Technical Implementation

### Portfolio Website Architecture
- **Responsive Design**: CSS Grid and Flexbox for adaptive layouts
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Performance Optimized**: Lazy loading, minified assets, and CDN usage
- **Accessibility**: WCAG 2.1 compliant with semantic HTML and ARIA labels

### Quantitative Platform Technical Details

**Architecture Patterns**
- **Modular Architecture**: Clean separation between UI, business logic, and data layers
- **Dependency Injection**: Service container for loose coupling
- **Event-Driven Communication**: Observer pattern for module interaction
- **Design Patterns**: Factory, Strategy, Template Method implementations

**Financial Calculations**
- **Risk Metrics**: Historical volatility, VaR (Historical/Parametric/Monte Carlo), Sharpe ratios
- **Portfolio Optimization**: Mean-variance, minimum volatility, maximum Sharpe, risk parity
- **Strategy Backtesting**: Buy-and-hold, moving averages, momentum strategies
- **Performance Analytics**: Returns analysis, drawdown calculations, attribution

**Performance Features**
- Smart caching with LRU eviction
- Debounced user interactions
- Lazy loading of heavy components
- Memory-efficient data processing

## Development Features

### Code Quality & Best Practices
- **Clean Architecture**: Separation of concerns and SOLID principles
- **TypeScript-style Documentation**: Comprehensive inline documentation
- **Error Handling**: Robust error boundaries and graceful degradation
- **Testing Ready**: Modular structure suitable for unit and integration testing
- **Security Conscious**: Input validation, XSS prevention, and secure practices

### Browser Compatibility
- Chrome 80+
- Firefox 75+  
- Safari 13+
- Edge 80+
- Mobile browsers (iOS Safari, Chrome Mobile)

### Performance Benchmarks
- **Data Processing**: Handles up to 1M rows efficiently
- **Chart Rendering**: Supports 10K+ data points smoothly
- **Memory Usage**: Optimized to stay under 100MB for typical datasets
- **Loading Time**: Sub-3-second load times for files up to 50MB

## Deployment

The website is deployed and accessible at: **https://farnaznasehi.com/**

### Hosting Details
- Static hosting optimized for performance
- CDN integration for global accessibility
- Responsive design tested across devices
- SEO optimized with proper meta tags and structure

## Contact & Professional Information

**Farnaz Nasehi**  
Full-Stack Developer | Financial Technology Specialist

- **Email**: fnasehikalajahi@gmail.com
- **LinkedIn**: [linkedin.com/in/farnaz-nasehi](https://linkedin.com/in/farnaz-nasehi)
- **GitHub**: [github.com/FarnazNK](https://github.com/FarnazNK)
- **Location**: Calgary, AB, Canada
- **Website**: [farnaznasehi.com](https://farnaznasehi.com)

## License
© 2025 Farnaz Nasehi. All Rights Reserved.

---

*This portfolio demonstrates enterprise-level full-stack development capabilities with specialized expertise in financial technology, quantitative analysis, and modern web development practices.*
