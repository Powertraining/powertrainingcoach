import {
  useEffect,
  useMemo,
  useRef,
  useState } from "react";
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import BlackGradient from "../../components/colorComponents/BlackGradient.jsx";
import FadeInFromBottomView from "../../components/navigation/FadeInFromBottomView.jsx";
import WhiteBottomMenu from "../../components/profileComponents/WhiteBottomMenu.jsx";
import { parseInjuryReport } from "../../services/utils/profileFields.js";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
const COLORS = {
  gold: "#C9B259",
};
const INJURY_CONTAINER_HEIGHT = 252;
const INJURY_EDITOR_HEIGHT = 504;

export default function ProfileReportInjuryView({
  value,
  isSubmitting,
  onChange,
  onSaveChange,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const physicalScreenHeight = Dimensions.get("screen").height;
  const initialInjuryReport = useMemo(() => parseInjuryReport(value), [value]);
  const [injuryReport, setInjuryReport] = useState(initialInjuryReport);
  const [draftInjuryReport, setDraftInjuryReport] = useState(initialInjuryReport);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const isEditorVisibleRef = useRef(false);
  const overlayHeight = Math.max(screenHeight, physicalScreenHeight) + keyboardHeight;
  const hasInjuryReport = Boolean(injuryReport);

  useEffect(() => {
    setInjuryReport(initialInjuryReport);
    setDraftInjuryReport(initialInjuryReport);
  }, [initialInjuryReport]);

  useEffect(() => {
    isEditorVisibleRef.current = isEditorVisible;
  }, [isEditorVisible]);

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

      if (isEditorVisibleRef.current) {
        saveEditor();
      }
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [draftInjuryReport]);

  function openEditor() {
    setDraftInjuryReport(injuryReport);
    setIsEditorVisible(true);
  }

  function closeEditor() {
    isEditorVisibleRef.current = false;
    Keyboard.dismiss();
    setDraftInjuryReport(injuryReport);
    setIsEditorVisible(false);
  }

  function saveEditor() {
    const nextInjuryReport = draftInjuryReport.trim();
    isEditorVisibleRef.current = false;
    setInjuryReport(nextInjuryReport);
    setDraftInjuryReport(nextInjuryReport);
    onChange?.(nextInjuryReport);
    onSaveChange?.(nextInjuryReport);
    Keyboard.dismiss();
    setIsEditorVisible(false);
  }

  function openClearConfirm() {
    setClearConfirmVisible(true);
  }

  function closeClearConfirm() {
    setClearConfirmVisible(false);
  }

  function clearInjuryReport() {
    setInjuryReport("");
    setDraftInjuryReport("");
    onChange?.("");
    onSaveChange?.("");
    closeClearConfirm();
  }

  return (
    <View style={[styles.section, { minHeight: Math.max(screenHeight - 180, 420) }]}>
      <View style={[styles.form, isEditorVisible ? styles.blurredContent : null]}>
        <FadeInFromBottomView delay={50}>
          <View style={styles.currentInjuryCard}>
            <BlackGradient />
            <View style={styles.currentInjuryContent}>
              <IBMPlexText style={styles.currentInjuryEyebrow}>Current injury report</IBMPlexText>
              <IBMPlexText
                numberOfLines={2}
                ellipsizeMode="tail"
                style={styles.currentInjuryTitle}
              >
                {hasInjuryReport ? injuryReport : "No injury reported"}
              </IBMPlexText>
              <IBMPlexText numberOfLines={1} style={styles.currentInjuryMeta}>
                {hasInjuryReport
                  ? "Injuries and limitations saved"
                  : "There isn't any injury report saved yet"}
              </IBMPlexText>
            </View>
          </View>
        </FadeInFromBottomView>

        <View style={styles.rowsStack}>
          <FadeInFromBottomView delay={110}>
            <Pressable
              onPress={openEditor}
              style={({ pressed }) => [
                styles.detailRow,
                styles.injuryDetailRow,
                pressed ? styles.detailRowPressed : null,
              ]}
            >
              <View style={[styles.detailRowHeader, styles.injuryDetailRowHeader]}>
                <View style={styles.detailRowCopy}>
                  <IBMPlexText style={styles.detailRowTitle}>Injury details</IBMPlexText>
                  <ScrollView
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                    style={styles.injuryDetailScroll}
                    contentContainerStyle={styles.injuryDetailScrollContent}
                  >
                    <IBMPlexText style={styles.detailRowText}>
                      {injuryReport || "No injuries or limitations added"}
                    </IBMPlexText>
                  </ScrollView>
                </View>
                <IBMPlexText style={[styles.detailRowAction, styles.injuryDetailRowAction]}>
                  Edit &gt;
                </IBMPlexText>
              </View>
            </Pressable>
          </FadeInFromBottomView>

          <FadeInFromBottomView delay={170}>
            <Pressable
              onPress={openClearConfirm}
              disabled={isSubmitting || !hasInjuryReport}
              style={({ pressed }) => [
                styles.clearInjuryButton,
                pressed ? styles.clearInjuryButtonPressed : null,
                isSubmitting || !hasInjuryReport
                  ? styles.clearInjuryButtonDisabled
                  : null,
              ]}
            >
              <IBMPlexText style={styles.clearInjuryButtonText}>Clear injury</IBMPlexText>
            </Pressable>
          </FadeInFromBottomView>
        </View>
      </View>

      <WhiteBottomMenu
        visible={clearConfirmVisible}
        onDismiss={closeClearConfirm}
        title="Clear injury?"
        description="This removes the saved injury details from your program."
        buttonText={isSubmitting ? "Saving..." : "Yes, clear injury"}
        buttonDisabled={isSubmitting}
        onButtonPress={clearInjuryReport}
      />

      {isEditorVisible ? (
        <>
          <Pressable
            onPress={saveEditor}
            style={[styles.editorDimLayer, { height: overlayHeight }]}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            pointerEvents="box-none"
            style={[
              styles.injuryEditorLayer,
              {
                height: Math.max(screenHeight / 2, INJURY_EDITOR_HEIGHT + 64),
              },
            ]}
          >
            <View style={styles.injuryEditorCard}>
              <View style={styles.injuryEditorContent}>
                <IBMPlexText style={styles.injuryEditorLabel}>Injury details</IBMPlexText>
                <TextInput
                  value={draftInjuryReport}
                  onChangeText={setDraftInjuryReport}
                  placeholder=""
                  placeholderTextColor="#9ca3af"
                  multiline
                  scrollEnabled
                  autoFocus
                  editable={!isSubmitting}
                  returnKeyType="done"
                  selectionColor="#ffffff"
                  style={styles.injuryEditorInput}
                />
              </View>
            </View>

            <View style={styles.injuryEditorActions}>
              <Pressable
                onPress={saveEditor}
                disabled={isSubmitting}
                style={[
                  styles.injuryEditorSaveButton,
                  isSubmitting ? styles.injuryEditorSaveButtonDisabled : null,
                ]}
              >
                <IBMPlexText style={styles.injuryEditorSaveButtonText}>
                  {isSubmitting ? "Saving..." : "Save"}
                </IBMPlexText>
              </Pressable>

              <Pressable
                onPress={closeEditor}
                disabled={isSubmitting}
                style={[
                  styles.injuryEditorCancelButton,
                  isSubmitting ? styles.injuryEditorButtonDisabled : null,
                ]}
              >
                <IBMPlexText style={styles.injuryEditorCancelButtonText}>Cancel</IBMPlexText>
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
  currentInjuryCard: {
    borderRadius: 20,
    marginBottom: 26,
    marginTop: 28,
    minHeight: 128,
    overflow: "hidden",
  },
  currentInjuryContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  currentInjuryEyebrow: {
    color: "#C9B259",
    fontSize: 12, fontWeight: "900",
    letterSpacing: 0.4,
    lineHeight: 16,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  currentInjuryTitle: {
    color: "#ffffff",
    fontSize: 22, fontWeight: "900",
    lineHeight: 27,
  },
  currentInjuryMeta: {
    color: "#d4d4d4",
    fontSize: 13, fontWeight: "700",
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
  injuryDetailRow: {
    height: INJURY_CONTAINER_HEIGHT,
  },
  detailRowHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
  },
  injuryDetailRowHeader: {
    alignItems: "flex-start",
    flex: 1,
  },
  detailRowCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  injuryDetailScroll: {
    alignSelf: "stretch",
    flex: 1,
  },
  injuryDetailScrollContent: {
    paddingBottom: 2,
  },
  detailRowTitle: {
    color: "#ffffff",
    fontSize: 15, fontWeight: "800",
    lineHeight: 18,
  },
  detailRowText: {
    color: "#9ca3af",
    fontSize: 13, fontWeight: "600",
    lineHeight: 17,
  },
  detailRowAction: {
    color: COLORS.gold,
    flexShrink: 0,
    fontSize: 12, fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  injuryDetailRowAction: {
    marginTop: 1,
  },
  clearInjuryButton: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 12,
    minHeight: 48,
    minWidth: 92,
    paddingVertical: 14,
  },
  clearInjuryButtonPressed: {
    opacity: 0.72,
  },
  clearInjuryButtonDisabled: {
    opacity: 0.44,
  },
  clearInjuryButtonText: {
    color: "#fff",
    fontSize: 16, fontWeight: "600",
    opacity: 0.5,
  },
  editorDimLayer: {
    backgroundColor: "rgba(0,0,0,0.58)",
    left: -24,
    position: "absolute",
    right: -24,
    top: -420,
    zIndex: 19,
  },
  injuryEditorLayer: {
    alignItems: "center",
    justifyContent: "center",
    left: -20,
    paddingHorizontal: 20,
    position: "absolute",
    right: -20,
    top: 0,
    zIndex: 20,
  },
  injuryEditorCard: {
    alignSelf: "stretch",
    backgroundColor: "#141414",
    borderColor: "#1E1E1E",
    borderRadius: 20,
    borderWidth: 2,
    height: INJURY_EDITOR_HEIGHT,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 12,
  },
  injuryEditorContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  injuryEditorLabel: {
    color: "#ffffff",
    fontSize: 15, fontWeight: "800",
    lineHeight: 18,
  },
  injuryEditorInput: {
    color: "#9ca3af",
    flex: 1,
    fontSize: 13, fontWeight: "600",
    lineHeight: 17,
    marginTop: 4,
    minHeight: 0,
    padding: 0,
    textAlignVertical: "top",
  },
  injuryEditorActions: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-start",
    marginTop: 10,
  },
  injuryEditorSaveButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  injuryEditorSaveButtonDisabled: {
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  injuryEditorCancelButton: {
    alignItems: "center",
    backgroundColor: "#141414",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  injuryEditorButtonDisabled: {
    opacity: 0.52,
  },
  injuryEditorSaveButtonText: {
    color: "#141414",
    fontSize: 12, fontWeight: "800",
  },
  injuryEditorCancelButtonText: {
    color: "#ffffff",
    fontSize: 12, fontWeight: "800",
  },
});
