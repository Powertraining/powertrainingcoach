import { useState } from "react";
import {
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { MAX_FORUM_COMMENT_REPLY_DEPTH } from "../../services/models/forumModel.js";
import StandardText from "../textComponents/StandardText.jsx";
import VerifiedBadge from "./VerifiedBadge.jsx";

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
            <StandardText style={styles.name}>{comment?.authorDisplayName}</StandardText>
          </View>
          <StandardText
            lines={bodyLines}
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
          </StandardText>
          <View style={styles.buttons}>
            {canReply ? (
              <TouchableOpacity onPress={() => onPressReply?.(comment)}>
                <StandardText style={styles.readMore}>
                  {isReplying ? "Close" : "Reply"}
                </StandardText>
              </TouchableOpacity>
            ) : null}
            {needsToggle ? (
              <TouchableOpacity onPress={() => setExpanded((current) => !current)}>
                <StandardText style={styles.readMore}>
                  {expanded ? "Less" : "More"}
                </StandardText>
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
                    <StandardText fontSize={15} textColor="#000">
                      {isSubmittingReply ? "Posting..." : "Post Reply"}
                    </StandardText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.replyCancelButton}
                    onPress={onCancelReply}
                    disabled={isSubmittingReply}
                  >
                    <StandardText fontSize={15}>Cancel</StandardText>
                  </TouchableOpacity>
                </View>
                {replyError ? (
                  <StandardText style={styles.replyError}>{replyError}</StandardText>
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
    fontSize: 18,
    color: "#fff",
  },
  body: {
    fontSize: 15,
    color: "#fff",
    lineHeight: 22,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  readMore: {
    fontSize: 15,
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
    borderColor: "#4A4A4A",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 15,
    textAlignVertical: "top",
  },
  replyComposerActions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  replySubmitButton: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 120,
    backgroundColor: "#C9B259",
    justifyContent: "center",
    alignItems: "center",
  },
  replyCancelButton: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: "#4A4A4A",
    justifyContent: "center",
    alignItems: "center",
  },
  replyError: {
    color: "#FF7A7A",
    fontSize: 14,
  },
});
