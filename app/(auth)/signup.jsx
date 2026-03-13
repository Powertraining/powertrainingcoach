import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { SignUpView } from "../../src/screens/screens/SignUpView.jsx";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";

const SignUpScreen = observer(function SignUpScreen() {
  const model = reactiveModel;
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function usernameChangeACB(value) {
    setUsername(value);
  }

  function emailChangeACB(value) {
    setEmail(value);
  }

  function passwordChangeACB(value) {
    setPassword(value);
  }

  async function submitACB() {
    setError(null);
    setIsSubmitting(true);

    try {
      await model.submitSignup(username, email, password);
      router.replace("/(tabs)");
    } catch (e) {
      console.error(e);
      const message = e.message || "Impossible to create an account.";
      setError(message);
      setIsSubmitting(false);
    }
  }

  function handleLoginPress() {
    router.push("/(auth)/login");
  }

  return (
    <SignUpView
      username={username}
      email={email}
      password={password}
      isSubmitting={isSubmitting}
      error={error}
      onUsernameChange={usernameChangeACB}
      onEmailChange={emailChangeACB}
      onPasswordChange={passwordChangeACB}
      onSubmit={submitACB}
      onLoginPress={handleLoginPress}
    />
  );
});

export default SignUpScreen;
