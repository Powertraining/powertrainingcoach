import { TRAINING_CAPABILITY_GROUPS } from "../../constants/trainingPreferences.js";
import TrainingCapabilityConfidenceView from "./TrainingCapabilityConfidenceView.jsx";

const GROUP = TRAINING_CAPABILITY_GROUPS[1];
const ITEM = GROUP.items[1];
const EXERCISE_IMAGES = {
  jumps: require("../../assets/icons/sports/jumps.png"),
  bounds: require("../../assets/icons/sports/bounds.png"),
  hops: require("../../assets/icons/sports/hops.png"),
  "landing drills": require("../../assets/icons/sports/landingDrills.png"),
};

export default function TrainingPreferencesPlyometricsView({
  value,
  onChange,
}) {
  return (
    <TrainingCapabilityConfidenceView
      item={ITEM}
      value={value}
      onChange={onChange}
      exerciseImages={EXERCISE_IMAGES}
    />
  );
}
