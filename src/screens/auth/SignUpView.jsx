import { StyleSheet, View } from "react-native";
import AuthBrandHeader from "../../components/authComponents/AuthBrandHeader.jsx";
import SignFormInput from "../../components/authComponents/SignFormInput.jsx";
import GoogleButtonComponent from "../../components/authComponents/GoogleButton.jsx";
import IBMPlexText from "../../components/textComponents/IBMPlexText.jsx";

export function SignUpView(props) {
  return (
    <View style={{ flex: 1 }}>
      <AuthBrandHeader />

      <View style={styles.formContent}>
        <SignFormInput
          text="Username"
          image="user"
          inputProps={{
            value: props.username,
            onChangeText: props.onUsernameChange,
            autoCapitalize: "none",
          }}
        />
        <SignFormInput
          text="E-mail"
          image="email"
          inputProps={{
            value: props.email,
            onChangeText: props.onEmailChange,
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

        {props.showGoogle !== false ? (
          <GoogleButtonComponent
            onPress={props.onSubmitGoogle}
            disabled={props.isSubmitting}
          />
        ) : null}

        {props.message ? (
          <IBMPlexText defaultWhite center={true}>{props.message}</IBMPlexText>
        ) : null}

        {props.error ? (
          <IBMPlexText center={true} style={styles.errorText}>{props.error}</IBMPlexText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formContent: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 44,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
    marginHorizontal: 28,
    marginTop: 2,
  },
});


// export function SignUpView(props) {
//   function usernameChangedACB(evt) {
//     props.onUsernameChange(evt.target.value);
//   }
//   function emailChangedACB(evt) {
//     props.onEmailChange(evt.target.value);
//   }
//   function passwordChangedACB(evt) {
//     props.onPasswordChange(evt.target.value);
//   }

//   return (
//     <div className="signup-page">
//       <h2 className="signup-title">
//         <span className="signup-title-left">Sign</span>
//         <span className="signup-title-right">Up</span>
//       </h2>
//       <p className="signup-info">
//         Have already an account ?
//         <a href="#/login" className="signup-login-link">
//           Login
//         </a>
//       </p>

//       <form className="signup-form" onSubmit={props.onSubmit}>
//         <div className="signup-row">
//           <label htmlFor="signup-username">Username :</label>
//           <input
//             id="signup-username"
//             type="text"
//             value={props.username}
//             onChange={usernameChangedACB}
//             required
//           />
//         </div>

//         <div className="signup-row">
//           <label htmlFor="signup-email">E-Mail :</label>
//           <input
//             id="signup-email"
//             type="email"
//             value={props.email}
//             onChange={emailChangedACB}
//             required
//           />
//         </div>

//         <div className="signup-row">
//           <label htmlFor="signup-password">Password :</label>
//           <input
//             id="signup-password"
//             type="password"
//             value={props.password}
//             onChange={passwordChangedACB}
//             required
//           />
//         </div>

//         {props.error && <p className="signup-error">{props.error}</p>}

//         <button
//           className="signup-submit"
//           type="submit"
//           disabled={props.isSubmitting}
//         >
//           {props.isSubmitting ? "Signing up..." : "Sign Up"}
//         </button>
//       </form>
//     </div>
//   );
// }
