import { useState } from "react";
import { View } from "react-native";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { LoginView } from "../../src/screens/auth/LoginView.jsx";
import { SignUpView } from "../../src/screens/auth/SignUpView.jsx";
import AuthNavbar from "../../src/screens/auth/AuthNavbarView.jsx";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import { useGoogleIdTokenProvider } from "../../src/services/auth/googleIdentity";

const AuthScreen = observer(function AuthScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const { requestGoogleIdToken } = useGoogleIdTokenProvider();

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

  async function submitGoogleACB() {
    const mode = activeTab === 1 ? "signin" : "signup";

    setLoginError(null);
    setSignupError(null);

    if (mode === "signin") {
      setLoginSubmitting(true);
    } else {
      setSignupSubmitting(true);
    }

    try {
      const idToken = await requestGoogleIdToken({ mode });
      await model.submitGoogle(idToken);
      router.replace("/(tabs)");
    } catch (e) {
      console.error(e);
      if (mode === "signin") {
        setLoginError(e.message || "Google sign-in could not be completed.");
      } else {
        setSignupError(e.message || "Google sign-in could not be completed.");
      }
    } finally {
      if (mode === "signin") {
        setLoginSubmitting(false);
      } else {
        setSignupSubmitting(false);
      }
    }
  }

  function usernameChangeACB(value) { setUsername(value); }
  function emailChangeACB(value) { setEmail(value); }
  function signupPasswordChangeACB(value) { setSignupPassword(value); }

  function handleForgotPasswordPress() {
    const normalizedIdentifier = identifier.trim();

    router.push({
      pathname: "/(auth)/reset-password",
      params: {
        source: "auth",
        ...(normalizedIdentifier ? { email: normalizedIdentifier } : {}),
      },
    });
  }

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
          onForgotPasswordPress={handleForgotPasswordPress}
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
          onSubmitGoogle={submitGoogleACB}
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

export default AuthScreen;
