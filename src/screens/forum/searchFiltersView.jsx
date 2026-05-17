import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FORUM_TOPIC_SUGGESTIONS } from "../../services/models/forumModel.js";

const COLORS = {
  gold: "#C9B259",
  panel: "#141414",
  panelBorder: "#1E1E1E",
  text: "#ffffff",
  muted: "#9ca3af",
};

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
            <Text style={styles.title}>Search Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>
                Close
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Topic</Text>
            <View style={styles.chipRow}>
              {topicOptions.map((topic) => {
                const isSelected = selectedTopic === topic;

                return (
                  <TouchableOpacity
                    key={topic}
                    style={[styles.chip, isSelected ? styles.chipSelected : null]}
                    onPress={() => onChangeTopic?.(topic)}
                  >
                    <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : null]}>
                      {topic}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.chipRow}>
              {SORT_OPTIONS.map((option) => {
                const isSelected = selectedSortBy === option.value;

                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.chip, isSelected ? styles.chipSelected : null]}
                    onPress={() => onChangeSortBy?.(option.value)}
                  >
                    <Text style={[styles.chipText, isSelected ? styles.chipTextSelected : null]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={styles.resetButton} onPress={onReset}>
            <Text style={styles.resetButtonText}>Reset Filters</Text>
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
    borderColor: COLORS.panelBorder,
    borderRadius: 28,
    borderWidth: 2,
    backgroundColor: COLORS.panel,
    padding: 24,
    gap: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 25,
  },
  closeText: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17,
    textTransform: "uppercase",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 19,
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
    borderColor: "rgba(255,255,255,0.32)",
    justifyContent: "center",
    alignItems: "center",
  },
  chipSelected: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  chipText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
  },
  chipTextSelected: {
    color: COLORS.panel,
  },
  resetButton: {
    minHeight: 44,
    borderRadius: 120,
    backgroundColor: COLORS.text,
    justifyContent: "center",
    alignItems: "center",
  },
  resetButtonText: {
    color: COLORS.panel,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 17,
  },
});
