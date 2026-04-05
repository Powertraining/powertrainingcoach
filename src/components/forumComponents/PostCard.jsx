import { StyleSheet, View, Image, TouchableOpacity, Text } from "react-native";
import StandardText from "../textComponents/StandardText.jsx";
import GoldGradient from "../colorComponents/GoldGradient.jsx";
import VerifiedBadge from "./VerifiedBadge.jsx";


export default function PostCard({
  post,
  onTogglePostLike,
  onTogglePostSave,
  onToggleCoachResponse,
}) {
  const isPostLiked = Boolean(post?.isLiked);
  const isPostSaved = Boolean(post?.isSaved);

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <TouchableOpacity>
          <View style={styles.postHeader}>
            <TouchableOpacity style={styles.authorButton}>
              {post?.isCoachVerified ? (
                <VerifiedBadge />
              ) : null}
              <StandardText style={styles.postAuthor}>{post?.authorDisplayName}</StandardText>
            </TouchableOpacity>

            <View style={styles.dot} />

            <TouchableOpacity>
              <StandardText style={styles.postAuthor}>{post?.topic}</StandardText>
            </TouchableOpacity>
          </View>
          <StandardText style={styles.postTitle}>{post?.title}</StandardText>
          <Text numberOfLines={3} style={styles.postContent}>{post?.body}</Text>
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
              <StandardText fontSize={18} textColor={isPostLiked ? "#000" : "#fff"}>
                {post?.likesCount}
              </StandardText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.countButton}>
              <Image source={require("../../assets/icons/conversation.png")} style={styles.buttonIcon} />
              <StandardText fontSize={18}>{post?.commentsCount}</StandardText>
            </TouchableOpacity>
            {post?.coachResponseStatus === "responded" ? (
              <TouchableOpacity onPress={() => onToggleCoachResponse?.(post.id)}>
                <GoldGradient style={styles.coachResponseStatus}>
                  <StandardText style={styles.coachResponseText} textColor="#111111">
                    Coach Response
                  </StandardText>
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
    borderBottomWidth: 0.167,
    borderBottomColor: "#7E7E7E",
    paddingBottom: 8,
    paddingTop: 12,
  },
  cardContent: {
    paddingHorizontal: 24,
  },

  // Header
  postHeader: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingBottom: 12,
  },
  authorButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  postAuthor: {
    color: "#ffffff",
    fontSize: 18,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 120,
    backgroundColor: "#C9B259",
    alignSelf: "center",
  },

  // Body
  postTitle: {
    color: "#ffffff",
    fontSize: 17,
  },
  postContent: {
    color: "#ffffff",
    fontSize: 14,
    marginTop: 25,
    lineHeight : 19,
  },

  // Menu
  postCardMenu: {
    marginTop: 25,
    marginBottom: 12,
    flexDirection: "row",
    gap: 8,
  },
  coachResponseStatus: {
    alignSelf: "flex-start",
    borderRadius: 120,
    paddingHorizontal: 10,
    height: 36,
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  coachResponseText: {
    fontSize: 19,
  },
  countButton: {
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 120,
    height: 36,
    width: 62,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  countButtonActive: {
    backgroundColor: "#fff",
  },
  standardButton: {
    borderWidth: 1,
    borderColor: "#fff",
    borderRadius: 120,
    height: 36,
    width: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  standardButtonActive: {
    backgroundColor: "#fff",
  },
  buttonIcon: {
    width: 18,
    height: 18,
    tintColor: "#fff",
  },
  buttonIconActive: {
    tintColor: "#000",
  },
});
