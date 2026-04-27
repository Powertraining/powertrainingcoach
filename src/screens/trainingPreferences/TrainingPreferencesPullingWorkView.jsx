import { TRAINING_CAPABILITY_GROUPS } from "../../constants/trainingPreferences.js";
import TrainingCapabilityConfidenceView from "./TrainingCapabilityConfidenceView.jsx";

const GROUP = TRAINING_CAPABILITY_GROUPS[0];
const ITEM = GROUP.items[2];
const EXERCISE_IMAGES = {
  "pull-ups": require("../../assets/icons/sports/pullUp.png"),
  "chin-ups": require("../../assets/icons/sports/chinUp.png"),
  rows: require("../../assets/icons/sports/row.png"),
};

export default function TrainingPreferencesPullingWorkView({
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
