import { StyleSheet, View, Image, TouchableOpacity } from "react-native";
import StandardText from "../textComponents/StandardText.jsx";
import GoldGradient from "../colorComponents/GoldGradient.jsx";


export default function PostCard({ post, onTogglePostLike, onTogglePostSave }) {
  const isPostLiked = Boolean(post?.isLiked);
  const isPostSaved = Boolean(post?.isSaved);

  return (
    <View style={styles.card}>
    <TouchableOpacity>
    <View style={styles.postHeader}>
        <TouchableOpacity style={styles.authorButton}>
        {post?.isCoachVerified ? (
          <View style={styles.verifiedBadge}>
            <GoldGradient />
            <Image
              source={require("../../assets/icons/check.png")}
              style={styles.verifiedIcon}
            />
          </View>
        ) : null}
        <StandardText style={styles.postAuthor}>{post?.authorDisplayName}</StandardText>
      </TouchableOpacity>
     
      
        <View style={styles.dot} />

        <TouchableOpacity>
          <StandardText style={styles.postAuthor}>{post?.topic}</StandardText>
        </TouchableOpacity>

         
    </View>
      <StandardText style={styles.postTitle}>{post?.title}</StandardText>
      <StandardText style={styles.postContent}>{post?.body}</StandardText>
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
          <StandardText fontSize={16} textColor={isPostLiked ? "#000" : "#fff"}>
            {post?.likesCount}
          </StandardText>
        </TouchableOpacity>
         <TouchableOpacity style={styles.countButton}>
            <Image source={require("../../assets/icons/conversation.png")} style={styles.buttonIcon} />
          <StandardText fontSize={16}>{post?.commentsCount}</StandardText>
        </TouchableOpacity>
        {post?.coachResponseStatus === "responded" ? (
            <TouchableOpacity>
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
  );
}

const styles = StyleSheet.create({
  card: {
    borderBottomWidth: 0.167,
    borderBottomColor: "#7E7E7E",
    paddingBottom: 4,
    paddingHorizontal: 16,
  },

  // Header
  postHeader: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingBottom: 8,
  },
  authorButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  postAuthor: {
    color: "#ffffff",
    fontSize: 16,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 120,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedIcon: {
    width: 9,
    height: 9,
    tintColor: "#000",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 120,
    backgroundColor: "#C9B259",
    alignSelf: "center",
  },

  // Body
  postTitle: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 8,
  },
  postContent: {
    color: "#ffffff",
    fontSize: 14,
    marginTop: 20,
  },

  // Menu
  postCardMenu: {
    marginTop: 16,
    marginBottom: 12,
    flexDirection: "row",
    gap: 8,
  },
  coachResponseStatus: {
    alignSelf: "flex-start",
    borderRadius: 120,
    paddingHorizontal: 10,
    height: 32,
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  coachResponseText: {
    fontSize: 18,
  },
  countButton: {
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 120,
    height: 32,
    width: 54,
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
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 120,
    height: 32,
    width: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  standardButtonActive: {
    backgroundColor: "#fff",
  },
  buttonIcon: {
    width: 14,
    height: 14,
    tintColor: "#fff",
  },
  buttonIconActive: {
    tintColor: "#000",
  },
});
