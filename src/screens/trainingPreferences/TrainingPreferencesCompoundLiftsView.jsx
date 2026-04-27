import { TRAINING_CAPABILITY_GROUPS } from "../../constants/trainingPreferences.js";
import TrainingCapabilityConfidenceView from "./TrainingCapabilityConfidenceView.jsx";

const GROUP = TRAINING_CAPABILITY_GROUPS[0];
const ITEM = GROUP.items[0];
const EXERCISE_IMAGES = {
  squat: require("../../assets/icons/sports/squat.png"),
  deadlift: require("../../assets/icons/sports/deadLift.png"),
  bench: require("../../assets/icons/sports/benchPress.png"),
  row: require("../../assets/icons/sports/row.png"),
  "overhead press": require("../../assets/icons/sports/overheadPress.png"),
};

export default function TrainingPreferencesCompoundLiftsView({
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
