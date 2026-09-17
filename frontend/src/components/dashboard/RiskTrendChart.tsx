import StormJourneyTimeline, { type StormJourneyTimelineProps } from "./StormJourneyTimeline";
import { mockNowcastTimeline, mockStormCell } from "@/data/mockWeather";

export default function RiskTrendChart(props: Partial<StormJourneyTimelineProps>) {
  return (
    <StormJourneyTimeline
      steps={props.steps || mockNowcastTimeline}
      selectedIdx={props.selectedIdx !== undefined ? props.selectedIdx : 0}
      onSelectStep={props.onSelectStep || (() => {})}
      stormCell={props.stormCell || mockStormCell}
      userCoords={props.userCoords}
      userLocation={props.userLocation}
      className={props.className}
    />
  );
}

export { StormJourneyTimeline };
