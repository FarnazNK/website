from fastapi import FastAPI, UploadFile, File, HTTPException, Depends 
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
import io
from typing import List, Optional, Dict, Any
from sklearn.preprocessing import StandardScaler, LabelEncoder, MinMaxScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split
from pydantic import BaseModel, Field
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("data_analytics_api")

# Initialize FastAPI app
app = FastAPI(
    title="Data Analytics API",
    description="API for data analysis, visualization, and machine learning",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store dataset globally (in production, consider using a database)
dataset_store = {"headers": [], "df": None, "name": None}

# Request/Response Models
class DatasetInfo(BaseModel):
    name: str
    headers: List[str]
    row_count: int
    column_types: Dict[str, str]
    preview_rows: Optional[List[Dict[str, Any]]] = None

class PredictionRequest(BaseModel):
    x_columns: List[str] = Field(..., description="List of input feature column names")
    y_column: Optional[str] = Field(None, description="Target variable column name (not required for clustering)")
    model: str = Field(..., description="Model name to use for prediction")
    test_split: float = Field(0.2, description="Proportion of data to use for testing")
    params: Optional[Dict[str, Any]] = Field(None, description="Optional model parameters")

class TransformationRequest(BaseModel):
    column: str
    transformation: str
    params: Optional[Dict[str, Any]] = Field(None, description="Optional transformation parameters")

class CorrelationRequest(BaseModel):
    columns: List[str]
    method: str = "pearson"

# Dependency for checking if dataset exists
def get_dataset():
    if dataset_store["df"] is None:
        raise HTTPException(status_code=400, detail="No dataset loaded. Please upload a dataset first.")
    return dataset_store["df"]

# API: Upload Dataset
@app.post("/upload", response_model=DatasetInfo)
async def upload_file(file: UploadFile = File(...)):
    global dataset_store
    
    try:
        logger.info(f"Uploading file: {file.filename}")
        
        if file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(await file.read()))
        elif file.filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(await file.read()))
        else:
            raise HTTPException(status_code=400, detail="Invalid file format. Only CSV and Excel are supported.")

        # Store dataset
        dataset_store["name"] = file.filename
        dataset_store["headers"] = list(df.columns)
        dataset_store["df"] = df
        
        # Determine column types
        column_types = {}
        for col in df.columns:
            if pd.api.types.is_numeric_dtype(df[col]):
                column_types[col] = "numeric"
            elif pd.api.types.is_datetime64_dtype(df[col]):
                column_types[col] = "datetime"
            else:
                column_types[col] = "categorical"
        
        # Create preview (first 5 rows)
        preview_rows = df.head(5).to_dict(orient="records")
        
        return {
            "name": file.filename,
            "headers": dataset_store["headers"],
            "row_count": len(df),
            "column_types": column_types,
            "preview_rows": preview_rows
        }
    except Exception as e:
        logger.error(f"Error uploading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

# API: Get Dataset Headers and Info
@app.get("/dataset", response_model=DatasetInfo)
async def get_dataset_info(df: pd.DataFrame = Depends(get_dataset)):
    column_types = {}
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            column_types[col] = "numeric"
        elif pd.api.types.is_datetime64_dtype(df[col]):
            column_types[col] = "datetime"
        else:
            column_types[col] = "categorical"
    
    return {
        "name": dataset_store["name"],
        "headers": dataset_store["headers"],
        "row_count": len(df),
        "column_types": column_types,
        "preview_rows": df.head(5).to_dict(orient="records")
    }

# API: Perform Predictions
@app.post("/predict")
async def predict(request: PredictionRequest, df: pd.DataFrame = Depends(get_dataset)):
    try:
        logger.info(f"Running prediction with model: {request.model}")
        
        # Validate columns
        if any(col not in df.columns for col in request.x_columns):
            raise HTTPException(status_code=400, detail="One or more X columns not found in dataset.")
        
        if request.y_column and request.y_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Target column '{request.y_column}' not found in dataset.")
        
        # Get features
        X = df[request.x_columns]
        
        # Clustering models (unsupervised)
        if request.model in ["kmeans", "hierarchical", "dbscan"]:
            if request.y_column:
                logger.warning("Y column provided for clustering model - will be ignored")
            
            # Parameter handling
            params = request.params or {}
            
            if request.model == "kmeans":
                n_clusters = params.get("n_clusters", 3)
                model = KMeans(n_clusters=n_clusters, n_init=10)
            elif request.model == "hierarchical":
                n_clusters = params.get("n_clusters", 3)
                model = AgglomerativeClustering(n_clusters=n_clusters)
            elif request.model == "dbscan":
                eps = params.get("eps", 0.5)
                min_samples = params.get("min_samples", 5)
                model = DBSCAN(eps=eps, min_samples=min_samples)
            
            # Fit model and get cluster labels
            model.fit(X)
            
            if request.model == "dbscan":
                # Calculate cluster statistics for DBSCAN
                labels = model.labels_
                n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
                n_noise = list(labels).count(-1)
                
                return {
                    "model": request.model,
                    "clusters": n_clusters,
                    "noise_points": n_noise,
                    "predictions": model.labels_.tolist(),
                    "feature_importance": None
                }
            else:
                # Get cluster sizes
                labels = model.labels_
                unique_labels, counts = np.unique(labels, return_counts=True)
                cluster_sizes = {f"Cluster {label}": int(count) for label, count in zip(unique_labels, counts)}
                
                return {
                    "model": request.model,
                    "clusters": len(cluster_sizes),"cluster_sizes": cluster_sizes,
                    "predictions": model.labels_.tolist(),
                    "feature_importance": None
                }
        
        # Supervised learning models
        elif request.model in ["decision_tree", "random_forest", "svm", "logistic_regression", "gradient_boosting"]:
            if not request.y_column:
                raise HTTPException(status_code=400, detail="Target column (y_column) must be provided for supervised learning models.")
            
            # Get target variable
            y = df[request.y_column]
            
            # Convert categorical target to numeric if necessary
            if y.dtype == "object":
                le = LabelEncoder()
                y = le.fit_transform(y)
                class_names = le.classes_.tolist()
            else:
                class_names = sorted(y.unique().tolist())
            
            # Split data for training and testing
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=request.test_split, random_state=42
            )
            
            # Parameter handling
            params = request.params or {}
            
            # Initialize the appropriate model
            if request.model == "decision_tree":
                max_depth = params.get("max_depth", 10)
                criterion = params.get("criterion", "gini")
                model = DecisionTreeClassifier(max_depth=max_depth, criterion=criterion, random_state=42)
            elif request.model == "random_forest":
                n_estimators = params.get("n_estimators", 100)
                max_depth = params.get("max_depth", 10)
                model = RandomForestClassifier(n_estimators=n_estimators, max_depth=max_depth, random_state=42)
            elif request.model == "gradient_boosting":
                n_estimators = params.get("n_estimators", 100)
                learning_rate = params.get("learning_rate", 0.1)
                model = GradientBoostingClassifier(n_estimators=n_estimators, learning_rate=learning_rate, random_state=42)
            elif request.model == "svm":
                # Scale features for SVM
                scaler = StandardScaler()
                X_train_scaled = scaler.fit_transform(X_train)
                X_test_scaled = scaler.transform(X_test)
                
                kernel = params.get("kernel", "rbf")
                C = params.get("C", 1.0)
                gamma = params.get("gamma", "scale")
                
                model = SVC(kernel=kernel, C=C, gamma=gamma, probability=True, random_state=42)
                model.fit(X_train_scaled, y_train)
                y_pred = model.predict(X_test_scaled)
                
                # Calculate metrics
                accuracy = accuracy_score(y_test, y_pred)
                if len(np.unique(y)) > 2:  # Multi-class
                    precision = precision_score(y_test, y_pred, average='weighted')
                    recall = recall_score(y_test, y_pred, average='weighted')
                    f1 = f1_score(y_test, y_pred, average='weighted')
                else:  # Binary
                    precision = precision_score(y_test, y_pred)
                    recall = recall_score(y_test, y_pred)
                    f1 = f1_score(y_test, y_pred)
                
                # SVM doesn't have feature importance
                return {
                    "model": request.model,
                    "accuracy": float(accuracy),
                    "precision": float(precision),
                    "recall": float(recall),
                    "f1_score": float(f1),
                    "classes": class_names,
                    "feature_importance": None,
                    "test_predictions": y_pred.tolist(),
                    "full_predictions": model.predict(scaler.transform(X)).tolist()
                }
            elif request.model == "logistic_regression":
                # Scale features for logistic regression
                scaler = StandardScaler()
                X_train_scaled = scaler.fit_transform(X_train)
                X_test_scaled = scaler.transform(X_test)
                
                max_iter = params.get("max_iter", 500)
                C = params.get("C", 1.0)
                
                model = LogisticRegression(max_iter=max_iter, C=C, random_state=42)
                model.fit(X_train_scaled, y_train)
                y_pred = model.predict(X_test_scaled)
                
                # Calculate metrics
                accuracy = accuracy_score(y_test, y_pred)
                if len(np.unique(y)) > 2:  # Multi-class
                    precision = precision_score(y_test, y_pred, average='weighted')
                    recall = recall_score(y_test, y_pred, average='weighted')
                    f1 = f1_score(y_test, y_pred, average='weighted')
                else:  # Binary
                    precision = precision_score(y_test, y_pred)
                    recall = recall_score(y_test, y_pred)
                    f1 = f1_score(y_test, y_pred)
                
                # Get feature importance (coefficients)
                if len(np.unique(y)) <= 2:  # Binary classification
                    importance = model.coef_[0]
                else:  # Multi-class
                    importance = np.mean(np.abs(model.coef_), axis=0)
                
                feature_importance = {
                    feature: float(imp) for feature, imp in zip(request.x_columns, importance)
                }
                
                return {
                    "model": request.model,
                    "accuracy": float(accuracy),
                    "precision": float(precision),
                    "recall": float(recall),
                    "f1_score": float(f1),
                    "classes": class_names,
                    "feature_importance": feature_importance,
                    "test_predictions": y_pred.tolist(),
                    "full_predictions": model.predict(scaler.transform(X)).tolist()
                }
            
            # Train model
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            
            # Calculate metrics
            accuracy = accuracy_score(y_test, y_pred)
            if len(np.unique(y)) > 2:  # Multi-class
                precision = precision_score(y_test, y_pred, average='weighted')
                recall = recall_score(y_test, y_pred, average='weighted')
                f1 = f1_score(y_test, y_pred, average='weighted')
            else:  # Binary
                precision = precision_score(y_test, y_pred)
                recall = recall_score(y_test, y_pred)
                f1 = f1_score(y_test, y_pred)
            
            # Get feature importance
            importance = model.feature_importances_
            feature_importance = {
                feature: float(imp) for feature, imp in zip(request.x_columns, importance)
            }
            
            return {
                "model": request.model,
                "accuracy": float(accuracy),
                "precision": float(precision),
                "recall": float(recall),
                "f1_score": float(f1),
                "classes": class_names,
                "feature_importance": feature_importance,
                "test_predictions": y_pred.tolist(),
                "full_predictions": model.predict(X).tolist()
            }
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported model: {request.model}")
            
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during prediction: {str(e)}")

# API: Apply Data Transformations
@app.post("/transform")
async def transform(request: TransformationRequest, df: pd.DataFrame = Depends(get_dataset)):
    try:
        logger.info(f"Applying transformation: {request.transformation} to column: {request.column}")
        
        if request.column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column '{request.column}' not found in dataset.")
        
        params = request.params or {}
        original_column = df[request.column].copy()
        
        if request.transformation == "normalize":
            # Z-score normalization
            if pd.api.types.is_numeric_dtype(df[request.column]):
                df[request.column] = (df[request.column] - df[request.column].mean()) / df[request.column].std()
            else:
                raise HTTPException(status_code=400, detail="Normalization requires a numeric column.")
                
        elif request.transformation == "scale":
            # Min-max scaling
            if pd.api.types.is_numeric_dtype(df[request.column]):
                min_val = params.get("min", 0)
                max_val = params.get("max", 1)
                scaler = MinMaxScaler(feature_range=(min_val, max_val))
                df[request.column] = scaler.fit_transform(df[request.column].values.reshape(-1, 1))
            else:
                raise HTTPException(status_code=400, detail="Scaling requires a numeric column.")
                
        elif request.transformation == "log":
            # Log transformation
            if pd.api.types.is_numeric_dtype(df[request.column]):
                # Handle zero and negative values
                offset = params.get("offset", 1)
                if (df[request.column] <= 0).any():
                    min_val = df[request.column].min()
                    if min_val < 0:
                        offset = abs(min_val) + offset
                    df[request.column] = np.log(df[request.column] + offset)
                else:
                    df[request.column] = np.log(df[request.column])
            else:
                raise HTTPException(status_code=400, detail="Log transformation requires a numeric column.")
                
        elif request.transformation == "one_hot_encode":
            # One-hot encoding for categorical columns
            if not pd.api.types.is_numeric_dtype(df[request.column]) or df[request.column].nunique() < 10:
                # Get one-hot encoded columns
                one_hot = pd.get_dummies(df[request.column], prefix=request.column)
                
                # Drop original column and join one-hot encoded columns
                df = df.drop(request.column, axis=1)
                df = pd.concat([df, one_hot], axis=1)
                
                # Update global dataset store
                dataset_store["df"] = df
                dataset_store["headers"] = list(df.columns)
                
                return {
                    "message": f"One-hot encoding applied to {request.column}",
                    "new_columns": list(one_hot.columns)
                }
            else:
                raise HTTPException(
                    status_code=400, 
                    detail="One-hot encoding is best for categorical columns with few unique values."
                )
                
        elif request.transformation == "binning":
            # Bin continuous data into discrete intervals
            if pd.api.types.is_numeric_dtype(df[request.column]):
                bins = params.get("bins", 5)
                labels = params.get("labels", None)
                strategy = params.get("strategy", "uniform")
                
                if strategy == "uniform":
                    df[f"{request.column}_binned"] = pd.cut(
                        df[request.column], bins=bins, labels=labels
                    )
                elif strategy == "quantile":
                    df[f"{request.column}_binned"] = pd.qcut(
                        df[request.column], q=bins, labels=labels
                    )
                else:
                    raise HTTPException(status_code=400, detail=f"Unsupported binning strategy: {strategy}")
                
                # Update global dataset store
                dataset_store["df"] = df
                dataset_store["headers"] = list(df.columns)
                
                return {
                    "message": f"Binning applied to {request.column}",
                    "new_column": f"{request.column}_binned"
                }
            else:
                raise HTTPException(status_code=400, detail="Binning requires a numeric column.")
                
        elif request.transformation == "fillna":
            # Fill NA/null values
            strategy = params.get("strategy", "mean")
            custom_value = params.get("value", None)
            
            if strategy == "mean" and pd.api.types.is_numeric_dtype(df[request.column]):
                df[request.column] = df[request.column].fillna(df[request.column].mean())
            elif strategy == "median" and pd.api.types.is_numeric_dtype(df[request.column]):
                df[request.column] = df[request.column].fillna(df[request.column].median())
            elif strategy == "mode":
                df[request.column] = df[request.column].fillna(df[request.column].mode()[0])
            elif strategy == "custom" and custom_value is not None:
                df[request.column] = df[request.column].fillna(custom_value)
            else:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid fill strategy: {strategy} for column type {df[request.column].dtype}"
                )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported transformation: {request.transformation}")
        
        # Update global dataset
        dataset_store["df"] = df
        
        # Calculate summary stats for numeric columns
        if pd.api.types.is_numeric_dtype(df[request.column]):
            stats = {
                "mean_before": float(original_column.mean()) if not pd.isna(original_column.mean()) else None,
                "mean_after": float(df[request.column].mean()) if not pd.isna(df[request.column].mean()) else None,
                "std_before": float(original_column.std()) if not pd.isna(original_column.std()) else None,
                "std_after": float(df[request.column].std()) if not pd.isna(df[request.column].std()) else None,
                "min_before": float(original_column.min()) if not pd.isna(original_column.min()) else None,
                "min_after": float(df[request.column].min()) if not pd.isna(df[request.column].min()) else None,
                "max_before": float(original_column.max()) if not pd.isna(original_column.max()) else None,
                "max_after": float(df[request.column].max()) if not pd.isna(df[request.column].max()) else None
            }
        else:
            stats = None
            
        return {
            "message": f"{request.transformation} applied to {request.column}",
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"Error during transformation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during transformation: {str(e)}")

# API: Calculate correlations
@app.post("/correlations")
async def correlations(request: CorrelationRequest, df: pd.DataFrame = Depends(get_dataset)):
    try:
        logger.info(f"Calculating correlations with method: {request.method}")
        
        # Validate columns
        if any(col not in df.columns for col in request.columns):
            missing_cols = [col for col in request.columns if col not in df.columns]
            raise HTTPException(status_code=400, detail=f"Columns not found: {', '.join(missing_cols)}")
            
        # Filter to only the requested columns
        subset = df[request.columns]
        
        # Check if all columns are numeric
        non_numeric = [col for col in request.columns if not pd.api.types.is_numeric_dtype(subset[col])]
        if non_numeric:
            raise HTTPException(
                status_code=400, 
                detail=f"Correlation requires numeric columns. Non-numeric columns: {', '.join(non_numeric)}"
            )
            
        # Calculate correlation matrix
        corr_matrix = subset.corr(method=request.method)
        
        # Convert to matrix format for visualization
        matrix_data = []
        for idx, row in enumerate(request.columns):
            for col in request.columns:
                matrix_data.append({
                    "row": row,
                    "col": col,
                    "value": float(corr_matrix.loc[row, col])
                })
                
        # Convert to pairs format (for table view)
        pairs_data = []
        for i, col1 in enumerate(request.columns):
            for j, col2 in enumerate(request.columns):
                if i < j:  # Only include each pair once
                    pairs_data.append({
                        "variable1": col1,
                        "variable2": col2,
                        "correlation": float(corr_matrix.loc[col1, col2])
                    })
                    
        return {
            "method": request.method,
            "matrix": matrix_data,
            "pairs": pairs_data
        }
    
    except Exception as e:
        logger.error(f"Error calculating correlations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error calculating correlations: {str(e)}")

# API: Get summary statistics
@app.get("/statistics")
async def statistics(
    columns: Optional[List[str]] = None,
    df: pd.DataFrame = Depends(get_dataset)
):
    try:
        logger.info("Calculating summary statistics")
        
        # Use all columns if none specified
        if not columns:
            columns = list(df.columns)
        else:
            # Validate columns
            if any(col not in df.columns for col in columns):
                missing_cols = [col for col in columns if col not in df.columns]
                raise HTTPException(status_code=400, detail=f"Columns not found: {', '.join(missing_cols)}")
                
        # Filter to only numeric columns
        numeric_columns = [col for col in columns if pd.api.types.is_numeric_dtype(df[col])]
        
        # Calculate statistics for numeric columns
        stats_data = []
        for col in numeric_columns:
            stats = {
                "column": col,
                "mean": float(df[col].mean()) if not pd.isna(df[col].mean()) else None,
                "median": float(df[col].median()) if not pd.isna(df[col].median()) else None,
                "std": float(df[col].std()) if not pd.isna(df[col].std()) else None,
                "min": float(df[col].min()) if not pd.isna(df[col].min()) else None,
                "max": float(df[col].max()) if not pd.isna(df[col].max()) else None,
                "count": int(df[col].count()),
                "null_count": int(df[col].isna().sum()),
                "unique_count": int(df[col].nunique())
            }
            
            # Add quantiles
            quantiles = df[col].quantile([0.25, 0.5, 0.75]).to_dict()
            stats["q1"] = float(quantiles[0.25]) if not pd.isna(quantiles[0.25]) else None
            stats["q2"] = float(quantiles[0.5]) if not pd.isna(quantiles[0.5]) else None
            stats["q3"] = float(quantiles[0.75]) if not pd.isna(quantiles[0.75]) else None
            
            stats_data.append(stats)
            
        # For categorical columns, get counts and frequencies
        categorical_columns = [col for col in columns if col not in numeric_columns]
        categorical_stats = []
        
        for col in categorical_columns:
            value_counts = df[col].value_counts().reset_index()
            value_counts.columns = ['value', 'count']
            value_counts['percentage'] = value_counts['count'] / value_counts['count'].sum() * 100
            
            cat_stats = {
                "column": col,
                "unique_count": int(df[col].nunique()),
                "null_count": int(df[col].isna().sum()),
                "most_common": value_counts.iloc[0]['value'] if not value_counts.empty else None,
                "most_common_count": int(value_counts.iloc[0]['count']) if not value_counts.empty else 0,
                "most_common_percentage": float(value_counts.iloc[0]['percentage']) if not value_counts.empty else 0,
                "value_counts": value_counts.to_dict(orient='records')
            }
            categorical_stats.append(cat_stats)
            
        return {
            "numeric_stats": stats_data,
            "categorical_stats": categorical_stats
        }
        
    except Exception as e:
        logger.error(f"Error calculating statistics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error calculating statistics: {str(e)}")

# Run server with uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)