import {
  useEffect,
  useRef,
  useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useEvent, useEventListener } from "expo";
import { Image as ExpoImage } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";
const COLORS = {
  panel: "#141414",
  text: "#ffffff",
  muted: "#9ca3af",
};

function PlayPauseIcon({ playing = false }) {
  if (playing) {
    return (
      <View style={styles.pauseIcon}>
        <View style={styles.pauseBar} />
        <View style={styles.pauseBar} />
      </View>
    );
  }

  return <View style={styles.playIcon} />;
}

function ForumVideo({ uri, autoPlay = false, isActive = true }) {
  const [duration, setDuration] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [posterFrame, setPosterFrame] = useState(null);
  const [seekValue, setSeekValue] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const playButtonProgress = useRef(new Animated.Value(autoPlay ? 0 : 1)).current;
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.timeUpdateEventInterval = 0.25;

    if (autoPlay) {
      videoPlayer.play();
    }
  });
  const playingChange = useEvent(player, "playingChange", {
    isPlaying: player.playing,
  });
  const timeUpdate = useEvent(player, "timeUpdate", {
    currentTime: player.currentTime,
    bufferedPosition: player.bufferedPosition,
    currentLiveTimestamp: null,
    currentOffsetFromLive: null,
  });
  const isPlaying = Boolean(playingChange?.isPlaying);
  const shouldShowPlayButton = (!isPlaying || hasEnded) && !isRestarting;
  const rawCurrentTime = timeUpdate?.currentTime || 0;
  const currentTime =
    hasEnded && !isRestarting && !isSeeking ? 0 :
      isSeeking ? seekValue :
      rawCurrentTime;
  const boundedDuration = Math.max(duration, currentTime, 0);
  const shouldShowPosterFrame =
    Boolean(posterFrame) && (hasEnded || isRestarting);
  const playButtonScale = playButtonProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1],
  });

  useEffect(() => {
    Animated.timing(playButtonProgress, {
      duration: shouldShowPlayButton ? 180 : 130,
      toValue: shouldShowPlayButton ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [playButtonProgress, shouldShowPlayButton]);

  useEffect(() => {
    if (isRestarting && isPlaying && rawCurrentTime > 0.05) {
      setHasEnded(false);
      setIsRestarting(false);
    }
  }, [isPlaying, isRestarting, rawCurrentTime]);

  useEffect(() => {
    if (!isActive) {
      player.pause();
    }
  }, [isActive, player]);

  useEffect(() => {
    if (!isRestarting || !isPlaying) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setHasEnded(false);
      setIsRestarting(false);
    }, 700);

    return () => clearTimeout(timeout);
  }, [isPlaying, isRestarting]);

  useEventListener(player, "sourceLoad", ({ duration: loadedDuration }) => {
    setDuration(Math.max(0, loadedDuration || 0));
    setHasEnded(false);
    setIsRestarting(false);

    player.generateThumbnailsAsync(0, { maxWidth: 960 })
      .then((thumbnails) => {
        setPosterFrame(thumbnails?.[0] || null);
      })
      .catch(() => {
        setPosterFrame(null);
      });
  });

  useEventListener(player, "playToEnd", () => {
    player.pause();
    setHasEnded(true);
    setIsRestarting(false);
    setSeekValue(0);

    requestAnimationFrame(() => {
      player.currentTime = 0;
      player.pause();
    });
  });

  function togglePlayback() {
    if (hasEnded || (duration > 0 && currentTime >= duration - 0.15)) {
      setHasEnded(false);
      setIsRestarting(true);
      setSeekValue(0);
      if (!hasEnded) {
        player.currentTime = 0;
      }
      player.play();
      return;
    }

    if (isPlaying) {
      player.pause();
      return;
    }

    setHasEnded(false);
    player.play();
  }

  function handleSlidingStart(value) {
    setHasEnded(false);
    setIsRestarting(false);
    setIsSeeking(true);
    setSeekValue(value);
  }

  function handleValueChange(value) {
    setSeekValue(value);
  }

  function handleSlidingComplete(value) {
    player.currentTime = value;
    setSeekValue(value);
    setIsSeeking(false);
  }

  return (
    <View style={styles.videoWrap}>
      <VideoView
        allowsPictureInPicture
        contentFit="cover"
        nativeControls={false}
        player={player}
        surfaceType="textureView"
        style={styles.media}
      />
      {shouldShowPosterFrame ? (
        <ExpoImage
          contentFit="cover"
          source={posterFrame}
          style={styles.posterFrame}
        />
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={togglePlayback}
        style={styles.videoTapLayer}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.centerPlayButton,
            {
              opacity: playButtonProgress,
              transform: [{ scale: playButtonScale }],
            },
          ]}
        >
          <PlayPauseIcon playing={false} />
        </Animated.View>
        {isRestarting ? (
          <ActivityIndicator
            color={COLORS.text}
            pointerEvents="none"
            size="large"
            style={styles.replayLoading}
          />
        ) : null}
      </Pressable>
      <View style={styles.videoTimelineWrap}>
        <View
          pointerEvents="none"
          style={[
            styles.timelineBaseLine,
            isSeeking ? styles.timelineBaseLineSeeking : null,
          ]}
        />
        <Slider
          maximumTrackTintColor="rgba(255,255,255,0.34)"
          maximumValue={boundedDuration || 1}
          minimumTrackTintColor={COLORS.text}
          minimumValue={0}
          onSlidingComplete={handleSlidingComplete}
          onSlidingStart={handleSlidingStart}
          onValueChange={handleValueChange}
          style={[
            styles.videoSlider,
            isSeeking ? styles.videoSliderSeeking : null,
          ]}
          thumbTintColor="transparent"
          value={Math.min(currentTime, boundedDuration || 1)}
        />
      </View>
    </View>
  );
}

export default function PostMedia({
  mediaUrl = "",
  mediaType = "none",
  compact = false,
  autoPlay = false,
  isActive = true,
}) {
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
        <ForumVideo uri={mediaUrl} autoPlay={autoPlay} isActive={isActive} />
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
        <IBMPlexText style={styles.pendingText}>Uploading media...</IBMPlexText>
      </View>
    );
  }

  if (!mediaUrl || mediaType === "none") {
    return null;
  }

  return (
    <View style={styles.pendingWrap}>
      <PostMedia mediaUrl={mediaUrl} mediaType={mediaType} />
      <IBMPlexText style={styles.attachedText}>
        {mediaType === "video" ? "Video attached" : "Image attached"}
      </IBMPlexText>
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
  posterFrame: {
    ...StyleSheet.absoluteFillObject,
  },
  videoWrap: {
    height: "100%",
    position: "relative",
    width: "100%",
  },
  videoTapLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  centerPlayButton: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.48)",
    borderRadius: 999,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  replayLoading: {
    position: "absolute",
  },
  videoTimelineWrap: {
    bottom: 0,
    height: 34,
    justifyContent: "flex-end",
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 2,
  },
  playIcon: {
    borderBottomColor: "transparent",
    borderBottomWidth: 10,
    borderLeftColor: COLORS.text,
    borderLeftWidth: 16,
    borderTopColor: "transparent",
    borderTopWidth: 10,
    height: 0,
    marginLeft: 4,
    width: 0,
  },
  pauseIcon: {
    flexDirection: "row",
    gap: 4,
  },
  pauseBar: {
    backgroundColor: COLORS.text,
    borderRadius: 1,
    height: 15,
    width: 4,
  },
  videoSlider: {
    height: 24,
    marginBottom: -2,
    marginHorizontal: -16,
    transform: [{ scaleY: 0.72 }],
  },
  videoSliderSeeking: {
    transform: [{ scaleY: 1 }],
  },
  timelineBaseLine: {
    backgroundColor: "rgba(255,255,255,0.18)",
    bottom: 0,
    height: 1,
    left: 0,
    position: "absolute",
    right: 0,
  },
  timelineBaseLineSeeking: {
    height: 5,
  },
  pendingWrap: {
    gap: 8,
    marginTop: 16,
  },
  pendingText: {
    color: COLORS.muted,
    fontSize: 13, fontWeight: "700",
    lineHeight: 18,
  },
  attachedText: {
    color: COLORS.text,
    fontSize: 12, fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
});
