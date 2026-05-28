import { View, StyleSheet } from "react-native";

import { getAppLogicSettingsFormState } from "../constants/appLogicSettings.js";
import CombatTrainingIntensityView from "./appLogicSettings/CombatTrainingIntensityView.jsx";
import LiftIntensityMethodView from "./appLogicSettings/LiftIntensityMethodView.jsx";
import DeloadStrategyView from "./appLogicSettings/DeloadStrategyView.jsx";
import LoadingStrategyView from "./appLogicSettings/LoadingStrategyView.jsx";
import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";
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
  const hasLiftIntensityMethod = Object.prototype.hasOwnProperty.call(
    safeValues,
    "liftIntensityMethod"
  );
  const hasPercentageReferenceMethod = Object.prototype.hasOwnProperty.call(
    safeValues,
    "percentageReferenceMethod"
  );
  const liftIntensityMethodValue = hasLiftIntensityMethod
    ? safeValues.liftIntensityMethod
    : resolvedValues.liftIntensityMethod;
  const percentageReferenceMethodValue = hasPercentageReferenceMethod
    ? safeValues.percentageReferenceMethod
    : resolvedValues.percentageReferenceMethod;
  const hasDeloadStrategy = Object.prototype.hasOwnProperty.call(
    safeValues,
    "deloadStrategy"
  );
  const deloadStrategyValue = hasDeloadStrategy
    ? safeValues.deloadStrategy
    : resolvedValues.deloadStrategy;

  function updateFields(patch) {
    onChange?.({
      ...safeValues,
      ...resolvedValues,
      ...patch,
    });
  }

  function updateField(field, value) {
    updateFields({ [field]: value });
  }

  return (
    <View style={styles.section}>
      {(title || description) && (
        <View style={styles.header}>
          {title ? <IBMPlexText style={styles.title}>{title}</IBMPlexText> : null}
          {description ? <IBMPlexText style={styles.description}>{description}</IBMPlexText> : null}
        </View>
      )}

      <CombatTrainingIntensityView
        value={resolvedValues.combatTrainingIntensity}
        onChange={(sectionValue) =>
          updateField("combatTrainingIntensity", sectionValue)
        }
      />
      <LiftIntensityMethodView
        value={liftIntensityMethodValue}
        onChange={(sectionValue) =>
          updateFields({
            liftIntensityMethod: sectionValue,
            percentageReferenceMethod: null,
          })
        }
        percentageReferenceValue={percentageReferenceMethodValue}
        onPercentageReferenceChange={(sectionValue) => {
          const isSelected =
            liftIntensityMethodValue === "percentage" &&
            percentageReferenceMethodValue === sectionValue;

          updateFields({
            liftIntensityMethod: isSelected ? null : "percentage",
            percentageReferenceMethod: isSelected ? null : sectionValue,
          });
        }}
      />
      <DeloadStrategyView
        value={deloadStrategyValue}
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
    fontSize: 20, fontWeight: "700",
    color: "#111827",
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: "#4b5563",
  },
});
