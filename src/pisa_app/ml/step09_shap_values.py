from .step06_split import X_valid
from .step08_train_xgb import xgb_pipe
from .step07_train_ridge import num_features
import shap
import numpy as np
import pandas as pd

shap.initjs()  # for nice JS plots in notebook

# 1) Take a smaller sample for SHAP (faster, avoids RAM issues)
X_valid_sample = X_valid.sample(2000, random_state=42)  # you can change size
X_valid_prep = xgb_pipe.named_steps["prep"].transform(X_valid_sample)

# Make a DataFrame so SHAP knows feature names
X_valid_prep_df = pd.DataFrame(X_valid_prep, columns=num_features)

# 2) Get the trained XGBoost model from the pipeline
xgb_model = xgb_pipe.named_steps["model"]

# 3) Build the SHAP explainer for the tree model
explainer = shap.TreeExplainer(xgb_model)

# 4) Compute SHAP values for the sample
shap_values = explainer(X_valid_prep_df)