PISA Performance Project (PyCharm + UI/DB-ready)
================================================

This project is a refactor of a Jupyter Notebook into a clean Python package structure so you can later add:
- UI (Streamlit / FastAPI / PyQt)
- Database (SQLite/PostgreSQL)
- Model saving/loading, prediction history, etc.

IMPORTANT:
- The notebook logic/order is preserved.
- The code is split into step files (step00_..., step01_..., ...).
- Make sure your package init files are named: __init__.py (NOT init.py)

------------------------------------------------------------
1) Project Structure
------------------------------------------------------------

pisa-performance/
  data/
    raw/                     (input data .sav or .parquet goes here)
    processed/               (optional)
  notebooks/
    bitirme_demo2.ipynb      (original notebook for reference)
  models/                    (optional saved models)
  outputs/                   (optional reports/figures)
  src/
    pisa_app/
      __init__.py
      ml/
        __init__.py
        run_pipeline.py              (runs the full pipeline)
        convert_sav_to_parquet.py    (converts .sav -> .parquet)
        step00_setup.py
        step01_load_data.py
        step02_quick_eda.py
        step03_merge.py
        step04_feature_groups.py
        step05_build_xy.py
        step06_split.py
        step07_train_ridge.py
        step08_train_xgb.py
        step09_shap_values.py
        step10_shap_plots.py
  requirements.txt
  .gitignore
  README.txt

------------------------------------------------------------
2) Python Version
------------------------------------------------------------

Recommended Python: 3.11 or 3.12
(Using very new versions like 3.14 can break packages like xgboost/shap/pyreadstat.)

------------------------------------------------------------
3) Setup Virtual Environment (Windows PowerShell)
------------------------------------------------------------

Open PowerShell in the project root folder (pisa-performance/) and run:

  py -3.11 -m venv .venv
  .\.venv\Scripts\Activate.ps1
  python -m pip install -U pip setuptools wheel
  pip install -r requirements.txt

Check that you are using the venv:

  where python
  python --version

You should see something like:
  ...\pisa-performance\.venv\Scripts\python.exe

------------------------------------------------------------
4) PyCharm Setup (Important)
------------------------------------------------------------

A) Select interpreter:
   Settings -> Project -> Python Interpreter
   Choose: pisa-performance\.venv\Scripts\python.exe

B) Mark src as Sources Root:
   Right click "src" -> Mark Directory as -> Sources Root

C) Ensure package init files are correct:
   src\pisa_app\__init__.py
   src\pisa_app\ml\__init__.py

------------------------------------------------------------
5) Data Files
------------------------------------------------------------

This project uses PISA student and school questionnaire data.

Option A (Recommended): Start from .sav files
---------------------------------------------
Place these files in:

  data/raw/CY08MSP_STU_QQQ.sav
  data/raw/CY08MSP_SCH_QQQ.sav

Convert them (one time):

  python src\pisa_app\ml\convert_sav_to_parquet.py

After conversion you will have:

  data/raw/CY08MSP_STU_QQQ.parquet
  data/raw/CY08MSP_SCH_QQQ.parquet

Option B: If you already have .parquet
--------------------------------------
Place directly:

  data/raw/CY08MSP_STU_QQQ.parquet
  data/raw/CY08MSP_SCH_QQQ.parquet

Quick check:

  dir data\raw

------------------------------------------------------------
6) Run the Full Pipeline (All steps)
------------------------------------------------------------

Run from the project root:

PowerShell:

  $env:PYTHONPATH="src"
  python -m pisa_app.ml.run_pipeline

Success looks like:
- Merge/feature selection logs
- Ridge metrics (R², MAE, RMSE)
- XGBoost metrics
- SHAP computations
- Plots (depending on your PyCharm settings)

------------------------------------------------------------
7) Run in PyCharm (One-click)
------------------------------------------------------------

Run -> Edit Configurations -> + -> Python

Choose: "Module name"

  Module name: pisa_app.ml.run_pipeline
  Working directory: C:\Users\<your_user>\PycharmProjects\pisa-performance
  Environment variables: PYTHONPATH=src

Press Run.

------------------------------------------------------------
8) Common Errors and Fixes
------------------------------------------------------------

A) "attempted relative import with no known parent package"
   Fix: run as module:
     $env:PYTHONPATH="src"
     python -m pisa_app.ml.run_pipeline

B) "FileNotFoundError data\raw\...parquet"
   Fix: confirm files exist:
     dir data\raw
   Make sure filenames match exactly.

C) "ModuleNotFoundError: pyreadstat / pyarrow / xgboost / shap"
   Fix:
     pip install pyreadstat pyarrow xgboost shap

D) Plots not showing in PyCharm
   Try enabling Scientific Mode in PyCharm or add plt.show() where needed.

E) SHAP too slow / memory issues
   Reduce sample size in step09_shap_values.py:
     X_valid_sample = X_valid.sample(500, random_state=42)

------------------------------------------------------------
9) Next Steps (UI + Database)
------------------------------------------------------------

Now that the pipeline runs, recommended next steps:
1) Save trained models to models/ (joblib)
2) Create a predict_api.py wrapper so UI can call one function
3) Add SQLite database to store predictions and inputs
4) Build UI (Streamlit is fastest)

Example future commands:
  python -m pisa_app.ml.run_pipeline
  streamlit run src\pisa_app\ui\app.py