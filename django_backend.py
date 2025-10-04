# Django Backend for Quantitative Investment Platform
# Install: pip install django djangorestframework pandas numpy django-cors-headers

# settings.py additions
"""
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

REST_FRAMEWORK = {
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
    ],
}
"""

# models.py
from django.db import models
from django.contrib.auth.models import User
import json

class Dataset(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='datasets/')
    headers = models.JSONField()
    row_count = models.IntegerField()
    column_count = models.IntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']

class Analysis(models.Model):
    ANALYSIS_TYPES = [
        ('risk', 'Risk Analysis'),
        ('portfolio', 'Portfolio Optimization'),
        ('backtest', 'Strategy Backtest'),
    ]
    
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE)
    analysis_type = models.CharField(max_length=20, choices=ANALYSIS_TYPES)
    parameters = models.JSONField()
    results = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']

# serializers.py
from rest_framework import serializers

class DatasetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dataset
        fields = ['id', 'name', 'headers', 'row_count', 'column_count', 'uploaded_at']

class AnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Analysis
        fields = ['id', 'dataset', 'analysis_type', 'parameters', 'results', 'created_at']

# views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
import pandas as pd
import numpy as np
import io

class DatasetViewSet(viewsets.ModelViewSet):
    serializer_class = DatasetSerializer
    parser_classes = (MultiPartParser, FormParser)
    
    def get_queryset(self):
        return Dataset.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=400)
        
        try:
            # Parse file
            if file.name.endswith('.csv'):
                df = pd.read_csv(file)
            elif file.name.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file)
            else:
                return Response({'error': 'Unsupported file format'}, status=400)
            
            # Create dataset record
            dataset = Dataset.objects.create(
                user=request.user,
                name=file.name,
                file=file,
                headers=df.columns.tolist(),
                row_count=len(df),
                column_count=len(df.columns)
            )
            
            return Response({
                'id': dataset.id,
                'name': dataset.name,
                'headers': dataset.headers,
                'rows': df.head(50).values.tolist(),
                'row_count': dataset.row_count,
                'column_count': dataset.column_count
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    @action(detail=True, methods=['get'])
    def data(self, request, pk=None):
        dataset = self.get_object()
        try:
            if dataset.file.name.endswith('.csv'):
                df = pd.read_csv(dataset.file.path)
            else:
                df = pd.read_excel(dataset.file.path)
            
            return Response({
                'headers': df.columns.tolist(),
                'rows': df.values.tolist()
            })
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class AnalysisViewSet(viewsets.ModelViewSet):
    serializer_class = AnalysisSerializer
    
    def get_queryset(self):
        return Analysis.objects.filter(dataset__user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def risk_metrics(self, request):
        dataset_id = request.data.get('dataset_id')
        column = request.data.get('column')
        
        try:
            dataset = Dataset.objects.get(id=dataset_id, user=request.user)
            df = pd.read_csv(dataset.file.path) if dataset.file.name.endswith('.csv') else pd.read_excel(dataset.file.path)
            
            data = df[column].dropna().values
            returns = np.diff(data) / data[:-1]
            
            metrics = {
                'mean': float(np.mean(returns) * 252),
                'volatility': float(np.std(returns) * np.sqrt(252)),
                'sharpe_ratio': float((np.mean(returns) * 252) / (np.std(returns) * np.sqrt(252))),
                'var_95': float(np.percentile(returns, 5)),
                'max_drawdown': self._calculate_max_drawdown(data)
            }
            
            # Save analysis
            analysis = Analysis.objects.create(
                dataset=dataset,
                analysis_type='risk',
                parameters={'column': column},
                results=metrics
            )
            
            return Response(metrics)
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    @action(detail=False, methods=['post'])
    def optimize_portfolio(self, request):
        dataset_id = request.data.get('dataset_id')
        columns = request.data.get('columns', [])
        method = request.data.get('method', 'equal_weight')
        
        try:
            dataset = Dataset.objects.get(id=dataset_id, user=request.user)
            df = pd.read_csv(dataset.file.path) if dataset.file.name.endswith('.csv') else pd.read_excel(dataset.file.path)
            
            # Calculate returns for each asset
            returns_data = []
            for col in columns:
                prices = df[col].dropna().values
                returns = np.diff(prices) / prices[:-1]
                returns_data.append(returns)
            
            # Equal weight portfolio
            weights = [1.0 / len(columns)] * len(columns)
            
            # Calculate portfolio metrics
            portfolio_return = sum(w * np.mean(r) * 252 for w, r in zip(weights, returns_data))
            portfolio_vol = np.std(np.sum([w * r for w, r in zip(weights, returns_data)], axis=0)) * np.sqrt(252)
            
            result = {
                'weights': weights,
                'expected_return': float(portfolio_return),
                'volatility': float(portfolio_vol),
                'sharpe_ratio': float(portfolio_return / portfolio_vol) if portfolio_vol > 0 else 0
            }
            
            # Save analysis
            Analysis.objects.create(
                dataset=dataset,
                analysis_type='portfolio',
                parameters={'columns': columns, 'method': method},
                results=result
            )
            
            return Response(result)
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)
    
    def _calculate_max_drawdown(self, prices):
        cummax = np.maximum.accumulate(prices)
        drawdown = (cummax - prices) / cummax
        return float(np.max(drawdown))

# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'datasets', DatasetViewSet, basename='dataset')
router.register(r'analysis', AnalysisViewSet, basename='analysis')

urlpatterns = [
    path('api/', include(router.urls)),
]
