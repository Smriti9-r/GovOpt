
import pandas as pd
from pathlib import Path

# --------------------------------------------------
# GOVOPT: HEALTHCARE NEED SCORING MODEL
# --------------------------------------------------

BASE = Path(__file__).resolve().parent.parent

healthcare_file = BASE / "data" / "Healthcare_Master.csv"
population_file = BASE / "data" / "Population_Integrated_Analysis.csv"
maternal_file = BASE / "outputs" / "maternal_delivery_rates.csv"
output_file = BASE / "outputs" / "healthcare_district_scores.csv"

# Load datasets
health = pd.read_csv(healthcare_file)
population = pd.read_csv(population_file)
maternal = pd.read_csv(maternal_file)

# Merge district population
df = health.merge(
    population[["district", "total_population"]],
    on="district",
    how="left",
    validate="one_to_one"
)

# Merge maternal delivery rates
df = df.merge(
    maternal[["district", "non_sba_share_pct"]],
    on="district",
    how="left",
    validate="one_to_one"
)

# --------------------------------------------------
# 1. VALIDATE INPUT DATA
# --------------------------------------------------

if len(df) != 13:
    raise ValueError("Expected exactly 13 Uttarakhand districts.")

if df["total_population"].isna().any():
    raise ValueError("Missing district population values.")

if df["non_sba_share_pct"].isna().any():
    raise ValueError("Missing maternal delivery rates.")

# --------------------------------------------------
# 2. CALCULATE INDICATOR RATES
# --------------------------------------------------

births = (
    df["Live Birth - Female"]
    + df["Live Birth - Male"]
)

df["early_anc_coverage_pct"] = (
    100
    * df["Out of the total ANC registered, number registered within 1st trimester (within 12 weeks)"]
    / df["Total number of pregnant women registered for ANC"]
)

df["low_birth_weight_pct"] = (
    100
    * df["Number of newborns having weight less than 2.5 kg"]
    / df["Number of newborns weighed at birth"]
)

df["preterm_birth_pct"] = (
    100
    * df["Number of Pre term newborns (< 37 weeks of pregnancy)"]
    / births
)

df["diarrhoea_per_100k"] = (
    100000
    * df["Inpatient - Diarrhea with dehydration"]
    / df["total_population"]
)

df["tuberculosis_per_100k"] = (
    100000
    * df["Inpatient - Tuberculosis"]
    / df["total_population"]
)

# --------------------------------------------------
# 3. NORMALISE INDICATORS TO 0-100
# --------------------------------------------------

def normalise(series, higher_need=True):
    minimum = series.min()
    maximum = series.max()

    if maximum == minimum:
        return pd.Series(0.0, index=series.index)

    score = 100 * (series - minimum) / (maximum - minimum)

    if not higher_need:
        score = 100 - score

    return score


# Higher early ANC coverage means lower unmet need
df["score_early_anc"] = normalise(
    df["early_anc_coverage_pct"],
    higher_need=False
)

# Higher values indicate greater need
df["score_non_sba"] = normalise(df["non_sba_share_pct"])
df["score_low_birth_weight"] = normalise(df["low_birth_weight_pct"])
df["score_preterm"] = normalise(df["preterm_birth_pct"])
df["score_diarrhoea"] = normalise(df["diarrhoea_per_100k"])
df["score_tuberculosis"] = normalise(df["tuberculosis_per_100k"])

# --------------------------------------------------
# 4. CALCULATE DIMENSION SCORES
# --------------------------------------------------

df["maternal_score"] = (
    df["score_early_anc"] + df["score_non_sba"]
) / 2

df["child_score"] = (
    df["score_low_birth_weight"] + df["score_preterm"]
) / 2

df["disease_score"] = (
    df["score_diarrhoea"] + df["score_tuberculosis"]
) / 2

# --------------------------------------------------
# 5. OVERALL HEALTHCARE NEED SCORE
# --------------------------------------------------

df["healthcare_need_score"] = (
    0.35 * df["maternal_score"]
    + 0.25 * df["child_score"]
    + 0.40 * df["disease_score"]
)

df["healthcare_priority_rank"] = (
    df["healthcare_need_score"]
    .rank(ascending=False, method="min")
    .astype(int)
)

# --------------------------------------------------
# 6. SELECT AND EXPORT RESULTS
# --------------------------------------------------

result_columns = [
    "district",
    "early_anc_coverage_pct",
    "non_sba_share_pct",
    "low_birth_weight_pct",
    "preterm_birth_pct",
    "diarrhoea_per_100k",
    "tuberculosis_per_100k",
    "maternal_score",
    "child_score",
    "disease_score",
    "healthcare_need_score",
    "healthcare_priority_rank"
]

result = df[result_columns].sort_values(
    "healthcare_priority_rank"
)

result.to_csv(output_file, index=False)

print("\nHEALTHCARE SCORING COMPLETED")
print("=" * 65)
print(result.round(2).to_string(index=False))
print("\nSaved to:", output_file)
print("Districts scored:", len(result))
print("Highest healthcare need:", result.iloc[0]["district"])
