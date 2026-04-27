import { TRAINING_CAPABILITY_GROUPS } from "../../constants/trainingPreferences.js";
import TrainingCapabilityConfidenceView from "./TrainingCapabilityConfidenceView.jsx";

const GROUP = TRAINING_CAPABILITY_GROUPS[0];
const ITEM = GROUP.items[1];
const EXERCISE_IMAGES = {
  "split squat": require("../../assets/icons/sports/splitSquat.png"),
  lunge: require("../../assets/icons/sports/lunge.png"),
  "step-up": require("../../assets/icons/sports/stepUp.png"),
};

export default function TrainingPreferencesSingleLegLiftsView({
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
