from .step06_split import X_train, X_valid, y_train, y_valid
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error
import numpy as np

# All our selected features are numeric
num_features = X_train.columns.tolist()

# Preprocessing: impute + scale
preprocess = ColumnTransformer(
    transformers=[
        ("num", Pipeline(steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler())
        ]), num_features),
    ],
    remainder="drop"
)

# Ridge regression model
model = Ridge(alpha=1.0, random_state=42)

# Full pipeline
pipe = Pipeline(steps=[
    ("prep", preprocess),
    ("model", model)
])

# Fit model
pipe.fit(X_train, y_train)

# Predict on validation set
y_pred = pipe.predict(X_valid)

r2  = pipe.score(X_valid, y_valid)
mae = mean_absolute_error(y_valid, y_pred)

mse = mean_squared_error(y_valid, y_pred)  # no 'squared' argument
rmse = np.sqrt(mse)

print(f"R²:   {r2:.3f}")
print(f"MAE:  {mae:.2f}")
print(f"RMSE: {rmse:.2f}")