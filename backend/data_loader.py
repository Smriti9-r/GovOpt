from pathlib import Path

import pandas as pd


# Locate the project's data folder
DATA_DIR = Path(__file__).resolve().parent.parent / "data"

DISTRICT_FILE = DATA_DIR / "Population_Integrated_Analysis.csv"

ALLOCATION_FILE = DATA_DIR / "GovOpt_Final_Allocation_Comparison.csv"


def load_district_data():

    if not DISTRICT_FILE.exists():
        raise FileNotFoundError(f"District dataset not found: {DISTRICT_FILE}")

    df = pd.read_csv(DISTRICT_FILE)

    if "district" not in df.columns:
        raise ValueError("District column is missing.")

    if df["district"].duplicated().any():
        raise ValueError("Duplicate districts found.")

    return df


def load_allocation_data(district_data):

    if not ALLOCATION_FILE.exists():
        raise FileNotFoundError(f"Allocation dataset not found: {ALLOCATION_FILE}")

    df = pd.read_csv(ALLOCATION_FILE)

    required_columns = [
        "district",
        "equal_allocation_crore",
        "need_based_allocation_crore",
        "minimum_guarantee_allocation_crore"
    ]

    for column in required_columns:
        if column not in df.columns:
            raise ValueError(f"Missing allocation column: {column}")

    allocation_columns = required_columns[1:]

    if df["district"].duplicated().any():
        raise ValueError("Duplicate districts in allocation data.")

    if df[required_columns].isnull().any().any():
        raise ValueError("Missing allocation values.")

    if (df[allocation_columns] < 0).any().any():
        raise ValueError("Negative allocations detected.")

    if set(df["district"]) != set(district_data["district"]):
        raise ValueError("Districts do not match.")

    for column in allocation_columns:
        if abs(df[column].sum() - 500) >= 0.01:
            raise ValueError(f"Budget validation failed: {column}")

    return df