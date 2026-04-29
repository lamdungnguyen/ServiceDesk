from typing import Dict, List
import numpy as np
import xgboost as xgb

print("Training In-Memory XGBoost Performance Model...")
X_train = np.random.rand(100, 4) * 100
# Linear relationship with some noise, to mimic HR dataset
y_train = 0.45 * X_train[:, 0] + 0.2 * X_train[:, 1] + 0.2 * X_train[:, 2] + 0.15 * X_train[:, 3] + np.random.randn(100) * 2

model = xgb.XGBRegressor(n_estimators=10, max_depth=3, random_state=42)
model.fit(X_train, y_train)

def predict_effectiveness(features: Dict[str, float]) -> Dict[str, object]:
    kpi = features.get("kpiScore", 0)
    sentiment = features.get("sentimentScore", 0) * 100
    resolution = features.get("resolutionScore", 0)
    communication = features.get("communicationScore", 0)
    
    # Predict using XGBoost
    x_input = np.array([[kpi, sentiment, resolution, communication]])
    predicted = float(model.predict(x_input)[0])
    predicted = round(max(0, min(100, predicted)), 2)

    if predicted < 55:
        risk = "high"
    elif predicted < 75:
        risk = "medium"
    else:
        risk = "low"

    factors: List[Dict[str, float]] = [
        {"name": "kpiScore", "impact": round(0.45 * kpi / 100, 3)},
        {"name": "sentimentScore", "impact": round(0.2 * sentiment / 100, 3)},
        {"name": "resolutionScore", "impact": round(0.2 * resolution / 100, 3)},
        {"name": "communicationScore", "impact": round(0.15 * communication / 100, 3)},
    ]

    return {
        "predictedEffectiveness": predicted,
        "riskLevel": risk,
        "factors": factors,
    }
