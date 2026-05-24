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

  function identifierChangeACB(value) { setIdentifier(value); }
  function loginPasswordChangeACB(value) { setLoginPassword(value); }

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
      const isUnverifiedEmail = e.message === "auth/email-not-verified";
      setLoginError(
        isUnverifiedEmail
          ? "Please verify your e-mail address before logging in."
          : "E-Mail or password incorrect"
      );
      setCanResendVerification(isUnverifiedEmail);
      setLoginSubmitting(false);
    }
  }

  async function resendVerificationACB() {
    const normalizedIdentifier = identifier.trim();

    if (!normalizedIdentifier || !loginPassword) {
      setLoginError("Enter your e-mail and password first.");
      return;
    }

    setLoginError(null);
    setLoginVerificationMessage(null);
    setIsResendingVerification(true);

    try {
      const result = await model.submitEmailVerificationResend(
        normalizedIdentifier,
        loginPassword
      );
      setLoginVerificationMessage(
        result?.alreadyVerified
          ? "Your e-mail is already verified. You can log in now."
          : "Verification e-mail sent. Check your inbox before logging in."
      );
      setCanResendVerification(!result?.alreadyVerified);
    } catch (e) {
      console.error(e);
      setLoginError("Could not resend the verification e-mail. Check your credentials and try again.");
    } finally {
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
    setSignupMessage(null);
    setSignupSubmitting(true);
    try {
      const result = await model.submitSignup(username, email, signupPassword);

      if (result?.requiresEmailVerification) {
        setSignupPassword("");
        setSignupMessage(
          result.verificationEmailSent
            ? "We sent a verification e-mail. Verify your address before logging in."
            : "Account created, but the verification e-mail could not be sent. Try logging in and use resend verification e-mail."
        );
        setSignupSubmitting(false);
        return;
      }

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
