import { View, TouchableOpacity, StyleSheet } from "react-native";
import StandardText from "../../components/textComponents/StandardText.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";
import SignFormInput from "../../components/authComponents/SignFormInput.jsx";
import GoogleButtonComponent from "../../components/authComponents/GoogleButton.jsx";

export function LoginView(props) {
  return (
    <View style={{ flex: 1 }}>
      <TitleText>Welcome back!</TitleText>

      <SignFormInput
        text="E-mail"
        image="user"
        inputProps={{
          value: props.identifier,
          onChangeText: props.onIdentifierChange,
          keyboardType: "email-address",
          autoCapitalize: "none",
        }}
      />
      <SignFormInput
        text="Password"
        image="lock"
        inputProps={{
          value: props.password,
          onChangeText: props.onPasswordChange,
          secureTextEntry: true,
        }}
      />
      <GoogleButtonComponent
        onPress={props.onSubmitGoogle}
        disabled={props.isSubmitting}
      />
      <TouchableOpacity
        style={styles.forgotPasswordButton}
        onPress={props.onForgotPasswordPress}
        disabled={props.isSubmitting}
      >
        <StandardText center={true}>Forgot your password?</StandardText>
      </TouchableOpacity>

      {props.error ? <StandardText center={true}>{props.error}</StandardText> : null}
      {props.verificationMessage ? (
        <StandardText center={true}>{props.verificationMessage}</StandardText>
      ) : null}
      {props.canResendVerification ? (
        <TouchableOpacity
          style={styles.resendVerificationButton}
          onPress={props.onResendVerificationPress}
          disabled={props.isSubmitting || props.isResendingVerification}
        >
          <StandardText center={true}>
            {props.isResendingVerification
              ? "Sending verification e-mail..."
              : "Resend verification e-mail"}
          </StandardText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  forgotPasswordButton: {
    width: "100%",
    marginBottom: 15,
  },
  resendVerificationButton: {
    width: "100%",
    marginTop: 4,
    marginBottom: 15,
  },
});

// // src/views/LoginView.jsx

// export function LoginView(props) {
//     function identifierChangedACB(evt) {
//         props.onIdentifierChange(evt.target.value);
//     }

//     function passwordChangedACB(evt) {
//         props.onPasswordChange(evt.target.value);
//     }

//     return (
//         <div className="login-background">
//         <div className="signup-page login-page">
//             {/* Switch to signup (top helper text) */}
//             <p className="login-top-info">
//                 Welcome back! Please log in to continue.
//             </p>

//             <form className="signup-form" onSubmit={props.onSubmit}>
//                 <div className="signup-row">
//                     <label htmlFor="login-identifier">E-Mail :</label>
//                     <input
//                         id="login-identifier"
//                         type="text"
//                         value={props.identifier}
//                         onChange={identifierChangedACB}
//                         required
//                     />
//                 </div>

//                 <div className="signup-row">
//                     <label htmlFor="login-password">Password :</label>
//                     <input
//                         id="login-password"
//                         type="password"
//                         value={props.password}
//                         onChange={passwordChangedACB}
//                         required
//                     />
//                 </div>

//                 {/* Forgot / signup links row */}
//                 <div className="login-links-row">
//                     <button
//                         type="button"
//                         className="login-link-button"
//                     >
//                         Forgot password?
//                     </button>

//                     <a href="#/signup" className="login-link-button">
//                         Sign up
//                     </a>
//                 </div>

//                 {props.error && (
//                     <p className="signup-error">
//                         {props.error}
//                     </p>
//                 )}

//                 <button
//                     className="signup-submit"
//                     type="submit"
//                     disabled={props.isSubmitting}
//                 >
//                     {props.isSubmitting ? "Logging in..." : "Login"}
//                 </button>
//             </form>

//             <button
//                 type="button"
//                 className="login-google-button"
//                 onClick={props.onSubmitGoogle}
//             >
//                 Continue with Google
//             </button>
//         </div>
//     </div>
//     );
// }
