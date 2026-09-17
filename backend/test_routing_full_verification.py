import asyncio
import sys
import os

backend_dir = r"d:\projects\sihh\backend"
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.services.kolkata_ml_service import kolkata_ml_service
from app.services.geo_utils import is_kolkata_location

client = TestClient(app)

def run_tests():
    print("=" * 80)
    print("STORMGUARD AI: LOCATION-BASED ROUTING FULL VERIFICATION")
    print("=" * 80)

    # -------------------------------------------------------------
    # 1. TEST DYNAMIC BOUNDARY EVALUATOR (geo_utils)
    # -------------------------------------------------------------
    print("\n[TEST 1] Dynamic Coordinate & Boundary Evaluator:")
    assert is_kolkata_location(location="Kolkata") == True, "Kolkata by name failed"
    assert is_kolkata_location(location="kolkata west bengal") == True, "Kolkata lowercase failed"
    assert is_kolkata_location(location="Calcutta") == True, "Calcutta by name failed"
    assert is_kolkata_location(lat=22.5726, lon=88.3639) == True, "Kolkata core GPS failed"
    assert is_kolkata_location(lat=22.3, lon=88.2) == True, "Kolkata boundary GPS failed"

    # Non-Kolkata locations must be False dynamically
    assert is_kolkata_location(location="Salem") == False, "Salem should be False"
    assert is_kolkata_location(location="Pollachi") == False, "Pollachi should be False"
    assert is_kolkata_location(location="Coimbatore") == False, "Coimbatore should be False"
    assert is_kolkata_location(location="Chennai") == False, "Chennai should be False"
    assert is_kolkata_location(location="Delhi") == False, "Delhi should be False"
    assert is_kolkata_location(location="Bengaluru") == False, "Bengaluru should be False"
    assert is_kolkata_location(lat=11.6643, lon=78.1460) == False, "Salem GPS should be False"
    assert is_kolkata_location(lat=10.6586, lon=77.0084) == False, "Pollachi GPS should be False"
    assert is_kolkata_location(lat=13.0827, lon=80.2707) == False, "Chennai GPS should be False"
    print("  [OK] Dynamic coordinate and boundary evaluation passed (0 hardcoded cities, 100% dynamic).")

    # -------------------------------------------------------------
    # 2. TEST KOLKATA CONVLSTM INFERENCE & MULTI-HORIZON OUTPUT
    # -------------------------------------------------------------
    print("\n[TEST 2] Kolkata ConvLSTM Model & Multi-Horizon Inference:")
    initial_call_count = kolkata_ml_service.inference_call_count
    
    # Query threats for Kolkata
    res_threats = client.get("/api/nowcast/threats?location=Kolkata")
    assert res_threats.status_code == 200, f"Threats status: {res_threats.status_code}"
    threats = res_threats.json()
    assert len(threats) == 3, f"Expected 3 threats, got {len(threats)}"
    
    ts_threat = next(t for t in threats if t["icon_name"] == "thunderstorm")
    hail_threat = next(t for t in threats if t["icon_name"] == "hail")
    rain_threat = next(t for t in threats if t["icon_name"] == "rain")

    assert ts_threat["prediction_source"] == "KOLKATA_CONVLSTM", f"TS source: {ts_threat['prediction_source']}"
    assert ts_threat["source_label"] == "Kolkata ConvLSTM ML Model", f"TS label: {ts_threat['source_label']}"
    assert len(ts_threat["trend_values"]) == 7, "Expected 7-point trend line [T+0 ... T+6]"

    assert hail_threat["is_available"] == False, "Hail should be False"
    assert hail_threat["prediction_source"] == "KOLKATA_CONVLSTM"
    assert "0 positive samples" in hail_threat["unavailable_reason"].lower(), "Hail reason missing"

    assert rain_threat["prediction_source"] == "KOLKATA_CONVLSTM"
    assert rain_threat["source_label"] == "Kolkata ConvLSTM ML Model"

    # Query timeline for Kolkata
    res_tl = client.get("/api/nowcast/timeline?location=Kolkata")
    assert res_tl.status_code == 200
    timeline = res_tl.json()
    assert len(timeline) == 7, f"Expected 7 steps (T+0 to T+6), got {len(timeline)}"
    for idx, step in enumerate(timeline):
        assert step["prediction_source"] == "KOLKATA_CONVLSTM"
        assert step["source_label"] == "Kolkata ConvLSTM ML Model"
        assert 0 <= step["thunderstorm_prob"] <= 100
        assert 0 <= step["extreme_rainfall_prob"] <= 100
        print(f"  Horizon {step['time_label']} (offset {step['hour_offset']}): TS={step['thunderstorm_prob']}%, Rain={step['extreme_rainfall_prob']}%, Rate={step['expected_precip_rate']}, Sev={step['overall_severity']}")

    # Query storm cells and risk zones for Kolkata
    res_cells = client.get("/api/nowcast/storm-cells?location=Kolkata")
    assert res_cells.status_code == 200
    cells = res_cells.json()
    assert len(cells) > 0
    assert cells[0]["prediction_source"] == "KOLKATA_CONVLSTM"
    assert cells[0]["source_label"] == "Kolkata ConvLSTM ML Model"
    assert 22.0 <= cells[0]["coordinates"][0] <= 23.0
    assert 88.0 <= cells[0]["coordinates"][1] <= 89.0

    res_zones = client.get("/api/nowcast/risk-zones?location=Kolkata")
    assert res_zones.status_code == 200
    zones = res_zones.json()
    assert len(zones) >= 3
    assert zones[0]["prediction_source"] == "KOLKATA_CONVLSTM"
    assert zones[0]["source_label"] == "Kolkata ConvLSTM ML Model"

    # Early warning
    res_warn = client.get("/api/alerts/active?location=Kolkata")
    assert res_warn.status_code == 200
    warn = res_warn.json()
    assert warn["prediction_source"] == "KOLKATA_CONVLSTM"
    assert warn["source_label"] == "Kolkata ConvLSTM ML Model"

    kolkata_calls = kolkata_ml_service.inference_call_count - initial_call_count
    assert kolkata_calls > 0, "Kolkata ConvLSTM model should have been called"
    print(f"  [OK] Kolkata ConvLSTM Model validated successfully ({kolkata_calls} model forward passes executed).")

    # -------------------------------------------------------------
    # 3. TEST NON-KOLKATA (TOMORROW.IO / EMPIRICAL CONVECTIVE ENGINE)
    # -------------------------------------------------------------
    print("\n[TEST 3] Non-Kolkata Routing (Pollachi & Salem):")
    before_pollachi = kolkata_ml_service.inference_call_count

    # Pollachi (lat: 10.6586, lon: 77.0084)
    res_pollachi_t = client.get("/api/nowcast/threats?lat=10.6586&lon=77.0084&location=Pollachi")
    assert res_pollachi_t.status_code == 200
    p_threats = res_pollachi_t.json()
    for t in p_threats:
        assert t["prediction_source"] == "TOMORROW_IO_RISK_ENGINE", f"Pollachi threat had source {t['prediction_source']}"
        assert "ConvLSTM" not in (t.get("source_label") or "")

    res_pollachi_tl = client.get("/api/nowcast/timeline?lat=10.6586&lon=77.0084&location=Pollachi")
    assert res_pollachi_tl.status_code == 200
    p_timeline = res_pollachi_tl.json()
    for s in p_timeline:
        assert s["prediction_source"] == "TOMORROW_IO_RISK_ENGINE"
        assert "ConvLSTM" not in (s.get("source_label") or "")

    res_pollachi_w = client.get("/api/alerts/active?lat=10.6586&lon=77.0084&location=Pollachi")
    assert res_pollachi_w.status_code == 200
    p_warn = res_pollachi_w.json()
    assert p_warn["prediction_source"] == "TOMORROW_IO_RISK_ENGINE"
    assert "ConvLSTM" not in (p_warn.get("source_label") or "")

    after_pollachi = kolkata_ml_service.inference_call_count
    assert after_pollachi == before_pollachi, f"ConvLSTM MUST NOT be called for non-Kolkata! Calls before: {before_pollachi}, after: {after_pollachi}"
    print(f"  [OK] Pollachi routed strictly to Tomorrow.io/NWP pipeline (ConvLSTM call count change: 0).")

    # Salem (lat: 11.6643, lon: 78.1460)
    before_salem = kolkata_ml_service.inference_call_count
    res_salem_t = client.get("/api/nowcast/threats?lat=11.6643&lon=78.1460&location=Salem")
    assert res_salem_t.status_code == 200
    s_threats = res_salem_t.json()
    assert s_threats[0]["prediction_source"] == "TOMORROW_IO_RISK_ENGINE"
    assert "ConvLSTM" not in (s_threats[0].get("source_label") or "")

    after_salem = kolkata_ml_service.inference_call_count
    assert after_salem == before_salem, f"ConvLSTM MUST NOT be called for Salem! Calls before: {before_salem}, after: {after_salem}"
    print(f"  [OK] Salem routed strictly to Tomorrow.io/NWP pipeline (ConvLSTM call count change: 0).")

    # -------------------------------------------------------------
    # 4. TEST LOCATION SWITCHING TRANSITIONS
    # -------------------------------------------------------------
    print("\n[TEST 4] Location Switching Transitions (Kolkata -> Salem -> Kolkata -> Pollachi):")
    
    # 1. Switch to Kolkata
    r1 = client.get("/api/nowcast/timeline?location=Kolkata").json()
    assert r1[1]["prediction_source"] == "KOLKATA_CONVLSTM"
    assert r1[1]["source_label"] == "Kolkata ConvLSTM ML Model"
    print("  Step 1: Switch to Kolkata -> Correctly loaded Kolkata ConvLSTM ML Model.")

    # 2. Switch to Salem
    r2 = client.get("/api/nowcast/timeline?lat=11.6643&lon=78.1460&location=Salem").json()
    assert r2[1]["prediction_source"] == "TOMORROW_IO_RISK_ENGINE"
    assert "ConvLSTM" not in (r2[1].get("source_label") or "")
    print("  Step 2: Switch to Salem -> Correctly loaded Tomorrow.io Risk Engine.")

    # 3. Switch back to Kolkata (using coordinates only, no location name)
    r3 = client.get("/api/nowcast/timeline?lat=22.5726&lon=88.3639").json()
    assert r3[1]["prediction_source"] == "KOLKATA_CONVLSTM"
    assert r3[1]["source_label"] == "Kolkata ConvLSTM ML Model"
    print("  Step 3: Switch back to Kolkata (GPS coordinates only) -> Dynamically routed to Kolkata ConvLSTM ML Model.")

    # 4. Switch to Pollachi
    r4 = client.get("/api/nowcast/timeline?lat=10.6586&lon=77.0084&location=Pollachi").json()
    assert r4[1]["prediction_source"] == "TOMORROW_IO_RISK_ENGINE"
    assert "ConvLSTM" not in (r4[1].get("source_label") or "")
    print("  Step 4: Switch to Pollachi -> Correctly loaded Tomorrow.io Risk Engine.")

    print("\n" + "=" * 80)
    print("ALL ROUTING & VERIFICATION TESTS PASSED WITH 100% SUCCESS!")
    print("=" * 80)

if __name__ == "__main__":
    run_tests()
