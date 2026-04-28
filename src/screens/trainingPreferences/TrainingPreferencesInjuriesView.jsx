import { useEffect, useRef, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import StandardText from "../../components/textComponents/StandardText.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";

const NURSE_ICON = require("../../assets/icons/nurse.png");
const ARROW_TEXT_ICON = require("../../assets/icons/arrowText.png");

export default function TrainingPreferencesInjuriesView({
  value,
  onChange,
}) {
  const { height: screenHeight } = useWindowDimensions();
  const chatScrollRef = useRef(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [userMessages, setUserMessages] = useState(() =>
    value ? [value] : []
  );

  function handleSend() {
    const nextMessage = draftMessage.trim();

    if (!nextMessage) {
      return;
    }

    const nextMessages = [...userMessages, nextMessage];
    setUserMessages(nextMessages);
    setDraftMessage("");
    onChange?.(nextMessages.join(", "));
  }

  useEffect(() => {
    chatScrollRef.current?.scrollToEnd({ animated: true });
  }, [userMessages.length]);

  return (
    <View style={[styles.section, { minHeight: screenHeight }]}>
      <TitleText height={40}>Do you have any injuries</TitleText>
      <View style={styles.contentSlot}>
        <View style={styles.chatFeed}>
          <ScrollView
            ref={chatScrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.messages}
            showsVerticalScrollIndicator={false}
          >
              <View style={styles.messageRow}>
                <View style={styles.botIconSpacer} />
                <View style={[styles.messageBubble, styles.messageBubbleFirst]}>
                  <StandardText style={styles.messageText} textColor="#000000">
                    Are you dealing with any injuries?
                  </StandardText>
                </View>
              </View>

              <View style={styles.messageRow}>
                <View style={styles.botIcon}>
                  <Image
                    source={NURSE_ICON}
                    style={styles.botIconImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={[styles.messageBubble, styles.messageBubbleLast]}>
                  <StandardText style={styles.messageText} textColor="#000000">
                    Anything from a sore shoulder, to a weak kick to active rehab.
                  </StandardText>
                </View>
              </View>

              {userMessages.length ? (
                <View style={styles.userMessages}>
                  {userMessages.map((message, index) => (
                    <View key={`user-injury-message-${index}`} style={styles.userMessageRow}>
                      <View
                        style={[
                          styles.userMessageBubble,
                          userMessages.length > 1 && index === 0
                            ? styles.userMessageBubbleFirst
                            : null,
                          userMessages.length > 1 && index === userMessages.length - 1
                            ? styles.userMessageBubbleLast
                            : null,
                          userMessages.length > 1 && index > 0 && index < userMessages.length - 1
                            ? styles.userMessageBubbleMiddle
                            : null,
                        ]}
                      >
                        <StandardText style={styles.userMessageText} textColor="#ffffff">
                          {message}
                        </StandardText>
                      </View>
                    </View>
                  ))}
                  </View>
              ) : null}
          </ScrollView>

          <View style={styles.inputWrap}>
            <TextInput
              placeholder="Write your answer here"
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

const styles = StyleSheet.create({
  section: {
    paddingTop: 120,
    position: "relative",
  },
  contentSlot: {
    bottom: 70,
    left: 0,
    position: "absolute",
    right: 0,
  },
  chatFeed: {
    alignSelf: "center",
    gap: 18,
    height: 400,
    width: "84%",
  },
  messages: {
    gap: 4,
    paddingBottom: 4,
  },
  chatScroll: {
    flex: 1,
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
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  botIconSpacer: {
    height: 40,
    width: 40,
  },
  botIconImage: {
    height: 30,
    width: 30,
  },
  messageBubble: {
    backgroundColor: "#C9B259",
    borderRadius: 30,
    width: "72%",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageBubbleFirst: {
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  messageBubbleLast: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 18,
  },
  userMessageRow: {
    alignItems: "flex-end",
  },
  userMessageBubble: {
    backgroundColor: "#3D3D3D",
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "72%",
  },
  userMessageBubbleFirst: {
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  userMessageBubbleMiddle: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  userMessageBubbleLast: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 2,
  },
  userMessageText: {
    fontSize: 18,
  },
  inputWrap: {
    backgroundColor: "#3D3D3D",
    borderRadius: 30,
    minHeight: 70,
    position: "relative",
    justifyContent: "center",
  },
  textarea: {
    color: "#ffffff",
    fontSize: 16,
    minHeight: 70,
    paddingLeft: 14,
    paddingRight: 58,
    paddingVertical: 12,
    textAlign: "left",
    textAlignVertical: "center",
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: "#000000",
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    position: "absolute",
    right: 10,
    width: 40,
  },
  sendIcon: {
    height: 20,
    width: 20,
  },
});
