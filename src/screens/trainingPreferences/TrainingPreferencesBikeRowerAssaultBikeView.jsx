import { TRAINING_CAPABILITY_GROUPS } from "../../constants/trainingPreferences.js";
import TrainingCapabilityConfidenceView from "./TrainingCapabilityConfidenceView.jsx";

const GROUP = TRAINING_CAPABILITY_GROUPS[2];
const ITEM = {
  ...GROUP.items[1],
  description: "Bike, rower, assault bike",
};
const EXERCISE_IMAGES = {
  bike: require("../../assets/icons/sports/bike.png"),
  rower: require("../../assets/icons/sports/rower.png"),
  "assault bike": require("../../assets/icons/sports/assult Bike.png"),
};

export default function TrainingPreferencesBikeRowerAssaultBikeView({
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
