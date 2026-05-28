import { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { LoginView } from "../../src/screens/auth/LoginView.jsx";
import { SignUpView } from "../../src/screens/auth/SignUpView.jsx";
import AuthNavbar from "../../src/screens/auth/AuthNavbarView.jsx";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import { useGoogleIdTokenProvider } from "../../src/services/auth/googleIdentity";
import { getFriendlyErrorMessage } from "../../src/services/utils/errorMessages.js";

const AuthScreen = observer(function AuthScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const { requestGoogleIdToken } = useGoogleIdTokenProvider();

  const [activeTab, setActiveTab] = useState(1);
  const formTransition = useRef(new Animated.Value(1)).current;

  // Login state
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [loginVerificationMessage, setLoginVerificationMessage] = useState(null);
  const [canResendVerification, setCanResendVerification] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Signup state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState(null);
  const [signupMessage, setSignupMessage] = useState(null);
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const genericLoginError =
    "Unable to sign in. Check your details, verification status, or reset your password.";
  const genericVerificationMessage =
    "If this account needs verification, a verification e-mail is on its way.";
  const genericSignupMessage =
    "If this e-mail can be used for a new account, a verification e-mail will be sent. Check your inbox before logging in.";

  function identifierChangeACB(value) { setIdentifier(value); }
  function loginPasswordChangeACB(value) { setLoginPassword(value); }

  useEffect(() => {
    formTransition.setValue(0);
    Animated.timing(formTransition, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeTab, formTransition]);

  async function loginSubmitACB() {
    setLoginError(null);
    setLoginVerificationMessage(null);
    setCanResendVerification(false);
    setLoginSubmitting(true);
    try {
      await model.submitLogin(identifier, loginPassword);
      router.replace("/(tabs)");
    } catch (e) {
      console.error(e);
      setLoginError(genericLoginError);
      model.showError?.(genericLoginError);
      setCanResendVerification(true);
      setLoginSubmitting(false);
    }
  }

  async function resendVerificationACB() {
    const normalizedIdentifier = identifier.trim();

    if (!normalizedIdentifier || !loginPassword) {
      const message = "Enter your e-mail and password first.";
      setLoginError(message);
      model.showError?.(message);
      return;
    }

    setLoginError(null);
    setLoginVerificationMessage(null);
    setIsResendingVerification(true);

    try {
      await model.submitEmailVerificationResend(
        normalizedIdentifier,
        loginPassword
      );
      setLoginVerificationMessage(genericVerificationMessage);
      model.showSuccess?.(genericVerificationMessage);
    } catch (e) {
      console.error(e);
      setLoginVerificationMessage(genericVerificationMessage);
      model.showSuccess?.(genericVerificationMessage);
    } finally {
      setCanResendVerification(false);
      setIsResendingVerification(false);
    }
  }

  async function submitGoogleACB() {
    const mode = activeTab === 1 ? "signin" : "signup";

    setLoginError(null);
    setSignupError(null);
    setLoginVerificationMessage(null);
    setCanResendVerification(false);
    setSignupMessage(null);

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
      const message = getFriendlyErrorMessage(
        e,
        "Google sign-in could not be completed."
      );
      if (mode === "signin") {
        setLoginError(message);
      } else {
        setSignupError(message);
      }
      model.showError?.(message);
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
    setSignupMessage(null);
    setSignupSubmitting(true);
    try {
      const result = await model.submitSignup(username, email, signupPassword);

      if (result?.requiresEmailVerification) {
        setSignupPassword("");
        setSignupMessage(genericSignupMessage);
        model.showSuccess?.(genericSignupMessage);
        setSignupSubmitting(false);
        return;
      }

      router.replace("/(tabs)");
    } catch (e) {
      console.error(e);
      const message =
        e.message === "auth/signup-unavailable"
          ? "Could not process sign-up right now. Please try again."
          : getFriendlyErrorMessage(
              e,
              "Could not process sign-up right now. Please try again."
            );
      setSignupError(message);
      model.showError?.(message);
      setSignupSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        style={{
          flex: 1,
          opacity: formTransition,
          transform: [
            {
              translateX: formTransition.interpolate({
                inputRange: [0, 1],
                outputRange: [48, 0],
              }),
            },
          ],
        }}
      >
        {activeTab === 1 ? (
          <LoginView
            identifier={identifier}
            password={loginPassword}
            isSubmitting={loginSubmitting}
            error={loginError}
            verificationMessage={loginVerificationMessage}
            canResendVerification={canResendVerification}
            isResendingVerification={isResendingVerification}
            onIdentifierChange={identifierChangeACB}
            onPasswordChange={loginPasswordChangeACB}
            onSubmit={loginSubmitACB}
            onSubmitGoogle={submitGoogleACB}
            onForgotPasswordPress={handleForgotPasswordPress}
            onResendVerificationPress={resendVerificationACB}
          />
        ) : (
          <SignUpView
            username={username}
            email={email}
            password={signupPassword}
            isSubmitting={signupSubmitting}
            error={signupError}
            message={signupMessage}
            onUsernameChange={usernameChangeACB}
            onEmailChange={emailChangeACB}
            onPasswordChange={signupPasswordChangeACB}
            onSubmit={signupSubmitACB}
            onSubmitGoogle={submitGoogleACB}
          />
        )}
      </Animated.View>
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
