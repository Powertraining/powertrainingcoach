import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState } from "react";
import {
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
import QuestionnaireChatMessage from "../../components/questionnaireComponents/QuestionnaireChatMessage.jsx";

const NURSE_ICON = require("../../assets/icons/nurse.png");
const ARROW_TEXT_ICON = require("../../assets/icons/arrowText.png");
const BOT_MESSAGES = Object.freeze([
  "Any pain, injuries, or movement limits?",
  "Add anything that should affect exercise selection, loading, or impact level. Include painful joints, recent injuries, clinician restrictions, or movements you want to avoid.",
]);
const CLOSED_KEYBOARD_BOTTOM_OFFSET = 18;

function TrainingPreferencesInjuriesView({
  value,
  onChange,
  onContinue,
  onSkip,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const chatScrollRef = useRef(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [userMessages, setUserMessages] = useState(() =>
    value ? [value] : []
  );
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const contentBottomOffset =
    keyboardHeight > 0 ? keyboardHeight : CLOSED_KEYBOARD_BOTTOM_OFFSET;
  const canContinue = userMessages.length > 0;

  const commitDraftMessage = useCallback(() => {
    const nextMessage = draftMessage.trim();

    if (!nextMessage) {
      return false;
    }

    const nextMessages = [...userMessages, nextMessage];
    setUserMessages(nextMessages);
    setDraftMessage("");
    onChange?.(nextMessages.join(", "));
    return true;
  }, [draftMessage, onChange, userMessages]);

  const handleSend = useCallback(() => {
    commitDraftMessage();
  }, [commitDraftMessage]);

  const handleContinue = useCallback(() => {
    commitDraftMessage();
    onContinue?.();
  }, [commitDraftMessage, onContinue]);

  useEffect(() => {
    const scrollTimeout = setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: userMessages.length > 0 });
    }, 0);

    return () => clearTimeout(scrollTimeout);
  }, [keyboardHeight, userMessages.length]);

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
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <View style={[styles.section, { height: screenHeight }]}>
      <View style={styles.topChatHeader}>
        <View style={styles.botAvatar}>
          <Image
            source={NURSE_ICON}
            style={styles.botAvatarImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.chatHeaderCopy}>
          <IBMPlexText defaultWhite style={styles.chatName}>Coach intake</IBMPlexText>
          <IBMPlexText defaultWhite style={styles.chatStatus}>Ready to log notes</IBMPlexText>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onSkip}
            style={styles.skipButton}
          >
            <IBMPlexText defaultWhite style={styles.skipButtonText}>Skip &gt;</IBMPlexText>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={!canContinue}
            onPress={handleContinue}
            style={[
              styles.continueButton,
              !canContinue ? styles.continueButtonDisabled : null,
            ]}
          >
            <IBMPlexText defaultWhite style={styles.continueButtonText}>Continue</IBMPlexText>
          </TouchableOpacity>
        </View>
      </View>
      <View style={[styles.contentSlot, { bottom: contentBottomOffset }]}>
        <View style={styles.chatFeed}>
          <ScrollView
            ref={chatScrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.messages}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.timestampPill}>
              <IBMPlexText defaultWhite style={styles.timestampText}>Today</IBMPlexText>
            </View>

            {BOT_MESSAGES.map((message, index) => (
              <QuestionnaireChatMessage
                key={`injury-bot-message-${index}`}
                delay={120 + index * 180}
                direction="received"
                style={styles.messageRow}
              >
                {index === BOT_MESSAGES.length - 1 ? (
                  <View style={styles.botIcon}>
                    <Image
                      source={NURSE_ICON}
                      style={styles.botIconImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : (
                  <View style={styles.botIconSpacer} />
                )}
                <View
                  style={[
                    styles.messageBubble,
                  ]}
                >
                  <IBMPlexText defaultWhite style={styles.messageText} textColor="#000000">
                    {message}
                  </IBMPlexText>
                </View>
              </QuestionnaireChatMessage>
            ))}

            {userMessages.length ? (
              <View style={styles.userMessages}>
                {userMessages.map((message, index) => (
                  <QuestionnaireChatMessage
                    key={`user-injury-message-${index}`}
                    delay={index === 0 && value ? 420 : 0}
                    direction="sent"
                    style={styles.userMessageRow}
                  >
                    <View
                      style={[
                        styles.userMessageBubble,
                      ]}
                    >
                      <IBMPlexText defaultWhite style={styles.userMessageText} textColor="#ffffff">
                        {message}
                      </IBMPlexText>
                    </View>
                  </QuestionnaireChatMessage>
                ))}
              </View>
            ) : (
              <View style={styles.emptyReplyHint}>
                <IBMPlexText defaultWhite style={styles.emptyReplyText}>
                  No injury notes added yet
                </IBMPlexText>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputWrap}>
            <TextInput
              placeholder="Type an injury note..."
              placeholderTextColor="#8E8E8E"
              value={draftMessage}
              onChangeText={setDraftMessage}
              multiline
              numberOfLines={3}
              style={styles.textarea}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Image
                source={ARROW_TEXT_ICON}
                style={styles.sendIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

export default memo(TrainingPreferencesInjuriesView);

const styles = StyleSheet.create({
  section: {
    paddingTop: 108,
    position: "relative",
  },
  topChatHeader: {
    alignItems: "center",
    backgroundColor: "#141414",
    borderBottomColor: "#1E1E1E",
    borderBottomWidth: 2,
    flexDirection: "row",
    gap: 10,
    minHeight: 58,
    paddingHorizontal: 28,
    width: "100%",
  },
  contentSlot: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 166,
  },
  chatFeed: {
    alignSelf: "center",
    flex: 1,
    gap: 12,
    width: "84%",
  },
  botAvatar: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  botAvatarImage: {
    height: 27,
    width: 27,
  },
  chatHeaderCopy: {
    gap: 2,
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginLeft: "auto",
  },
  chatName: {
    color: "#ffffff",
    fontSize: 16,
  },
  chatStatus: {
    color: "#C9B259",
    fontSize: 12,
  },
  messages: {
    flexGrow: 1,
    gap: 4,
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
  chatScroll: {
    flex: 1,
  },
  timestampPill: {
    alignSelf: "center",
    backgroundColor: "#242424",
    borderRadius: 999,
    marginBottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timestampText: {
    color: "#8E8E8E",
    fontSize: 11,
  },
  userMessages: {
    gap: 4,
    marginTop: 14,
  },
  messageRow: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: 10,
  },
  botIcon: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    marginBottom: 2,
    width: 34,
  },
  botIconSpacer: {
    height: 34,
    width: 34,
  },
  botIconImage: {
    height: 24,
    width: 24,
  },
  messageBubble: {
    backgroundColor: "#C9B259",
    borderRadius: 22,
    maxWidth: "76%",
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageRow: {
    alignItems: "flex-end",
  },
  userMessageBubble: {
    backgroundColor: "#2F2F2F",
    borderRadius: 22,
    maxWidth: "78%",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userMessageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  emptyReplyHint: {
    alignSelf: "flex-end",
    borderColor: "#2A2A2A",
    borderRadius: 18,
    borderStyle: "dashed",
    borderWidth: 1,
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  emptyReplyText: {
    color: "#6F6F6F",
    fontSize: 13,
  },
  skipButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  skipButtonText: {
    color: "#ffffff",
    fontSize: 12, fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  continueButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  continueButtonDisabled: {
    opacity: 0.28,
  },
  continueButtonText: {
    color: "#000000",
    fontSize: 14,
  },
  inputWrap: {
    backgroundColor: "#1B1B1B",
    borderColor: "#2A2A2A",
    borderRadius: 28,
    borderWidth: 1,
    minHeight: 58,
    position: "relative",
    justifyContent: "center",
  },
  textarea: {
    color: "#ffffff",
    fontSize: 16,
    maxHeight: 110,
    minHeight: 58,
    paddingLeft: 16,
    paddingRight: 58,
    paddingVertical: 10,
    textAlign: "left",
    textAlignVertical: "center",
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: "#C9B259",
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    position: "absolute",
    right: 10,
    width: 38,
  },
  sendIcon: {
    height: 20,
    tintColor: "#000000",
    width: 20,
  },
});
