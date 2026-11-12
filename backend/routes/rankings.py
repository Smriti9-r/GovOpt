from fastapi import APIRouter

from backend.data_loader import load_district_data

router = APIRouter()

DISTRICT_DATA = load_district_data()


@router.get("/rankings")
def get_district_rankings():

    ranked_data = DISTRICT_DATA.sort_values(
        by="revised_need_score",
        ascending=False
    )

    return {
        "count": len(ranked_data),
        "rankings": ranked_data.to_dict(orient="records")
    }