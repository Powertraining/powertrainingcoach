import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVideoPlayer, VideoView } from "expo-video";

import BlackGradient from "../../components/colorComponents/BlackGradient.jsx";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
const COLORS = {
  panel: "#141414",
  border: "#1E1E1E",
  text: "#ffffff",
  muted: "#9ca3af",
};

function VideoThumb({ uri }) {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.muted = true;
  });

  return (
    <VideoView
      allowsPictureInPicture={false}
      contentFit="cover"
      nativeControls={false}
      player={player}
      pointerEvents="none"
      style={styles.videoThumb}
    />
  );
}

function PlayBadge() {
  return (
    <View style={styles.playBadge}>
      <View style={styles.playIcon} />
    </View>
  );
}

export default function ExerciseAnalysisListView({
  posts = [],
  onBack,
  onPressPost,
}) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const tileWidth = Math.max((windowWidth - 40 - 30) / 4, 64);

  return (
    <View style={styles.screen}>
      <BlackGradient />
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <IBMPlexText style={styles.backButtonText}>Go Back</IBMPlexText>
      </TouchableOpacity>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 58, 82),
            paddingBottom: Math.max(insets.bottom + 32, 56),
          },
        ]}
      >
        <View style={styles.titleBlock}>
          <IBMPlexText style={styles.title}>Analysis archive</IBMPlexText>
          <IBMPlexText style={styles.subtitle}>Previous video analyses</IBMPlexText>
        </View>

        {posts.length > 0 ? (
          <View style={styles.grid}>
            {posts.map((post) => (
              <TouchableOpacity
                key={post.id}
                onPress={() => onPressPost?.(post)}
                style={[styles.card, { width: tileWidth }]}
              >
                {post.mediaUrl && post.mediaType === "video" ? (
                  <VideoThumb uri={post.mediaUrl} />
                ) : null}
                <View style={styles.cardOverlay}>
                  <PlayBadge />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <IBMPlexText style={styles.emptyText}>No previous analyses yet.</IBMPlexText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
    fontSize: 14, fontWeight: "800",
    lineHeight: 18,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: 20,
    paddingHorizontal: 20,
  },
  titleBlock: {
    gap: 6,
  },
  title: {
    color: COLORS.text,
    fontSize: 26, fontWeight: "900",
    lineHeight: 32,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 13, fontWeight: "700",
    lineHeight: 18,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    backgroundColor: COLORS.panel,
    borderColor: COLORS.border,
    borderRadius: 24,
    borderWidth: 2,
    height: 100,
    overflow: "hidden",
    position: "relative",
  },
  videoThumb: {
    height: "100%",
    width: "100%",
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.14)",
    justifyContent: "center",
  },
  playBadge: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.54)",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  playIcon: {
    borderBottomColor: "transparent",
    borderBottomWidth: 7,
    borderLeftColor: COLORS.text,
    borderLeftWidth: 11,
    borderTopColor: "transparent",
    borderTopWidth: 7,
    height: 0,
    marginLeft: 3,
    width: 0,
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: COLORS.panel,
    borderColor: COLORS.border,
    borderRadius: 14,
    borderWidth: 2,
    minHeight: 140,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13, fontWeight: "700",
    lineHeight: 18,
    textAlign: "center",
  },
});
