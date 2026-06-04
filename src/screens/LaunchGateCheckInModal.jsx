import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import ProfileFrequencySelector from "../components/profileComponents/ProfileFrequencySelector.jsx";
import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";
import { SESSION_DURATION_OPTIONS } from "../constants/trainingPreferences.js";
import ProfileTrainingPreferencesFields, {
  ProfileSessionDurationSelector,
} from "./ProfileTrainingPreferencesFields.jsx";

const SPORT_LOAD_OPTIONS = Object.freeze([
  { label: "Not very", value: "light" },
  { label: "Balanced", value: "moderate" },
  { label: "Very", value: "intense" },
]);

const PAIN_OPTIONS = Object.freeze([
  { label: "None", value: "none" },
  { label: "Mild", value: "mild" },
  { label: "Affects training", value: "affects_training" },
]);

const TREND_OPTIONS = Object.freeze([
  { label: "Bad", value: "regressing" },
  { label: "Okay", value: "flat" },
  { label: "Great", value: "improving" },
]);

const CHOICE_BASE_HEIGHT = 82;
const CHOICE_MEDIUM_HEIGHT = 103;
const CHOICE_TALL_HEIGHT = 129;
const CHOICE_SELECTED_HEIGHT = Math.round(CHOICE_TALL_HEIGHT * 1.2);
const CHOICE_TEXT_LINE_HEIGHT = 16;
const CHOICE_ANIMATION_DURATION_MS = 460;
const CHOICE_ADVANCE_DELAY_MS = 280;
const BORDER_ANIMATION_DURATION_MS = 620;
const BORDER_ERASE_DURATION_MS = 520;
const CONTENT_ENTRANCE_DURATION_MS = 180;
const CONTENT_EXIT_DURATION_MS = 160;
const BUTTON_LABEL_ANIMATION_DURATION_MS = 170;
const TITLE_ENTRANCE_DELAY_MS = 90;
const QUESTION_ENTRANCE_DELAY_MS = 230;
const ANSWERS_ENTRANCE_DELAY_MS = 420;
const STACKED_CHOICE_GAP = 8;
const STACKED_CHOICE_HEIGHT = Math.round(CHOICE_BASE_HEIGHT * 0.8);
const STACKED_CHOICE_SELECTED_HEIGHT = STACKED_CHOICE_HEIGHT * 2;
const STACKED_CHOICE_REDUCED_HEIGHT = Math.round(STACKED_CHOICE_HEIGHT * 0.5);

const LAUNCH_GATE_PROMPTS = Object.freeze({
  weekly: {
    title: "Weekly check-in",
    questions: Object.freeze([
      {
        key: "progress",
        label: "How do you feel like you are progressing?",
        type: "choice",
        options: TREND_OPTIONS,
      },
      {
        key: "fatigue",
        label: "How recovered do you feel?",
        type: "choice",
        options: Object.freeze([
          { label: "Not very", value: "beat_up" },
          { label: "Okay", value: "normal" },
          { label: "Very", value: "fresh" },
        ]),
      },
      {
        key: "sportLoad",
        label: "How difficult is the current combat-sport load?",
        type: "choice",
        options: SPORT_LOAD_OPTIONS,
      },
      {
        key: "pain",
        label: "Any pain or irritation affecting training?",
        layout: "stacked",
        type: "choice",
        options: PAIN_OPTIONS,
      },
    ]),
  },
  week4: {
    title: "Week 4 check-in",
    questions: Object.freeze([
      {
        key: "recovery",
        label: "How is recovery after the first block?",
        type: "choice",
        initialChoiceHeight: CHOICE_MEDIUM_HEIGHT,
        options: Object.freeze([
          { label: "Poor", value: "poor" },
          { label: "Okay", value: "okay" },
          { label: "Good", value: "good" },
        ]),
      },
      {
        key: "goal",
        label: "What should the next block emphasize?",
        layout: "stacked",
        type: "choice",
        options: Object.freeze([
          { label: "Strength/power", value: "strength_power" },
          { label: "Endurance", value: "endurance" },
          { label: "Both", value: "both" },
        ]),
      },
      {
        key: "sportLoad",
        label: "How difficult is the current combat-sport load?",
        type: "choice",
        options: SPORT_LOAD_OPTIONS,
      },
      {
        key: "pain",
        label: "Pain or injury concern",
        layout: "stacked",
        type: "choice",
        options: PAIN_OPTIONS,
      },
      {
        key: "performanceTrend",
        label: "How do you feel like your performances are improving?",
        type: "choice",
        options: TREND_OPTIONS,
      },
      {
        key: "nextStep",
        label: "What should the app do next?",
        layout: "stacked",
        type: "choice",
        options: Object.freeze([
          { label: "Keep course", value: "keep_course" },
          { label: "Reduce volume", value: "reduce_volume" },
          { label: "Increase emphasis", value: "increase_emphasis" },
        ]),
      },
    ]),
  },
  week8: {
    title: "Week 8 check-in",
    questions: Object.freeze([
      {
        key: "campDirection",
        label: "What should the next block do?",
        layout: "stacked",
        type: "choice",
        options: Object.freeze([
          { label: "Continue build", value: "continue" },
          { label: "Deload then resume", value: "deload_resume" },
          { label: "Transition toward peaking", value: "peak" },
        ]),
      },
      {
        key: "specificity",
        label: "Should general work reduce while specificity increases?",
        type: "choice",
        options: Object.freeze([
          { label: "Yes", value: "yes" },
          { label: "No", value: "no" },
        ]),
      },
      {
        key: "sportLoad",
        label: "How difficult is the current combat-sport load?",
        type: "choice",
        options: SPORT_LOAD_OPTIONS,
      },
      {
        key: "peakingNotes",
        label: "Anything the app should protect going into the next block?",
        type: "text",
        placeholder: "e.g. hard sparring on Fridays, sore knee, speed feels flat",
      },
    ]),
  },
  week12: {
    title: "Week 12 re-input",
    questions: Object.freeze([
      {
        key: "updatedGoals",
        label: "Updated goals",
        type: "text",
        emptyButtonLabel: "Keep the same",
        optional: true,
        placeholder: "e.g. power, grip endurance, aerobic base, fight camp",
      },
      {
        key: "daysPerWeek",
        label: "Training Frequency",
        type: "frequency",
        defaultValue: 3,
      },
      {
        key: "preferredWeekdays",
        label: "Preferred Weekdays",
        type: "preferredWeekdays",
        defaultValue: [],
      },
      {
        key: "sessionDuration",
        label: "Session Duration",
        type: "sessionDuration",
        defaultValue: "60_min",
      },
      {
        key: "sportLoad",
        label: "How difficult is the current combat-sport load?",
        type: "choice",
        options: SPORT_LOAD_OPTIONS,
      },
      {
        key: "equipment",
        label: "Available equipment",
        type: "equipment",
        defaultValue: "full_gym",
      },
      {
        key: "painInjury",
        label: "Pain, injury, or movement restrictions",
        type: "text",
        emptyButtonLabel: "No injury",
        optional: true,
        placeholder: "e.g. shoulder pain on pressing, avoid sprinting",
      },
      {
        key: "eventInfo",
        label: "Event or competition info",
        type: "text",
        emptyButtonLabel: "No event",
        optional: true,
        placeholder: "e.g. fight in 8 weeks, amateur boxing, 3x3 rounds",
      },
    ]),
  },
});

export const LAUNCH_GATE_CHECK_IN_TESTS = Object.freeze([
  { key: "weekly", label: "Test weekly check-in" },
  { key: "week4", label: "Test Week 4 check-in" },
  { key: "week8", label: "Test Week 8 check-in" },
  { key: "week12", label: "Test Week 12 re-input" },
]);

function createDefaultAnswers(prompt = {}) {
  return (prompt.questions || []).reduce((answers, question) => {
    return {
      ...answers,
      [question.key]: question.defaultValue ?? "",
    };
  }, {});
}

function getChoiceBaseHeight(optionIndex = 0, question = {}) {
  if (question.layout === "stacked") {
    return STACKED_CHOICE_HEIGHT;
  }

  if (question.initialChoiceHeight) {
    return question.initialChoiceHeight;
  }

  if (optionIndex === 1) {
    return CHOICE_MEDIUM_HEIGHT;
  }

  if (optionIndex === 2) {
    return CHOICE_TALL_HEIGHT;
  }

  return CHOICE_BASE_HEIGHT;
}

function shouldUseBadTextOffset(optionIndex = 0, question = {}) {
  if (question.layout === "stacked") {
    return false;
  }

  if (question.initialChoiceHeight) {
    return false;
  }

  return optionIndex === 1 || optionIndex === 2;
}

function getSelectedChoiceTextTopOffset(optionIndex = 0, question = {}) {
  if (question.layout === "stacked") {
    return null;
  }

  if (shouldUseBadTextOffset(optionIndex, question)) {
    return null;
  }

  const baseHeight = getChoiceBaseHeight(optionIndex, question);

  return Math.round((baseHeight - CHOICE_TEXT_LINE_HEIGHT) / 2);
}

function isManualAdvanceQuestion(question = {}) {
  if (!question) {
    return false;
  }

  return [
    "frequency",
    "preferredWeekdays",
    "sessionDuration",
    "equipment",
    "text",
  ].includes(question.type);
}

function hasManualAnswer(question = {}, answer) {
  if (!question) {
    return false;
  }

  if (question.optional) {
    return true;
  }

  if (!isManualAdvanceQuestion(question)) {
    return true;
  }

  if (question.type === "text") {
    return typeof answer === "string" && answer.trim().length > 0;
  }

  return answer !== null && answer !== undefined && answer !== "";
}

function LaunchGateQuestionForm({
  answer = "",
  answers = {},
  animationProgress,
  answersEntranceStyle,
  disabled = false,
  onChange,
  question,
  questionEntranceStyle,
  selectedChoiceValue = "",
}) {
  if (!question) {
    return null;
  }

  const isStackedChoice = question.layout === "stacked";

  return (
    <View style={styles.promptContent}>
      <View style={styles.question}>
        <Animated.View style={questionEntranceStyle}>
          <IBMPlexText style={styles.questionLabel}>{question.label}</IBMPlexText>
        </Animated.View>
        {question.type === "choice" ? (
          <Animated.View
            style={[
              styles.choiceRow,
              isStackedChoice ? styles.choiceRowStacked : null,
              answersEntranceStyle,
            ]}
          >
            {(question.options || []).map((option, optionIndex) => {
              const selected = selectedChoiceValue === option.value;
              const baseHeight = getChoiceBaseHeight(optionIndex, question);
              const selectedTextTopOffset = selected ?
                getSelectedChoiceTextTopOffset(optionIndex, question) :
                null;
              const animatedHeight = selectedChoiceValue && animationProgress ?
                animationProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [
                    baseHeight,
                    isStackedChoice ?
                      selected ?
                        STACKED_CHOICE_SELECTED_HEIGHT :
                        STACKED_CHOICE_REDUCED_HEIGHT :
                      selected ? CHOICE_SELECTED_HEIGHT : CHOICE_BASE_HEIGHT,
                  ],
                }) :
                baseHeight;

              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  disabled={disabled}
                  onPress={() => onChange?.(option.value)}
                  style={[
                    styles.choicePressable,
                    isStackedChoice ? styles.choicePressableStacked : null,
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.choice,
                      isStackedChoice ? styles.choiceStacked : null,
                      shouldUseBadTextOffset(optionIndex, question) ? styles.choiceWithBadTextOffset : null,
                      selectedTextTopOffset ? styles.choiceWithSelectedTextOffset : null,
                      selected ? styles.choiceSelected : null,
                      selectedTextTopOffset ? { paddingTop: selectedTextTopOffset } : null,
                      { height: animatedHeight },
                    ]}
                  >
                    <IBMPlexText
                      style={[
                        styles.choiceText,
                        selected ? styles.choiceTextSelected : null,
                      ]}
                    >
                      {option.label}
                    </IBMPlexText>
                  </Animated.View>
                </Pressable>
              );
            })}
          </Animated.View>
        ) : question.type === "frequency" ? (
          <Animated.View style={[styles.profileControlPanel, answersEntranceStyle]}>
            <ProfileFrequencySelector
              colorScheme="light"
              value={Number.isFinite(answer) ? answer : 3}
              onChange={onChange}
            />
          </Animated.View>
        ) : question.type === "preferredWeekdays" ? (
          <Animated.View style={[styles.profileWeekdayControl, answersEntranceStyle]}>
            <ProfileTrainingPreferencesFields
              sections="plan"
              visiblePlanFields={["preferredWeekdays"]}
              values={{
                daysPerWeek: Number.isFinite(answers.daysPerWeek) ?
                  answers.daysPerWeek :
                  3,
                preferredWeekdays: Array.isArray(answer) ? answer : [],
              }}
              onChange={(values) => onChange?.(values?.preferredWeekdays || [])}
              allowDeselect={false}
              colorScheme="light"
            />
          </Animated.View>
        ) : question.type === "sessionDuration" ? (
          <Animated.View style={[styles.profileControlPanel, answersEntranceStyle]}>
            <ProfileSessionDurationSelector
              colorScheme="light"
              options={SESSION_DURATION_OPTIONS}
              value={typeof answer === "string" && answer ? answer : "60_min"}
              onChange={onChange}
            />
          </Animated.View>
        ) : question.type === "equipment" ? (
          <Animated.View style={[styles.profileEquipmentControl, answersEntranceStyle]}>
            <ProfileTrainingPreferencesFields
              sections="plan"
              visiblePlanFields={["equipment"]}
              values={{
                equipment: typeof answer === "string" && answer ?
                  answer :
                  "full_gym",
              }}
              onChange={(values) => onChange?.(values?.equipment || "")}
              allowDeselect={false}
              colorScheme="light"
            />
          </Animated.View>
        ) : (
          <Animated.View style={answersEntranceStyle}>
            <TextInput
              multiline
              onChangeText={onChange}
              placeholder={question.placeholder}
              placeholderTextColor="#8a8a8a"
              style={styles.textInput}
              textAlignVertical="top"
              value={answer}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

export default function LaunchGateCheckInModal({
  promptKey = "",
  visible = false,
  onClose,
}) {
  const prompt = promptKey ? LAUNCH_GATE_PROMPTS[promptKey] : null;
  const [answers, setAnswers] = useState({});
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(-1);
  const [borderAnimationMode, setBorderAnimationMode] = useState("draw");
  const [selectedChoiceValue, setSelectedChoiceValue] = useState("");
  const borderAnimationProgress = useRef(new Animated.Value(0)).current;
  const choiceAnimationProgress = useRef(new Animated.Value(0)).current;
  const titleEntranceProgress = useRef(new Animated.Value(0)).current;
  const questionEntranceProgress = useRef(new Animated.Value(0)).current;
  const answersEntranceProgress = useRef(new Animated.Value(0)).current;
  const buttonLabelProgress = useRef(new Animated.Value(0)).current;
  const advanceTimeoutRef = useRef(null);
  const isMountedRef = useRef(false);
  const questions = prompt?.questions || [];
  const isIntroStep = activeQuestionIndex < 0;
  const isOutroStep = questions.length > 0 && activeQuestionIndex >= questions.length;
  const isInfoStep = isIntroStep || isOutroStep;
  const activeQuestion = isInfoStep ? null : questions[activeQuestionIndex] || null;
  const activeAnswer = activeQuestion ? answers[activeQuestion.key] ?? "" : "";
  const isLastQuestion = activeQuestionIndex >= questions.length - 1;
  const canAdvanceManualQuestion =
    isInfoStep || hasManualAnswer(activeQuestion, activeAnswer);
  const activeAnswerHasText =
    typeof activeAnswer === "string" && activeAnswer.trim().length > 0;
  const shouldUseOptionalEmptyButtonLabel =
    Boolean(activeQuestion?.emptyButtonLabel) && !activeAnswerHasText;
  const manualButtonLabel = isIntroStep ?
    "Start check-in" :
    isOutroStep ?
      "Close" :
      isLastQuestion ?
        "Save test answers" :
        shouldUseOptionalEmptyButtonLabel ?
          activeQuestion.emptyButtonLabel :
          "Next";

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (prompt) {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }
      setAnswers(createDefaultAnswers(prompt));
      setActiveQuestionIndex(-1);
      setBorderAnimationMode("draw");
      setSelectedChoiceValue("");
      choiceAnimationProgress.setValue(0);
      buttonLabelProgress.setValue(0);
      titleEntranceProgress.setValue(0);
      questionEntranceProgress.setValue(0);
      answersEntranceProgress.setValue(0);
    }
  }, [
    answersEntranceProgress,
    buttonLabelProgress,
    choiceAnimationProgress,
    prompt,
    questionEntranceProgress,
    titleEntranceProgress,
  ]);

  useEffect(() => {
    if (!visible || !prompt) {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }
      borderAnimationProgress.setValue(0);
      buttonLabelProgress.setValue(0);
      titleEntranceProgress.setValue(0);
      questionEntranceProgress.setValue(0);
      answersEntranceProgress.setValue(0);
      return;
    }

    playEntranceAnimation();
  }, [
    answersEntranceProgress,
    borderAnimationProgress,
    buttonLabelProgress,
    prompt,
    questionEntranceProgress,
    titleEntranceProgress,
    visible,
  ]);

  function playEntranceAnimation() {
    setBorderAnimationMode("draw");
    borderAnimationProgress.setValue(0);
    buttonLabelProgress.setValue(0);
    titleEntranceProgress.setValue(0);
    questionEntranceProgress.setValue(0);
    answersEntranceProgress.setValue(0);

    Animated.parallel([
      Animated.timing(borderAnimationProgress, {
        toValue: 1,
        duration: BORDER_ANIMATION_DURATION_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.delay(TITLE_ENTRANCE_DELAY_MS),
        Animated.timing(titleEntranceProgress, {
          toValue: 1,
          duration: CONTENT_ENTRANCE_DURATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(QUESTION_ENTRANCE_DELAY_MS),
        Animated.timing(questionEntranceProgress, {
          toValue: 1,
          duration: CONTENT_ENTRANCE_DURATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(ANSWERS_ENTRANCE_DELAY_MS),
        Animated.timing(answersEntranceProgress, {
          toValue: 1,
          duration: CONTENT_ENTRANCE_DURATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }

  useEffect(() => {
    const shouldShowNextLabel =
      Boolean(activeQuestion?.emptyButtonLabel) && activeAnswerHasText;

    Animated.timing(buttonLabelProgress, {
      toValue: shouldShowNextLabel ? 1 : 0,
      duration: BUTTON_LABEL_ANIMATION_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [
    activeAnswerHasText,
    activeQuestion?.emptyButtonLabel,
    buttonLabelProgress,
  ]);

  function playExitAnimation(onFinished) {
    setBorderAnimationMode("erase");
    borderAnimationProgress.setValue(0);

    Animated.parallel([
      Animated.timing(titleEntranceProgress, {
        toValue: 0,
        duration: CONTENT_EXIT_DURATION_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(questionEntranceProgress, {
        toValue: 0,
        duration: CONTENT_EXIT_DURATION_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(answersEntranceProgress, {
        toValue: 0,
        duration: CONTENT_EXIT_DURATION_MS,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(borderAnimationProgress, {
        toValue: 1,
        duration: BORDER_ERASE_DURATION_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onFinished?.();
      }
    });
  }

  function buildEntranceStyle(progress) {
    return {
      opacity: progress,
      transform: [
        {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [18, 0],
          }),
        },
      ],
    };
  }

  const titleEntranceStyle = buildEntranceStyle(titleEntranceProgress);
  const questionEntranceStyle = buildEntranceStyle(questionEntranceProgress);
  const answersEntranceStyle = buildEntranceStyle(answersEntranceProgress);

  const animatedBorderTopWidth =
    borderAnimationMode === "erase" ?
      borderAnimationProgress.interpolate({
        inputRange: [0, 0.25],
        outputRange: ["100%", "0%"],
        extrapolate: "clamp",
      }) :
      borderAnimationProgress.interpolate({
        inputRange: [0, 0.25],
        outputRange: ["0%", "100%"],
        extrapolate: "clamp",
      });
  const animatedBorderTopLeft =
    borderAnimationMode === "erase" ?
      borderAnimationProgress.interpolate({
        inputRange: [0, 0.25],
        outputRange: ["0%", "100%"],
        extrapolate: "clamp",
      }) :
      "0%";
  const animatedBorderRightHeight =
    borderAnimationMode === "erase" ?
      borderAnimationProgress.interpolate({
        inputRange: [0, 0.25, 0.5],
        outputRange: ["100%", "100%", "0%"],
        extrapolate: "clamp",
      }) :
      borderAnimationProgress.interpolate({
        inputRange: [0.25, 0.5],
        outputRange: ["0%", "100%"],
        extrapolate: "clamp",
      });
  const animatedBorderRightTop =
    borderAnimationMode === "erase" ?
      borderAnimationProgress.interpolate({
        inputRange: [0.25, 0.5],
        outputRange: ["0%", "100%"],
        extrapolate: "clamp",
      }) :
      "0%";
  const animatedBorderBottomWidth =
    borderAnimationMode === "erase" ?
      borderAnimationProgress.interpolate({
        inputRange: [0, 0.5, 0.75],
        outputRange: ["100%", "100%", "0%"],
        extrapolate: "clamp",
      }) :
      borderAnimationProgress.interpolate({
        inputRange: [0.5, 0.75],
        outputRange: ["0%", "100%"],
        extrapolate: "clamp",
      });
  const animatedBorderBottomRight =
    borderAnimationMode === "erase" ?
      borderAnimationProgress.interpolate({
        inputRange: [0.5, 0.75],
        outputRange: ["0%", "100%"],
        extrapolate: "clamp",
      }) :
      "0%";
  const animatedBorderLeftHeight =
    borderAnimationMode === "erase" ?
      borderAnimationProgress.interpolate({
        inputRange: [0, 0.75, 1],
        outputRange: ["100%", "100%", "0%"],
        extrapolate: "clamp",
      }) :
      borderAnimationProgress.interpolate({
        inputRange: [0.75, 1],
        outputRange: ["0%", "100%"],
        extrapolate: "clamp",
      });
  const animatedBorderLeftBottom =
    borderAnimationMode === "erase" ?
      borderAnimationProgress.interpolate({
        inputRange: [0.75, 1],
        outputRange: ["0%", "100%"],
        extrapolate: "clamp",
      }) :
      "0%";

  function moveToNextQuestion() {
    playExitAnimation(() => {
      if (!isMountedRef.current) {
        return;
      }

      if (isOutroStep) {
        setSelectedChoiceValue("");
        choiceAnimationProgress.setValue(0);
        onClose?.();
        return;
      }

      setActiveQuestionIndex((current) => {
        if (current >= questions.length - 1) {
          return questions.length;
        }

        return current + 1;
      });
      setSelectedChoiceValue("");
      choiceAnimationProgress.setValue(0);
      playEntranceAnimation();
    });
  }

  function updateAnswer(value) {
    if (!activeQuestion) {
      return;
    }

    setAnswers((current) => ({
      ...current,
      [activeQuestion.key]: value,
    }));

    if (activeQuestion.type === "choice") {
      setSelectedChoiceValue(value);
      choiceAnimationProgress.setValue(0);
      Animated.timing(choiceAnimationProgress, {
        toValue: 1,
        duration: CHOICE_ANIMATION_DURATION_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          if (advanceTimeoutRef.current) {
            clearTimeout(advanceTimeoutRef.current);
          }

          advanceTimeoutRef.current = setTimeout(() => {
            advanceTimeoutRef.current = null;

            if (isMountedRef.current) {
              moveToNextQuestion();
            }
          }, CHOICE_ADVANCE_DELAY_MS);
        }
      });
    }
  }

  return (
    <Modal
      animationType="fade"
      hardwareAccelerated
      presentationStyle="overFullScreen"
      statusBarTranslucent
      transparent
      visible={visible && Boolean(prompt)}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          accessibilityLabel="Close launch gate prompt"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View style={styles.card}>
          <View pointerEvents="none" style={styles.animatedBorderLayer}>
            <Animated.View
              style={[
                styles.animatedBorderTop,
                { left: animatedBorderTopLeft, width: animatedBorderTopWidth },
              ]}
            />
            <Animated.View
              style={[
                styles.animatedBorderRight,
                { height: animatedBorderRightHeight, top: animatedBorderRightTop },
              ]}
            />
            <Animated.View
              style={[
                styles.animatedBorderBottom,
                { right: animatedBorderBottomRight, width: animatedBorderBottomWidth },
              ]}
            />
            <Animated.View
              style={[
                styles.animatedBorderLeft,
                { bottom: animatedBorderLeftBottom, height: animatedBorderLeftHeight },
              ]}
            />
          </View>
          <Animated.View style={titleEntranceStyle}>
            <IBMPlexText style={styles.title}>{prompt?.title || ""}</IBMPlexText>
          </Animated.View>
          {isInfoStep ? (
            <View style={styles.infoContent}>
              <Animated.View style={questionEntranceStyle}>
                <IBMPlexText style={styles.infoHeadline}>
                  {isIntroStep ? "Quick check-in" : "Thank you"}
                </IBMPlexText>
              </Animated.View>
              <Animated.View style={answersEntranceStyle}>
                <IBMPlexText style={styles.infoText}>
                  {isIntroStep ?
                    "Tell us how you are doing so we can keep your plan optimized for your training, recovery, and goals." :
                    "Thank you for letting us know how you are doing. Good luck!"}
                </IBMPlexText>
              </Animated.View>
            </View>
          ) : (
            <LaunchGateQuestionForm
              answer={activeAnswer}
              answers={answers}
              animationProgress={choiceAnimationProgress}
              answersEntranceStyle={answersEntranceStyle}
              disabled={Boolean(selectedChoiceValue)}
              onChange={updateAnswer}
              question={activeQuestion}
              questionEntranceStyle={questionEntranceStyle}
              selectedChoiceValue={selectedChoiceValue}
            />
          )}
          {isInfoStep || isManualAdvanceQuestion(activeQuestion) ? (
            <Animated.View style={answersEntranceStyle}>
              <Pressable
                accessibilityRole="button"
                disabled={!canAdvanceManualQuestion}
                onPress={moveToNextQuestion}
                style={[
                  styles.button,
                  !canAdvanceManualQuestion ? styles.buttonDisabled : null,
                ]}
              >
                {activeQuestion?.emptyButtonLabel && !isLastQuestion ? (
                  <View style={styles.buttonTextSlot}>
                    <Animated.View
                      style={[
                        styles.buttonTextLayer,
                        {
                          opacity: buttonLabelProgress.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 0],
                          }),
                          transform: [
                            {
                              translateY: buttonLabelProgress.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 18],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <IBMPlexText style={styles.buttonText}>
                        {activeQuestion.emptyButtonLabel}
                      </IBMPlexText>
                    </Animated.View>
                    <Animated.View
                      style={[
                        styles.buttonTextLayer,
                        {
                          opacity: buttonLabelProgress,
                          transform: [
                            {
                              translateY: buttonLabelProgress.interpolate({
                                inputRange: [0, 1],
                                outputRange: [-18, 0],
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <IBMPlexText style={styles.buttonText}>Next</IBMPlexText>
                    </Animated.View>
                  </View>
                ) : (
                  <IBMPlexText style={styles.buttonText}>
                    {manualButtonLabel}
                  </IBMPlexText>
                )}
              </Pressable>
            </Animated.View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.58)",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 29,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    alignSelf: "stretch",
    backgroundColor: "#ffffff",
    borderRadius: 28,
    gap: 22,
    maxHeight: "84%",
    maxWidth: 460,
    paddingHorizontal: 20,
    paddingVertical: 22,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
  },
  animatedBorderLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: "hidden",
  },
  animatedBorderTop: {
    borderColor: "#141414",
    borderStyle: "dashed",
    borderTopWidth: 2,
    left: 0,
    position: "absolute",
    top: 0,
  },
  animatedBorderRight: {
    borderColor: "#141414",
    borderRightWidth: 2,
    borderStyle: "dashed",
    position: "absolute",
    right: 0,
    top: 0,
  },
  animatedBorderBottom: {
    borderBottomWidth: 2,
    borderColor: "#141414",
    borderStyle: "dashed",
    bottom: 0,
    position: "absolute",
    right: 0,
  },
  animatedBorderLeft: {
    borderColor: "#141414",
    borderLeftWidth: 2,
    borderStyle: "dashed",
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  title: {
    color: "#141414",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    textAlign: "center",
    textTransform: "uppercase",
  },
  button: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "#141414",
    borderRadius: 999,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 46,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 17,
  },
  buttonTextSlot: {
    alignItems: "center",
    height: 18,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
  },
  buttonTextLayer: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  promptContent: {
    gap: 18,
  },
  infoContent: {
    gap: 14,
    paddingHorizontal: 4,
    paddingVertical: 12,
  },
  infoHeadline: {
    color: "#141414",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 29,
    textAlign: "center",
  },
  infoText: {
    color: "#3f3f3f",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    textAlign: "center",
  },
  profileControlPanel: {
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  profileWeekdayControl: {
    marginTop: -4,
  },
  profileEquipmentControl: {
    marginTop: -2,
  },
  question: {
    gap: 20,
  },
  questionLabel: {
    color: "#141414",
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 25,
    textAlign: "center",
  },
  choiceRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 8,
    height: CHOICE_SELECTED_HEIGHT,
    justifyContent: "center",
  },
  choiceRowStacked: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: STACKED_CHOICE_GAP,
    height: STACKED_CHOICE_HEIGHT * 3 + STACKED_CHOICE_GAP * 2,
  },
  choicePressable: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  choicePressableStacked: {
    position: "relative",
    width: "100%",
  },
  choice: {
    alignItems: "center",
    backgroundColor: "#141414",
    borderColor: "#141414",
    borderWidth: 2,
    borderRadius: 28,
    justifyContent: "center",
    paddingHorizontal: 8,
    width: 82,
  },
  choiceStacked: {
    borderStyle: "dashed",
    width: "100%",
  },
  choiceSelected: {
    backgroundColor: "#141414",
  },
  choiceStackedSelected: {
    backgroundColor: "#141414",
    borderColor: "#141414",
    borderStyle: "dashed",
  },
  choiceWithBadTextOffset: {
    justifyContent: "flex-start",
    paddingTop: 34,
  },
  choiceWithSelectedTextOffset: {
    justifyContent: "flex-start",
  },
  choiceText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 16,
    textAlign: "center",
  },
  choiceTextSelected: {
    color: "#ffffff",
  },
  choiceStackedTextSelected: {
    color: "#ffffff",
  },
  textInput: {
    borderColor: "#d7d7d7",
    borderRadius: 8,
    borderWidth: 1,
    color: "#141414",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
    minHeight: 76,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
