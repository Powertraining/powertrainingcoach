import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import DateSelector from "../../components/questionnaireComponents/DateSelector.jsx";
import StandardText from "../../components/textComponents/StandardText.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";

const CONTINUE_BUTTON_TOP_OFFSET = 80;
const DESCRIPTION_CARD_HEIGHT = 104;
const DATE_SELECTOR_HEIGHT = 70 * 3;
const SECTION_TOP_PADDING = 180;

function getInitialDate(value = "") {
  const match = /\d{4}-\d{2}-\d{2}/.exec(String(value));
  return match ? match[0] : "";
}

function getInitialDescription(value = "") {
  const match = /Description:\s*([^;]+)/i.exec(String(value));
  return match ? match[1].trim() : "";
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
  mode = "description",
  onSkip,
  onEditorVisibilityChange,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const [eventDate, setEventDate] = useState(() => getInitialDate(value));
  const [eventDescription, setEventDescription] = useState(() => getInitialDescription(value));
  const [isDetailsEditing, setIsDetailsEditing] = useState(false);
  const [helperBottom, setHelperBottom] = useState(null);
  const continueButtonTop =
    screenHeight - SECTION_TOP_PADDING - CONTINUE_BUTTON_TOP_OFFSET;
  const centeredContentHeight =
    mode === "description" ? DESCRIPTION_CARD_HEIGHT : DATE_SELECTOR_HEIGHT;
  const centeredContentCenter =
    typeof helperBottom === "number"
      ? helperBottom + (continueButtonTop - helperBottom) / 2
      : null;

  function updateDate(nextDate) {
    setEventDate(nextDate);
    onChange?.(formatEventPreparation(nextDate, eventDescription));
  }

  function updateDetails(nextDescription) {
    setEventDescription(nextDescription);
    onChange?.(formatEventPreparation(eventDate, nextDescription));
  }

  function openDetailsEditor() {
    setIsDetailsEditing(true);
    onEditorVisibilityChange?.(true);
  }

  function closeDetailsEditor() {
    Keyboard.dismiss();
    setIsDetailsEditing(false);
    onEditorVisibilityChange?.(false);
  }

  return (
    <View style={[styles.section, { minHeight: screenHeight }]}>
      {mode === "description" ? (
        <>
          {isDetailsEditing ? (
            <View
              pointerEvents="none"
              style={[
                styles.fullScreenBlurLayer,
                { height: screenHeight + SECTION_TOP_PADDING },
              ]}
            />
          ) : null}

          <View
            style={
              isDetailsEditing
                ? [
                    styles.blurredContent,
                    { minHeight: screenHeight - SECTION_TOP_PADDING },
                  ]
                : null
            }
          >
            <TitleText height={130}>Do you have an upcoming event?</TitleText>
            <StandardText
              style={styles.helperText}
              center
              onLayout={(event) => {
                const { y, height } = event.nativeEvent.layout;
                setHelperBottom(y + height);
              }}
            >
              An event could be a personal deadline, a competition, or anything else.
            </StandardText>
            <View
              style={[
                styles.contentSlot,
                centeredContentCenter === null
                  ? styles.contentSlotPending
                  : {
                      top: centeredContentCenter,
                      transform: [{ translateY: -centeredContentHeight / 2 }],
                    },
              ]}
            >
              <View style={styles.details}>
                <Pressable
                  onPress={openDetailsEditor}
                  style={({ pressed }) => [
                    styles.eventDetailsCard,
                    pressed ? styles.eventDetailsCardPressed : null,
                  ]}
                >
                  <View style={styles.eventDetailsContent}>
                    <StandardText style={styles.inputLabel}>
                      Describe the event
                    </StandardText>
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.descriptionPreview,
                        !eventDescription ? styles.descriptionPreviewEmpty : null,
                      ]}
                    >
                      {eventDescription || "Name, location, type..."}
                    </Text>
                  </View>
                </Pressable>
                <Pressable onPress={onSkip} style={styles.skipButton}>
                  <Text style={styles.skipText}>Skip &gt;</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {isDetailsEditing ? (
            <Pressable
              onPress={closeDetailsEditor}
              style={[
                styles.editorDimLayer,
                { height: screenHeight + SECTION_TOP_PADDING },
              ]}
            />
          ) : null}

          {isDetailsEditing ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              pointerEvents="box-none"
              style={[
                styles.editorLayer,
                {
                  height: Math.max(screenHeight / 2, 260),
                  paddingTop: 0,
                },
              ]}
            >
              <View style={styles.editorCard}>
                <View style={styles.eventDetailsContent}>
                  <StandardText style={styles.inputLabel}>
                    Event details
                  </StandardText>
                  <TextInput
                    autoFocus
                    value={eventDescription}
                    onChangeText={updateDetails}
                    onBlur={closeDetailsEditor}
                    placeholder="Name, location, type..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    style={styles.descriptionInput}
                  />
                </View>
              </View>
            </KeyboardAvoidingView>
          ) : null}
        </>
      ) : (
        <>
          <TitleText height={130}>When is your next event?</TitleText>
          <StandardText
            style={styles.helperText}
            center
            onLayout={(event) => {
              const { y, height } = event.nativeEvent.layout;
              setHelperBottom(y + height);
            }}
          >
            Pick the date so the plan can time training around it.
          </StandardText>
          <View
            style={[
              styles.contentSlot,
              centeredContentCenter === null
                ? styles.contentSlotPending
                : {
                    top: centeredContentCenter,
                    transform: [{ translateY: -centeredContentHeight / 2 }],
                  },
            ]}
          >
            <View style={styles.dateSelectorWrap}>
              <DateSelector
                value={eventDate}
                onChange={updateDate}
                placeholder="Competition date"
                showInput={false}
              />
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    justifyContent: "flex-start",
    paddingTop: 180,
    position: "relative",
  },
  blurredContent: {
    opacity: 0.42,
    filter: [{ blur: 4 }],
  },
  fullScreenBlurLayer: {
    backgroundColor: "rgba(0,0,0,0.48)",
    filter: [{ blur: 4 }],
    left: 0,
    position: "absolute",
    right: 0,
    top: -SECTION_TOP_PADDING,
    zIndex: 18,
  },
  helperText: {
    width: "82%",
    alignSelf: "center",
    color: "#9ca3af",
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",
  },
  contentSlot: {
    left: 0,
    position: "absolute",
    right: 0,
  },
  contentSlotPending: {
    opacity: 0,
  },
  dateSelectorWrap: {
    marginBottom: 18,
  },
  details: {
    alignSelf: "center",
    width: "75%",
  },
  eventDetailsCard: {
    alignSelf: "stretch",
    backgroundColor: "#141414",
    borderColor: "#1E1E1E",
    borderRadius: 20,
    borderWidth: 2,
    minHeight: 104,
    overflow: "hidden",
  },
  eventDetailsCardPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  skipButton: {
    alignSelf: "center",
    marginTop: 18,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  skipText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  eventDetailsContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 18,
    textAlign: "left",
  },
  descriptionPreview: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
    marginTop: 4,
  },
  descriptionPreviewEmpty: {
    color: "#9ca3af",
  },
  descriptionInput: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
    marginTop: 4,
    minHeight: 48,
    padding: 0,
    textAlignVertical: "top",
  },
  editorDimLayer: {
    backgroundColor: "rgba(0,0,0,0.48)",
    left: 0,
    position: "absolute",
    right: 0,
    top: -SECTION_TOP_PADDING,
    zIndex: 19,
  },
  editorLayer: {
    alignItems: "center",
    justifyContent: "center",
    left: 0,
    paddingHorizontal: 20,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 20,
  },
  editorCard: {
    alignSelf: "stretch",
    backgroundColor: "#141414",
    borderColor: "#1E1E1E",
    borderRadius: 20,
    borderWidth: 2,
    minHeight: 112,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 12,
  },
});
