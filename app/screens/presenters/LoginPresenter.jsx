// src/reactjs/LoginPresenter.jsx
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { LoginView } from "../screens/LoginView.jsx";
import { useState } from "react";

const Login = observer(function Login(props) {
    const model = props.model;
    const router = useRouter();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // wrap up in more compliant names for the course
    function identifierChangeACB(value) { setIdentifier(value); }
    function passwordChangeACB(value) { setPassword(value); }


    async function submitACB(evt) {
        evt.preventDefault();

        setError(null);
        setIsSubmitting(true);

        try {
            // the presenter doesn't need to know how we login. It just ask the model to do so.
            await model.submitLogin(identifier, password);

            router.push("/app");

        } catch (e) {
            console.error(e);
            // we can make the message better for the user
            const message = "E-Mail or password incorrect";
            setError(message);
            setIsSubmitting(false); // On débloque le bouton pour qu'il puisse réessayer
        }
    }
    async function submitGoogleACB(evt) {
        evt.preventDefault();

        setError(null);
        setIsSubmitting(true);

        try {
            // the presenter doesn't need to know how we login. It just ask the model to do so.
            await model.submitGoogle();

            router.push("/app");

        } catch (e) {
            console.error(e);
            // we can make the message better for the user
            const message = e.message || "Impossible to login.";
            setError(message);
            setIsSubmitting(false); // On débloque le bouton pour qu'il puisse réessayer
        }
    }

    return (
        <LoginView
            // local values
            identifier={identifier}
            password={password}
            isSubmitting={isSubmitting}
            error={error}

            // callback funtions
            onIdentifierChange={identifierChangeACB}
            onPasswordChange={passwordChangeACB}
            onSubmit={submitACB}
            onSubmitGoogle={submitGoogleACB}
        />
    );
});

export { Login };