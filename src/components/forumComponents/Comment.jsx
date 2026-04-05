import { Image, StyleSheet, View } from "react-native";
import StandardText from "../textComponents/StandardText.jsx";
import VerifiedBadge from "./VerifiedBadge.jsx";

export default function Comment({ comment }) {
  if (!comment) {
    return null;
  }

  const avatarSource =
    comment?.authorAvatarUrl ?
      { uri: comment.authorAvatarUrl } :
      require("../../assets/icons/user.png");

  return (
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
        <StandardText style={styles.body}>{comment?.body}</StandardText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  comment: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
    flexDirection: "row",
    alignItems: "flex-start",
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
    backgroundColor: "#fff",
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
});
