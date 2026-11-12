

import pandas as pd
from pathlib import Path

# =====================================================
# GOVOPT: HEALTHCARE CLASSIFICATION PROPOSAL GENERATOR
# =====================================================

review_path = Path("outputs/healthcare_indicator_review.csv")
audit_path = Path("outputs/pending_healthcare_audit.csv")
output_path = Path("outputs/healthcare_classification_proposals.csv")

source_files = {
    "Disease": Path("data/disease_analysis.csv"),
    "Infrastructure": Path("data/healthcare_infrastructure_analysis.csv"),
}

# Each proposal:
# dimension, indicator type, scoring direction,
# denominator required, proposed decision, reason

proposals = {

    # ---------------- DISEASE: INPATIENT ----------------

    "Inpatient - Dengue": [
        "Disease burden and public health",
        "Inpatient disease burden count",
        "Higher population-adjusted burden = higher need",
        "Yes", "Candidate",
        "Non-zero in 8 districts. Inpatient burden proxy; adjust for population and verify reporting period."
    ],

    "Inpatient - Malaria": [
        "Disease burden and public health",
        "Inpatient disease burden count",
        "Higher population-adjusted burden = higher need",
        "Yes", "Candidate",
        "Non-zero in 7 districts. Validate differences from laboratory positives and verify reporting period."
    ],

    # ---------------- KALA AZAR ----------------

    "Kala Azar (RDT) - Tests Conducted": [
        "Disease burden and public health",
        "Diagnostic testing volume",
        "Not scored directly",
        "No", "Hold",
        "All districts report zero. Could indicate unavailable or unreported data, not absence of testing."
    ],

    "Kala Azar Positive Cases": [
        "Disease burden and public health",
        "Positive case count",
        "Higher population-adjusted burden = higher need",
        "Yes", "Hold",
        "All districts report zero. Verify reporting completeness and matching test denominator."
    ],

    # ---------------- MALARIA LABORATORY ----------------

    "Malaria (Microscopy Tests ) - Plasmodium Falciparum test positive": [
        "Disease burden and public health",
        "Microscopy positive count",
        "Higher positivity rate = higher need",
        "Yes", "Hold",
        "All districts report zero. Validate reporting and microscopy denominator before use."
    ],

    "Malaria (Microscopy Tests ) - Plasmodium Vivax test positive": [
        "Disease burden and public health",
        "Microscopy positive count",
        "Higher positivity rate = higher need",
        "Yes", "Hold",
        "Positive records in 4 districts. Confirm matching microscopy denominator and reporting period."
    ],

    "Malaria (RDT) - Plamodium Falciparum test positive": [
        "Disease burden and public health",
        "RDT positive count",
        "Higher positivity rate = higher need",
        "Yes", "Candidate",
        "Positive result in one district only. Pair with RDT testing volume; interpret cautiously."
    ],

    "Malaria (RDT) - Plasmodium Vivax test positive": [
        "Disease burden and public health",
        "RDT positive count",
        "Higher positivity rate = higher need",
        "Yes", "Candidate",
        "Positive results in 3 districts. Pair with RDT testing volume and avoid double counting across methods."
    ],

    # ---------------- ADULT MORTALITY ----------------

    "Number of Adolscent / Adult deaths due to Cancer": [
        "Disease burden and public health",
        "Adult mortality count",
        "Higher population-adjusted mortality = higher need",
        "Yes", "Hold",
        "Fractional value detected. Verify source aggregation and reporting period before treating as death counts."
    ],

    "Number of Adolscent / Adult deaths due to Diarrhoeal diseases": [
        "Disease burden and public health",
        "Adult mortality count",
        "Higher population-adjusted mortality = higher need",
        "Yes", "Hold",
        "Fractional value detected. Validate source values and population denominator."
    ],

    "Number of Adolscent / Adult deaths due to HIV/AIDS": [
        "Disease burden and public health",
        "Adult mortality count",
        "Higher population-adjusted mortality = higher need",
        "Yes", "Hold",
        "Fractional value detected. Verify source aggregation and reporting period."
    ],

    "Number of Adolscent / Adult deaths due to Respiratory diseases including infections (other than TB)": [
        "Disease burden and public health",
        "Adult mortality count",
        "Higher population-adjusted mortality = higher need",
        "Yes", "Hold",
        "Fractional value detected. Validate source values and disease definition."
    ],

    "Number of Adolscent / Adult deaths due to Tuberculosis": [
        "Disease burden and public health",
        "Adult mortality count",
        "Higher population-adjusted mortality = higher need",
        "Yes", "Hold",
        "Fractional value detected. Verify source aggregation and reporting period."
    ],

    # ---------------- CHILD MORTALITY ----------------

    "Number of Child Deaths (1 -5 years) due to Diarrhoea": [
        "Child health",
        "Child mortality count",
        "Higher population-adjusted mortality = higher need",
        "Yes", "Hold",
        "Fractional value detected. Validate source values and eligible-child denominator."
    ],

    "Number of Child Deaths (1 -5 years) due to Pneumonia": [
        "Child health",
        "Child mortality count",
        "Higher population-adjusted mortality = higher need",
        "Yes", "Candidate",
        "Non-zero in 6 districts. Validate reporting period and eligible-child denominator before scoring."
    ],

    "Number of Infant Deaths (1 -12 months) due to Diarrhoea": [
        "Child health",
        "Infant mortality count",
        "Higher population-adjusted mortality = higher need",
        "Yes", "Hold",
        "Fractional value detected. Validate source values and live-birth denominator."
    ],

    "Number of Infant Deaths (1 -12 months) due to Pneumonia": [
        "Child health",
        "Infant mortality count",
        "Higher population-adjusted mortality = higher need",
        "Yes", "Hold",
        "Fractional value detected. Validate source values and live-birth denominator."
    ],

    # ---------------- OTHER MORTALITY ----------------

    "Number of Deaths due to Dengue": [
        "Disease burden and public health",
        "Disease-specific mortality count",
        "Higher population-adjusted mortality = higher need",
        "Yes", "Hold",
        "Fractional values detected. Validate source aggregation and reporting period."
    ],

    "Number of Deaths due to Japanese Encephalitis (JE)": [
        "Disease burden and public health",
        "Disease-specific mortality count",
        "Higher population-adjusted mortality = higher need",
        "Yes", "Hold",
        "All districts report zero. Confirm reporting completeness before interpreting zeros."
    ],

    "Number of Deaths due to Kala Azar": [
        "Disease burden and public health",
        "Disease-specific mortality count",
        "Higher population-adjusted mortality = higher need",
        "Yes", "Hold",
        "Fractional values detected. Validate source aggregation and reporting period."
    ],

    "Number of Deaths due to Malaria- Plasmodium Falciparum": [
        "Disease burden and public health",
        "Disease-specific mortality count",
        "Higher population-adjusted mortality = higher need",
        "Yes", "Hold",
        "All districts report zero. Confirm reporting completeness."
    ],

    "Number of Deaths due to Malaria- Plasmodium Vivax": [
        "Disease burden and public health",
        "Disease-specific mortality count",
        "Higher population-adjusted mortality = higher need",
        "Yes", "Hold",
        "All districts report zero. Confirm reporting completeness."
    ],

    # ---------------- MATERNAL INDICATORS ----------------

    "Number of Home Deliveries attended by Non SBA (Trained Birth Attendant(TBA) /Relatives/etc.)": [
        "Maternal and newborn health",
        "Non-skilled birth attendance count",
        "Higher population-adjusted rate = higher need",
        "Yes", "Candidate",
        "Move to maternal dimension. Requires total births or home-delivery denominator."
    ],

    "Number of pregnant women screened for HIV (by finger prick test)": [
        "Maternal and newborn health",
        "HIV screening volume",
        "Not scored directly",
        "No", "Supporting",
        "Use as a screening-volume reference; testing volume alone does not measure disease burden."
    ],

    "Out of the above number screened positive, number confirmed with HIV infection at Integrated Counselling and Testing Centre (ICTC)": [
        "Maternal and newborn health",
        "HIV confirmation count",
        "Not scored directly",
        "Yes", "Hold",
        "Need the number who screened positive as the matching denominator to calculate confirmation rate."
    ],

    # ---------------- NEWBORN SERVICE DATA ----------------

    "Outborn - Female": [
        "Maternal and newborn health",
        "Outborn newborn service count",
        "Not scored directly",
        "Yes", "Supporting",
        "Newborn service indicator. Review alongside male count and avoid double counting."
    ],

    "Outborn – Male": [
        "Maternal and newborn health",
        "Outborn newborn service count",
        "Not scored directly",
        "Yes", "Supporting",
        "Newborn service indicator. Review alongside female count and avoid double counting."
    ],

    # ---------------- MALARIA TESTING VOLUMES ----------------

    "RDT conducted for Malaria": [
        "Disease burden and public health",
        "RDT testing volume",
        "Not scored directly",
        "No", "Supporting",
        "Use as denominator/reference for RDT positives, not as direct disease burden."
    ],

    "Total Blood Smears Examined for Malaria": [
        "Disease burden and public health",
        "Microscopy testing volume",
        "Not scored directly",
        "No", "Supporting",
        "Use as a microscopy testing reference; confirm it matches parasite-specific positive counts."
    ],

    # ---------------- INFANT IMMUNISATION ----------------

    "Number of children more than 16 months of age who received Japanese Encephalitis (JE) vaccine": [
        "Child health",
        "Child immunisation count",
        "Higher eligible-child coverage = better protection",
        "Yes", "Candidate",
        "Vaccination count is a potential coverage indicator; requires eligible-child denominator and age/reporting-period validation."
    ],

    # ---------------- COMMUNITY OUTREACH ----------------

    "Number of Anganwadi centres/ UPHCs reported to have conducted Village Health & Nutrition Day (VHNDs)/ Urban Health & Nutrition Day (UHNDs)/ Outreach / Special Outreach": [
        "Healthcare access and service availability",
        "Community outreach activity",
        "Higher population-adjusted coverage = better service reach",
        "Yes", "Candidate",
        "Potential outreach reach indicator. Requires eligible-centre or population denominator and period validation."
    ],

    # ---------------- MATERNAL SERVICES ----------------

    "Number of Home Deliveries attended by Skill Birth Attendant(SBA) (Doctor/Nurse/ANM/ Midwife)": [
        "Maternal and newborn health",
        "Skilled birth attendance count",
        "Higher population-adjusted coverage = better service reach",
        "Yes", "Candidate",
        "Move to maternal dimension. Requires total home deliveries or births as denominator."
    ],

    "Number of Lab Tests done": [
        "Healthcare access and service availability",
        "Diagnostic service volume",
        "Not scored directly",
        "No", "Supporting",
        "Testing volume is not a direct measure of disease burden or diagnostic capacity."
    ],

    "Number of Maternal Deaths due to Obstructed/prolonged labour": [
        "Maternal and newborn health",
        "Maternal mortality count",
        "Higher population-adjusted mortality = higher need",
        "Yes", "Hold",
        "Fractional value detected. Verify source aggregation and maternal-death reporting."
    ],

    "Number of PW given ANC Corticosteroids in Pre Term Labour": [
        "Maternal and newborn health",
        "Maternal treatment count",
        "Higher eligible-population coverage = better service reach",
        "Yes", "Candidate",
        "Move to maternal dimension. Requires eligible preterm-labour denominator and period validation."
    ],

    "Number of Pregnant Women provided - Free Home to facility transport under JSSK": [
        "Maternal and newborn health",
        "Maternal referral and transport count",
        "Higher eligible-population coverage = better service reach",
        "Yes", "Candidate",
        "Move to maternal dimension. Service count requires eligible-pregnancy or referral denominator."
    ],

    "Number of Pregnant Women provided - Interfacility transfers when needed under JSSK": [
        "Maternal and newborn health",
        "Maternal referral and transport count",
        "Higher eligible-population coverage = better service reach",
        "Yes", "Candidate",
        "Move to maternal dimension. Requires eligible referral denominator and period validation."
    ],

    # ---------------- CHILD REFERRAL SERVICES ----------------

    "Number of sick infants provided - Free Home to facility transport under JSSK": [
        "Child health",
        "Infant referral and transport count",
        "Higher eligible-population coverage = better service reach",
        "Yes", "Candidate",
        "Move to child/newborn dimension. Requires eligible sick-infant denominator."
    ],

    "Number of sick infants provided - Interfacility transfers when needed under JSSK": [
        "Child health",
        "Infant referral and transport count",
        "Higher eligible-population coverage = better service reach",
        "Yes", "Candidate",
        "Move to child/newborn dimension. Requires eligible referral denominator."
    ],

    # ---------------- SATISFACTION AND GOVERNANCE ----------------

    "Patient Satisfaction Score of the facility in percentage (from Mera Aspatal)": [
        "Healthcare access and service availability",
        "Patient satisfaction percentage",
        "Higher satisfaction = better service quality",
        "No", "Hold",
        "Zero in 11 districts. Confirm whether zero means no feedback or a genuine score."
    ],

    "Total Facility Based Maternal Death Reviews (FBMDR) done": [
        "Maternal and newborn health",
        "Maternal death review activity",
        "Not scored directly",
        "No", "Supporting",
        "Governance and review-process indicator, not a direct measure of unmet maternal need."
    ],
}


def main():
    if not review_path.exists() or not audit_path.exists():
        raise FileNotFoundError(
            "Review file or audit file is missing. "
            "Run the pending healthcare audit first."
        )

    review = pd.read_csv(review_path)
    audit = pd.read_csv(audit_path)

    pending = review[review["decision"].eq("Pending")].copy()

    missing = sorted(set(pending["indicator"]) - set(proposals))
    extra = sorted(set(proposals) - set(pending["indicator"]))

    if missing or extra:
        print("Proposal mapping validation failed.")
        print("Missing mappings:", missing)
        print("Unexpected mappings:", extra)
        return

    proposal_columns = [
        "suggested_final_dimension",
        "suggested_indicator_type",
        "suggested_scoring_direction",
        "suggested_denominator_required",
        "proposed_decision",
        "proposal_reason",
    ]

    proposal_rows = [
        [indicator] + proposals[indicator]
        for indicator in pending["indicator"]
    ]

    proposal_df = pd.DataFrame(
        proposal_rows,
        columns=["indicator"] + proposal_columns
    )

    result = pending.merge(
        proposal_df,
        on="indicator",
        how="left",
        validate="one_to_one"
    )

    result = result.merge(
        audit.drop(columns=["category"], errors="ignore"),
        on="indicator",
        how="left",
        validate="one_to_one"
    )

    result.to_csv(output_path, index=False)

    print("=" * 60)
    print("HEALTHCARE CLASSIFICATION PROPOSALS")
    print("=" * 60)

    print("\nPending indicators mapped:", len(proposal_df))
    print("\nProposed decisions:")
    print(result["proposed_decision"].value_counts().to_string())

    print("\nProposed dimensions:")
    print(
        result["suggested_final_dimension"]
        .value_counts()
        .to_string()
    )

    print("\nProposal file saved:", output_path)
    print("\nExisting review file was NOT modified.")


if __name__ == "__main__":
    main()
    main()
