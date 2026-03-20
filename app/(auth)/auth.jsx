import { useEffect, useState } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import { LoginView } from "../../src/screens/screens/LoginView.jsx";
import { SignUpView } from "../../src/screens/screens/SignUpView.jsx";
import AuthNavbar from "../../src/screens/screens/AuthNavbarView.jsx";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
} from "../../src/services/config/apiConfig.js";

WebBrowser.maybeCompleteAuthSession();

const NATIVE_GOOGLE_ERROR =
  "Google sign-in is not configured for this build. Set EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID and EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.";

const ConfiguredAuthScreen = observer(function ConfiguredAuthScreen() {
  const model = reactiveModel;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(1);

  // Login state
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Signup state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState(null);
  const [signupSubmitting, setSignupSubmitting] = useState(false);

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

  function identifierChangeACB(value) { setIdentifier(value); }
  function loginPasswordChangeACB(value) { setLoginPassword(value); }

  async function loginSubmitACB() {
    setLoginError(null);
    setLoginSubmitting(true);
    try {
      await model.submitLogin(identifier, loginPassword);
      router.replace("/(tabs)");
    } catch (e) {
      console.error(e);
      setLoginError("E-Mail or password incorrect");
      setLoginSubmitting(false);
    }
  }

  async function submitGoogleACB() {
    setLoginError(null);
    if (!request) {
      setLoginError("Google sign-in is still loading. Please try again.");
      return;
    }
    setLoginSubmitting(true);
    const result = await promptAsync();
    if (result.type !== "success") {
      setLoginSubmitting(false);
    }
  }

  function usernameChangeACB(value) { setUsername(value); }
  function emailChangeACB(value) { setEmail(value); }
  function signupPasswordChangeACB(value) { setSignupPassword(value); }

  async function signupSubmitACB() {
    setSignupError(null);
    setSignupSubmitting(true);
    try {
      await model.submitSignup(username, email, signupPassword);
      router.replace("/(tabs)");
    } catch (e) {
      console.error(e);
      setSignupError(e.message || "Impossible to create an account.");
      setSignupSubmitting(false);
    }
  }

  useEffect(() => {
    if (!response) return;
    if (response.type !== "success") {
      if (response.type !== "cancel" && response.type !== "dismiss") {
        setLoginError("Google sign-in was interrupted. Please try again.");
      }
      setLoginSubmitting(false);
      return;
    }
    const idToken = response.params?.id_token;
    if (!idToken) {
      setLoginError("Google sign-in did not return an ID token.");
      setLoginSubmitting(false);
      return;
    }
    let isMounted = true;
    model
      .submitGoogle(idToken)
      .then(() => { if (isMounted) router.replace("/(tabs)"); })
      .catch((e) => {
        if (isMounted) {
          console.error(e);
          setLoginError(e.message || "Impossible to login.");
          setLoginSubmitting(false);
        }
      });
    return () => { isMounted = false; };
  }, [model, response, router]);

  return (
    <View style={{ flex: 1 }}>
      {activeTab === 1 ? (
        <LoginView
          identifier={identifier}
          password={loginPassword}
          isSubmitting={loginSubmitting}
          error={loginError}
          onIdentifierChange={identifierChangeACB}
          onPasswordChange={loginPasswordChangeACB}
          onSubmit={loginSubmitACB}
          onSubmitGoogle={submitGoogleACB}
        />
      ) : (
        <SignUpView
          username={username}
          email={email}
          password={signupPassword}
          isSubmitting={signupSubmitting}
          error={signupError}
          onUsernameChange={usernameChangeACB}
          onEmailChange={emailChangeACB}
          onPasswordChange={signupPasswordChangeACB}
          onSubmit={signupSubmitACB}
        />
      )}
      <View style={{ marginTop: "auto", paddingBottom: 16 }}>
        <AuthNavbar
          onTabChange={setActiveTab}
          onSubmitLogin={loginSubmitACB}
          onSubmitSignup={signupSubmitACB}
        />
      </View>
    </View>
  );
});

const NativeAuthScreen = observer(function NativeAuthScreen() {
  const model = reactiveModel;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(1);

  // Login state
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Signup state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState(null);
  const [signupSubmitting, setSignupSubmitting] = useState(false);

  function identifierChangeACB(value) { setIdentifier(value); }
  function loginPasswordChangeACB(value) { setLoginPassword(value); }

  async function loginSubmitACB() {
    setLoginError(null);
    setLoginSubmitting(true);
    try {
      await model.submitLogin(identifier, loginPassword);
      router.replace("/(tabs)");
    } catch (e) {
      console.error(e);
      setLoginError("E-Mail or password incorrect");
      setLoginSubmitting(false);
    }
  }

  function submitGoogleACB() {
    setLoginError(NATIVE_GOOGLE_ERROR);
  }

  function usernameChangeACB(value) { setUsername(value); }
  function emailChangeACB(value) { setEmail(value); }
  function signupPasswordChangeACB(value) { setSignupPassword(value); }

  async function signupSubmitACB() {
    setSignupError(null);
    setSignupSubmitting(true);
    try {
      await model.submitSignup(username, email, signupPassword);
      router.replace("/(tabs)");
    } catch (e) {
      console.error(e);
      setSignupError(e.message || "Impossible to create an account.");
      setSignupSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {activeTab === 1 ? (
        <LoginView
          identifier={identifier}
          password={loginPassword}
          isSubmitting={loginSubmitting}
          error={loginError}
          onIdentifierChange={identifierChangeACB}
          onPasswordChange={loginPasswordChangeACB}
          onSubmit={loginSubmitACB}
          onSubmitGoogle={submitGoogleACB}
        />
      ) : (
        <SignUpView
          username={username}
          email={email}
          password={signupPassword}
          isSubmitting={signupSubmitting}
          error={signupError}
          onUsernameChange={usernameChangeACB}
          onEmailChange={emailChangeACB}
          onPasswordChange={signupPasswordChangeACB}
          onSubmit={signupSubmitACB}
        />
      )}
      <View style={{ marginTop: "auto", paddingBottom: 16 }}>
        <AuthNavbar
          onTabChange={setActiveTab}
          onSubmitLogin={loginSubmitACB}
          onSubmitSignup={signupSubmitACB}
        />
      </View>
    </View>
  );
});

export default function AuthScreen() {
  if (GOOGLE_ANDROID_CLIENT_ID && GOOGLE_IOS_CLIENT_ID) {
    return <ConfiguredAuthScreen />;
  }
  return <NativeAuthScreen />;
}
