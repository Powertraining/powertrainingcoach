import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { LoginView } from "../../src/screens/screens/LoginView.jsx";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
} from "../../src/services/config/apiConfig.js";

WebBrowser.maybeCompleteAuthSession();

const NATIVE_GOOGLE_ERROR =
  "Google sign-in is not configured for this build. Set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID and EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.";
const GOOGLE_NATIVE_MODULE_ERROR =
  "Google sign-in is unavailable in this build. Install the required Expo auth native modules and rebuild the app.";

function getParamValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function getSafeReturnToPath(params) {
  const rawReturnTo =
    getParamValue(params?.returnTo) || getParamValue(params?.return_to) || "";

  if (
    typeof rawReturnTo !== "string" ||
    !rawReturnTo.startsWith("/") ||
    rawReturnTo.startsWith("//")
  ) {
    return "";
  }

  return rawReturnTo;
}

const ConfiguredGoogleLoginScreen = observer(function ConfiguredGoogleLoginScreen({
  googleModule,
}) {
  const model = reactiveModel;
  const router = useRouter();
  const params = useLocalSearchParams();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const returnTo = getSafeReturnToPath(params);
  const redirectUri = makeRedirectUri({
    scheme: "powertrainingcoach",
    path: "oauthredirect",
  });
  const [request, response, promptAsync] = googleModule.useIdTokenAuthRequest({
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    redirectUri,
    selectAccount: true,
  });

  function identifierChangeACB(value) {
    setIdentifier(value);
  }

  function passwordChangeACB(value) {
    setPassword(value);
  }

  async function submitACB() {
    setError(null);
    setIsSubmitting(true);

    try {
      await model.submitLogin(identifier, password);
      router.replace(returnTo || "/(tabs)");
    } catch (e) {
      console.error(e);
      const message = "E-Mail or password incorrect";
      setError(message);
      setIsSubmitting(false);
    }
  }

  async function submitGoogleACB() {
    setError(null);

    if (!request) {
      setError("Google sign-in is still loading. Please try again.");
      return;
    }

    setIsSubmitting(true);
    const result = await promptAsync();

    if (result.type !== "success") {
      setIsSubmitting(false);
    }
  }

  function handleSignupPress() {
    router.push({
      pathname: "/(auth)/signup",
      params: returnTo ? { returnTo } : {},
    });
  }

  useEffect(() => {
    if (model.ready && model.user) {
      router.replace(returnTo || "/(tabs)");
    }
  }, [model.ready, model.user, returnTo, router]);

  useEffect(() => {
    if (!response) {
      return;
    }

    if (response.type !== "success") {
      if (response.type !== "cancel" && response.type !== "dismiss") {
        setError("Google sign-in was interrupted. Please try again.");
      }
      setIsSubmitting(false);
      return;
    }

    const idToken = response.params?.id_token;

    if (!idToken) {
      setError("Google sign-in did not return an ID token.");
      setIsSubmitting(false);
      return;
    }

    let isMounted = true;

    model
      .submitGoogle(idToken)
      .then(() => {
        if (isMounted) {
          router.replace(returnTo || "/(tabs)");
        }
      })
      .catch((e) => {
        if (isMounted) {
          console.error(e);
          setError(e.message || "Impossible to login.");
          setIsSubmitting(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [model, response, returnTo, router]);

  return (
    <LoginView
      identifier={getIdentifier()}
      password={getPassword()}
      isSubmitting={getIsSubmitting()}
      error={getError()}
      onIdentifierChange={getOnIdentifierChange()}
      onPasswordChange={getOnPasswordChange()}
      onSubmit={getOnSubmit()}
      onSubmitGoogle={getOnSubmitGoogle()}
      onSignupPress={getOnSignupPress()}
    />
  );
});

const LazyGoogleLoginScreen = observer(function LazyGoogleLoginScreen() {
  const [googleModule, setGoogleModule] = useState(null);
  const [googleModuleError, setGoogleModuleError] = useState("");

  useEffect(() => {
    let isMounted = true;

    import("expo-auth-session/providers/google")
      .then((module) => {
        if (isMounted) {
          setGoogleModule(module);
          setGoogleModuleError("");
        }
      })
      .catch((error) => {
        console.warn("Could not load Google auth provider:", error);

        if (isMounted) {
          setGoogleModuleError(GOOGLE_NATIVE_MODULE_ERROR);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!googleModule) {
    return <NativeLoginScreen googleError={googleModuleError} />;
  }

  return <ConfiguredGoogleLoginScreen googleModule={googleModule} />;
});

const NativeLoginScreen = observer(function NativeLoginScreen({ googleError }) {
  const model = reactiveModel;
  const router = useRouter();
  const params = useLocalSearchParams();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const returnTo = getSafeReturnToPath(params);

  function identifierChangeACB(value) {
    setIdentifier(value);
  }

  function passwordChangeACB(value) {
    setPassword(value);
  }

  async function submitACB() {
    setError(null);
    setIsSubmitting(true);

    try {
      await model.submitLogin(identifier, password);
      router.replace(returnTo || "/(tabs)");
    } catch (e) {
      console.error(e);
      const message = "E-Mail or password incorrect";
      setError(message);
      setIsSubmitting(false);
    }
  }

  function submitGoogleACB() {
    setError(googleError || NATIVE_GOOGLE_ERROR);
  }

  function handleSignupPress() {
    router.push({
      pathname: "/(auth)/signup",
      params: returnTo ? { returnTo } : {},
    });
  }

  useEffect(() => {
    if (model.ready && model.user) {
      router.replace(returnTo || "/(tabs)");
    }
  }, [model.ready, model.user, returnTo, router]);

  return (
    <LoginView
      identifier={identifier}
      password={password}
      isSubmitting={isSubmitting}
      error={error}
      onIdentifierChange={identifierChangeACB}
      onPasswordChange={passwordChangeACB}
      onSubmit={submitACB}
      onSubmitGoogle={submitGoogleACB}
      onSignupPress={handleSignupPress}
    />
  );
});

export default function LoginScreen() {
  if (GOOGLE_ANDROID_CLIENT_ID && GOOGLE_IOS_CLIENT_ID) {
    return <LazyGoogleLoginScreen />;
  }

  return <NativeLoginScreen />;
}
