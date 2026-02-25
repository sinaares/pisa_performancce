from .step09_shap_values import shap_values, X_valid_prep_df, num_features, explainer
import shap

# Global importance: bar plot (mean |SHAP| per feature)
shap.plots.bar(shap_values, max_display=20)

# Beeswarm summary plot (shows direction & distribution)
shap.summary_plot(shap_values.values, X_valid_prep_df, feature_names=num_features, max_display=20)

# Pick one student
i = 0  # change to inspect different students

student_features = X_valid_prep_df.iloc[i]
student_shap = shap_values[i]

# Waterfall plot (nice local explanation)
shap.plots.waterfall(student_shap)

shap.force_plot(
    explainer.expected_value,
    student_shap.values,
    student_features,
    matplotlib=True
)