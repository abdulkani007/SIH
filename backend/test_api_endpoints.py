import asyncio
from fastapi.testclient import TestClient
from app.main import app

def test_api():
    client = TestClient(app)

    print("Testing /api/nowcast/threats for Kolkata...")
    r_kolkata = client.get("/api/nowcast/threats?location=Kolkata&lat=22.5726&lon=88.3639")
    assert r_kolkata.status_code == 200, f"Expected 200, got {r_kolkata.status_code}"
    threats = r_kolkata.json()
    assert len(threats) == 3
    assert threats[0]["source_label"] == "Kolkata ConvLSTM ML Model"
    assert threats[0]["prediction_source"] == "KOLKATA_CONVLSTM"
    print("  Threats OK:", [t["title"] for t in threats])

    print("Testing /api/nowcast/timeline for Kolkata...")
    r_timeline = client.get("/api/nowcast/timeline?location=Kolkata&lat=22.5726&lon=88.3639")
    assert r_timeline.status_code == 200
    timeline = r_timeline.json()
    assert len(timeline) == 7
    print("  Timeline OK: 7 steps from T+0 to T+6")

    print("Testing /api/nowcast/threats for Cuddalore (As Usual)...")
    r_cuddalore = client.get("/api/nowcast/threats?location=Cuddalore&lat=11.5202&lon=79.3396")
    assert r_cuddalore.status_code == 200
    c_threats = r_cuddalore.json()
    assert "Tomorrow.io" in c_threats[0]["source_label"] or "Open-Meteo" in c_threats[0]["source_label"]
    print("  Cuddalore Threats OK:", c_threats[0]["source_label"])

    print("Testing /api/weather/sources...")
    r_sources = client.get("/api/weather/sources")
    assert r_sources.status_code == 200
    sources = r_sources.json()
    print("  Sources count:", len(sources))
    names = [s["name"] for s in sources]
    assert "Kolkata ConvLSTM AI Engine" in names
    print("  Found Kolkata ConvLSTM AI Engine in sources:", names)

    print("\n[+] ALL FASTAPI ENDPOINTS VERIFIED!")

if __name__ == "__main__":
    test_api()
