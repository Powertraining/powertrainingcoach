import { observable, configure, reaction } from "mobx";

configure({ enforceActions: "never" }); // we don't use Mobx actions in the Lab

import { model } from "./CombatModel.js";
export const reactiveModel = observable(model);

// to persist the data
import { connectToPersistance } from "./firebaseModel.js";

/**
[ model ]      --->   observable(model)     --->     [ reactiveModel ]
objet normal           fonction MobX                   objet réactif (UI suit les changements) 
 */

connectToPersistance(reactiveModel, reaction)

// making the reactive model available for debugging (React Native compatible)
if (typeof global !== "undefined") {
  global.myModel = reactiveModel;
}
