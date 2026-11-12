from fastapi import APIRouter, HTTPException

from backend.data_loader import load_district_data


router = APIRouter()

# Load district data for district endpoints
DISTRICT_DATA = load_district_data()


@router.get("/districts")
def get_districts():
    return {
        "count": len(DISTRICT_DATA),
        "districts": DISTRICT_DATA.to_dict(orient="records")
    }


@router.get("/districts/{district_name}")
def get_district_by_name(district_name: str):

    result = DISTRICT_DATA[
        DISTRICT_DATA["district"].str.strip().str.lower()
        == district_name.strip().lower()
    ]

    if result.empty:
        raise HTTPException(
            status_code=404,
            detail=f"District '{district_name}' not found."
        )

    return result.iloc[0].to_dict()