import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
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

const ConfiguredNativeLoginScreen = observer(function ConfiguredNativeLoginScreen() {
  const model = reactiveModel;
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const redirectUri = makeRedirectUri({
    scheme: "powertrainingcoach",
    path: "oauthredirect",
  });
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
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
      router.replace("/(tabs)");
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
    router.push("/(auth)/signup");
  }

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
          router.replace("/(tabs)");
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
  }, [model, response, router]);

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

const NativeLoginScreen = observer(function NativeLoginScreen() {
  const model = reactiveModel;
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      router.replace("/(tabs)");
    } catch (e) {
      console.error(e);
      const message = "E-Mail or password incorrect";
      setError(message);
      setIsSubmitting(false);
    }
  }

  function submitGoogleACB() {
    setError(NATIVE_GOOGLE_ERROR);
  }

  function handleSignupPress() {
    router.push("/(auth)/signup");
  }

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
    return <ConfiguredNativeLoginScreen />;
  }

  return <NativeLoginScreen />;
}
