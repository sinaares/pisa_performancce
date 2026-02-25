from .step06_split import X_train, X_valid, y_train, y_valid
from .step07_train_ridge import num_features
from xgboost import XGBRegressor
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import numpy as np

preprocess_xgb = ColumnTransformer(
    transformers=[
        ("num", SimpleImputer(strategy="median"), num_features),
    ],
    remainder="drop"
)

xgb_model = XGBRegressor(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="reg:squarederror",
    tree_method="hist",
    n_jobs=-1,
    random_state=42,
)

xgb_pipe = Pipeline(steps=[
    ("prep", preprocess_xgb),
    ("model", xgb_model),
])

xgb_pipe.fit(X_train, y_train)

y_pred_xgb = xgb_pipe.predict(X_valid)

r2_xgb  = xgb_pipe.score(X_valid, y_valid)
mae_xgb = mean_absolute_error(y_valid, y_pred_xgb)
mse_xgb = mean_squared_error(y_valid, y_pred_xgb)
rmse_xgb = np.sqrt(mse_xgb)

print("XGBoost performance:")
print(f"R²:   {r2_xgb:.3f}")
print(f"MAE:  {mae_xgb:.2f}")
print(f"RMSE: {rmse_xgb:.2f}")