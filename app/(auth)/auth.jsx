import { useState } from "react";
import { View } from "react-native";
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

  // Login state
  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [loginVerificationMessage, setLoginVerificationMessage] = useState(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [resetPasswordVisible, setResetPasswordVisible] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState(null);
  const [resetPasswordSuccessMessage, setResetPasswordSuccessMessage] = useState(null);
  const [isResetPasswordSubmitting, setIsResetPasswordSubmitting] = useState(false);

  // Signup state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupError, setSignupError] = useState(null);
  const [signupMessage, setSignupMessage] = useState(null);
  const [signupSubmitting, setSignupSubmitting] = useState(false);
  const genericLoginError =
    "Unable to sign in. Check your details, verification status, or reset your password.";
  const genericSignupMessage =
    "If this e-mail can be used for a new account, a verification e-mail will be sent. Check your inbox before logging in.";
  const resetPasswordSuccessText =
    "If that account exists, a password reset link is on its way.";

  function identifierChangeACB(value) { setIdentifier(value); }
  function loginPasswordChangeACB(value) { setLoginPassword(value); }

  async function loginSubmitACB() {
    setLoginError(null);
    setLoginVerificationMessage(null);
    setLoginSubmitting(true);
    try {
      await model.submitLogin(identifier, loginPassword);
      router.replace("/(tabs)");
    } catch (e) {
      console.error(e);
      setLoginError(genericLoginError);
      model.showError?.(genericLoginError);
      setLoginSubmitting(false);
    }
  }

  async function submitGoogleACB() {
    const mode = activeTab === 1 ? "signin" : "signup";

    setLoginError(null);
    setSignupError(null);
    setLoginVerificationMessage(null);
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
    setResetPasswordEmail(identifier.trim());
    setResetPasswordError(null);
    setResetPasswordSuccessMessage(null);
    setResetPasswordVisible(true);
  }

  function handleResetPasswordDismiss() {
    if (isResetPasswordSubmitting) {
      return;
    }

    setResetPasswordVisible(false);
  }

  function handleResetPasswordEmailChange(value) {
    setResetPasswordEmail(value);
    setResetPasswordError(null);
    setResetPasswordSuccessMessage(null);
  }

  async function handleResetPasswordSubmit() {
    const normalizedEmail = resetPasswordEmail.trim();

    if (!normalizedEmail) {
      const message = "Enter the e-mail address for your account.";
      setResetPasswordError(message);
      model.showError?.(message);
      return;
    }

    setResetPasswordError(null);
    setResetPasswordSuccessMessage(null);
    setIsResetPasswordSubmitting(true);

    try {
      await model.submitPasswordReset(normalizedEmail);
      setResetPasswordEmail(normalizedEmail);
      setResetPasswordSuccessMessage(resetPasswordSuccessText);
      model.showSuccess?.(resetPasswordSuccessText);
    } catch (resetError) {
      if (resetError?.message === "auth/user-not-found") {
        setResetPasswordEmail(normalizedEmail);
        setResetPasswordSuccessMessage(resetPasswordSuccessText);
        model.showSuccess?.(resetPasswordSuccessText);
        return;
      }

      const message = getFriendlyErrorMessage(
        resetError,
        "We could not send the reset link right now. Please try again."
      );
      setResetPasswordError(message);
      model.showError?.(message);
    } finally {
      setIsResetPasswordSubmitting(false);
    }
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
      <View style={{ flex: 1 }}>
        {activeTab === 1 ? (
          <LoginView
            identifier={identifier}
            password={loginPassword}
            isSubmitting={loginSubmitting}
            error={loginError}
            verificationMessage={loginVerificationMessage}
            onIdentifierChange={identifierChangeACB}
            onPasswordChange={loginPasswordChangeACB}
            onSubmit={loginSubmitACB}
            onSubmitGoogle={submitGoogleACB}
            onForgotPasswordPress={handleForgotPasswordPress}
            resetPasswordVisible={resetPasswordVisible}
            resetPasswordEmail={resetPasswordEmail}
            resetPasswordError={resetPasswordError}
            resetPasswordSuccessMessage={resetPasswordSuccessMessage}
            isResetPasswordSubmitting={isResetPasswordSubmitting}
            onResetPasswordDismiss={handleResetPasswordDismiss}
            onResetPasswordEmailChange={handleResetPasswordEmailChange}
            onResetPasswordSubmit={handleResetPasswordSubmit}
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
      </View>
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
