import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  PanResponder,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import BlackGradient from "../../components/colorComponents/BlackGradient.jsx";
import WhiteBottomMenu from "../../components/profileComponents/WhiteBottomMenu.jsx";
import DateSelector from "../../components/questionnaireComponents/DateSelector.jsx";

const DESCRIPTION_CONTAINER_HEIGHT = 252;

function parseEventPreparation(value = "") {
  const text = String(value || "").trim();
  const dateMatch = /\d{4}-\d{2}-\d{2}/.exec(text);
  const descriptionMatch = /Description:\s*(.*)$/i.exec(text);
  const fallbackDescription = text
    .replace(/Date:\s*\d{4}-\d{2}-\d{2}/i, "")
    .replace(/\d{4}-\d{2}-\d{2}/, "")
    .replace(/^[;,\s]+|[;,\s]+$/g, "");

  return {
    hasEvent: Boolean(text),
    date: dateMatch ? dateMatch[0] : "",
    description: descriptionMatch ? descriptionMatch[1].trim() : fallbackDescription,
  };
}

function formatEventPreparation(date, description) {
  return [
    date ? `Date: ${date}` : "",
    description ? `Description: ${description}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function formatDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function RegisterEventView({
  value,
  isSubmitting,
  onChange,
  onSaveChange,
  onClearEvent,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const initialEvent = useMemo(() => parseEventPreparation(value), [value]);
  const dateEditorSheetTranslateY = useRef(new Animated.Value(0)).current;
  const [eventDate, setEventDate] = useState(initialEvent.date);
  const [eventDescription, setEventDescription] = useState(initialEvent.description);
  const [draftEventDate, setDraftEventDate] = useState(initialEvent.date);
  const [draftEventDescription, setDraftEventDescription] = useState(
    initialEvent.description
  );
  const [editingField, setEditingField] = useState(null);
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false);

  useEffect(() => {
    setEventDate(initialEvent.date);
    setEventDescription(initialEvent.description);
    if (!editingField) {
      setDraftEventDate(initialEvent.date);
      setDraftEventDescription(initialEvent.description);
    }
  }, [editingField, initialEvent.date, initialEvent.description]);

  useEffect(
    function resetDateEditorSheetPositionACB() {
      if (editingField === "date") {
        dateEditorSheetTranslateY.setValue(0);
      }
    },
    [dateEditorSheetTranslateY, editingField]
  );

  const dateEditorSheetDragResponder = useMemo(
    function dateEditorSheetDragResponderACB() {
      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 4,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            dateEditorSheetTranslateY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 70 || gestureState.vy > 0.75) {
            Animated.timing(dateEditorSheetTranslateY, {
              toValue: Math.max(screenHeight / 3, 260),
              duration: 160,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }).start(closeEditor);
            return;
          }

          Animated.spring(dateEditorSheetTranslateY, {
            toValue: 0,
            damping: 18,
            stiffness: 220,
            useNativeDriver: true,
          }).start();
        },
      });
    },
    [dateEditorSheetTranslateY, screenHeight]
  );

  function openDateEditor() {
    setDraftEventDate(eventDate || formatDateValue(new Date()));
    setEditingField("date");
  }

  function openDescriptionEditor() {
    setDraftEventDescription(eventDescription);
    setEditingField("description");
  }

  function saveDateEditor() {
    const nextValue = formatEventPreparation(draftEventDate, eventDescription);
    setEventDate(draftEventDate);
    onChange?.(nextValue);
    onSaveChange?.(nextValue);
    closeSavedEditor();
  }

  function saveDescriptionEditor() {
    const nextValue = formatEventPreparation(eventDate, draftEventDescription);
    setEventDescription(draftEventDescription);
    onChange?.(nextValue);
    onSaveChange?.(nextValue);
    closeSavedEditor();
  }

  function openClearConfirm() {
    setClearConfirmVisible(true);
  }

  function closeClearConfirm() {
    setClearConfirmVisible(false);
  }

  function clearEvent() {
    setEventDate("");
    setEventDescription("");
    setDraftEventDate("");
    setDraftEventDescription("");
    onChange?.("");
    onClearEvent?.();
    closeClearConfirm();
  }

  function closeEditor() {
    Keyboard.dismiss();
    dateEditorSheetTranslateY.setValue(0);
    setDraftEventDate(eventDate);
    setDraftEventDescription(eventDescription);
    setEditingField(null);
  }

  function closeSavedEditor() {
    Keyboard.dismiss();
    dateEditorSheetTranslateY.setValue(0);
    setEditingField(null);
  }

  return (
    <View style={[styles.section, { minHeight: Math.max(screenHeight - 180, 420) }]}>
      <View
        style={[
          styles.form,
          editingField === "description" ? styles.blurredContent : null,
        ]}
      >
        <View style={styles.currentEventCard}>
          <BlackGradient />
          <View style={styles.currentEventContent}>
            <Text style={styles.currentEventEyebrow}>Current event</Text>
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={styles.currentEventTitle}
            >
              {initialEvent.hasEvent
                ? initialEvent.description || "Registered event"
                : "No event registered"}
            </Text>
            <Text numberOfLines={1} style={styles.currentEventMeta}>
              {initialEvent.hasEvent
                ? initialEvent.date || "No date saved"
                : "There isn't any event saved yet"}
            </Text>
          </View>
        </View>

        <View style={styles.rowsStack}>
          <Pressable
            onPress={openDateEditor}
            style={({ pressed }) => [
              styles.detailRow,
              pressed ? styles.detailRowPressed : null,
            ]}
          >
            <View style={styles.detailRowHeader}>
              <View style={styles.detailRowCopy}>
                <Text style={styles.detailRowTitle}>Event date</Text>
                <Text numberOfLines={1} style={styles.detailRowText}>
                  {eventDate || "No date selected"}
                </Text>
              </View>
              <Text style={styles.detailRowAction}>Edit &gt;</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={openDescriptionEditor}
            style={({ pressed }) => [
              styles.detailRow,
              styles.descriptionDetailRow,
              pressed ? styles.detailRowPressed : null,
            ]}
          >
            <View style={[styles.detailRowHeader, styles.descriptionDetailRowHeader]}>
              <View style={styles.detailRowCopy}>
                <Text style={styles.detailRowTitle}>Description</Text>
                <ScrollView
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                  style={styles.descriptionDetailScroll}
                  contentContainerStyle={styles.descriptionDetailScrollContent}
                >
                  <Text style={styles.detailRowText}>
                    {eventDescription || "No description added"}
                  </Text>
                </ScrollView>
              </View>
              <Text style={[styles.detailRowAction, styles.descriptionDetailRowAction]}>
                Edit &gt;
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={openClearConfirm}
            disabled={isSubmitting || !initialEvent.hasEvent}
            style={({ pressed }) => [
              styles.clearEventButton,
              pressed ? styles.clearEventButtonPressed : null,
              isSubmitting || !initialEvent.hasEvent
                ? styles.clearEventButtonDisabled
                : null,
            ]}
          >
            <Text style={styles.clearEventButtonText}>Clear event</Text>
          </Pressable>
        </View>
      </View>

      <WhiteBottomMenu
        visible={clearConfirmVisible}
        onDismiss={closeClearConfirm}
        title="Clear event?"
        description="This removes the saved event date and description from your program."
        buttonText={isSubmitting ? "Saving..." : "Yes, clear event"}
        buttonDisabled={isSubmitting}
        onButtonPress={clearEvent}
      />

      <WhiteBottomMenu
        visible={editingField === "date"}
        onDismiss={closeEditor}
        title="Event date"
        description="Modify the event date"
        buttonText={isSubmitting ? "Saving..." : "Save"}
        buttonDisabled={isSubmitting}
        onButtonPress={saveDateEditor}
        panHandlers={dateEditorSheetDragResponder.panHandlers}
        sheetStyle={{ maxHeight: screenHeight - 32 }}
        animatedStyle={{
          transform: [{ translateY: dateEditorSheetTranslateY }],
        }}
        bottomPadding={16}
        content={
          <View style={styles.dateSelectorWrap}>
            <DateSelector
              value={draftEventDate}
              onChange={setDraftEventDate}
              placeholder="Competition date"
              showInput={false}
              variant="light"
            />
          </View>
        }
      />

      {editingField === "description" ? (
        <>
          <Pressable
            onPress={closeEditor}
            style={styles.editorDimLayer}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            pointerEvents="box-none"
            style={[
              styles.descriptionEditorLayer,
              {
                height: Math.max(screenHeight / 2, 260),
              },
            ]}
          >
            <View style={styles.descriptionEditorCard}>
              <View style={styles.descriptionEditorContent}>
                <Text style={styles.descriptionEditorLabel}>Description</Text>
                <TextInput
                  value={draftEventDescription}
                  onChangeText={setDraftEventDescription}
                  placeholder=""
                  placeholderTextColor="#9ca3af"
                  multiline
                  scrollEnabled
                  autoFocus
                  editable={!isSubmitting}
                  onSubmitEditing={closeEditor}
                  returnKeyType="done"
                  selectionColor="#ffffff"
                  style={styles.descriptionEditorInput}
                />
              </View>
            </View>

            <View style={styles.descriptionEditorActions}>
              <Pressable
                onPress={saveDescriptionEditor}
                disabled={isSubmitting}
                style={[
                  styles.descriptionEditorSaveButton,
                  isSubmitting ? styles.descriptionEditorSaveButtonDisabled : null,
                ]}
              >
                <Text style={styles.descriptionEditorSaveButtonText}>
                  {isSubmitting ? "Saving..." : "Save"}
                </Text>
              </Pressable>

              <Pressable
                onPress={closeEditor}
                disabled={isSubmitting}
                style={[
                  styles.descriptionEditorCancelButton,
                  isSubmitting ? styles.descriptionEditorButtonDisabled : null,
                ]}
              >
                <Text style={styles.descriptionEditorCancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    flex: 1,
    overflow: "visible",
    paddingBottom: 24,
    position: "relative",
  },
  blurredContent: {
    opacity: 0.42,
    filter: [{ blur: 4 }],
  },
  form: {
    gap: 12,
  },
  currentEventCard: {
    borderRadius: 20,
    marginBottom: 26,
    marginTop: 28,
    minHeight: 128,
    overflow: "hidden",
  },
  currentEventContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  currentEventEyebrow: {
    color: "#C9B259",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.4,
    lineHeight: 16,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  currentEventTitle: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 27,
  },
  currentEventMeta: {
    color: "#d4d4d4",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 10,
  },
  rowsStack: {
    gap: 12,
  },
  detailRow: {
    alignSelf: "stretch",
    backgroundColor: "#141414",
    borderColor: "#1E1E1E",
    borderRadius: 20,
    borderWidth: 2,
    minHeight: 84,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  detailRowPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  descriptionDetailRow: {
    height: DESCRIPTION_CONTAINER_HEIGHT,
  },
  detailRowHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
  },
  descriptionDetailRowHeader: {
    alignItems: "flex-start",
    flex: 1,
  },
  detailRowCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  descriptionDetailScroll: {
    alignSelf: "stretch",
    flex: 1,
  },
  descriptionDetailScrollContent: {
    paddingBottom: 2,
  },
  detailRowTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 18,
  },
  detailRowText: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
  detailRowAction: {
    color: "#ffffff",
    flexShrink: 0,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  descriptionDetailRowAction: {
    marginTop: 1,
  },
  clearEventButton: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 12,
    minHeight: 48,
    minWidth: 92,
    paddingVertical: 14,
  },
  clearEventButtonPressed: {
    opacity: 0.72,
  },
  clearEventButtonDisabled: {
    opacity: 0.44,
  },
  clearEventButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.5,
  },
  editorDimLayer: {
    backgroundColor: "rgba(0,0,0,0.58)",
    bottom: -420,
    left: -24,
    position: "absolute",
    right: -24,
    top: -420,
    zIndex: 19,
  },
  descriptionEditorLayer: {
    alignItems: "center",
    justifyContent: "center",
    left: -20,
    paddingHorizontal: 20,
    position: "absolute",
    right: -20,
    top: 0,
    zIndex: 20,
  },
  descriptionEditorCard: {
    alignSelf: "stretch",
    backgroundColor: "#141414",
    borderColor: "#1E1E1E",
    borderRadius: 20,
    borderWidth: 2,
    height: DESCRIPTION_CONTAINER_HEIGHT,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 12,
  },
  descriptionEditorContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  descriptionEditorLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 18,
  },
  descriptionEditorInput: {
    color: "#9ca3af",
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
    marginTop: 4,
    minHeight: 0,
    padding: 0,
    textAlignVertical: "top",
  },
  descriptionEditorActions: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-start",
    marginTop: 10,
  },
  descriptionEditorSaveButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  descriptionEditorSaveButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  descriptionEditorCancelButton: {
    alignItems: "center",
    backgroundColor: "#141414",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  descriptionEditorButtonDisabled: {
    opacity: 0.52,
  },
  descriptionEditorSaveButtonText: {
    color: "#141414",
    fontSize: 12,
    fontWeight: "800",
  },
  descriptionEditorCancelButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },
  dateSelectorWrap: {
    marginHorizontal: -20,
    minHeight: 210,
  },
});
