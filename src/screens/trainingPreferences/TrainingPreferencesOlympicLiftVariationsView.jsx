import { TRAINING_CAPABILITY_GROUPS } from "../../constants/trainingPreferences.js";
import TrainingCapabilityConfidenceView from "./TrainingCapabilityConfidenceView.jsx";

const GROUP = TRAINING_CAPABILITY_GROUPS[1];
const ITEM = GROUP.items[0];
const EXERCISE_IMAGES = {
  "power clean": require("../../assets/icons/sports/powerClean.png"),
  "hang clean": require("../../assets/icons/sports/hangClean.png"),
  "push press": require("../../assets/icons/sports/pushPress.png"),
  "split jerk": require("../../assets/icons/sports/splitJerk.png"),
};

export default function TrainingPreferencesOlympicLiftVariationsView({
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
