from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import pandas as pd
import numpy as np
from typing import List, Dict, Optional
from pydantic import BaseModel
import sqlite3
import hashlib
import jwt
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("portfolio_api")

app = FastAPI(
    title="Farnaz Nasehi - Portfolio API",
    description="Backend API showcasing data processing and financial analytics capabilities",
    version="1.0.0",
    contact={
        "name": "Farnaz Nasehi",
        "email": "fnasehikalajahi@gmail.com",
        "url": "https://farnaznasehi.com"
    }
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
SECRET_KEY = "your-secret-key-change-in-production"

# Data models
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class DatasetUpload(BaseModel):
    name: str
    data: List[List[str]]
    headers: List[str]

class PortfolioCreate(BaseModel):
    name: str
    symbols: List[str]
    weights: List[float]

class MarketDataRequest(BaseModel):
    symbol: str
    period: str = "1mo"

# Database setup (SQLite for simplicity)
def init_db():
    conn = sqlite3.connect('portfolio.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Datasets table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS datasets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            headers TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Portfolios table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS portfolios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            symbols TEXT NOT NULL,
            weights TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

# Utility functions
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def create_jwt_token(username: str) -> str:
    payload = {
        "username": username,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        username = payload.get("username")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# API Endpoints

@app.get("/")
async def root():
    return {
        "message": "Welcome to Farnaz Nasehi's Portfolio API",
        "version": "1.0.0",
        "documentation": "/docs",
        "developer": {
            "name": "Farnaz Nasehi",
            "role": "Full-Stack Developer",
            "specialization": "Hyperspectral Imaging & Financial Analytics",
            "location": "Calgary, AB, Canada"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "uptime": "Service is running",
        "database": "Connected"
    }

@app.get("/api/info")
async def api_info():
    return {
        "name": "Portfolio Data Analytics API",
        "version": "1.0.0",
        "endpoints": len(app.routes),
        "technologies": {
            "backend": ["FastAPI", "Python", "SQLite"],
            "data_processing": ["pandas", "numpy"],
            "frontend": ["JavaScript", "Chart.js", "Bootstrap"]
        },
        "features": [
            "User Authentication",
            "Data Upload & Processing",
            "Portfolio Management",
            "Financial Analytics",
            "Real-time Data Processing"
        ]
    }

# Authentication endpoints
@app.post("/auth/register")
async def register_user(user: UserCreate):
    conn = sqlite3.connect('portfolio.db')
    cursor = conn.cursor()
    
    try:
        password_hash = hash_password(user.password)
        cursor.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            (user.username, user.email, password_hash)
        )
        conn.commit()
        
        token = create_jwt_token(user.username)
        return {
            "message": "User registered successfully",
            "token": token,
            "user": {"username": user.username, "email": user.email}
        }
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    finally:
        conn.close()

@app.post("/auth/login")
async def login_user(user: UserLogin):
    conn = sqlite3.connect('portfolio.db')
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT password_hash FROM users WHERE username = ?",
        (user.username,)
    )
    result = cursor.fetchone()
    conn.close()
    
    if not result or result[0] != hash_password(user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user.username)
    return {
        "message": "Login successful",
        "token": token,
        "user": {"username": user.username}
    }

@app.get("/auth/profile")
async def get_profile(current_user: str = Depends(verify_token)):
    conn = sqlite3.connect('portfolio.db')
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT username, email, created_at FROM users WHERE username = ?",
        (current_user,)
    )
    result = cursor.fetchone()
    conn.close()
    
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "username": result[0],
        "email": result[1],
        "created_at": result[2]
    }

# Data management endpoints
@app.post("/api/datasets")
async def upload_dataset(dataset: DatasetUpload, current_user: str = Depends(verify_token)):
    conn = sqlite3.connect('portfolio.db')
    cursor = conn.cursor()
    
    # Get user ID
    cursor.execute("SELECT id FROM users WHERE username = ?", (current_user,))
    user_id = cursor.fetchone()[0]
    
    # Store dataset metadata
    headers_str = ",".join(dataset.headers)
    cursor.execute(
        "INSERT INTO datasets (user_id, name, headers) VALUES (?, ?, ?)",
        (user_id, dataset.name, headers_str)
    )
    dataset_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    # Process data (basic statistics)
    df = pd.DataFrame(dataset.data, columns=dataset.headers)
    numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
    
    stats = {}
    for col in numeric_columns:
        stats[col] = {
            "mean": float(df[col].mean()),
            "std": float(df[col].std()),
            "min": float(df[col].min()),
            "max": float(df[col].max()),
            "count": int(df[col].count())
        }
    
    return {
        "dataset_id": dataset_id,
        "name": dataset.name,
        "rows": len(dataset.data),
        "columns": len(dataset.headers),
        "numeric_columns": numeric_columns,
        "statistics": stats
    }

@app.get("/api/datasets")
async def get_user_datasets(current_user: str = Depends(verify_token)):
    conn = sqlite3.connect('portfolio.db')
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT d.id, d.name, d.headers, d.created_at 
        FROM datasets d 
        JOIN users u ON d.user_id = u.id 
        WHERE u.username = ?
    """, (current_user,))
    
    datasets = []
    for row in cursor.fetchall():
        datasets.append({
            "id": row[0],
            "name": row[1],
            "headers": row[2].split(","),
            "created_at": row[3]
        })
    
    conn.close()
    return {"datasets": datasets}

# Portfolio management endpoints
@app.post("/api/portfolios")
async def create_portfolio(portfolio: PortfolioCreate, current_user: str = Depends(verify_token)):
    if len(portfolio.symbols) != len(portfolio.weights):
        raise HTTPException(status_code=400, detail="Symbols and weights must have the same length")
    
    if abs(sum(portfolio.weights) - 1.0) > 0.01:
        raise HTTPException(status_code=400, detail="Weights must sum to 1.0")
    
    conn = sqlite3.connect('portfolio.db')
    cursor = conn.cursor()
    
    # Get user ID
    cursor.execute("SELECT id FROM users WHERE username = ?", (current_user,))
    user_id = cursor.fetchone()[0]
    
    # Store portfolio
    symbols_str = ",".join(portfolio.symbols)
    weights_str = ",".join(map(str, portfolio.weights))
    
    cursor.execute(
        "INSERT INTO portfolios (user_id, name, symbols, weights) VALUES (?, ?, ?, ?)",
        (user_id, portfolio.name, symbols_str, weights_str)
    )
    portfolio_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {
        "portfolio_id": portfolio_id,
        "name": portfolio.name,
        "symbols": portfolio.symbols,
        "weights": portfolio.weights,
        "message": "Portfolio created successfully"
    }

@app.get("/api/portfolios")
async def get_user_portfolios(current_user: str = Depends(verify_token)):
    conn = sqlite3.connect('portfolio.db')
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT p.id, p.name, p.symbols, p.weights, p.created_at
        FROM portfolios p
        JOIN users u ON p.user_id = u.id
        WHERE u.username = ?
    """, (current_user,))
    
    portfolios = []
    for row in cursor.fetchall():
        portfolios.append({
            "id": row[0],
            "name": row[1],
            "symbols": row[2].split(","),
            "weights": list(map(float, row[3].split(","))),
            "created_at": row[4]
        })
    
    conn.close()
    return {"portfolios": portfolios}

# Analytics endpoints
@app.get("/api/analytics/summary")
async def get_analytics_summary(current_user: str = Depends(verify_token)):
    conn = sqlite3.connect('portfolio.db')
    cursor = conn.cursor()
    
    # Get user stats
    cursor.execute("SELECT id FROM users WHERE username = ?", (current_user,))
    user_id = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM datasets WHERE user_id = ?", (user_id,))
    dataset_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM portfolios WHERE user_id = ?", (user_id,))
    portfolio_count = cursor.fetchone()[0]
    
    conn.close()
    
    return {
        "user": current_user,
        "datasets": dataset_count,
        "portfolios": portfolio_count,
        "api_version": "1.0.0",
        "timestamp": datetime.utcnow()
    }

@app.post("/api/analytics/calculate")
async def calculate_metrics(data: Dict):
    """Calculate basic financial metrics for provided data"""
    try:
        values = data.get("values", [])
        if not values:
            raise HTTPException(status_code=400, detail="No values provided")
        
        arr = np.array(values)
        
        return {
            "count": len(arr),
            "mean": float(np.mean(arr)),
            "median": float(np.median(arr)),
            "std": float(np.std(arr)),
            "min": float(np.min(arr)),
            "max": float(np.max(arr)),
            "sum": float(np.sum(arr)),
            "percentiles": {
                "25th": float(np.percentile(arr, 25)),
                "75th": float(np.percentile(arr, 75)),
                "90th": float(np.percentile(arr, 90))
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Calculation error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    logger.info("API is running on http://localhost:8000")
    
