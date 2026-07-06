import { ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import IBMPlexText from "../textComponents/IBMPlexText.jsx";

export default function PlanSetTabs({
  prescribedSets = [],
  activeSetIndex = 0,
  completedSetIndexes = [],
  compact = false,
  onSelectSet,
}) {
  if (prescribedSets.length <= 1) {
    return null;
  }

  const completedSetIndexSet = new Set(completedSetIndexes);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.setTabsContainer,
        compact ? styles.compactSetTabsContainer : null,
      ]}
    >
      {prescribedSets.map((prescribedSet) => {
        const isActive = prescribedSet.setIndex === activeSetIndex;
        const isCompleted = completedSetIndexSet.has(prescribedSet.setIndex);

        return (
          <TouchableOpacity
            key={prescribedSet.setIndex}
            disabled={!isActive}
            style={[
              styles.setTabButton,
              compact ? styles.compactSetTabButton : null,
              isActive ? styles.setTabButtonActive : styles.setTabButtonInactive,
              isCompleted && styles.setTabButtonCompleted,
            ]}
            onPress={() => {
              if (isActive) {
                onSelectSet?.(prescribedSet.setIndex);
              }
            }}
          >
            <IBMPlexText defaultWhite
              style={[
                styles.setTabButtonText,
                compact ? styles.compactSetTabButtonText : null,
                isActive ? styles.setTabButtonTextActive : styles.setTabButtonTextInactive,
                isCompleted && styles.setTabButtonTextCompleted,
              ]}
            >
              Set{"\n"}
              {prescribedSet.setIndex + 1}
            </IBMPlexText>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  setTabsContainer: {
    flexGrow: 1,
    gap: 6,
    justifyContent: "center",
    paddingVertical: 2,
  },
  compactSetTabsContainer: {
    gap: 5,
    paddingVertical: 0,
  },
  setTabButton: {
    height: 55,
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: "#585858",
    borderStyle: "solid",
    backgroundColor: "#1E1E1E",
  },
  compactSetTabButton: {
    borderRadius: 12,
    height: 44,
    padding: 4,
    width: 42,
  },
  setTabButtonActive: {
    borderColor: "#fff",
    borderStyle: "dashed",
  },
  setTabButtonCompleted: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  setTabButtonInactive: {
    backgroundColor: "#1E1E1E",
  },
  setTabButtonText: {
    fontSize: 14, fontWeight: "700",
    lineHeight: 15,
    textAlign: "center",
  },
  compactSetTabButtonText: {
    fontSize: 11,
    lineHeight: 12,
  },
  setTabButtonTextActive: {
    color: "#fff",
  },
  setTabButtonTextCompleted: {
    color: "#000",
  },
  setTabButtonTextInactive: {
    color: "#fff",
  },
});
