import {
  useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVideoPlayer, VideoView } from "expo-video";

import BlackGradient from "../../components/colorComponents/BlackGradient.jsx";
import FadeInFromBottomView from "../../components/navigation/FadeInFromBottomView.jsx";
import WhiteBottomMenu from "../../components/profileComponents/WhiteBottomMenu.jsx";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
const ANALYSIS_SLOTS = ["1", "2"];
const MONTHLY_VIDEO_ANALYSIS_LIMIT = ANALYSIS_SLOTS.length;
const GOLD = "#C9B259";

function AnalysisVideoPreview({ uri }) {
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
      style={styles.analysisVideoPreview}
    />
  );
}

function AnalysisSlotContent({ post }) {
  if (post?.mediaUrl && post?.mediaType === "video") {
    return (
      <View style={styles.analysisPreviewWrap}>
        <AnalysisVideoPreview uri={post.mediaUrl} />
        <View style={styles.analysisPreviewOverlay}>
          <View style={styles.analysisPlayIcon} />
        </View>
        {post.title ? (
          <View style={styles.analysisTitleScrim}>
            <IBMPlexText numberOfLines={1} style={styles.analysisTitleText}>
              {post.title}
            </IBMPlexText>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.plusIcon}>
      <View style={styles.plusIconHorizontal} />
      <View style={styles.plusIconVertical} />
    </View>
  );
}

export default function SubscriptionDetailsView({
  planName = "No Plan",
  subscribedText = "",
  nextBillingText = "",
  isSubmitting = false,
  error = null,
  onBack,
  onChangePaymentMethod,
  onCancelSubscription,
  onPressAnalysisSlot,
  analysisPostsBySlot = {},
  analysesLeftThisMonth = MONTHLY_VIDEO_ANALYSIS_LIMIT,
  onShowAllAnalyses,
}) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const [cancelConfirmVisible, setCancelConfirmVisible] = useState(false);
  const analysisSlotWidth = Math.min(
    180,
    Math.max(0, (windowWidth - 40 - 12) / 2)
  );

  function openCancelConfirm() {
    if (isSubmitting) {
      return;
    }

    setCancelConfirmVisible(true);
  }

  function closeCancelConfirm() {
    if (isSubmitting) {
      return;
    }

    setCancelConfirmVisible(false);
  }

  function confirmCancelSubscription() {
    setCancelConfirmVisible(false);
    onCancelSubscription?.();
  }

  return (
    <View style={styles.screen}>
      <BlackGradient />
      <TouchableOpacity
        onPress={onBack}
        disabled={isSubmitting}
        style={styles.backButton}
      >
        <IBMPlexText style={styles.backButtonText}>Go Back</IBMPlexText>
      </TouchableOpacity>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 12, 20),
            paddingBottom: Math.max(insets.bottom + 32, 56),
          },
        ]}
      >
        <FadeInFromBottomView delay={40} style={styles.planHeader}>
          <IBMPlexText style={styles.planTitle}>{`{ ${planName} }`}</IBMPlexText>
          {subscribedText ? (
            <IBMPlexText style={styles.subscribedText}>{subscribedText}</IBMPlexText>
          ) : null}
        </FadeInFromBottomView>

        <FadeInFromBottomView delay={100} style={styles.section}>
          <View style={styles.sectionHeader}>
            <IBMPlexText style={styles.sectionTitle}>Analyses</IBMPlexText>
            <IBMPlexText style={styles.analysisCounterText}>
              {`${analysesLeftThisMonth}/${MONTHLY_VIDEO_ANALYSIS_LIMIT} video analyses left this month`}
            </IBMPlexText>
            <View style={styles.sectionDivider} />
          </View>

          <View style={styles.analysisRow}>
            {ANALYSIS_SLOTS.map((slot) => (
              <TouchableOpacity
                key={slot}
                onPress={() => onPressAnalysisSlot?.(slot, analysisPostsBySlot?.[slot] || null)}
                disabled={isSubmitting}
                style={[
                  styles.analysisButton,
                  { width: analysisSlotWidth },
                  analysisPostsBySlot?.[slot] ? styles.analysisButtonFilled : null,
                  isSubmitting ? styles.analysisButtonDisabled : null,
                ]}
              >
                <AnalysisSlotContent post={analysisPostsBySlot?.[slot] || null} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            onPress={onShowAllAnalyses}
            disabled={isSubmitting}
            style={[styles.showAllButton, isSubmitting ? styles.optionRowDisabled : null]}
          >
            <IBMPlexText style={styles.showAllButtonText}>Show all</IBMPlexText>
          </TouchableOpacity>
        </FadeInFromBottomView>

        <FadeInFromBottomView delay={160} style={[styles.section, styles.optionsSection]}>
          <View style={styles.sectionHeader}>
            <IBMPlexText style={styles.sectionTitle}>Options</IBMPlexText>
            <View style={styles.sectionDivider} />
          </View>

          <View style={styles.optionRows}>
            <TouchableOpacity
              onPress={onChangePaymentMethod}
              disabled={isSubmitting}
              style={[styles.optionRow, isSubmitting ? styles.optionRowDisabled : null]}
            >
              <IBMPlexText style={styles.optionRowText}>Change payment method</IBMPlexText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={openCancelConfirm}
              disabled={isSubmitting}
              style={[styles.optionRow, isSubmitting ? styles.optionRowDisabled : null]}
            >
              <IBMPlexText style={styles.optionRowText}>Cancel plan</IBMPlexText>
            </TouchableOpacity>
          </View>

          {nextBillingText ? (
            <IBMPlexText style={styles.nextBillingText}>{nextBillingText}</IBMPlexText>
          ) : null}
        </FadeInFromBottomView>

        {error ? (
          <FadeInFromBottomView delay={220}>
            <IBMPlexText style={styles.error}>{error}</IBMPlexText>
          </FadeInFromBottomView>
        ) : null}
      </ScrollView>
      <WhiteBottomMenu
        visible={cancelConfirmVisible}
        onDismiss={closeCancelConfirm}
        title="Cancel plan?"
        description="Are you sure you want to cancel your current plan?"
        buttonText={isSubmitting ? "Opening..." : "Yes, cancel plan"}
        buttonDisabled={isSubmitting}
        onButtonPress={confirmCancelSubscription}
        secondaryButtonText="Keep plan"
        secondaryButtonDisabled={isSubmitting}
        onSecondaryButtonPress={closeCancelConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: 34,
    paddingHorizontal: 20,
  },
  pageHeader: {
    gap: 14,
  },
  backButton: {
    position: "absolute",
    top: 0,
    left: 0,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 8,
    zIndex: 20,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 14, fontWeight: "700",
    lineHeight: 18,
  },
  planHeader: {
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    minHeight: 170,
  },
  planTitle: {
    color: "#ffffff",
    fontSize: 20, fontWeight: "700",
    lineHeight: 26,
    textAlign: "center",
  },
  subscribedText: {
    color: GOLD,
    fontSize: 12, fontWeight: "700",
    lineHeight: 16,
    textAlign: "center",
  },
  section: {
    gap: 14,
  },
  optionsSection: {
    marginTop: "auto",
  },
  sectionHeader: {
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18, fontWeight: "900",
    lineHeight: 23,
    textAlign: "center",
  },
  analysisCounterText: {
    color: "#9ca3af",
    fontSize: 12, fontWeight: "800",
    lineHeight: 16,
    textAlign: "center",
  },
  sectionDivider: {
    backgroundColor: "#ffffff",
    height: 1,
    opacity: 0.42,
    width: "100%",
  },
  analysisRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  showAllButton: {
    alignSelf: "center",
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: 8,
  },
  showAllButtonText: {
    color: GOLD,
    fontSize: 12, fontWeight: "900",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  analysisButton: {
    alignItems: "center",
    aspectRatio: 9 / 16,
    backgroundColor: "#141414",
    borderColor: "#1E1E1E",
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: "hidden",
  },
  analysisButtonFilled: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  analysisButtonDisabled: {
    opacity: 0.55,
  },
  plusIcon: {
    height: 28,
    position: "relative",
    width: 28,
  },
  plusIconHorizontal: {
    backgroundColor: "#8E8E8E",
    borderRadius: 999,
    height: 4,
    left: 3,
    position: "absolute",
    top: 12,
    width: 22,
  },
  plusIconVertical: {
    backgroundColor: "#8E8E8E",
    borderRadius: 999,
    height: 22,
    left: 12,
    position: "absolute",
    top: 3,
    width: 4,
  },
  analysisPreviewWrap: {
    height: "100%",
    position: "relative",
    width: "100%",
  },
  analysisVideoPreview: {
    height: "100%",
    width: "100%",
  },
  analysisPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.16)",
    justifyContent: "center",
  },
  analysisPlayIcon: {
    borderBottomColor: "transparent",
    borderBottomWidth: 9,
    borderLeftColor: "#ffffff",
    borderLeftWidth: 14,
    borderTopColor: "transparent",
    borderTopWidth: 9,
    height: 0,
    marginLeft: 3,
    width: 0,
  },
  analysisTitleScrim: {
    backgroundColor: "rgba(0,0,0,0.62)",
    bottom: 0,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 5,
    position: "absolute",
    right: 0,
  },
  analysisTitleText: {
    color: "#ffffff",
    fontSize: 10, fontWeight: "900",
    lineHeight: 13,
  },
  optionRows: {
    gap: 10,
  },
  optionRow: {
    alignItems: "center",
    backgroundColor: "#141414",
    borderColor: "#1E1E1E",
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  optionRowText: {
    color: "#ffffff",
    fontSize: 14, fontWeight: "900",
    lineHeight: 18,
    textAlign: "center",
  },
  optionRowDisabled: {
    opacity: 0.55,
  },
  nextBillingText: {
    color: "#9ca3af",
    fontSize: 12, fontWeight: "700",
    lineHeight: 17,
    textAlign: "center",
  },
  error: {
    color: "#fca5a5",
    fontSize: 12, fontWeight: "700",
    lineHeight: 17,
    textAlign: "center",
  },
});
