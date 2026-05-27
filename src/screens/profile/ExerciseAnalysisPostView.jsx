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

import BlackGradient from "../../components/colorComponents/BlackGradient.jsx";
import PostMedia from "../../components/forumComponents/PostMedia.jsx";

const COLORS = {
  panel: "#141414",
  panelSoft: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.18)",
  text: "#ffffff",
  muted: "#9ca3af",
  faint: "#8E8E8E",
  error: "#fca5a5",
  coach: "#C9B259",
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

function ChatMessage({ comment, currentUserId = "" }) {
  if (!comment) {
    return null;
  }

  const isOwnMessage = comment.authorId === currentUserId;
  const isCoach = Boolean(comment.isCoachVerified);

  return (
    <View style={[styles.messageRow, isOwnMessage ? styles.messageRowOwn : null]}>
      <View
        style={[
          styles.messageBubble,
          isOwnMessage ? styles.messageBubbleOwn : null,
          isCoach ? styles.messageBubbleCoach : null,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.messageAuthor,
            isOwnMessage ? styles.messageAuthorOwn : null,
            isCoach ? styles.messageAuthorCoach : null,
          ]}
        >
          {isOwnMessage ? "You" : comment.authorDisplayName}
        </Text>
        <Text
          style={[
            styles.messageBody,
            isOwnMessage ? styles.messageBodyOwn : null,
          ]}
        >
          {comment.body}
        </Text>
      </View>
    </View>
  );
}

export default function ExerciseAnalysisPostView({
  post = null,
  comments = [],
  commentValue = "",
  commentError = null,
  isLoading = false,
  isSubmittingComment = false,
  currentUserId = "",
  onBack,
  onChangeCommentText,
  onCreateComment,
}) {
  const insets = useSafeAreaInsets();
  const canSendComment =
    !isSubmittingComment && String(commentValue || "").trim().length > 0;

  return (
    <View style={styles.screen}>
      <BlackGradient />
      <TouchableOpacity
        onPress={onBack}
        disabled={isSubmittingComment}
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
              paddingBottom: Math.max(insets.bottom + 28, 48),
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{post?.title || "Exercise analysis"}</Text>
            {post?.body ? (
              <Text style={styles.description}>{post.body}</Text>
            ) : null}
          </View>

          <PostMedia
            compact
            mediaUrl={post?.mediaUrl || ""}
            mediaType={post?.mediaType || "none"}
          />

          <View style={styles.chatSection}>
            <Text style={styles.sectionLabel}>Comments</Text>
            <View style={styles.chatContainer}>
              <ScrollView
                nestedScrollEnabled
                style={styles.chatScroll}
                contentContainerStyle={styles.chatContent}
              >
                {isLoading ? (
                  <View style={styles.chatState}>
                    <ActivityIndicator color={COLORS.faint} size="small" />
                  </View>
                ) : comments.length > 0 ? (
                  comments.map((comment) => (
                    <ChatMessage
                      key={comment.id}
                      comment={comment}
                      currentUserId={currentUserId}
                    />
                  ))
                ) : (
                  <View style={styles.chatState}>
                    <Text style={styles.emptyChatText}>No comments yet.</Text>
                  </View>
                )}
              </ScrollView>
            </View>

            <View style={styles.commentComposer}>
              <TextInput
                multiline
                value={commentValue}
                onChangeText={onChangeCommentText}
                editable={!isSubmittingComment}
                placeholder="Reply"
                placeholderTextColor={COLORS.faint}
                selectionColor="#ffffff"
                style={styles.commentInput}
              />
              <TouchableOpacity
                onPress={onCreateComment}
                disabled={!canSendComment}
                style={[
                  styles.commentSendButton,
                  !canSendComment ? styles.commentSendButtonDisabled : null,
                ]}
              >
                <PaperAirplaneIcon />
              </TouchableOpacity>
            </View>
            {commentError ? (
              <Text style={styles.commentError}>{commentError}</Text>
            ) : null}
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
    gap: 18,
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
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30,
  },
  description: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
  },
  chatSection: {
    gap: 10,
    marginTop: 2,
  },
  sectionLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  chatContainer: {
    backgroundColor: COLORS.panel,
    borderColor: "#1E1E1E",
    borderRadius: 14,
    borderWidth: 2,
    height: 260,
    overflow: "hidden",
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    gap: 10,
    padding: 12,
  },
  chatState: {
    alignItems: "center",
    minHeight: 210,
    justifyContent: "center",
  },
  emptyChatText: {
    color: COLORS.faint,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  messageRow: {
    alignItems: "flex-start",
  },
  messageRowOwn: {
    alignItems: "flex-end",
  },
  messageBubble: {
    backgroundColor: COLORS.panelSoft,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: "84%",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  messageBubbleOwn: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  messageBubbleCoach: {
    borderColor: "rgba(201,178,89,0.62)",
  },
  messageAuthor: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 15,
    marginBottom: 3,
  },
  messageAuthorOwn: {
    color: COLORS.panel,
  },
  messageAuthorCoach: {
    color: COLORS.coach,
  },
  messageBody: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  messageBodyOwn: {
    color: COLORS.panel,
  },
  commentComposer: {
    alignItems: "flex-end",
    backgroundColor: COLORS.panel,
    borderColor: "#1E1E1E",
    borderRadius: 14,
    borderWidth: 2,
    flexDirection: "row",
    gap: 10,
    minHeight: 54,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentInput: {
    color: COLORS.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    maxHeight: 92,
    minHeight: 34,
    paddingHorizontal: 0,
    paddingVertical: 7,
    textAlignVertical: "top",
  },
  commentSendButton: {
    alignItems: "center",
    backgroundColor: COLORS.text,
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  commentSendButtonDisabled: {
    opacity: 0.52,
  },
  commentError: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
});
