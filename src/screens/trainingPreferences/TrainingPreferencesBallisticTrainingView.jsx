import { TRAINING_CAPABILITY_GROUPS } from "../../constants/trainingPreferences.js";
import TrainingCapabilityConfidenceView from "./TrainingCapabilityConfidenceView.jsx";

const GROUP = TRAINING_CAPABILITY_GROUPS[1];
const ITEM = GROUP.items[2];
const EXERCISE_IMAGES = {
  "medicine-ball throws": require("../../assets/icons/sports/medicineBallThrow.png"),
  "jump squats": require("../../assets/icons/sports/jumpSquat.png"),
  "landmine punches": require("../../assets/icons/sports/landminePunches.png"),
};

export default function TrainingPreferencesBallisticTrainingView({
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
