import { View, TouchableOpacity, StyleSheet } from "react-native";
import StandardText from "../../components/textComponents/StandardText.jsx";
import TitleText from "../../components/textComponents/TitleText.jsx";
import SignFormInput from "../../components/SignFormInput.jsx";
import GoogleButtonComponent from "../../components/GoogleButtonComponent.jsx";

export function LoginView(props) {
    return (
        <View>
            <TitleText>Welcome back!</TitleText>

            <SignFormInput 
                text="E-mail"
                image="user"
                inputProps = {{value: props.identifier,
                onChangeText: props.onIdentifierChange,
                keyboardType : "email-address",
                autoCapitalize: "none",
                }}  
            />
            <SignFormInput 
                text="Password"
                image="user"
                inputProps = {{value: props.password, 
                onChangeText: props.onPasswordChange,
                secureTextEntry: true,
                }}  
            />
            <GoogleButtonComponent onPress={props.onSubmitGoogle} />
            <TouchableOpacity style={{width: "100%"}}>
                    <StandardText center={true}>Forgot password?</StandardText>
                </TouchableOpacity>

            <View style={styles.linksRow}>
                <TouchableOpacity onPress={props.onSignupPress}>
                    <StandardText>Sign up</StandardText>
                </TouchableOpacity>
            </View>

            {props.error && <StandardText>{props.error}</StandardText>}

            <TouchableOpacity onPress={props.onSubmit} disabled={props.isSubmitting}>
                <StandardText>{props.isSubmitting ? "Logging in..." : "Login"}</StandardText>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    linksRow: { flexDirection: "row", justifyContent: "space-between" },
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
