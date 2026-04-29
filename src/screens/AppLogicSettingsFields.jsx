import { Text, View, StyleSheet } from "react-native";

import { getAppLogicSettingsFormState } from "../constants/appLogicSettings.js";
import CombatTrainingIntensityView from "./appLogicSettings/CombatTrainingIntensityView.jsx";
import LiftIntensityMethodView from "./appLogicSettings/LiftIntensityMethodView.jsx";
import PercentageReferenceMethodView from "./appLogicSettings/PercentageReferenceMethodView.jsx";
import DeloadStrategyView from "./appLogicSettings/DeloadStrategyView.jsx";
import LoadingStrategyView from "./appLogicSettings/LoadingStrategyView.jsx";

export default function AppLogicSettingsFields({
  title,
  description,
  values,
  onChange,
}) {
  const safeValues = values && typeof values === "object" ? values : {};
  const resolvedValues = {
    ...safeValues,
    ...getAppLogicSettingsFormState(values),
  };

  function updateField(field, value) {
    onChange?.({
      ...safeValues,
      ...resolvedValues,
      [field]: value,
    });
  }

  return (
    <View style={styles.section}>
      {(title || description) && (
        <View style={styles.header}>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
      )}

      <CombatTrainingIntensityView
        value={resolvedValues.combatTrainingIntensity}
        onChange={(sectionValue) =>
          updateField("combatTrainingIntensity", sectionValue)
        }
      />
      <LiftIntensityMethodView
        value={resolvedValues.liftIntensityMethod}
        onChange={(sectionValue) =>
          updateField("liftIntensityMethod", sectionValue)
        }
      />
      {resolvedValues.liftIntensityMethod === "percentage" ? (
        <PercentageReferenceMethodView
          value={resolvedValues.percentageReferenceMethod}
          onChange={(sectionValue) =>
            updateField("percentageReferenceMethod", sectionValue)
          }
        />
      ) : null}
      <DeloadStrategyView
        value={resolvedValues.deloadStrategy}
        onChange={(sectionValue) => updateField("deloadStrategy", sectionValue)}
      />
      <LoadingStrategyView
        value={resolvedValues.loadingStrategy}
        onChange={(sectionValue) => updateField("loadingStrategy", sectionValue)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: "#4b5563",
  },
});
