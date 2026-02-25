import pyreadstat
from pathlib import Path

RAW = Path("data/raw")

def convert(sav_filename: str, parquet_filename: str):
    sav_path = RAW / sav_filename
    out_path = RAW / parquet_filename

    if not sav_path.exists():
        raise FileNotFoundError(f"Missing file: {sav_path.resolve()}")

    df, meta = pyreadstat.read_sav(str(sav_path))
    print(f"Loaded {sav_path} shape={df.shape}")

    df.to_parquet(out_path, index=False)
    print(f"Saved  {out_path}")

if __name__ == "__main__":
    convert("CY08MSP_STU_QQQ.sav", "CY08MSP_STU_QQQ.parquet")
    convert("CY08MSP_SCH_QQQ.sav", "CY08MSP_SCH_QQQ.parquet")