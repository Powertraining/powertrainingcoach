import { TRAINING_CAPABILITY_GROUPS } from "../../constants/trainingPreferences.js";
import TrainingCapabilityConfidenceView from "./TrainingCapabilityConfidenceView.jsx";

const GROUP = TRAINING_CAPABILITY_GROUPS[2];
const ITEM = {
  ...GROUP.items[3],
  description: "Heavy bag",
};
const EXERCISE_IMAGES = {
  "heavy bag": require("../../assets/icons/sports/heavyBag.png"),
};

export default function TrainingPreferencesHeavyBagView({
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
