import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVideoPlayer, VideoView } from "expo-video";

import BlackGradient from "../../components/colorComponents/BlackGradient.jsx";

const COLORS = {
  panel: "#141414",
  panelSoft: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.18)",
  text: "#ffffff",
  faint: "#8E8E8E",
  error: "#fca5a5",
};

function PaperAirplaneIcon({ color = "#141414" }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3.8 11.2 20.5 3.6c.8-.4 1.7.4 1.4 1.3l-5.7 16.6c-.3.9-1.5 1-1.9.2l-3.1-6.2-6.6-2.4c-.9-.4-.9-1.5-.1-1.9Z"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <Path
        d="m11.2 15.5 3.6-3.7"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

function TrashIcon() {
  return (
    <View style={styles.trashIcon}>
      <View style={styles.trashIconLid} />
      <View style={styles.trashIconHandle} />
      <View style={styles.trashIconCan}>
        <View style={styles.trashIconLine} />
        <View style={styles.trashIconLine} />
      </View>
    </View>
  );
}

function VideoIcon() {
  return (
    <View style={styles.videoIcon}>
      <View style={styles.videoIconBody} />
      <View style={styles.videoIconLens} />
    </View>
  );
}

function VideoPreview({ uri }) {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.muted = true;
  });

  return (
    <VideoView
      allowsPictureInPicture={false}
      contentFit="cover"
      nativeControls={false}
      player={player}
      pointerEvents="none"
      style={styles.videoPreview}
    />
  );
}

export default function ExerciseAnalysisRequestView({
  exerciseName = "",
  description = "",
  videoUrl = "",
  previewVideoUrl = "",
  isUploadingVideo = false,
  isSubmitting = false,
  error = null,
  onBack,
  onChangeExerciseName,
  onChangeDescription,
  onUploadVideo,
  onRemoveVideo,
  onDiscard,
  onSend,
}) {
  const insets = useSafeAreaInsets();
  const displayVideoUrl = previewVideoUrl || videoUrl;
  const hasVideo = Boolean(displayVideoUrl);
  const formEditingDisabled = isSubmitting;
  const videoActionDisabled = isSubmitting || isUploadingVideo;
  const sendDisabled = isSubmitting || isUploadingVideo || !videoUrl;

  return (
    <View style={styles.screen}>
      <BlackGradient />
      <TouchableOpacity
        onPress={onBack}
        disabled={videoActionDisabled}
        style={styles.backButton}
      >
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardWrap}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: Math.max(insets.top + 58, 82),
              paddingBottom: Math.max(insets.bottom + 32, 56),
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Exercise analysis</Text>
            <Text style={styles.subtitle}>Send a video for coach feedback.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Exercise name</Text>
              <TextInput
                style={styles.input}
                placeholder="Exercise name"
                placeholderTextColor={COLORS.faint}
                value={exerciseName}
                onChangeText={onChangeExerciseName}
                editable={!formEditingDisabled}
                maxLength={140}
                returnKeyType="next"
                selectionColor="#ffffff"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Video</Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={onUploadVideo}
                disabled={videoActionDisabled}
                style={[
                  styles.videoPicker,
                  videoActionDisabled ? styles.videoPickerDisabled : null,
                ]}
              >
                {hasVideo ? (
                  <>
                    <VideoPreview uri={displayVideoUrl} />
                    <View style={styles.videoOverlay}>
                      {isUploadingVideo ? (
                        <ActivityIndicator color={COLORS.text} size="small" />
                      ) : (
                        <Text style={styles.videoOverlayText}>Change video</Text>
                      )}
                    </View>
                  </>
                ) : isUploadingVideo ? (
                  <ActivityIndicator color={COLORS.faint} size="small" />
                ) : (
                  <View style={styles.emptyVideoState}>
                    <VideoIcon />
                    <Text style={styles.emptyVideoTitle}>Upload video</Text>
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.requiredText}>Video is required.</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Advice request</Text>
              <TextInput
                multiline
                style={[styles.input, styles.textArea]}
                placeholder="Describe if you would like specific advice or analysis."
                placeholderTextColor={COLORS.faint}
                value={description}
                onChangeText={onChangeDescription}
                editable={!formEditingDisabled}
                selectionColor="#ffffff"
                textAlignVertical="top"
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={hasVideo ? onRemoveVideo : onDiscard}
              disabled={isSubmitting}
              style={[styles.secondaryButton, isSubmitting ? styles.disabledButton : null]}
            >
              <TrashIcon />
              <Text style={styles.secondaryButtonText}>
                {hasVideo ? "Remove" : "Discard"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSend}
              disabled={sendDisabled}
              style={[styles.primaryButton, sendDisabled ? styles.disabledButton : null]}
            >
              <PaperAirplaneIcon />
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? "Sending..." : "Send"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboardWrap: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: 24,
    paddingHorizontal: 20,
  },
  backButton: {
    left: 0,
    paddingBottom: 8,
    paddingHorizontal: 24,
    paddingTop: 18,
    position: "absolute",
    top: 0,
    zIndex: 20,
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  header: {
    gap: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
  },
  subtitle: {
    color: COLORS.faint,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  form: {
    gap: 18,
  },
  field: {
    gap: 9,
  },
  label: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: COLORS.panel,
    borderColor: "#1E1E1E",
    borderRadius: 14,
    borderWidth: 2,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  textArea: {
    color: "#d1d5db",
    minHeight: 150,
  },
  videoPicker: {
    alignItems: "center",
    aspectRatio: 16 / 10,
    backgroundColor: COLORS.panel,
    borderColor: "#1E1E1E",
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
  },
  videoPickerDisabled: {
    opacity: 0.7,
  },
  videoPreview: {
    height: "100%",
    width: "100%",
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.24)",
    justifyContent: "center",
  },
  videoOverlayText: {
    backgroundColor: "rgba(0,0,0,0.58)",
    borderRadius: 999,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 16,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 8,
    textTransform: "uppercase",
  },
  emptyVideoState: {
    alignItems: "center",
    gap: 10,
  },
  emptyVideoTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 17,
    textTransform: "uppercase",
  },
  requiredText: {
    color: COLORS.faint,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  footer: {
    borderColor: COLORS.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: "auto",
    paddingTop: 16,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.text,
    borderRadius: 999,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    height: 42,
    justifyContent: "center",
  },
  primaryButtonText: {
    color: COLORS.panel,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: COLORS.panelSoft,
    borderColor: COLORS.border,
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    height: 42,
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  disabledButton: {
    opacity: 0.62,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  videoIcon: {
    height: 24,
    position: "relative",
    width: 32,
  },
  videoIconBody: {
    borderColor: COLORS.text,
    borderRadius: 5,
    borderWidth: 2,
    height: 18,
    left: 0,
    position: "absolute",
    top: 3,
    width: 23,
  },
  videoIconLens: {
    borderBottomColor: "transparent",
    borderBottomWidth: 7,
    borderLeftColor: COLORS.text,
    borderLeftWidth: 10,
    borderTopColor: "transparent",
    borderTopWidth: 7,
    height: 0,
    position: "absolute",
    right: 0,
    top: 5,
    width: 0,
  },
  trashIcon: {
    height: 16,
    position: "relative",
    width: 15,
  },
  trashIconLid: {
    backgroundColor: COLORS.text,
    borderRadius: 999,
    height: 2,
    left: 1,
    position: "absolute",
    top: 4,
    width: 13,
  },
  trashIconHandle: {
    borderColor: COLORS.text,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
    borderTopWidth: 2,
    height: 4,
    left: 5,
    position: "absolute",
    top: 1,
    width: 5,
  },
  trashIconCan: {
    alignItems: "center",
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    borderBottomWidth: 1.7,
    borderColor: COLORS.text,
    borderLeftWidth: 1.7,
    borderRightWidth: 1.7,
    flexDirection: "row",
    gap: 2,
    height: 10,
    justifyContent: "center",
    left: 2,
    position: "absolute",
    top: 6,
    width: 11,
  },
  trashIconLine: {
    backgroundColor: COLORS.text,
    borderRadius: 999,
    height: 7,
    opacity: 0.85,
    width: 1.4,
  },
});
