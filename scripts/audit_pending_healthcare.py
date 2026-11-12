
import pandas as pd
from pathlib import Path

# Project paths
review_path = Path("outputs/healthcare_indicator_review.csv")
output_path = Path("outputs/pending_healthcare_audit.csv")

source_files = {
    "Disease": Path("data/disease_analysis.csv"),
    "Infrastructure": Path("data/healthcare_infrastructure_analysis.csv"),
}

# Load pending indicators
review = pd.read_csv(review_path)
pending = review[review["decision"].eq("Pending")]

results = []

for _, item in pending.iterrows():
    category = item["original_category"]
    indicator = item["indicator"]
    source_path = source_files.get(category)

    if source_path is None or not source_path.exists():
        results.append({
            "category": category,
            "indicator": indicator,
            "match": "SOURCE FILE NOT FOUND",
        })
        continue

    source = pd.read_csv(source_path)

    # Try exact column matching first
    if indicator in source.columns:
        column = indicator
        match_status = "EXACT"
    else:
        # Try matching after removing extra spaces and case differences
        normalized = {
            str(c).strip().lower(): c for c in source.columns
        }
        column = normalized.get(indicator.strip().lower())

        if column is None:
            results.append({
                "category": category,
                "indicator": indicator,
                "match": "NOT FOUND",
            })
            continue

        match_status = "NORMALIZED"

    values = pd.to_numeric(source[column], errors="coerce")
    valid = values.dropna()

    results.append({
        "category": category,
        "indicator": indicator,
        "source_column": column,
        "match": match_status,
        "nonzero": int((valid > 0).sum()),
        "zero": int((valid == 0).sum()),
        "missing": int(values.isna().sum()),
        "fractional": int(((valid % 1) != 0).sum()),
        "minimum": valid.min() if len(valid) else None,
        "maximum": valid.max() if len(valid) else None,
    })

# Save audit report separately
audit = pd.DataFrame(results)
audit.to_csv(output_path, index=False)

print("=" * 60)
print("PENDING HEALTHCARE INDICATOR AUDIT")
print("=" * 60)

print("\nIndicators audited:", len(audit))
print("\nColumn matching:")
print(audit["match"].value_counts().to_string())

print("\nAudit results:")
print(audit.to_string(index=False))

print("\nReport saved to:", output_path)
