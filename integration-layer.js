// src/main.js
/**
 * Application Entry Point
 * Demonstrates enterprise-level initialization and module composition
 */

// Import core modules
import { Application } from './core/Application.js';
import { AppConfig } from './config/AppConfig.js';
import { Logger } from './utils/Logger.js';
// From:
import { Application } from './core/Application.js';
import { AppConfig } from './config/AppConfig.js';

// To:
import { Application } from './core-app-module.js';
import { AppConfig } from './utilities-config-layer.js';

// Import services
import { 
    DataService, 
    AnalyticsService, 
    LLMService 
} from './services/index.js';

// Import modules
import {
    ToolbarModule,
    DataManagerModule,
    AIInsightsModule,
    PortfolioManagerModule
} from './modules/index.js';

// Import business logic
import {
    ReturnsCalculator,
    VolatilityCalculator,
    PortfolioOptimizer
} from './business/index.js';

// Import utilities
import {
    PerformanceMonitor,
    ErrorBoundary,
    ModuleRegistry
} from './utils/index.js';

/**
 * Application Bootstrap
 * Demonstrates dependency injection and modular architecture
 */
class ApplicationBootstrap {
    constructor() {
        this.logger = new Logger('Bootstrap');
        this.config = new AppConfig();
        this.registry = new ModuleRegistry();
        this.performanceMonitor = new PerformanceMonitor();
        this.errorBoundary = new ErrorBoundary(this.renderErrorFallback.bind(this));
    }

    async initialize() {
        const timer = this.performanceMonitor.startTimer('app-initialization');
        
        try {
            this.logger.info('Starting application initialization...');
            
            // Register all modules with dependencies
            this.registerModules();
            
            // Initialize in dependency order
            await this.initializeCore();
            await this.initializeServices();
            await this.initializeUI();
            
            // Setup global handlers
            this.setupGlobalHandlers();
            
            timer.end();
            this.logger.info('Application initialized successfully', {
                performance: this.performanceMonitor.getMetrics()
            });
            
            return true;
            
        } catch (error) {
            timer.end();
            this.logger.error('Application initialization failed', null, error);
            this.errorBoundary.handleError(error, 'ApplicationBootstrap');
            throw error;
        }
    }

    registerModules() {
        // Core services (no dependencies)
        this.registry.register('config', () => this.config);
        this.registry.register('logger', () => this.logger);
        this.registry.register('performanceMonitor', () => this.performanceMonitor);
        
        // Business logic services
        this.registry.register('returnsCalculator', () => new ReturnsCalculator());
        this.registry.register('volatilityCalculator', () => new VolatilityCalculator());
        this.registry.register('portfolioOptimizer', () => new PortfolioOptimizer());
        
        // Data services (depend on config and calculators)
        this.registry.register('dataService', 
            async (deps) => new DataService(deps.config), 
            ['config', 'logger']
        );
        
        this.registry.register('analyticsService', 
            async (deps) => new AnalyticsService(deps.config, {
                returnsCalculator: deps.returnsCalculator,
                volatilityCalculator: deps.volatilityCalculator
            }), 
            ['config', 'returnsCalculator', 'volatilityCalculator']
        );
        
        this.registry.register('llmService', 
            async (deps) => new LLMService(deps.config), 
            ['config', 'logger']
        );
        
        // UI modules (depend on services)
        this.registry.register('toolbarModule', 
            async (deps) => new ToolbarModule(deps), 
            ['dataService', 'analyticsService']
        );
        
        this.registry.register('dataManagerModule', 
            async (deps) => new DataManagerModule(deps), 
            ['dataService', 'performanceMonitor']
        );
        
        this.registry.register('aiInsightsModule', 
            async (deps) => new AIInsightsModule(deps), 
            ['llmService', 'analyticsService', 'dataService']
        );
    }

    async initializeCore() {
        const coreModules = ['config', 'logger', 'performanceMonitor'];
        
        for (const moduleName of coreModules) {
            await this.registry.load(moduleName);
        }
    }

    async initializeServices() {
        const serviceModules = [
            'returnsCalculator',
            'volatilityCalculator', 
            'portfolioOptimizer',
            'dataService',
            'analyticsService',
            'llmService'
        ];
        
        for (const serviceName of serviceModules) {
            const service = await this.registry.load(serviceName);
            if (service && typeof service.initialize === 'function') {
                await service.initialize();
            }
        }
    }

    async initializeUI() {
        const uiModules = [
            'toolbarModule',
            'dataManagerModule',
            'aiInsightsModule'
        ];
        
        for (const moduleName of uiModules) {
            const module = await this.registry.load(moduleName);
            if (module && typeof module.initialize === 'function') {
                await module.initialize();
            }
        }
    }

    setupGlobalHandlers() {
        // Global error handling
        window.addEventListener('error', (event) => {
            this.errorBoundary.handleError(event.error, 'GlobalError');
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.errorBoundary.handleError(event.reason, 'UnhandledRejection');
        });

        // Performance monitoring
        window.addEventListener('beforeunload', () => {
            const report = this.performanceMonitor.generateReport();
            this.logger.info('Performance report', report);
        });

        // Expose debugging interface in development
        if (this.config.get('debug.enabled')) {
            window.app = {
                registry: this.registry,
                config: this.config,
                performance: this.performanceMonitor,
                logger: this.logger
            };
        }
    }

    renderErrorFallback(errorInfo) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-boundary-fallback';
        errorContainer.innerHTML = `
            <div class="container mt-5">
                <div class="alert alert-danger">
                    <h4>Application Error</h4>
                    <p>Something went wrong. Please refresh the page to try again.</p>
                    <details class="mt-3">
                        <summary>Error Details</summary>
                        <pre class="mt-2">${errorInfo.error.message}</pre>
                    </details>
                    <button class="btn btn-primary mt-3" onclick="window.location.reload()">
                        Reload Application
                    </button>
                </div>
            </div>
        `;
        
        document.body.innerHTML = '';
        document.body.appendChild(errorContainer);
    }
}

// src/architecture/README.md - Architecture Documentation
/**
 * ENTERPRISE-LEVEL ARCHITECTURE OVERVIEW
 * =====================================
 * 
 * This codebase demonstrates senior-level software architecture principles:
 * 
 * 1. MODULAR ARCHITECTURE
 *    - Separation of concerns with clear boundaries
 *    - Dependency injection for loose coupling
 *    - Plugin-based module system for extensibility
 * 
 * 2. DESIGN PATTERNS IMPLEMENTED
 *    - Singleton: Application, ServiceContainer
 *    - Observer: EventBus, Module communication
 *    - Factory: Calculator factories, Service factories
 *    - Template Method: BaseCalculator, BaseService
 *    - Strategy: Different optimization algorithms
 *    - Command: Action dispatching in modules
 * 
 * 3. SOLID PRINCIPLES
 *    - Single Responsibility: Each class has one purpose
 *    - Open/Closed: Extensible through interfaces
 *    - Liskov Substitution: Interchangeable implementations
 *    - Interface Segregation: Focused interfaces
 *    - Dependency Inversion: Depend on abstractions
 * 
 * 4. ENTERPRISE FEATURES
 *    - Comprehensive error handling and recovery
 *    - Performance monitoring and optimization
 *    - Caching strategies (LRU, TTL)
 *    - Rate limiting for API calls
 *    - Structured logging with levels
 *    - Configuration management
 *    - Memory management and cleanup
 * 
 * 5. CODE QUALITY PRACTICES
 *    - TypeScript-style documentation
 *    - Consistent error handling
 *    - Unit testable architecture
 *    - Separation of business logic from UI
 *    - Immutable data patterns where appropriate
 * 
 * 6. SCALABILITY FEATURES
 *    - Lazy loading of modules
 *    - Debouncing and throttling
 *    - Virtual scrolling for large datasets
 *    - Worker threads for heavy calculations
 *    - Efficient memory usage patterns
 * 
 * FOLDER STRUCTURE:
 * src/
 * ├── core/           # Core application infrastructure
 * ├── services/       # Business logic services
 * ├── modules/        # UI modules and components  
 * ├── business/       # Domain-specific calculations
 * ├── utils/          # Utility functions and helpers
 * ├── config/         # Configuration management
 * └── integration/    # Module registry and bootstrapping
 */

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const bootstrap = new ApplicationBootstrap();
    
    try {
        await bootstrap.initialize();
        console.log('🚀 Enterprise Quantitative Investment Platform ready!');
    } catch (error) {
        console.error('💥 Failed to initialize application:', error);
    }
});

// Export for testing and external use
export { ApplicationBootstrap };

// src/types/interfaces.js - TypeScript-style interfaces documentation
/**
 * INTERFACE DEFINITIONS (Documentation)
 * ===================================
 * 
 * interface IService {
 *   initialize(): Promise<void>;
 *   getStatus(): string;
 *   getMetrics(): object;
 * }
 * 
 * interface IModule {
 *   initialize(): Promise<void>;
 *   render(): Promise<void>;
 *   destroy(): void;
 *   getState(): object;
 * }
 * 
 * interface ICalculator {
 *   calculate(data: number[], options?: object): Promise<number | object>;
 *   validate(data: any, options?: object): Promise<void>;
 * }
 * 
 * interface IDataService {
 *   loadData(file: File): Promise<Dataset>;
 *   getCurrentDataset(): Dataset | null;
 *   transformData(config: TransformConfig): Promise<Dataset>;
 * }
 * 
 * interface ILLMService {
 *   analyzePortfolio(portfolio: Portfolio, context?: string): Promise<string>;
 *   interpretRiskMetrics(metrics: RiskMetrics, query?: string): Promise<string>;
 * }
 */

// Advanced usage examples for demonstration
class AdvancedUsageExamples {
    static async demonstrateAsyncPipeline() {
        // Example of complex async data processing pipeline
        const app = new ApplicationBootstrap();
        await app.initialize();
        
        const dataService = app.registry.get('dataService');
        const analyticsService = app.registry.get('analyticsService');
        
        // Async pipeline with error handling
        const processingPipeline = [
            (data) => dataService.validateData(data),
            (data) => dataService.cleanData(data),
            (data) => analyticsService.calculateReturns(data),
            (data) => analyticsService.calculateRiskMetrics(data)
        ];
        
        let result = await fetch('/api/data').then(r => r.json());
        
        for (const processor of processingPipeline) {
            result = await processor(result);
        }
        
        return result;
    }
    
    static demonstrateEventDrivenArchitecture() {
        // Example of event-driven communication between modules
        const eventBus = new EventBus();
        
        // Publisher
        class DataProcessor {
            async processData(data) {
                eventBus.emit('data:processing:started', { size: data.length });
                
                const result = await this.heavyProcessing(data);
                
                eventBus.emit('data:processing:completed', { 
                    result, 
                    processingTime: Date.now() 
                });
            }
        }
        
        // Subscriber
        class UIUpdater {
            constructor() {
                eventBus.on('data:processing:started', this.showLoading.bind(this));
                eventBus.on('data:processing:completed', this.updateUI.bind(this));
            }
        }
    }
}

// Performance testing utilities
class PerformanceTester {
    static async benchmarkCalculations() {
        const calculator = new ReturnsCalculator();
        const testData = Array.from({ length: 10000 }, () => Math.random() * 100);
        
        console.time('Returns Calculation');
        const returns = await calculator.calculate(testData);
        console.timeEnd('Returns Calculation');
        
        console.log(`Processed ${testData.length} data points`);
        console.log(`Generated ${returns.length} returns`);
    }
    
    static async stressTestCache() {
        const cache = new SmartCache({ maxSize: 1000 });
        
        console.time('Cache Stress Test');
        
        // Write test
        for (let i = 0; i < 10000; i++) {
            cache.set(`key_${i}`, { data: Math.random() });
        }
        
        // Read test
        let hits = 0;
        for (let i = 0; i < 10000; i++) {
            if (cache.get(`key_${i}`)) hits++;
        }
        
        console.timeEnd('Cache Stress Test');
        console.log(`Cache hit rate: ${(hits / 10000 * 100).toFixed(2)}%`);
        console.log('Cache stats:', cache.getStats());
    }
}