import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";
import QuestionnaireChatMessage from "../components/questionnaireComponents/QuestionnaireChatMessage.jsx";
import {
  calculateManualProgramMaxKg,
  MANUAL_MAX_CONFIDENCE_OPTIONS,
} from "../services/utils/strengthAssessment.js";
import {
  formatWeightFromKilograms,
  getKilogramsFromDisplayWeight,
  getWeightUnit,
} from "../services/utils/measurementUnits.js";

const ACCENT = "#E3262E";
const READY = "#34C759";
const RPE = "#FF9F0A";
const DESCRIPTION_COLLAPSE_END = 64;
const HEADER_COLLAPSE_END = 126;
const TITLE_COLLAPSE_START = 72;
const TITLE_COLLAPSE_END = 110;
const COLLAPSED_HEADER_HEIGHT = 64;
const EXPANDED_HEADER_HEIGHT = 184;
const FOOTER_CLEARANCE = 92;
const LIFT_IMAGE_MATCHERS = Object.freeze([
  ["hang clean", require("../assets/icons/sports/hangClean.png")],
  ["power clean", require("../assets/icons/sports/powerClean.png")],
  ["push press", require("../assets/icons/sports/pushPress.png")],
  ["split jerk", require("../assets/icons/sports/splitJerk.png")],
  ["bench", require("../assets/icons/sports/benchPress.png")],
  ["deadlift", require("../assets/icons/sports/deadLift.png")],
  ["overhead", require("../assets/icons/sports/overheadPress.png")],
  ["row", require("../assets/icons/sports/row.png")],
  ["squat", require("../assets/icons/sports/squat.png")],
]);

function getLiftImage(liftName = "") {
  const normalizedName = liftName.trim().toLowerCase();
  return LIFT_IMAGE_MATCHERS.find(([keyword]) =>
    normalizedName.includes(keyword)
  )?.[1] || null;
}

function createDrafts(lifts = []) {
  return Object.fromEntries(
    lifts
      .filter((lift) => !lift.programMaxKg)
      .map((lift) => [lift.liftKey, { confidence: "", displayValue: "" }])
  );
}

function getDraftProgramMaxKg(draft, unitSystem) {
  return calculateManualProgramMaxKg({
    enteredOneRepMaxKg: getKilogramsFromDisplayWeight(draft?.displayValue, unitSystem),
    confidence: draft?.confidence,
    unitSystem,
  });
}

function LiftMaxCard({
  disabled,
  draft,
  lift,
  onChange,
  onFocus,
  unitSystem,
}) {
  const imageSource = getLiftImage(lift.liftName);
  const unit = getWeightUnit(unitSystem);
  const existing = Boolean(lift.programMaxKg);
  const displayValue = draft?.displayValue || "";
  const programMaxKg = existing
    ? lift.programMaxKg
    : getDraftProgramMaxKg(draft, unitSystem);
  const ready = Boolean(programMaxKg);

  return (
    <View
      accessibilityLabel={`${lift.liftName}. ${
        ready ? "Program Max ready" : "Program Max missing"
      }`}
      style={[
        styles.liftCard,
      ]}
    >
      <View style={styles.liftMainRow}>
        <View style={styles.liftIconBox}>
          {imageSource ? (
            <Image resizeMode="contain" source={imageSource} style={styles.liftImage} />
          ) : (
            <IBMPlexText defaultWhite lines={2} style={styles.liftIconFallback}>
              {lift.liftName}
            </IBMPlexText>
          )}
        </View>

        <View style={styles.liftCopy}>
          <IBMPlexText defaultWhite style={styles.liftName}>{lift.liftName}</IBMPlexText>
          <IBMPlexText style={existing ? styles.savedMaxText : styles.liftHelper}>
            {existing
              ? `Program Max ${formatWeightFromKilograms(lift.programMaxKg, unitSystem)}`
              : "Current or estimated 1RM"}
          </IBMPlexText>
          <IBMPlexText style={[styles.liftStatus, ready ? styles.readyText : styles.rpeText]}>
            {ready
              ? existing
                ? "Percentage loading from Week 1"
                : `Program Max ${formatWeightFromKilograms(programMaxKg, unitSystem)}`
              : "RPE loading in Week 1"}
          </IBMPlexText>
        </View>

        {existing ? (
          <View style={styles.readyBadge}>
            <IBMPlexText style={styles.readyBadgeText}>READY</IBMPlexText>
          </View>
        ) : (
          <View style={styles.inputShell}>
            <TextInput
              accessibilityLabel={`${lift.liftName} current or estimated one rep max`}
              editable={!disabled}
              keyboardType="decimal-pad"
              onChangeText={(value) => onChange?.({
                ...draft,
                confidence: value ? draft?.confidence || "" : "",
                displayValue: value,
              })}
              onFocus={(event) => {
                onFocus?.(event);
              }}
              placeholder="—"
              placeholderTextColor="#616169"
              selectionColor={ACCENT}
              style={styles.weightInput}
              value={displayValue}
            />
            <IBMPlexText style={styles.weightUnit}>{unit}</IBMPlexText>
          </View>
        )}
      </View>

      {!existing && displayValue ? (
        <View style={styles.confidenceWrap}>
          <IBMPlexText style={styles.confidenceLabel}>CONFIDENCE</IBMPlexText>
          <View style={styles.confidenceRow}>
            {[...MANUAL_MAX_CONFIDENCE_OPTIONS].reverse().map((option) => {
              const selected = draft?.confidence === option.value;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  disabled={disabled}
                  key={option.value}
                  onPress={() => onChange?.({
                    ...draft,
                    confidence: selected ? "" : option.value,
                  })}
                  style={[
                    styles.confidenceButton,
                    selected ? styles.confidenceButtonSelected : null,
                  ]}
                >
                  <IBMPlexText
                    style={[
                      styles.confidenceButtonText,
                      selected ? styles.confidenceButtonTextSelected : null,
                    ]}
                  >
                    {option.label}
                  </IBMPlexText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function ReviewLiftCard({ draft, lift, unitSystem }) {
  const imageSource = getLiftImage(lift.liftName);
  const unit = getWeightUnit(unitSystem);
  const programMaxKg = lift.programMaxKg || getDraftProgramMaxKg(draft, unitSystem);
  const confidenceLabel = MANUAL_MAX_CONFIDENCE_OPTIONS.find(
    (option) => option.value === draft?.confidence
  )?.label;
  const hasProgramMax = Boolean(programMaxKg);

  return (
    <View style={styles.liftCard}>
      <View style={styles.liftMainRow}>
        <View style={styles.liftIconBox}>
          {imageSource ? (
            <Image resizeMode="contain" source={imageSource} style={styles.liftImage} />
          ) : (
            <IBMPlexText defaultWhite lines={2} style={styles.liftIconFallback}>
              {lift.liftName}
            </IBMPlexText>
          )}
        </View>

        <View style={styles.liftCopy}>
          <IBMPlexText defaultWhite style={styles.liftName}>{lift.liftName}</IBMPlexText>
          <IBMPlexText style={styles.liftHelper}>
            {lift.programMaxKg
              ? "Current Program Max"
              : draft?.displayValue
                ? `Entered ${draft.displayValue} ${unit} · ${confidenceLabel || "Confidence selected"}`
                : "No max entered"}
          </IBMPlexText>
          <IBMPlexText
            style={[styles.liftStatus, hasProgramMax ? styles.readyText : styles.rpeText]}
          >
            {hasProgramMax
              ? "Percentage loading from Week 1"
              : "1 top set at RPE 8–10 in Week 1"}
          </IBMPlexText>
        </View>

        <View style={styles.reviewValueBox}>
          <IBMPlexText
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            numberOfLines={1}
            style={[styles.reviewValue, hasProgramMax ? styles.readyText : styles.rpeText]}
          >
            {hasProgramMax
              ? formatWeightFromKilograms(programMaxKg, unitSystem)
              : "RPE"}
          </IBMPlexText>
        </View>
      </View>
    </View>
  );
}

export default function ProgramMaxSetupFlowView({
  requiredLifts = [],
  unitSystem = "metric",
  submitting = false,
  developerPreview = false,
  errorMessage = "",
  onBack,
  onComplete,
}) {
  const insets = useSafeAreaInsets();
  const windowDimensions = useWindowDimensions();
  const scrollRef = useRef(null);
  const focusedInputTargetRef = useRef(null);
  const keyboardVisibleRef = useRef(false);
  const entrance = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const [drafts, setDrafts] = useState(() => createDrafts(requiredLifts));
  const [reviewing, setReviewing] = useState(false);
  const [bodyHeight, setBodyHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [viewportDimensions, setViewportDimensions] = useState({
    height: 0,
    width: 0,
  });
  const screenHeight = viewportDimensions.height || windowDimensions.height;
  const screenWidth = viewportDimensions.width || windowDimensions.width;

  useEffect(() => {
    setDrafts((current) => ({ ...createDrafts(requiredLifts), ...current }));
  }, [requiredLifts]);

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  useEffect(() => {
    const eventName = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const subscription = Keyboard.addListener(eventName, () => {
      keyboardVisibleRef.current = true;
      setKeyboardVisible(true);
      const target = focusedInputTargetRef.current;
      if (target) {
        scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard?.(
          target,
          24,
          true
        );
      }
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      keyboardVisibleRef.current = false;
      setKeyboardVisible(false);
      focusedInputTargetRef.current = null;
    });
    return () => {
      subscription.remove();
      hideSubscription.remove();
    };
  }, []);

  function keepFocusedInputVisible() {
    const target = focusedInputTargetRef.current;
    if (!keyboardVisibleRef.current || !target) {
      return;
    }

    requestAnimationFrame(() =>
      scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard?.(
        target,
        24,
        true
      )
    );
  }

  const manualMaxes = useMemo(
    () =>
      requiredLifts.flatMap((lift) => {
        if (lift.programMaxKg) {
          return [];
        }

        const draft = drafts[lift.liftKey] || {};
        const programMaxKg = getDraftProgramMaxKg(draft, unitSystem);
        if (!programMaxKg) {
          return [];
        }

        return [{
          liftName: lift.liftName,
          enteredOneRepMaxKg: getKilogramsFromDisplayWeight(draft.displayValue, unitSystem),
          confidence: draft.confidence,
        }];
      }),
    [drafts, requiredLifts, unitSystem]
  );
  const unresolvedLifts = requiredLifts.filter((lift) => !lift.programMaxKg);
  const reviewReadyCount = requiredLifts.filter(
    (lift) => lift.programMaxKg || getDraftProgramMaxKg(drafts[lift.liftKey], unitSystem)
  ).length;
  const reviewRpeCount = Math.max(requiredLifts.length - reviewReadyCount, 0);
  const expandedHeaderHeight =
    insets.top + EXPANDED_HEADER_HEIGHT + (reviewing ? 58 : 0);
  const requiredScrollRange = Math.max(
    0,
    expandedHeaderHeight + bodyHeight - (screenHeight - FOOTER_CLEARANCE)
  );
  const needsScrolling = bodyHeight > 0 && requiredScrollRange > 0;
  const scrollRange = needsScrolling
    ? Math.max(requiredScrollRange, HEADER_COLLAPSE_END)
    : 0;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, DESCRIPTION_COLLAPSE_END, HEADER_COLLAPSE_END],
    outputRange: [
      expandedHeaderHeight,
      expandedHeaderHeight - 68,
      insets.top + COLLAPSED_HEADER_HEIGHT,
    ],
    extrapolate: "clamp",
  });
  const descriptionOpacity = scrollY.interpolate({
    inputRange: [0, 38, DESCRIPTION_COLLAPSE_END],
    outputRange: [1, 0.7, 0],
    extrapolate: "clamp",
  });
  const titleOpacity = scrollY.interpolate({
    inputRange: [TITLE_COLLAPSE_START, 94, TITLE_COLLAPSE_END],
    outputRange: [1, 0.75, 0],
    extrapolate: "clamp",
  });
  const titleScale = scrollY.interpolate({
    inputRange: [TITLE_COLLAPSE_START, TITLE_COLLAPSE_END],
    outputRange: [1, 0.58],
    extrapolate: "clamp",
  });
  const titleTranslateX = scrollY.interpolate({
    inputRange: [TITLE_COLLAPSE_START, TITLE_COLLAPSE_END],
    outputRange: [0, Math.min(105, screenWidth * 0.26)],
    extrapolate: "clamp",
  });
  const titleTranslateY = scrollY.interpolate({
    inputRange: [TITLE_COLLAPSE_START, TITLE_COLLAPSE_END],
    outputRange: [0, -64],
    extrapolate: "clamp",
  });
  const compactTitleOpacity = scrollY.interpolate({
    inputRange: [94, TITLE_COLLAPSE_END],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  function handleSubmit() {
    if (!submitting) {
      Keyboard.dismiss();
      if (!reviewing) {
        setReviewing(true);
        scrollRef.current?.scrollTo?.({ animated: true, y: 0 });
        return;
      }
      onComplete?.({ manualMaxes });
    }
  }

  return (
    <View
      onLayout={(event) => {
        const { height, width } = event.nativeEvent.layout;
        const nextDimensions = {
          height: Math.round(height),
          width: Math.round(width),
        };

        setViewportDimensions((current) =>
          current.height === nextDimensions.height &&
          current.width === nextDimensions.width
            ? current
            : nextDimensions
        );
      }}
      style={styles.screen}
    >
      <Animated.View
        style={[
          styles.content,
          {
            opacity: entrance,
            transform: [{
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [14, 0],
              }),
            }],
          },
        ]}
      >
        <Animated.ScrollView
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          contentContainerStyle={[
            styles.scrollContent,
            {
              minHeight: screenHeight + scrollRange,
              paddingBottom: Math.max(insets.bottom, 18) + FOOTER_CLEARANCE,
              paddingTop: expandedHeaderHeight + 10,
            },
          ]}
          bounces={false}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={keepFocusedInputVisible}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          ref={scrollRef}
          scrollEnabled={needsScrolling || keyboardVisible}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          <View
            onLayout={(event) => {
              const nextHeight = Math.ceil(event.nativeEvent.layout.height);
              setBodyHeight((current) => current === nextHeight ? current : nextHeight);
            }}
            style={styles.body}
          >
            <View style={styles.liftList}>
              {(reviewing ? requiredLifts : unresolvedLifts).map((lift, index) => (
                <QuestionnaireChatMessage
                  delay={Math.min(index * 55, 220)}
                  key={`${reviewing ? "review" : "entry"}-${lift.liftKey}`}
                >
                  {reviewing ? (
                    <ReviewLiftCard
                      draft={drafts[lift.liftKey] || {}}
                      lift={lift}
                      unitSystem={unitSystem}
                    />
                  ) : (
                    <LiftMaxCard
                      draft={drafts[lift.liftKey] || {}}
                      lift={lift}
                      onChange={(draft) => setDrafts((current) => ({ ...current, [lift.liftKey]: draft }))}
                      onFocus={(event) => {
                        const target = event.target || event.nativeEvent?.target;
                        focusedInputTargetRef.current = target;
                        keepFocusedInputVisible();
                      }}
                      unitSystem={unitSystem}
                    />
                  )}
                </QuestionnaireChatMessage>
              ))}
            </View>

            <View style={styles.infoBox}>
              <IBMPlexText style={styles.infoMark}>i</IBMPlexText>
              <IBMPlexText style={styles.infoText}>
                {reviewing
                  ? "Missing lifts stay RPE-based for all of Week 1. A suitable 3–5 rep top set at RPE 8–10 becomes active as a Program Max from Week 2."
                  : "For each entered max, choose how current it is. The app uses 100%, 90%, or 80% as the Program Max. Blank lifts start with RPE."}
              </IBMPlexText>
            </View>

            <View style={styles.errorSlot}>
              {errorMessage ? (
                <IBMPlexText accessibilityRole="alert" style={styles.errorText}>
                  {errorMessage}
                </IBMPlexText>
              ) : null}
            </View>
          </View>
        </Animated.ScrollView>

        <Animated.View
          pointerEvents="box-none"
          style={[styles.stickyHeader, { height: headerHeight }]}
        >
          <Pressable
            accessibilityLabel="Back to plan"
            accessibilityRole="button"
            onPress={() => reviewing ? setReviewing(false) : onBack?.()}
            style={({ pressed }) => [
              styles.backButton,
              { top: insets.top + 6 },
              pressed ? styles.pressed : null,
            ]}
          >
            <IBMPlexText defaultWhite style={styles.backButtonText}>‹</IBMPlexText>
          </Pressable>

          <Animated.View
            pointerEvents="none"
            style={[
              styles.eyebrowHost,
              { opacity: descriptionOpacity, top: insets.top + 20 },
            ]}
          >
            <IBMPlexText style={styles.eyebrow}>PROGRAM SETUP</IBMPlexText>
          </Animated.View>
          <Animated.View
            style={[
              styles.expandedTitle,
              {
                opacity: titleOpacity,
                top: insets.top + 50,
                transform: [
                  { translateX: titleTranslateX },
                  { translateY: titleTranslateY },
                  { scale: titleScale },
                ],
              },
            ]}
          >
            <IBMPlexText defaultWhite style={styles.title}>
              {reviewing ? "Before starting" : "Program Maxes"}
            </IBMPlexText>
          </Animated.View>
          <Animated.View
            style={[
              styles.description,
              { opacity: descriptionOpacity, top: insets.top + 104 },
            ]}
          >
            <IBMPlexText style={styles.descriptionText}>
              {reviewing
                ? "Known lifts use percentages. Missing lifts use RPE during Week 1 while we estimate their Program Maxes."
                : "Enter the current maxes you know. You never need to guess a max."}
            </IBMPlexText>
          </Animated.View>
          {reviewing ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.reviewHeaderSummaryRow,
                { opacity: descriptionOpacity, top: insets.top + 174 },
              ]}
            >
              <View style={[styles.reviewHeaderTag, styles.reviewReadyTag]}>
                <IBMPlexText style={[styles.reviewHeaderTagText, styles.readyText]}>
                  {reviewReadyCount} READY FOR PERCENTAGES
                </IBMPlexText>
              </View>
              <View style={[styles.reviewHeaderTag, styles.reviewRpeTag]}>
                <IBMPlexText style={[styles.reviewHeaderTagText, styles.rpeText]}>
                  {reviewRpeCount} STARTING WITH RPE
                </IBMPlexText>
              </View>
            </Animated.View>
          ) : null}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.compactTitle,
              { opacity: compactTitleOpacity, top: insets.top + 20 },
            ]}
          >
            <IBMPlexText defaultWhite style={styles.compactTitleText}>
              {reviewing ? "Before starting" : "Program Maxes"}
            </IBMPlexText>
          </Animated.View>
        </Animated.View>

        <View
          pointerEvents={keyboardVisible ? "none" : "auto"}
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 14) },
            keyboardVisible ? styles.footerHiddenForKeyboard : null,
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: submitting, disabled: submitting }}
            disabled={submitting}
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed ? styles.primaryButtonPressed : null,
              submitting ? styles.primaryButtonDisabled : null,
            ]}
          >
            {submitting ? (
              <View style={styles.primaryButtonLoadingContent}>
                <ActivityIndicator color="#09090B" size="small" />
                <IBMPlexText style={styles.primaryButtonText}>
                  Finishing…
                </IBMPlexText>
              </View>
            ) : (
              <IBMPlexText style={styles.primaryButtonText}>
                {developerPreview
                  ? reviewing ? "Finish preview" : "Review Week 1"
                  : reviewing ? "Start Week 1" : "Review Week 1"}
              </IBMPlexText>
            )}
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#09090B", flex: 1 },
  content: { flex: 1 },
  stickyHeader: { backgroundColor: "#09090B", left: 0, overflow: "hidden", position: "absolute", right: 0, top: 0, zIndex: 10 },
  backButton: { left: 12, padding: 10, position: "absolute", zIndex: 2 },
  backButtonText: { fontSize: 34, lineHeight: 34 },
  pressed: { opacity: 0.55, transform: [{ scale: 0.96 }] },
  eyebrowHost: { left: 0, position: "absolute", right: 0 },
  eyebrow: { color: "#787880", fontSize: 10, fontWeight: "900", letterSpacing: 1.4, textAlign: "center" },
  expandedTitle: { left: 0, position: "absolute", right: 0 },
  title: { fontSize: 38, fontWeight: "900", lineHeight: 43, textAlign: "center" },
  description: { left: 24, position: "absolute", right: 24 },
  descriptionText: { alignSelf: "center", color: "#9A9AA2", fontSize: 14, lineHeight: 20, maxWidth: 350, textAlign: "center" },
  compactTitle: { alignItems: "flex-end", position: "absolute", right: 20 },
  compactTitleText: { fontSize: 16, fontWeight: "800", lineHeight: 20 },
  readyText: { color: READY },
  rpeText: { color: RPE },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 0 },
  body: { paddingHorizontal: 20, paddingTop: 8 },
  reviewHeaderSummaryRow: { flexDirection: "row", gap: 8, justifyContent: "center", left: 20, position: "absolute", right: 20 },
  reviewHeaderTag: { borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  reviewReadyTag: { backgroundColor: "rgba(52, 199, 89, 0.12)" },
  reviewRpeTag: { backgroundColor: "rgba(255, 159, 10, 0.12)" },
  reviewHeaderTagText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.45, textAlign: "center" },
  liftList: { gap: 10 },
  liftCard: { backgroundColor: "#151517", borderColor: "#29292D", borderRadius: 20, borderWidth: 1.5, justifyContent: "center", minHeight: 108, padding: 14 },
  liftMainRow: { alignItems: "center", flexDirection: "row" },
  liftIconBox: { alignItems: "center", backgroundColor: "#0B0B0D", borderRadius: 16, height: 58, justifyContent: "center", width: 58 },
  liftImage: { height: 38, tintColor: "#585858", width: 38 },
  liftIconFallback: { color: "#A6A6AE", fontSize: 8, lineHeight: 10, paddingHorizontal: 4, textAlign: "center" },
  liftCopy: { flex: 1, marginHorizontal: 12 },
  liftName: { fontSize: 14, fontWeight: "900", lineHeight: 18 },
  liftHelper: { color: "#888890", fontSize: 10, lineHeight: 14, marginTop: 3 },
  savedMaxText: { color: "#B8B8C0", fontSize: 11, lineHeight: 15, marginTop: 3 },
  liftStatus: { fontSize: 9, fontWeight: "800", lineHeight: 13, marginTop: 7 },
  readyBadge: { backgroundColor: "rgba(52, 199, 89, 0.14)", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  readyBadgeText: { color: READY, fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  inputShell: { alignItems: "center", backgroundColor: "#0B0B0D", borderRadius: 13, flexDirection: "row", minWidth: 88, paddingHorizontal: 10 },
  weightInput: { color: "#FFFFFF", fontFamily: Platform.select({ web: "inherit" }), fontSize: 18, minWidth: 45, paddingVertical: 10, textAlign: "right" },
  weightUnit: { color: "#777780", fontSize: 9, marginLeft: 5, textTransform: "uppercase" },
  confidenceWrap: { borderTopColor: "#2B2B30", borderTopWidth: 1, marginTop: 13, paddingTop: 11 },
  confidenceLabel: { color: "#777780", fontSize: 8, fontWeight: "900", letterSpacing: 0.8, marginBottom: 8 },
  confidenceRow: { flexDirection: "row", gap: 7 },
  confidenceButton: { alignItems: "center", borderColor: "#3B3B41", borderRadius: 999, borderWidth: 1, flex: 1, justifyContent: "center", minHeight: 34, paddingHorizontal: 6 },
  confidenceButtonSelected: { backgroundColor: "#FFFFFF", borderColor: "#FFFFFF" },
  confidenceButtonText: { color: "#A0A0A8", fontSize: 9, fontWeight: "800" },
  confidenceButtonTextSelected: { color: "#09090B" },
  reviewValueBox: { alignItems: "center", backgroundColor: "#0B0B0D", borderRadius: 13, justifyContent: "center", minHeight: 44, minWidth: 88, paddingHorizontal: 10 },
  reviewValue: { fontSize: 13, fontWeight: "900", maxWidth: 92, textAlign: "center" },
  infoBox: { alignItems: "flex-start", backgroundColor: "#151517", borderColor: "#29292D", borderRadius: 16, borderWidth: 1, flexDirection: "row", marginTop: 14, padding: 13 },
  infoMark: { borderColor: "#777780", borderRadius: 9, borderWidth: 1, color: "#A0A0A8", fontSize: 10, height: 18, lineHeight: 16, marginRight: 9, textAlign: "center", width: 18 },
  infoText: { color: "#94949C", flex: 1, fontSize: 11, lineHeight: 16 },
  errorSlot: { minHeight: 42 },
  errorText: { color: ACCENT, fontSize: 12, lineHeight: 17, marginTop: 12, textAlign: "center" },
  footer: { bottom: 0, left: 0, paddingHorizontal: 20, position: "absolute", right: 0 },
  footerHiddenForKeyboard: { opacity: 0 },
  primaryButton: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 999, elevation: 8, justifyContent: "center", minHeight: 52, paddingHorizontal: 20, shadowColor: "#000000", shadowOffset: { height: 5, width: 0 }, shadowOpacity: 0.28, shadowRadius: 10 },
  primaryButtonPressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  primaryButtonDisabled: { opacity: 0.45 },
  primaryButtonLoadingContent: { alignItems: "center", flexDirection: "row", gap: 9 },
  primaryButtonText: { color: "#09090B", fontSize: 14, fontWeight: "900", letterSpacing: 0.3 },
});
