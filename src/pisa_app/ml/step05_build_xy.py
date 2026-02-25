from .step03_merge import df
from .step04_feature_groups import selected_features

# Feature matrix
X = df[selected_features].copy()

# Target: average of PV1MATH ... PV10MATH
math_pv_cols = [f"PV{i}MATH" for i in range(1, 11) if f"PV{i}MATH" in df.columns]
print("Math plausible value columns:", math_pv_cols)

y_math = df[math_pv_cols].mean(axis=1).rename("math_score")

X.shape, y_math.shape