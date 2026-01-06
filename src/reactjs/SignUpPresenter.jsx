import { useState } from "react";
import { observer } from "mobx-react-lite";
import { SignUpView } from "/src/views/SignUpView.jsx";

const SignUp = observer(function SignUp(props) {
  const model = props.model;

  // those are local and don't interfere with reactivity (shouldn't affect the A)
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // wrap up in more compliant names for the course
  function usernameChangeACB(value) {
    setUsername(value);
  }
  function emailChangeACB(value) {
    setEmail(value);
  }
  function passwordChangeACB(value) {
    setPassword(value);
  }

  // call the action of the model
  async function submitACB(evt) {
    evt.preventDefault();

    setError(null);
    setIsSubmitting(true);

    try {
      // the presenter doesn't need to know how we register. It just ask the model to do so.
      await model.submitSignup(username, email, password);
    } catch (e) {
      console.error(e);
      // we can make the message better for the user
      const message = e.message || "Impossible to create an account.";
      setError(message);
      setIsSubmitting(false); // On débloque le bouton pour qu'il puisse réessayer
    }
  }

  return (
    <SignUpView
      // local values
      username={username}
      email={email}
      password={password}
      isSubmitting={isSubmitting}
      error={error}
      // callbacks
      onUsernameChange={usernameChangeACB}
      onEmailChange={emailChangeACB}
      onPasswordChange={passwordChangeACB}
      onSubmit={submitACB}
    />
  );
});

export { SignUp };
