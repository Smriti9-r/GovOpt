
from pathlib import Path
import pandas as pd

REVIEW_PATH = Path("outputs/healthcare_indicator_review.csv")
PROPOSAL_PATH = Path("outputs/healthcare_classification_proposals.csv")
OUTPUT_PATH = Path("outputs/healthcare_indicator_review_final.csv")

# Reviewed decisions overriding provisional Candidate proposals.
OVERRIDES = {
    "Inpatient - Dengue": (
        "Candidate",
        "Disease burden and public health",
        "Conditional inpatient burden proxy; validate reporting period and adjust for population."
    ),
    "Inpatient - Malaria": (
        "Candidate",
        "Disease burden and public health",
        "Conditional inpatient burden proxy; validate reporting period and reconcile with laboratory data."
    ),
    "Malaria (RDT) - Plamodium Falciparum test positive": (
        "Hold",
        "Disease burden and public health",
        "Sparse positive reporting. Validate testing denominator and positivity rate before reconsidering."
    ),
    "Malaria (RDT) - Plasmodium Vivax test positive": (
        "Hold",
        "Disease burden and public health",
        "Sparse positive reporting. Validate testing denominator and positivity rate before reconsidering."
    ),
    "Number of Child Deaths (1 -5 years) due to Pneumonia": (
        "Candidate",
        "Child health",
        "Conditional child mortality indicator; validate reporting period and eligible-child denominator."
    ),
    "Number of Home Deliveries attended by Non SBA (Trained Birth Attendant(TBA) /Relatives/etc.)": (
        "Candidate",
        "Maternal and newborn health",
        "Use the derived non-SBA share from maternal_delivery_rates.csv for interpretation; validate reporting period."
    ),
    "Number of children more than 16 months of age who received Japanese Encephalitis (JE) vaccine": (
        "Hold",
        "Child health",
        "Only two districts report nonzero values and one fractional value was observed; validate age group and reporting."
    ),
    "Number of Anganwadi centres/ UPHCs reported to have conducted Village Health & Nutrition Day (VHNDs)/ Urban Health & Nutrition Day (UHNDs)/ Outreach / Special Outreach": (
        "Candidate",
        "Healthcare access and service availability",
        "Conditional outreach indicator; requires eligible-centre or population denominator."
    ),
    "Number of Home Deliveries attended by Skill Birth Attendant(SBA) (Doctor/Nurse/ANM/ Midwife)": (
        "Candidate",
        "Maternal and newborn health",
        "Interpret jointly with non-SBA deliveries; do not score raw SBA and non-SBA counts as independent burdens."
    ),
    "Number of PW given ANC Corticosteroids in Pre Term Labour": (
        "Supporting",
        "Maternal and newborn health",
        "Supporting service indicator; requires eligible preterm-labour denominator before scoring."
    ),
    "Number of Pregnant Women provided - Free Home to facility transport under JSSK": (
        "Supporting",
        "Maternal and newborn health",
        "Supporting service indicator; requires eligible-pregnancy or referral denominator."
    ),
    "Number of Pregnant Women provided - Interfacility transfers when needed under JSSK": (
        "Supporting",
        "Maternal and newborn health",
        "Supporting service indicator; requires eligible referral denominator."
    ),
    "Number of sick infants provided - Free Home to facility transport under JSSK": (
        "Supporting",
        "Child health",
        "Supporting newborn service indicator; requires eligible sick-infant denominator."
    ),
    "Number of sick infants provided - Interfacility transfers when needed under JSSK": (
        "Supporting",
        "Child health",
        "Supporting newborn service indicator; requires eligible referral denominator."
    ),
}


def main():
    # Load source files.
    review = pd.read_csv(REVIEW_PATH)
    proposals = pd.read_csv(PROPOSAL_PATH)

    required_review = {
        "original_category",
        "indicator",
        "final_dimension",
        "indicator_type",
        "scoring_direction",
        "denominator_required",
        "decision",
        "reason",
    }

    required_proposals = {
        "indicator",
        "suggested_final_dimension",
        "suggested_indicator_type",
        "suggested_scoring_direction",
        "suggested_denominator_required",
        "proposed_decision",
        "proposal_reason",
        "match",
    }

    # Validate required columns.
    if not required_review.issubset(review.columns):
        missing = required_review - set(review.columns)
        raise ValueError(f"Review file missing columns: {missing}")

    if not required_proposals.issubset(proposals.columns):
        missing = required_proposals - set(proposals.columns)
        raise ValueError(f"Proposal file missing columns: {missing}")

    # Validate proposal uniqueness.
    if proposals["indicator"].duplicated().any():
        raise ValueError("Duplicate indicators found in proposal file.")

    # Validate the known duplicate in the original review.
    duplicate_name = "Total Facility Based Maternal Death Reviews (FBMDR) done"

    duplicate_rows = review[review["indicator"] == duplicate_name]

    if len(duplicate_rows) != 2:
        raise ValueError(
            "Unexpected duplicate structure for maternal death review indicator."
        )

    if set(duplicate_rows["original_category"]) != {
        "Maternal",
        "Infrastructure",
    }:
        raise ValueError(
            "Unexpected categories for duplicated maternal death review indicator."
        )

    # All other indicators must be unique.
    other_rows = review[review["indicator"] != duplicate_name]

    if other_rows["indicator"].duplicated().any():
        raise ValueError("Additional duplicate indicators found in review file.")

    # Confirm that the known duplicate already has a valid Maternal classification.
    maternal_row = duplicate_rows[
        duplicate_rows["original_category"] == "Maternal"
    ].iloc[0]

    if maternal_row["decision"] != "Supporting":
        raise ValueError(
            "Maternal death review indicator does not have the expected Supporting decision."
        )

    # Validate pending indicators against proposals.
    pending = review[review["decision"] == "Pending"]["indicator"]

    if len(pending) != 41:
        raise ValueError(
            f"Expected 41 Pending indicators, found {len(pending)}."
        )

    if set(pending) != set(proposals["indicator"]):
        raise ValueError(
            "Pending indicators and proposal indicators do not match exactly."
        )

    # Confirm exact source-column matches.
    if not proposals["match"].astype(str).str.upper().eq("EXACT").all():
        raise ValueError(
            "At least one proposal does not have an exact source-column match."
        )

    # Remove only the redundant Infrastructure copy.
    # The original review file remains unchanged.
    final = review[
        ~(
            (review["indicator"] == duplicate_name)
            & (review["original_category"] == "Infrastructure")
        )
    ].copy()

    if len(final) != 76:
        raise ValueError(
            f"Expected 76 unique indicators, found {len(final)}."
        )

    if final["indicator"].duplicated().any():
        raise ValueError(
            "Duplicate indicators remain after duplicate reconciliation."
        )

    # Apply proposals and reviewed overrides.
    for _, proposal in proposals.iterrows():
        name = proposal["indicator"]

        decision = proposal["proposed_decision"]
        dimension = proposal["suggested_final_dimension"]
        reason = proposal["proposal_reason"]

        # Apply reviewed decisions where available.
        if name in OVERRIDES:
            decision, dimension, reason = OVERRIDES[name]

        if decision not in {"Candidate", "Supporting", "Hold"}:
            raise ValueError(
                f"Invalid final decision for {name}: {decision}"
            )

        row_index = final.index[final["indicator"] == name]

        if len(row_index) != 1:
            raise ValueError(
                f"Expected exactly one final review row for {name}; "
                f"found {len(row_index)}."
            )

        i = row_index[0]

        final.loc[i, "final_dimension"] = dimension
        final.loc[i, "indicator_type"] = (
            proposal["suggested_indicator_type"]
        )
        final.loc[i, "scoring_direction"] = (
            proposal["suggested_scoring_direction"]
        )
        final.loc[i, "denominator_required"] = (
            proposal["suggested_denominator_required"]
        )
        final.loc[i, "decision"] = decision
        final.loc[i, "reason"] = reason

    # Final validation.
    if len(final) != 76:
        raise ValueError("Final indicator count changed unexpectedly.")

    if final["indicator"].duplicated().any():
        raise ValueError("Duplicate indicators found in final output.")

    if (final["decision"] == "Pending").any():
        pending_names = final.loc[
            final["decision"] == "Pending", "indicator"
        ].tolist()

        raise ValueError(
            f"Pending indicators remain: {pending_names}"
        )

    if not final["decision"].isin(
        ["Candidate", "Supporting", "Hold"]
    ).all():
        raise ValueError("Unexpected decision value in final output.")

    # Save only after all validations pass.
    final.to_csv(OUTPUT_PATH, index=False)

    # Success report.
    print("=" * 60)
    print("HEALTHCARE CLASSIFICATION RECONCILIATION SUCCESSFUL")
    print("=" * 60)

    print("\nOriginal review file: unchanged")
    print("Proposal file: unchanged")
    print("Final output:", OUTPUT_PATH)

    print("\nIndicator validation:")
    print("Original review rows:", len(review))
    print("Final unique indicators:", len(final))
    print("Proposals applied:", len(proposals))
    print("Reviewed overrides:", len(OVERRIDES))
    print("Remaining Pending:", (final["decision"] == "Pending").sum())
    print("Duplicate indicators:", final["indicator"].duplicated().sum())

    print("\nFinal decision counts:")
    print(final["decision"].value_counts().to_string())

    print("\nFinal dimension counts:")
    print(final["final_dimension"].value_counts(dropna=False).to_string())

    print("\nAll validations passed.")


if __name__ == "__main__":
    main()
