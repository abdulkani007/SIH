from typing import Optional

def is_kolkata_location(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    location: Optional[str] = None
) -> bool:
    """
    Evaluates whether the given geographic coordinates or location name fall
    within the trained Kolkata ConvLSTM multi-horizon radar domain.
    Kolkata core grid bounds: 22.2°N - 22.9°N, 88.0°E - 88.7°E.
    Any other location (Salem, Pollachi, Coimbatore, Chennai, Cuddalore, Delhi, etc.)
    returns False and routes to Tomorrow.io / NWP convective pipeline.
    """
    if location:
        loc_lower = location.lower()
        if "kolkata" in loc_lower or "calcutta" in loc_lower:
            return True

    if lat is not None and lon is not None:
        if 22.2 <= lat <= 22.9 and 88.0 <= lon <= 88.7:
            return True

    return False
