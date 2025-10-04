# Flask Backend for Quantitative Investment Platform
# Install: pip install flask flask-cors pandas numpy werkzeug

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import pandas as pd
import numpy as np
import os
import io
from datetime import datetime
import tempfile

app = Flask(__name__)
CORS(app)

# Configuration
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size
app.config['UPLOAD_FOLDER'] = tempfile.gettempdir()

# In-memory storage
datasets = {}

# Helper functions
def calculate_returns(prices):
    """Calculate simple returns"""
    return np.diff(prices) / prices[:-1]

def calculate_max_drawdown(prices):
    """Calculate maximum drawdown"""
    cummax = np.maximum.accumulate(prices)
    drawdown = (cummax - prices) / cummax
    return float(np.max(drawdown))

def calculate_moving_average(data, window):
    """Calculate moving average"""
    return np.convolve(data, np.ones(window)/window, mode='valid')

# Error handler
@app.errorhandler(Exception)
def handle_error(error):
    response = {
        'error': str(error),
        'type': type(error).__name__
    }
    return jsonify(response), 500

# Routes
@app.route('/')
def index():
    return jsonify({
        'message': 'Quantitative Investment Platform Flask API',
        'version': '1.0.0',
        'endpoints': {
            'upload': '/api/upload',
            'datasets': '/api/datasets',
            'risk': '/api/datasets/<id>/risk-metrics',
            'portfolio': '/api/datasets/<id>/optimize-portfolio',
            'backtest': '/api/datasets/<id>/backtest'
        }
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Upload and parse data file"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    
    try:
        # Read file
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file)
        else:
            return jsonify({'error': 'Unsupported file format'}), 400
        
        # Generate dataset ID
        dataset_id = f"ds_{int(datetime.now().timestamp())}"
        
        # Store dataset
        datasets[dataset_id] = {
            'name': secure_filename(file.filename),
            'dataframe': df,
            'headers': df.columns.tolist(),
            'row_count': len(df),
            'column_count': len(df.columns),
            'uploaded_at': datetime.now().isoformat()
        }
        
        # Get numeric columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        return jsonify({
            'id': dataset_id,
            'name': datasets[dataset_id]['name'],
            'headers': datasets[dataset_id]['headers'],
            'rows': df.head(50).values.tolist(),
            'row_count': datasets[dataset_id]['row_count'],
            'column_count': datasets[dataset_id]['column_count'],
            'numeric_columns': numeric_cols,
            'uploaded_at': datasets[dataset_id]['uploaded_at']
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/datasets', methods=['GET'])
def list_datasets():
    """List all datasets"""
    return jsonify([
        {
            'id': ds_id,
            'name': ds_data['name'],
            'headers': ds_data['headers'],
            'row_count': ds_data['row_count'],
            'column_count': ds_data['column_count'],
            'uploaded_at': ds_data['uploaded_at']
        }
        for ds_id, ds_data in datasets.items()
    ])

@app.route('/api/datasets/<dataset_id>', methods=['GET'])
def get_dataset(dataset_id):
    """Get dataset by ID"""
    if dataset_id not in datasets:
        return jsonify({'error': 'Dataset not found'}), 404
    
    ds = datasets[dataset_id]
    df = ds['dataframe']
    
    return jsonify({
        'id': dataset_id,
        'name': ds['name'],
        'headers': ds['headers'],
        'rows': df.values.tolist(),
        'row_count': ds['row_count'],
        'column_count': ds['column_count']
    })

@app.route('/api/datasets/<dataset_id>', methods=['DELETE'])
def delete_dataset(dataset_id):
    """Delete dataset"""
    if dataset_id not in datasets:
        return jsonify({'error': 'Dataset not found'}), 404
    
    del datasets[dataset_id]
    return jsonify({'message': 'Dataset deleted successfully'})

@app.route('/api/datasets/<dataset_id>/risk-metrics', methods=['POST'])
def risk_metrics(dataset_id):
    """Calculate risk metrics"""
    if dataset_id not in datasets:
        return jsonify({'error': 'Dataset not found'}), 404
    
    data = request.get_json()
    column = data.get('column')
    
    if not column:
        return jsonify({'error': 'Column parameter required'}), 400
    
    df = datasets[dataset_id]['dataframe']
    
    if column not in df.columns:
        return jsonify({'error': f'Column {column} not found'}), 400
    
    try:
        # Get data
        prices = df[column].dropna().values
        
        if len(prices) < 10:
            return jsonify({'error': 'Insufficient data points'}), 400
        
        # Calculate returns
        returns = calculate_returns(prices)
        
        # Calculate metrics
        mean_return = float(np.mean(returns) * 252)
        volatility = float(np.std(returns) * np.sqrt(252))
        sharpe_ratio = mean_return / volatility if volatility > 0 else 0
        var_95 = float(-np.percentile(returns, 5))
        var_99 = float(-np.percentile(returns, 1))
        max_dd = calculate_max_drawdown(prices)
        
        return jsonify({
            'mean': mean_return,
            'volatility': volatility,
            'sharpe_ratio': sharpe_ratio,
            'var_95': var_95,
            'var_99': var_99,
            'max_drawdown': max_dd
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/datasets/<dataset_id>/optimize-portfolio', methods=['POST'])
def optimize_portfolio(dataset_id):
    """Optimize portfolio allocation"""
    if dataset_id not in datasets:
        return jsonify({'error': 'Dataset not found'}), 404
    
    data = request.get_json()
    columns = data.get('columns', [])
    method = data.get('method', 'equal_weight')
    
    if not columns or len(columns) < 2:
        return jsonify({'error': 'At least 2 columns required'}), 400
    
    df = datasets[dataset_id]['dataframe']
    
    # Validate columns
    for col in columns:
        if col not in df.columns:
            return jsonify({'error': f'Column {col} not found'}), 400
    
    try:
        # Calculate returns for each asset
        returns_matrix = []
        for col in columns:
            prices = df[col].dropna().values
            returns = calculate_returns(prices)
            returns_matrix.append(returns)
        
        # Align lengths
        min_length = min(len(r) for r in returns_matrix)
        returns_matrix = [r[:min_length] for r in returns_matrix]
        returns_array = np.array(returns_matrix)
        
        # Equal weight allocation
        n_assets = len(columns)
        weights = [1.0 / n_assets] * n_assets
        
        # Calculate portfolio metrics
        portfolio_returns = np.dot(weights, returns_array)
        expected_return = float(np.mean(portfolio_returns) * 252)
        portfolio_vol = float(np.std(portfolio_returns) * np.sqrt(252))
        sharpe = expected_return / portfolio_vol if portfolio_vol > 0 else 0
        
        return jsonify({
            'weights': weights,
            'expected_return': expected_return,
            'volatility': portfolio_vol,
            'sharpe_ratio': sharpe,
            'assets': columns
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/datasets/<dataset_id>/backtest', methods=['POST'])
def backtest_strategy(dataset_id):
    """Backtest trading strategy"""
    if dataset_id not in datasets:
        return jsonify({'error': 'Dataset not found'}), 404
    
    data = request.get_json()
    price_column = data.get('price_column')
    strategy_type = data.get('strategy_type', 'buyhold')
    parameter = data.get('parameter', 20)
    
    if not price_column:
        return jsonify({'error': 'price_column required'}), 400
    
    df = datasets[dataset_id]['dataframe']
    
    if price_column not in df.columns:
        return jsonify({'error': f'Column {price_column} not found'}), 400
    
    try:
        prices = df[price_column].dropna().values
        
        if len(prices) < 50:
            return jsonify({'error': 'Insufficient data for backtesting'}), 400
        
        # Generate signals
        signals = np.zeros(len(prices))
        
        if strategy_type == "buyhold":
            signals = np.ones(len(prices))
        elif strategy_type == "sma":
            sma = calculate_moving_average(prices, parameter)
            for i in range(parameter, len(prices)):
                signals[i] = 1 if prices[i] > sma[i - parameter] else 0
        elif strategy_type == "momentum":
            for i in range(parameter, len(prices)):
                signals[i] = 1 if prices[i] > prices[i - parameter] else 0
        
        # Simulate trading
        cash = 10000.0
        position = 0.0
        portfolio_values = []
        
        for i in range(len(prices)):
            if signals[i] == 1 and position == 0:
                position = cash / prices[i]
                cash = 0
            elif signals[i] == 0 and position > 0:
                cash = position * prices[i]
                position = 0
            
            portfolio_value = cash + (position * prices[i])
            portfolio_values.append(portfolio_value)
        
        # Calculate metrics
        portfolio_array = np.array(portfolio_values)
        returns = calculate_returns(portfolio_array)
        
        total_return = ((portfolio_values[-1] - 10000) / 10000) * 100
        volatility = float(np.std(returns) * np.sqrt(252))
        sharpe = float(np.mean(returns) * 252 / volatility) if volatility > 0 else 0
        max_dd = calculate_max_drawdown(portfolio_array)
        
        return jsonify({
            'total_return': total_return,
            'volatility': volatility,
            'sharpe_ratio': sharpe,
            'max_drawdown': max_dd,
            'portfolio_values': portfolio_values[:100],  # Return first 100 for preview
            'final_value': portfolio_values[-1]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/datasets/<dataset_id>/column-stats/<column_name>', methods=['GET'])
def column_stats(dataset_id, column_name):
    """Get column statistics"""
    if dataset_id not in datasets:
        return jsonify({'error': 'Dataset not found'}), 404
    
    df = datasets[dataset_id]['dataframe']
    
    if column_name not in df.columns:
        return jsonify({'error': f'Column {column_name} not found'}), 400
    
    try:
        series = df[column_name]
        
        if pd.api.types.is_numeric_dtype(series):
            return jsonify({
                'type': 'numeric',
                'count': int(series.count()),
                'mean': float(series.mean()),
                'std': float(series.std()),
                'min': float(series.min()),
                'max': float(series.max()),
                'median': float(series.median()),
                'q25': float(series.quantile(0.25)),
                'q75': float(series.quantile(0.75))
            })
        else:
            return jsonify({
                'type': 'categorical',
                'count': int(series.count()),
                'unique': int(series.nunique()),
                'top': str(series.mode()[0]) if len(series.mode()) > 0 else None,
                'freq': int(series.value_counts().iloc[0]) if len(series) > 0 else 0
            })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'datasets_count': len(datasets),
        'timestamp': datetime.now().isoformat()
    })

# Run the app
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
        