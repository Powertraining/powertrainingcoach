import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import StandardText from "../../components/textComponents/StandardText.jsx";
import { FORUM_TOPIC_SUGGESTIONS } from "../../services/models/forumModel.js";

const SORT_OPTIONS = [
  { label: "Recent", value: "recent" },
  { label: "Popular", value: "popular" },
];

export default function SearchFiltersView({
  visible = false,
  filters = {},
  onClose,
  onChangeTopic,
  onChangeSortBy,
  onReset,
}) {
  const selectedTopic = filters?.topic || "all";
  const selectedSortBy = filters?.sortBy || "recent";
  const topicOptions = ["all", ...FORUM_TOPIC_SUGGESTIONS];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.content}>
          <View style={styles.header}>
            <StandardText fontSize={24}>Search Filters</StandardText>
            <TouchableOpacity onPress={onClose}>
              <StandardText fontSize={16} textColor="#C9B259">
                Close
              </StandardText>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <StandardText fontSize={18}>Topic</StandardText>
            <View style={styles.chipRow}>
              {topicOptions.map((topic) => {
                const isSelected = selectedTopic === topic;

                return (
                  <TouchableOpacity
                    key={topic}
                    style={[styles.chip, isSelected ? styles.chipSelected : null]}
                    onPress={() => onChangeTopic?.(topic)}
                  >
                    <StandardText textColor={isSelected ? "#000" : "#fff"}>
                      {topic}
                    </StandardText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <StandardText fontSize={18}>Sort By</StandardText>
            <View style={styles.chipRow}>
              {SORT_OPTIONS.map((option) => {
                const isSelected = selectedSortBy === option.value;

                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.chip, isSelected ? styles.chipSelected : null]}
                    onPress={() => onChangeSortBy?.(option.value)}
                  >
                    <StandardText textColor={isSelected ? "#000" : "#fff"}>
                      {option.label}
                    </StandardText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={styles.resetButton} onPress={onReset}>
            <StandardText textColor="#000">Reset Filters</StandardText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    opacity: 0.75,
  },
  content: {
    width: "88%",
    borderRadius: 28,
    backgroundColor: "#1C1C1C",
    padding: 24,
    gap: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  section: {
    gap: 12,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: "#5A5A5A",
    justifyContent: "center",
    alignItems: "center",
  },
  chipSelected: {
    backgroundColor: "#C9B259",
    borderColor: "#C9B259",
  },
  resetButton: {
    minHeight: 44,
    borderRadius: 120,
    backgroundColor: "#C9B259",
    justifyContent: "center",
    alignItems: "center",
  },
});
