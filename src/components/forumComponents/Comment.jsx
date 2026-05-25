import { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { MAX_FORUM_COMMENT_REPLY_DEPTH } from "../../services/models/forumModel.js";
import VerifiedBadge from "./VerifiedBadge.jsx";

const COLORS = {
  gold: "#C9B259",
  text: "#ffffff",
  muted: "#9ca3af",
};

export default function Comment({
  comment,
  isLastReply = false,
  replyDepth = 0,
  replyToDisplayName = "",
  onPressReply,
}) {
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);
  const [areRepliesVisible, setAreRepliesVisible] = useState(false);

  if (!comment) {
    return null;
  }

  const hasReplies = Array.isArray(comment?.replies) && comment.replies.length > 0;
  const repliesCount = comment.replies?.length || 0;
  const shouldFlattenReplies = replyDepth >= 1;
  const nextReplyDepth = Math.min(replyDepth + 1, 1);
  const bodyLines = expanded ? undefined : 3;
  const commentDepth = Number(comment?.depth) || 0;
  const canReply =
    typeof onPressReply === "function" &&
    commentDepth < MAX_FORUM_COMMENT_REPLY_DEPTH;

  const avatarSource =
    comment?.authorAvatarUrl ?
      { uri: comment.authorAvatarUrl } :
      require("../../assets/icons/user.png");

  return (
    <View style={styles.commentThread}>
      <View
        style={[
          styles.comment,
          replyDepth > 0 || isLastReply ? styles.replyComment : null,
        ]}
      >
        <Image source={avatarSource} style={styles.avatar} />
        <View style={styles.textContent}>
          <View style={styles.nameRow}>
            {comment?.isCoachVerified ? <VerifiedBadge /> : null}
            <Text numberOfLines={1} style={styles.name}>
              {comment?.authorDisplayName}
            </Text>
            {replyDepth >= 1 && replyToDisplayName ? (
              <Text numberOfLines={1} style={styles.replyTag}>
                @{replyToDisplayName}
              </Text>
            ) : null}
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
                <Text style={styles.readMore}>Reply</Text>
              </TouchableOpacity>
            ) : null}
            {hasReplies ? (
              <TouchableOpacity onPress={() => setAreRepliesVisible((current) => !current)}>
                <Text style={styles.readMore}>
                  {areRepliesVisible ?
                    "Hide replies" :
                    `Show ${repliesCount} ${repliesCount === 1 ? "reply" : "replies"}`}
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
          {hasReplies && areRepliesVisible && !shouldFlattenReplies ? (
            <View style={styles.replies}>
              {comment.replies.map((reply, index) => (
                <Comment
                  key={reply.id}
                  comment={reply}
                  isLastReply={index === comment.replies.length - 1}
                  replyDepth={nextReplyDepth}
                  replyToDisplayName=""
                  onPressReply={onPressReply}
                />
              ))}
            </View>
          ) : null}
        </View>
      </View>
      {hasReplies && areRepliesVisible && shouldFlattenReplies ? (
        <View style={styles.inlineReplies}>
          {comment.replies.map((reply, index) => (
            <Comment
              key={reply.id}
              comment={reply}
              isLastReply={index === comment.replies.length - 1}
              replyDepth={nextReplyDepth}
              replyToDisplayName={comment?.authorDisplayName}
              onPressReply={onPressReply}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  commentThread: {
    gap: 8,
  },
  comment: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  replyComment: {
    borderBottomWidth: 0,
  },
  replies: {
    marginTop: 3,
    marginLeft: -25,
    gap: 2,
  },
  inlineReplies: {
    gap: 2,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#2A2A2A",
    tintColor: "#fff",
  },
  textContent: {
    flex: 1,
    gap: 9,
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
  replyTag: {
    color: COLORS.gold,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
  },
  body: {
    color: COLORS.muted,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 2,
  },
  readMore: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17,
  },
});
