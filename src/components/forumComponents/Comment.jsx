import { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { MAX_FORUM_COMMENT_REPLY_DEPTH } from "../../services/models/forumModel.js";
import VerifiedBadge from "./VerifiedBadge.jsx";

const COLORS = {
  gold: "#C9B259",
  text: "#ffffff",
  muted: "#9ca3af",
  panel: "#141414",
  error: "#fca5a5",
};

export default function Comment({
  comment,
  activeReplyCommentId = null,
  replyValue = "",
  replyError = null,
  currentUserPhotoUrl = "",
  isSubmittingReply = false,
  onPressReply,
  onChangeReplyText,
  onCreateReply,
  onCancelReply,
}) {
  if (!comment) {
    return null;
  }

  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);
  const bodyLines = expanded ? undefined : 3;
  const commentDepth = Number(comment?.depth) || 0;
  const isReplying = activeReplyCommentId === comment.id;
  const canReply =
    typeof onPressReply === "function" &&
    commentDepth < MAX_FORUM_COMMENT_REPLY_DEPTH;

  const avatarSource =
    comment?.authorAvatarUrl ?
      { uri: comment.authorAvatarUrl } :
      require("../../assets/icons/user.png");
  const replyAvatarSource =
    currentUserPhotoUrl ?
      { uri: currentUserPhotoUrl } :
      require("../../assets/icons/user.png");

  return (
    <View style={styles.commentThread}>
      <View style={styles.comment}>
        <View style={styles.avatarColumn}>
          <Image source={avatarSource} style={styles.avatar} />
          <View style={styles.connector} />
        </View>
        <View style={styles.textContent}>
          <View style={styles.nameRow}>
            {comment?.isCoachVerified ? <VerifiedBadge /> : null}
            <Text numberOfLines={1} style={styles.name}>
              {comment?.authorDisplayName}
            </Text>
          </View>
          <Text
            numberOfLines={bodyLines}
            style={styles.body}
            onTextLayout={(event) => {
              if (expanded) {
                return;
              }

              const nextNeedsToggle = event.nativeEvent.lines.length > 3;
              setNeedsToggle((current) =>
                current === nextNeedsToggle ? current : nextNeedsToggle
              );
            }}
          >
            {comment?.body}
          </Text>
          <View style={styles.buttons}>
            {canReply ? (
              <TouchableOpacity onPress={() => onPressReply?.(comment)}>
                <Text style={styles.readMore}>
                  {isReplying ? "Close" : "Reply"}
                </Text>
              </TouchableOpacity>
            ) : null}
            {needsToggle ? (
              <TouchableOpacity onPress={() => setExpanded((current) => !current)}>
                <Text style={styles.readMore}>
                  {expanded ? "Less" : "More"}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {isReplying ? (
            <View style={styles.replyComposer}>
              <Image source={replyAvatarSource} style={styles.replyAvatar} />
              <View style={styles.replyComposerBody}>
                <TextInput
                  multiline
                  value={replyValue}
                  onChangeText={onChangeReplyText}
                  editable={!isSubmittingReply}
                  placeholder={`Reply to ${comment?.authorDisplayName || "comment"}`}
                  placeholderTextColor="#8A8A8A"
                  selectionColor="#fff"
                  style={styles.replyInput}
                />
                <View style={styles.replyComposerActions}>
                  <TouchableOpacity
                    style={styles.replySubmitButton}
                    onPress={onCreateReply}
                    disabled={isSubmittingReply}
                  >
                    <Text style={styles.replySubmitButtonText}>
                      {isSubmittingReply ? "Posting..." : "Post Reply"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.replyCancelButton}
                    onPress={onCancelReply}
                    disabled={isSubmittingReply}
                  >
                    <Text style={styles.replyCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
                {replyError ? (
                  <Text style={styles.replyError}>{replyError}</Text>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
      </View>
      {Array.isArray(comment?.replies) && comment.replies.length > 0 ? (
        <View style={styles.replies}>
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              activeReplyCommentId={activeReplyCommentId}
              replyValue={replyValue}
              replyError={replyError}
              currentUserPhotoUrl={currentUserPhotoUrl}
              isSubmittingReply={isSubmittingReply}
              onPressReply={onPressReply}
              onChangeReplyText={onChangeReplyText}
              onCreateReply={onCreateReply}
              onCancelReply={onCancelReply}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  commentThread: {
    gap: 10,
  },
  comment: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  replies: {
    marginLeft: 42,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255, 255, 255, 0.18)",
  },
  avatarColumn: {
    alignItems: "center",
    alignSelf: "stretch",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 18,
    backgroundColor: "#2A2A2A",
    tintColor: "#fff",
  },
  connector: {
    width: 2,
    flex: 1,
    marginTop: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  textContent: {
    flex: 1,
    gap: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    color: COLORS.text,
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18,
  },
  body: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  readMore: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17,
  },
  replyComposer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 4,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2A2A2A",
  },
  replyComposerBody: {
    flex: 1,
    gap: 8,
  },
  replyInput: {
    minHeight: 78,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    textAlignVertical: "top",
  },
  replyComposerActions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  replySubmitButton: {
    minHeight: 36,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: COLORS.text,
    justifyContent: "center",
    alignItems: "center",
  },
  replySubmitButtonText: {
    color: COLORS.panel,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
  },
  replyCancelButton: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    minHeight: 36,
    paddingHorizontal: 18,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  replyCancelButtonText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
  },
  replyError: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
});
