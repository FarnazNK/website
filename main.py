from fastapi import FastAPI, UploadFile, File, HTTPException
import pandas as pd
import numpy as np
import io
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN
from pydantic import BaseModel

app = FastAPI()

# Store dataset globally
dataset = {"headers": [], "df": None}


# API: Upload Dataset
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    global dataset

    if file.filename.endswith(".csv"):
        df = pd.read_csv(io.BytesIO(await file.read()))
    elif file.filename.endswith(".xlsx") or file.filename.endswith(".xls"):
        df = pd.read_excel(io.BytesIO(await file.read()))
    else:
        raise HTTPException(status_code=400, detail="Invalid file format. Only CSV and Excel are supported.")

    dataset["headers"] = list(df.columns)
    dataset["df"] = df

    return {"message": "File uploaded successfully", "headers": dataset["headers"], "row_count": len(df)}


# API: Get Dataset Headers
@app.get("/get_headers")
async def get_headers():
    global dataset
    if dataset["df"] is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")
    return {"headers": dataset["headers"]}


# Request Model for Predictions
class PredictionRequest(BaseModel):
    x_columns: list  # List of input features
    y_column: str  # Target variable
    model: str  # Model name


# API: Perform Predictions
@app.post("/predict")
async def predict(request: PredictionRequest):
    global dataset
    if dataset["df"] is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")

    df = dataset["df"]

    # Validate columns
    if any(col not in df.columns for col in request.x_columns + [request.y_column]):
        raise HTTPException(status_code=400, detail="Invalid column names.")

    X = df[request.x_columns]
    y = df[request.y_column]

    # Convert categorical target values to numeric if necessary
    if y.dtype == "object":
        le = LabelEncoder()
        y = le.fit_transform(y)

    model = None
    predictions = None

    if request.model == "decision_tree":
        model = DecisionTreeClassifier(max_depth=10, criterion="gini").fit(X, y)
    elif request.model == "random_forest":
        model = RandomForestClassifier(n_estimators=100, max_depth=10).fit(X, y)
    elif request.model == "svm":
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        model = SVC(kernel="rbf", C=1.0, gamma="scale").fit(X_scaled, y)
    elif request.model == "logistic_regression":
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        model = LogisticRegression(max_iter=500).fit(X_scaled, y)
    elif request.model == "kmeans":
        model = KMeans(n_clusters=3, n_init=10).fit(X)
        return {"predictions": model.labels_.tolist()}
    elif request.model == "hierarchical":
        model = AgglomerativeClustering(n_clusters=3).fit(X)
        return {"predictions": model.labels_.tolist()}
    elif request.model == "dbscan":
        model = DBSCAN(eps=0.5, min_samples=5).fit(X)
        return {"predictions": model.labels_.tolist()}
    else:
        raise HTTPException(status_code=400, detail="Invalid model name.")

    predictions = model.predict(X).tolist()
    return {"predictions": predictions}


# API: Apply Data Transformations
class TransformationRequest(BaseModel):
    column: str
    transformation: str


@app.post("/transform")
async def transform(request: TransformationRequest):
    global dataset
    if dataset["df"] is None:
        raise HTTPException(status_code=400, detail="No dataset loaded.")

    df = dataset["df"]
    column = request.column

    if column not in df.columns:
        raise HTTPException(status_code=400, detail="Column not found.")

    if request.transformation == "normalize":
        df[column] = (df[column] - df[column].mean()) / df[column].std()
    elif request.transformation == "scale":
        df[column] = (df[column] - df[column].min()) / (df[column].max() - df[column].min())
    elif request.transformation == "log":
        df[column] = np.log(df[column] + 1)
    else:
        raise HTTPException(status_code=400, detail="Invalid transformation type.")

    return {"message": f"{request.transformation} applied to {column}"}
