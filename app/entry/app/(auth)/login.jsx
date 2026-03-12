import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { LoginView } from "../../../screens/screens/LoginView.jsx";
import { reactiveModel } from "../../../services/models/mobxReactiveModel.js";

const LoginScreen = observer(function LoginScreen() {
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

  async function submitGoogleACB() {
    setError(null);
    setIsSubmitting(true);

    try {
      await model.submitGoogle();
      router.replace("/(tabs)");
    } catch (e) {
      console.error(e);
      const message = e.message || "Impossible to login.";
      setError(message);
      setIsSubmitting(false);
    }
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

export default LoginScreen;
