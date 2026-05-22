import { Image } from "react-native";

const QUESTIONNAIRE_IMAGE_SOURCES = [
  require("../../assets/icons/sports/boxing.png"),
  require("../../assets/icons/sports/wrestler.png"),
  require("../../assets/icons/sports/jiujitsu.png"),
  require("../../assets/icons/sports/kickboxing.png"),
  require("../../assets/icons/sports/judo.png"),
  require("../../assets/icons/sports/mma.png"),
  require("../../assets/icons/sports/stamina.png"),
  require("../../assets/icons/sports/strength.png"),
  require("../../assets/icons/sports/balance.png"),
  require("../../assets/icons/sports/squat.png"),
  require("../../assets/icons/sports/deadLift.png"),
  require("../../assets/icons/sports/benchPress.png"),
  require("../../assets/icons/sports/row.png"),
  require("../../assets/icons/sports/overheadPress.png"),
  require("../../assets/icons/sports/splitSquat.png"),
  require("../../assets/icons/sports/lunge.png"),
  require("../../assets/icons/sports/stepUp.png"),
  require("../../assets/icons/sports/pullUp.png"),
  require("../../assets/icons/sports/chinUp.png"),
  require("../../assets/icons/sports/powerClean.png"),
  require("../../assets/icons/sports/hangClean.png"),
  require("../../assets/icons/sports/pushPress.png"),
  require("../../assets/icons/sports/splitJerk.png"),
  require("../../assets/icons/sports/jumps.png"),
  require("../../assets/icons/sports/bounds.png"),
  require("../../assets/icons/sports/hops.png"),
  require("../../assets/icons/sports/landingDrills.png"),
  require("../../assets/icons/sports/medicineBallThrow.png"),
  require("../../assets/icons/sports/jumpSquat.png"),
  require("../../assets/icons/sports/landminePunches.png"),
  require("../../assets/icons/sports/running.png"),
  require("../../assets/icons/sports/bike.png"),
  require("../../assets/icons/sports/rower.png"),
  require("../../assets/icons/sports/assult Bike.png"),
  require("../../assets/icons/sports/curcuitTraining.png"),
  require("../../assets/icons/sports/heavyBag.png"),
  require("../../assets/icons/bench.png"),
  require("../../assets/icons/dumbellpng.png"),
  require("../../assets/icons/bicep.png"),
  require("../../assets/icons/nurse.png"),
  require("../../assets/icons/arrowText.png"),
];

let questionnaireImagesPreloadPromise = null;

export function preloadQuestionnaireImages() {
  if (!questionnaireImagesPreloadPromise) {
    questionnaireImagesPreloadPromise = Promise.allSettled(
      QUESTIONNAIRE_IMAGE_SOURCES.map((source) => {
        const resolvedSource = Image.resolveAssetSource(source);
        return resolvedSource?.uri ? Image.prefetch(resolvedSource.uri) : false;
      })
    );
  }

  return questionnaireImagesPreloadPromise;
}
