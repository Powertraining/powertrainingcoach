import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { PRIMARY_COMBAT_SPORT_OPTIONS } from "../../constants/combatSports.js";
import {
  ANALYSIS_FORUM_TAG,
  FORUM_TOPIC_SUGGESTIONS,
} from "../../services/models/forumModel.js";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";
const COLORS = {
  panel: "#141414",
  text: "#ffffff",
  muted: "#B8B8B8",
  faint: "#8E8E8E",
};

const SORT_OPTIONS = [
  { label: "Recent", value: "recent" },
  { label: "Popular", value: "popular" },
];

const SPORT_TOPIC_OPTIONS = PRIMARY_COMBAT_SPORT_OPTIONS.map((option) => ({
  ...option,
  topic: option.id === "muay-thai-kickboxing" ? "muay thai" : option.label.toLowerCase(),
}));

const SPORT_TOPICS = new Set(SPORT_TOPIC_OPTIONS.map((option) => option.topic));

function getSelectedTopics(filters = {}) {
  if (Array.isArray(filters?.topics)) {
    return filters.topics.filter(Boolean);
  }

  return filters?.topic && filters.topic !== "all" ? [filters.topic] : [];
}

function SportFilterOption({ option, selected = false, onPress }) {
  return (
    <TouchableOpacity
      style={styles.sportItem}
      onPress={onPress}
    >
      <View style={[styles.sportOption, selected ? styles.sportOptionSelected : null]}>
        <Image
          source={option.image}
          style={selected ? styles.sportSelectedImage : styles.sportImage}
          resizeMode="contain"
        />
      </View>
      <IBMPlexText
        numberOfLines={1}
        adjustsFontSizeToFit
        style={selected ? styles.sportSelectedText : styles.sportText}
      >
        {option.label}
      </IBMPlexText>
    </TouchableOpacity>
  );
}

export default function SearchFiltersView({
  visible = false,
  filters = {},
  showSortOptions = true,
  showAnalysisTopic = false,
  style,
  contentHorizontalInset = 20,
  onClose,
  onChangeTopic,
  onChangeSortBy,
  onReset,
}) {
  const selectedTopics = getSelectedTopics(filters);
  const selectedTopicSet = new Set(selectedTopics);
  const selectedSortBy = filters?.sortBy || "recent";
  const topicOptions = [
    ...(showAnalysisTopic ? [ANALYSIS_FORUM_TAG] : []),
    ...FORUM_TOPIC_SUGGESTIONS.filter(
      (topic) =>
        topic !== "general" &&
        topic !== ANALYSIS_FORUM_TAG &&
        !SPORT_TOPICS.has(topic)
    ),
  ];

  function toggleTopic(topic) {
    const nextTopicSet = new Set(selectedTopics);

    if (nextTopicSet.has(topic)) {
      nextTopicSet.delete(topic);
    } else {
      nextTopicSet.add(topic);
    }

    onChangeTopic?.(Array.from(nextTopicSet));
  }

  if (!visible) {
    return null;
  }

  const insetStyle = { marginHorizontal: contentHorizontalInset };
  const scrollerStyle = {
    marginHorizontal: contentHorizontalInset > 0 ? -4 : 0,
  };
  const scrollerContentStyle = {
    paddingHorizontal: contentHorizontalInset,
  };

  return (
    <View style={[styles.content, style]}>
      <View style={[styles.actionRow, insetStyle]}>
        <TouchableOpacity style={styles.doneButton} onPress={onClose}>
          <IBMPlexText style={styles.doneButtonText}>Close</IBMPlexText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onReset}>
          <IBMPlexText style={styles.actionButtonText}>Reset</IBMPlexText>
        </TouchableOpacity>
      </View>

      <IBMPlexText style={[styles.rowLabel, insetStyle]}>Sports</IBMPlexText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.sportScrollerContent, scrollerContentStyle]}
        style={[styles.sportScroller, scrollerStyle]}
      >
        {SPORT_TOPIC_OPTIONS.map((option) => {
          const isSelected = selectedTopicSet.has(option.topic);

          return (
            <SportFilterOption
              key={option.id}
              option={option}
              selected={isSelected}
              onPress={() => toggleTopic(option.topic)}
            />
          );
        })}
      </ScrollView>

      <IBMPlexText style={[styles.rowLabel, insetStyle]}>Topics</IBMPlexText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.topicScrollerContent, scrollerContentStyle]}
        style={[styles.topicScroller, scrollerStyle]}
      >
        {topicOptions.map((topic) => {
          const isSelected = selectedTopicSet.has(topic);

          return (
            <TouchableOpacity
              key={topic}
              style={[styles.topicOption, isSelected ? styles.topicOptionSelected : null]}
              onPress={() => toggleTopic(topic)}
            >
              <IBMPlexText
                numberOfLines={1}
                style={isSelected ? styles.topicSelectedText : styles.topicText}
              >
                {topic}
              </IBMPlexText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {showSortOptions ? (
        <>
          <IBMPlexText style={[styles.rowLabel, insetStyle]}>Sort</IBMPlexText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.sortScrollerContent, scrollerContentStyle]}
            style={[styles.sortScroller, scrollerStyle]}
          >
            {SORT_OPTIONS.map((option) => {
              const isSelected = selectedSortBy === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.topicOption, isSelected ? styles.topicOptionSelected : null]}
                  onPress={() => onChangeSortBy?.(option.value)}
                >
                  <IBMPlexText
                    numberOfLines={1}
                    style={isSelected ? styles.topicSelectedText : styles.topicText}
                  >
                    {option.label}
                  </IBMPlexText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      ) : null}

    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignSelf: "stretch",
    gap: 10,
    marginTop: -12,
    marginBottom: 29,
  },
  rowLabel: {
    color: COLORS.faint,
    fontSize: 11, fontWeight: "800",
    lineHeight: 14,
    marginBottom: -2,
    marginHorizontal: 20,
    textTransform: "uppercase",
  },
  sportScroller: {
    marginHorizontal: -4,
    marginBottom: 8,
  },
  sportScrollerContent: {
    gap: 8,
    paddingHorizontal: 20,
  },
  sportItem: {
    width: 58,
    alignItems: "center",
    gap: 7,
  },
  sportOption: {
    width: 58,
    height: 58,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "#141414",
    alignItems: "center",
    justifyContent: "center",
  },
  sportOptionSelected: {
    borderColor: "#ffffff",
    backgroundColor: "#ffffff",
  },
  sportImage: {
    width: "72%",
    height: "72%",
    tintColor: COLORS.muted,
  },
  sportSelectedImage: {
    width: "72%",
    height: "72%",
    tintColor: COLORS.panel,
  },
  sportText: {
    color: COLORS.muted,
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 14,
    lineHeight: 16,
    textAlign: "center",
  },
  sportSelectedText: {
    color: COLORS.text,
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 14,
    lineHeight: 16,
    textAlign: "center",
  },
  topicScroller: {
    marginHorizontal: -4,
    marginBottom: 8,
  },
  topicScrollerContent: {
    gap: 8,
    paddingHorizontal: 20,
  },
  sortScroller: {
    marginHorizontal: -4,
  },
  sortScrollerContent: {
    gap: 8,
    paddingHorizontal: 20,
  },
  topicOption: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "#141414",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  topicOptionSelected: {
    borderColor: "#ffffff",
    backgroundColor: "#ffffff",
  },
  topicText: {
    color: COLORS.muted,
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",
  },
  topicSelectedText: {
    color: COLORS.panel,
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    justifyContent: "flex-start",
    marginHorizontal: 20,
    marginBottom: 2,
  },
  actionButton: {
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    justifyContent: "center",
    minWidth: 76,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  actionButtonText: {
    color: COLORS.text,
    fontSize: 12, fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
  doneButton: {
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: COLORS.text,
    minWidth: 76,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  doneButtonText: {
    color: COLORS.panel,
    fontSize: 12, fontWeight: "800",
    lineHeight: 16,
    textTransform: "uppercase",
  },
});
