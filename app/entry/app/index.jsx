import { useEffect } from "react";
import { Redirect } from "expo-router";
import { observer } from "mobx-react-lite";
import { reactiveModel } from "../../services/models/mobxReactiveModel.js";

const IndexScreen = observer(function IndexScreen() {
  const model = reactiveModel;

  // Wait for model to be ready before redirecting
  if (!model.ready) {
    return null;
  }

  // Redirect based on auth state
  if (model.user) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/(auth)/login" />;
  }
});

export default IndexScreen;
