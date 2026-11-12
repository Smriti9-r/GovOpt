
import pandas as pd


def optimize_allocation(
    district_data,
    budget_crore,
    need_weight=70,
    population_weight=30,
    min_allocation_crore=20,
    max_allocation_crore=70
):
    """
    Allocate a government budget across districts using
    development need and population priorities.

    Uses bounded proportional redistribution to ensure:
    1. Every district receives at least the minimum allocation.
    2. No district exceeds the maximum allocation.
    3. The entire budget is distributed.
    """

    # 1. Validate budget and allocation limits
    if budget_crore <= 0:
        raise ValueError("Budget must be greater than zero.")

    if min_allocation_crore < 0:
        raise ValueError("Minimum allocation cannot be negative.")

    if max_allocation_crore < min_allocation_crore:
        raise ValueError("Invalid allocation limits.")

    # 2. Validate priority weights
    if need_weight < 0 or population_weight < 0:
        raise ValueError("Priority weights cannot be negative.")

    if need_weight + population_weight != 100:
        raise ValueError("Priority weights must add up to 100.")

    # 3. Validate district data
    required_columns = [
        "district",
        "population_share_percent",
        "need_score_share_percent"
    ]

    for column in required_columns:
        if column not in district_data.columns:
            raise ValueError(f"Missing required column: {column}")

    df = district_data[required_columns].copy()

    if df.empty:
        raise ValueError("District dataset is empty.")

    if df["district"].isnull().any():
        raise ValueError("District names cannot be missing.")

    if df["district"].duplicated().any():
        raise ValueError("Duplicate districts found.")

    share_columns = [
        "population_share_percent",
        "need_score_share_percent"
    ]

    for column in share_columns:
        df[column] = pd.to_numeric(df[column], errors="coerce")

    if df[share_columns].isnull().any().any():
        raise ValueError("Priority shares must be numeric and non-missing.")

    if not df[share_columns].map(lambda x: x >= 0).all().all():
        raise ValueError("Priority shares cannot be negative.")

    # 4. Check budget feasibility
    district_count = len(df)

    minimum_total = district_count * min_allocation_crore
    maximum_total = district_count * max_allocation_crore

    if budget_crore < minimum_total:
        raise ValueError("Budget is insufficient for minimum allocations.")

    if budget_crore > maximum_total:
        raise ValueError("Budget exceeds maximum permitted allocations.")

    # 5. Normalise priority shares
    population_total = df["population_share_percent"].sum()
    need_total = df["need_score_share_percent"].sum()

    if population_total <= 0 or need_total <= 0:
        raise ValueError("Priority shares must have positive totals.")

    df["population_share"] = (
        df["population_share_percent"] / population_total
    )

    df["need_share"] = (
        df["need_score_share_percent"] / need_total
    )

    # 6. Calculate combined priority
    df["combined_priority"] = (
        (need_weight / 100) * df["need_share"]
        + (population_weight / 100) * df["population_share"]
    )

    # 7. Calculate ideal target allocation
    df["target_allocation_crore"] = (
        df["combined_priority"] * budget_crore
    )

    # 8. Apply minimum allocations first
    allocations = [
        float(min_allocation_crore)
        for _ in range(district_count)
    ]

    remaining_budget = (
        float(budget_crore) - sum(allocations)
    )

    # 9. Redistribute remaining budget proportionally
    active_districts = set(range(district_count))

    while remaining_budget > 1e-9 and active_districts:

        active_priority_total = sum(
            df.iloc[i]["combined_priority"]
            for i in active_districts
        )

        if active_priority_total <= 0:
            break

        capped_districts = []

        for i in active_districts:

            priority = df.iloc[i]["combined_priority"]

            proposed_extra = (
                remaining_budget * priority / active_priority_total
            )

            available_capacity = (
                max_allocation_crore - allocations[i]
            )

            if proposed_extra >= available_capacity - 1e-9:
                capped_districts.append(i)

        if capped_districts:

            for i in capped_districts:
                extra = max_allocation_crore - allocations[i]
                allocations[i] += extra
                remaining_budget -= extra
                active_districts.remove(i)

        else:

            for i in active_districts:
                priority = df.iloc[i]["combined_priority"]

                extra = (
                    remaining_budget * priority / active_priority_total
                )

                allocations[i] += extra

            remaining_budget = 0.0

    if abs(remaining_budget) > 1e-6:
        raise RuntimeError("Unable to distribute the entire budget.")

    # 10. Store final allocations
    df["optimised_allocation_crore"] = allocations

    # 11. Final validation
    total_allocated = df["optimised_allocation_crore"].sum()

    if abs(total_allocated - budget_crore) > 1e-6:
        raise RuntimeError("Final budget validation failed.")

    if (
        df["optimised_allocation_crore"] < min_allocation_crore - 1e-6
    ).any():
        raise RuntimeError("Minimum allocation constraint violated.")

    if (
        df["optimised_allocation_crore"] > max_allocation_crore + 1e-6
    ).any():
        raise RuntimeError("Maximum allocation constraint violated.")

    return df
