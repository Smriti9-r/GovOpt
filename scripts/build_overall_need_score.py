
import pandas as pd
from pathlib import Path

# --------------------------------------------------
# GOVOPT: OVERALL DISTRICT NEED SCORING
# --------------------------------------------------

BASE = Path(__file__).resolve().parent.parent

sector_file = BASE / "data" / "GovOpt_Sector_Balanced_Need_Scores.csv"
healthcare_file = BASE / "outputs" / "healthcare_district_scores.csv"
output_file = BASE / "outputs" / "overall_district_need_scores.csv"

# Sector weights
EDUCATION_WEIGHT = 33.33
WATER_WEIGHT = 33.33
HEALTHCARE_WEIGHT = 33.34

# --------------------------------------------------
# 1. LOAD EXISTING SCORES
# --------------------------------------------------

sector = pd.read_csv(sector_file)
healthcare = pd.read_csv(healthcare_file)

# Recover original 0-100 sector scores.
# Existing file stores Education and Water at 50% each.
sector["education_need_score"] = (
    sector["education_weighted"] / 0.50
)

sector["water_need_score"] = (
    sector["water_weighted"] / 0.50
)

# Keep only required columns
sector = sector[
    ["district", "education_need_score", "water_need_score"]
]

healthcare = healthcare[
    ["district", "healthcare_need_score"]
]

# --------------------------------------------------
# 2. MERGE ALL THREE SECTORS
# --------------------------------------------------

df = sector.merge(
    healthcare,
    on="district",
    how="inner",
    validate="one_to_one"
)

if len(df) != 13:
    raise ValueError("Expected exactly 13 districts after merging.")

if df["district"].nunique() != 13:
    raise ValueError("Duplicate district records found.")

if df.isna().any().any():
    raise ValueError("Missing sector scores found.")

# --------------------------------------------------
# 3. CALCULATE OVERALL NEED SCORE
# --------------------------------------------------

df["overall_need_score"] = (
    df["education_need_score"] * EDUCATION_WEIGHT / 100
    + df["water_need_score"] * WATER_WEIGHT / 100
    + df["healthcare_need_score"] * HEALTHCARE_WEIGHT / 100
)

# Rank highest need first
df["overall_priority_rank"] = (
    df["overall_need_score"]
    .rank(ascending=False, method="min")
    .astype(int)
)

# --------------------------------------------------
# 4. EXPORT RESULTS
# --------------------------------------------------

df = df.sort_values("overall_priority_rank")

columns = [
    "district",
    "education_need_score",
    "water_need_score",
    "healthcare_need_score",
    "overall_need_score",
    "overall_priority_rank"
]

result = df[columns]

result.to_csv(output_file, index=False)

# --------------------------------------------------
# 5. DISPLAY SUMMARY
# --------------------------------------------------

print("\nGOVOPT OVERALL NEED SCORING COMPLETED")
print("=" * 75)

print("\nSector weights:")
print(f"Education : {EDUCATION_WEIGHT}%")
print(f"Water     : {WATER_WEIGHT}%")
print(f"Healthcare: {HEALTHCARE_WEIGHT}%")

print("\nDistrict priority ranking:")
print(result.round(2).to_string(index=False))

print("\nSaved to:", output_file)
print("Districts ranked:", len(result))
print("Highest overall need:", result.iloc[0]["district"])
