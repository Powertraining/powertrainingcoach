import { TRAINING_CAPABILITY_GROUPS } from "../../constants/trainingPreferences.js";
import TrainingCapabilityConfidenceView from "./TrainingCapabilityConfidenceView.jsx";

const GROUP = TRAINING_CAPABILITY_GROUPS[2];
const ITEM = {
  ...GROUP.items[0],
  label: "Conditioning",
  description: "Running",
};
const EXERCISE_IMAGES = {
  running: require("../../assets/icons/sports/running.png"),
};

export default function TrainingPreferencesRunningSprintingView({
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
