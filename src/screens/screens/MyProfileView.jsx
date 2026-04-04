import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

import AppLogicSettingsFields from "./AppLogicSettingsFields.jsx";
import StandardText from "../../components/textComponents/StandardText";

export function MyProfileView(props) {
  return (
    <View>
      <StandardText fontSize={24}>My Profile</StandardText>

      <View>
        <StandardText>Username:</StandardText>
        <TextInput
          value={props.username}
          placeholder={props.usernamePlaceholder}
          onChangeText={props.onUsernameChange}
          editable={!props.isSubmitting}
        />
      </View>

      <View>
        <StandardText>E-mail:</StandardText>
        <TextInput
          value={props.email}
          placeholder={props.emailPlaceholder}
          editable={false}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {!props.hidePassword && (
        <View>
          <StandardText>Password:</StandardText>
          <TextInput
            value={props.password}
            onChangeText={props.onPasswordChange}
            editable={!props.isSubmitting}
            secureTextEntry
            placeholder="••••••••"
          />
        </View>
      )}

        <View style={styles.subscriptionCard}>
          <Text style={styles.subscriptionLabel}>Subscription</Text>
          <Text style={styles.subscriptionValue}>{props.subscriptionText}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <AppLogicSettingsFields
          title="App Logic Settings"
          description="These values are saved to your profile and used when the app builds or regenerates training plans."
          values={props.appLogicSettings}
          onChange={props.onAppLogicSettingsChange}
        />
      </View>

      {props.error ? <Text style={styles.errorText}>{props.error}</Text> : null}

      <TouchableOpacity
        onPress={props.onSave}
        disabled={props.isSubmitting || !props.canSave}
      >
        <StandardText>{props.isSubmitting ? "Saving..." : "Save changes"}</StandardText>
      </TouchableOpacity>

      <TouchableOpacity onPress={props.onCancel} disabled={props.isSubmitting}>
        <StandardText>Cancel</StandardText>
      </TouchableOpacity>

      <TouchableOpacity onPress={props.onLogout} disabled={props.isSubmitting}>
        <StandardText>Logout</StandardText>
      </TouchableOpacity>
    </View>
  );
}


// export function MyProfileView(props) {
//   function usernameChangedACB(evt) {
//     props.onUsernameChange(evt.target.value);
//   }
//   function passwordChangedACB(evt) {
//     props.onPasswordChange(evt.target.value);
//   }

//   return (
//     <div className="profile-page">
//       <h2 className="profile-title">My Profile</h2>

//       <form className="profile-form" onSubmit={props.onSave}>
//         <div className="profile-row">
//           <label htmlFor="profile-username" className="profile-label">Username:</label>
//           <input
//             id="profile-username"
//             className="profile-input"
//             type="text"
//             value={props.username}
//             placeholder={props.usernamePlaceholder}
//             onChange={usernameChangedACB}
//             disabled={props.isSubmitting}
//           />
//         </div>

//         <div className="profile-row">
//           <label htmlFor="profile-email" className="profile-label">E-mail:</label>
//           <input
//             id="profile-email"
//             className="profile-input profile-input--readonly"
//             type="email"
//             value={props.email}
//             placeholder={props.emailPlaceholder}
//             disabled
//             readOnly
//           />
//         </div>

//         {!props.hidePassword && (
//           <div className="profile-row">
//             <label htmlFor="profile-password" className="profile-label">Password:</label>
//             <input
//               id="profile-password"
//               className="profile-input"
//               type="password"
//               value={props.password}
//               onChange={passwordChangedACB}
//               disabled={props.isSubmitting}
//               placeholder="••••••••"
//             />
//           </div>
//         )}


//         {props.error && <p className="profile-error">{props.error}</p>}

//         <div className="profile-actions">
//           <button
//             className="profile-save"
//             type="submit"
//             disabled={props.isSubmitting || !props.canSave}
//           >
//             {props.isSubmitting ? "Saving..." : "Save changes"}
//           </button>

//           <button
//             className="profile-cancel"
//             type="button"
//             onClick={props.onCancel}
//             disabled={props.isSubmitting}
//           >
//             Cancel
//           </button>
//         </div>
//         {/* could be implemented in the future 
//         <div className="profile-subscription">
//           <span className="profile-subscription-label">Subscription:</span>
//           <span className="profile-subscription-value">{props.subscriptionText}</span>
//         </div>
        
//         <div className="profile-subscription-actions">
//           <button
//             className="profile-change-subscription"
//             type="button"
//             onClick={props.onChangeSubscription}
//             disabled={props.isSubmitting}
//           >
//             Change Subscription
//           </button>
//         </div>*/}

//         <div className="profile-logout-actions">
//           <button
//             className="profile-logout"
//             type="button"
//             onClick={props.onLogout}
//             disabled={props.isSubmitting}
//           >
//             Logout
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }
