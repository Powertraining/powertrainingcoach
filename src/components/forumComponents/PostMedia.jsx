import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";

const COLORS = {
  panel: "#141414",
  text: "#ffffff",
  muted: "#9ca3af",
};

function ForumVideo({ uri }) {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = false;
  });

  return (
    <VideoView
      allowsFullscreen
      allowsPictureInPicture
      contentFit="cover"
      player={player}
      style={styles.media}
    />
  );
}

export default function PostMedia({ mediaUrl = "", mediaType = "none", compact = false }) {
  const [imageAspectRatio, setImageAspectRatio] = useState(null);

  useEffect(() => {
    if (!mediaUrl || mediaType !== "image" || compact) {
      setImageAspectRatio(null);
      return;
    }

    let isMounted = true;
    setImageAspectRatio(null);

    Image.getSize(
      mediaUrl,
      (width, height) => {
        if (isMounted && width > 0 && height > 0) {
          setImageAspectRatio(width / height);
        }
      },
      () => {
        if (isMounted) {
          setImageAspectRatio(null);
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [compact, mediaType, mediaUrl]);

  if (!mediaUrl || mediaType === "none") {
    return null;
  }

  if (mediaType === "video") {
    return (
      <View style={[styles.frame, compact ? styles.compactFrame : null]}>
        <ForumVideo uri={mediaUrl} />
      </View>
    );
  }

  const imageFrameStyle =
    !compact && imageAspectRatio ? { aspectRatio: imageAspectRatio } : null;

  return (
    <View style={[styles.frame, compact ? styles.compactFrame : null, imageFrameStyle]}>
      <Image
        source={{ uri: mediaUrl }}
        resizeMode={compact ? "cover" : "contain"}
        style={styles.media}
      />
    </View>
  );
}

export function PendingPostMedia({ mediaUrl = "", mediaType = "none", isUploading = false }) {
  if (isUploading) {
    return (
      <View style={[styles.frame, styles.pendingFrame]}>
        <Text style={styles.pendingText}>Uploading media...</Text>
      </View>
    );
  }

  if (!mediaUrl || mediaType === "none") {
    return null;
  }

  return (
    <View style={styles.pendingWrap}>
      <PostMedia mediaUrl={mediaUrl} mediaType={mediaType} />
      <Text style={styles.attachedText}>
        {mediaType === "video" ? "Video attached" : "Image attached"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: 16 / 10,
    backgroundColor: COLORS.panel,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 18,
    overflow: "hidden",
    width: "100%",
  },
  compactFrame: {
    aspectRatio: 16 / 9,
    marginTop: 16,
  },
  pendingFrame: {
    alignItems: "center",
    justifyContent: "center",
  },
  media: {
    height: "100%",
    width: "100%",
  },
  pendingWrap: {
    gap: 8,
    marginTop: 16,
  },
  pendingText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  attachedText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
});
