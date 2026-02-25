from .step01_load_data import stu, sch
from IPython.display import display

print("Student data:")
display(stu.head())
stu.info()

print("\nSchool data:")
display(sch.head())
sch.info()