import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";

const COLORS = {
  panel: "#141414",
  panelBorder: "#1E1E1E",
  text: "#ffffff",
  muted: "#9ca3af",
};

export default function ForumPolicyGateModal({ onAccept, onDecline, onReadPolicy }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDecline}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onDecline} />
        <View style={styles.content}>
          <IBMPlexText style={styles.title}>Forum Policy</IBMPlexText>
          <IBMPlexText style={styles.body}>
            Before you can post, comment, or reply on the Power Training
            forum, you need to accept the Forum Rules and Acceptable Use
            Policy. It covers respectful conduct, prohibited content, and how
            moderation and reporting work.
          </IBMPlexText>
          <TouchableOpacity onPress={onReadPolicy} style={styles.linkButton}>
            <IBMPlexText style={styles.linkText}>Read the Forum Policy</IBMPlexText>
          </TouchableOpacity>
          <View style={styles.actions}>
            <TouchableOpacity onPress={onDecline} style={styles.secondaryButton}>
              <IBMPlexText style={styles.secondaryButtonText}>Not now</IBMPlexText>
            </TouchableOpacity>
            <TouchableOpacity onPress={onAccept} style={styles.primaryButton}>
              <IBMPlexText style={styles.primaryButtonText}>Accept</IBMPlexText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 30,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    opacity: 0.75,
  },
  content: {
    width: "85%",
    backgroundColor: COLORS.panel,
    borderColor: COLORS.panelBorder,
    borderWidth: 2,
    borderRadius: 28,
    padding: 26,
    gap: 14,
  },
  title: {
    color: COLORS.text,
    fontSize: 20, fontWeight: "800",
    lineHeight: 24,
  },
  body: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
  },
  linkButton: {
    alignSelf: "flex-start",
  },
  linkText: {
    color: COLORS.text,
    fontSize: 13, fontWeight: "800",
    lineHeight: 17,
    textDecorationLine: "underline",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.text,
    borderRadius: 999,
    flex: 1,
    height: 44,
    justifyContent: "center",
  },
  primaryButtonText: {
    color: COLORS.panel,
    fontSize: 13, fontWeight: "800",
    lineHeight: 17,
    textTransform: "uppercase",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    height: 44,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 13, fontWeight: "800",
    lineHeight: 17,
    textTransform: "uppercase",
  },
});
