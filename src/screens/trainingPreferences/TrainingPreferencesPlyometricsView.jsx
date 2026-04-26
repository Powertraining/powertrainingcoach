import {
  CAPABILITY_RATING_OPTIONS,
  TRAINING_CAPABILITY_GROUPS,
} from "../../constants/trainingPreferences.js";
import TrainingCapabilityQuestionView from "./TrainingCapabilityQuestionView.jsx";

const GROUP = TRAINING_CAPABILITY_GROUPS[1];
const ITEM = GROUP.items[1];

export default function TrainingPreferencesPlyometricsView({
  value,
  onChange,
}) {
  return (
    <TrainingCapabilityQuestionView
      groupTitle={GROUP.title}
      item={ITEM}
      options={CAPABILITY_RATING_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
