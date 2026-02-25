from .step05_build_xy import X, y_math
from sklearn.model_selection import train_test_split

# 1. Drop rows with missing target
mask = ~y_math.isna()
X_clean = X.loc[mask].copy()
y_clean = y_math.loc[mask].copy()

print("After dropping missing targets:", X_clean.shape, y_clean.shape)

# 2. Train/validation split (80% / 20%)
X_train, X_valid, y_train, y_valid = train_test_split(
    X_clean, y_clean,
    test_size=0.2,
    random_state=42
)

X_train.shape, X_valid.shape