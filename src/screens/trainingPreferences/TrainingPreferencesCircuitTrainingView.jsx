import { TRAINING_CAPABILITY_GROUPS } from "../../constants/trainingPreferences.js";
import TrainingCapabilityConfidenceView from "./TrainingCapabilityConfidenceView.jsx";

const GROUP = TRAINING_CAPABILITY_GROUPS[2];
const ITEM = {
  ...GROUP.items[2],
  description: "Circuit training",
};
const EXERCISE_IMAGES = {
  "circuit training": require("../../assets/icons/sports/curcuitTraining.png"),
};

export default function TrainingPreferencesCircuitTrainingView({
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
