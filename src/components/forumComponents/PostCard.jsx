import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";

import GoldGradient from "../colorComponents/GoldGradient.jsx";
import VerifiedBadge from "./VerifiedBadge.jsx";
import PostMedia from "./PostMedia.jsx";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";
const COLORS = {
  gold: "#C9B259",
  panelBorder: "#1E1E1E",
  text: "#ffffff",
  muted: "#9ca3af",
};

export default function PostCard({
  post,
  onTogglePostLike,
  onTogglePostSave,
  onToggleCoachResponse,
  onPressPost,
  onPressTopic,
}) {
  const { height } = useWindowDimensions();
  const isPostLiked = Boolean(post?.isLiked);
  const isPostSaved = Boolean(post?.isSaved);
  const hasMedia = Boolean(post?.mediaUrl && post?.mediaType !== "none");
  const cardMinHeight = Math.round(height * (hasMedia ? 0.52 : 1 / 3));

  return (
    <View
      style={[
        styles.card,
        {
          minHeight: cardMinHeight,
        },
      ]}
    >
      <View style={styles.cardContent}>
        <View style={styles.postContentWrap}>
          <TouchableOpacity
            onPress={() => onPressPost?.(post.id)}
            style={styles.postPressable}
          >
            <View style={styles.postHeader}>
              <TouchableOpacity style={styles.authorButton}>
                {post?.isCoachVerified ? (
                  <VerifiedBadge />
                ) : null}
                <IBMPlexText numberOfLines={1} style={styles.postAuthor}>
                  {post?.authorDisplayName}
                </IBMPlexText>
              </TouchableOpacity>

              <View style={styles.dot} />

              <TouchableOpacity onPress={() => onPressTopic?.(post?.topic)}>
                <IBMPlexText numberOfLines={1} style={styles.postTopic}>
                  {post?.topic}
                </IBMPlexText>
              </TouchableOpacity>
            </View>
            <IBMPlexText numberOfLines={2} style={styles.postTitle}>
              {post?.title}
            </IBMPlexText>
            <IBMPlexText numberOfLines={hasMedia ? 3 : 5} style={styles.postContent}>
              {post?.body}
            </IBMPlexText>
          </TouchableOpacity>
          <PostMedia
            compact
            mediaUrl={post?.mediaUrl}
            mediaType={post?.mediaType}
          />
          <View style={styles.postCardMenu}>
            <TouchableOpacity
              style={[styles.standardButton, isPostSaved ? styles.standardButtonActive : null]}
              onPress={() => onTogglePostSave?.(post.id)}
            >
              <Image
                source={require("../../assets/icons/save.png")}
                style={[styles.buttonIcon, isPostSaved ? styles.buttonIconActive : null]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.countButton, isPostLiked ? styles.countButtonActive : null]}
              onPress={() => onTogglePostLike?.(post.id)}
            >
              <Image
                source={require("../../assets/icons/like.png")}
                style={[styles.buttonIcon, isPostLiked ? styles.buttonIconActive : null]}
              />
              <IBMPlexText style={[styles.countText, isPostLiked ? styles.countTextActive : null]}>
                {post?.likesCount}
              </IBMPlexText>
            </TouchableOpacity>
            <View style={styles.commentCount}>
              <Image
                source={require("../../assets/icons/conversation.png")}
                style={styles.buttonIcon}
              />
              <IBMPlexText style={styles.countText}>{post?.commentsCount}</IBMPlexText>
            </View>
            {post?.coachResponseStatus === "responded" ? (
              <TouchableOpacity onPress={() => onToggleCoachResponse?.(post.id)}>
                <GoldGradient style={styles.coachResponseStatus}>
                  <IBMPlexText style={styles.coachResponseText}>
                    Coach Response
                  </IBMPlexText>
                </GoldGradient>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.panelBorder,
    paddingBottom: 8,
    paddingTop: 12,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  postContentWrap: {
    flex: 1,
  },
  postPressable: {},

  postHeader: {
    gap: 8,
    alignItems: "center",
    flexDirection: "row",
    paddingBottom: 12,
  },
  authorButton: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: 6,
    minWidth: 0,
  },
  postAuthor: {
    color: COLORS.text,
    fontSize: 14, fontWeight: "800",
    lineHeight: 18,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 120,
    backgroundColor: COLORS.gold,
    alignSelf: "center",
  },
  postTopic: {
    color: COLORS.muted,
    fontSize: 13, fontWeight: "800",
    lineHeight: 17,
    textTransform: "uppercase",
  },

  postTitle: {
    color: COLORS.text,
    fontSize: 17, fontWeight: "800",
    lineHeight: 22,
  },
  postContent: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 19,
    marginTop: 22,
  },

  postCardMenu: {
    marginTop: "auto",
    marginBottom: 12,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  coachResponseStatus: {
    alignSelf: "flex-start",
    borderRadius: 999,
    height: 36,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 14,
    position: "relative",
  },
  coachResponseText: {
    color: "#111111",
    fontSize: 11, fontWeight: "900",
    lineHeight: 14,
    textTransform: "uppercase",
  },
  countButton: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    minWidth: 66,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  countButtonActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  commentCount: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 8,
    height: 36,
    justifyContent: "center",
    minWidth: 66,
  },
  standardButton: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    borderWidth: 1,
    height: 36,
    width: 42,
    justifyContent: "center",
    alignItems: "center",
  },
  standardButtonActive: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  buttonIcon: {
    width: 18,
    height: 18,
    tintColor: COLORS.text,
  },
  buttonIconActive: {
    tintColor: "#000",
  },
  countText: {
    color: COLORS.text,
    fontSize: 13, fontWeight: "800",
    lineHeight: 17,
  },
  countTextActive: {
    color: "#111111",
  },
});
