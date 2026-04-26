import TrainingPreferencePickerQuestionView from "./TrainingPreferencePickerQuestionView.jsx";

export default function TrainingCapabilityQuestionView({
  groupTitle,
  item,
  value,
  onChange,
  options,
}) {
  return (
    <TrainingPreferencePickerQuestionView
      eyebrow={groupTitle}
      label={item.label}
      helperText={item.description}
      options={options}
      value={value}
      onChange={onChange}
      pickerStyle={styles.ratingInput}
    />
  );
}

const styles = {
  ratingInput: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.14)",
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
};
