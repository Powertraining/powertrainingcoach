import { StyleSheet, View, Image, TouchableOpacity } from "react-native";
import StandardText from "../textComponents/StandardText.jsx";
import GoldGradient from "../colorComponents/GoldGradient.jsx";


export default function PostCard({ post }) {
  return (
    <View style={styles.card}>
    <TouchableOpacity>
    <View style={styles.postHeader}>
        <TouchableOpacity>
        <StandardText style={styles.postAuthor}>{post?.authorDisplayName}</StandardText>
      </TouchableOpacity>
      {post?.isCoachVerified ? (
            <View>
            <GoldGradient style={{ width: 16, height: 16, borderRadius: 120, justifyContent: "center", alignItems: "center", }}>
                <Image source={require("../../assets/icons/check.png")} style={{ width: 9, height: 9, tintColor: "#000" }} /> 
             </GoldGradient>
            </View>
        ) : null}
        <StandardText>{"* " + post?.topic}</StandardText>
    </View>
      <StandardText style={styles.postTitle}>{post?.title}</StandardText>
      <StandardText style={styles.postContent}>{post?.body}</StandardText>
      <View style={styles.postCardMenu}>
        <TouchableOpacity style={styles.commentsCount}>
            <Image source={require("../../assets/icons/conversation.png")} style={{ width: 14, height: 14, tintColor: "#fff" }} />
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
  postAuthor: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 4,
  },
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
    commentsCount: {
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
    postHeader: {
        flexDirection: "row",
        gap: 8,
        justifyContent: "left",
    },
});
