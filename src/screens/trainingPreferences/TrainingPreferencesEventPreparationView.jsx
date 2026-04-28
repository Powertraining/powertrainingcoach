import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import DateSelector from "../../components/questionnaireComponents/DateSelector.jsx";
import StandardText from "../../components/textComponents/StandardText.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";

function getInitialDate(value = "") {
  const match = /\d{4}-\d{2}-\d{2}/.exec(String(value));
  return match ? match[0] : value;
}

function formatEventPreparation(date, description) {
  return [
    date ? `Date: ${date}` : "",
    description ? `Description: ${description}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export default function TrainingPreferencesEventPreparationView({
  value,
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const [step, setStep] = useState("date");
  const [eventDate, setEventDate] = useState(() => getInitialDate(value));
  const [eventDescription, setEventDescription] = useState("");

  function updateDate(nextDate) {
    setEventDate(nextDate);
    onChange?.(formatEventPreparation(nextDate, eventDescription));
  }

  function updateDetails(nextDescription) {
    setEventDescription(nextDescription);
    onChange?.(formatEventPreparation(eventDate, nextDescription));
  }

  return (
    <View style={[styles.section, { minHeight: screenHeight }]}>
      <TitleText height={130}>What and when is your next event?</TitleText>
      <View style={styles.contentSlot}>
        {step === "date" ? (
          <>
            <DateSelector
              value={eventDate}
              onChange={updateDate}
              placeholder="Competition date"
              showInput={false}
            />
            <TouchableOpacity
              onPress={() => setStep("details")}
              style={styles.nextButton}
            >
              <StandardText textColor="#000000" center>
                Next
              </StandardText>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.details}>
            <TextInput
              value={eventDescription}
              onChangeText={updateDetails}
              placeholder="Describe your event. Name, location, type etc."
              placeholderTextColor="#8E8E8E"
              multiline
              style={[styles.input, styles.descriptionInput]}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    justifyContent: "center",
    paddingBottom: 120,
  },
  contentSlot: {
    height: 300,
    justifyContent: "center",
  },
  nextButton: {
    alignSelf: "center",
    backgroundColor: "#C9B259",
    borderRadius: 20,
    marginTop: 28,
    paddingHorizontal: 36,
    paddingVertical: 12,
  },
  details: {
    alignSelf: "center",
    gap: 14,
    width: "80%",
  },
  input: {
    backgroundColor: "transparent",
    borderColor: "#C9B259",
    borderRadius: 20,
    borderWidth: 0.8,
    color: "#ffffff",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  descriptionInput: {
    minHeight: 110,
    textAlignVertical: "top",
  },
});
