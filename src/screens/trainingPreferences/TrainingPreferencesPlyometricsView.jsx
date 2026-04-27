import { TRAINING_CAPABILITY_GROUPS } from "../../constants/trainingPreferences.js";
import TrainingCapabilityConfidenceView from "./TrainingCapabilityConfidenceView.jsx";

const GROUP = TRAINING_CAPABILITY_GROUPS[1];
const ITEM = GROUP.items[1];

export default function TrainingPreferencesPlyometricsView({
  value,
  onChange,
}) {
  return (
    <TrainingCapabilityConfidenceView
      item={ITEM}
      value={value}
      onChange={onChange}
    />
  );
}
