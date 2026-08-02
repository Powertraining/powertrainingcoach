import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { reactiveModel } from "../../services/models/mobxReactiveModel.js";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";

export default function BugReportControl({ screen = "" }) {
  const [visible, setVisible] = useState(false);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function openReport() {
    setError("");
    setVisible(true);
  }

  function closeReport() {
    if (isSubmitting) {
      return;
    }

    setVisible(false);
    setError("");
  }

  async function submitReport() {
    const normalizedDescription = description.trim();

    if (!normalizedDescription || isSubmitting) {
      setError("Please describe what went wrong.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await reactiveModel.submitBugReport?.({
        description: normalizedDescription,
        screen,
      });
      setDescription("");
      setVisible(false);
      reactiveModel.showSuccess?.("Bug report sent. Thank you for helping us improve.");
    } catch (submitError) {
      const message = submitError?.message || "Could not send the bug report.";
      setError(message);
      reactiveModel.showError?.(submitError, message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Pressable
        accessibilityLabel="Report a bug"
        accessibilityRole="button"
        hitSlop={8}
        onPress={openReport}
        style={({ pressed }) => [
          styles.reportButton,
          pressed ? styles.reportButtonPressed : null,
        ]}
      >
        <Ionicons
          color="rgba(255, 255, 255, 0.3)"
          name="bug-outline"
          size={17}
        />
        <IBMPlexText style={styles.reportButtonText}>Report bug</IBMPlexText>
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={closeReport}
        statusBarTranslucent
        transparent
        visible={visible}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalRoot}
        >
          <Pressable onPress={closeReport} style={styles.backdrop} />
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <View style={styles.panelTitleRow}>
                <Ionicons color="#FFFFFF" name="bug-outline" size={21} />
                <IBMPlexText style={styles.panelTitle}>Report a bug</IBMPlexText>
              </View>
              <Pressable
                accessibilityLabel="Close bug report"
                accessibilityRole="button"
                disabled={isSubmitting}
                hitSlop={10}
                onPress={closeReport}
              >
                <Ionicons color="#A7A7AE" name="close" size={24} />
              </Pressable>
            </View>

            <IBMPlexText style={styles.description}>
              Tell us what happened and what you expected. The current screen is attached automatically.
            </IBMPlexText>

            <TextInput
              autoFocus
              editable={!isSubmitting}
              maxLength={2000}
              multiline
              onChangeText={setDescription}
              placeholder="What went wrong?"
              placeholderTextColor="#74747C"
              style={styles.input}
              textAlignVertical="top"
              value={description}
            />

            {error ? <IBMPlexText style={styles.error}>{error}</IBMPlexText> : null}

            <View style={styles.actions}>
              <Pressable
                disabled={isSubmitting}
                onPress={closeReport}
                style={styles.cancelButton}
              >
                <IBMPlexText style={styles.cancelButtonText}>Cancel</IBMPlexText>
              </Pressable>
              <Pressable
                disabled={isSubmitting || !description.trim()}
                onPress={submitReport}
                style={[
                  styles.sendButton,
                  isSubmitting || !description.trim()
                    ? styles.sendButtonDisabled
                    : null,
                ]}
              >
                <IBMPlexText style={styles.sendButtonText}>
                  {isSubmitting ? "Sending..." : "Send report"}
                </IBMPlexText>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  reportButton: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 48,
    minWidth: 92,
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  reportButtonPressed: {
    opacity: 0.72,
  },
  reportButtonText: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
  },
  modalRoot: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.68)",
  },
  panel: {
    backgroundColor: "#111113",
    borderColor: "#303036",
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 440,
    padding: 20,
    width: "100%",
  },
  panelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  panelTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
  },
  panelTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 25,
  },
  description: {
    color: "#A7A7AE",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
  input: {
    backgroundColor: "#09090A",
    borderColor: "#35353B",
    borderRadius: 14,
    borderWidth: 1,
    color: "#FFFFFF",
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 15,
    lineHeight: 21,
    marginTop: 16,
    minHeight: 140,
    padding: 14,
  },
  error: {
    color: "#FF6B6B",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 18,
  },
  cancelButton: {
    alignItems: "center",
    borderColor: "#3A3A40",
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: "#D8D8DE",
    fontSize: 14,
    fontWeight: "700",
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 116,
    paddingHorizontal: 16,
  },
  sendButtonDisabled: {
    opacity: 0.42,
  },
  sendButtonText: {
    color: "#09090A",
    fontSize: 14,
    fontWeight: "800",
  },
});
