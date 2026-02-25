from .step00_setup import *

# Load student and school datasets
stu = pd.read_parquet(stu_path)   # student questionnaire
sch = pd.read_parquet(sch_path)   # school questionnaire