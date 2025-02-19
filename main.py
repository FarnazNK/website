from fastapi import FastAPI, UploadFile, File, HTTPException
import pandas as pd
import numpy as np
import io
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from sklearn.metrics import accuracy_score, classification_report
from pydantic import BaseModel

app = FastAPI()

# Store dataset in memory
dataset = {"headers": [], "rows": [], "df": None}

# API to Upload Data File
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    global dataset

    if file.filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(await file.read()))
    elif file.filename.endswith(".xlsx") or file.filename.endswith(".xls"):
        df = pd.read_excel(io.BytesIO(await file.read()))
    else:
        raise HTTPException(status_code=400, detail="Invalid file format. Only CSV and Excel are supported.")

    # Store the dataset in memory
    dataset["headers"] = list(df.columns)
    dataset["rows"] = df.fillna("").values.tolist()
    dataset["df"] = df  # Save DataFrame for later processing

    return {"message": "File uploaded successfully", "headers": dataset["headers"], "row_count": len(dataset["rows"])}


# Define request model for predictions
class ModelRequest(BaseModel):
    x_columns: list  # List of feature column names
    y_column: str  # Target column name
    model: str  # Model name
    test_size: float = 0.2  # Default test size for splitting
    random_state: int = 42  # Default random state for reproducibility

# API to Perform Predictions
@app.post("/predict")
async def predict(request: ModelRequest):
    global dataset
    if not dataset["df"] is not None:
        raise HTTPException(status_code=400, detail="No dataset loaded. Please upload a file first.")

    df = dataset["df"]

    # Check if provided columns exist
    if any(col not in df.columns for col in request.x_columns + [request.y_column]):
        raise HTTPException(status_code=400, detail="One or more specified columns do not exist in the dataset.")

    # Extract Features (X) and Target (y)
    X = df[request.x_columns]
    y = df[request.y_column]

    # Convert categorical target values to numeric if necessary
    if y.dtype == "object":
        le = LabelEncoder()
        y = le.fit_transform(y)

    # Split dataset into train/test sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=request.test_size, random_state=request.random_state)

    model = None
    predictions = None
    report = None  # Store classification or regression report

    # Apply Model Training and Prediction
    if request.model == "decision_tree":
        model = DecisionTreeClassifier(max_depth=10, criterion="gini", random_state=request.random_state)
        model.fit(X_train, y_train)
        predictions = model.predict(X_test)
        report = classification_report(y_test, predictions)

    elif request.model == "random_forest":
        model = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=request.random_state)
        model.fit(X_train, y_train)
        predictions = model.predict(X_test)
        report = classification_report(y_test, predictions)

    elif request.model == "svm":
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        model = SVC(kernel="rbf", C=1.0, gamma="scale", probability=True, random_state=request.random_state)
        model.fit(X_train_scaled, y_train)
        predictions = model.predict(X_test_scaled)
        report = classification_report(y_test, predictions)

    elif request.model == "logistic_regression":
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        model = LogisticRegression(max_iter=500, random_state=request.random_state)
        model.fit(X_train_scaled, y_train)
        predictions = model.predict(X_test_scaled)
        report = classification_report(y_test, predictions)

    elif request.model == "kmeans":
        model = KMeans(n_clusters=3, random_state=request.random_state, n_init=10)
        model.fit(X)
        predictions = model.labels_
        report = {"Clusters": np.unique(predictions).tolist()}

    elif request.model == "hierarchical":
        model = AgglomerativeClustering(n_clusters=3)
        predictions = model.fit_predict(X)
        report = {"Clusters": np.unique(predictions).tolist()}

    elif request.model == "dbscan":
        model = DBSCAN(eps=0.5, min_samples=5)
        predictions = model.fit_predict(X)
        report = {"Clusters": np.unique(predictions).tolist()}

    else:
        raise HTTPException(status_code=400, detail="Invalid model name.")

    # Compute Accuracy (for classification models)
    accuracy = accuracy_score(y_test, predictions) if "accuracy_score" in locals() else None

    return {
        "model": request.model,
        "accuracy": accuracy,
        "report": report,
        "predictions": predictions.tolist(),
    }


# API to Get Dataset Headers
@app.get("/get_headers")
async def get_headers():
    global dataset
    if not dataset["headers"]:
        raise HTTPException(status_code=400, detail="No dataset loaded. Please upload a file first.")
    return {"headers": dataset["headers"]}

