import {
  useEffect,
  useRef,
  useState } from "react";
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import DateSelector from "../../components/questionnaireComponents/DateSelector.jsx";
import {
  formatEventPreparation,
  parseEventPreparation,
} from "../../services/utils/profileFields.js";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
const CONTINUE_BUTTON_TOP_OFFSET = 80;
const DESCRIPTION_CARD_HEIGHT = 104;
const DATE_SELECTOR_HEIGHT = 70 * 3;
const SECTION_TOP_PADDING = 180;
const DESCRIPTION_EDITOR_CARD_HEIGHT = 224;
const DESCRIPTION_EDITOR_ACTIONS_HEIGHT = 44;
const DESCRIPTION_EDITOR_ACTIONS_GAP = 10;
const DESCRIPTION_EDITOR_TOP_OFFSET = 72;

function getInitialDate(value = "") {
  return parseEventPreparation(value).date;
}

function getInitialDescription(value = "") {
  return parseEventPreparation(value).description;
}

export default function TrainingPreferencesEventPreparationView({
  value,
  onChange,
  mode = "description",
  onSkip,
  onEditorVisibilityChange,
}) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const physicalScreenHeight = Dimensions.get("screen").height;
  const [eventDate, setEventDate] = useState(() => getInitialDate(value));
  const [eventDescription, setEventDescription] = useState(() => getInitialDescription(value));
  const [draftEventDescription, setDraftEventDescription] = useState(() =>
    getInitialDescription(value)
  );
  const [isDetailsEditing, setIsDetailsEditing] = useState(false);
  const [helperBottom, setHelperBottom] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const cancelPressPendingRef = useRef(false);
  const isDetailsEditingRef = useRef(false);
  const overlayHeight =
    Math.max(screenHeight, physicalScreenHeight) + SECTION_TOP_PADDING + keyboardHeight;
  const editorSafeTopPadding = Math.max(insets.top + 20, 32);
  const editorContentHeight =
    DESCRIPTION_EDITOR_CARD_HEIGHT +
    DESCRIPTION_EDITOR_ACTIONS_GAP +
    DESCRIPTION_EDITOR_ACTIONS_HEIGHT;
  const editorLayerHeight = Math.max(
    screenHeight / 2,
    editorContentHeight + editorSafeTopPadding + 24
  );
  const continueButtonTop =
    screenHeight - SECTION_TOP_PADDING - CONTINUE_BUTTON_TOP_OFFSET;
  const centeredContentHeight =
    mode === "description" ? DESCRIPTION_CARD_HEIGHT : DATE_SELECTOR_HEIGHT;
  const centeredContentCenter =
    typeof helperBottom === "number"
      ? helperBottom + (continueButtonTop - helperBottom) / 2
      : null;

  useEffect(() => {
    setEventDate(getInitialDate(value));
    const nextDescription = getInitialDescription(value);
    setEventDescription(nextDescription);

    if (!isDetailsEditing) {
      setDraftEventDescription(nextDescription);
    }
  }, [isDetailsEditing, value]);

  useEffect(() => {
    isDetailsEditingRef.current = isDetailsEditing;
  }, [isDetailsEditing]);

  useEffect(() => {
    const keyboardShowEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const keyboardHideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(keyboardShowEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height || 0);
    });
    const hideSubscription = Keyboard.addListener(keyboardHideEvent, () => {
      setKeyboardHeight(0);

      if (isDetailsEditingRef.current) {
        saveDetailsEditor();
      }
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [draftEventDescription, eventDate]);

  function updateDate(nextDate) {
    setEventDate(nextDate);
    onChange?.(formatEventPreparation(nextDate, eventDescription));
  }

  function updateDetails(nextDescription) {
    setEventDescription(nextDescription);
    onChange?.(formatEventPreparation(eventDate, nextDescription));
  }

  function openDetailsEditor() {
    setDraftEventDescription(eventDescription);
    setIsDetailsEditing(true);
    onEditorVisibilityChange?.(true);
  }

  function saveDetailsEditor() {
    if (cancelPressPendingRef.current) {
      return;
    }

    isDetailsEditingRef.current = false;
    Keyboard.dismiss();
    updateDetails(draftEventDescription);
    setIsDetailsEditing(false);
    onEditorVisibilityChange?.(false);
  }

  function cancelDetailsEditor() {
    isDetailsEditingRef.current = false;
    Keyboard.dismiss();
    setDraftEventDescription(eventDescription);
    setIsDetailsEditing(false);
    onEditorVisibilityChange?.(false);
    cancelPressPendingRef.current = false;
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
                { height: overlayHeight },
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
            <IBMPlexText titleBlock height={130}>Do you have some event up and coming?</IBMPlexText>
            <IBMPlexText defaultWhite
              style={styles.helperText}
              center
              onLayout={(event) => {
                const { y, height } = event.nativeEvent.layout;
                setHelperBottom(y + height);
              }}
            >
              An event could be a personal deadline, a competition, or anything else.
            </IBMPlexText>
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
                    <IBMPlexText style={[styles.inputLabel, styles.eventDetailsLabel]}>
                      Describe the event
                    </IBMPlexText>
                    <IBMPlexText
                      numberOfLines={2}
                      style={[
                        styles.descriptionPreview,
                        !eventDescription ? styles.descriptionPreviewEmpty : null,
                      ]}
                    >
                      {eventDescription || "Name, location, type..."}
                    </IBMPlexText>
                  </View>
                </Pressable>
                <Pressable onPress={onSkip} style={styles.skipButton}>
                  <IBMPlexText style={styles.skipText}>Skip &gt;</IBMPlexText>
                </Pressable>
              </View>
            </View>
          </View>

          {isDetailsEditing ? (
            <Pressable
              onPress={saveDetailsEditor}
              style={[
                styles.editorDimLayer,
                { height: overlayHeight },
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
                  height: editorLayerHeight,
                  paddingTop: editorSafeTopPadding,
                  top: DESCRIPTION_EDITOR_TOP_OFFSET,
                },
              ]}
            >
              <View style={styles.editorCard}>
                <View style={styles.editorContent}>
                  <IBMPlexText defaultWhite style={styles.inputLabel}>
                    Event details
                  </IBMPlexText>
                  <TextInput
                    autoFocus
                    value={draftEventDescription}
                    onChangeText={setDraftEventDescription}
                    placeholder="Name, location, type..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    returnKeyType="done"
                    selectionColor="#ffffff"
                    style={styles.descriptionInput}
                  />
                </View>
              </View>
              <View style={styles.editorActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={saveDetailsEditor}
                  style={({ pressed }) => [
                    styles.editorSaveButton,
                    pressed ? styles.editorButtonPressed : null,
                  ]}
                >
                  <IBMPlexText style={styles.editorSaveButtonText}>Save</IBMPlexText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPressIn={() => {
                    cancelPressPendingRef.current = true;
                  }}
                  onPress={cancelDetailsEditor}
                  style={({ pressed }) => [
                    styles.editorCancelButton,
                    pressed ? styles.editorButtonPressed : null,
                  ]}
                >
                  <IBMPlexText style={styles.editorCancelButtonText}>Cancel</IBMPlexText>
                </Pressable>
              </View>
            </KeyboardAvoidingView>
          ) : null}
        </>
      ) : (
        <>
          <IBMPlexText titleBlock height={130}>When is your next event?</IBMPlexText>
          <IBMPlexText defaultWhite
            style={styles.helperText}
            center
            onLayout={(event) => {
              const { y, height } = event.nativeEvent.layout;
              setHelperBottom(y + height);
            }}
          >
            Pick the date so the plan can time training around it.
          </IBMPlexText>
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
    fontSize: 12, fontWeight: "800",
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
    fontSize: 15, fontWeight: "800",
    lineHeight: 18,
    textAlign: "left",
  },
  eventDetailsLabel: {
    color: "#C9B259",
  },
  descriptionPreview: {
    color: "#9ca3af",
    fontSize: 13, fontWeight: "600",
    lineHeight: 17,
    marginTop: 4,
  },
  descriptionPreviewEmpty: {
    color: "#9ca3af",
  },
  descriptionInput: {
    color: "#9ca3af",
    fontSize: 13, fontWeight: "600",
    lineHeight: 17,
    marginTop: 4,
    minHeight: 144,
    padding: 0,
    textAlignVertical: "top",
  },
  editorContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    minHeight: DESCRIPTION_EDITOR_CARD_HEIGHT,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 12,
  },
  editorActions: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-start",
    marginTop: 10,
  },
  editorSaveButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: DESCRIPTION_EDITOR_ACTIONS_HEIGHT,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editorCancelButton: {
    alignItems: "center",
    backgroundColor: "#141414",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: DESCRIPTION_EDITOR_ACTIONS_HEIGHT,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editorButtonPressed: {
    opacity: 0.76,
  },
  editorSaveButtonText: {
    color: "#141414",
    fontSize: 12, fontWeight: "800",
  },
  editorCancelButtonText: {
    color: "#ffffff",
    fontSize: 12, fontWeight: "800",
  },
});
