import {
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  Text,
  useWindowDimensions,
} from "react-native";

import GoldGradient from "../colorComponents/GoldGradient.jsx";
import VerifiedBadge from "./VerifiedBadge.jsx";

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
  onPressComments,
  onPressPost,
}) {
  const { height } = useWindowDimensions();
  const isPostLiked = Boolean(post?.isLiked);
  const isPostSaved = Boolean(post?.isSaved);
  const cardMinHeight = Math.round(height / 3);
  const cardMaxHeight = Math.round(height * 0.75);

  return (
    <View
      style={[
        styles.card,
        {
          maxHeight: cardMaxHeight,
          minHeight: cardMinHeight,
        },
      ]}
    >
      <View style={styles.cardContent}>
        <TouchableOpacity
          onPress={() => onPressPost?.(post.id)}
          style={styles.postPressable}
        >
          <View style={styles.postHeader}>
            <TouchableOpacity style={styles.authorButton}>
              {post?.isCoachVerified ? (
                <VerifiedBadge />
              ) : null}
              <Text numberOfLines={1} style={styles.postAuthor}>
                {post?.authorDisplayName}
              </Text>
            </TouchableOpacity>

            <View style={styles.dot} />

            <TouchableOpacity>
              <Text numberOfLines={1} style={styles.postTopic}>
                {post?.topic}
              </Text>
            </TouchableOpacity>
          </View>
          <Text numberOfLines={2} style={styles.postTitle}>
            {post?.title}
          </Text>
          <Text numberOfLines={5} style={styles.postContent}>{post?.body}</Text>
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
              <Text style={[styles.countText, isPostLiked ? styles.countTextActive : null]}>
                {post?.likesCount}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.countButton}
              onPress={() => onPressComments?.(post.id)}
            >
              <Image source={require("../../assets/icons/conversation.png")} style={styles.buttonIcon} />
              <Text style={styles.countText}>{post?.commentsCount}</Text>
            </TouchableOpacity>
            {post?.coachResponseStatus === "responded" ? (
              <TouchableOpacity onPress={() => onToggleCoachResponse?.(post.id)}>
                <GoldGradient style={styles.coachResponseStatus}>
                  <Text style={styles.coachResponseText}>
                    Coach Response
                  </Text>
                </GoldGradient>
              </TouchableOpacity>
            ) : null}
          </View>
        </TouchableOpacity>
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
  postPressable: {
    flex: 1,
  },

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
    fontSize: 14,
    fontWeight: "800",
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
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17,
    textTransform: "uppercase",
  },

  postTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 22,
  },
  postContent: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "600",
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
    fontSize: 11,
    fontWeight: "900",
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
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17,
  },
  countTextActive: {
    color: "#111111",
  },
});
