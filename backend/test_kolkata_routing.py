import asyncio
import sys

from app.services.nowcast_engine import nowcast_engine

async def main():
    print("=" * 70)
    print("TESTING LOCATION-AWARE ROUTING (KOLKATA VS OTHER LOCATIONS)")
    print("=" * 70)

    # 1. Test Kolkata
    print("\n--- [1] TESTING SEARCH: KOLKATA (Expected: Trained ConvLSTM ML Model) ---")
    kolkata_threats = await nowcast_engine.get_hazard_threats(lat=22.5726, lon=88.3639, location="Kolkata")
    print(f"Kolkata Threat Count: {len(kolkata_threats)}")
    for t in kolkata_threats:
        print(f"  [{t.title}] -> Source: {t.source_label} | Prob: {t.probability_label} | Severity: {t.severity}")
        assert "Kolkata ConvLSTM" in t.source_label, f"Expected Kolkata ConvLSTM source, got: {t.source_label}"

    kolkata_timeline = await nowcast_engine.get_nowcast_timeline(lat=22.5726, lon=88.3639, location="Kolkata")
    print(f"\nKolkata Timeline Steps: {len(kolkata_timeline)}")
    for s in kolkata_timeline:
        print(f"  {s.time_label:<4} | TS Prob: {s.thunderstorm_prob}% | Rain Prob: {s.extreme_rainfall_prob}% | {s.summary[:55]}...")
        assert "ConvLSTM" in s.summary, f"Expected ConvLSTM in summary, got: {s.summary}"

    kolkata_cells = await nowcast_engine.get_tracked_storm_cells(lat=22.5726, lon=88.3639, location="Kolkata")
    print(f"\nKolkata Storm Cell: {kolkata_cells[0].name} @ {kolkata_cells[0].coordinates} ({kolkata_cells[0].current_location})")
    assert "Kolkata" in kolkata_cells[0].name or "Alipore" in kolkata_cells[0].current_location

    kolkata_zones = await nowcast_engine.get_risk_zones(lat=22.5726, lon=88.3639, location="Kolkata")
    print(f"Kolkata Risk Zones: {[z.name for z in kolkata_zones]}")

    print("\n[+] KOLKATA CHECKS PASSED: ConvLSTM trained model successfully served!")

    # 2. Test Non-Kolkata (Cuddalore / Pollachi)
    print("\n--- [2] TESTING SEARCH: CUDDALORE (Expected: Tomorrow.io / As Usual) ---")
    cuddalore_threats = await nowcast_engine.get_hazard_threats(lat=11.5202, lon=79.3396, location="Cuddalore")
    print(f"Cuddalore Threat Count: {len(cuddalore_threats)}")
    for t in cuddalore_threats:
        print(f"  [{t.title}] -> Source: {t.source_label} | Prob: {t.probability_label} | Severity: {t.severity}")
        assert "Tomorrow.io" in t.source_label or "Open-Meteo" in t.source_label, f"Expected Tomorrow.io/Open-Meteo, got: {t.source_label}"

    cuddalore_timeline = await nowcast_engine.get_nowcast_timeline(lat=11.5202, lon=79.3396, location="Cuddalore")
    print(f"\nCuddalore Timeline Steps: {len(cuddalore_timeline)}")
    for s in cuddalore_timeline:
        print(f"  {s.time_label:<4} | TS Prob: {s.thunderstorm_prob}% | Rain Prob: {s.extreme_rainfall_prob}% | {s.summary[:55]}...")
        assert "ConvLSTM" not in s.summary, f"Did not expect ConvLSTM in Cuddalore summary!"

    cuddalore_cells = await nowcast_engine.get_tracked_storm_cells(lat=11.5202, lon=79.3396, location="Cuddalore")
    print(f"\nCuddalore Storm Cell: {cuddalore_cells[0].name} @ {cuddalore_cells[0].coordinates}")
    assert "Cuddalore" in cuddalore_cells[0].name

    print("\n[+] CUDDALORE CHECKS PASSED: Tomorrow.io / As Usual preserved!")

    print("\n" + "=" * 70)
    print("ALL ROUTING TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(main())
