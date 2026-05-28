import { View, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import AuthBrandHeader from "../../components/authComponents/AuthBrandHeader.jsx";
import SignFormInput from "../../components/authComponents/SignFormInput.jsx";
import GoogleButtonComponent from "../../components/authComponents/GoogleButton.jsx";
import WhiteBottomMenu from "../../components/profileComponents/WhiteBottomMenu.jsx";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

export function LoginView(props) {
  return (
    <View style={{ flex: 1 }}>
      <AuthBrandHeader />

      <View style={styles.formContent}>
        <SignFormInput
          text="E-mail"
          image="email"
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
          <IBMPlexText defaultWhite center={true}>Forgot your password?</IBMPlexText>
        </TouchableOpacity>

        {props.verificationMessage ? (
          <IBMPlexText defaultWhite center={true}>{props.verificationMessage}</IBMPlexText>
        ) : null}
      </View>

      <WhiteBottomMenu
        visible={Boolean(props.resetPasswordVisible)}
        title="Reset password"
        description="Enter your account e-mail and we will send a reset link."
        onDismiss={props.onResetPasswordDismiss}
        buttonText={props.isResetPasswordSubmitting ? "Sending..." : "Send reset link"}
        buttonDisabled={props.isResetPasswordSubmitting}
        onButtonPress={props.onResetPasswordSubmit}
        secondaryButtonText="Back to sign in"
        secondaryButtonDisabled={props.isResetPasswordSubmitting}
        onSecondaryButtonPress={props.onResetPasswordDismiss}
        sheetStyle={styles.resetSheet}
        contentStyle={styles.resetSheetContent}
        bottomPadding={10}
      >
        <TextInput
          value={props.resetPasswordEmail}
          onChangeText={props.onResetPasswordEmailChange}
          placeholder="E-mail"
          placeholderTextColor="#777777"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!props.isResetPasswordSubmitting}
          style={styles.resetEmailInput}
        />

        {props.resetPasswordSuccessMessage ? (
          <IBMPlexText style={styles.resetSuccessText}>
            {props.resetPasswordSuccessMessage}
          </IBMPlexText>
        ) : null}

        {props.resetPasswordError ? (
          <IBMPlexText style={styles.resetErrorText}>
            {props.resetPasswordError}
          </IBMPlexText>
        ) : null}
      </WhiteBottomMenu>
    </View>
  );
}

const styles = StyleSheet.create({
  formContent: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 44,
  },
  forgotPasswordButton: {
    width: "100%",
    marginBottom: 15,
  },
  resetSheet: {
    gap: 10,
    paddingTop: 8,
  },
  resetSheetContent: {
    gap: 8,
  },
  resetEmailInput: {
    backgroundColor: "#f7f7f7",
    borderColor: "#dedede",
    borderRadius: 16,
    borderWidth: 1,
    color: "#141414",
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 16,
  },
  resetSuccessText: {
    color: "#047857",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  resetErrorText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
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
