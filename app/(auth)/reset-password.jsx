import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { observer } from "mobx-react-lite";
import { useLocalSearchParams, useRouter } from "expo-router";
import SignFormInput from "../../src/components/authComponents/SignFormInput.jsx";
import StandardText from "../../src/components/textComponents/StandardText.jsx";
import TitleText from "../../src/components/textComponents/TitleText.jsx";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";

function getParamValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function mapResetPasswordError(errorCode) {
  switch (errorCode) {
    case "auth/invalid-email":
      return "Enter a valid e-mail address.";
    case "auth/missing-email":
      return "Enter the e-mail address for your account.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "We could not send the reset link right now. Please try again.";
  }
}

const RESET_PASSWORD_SUCCESS_MESSAGE =
  "If that account exists, a password reset link is on its way.";

const ResetPasswordScreen = observer(function ResetPasswordScreen() {
  const model = reactiveModel;
  const router = useRouter();
  const params = useLocalSearchParams();
  const source = getParamValue(params?.source);
  const initialEmail = getParamValue(params?.email);

  const [email, setEmail] = useState(
    typeof initialEmail === "string" ? initialEmail : ""
  );
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleBackPress() {
    if (source === "auth") {
      router.replace("/(auth)/auth");
      return;
    }

    router.replace({
      pathname: "/(auth)/login",
      params: params?.returnTo ? { returnTo: getParamValue(params.returnTo) } : {},
    });
  }

  async function handleSubmitPress() {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Enter the e-mail address for your account.");
      setSuccessMessage(null);
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await model.submitPasswordReset(normalizedEmail);
      setSuccessMessage(RESET_PASSWORD_SUCCESS_MESSAGE);
      setEmail(normalizedEmail);
    } catch (submitError) {
      if (submitError?.message === "auth/user-not-found") {
        setSuccessMessage(RESET_PASSWORD_SUCCESS_MESSAGE);
        setEmail(normalizedEmail);
        return;
      }

      const nextMessage = mapResetPasswordError(submitError.message);
      setError(nextMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <TitleText height={200}>Reset Password</TitleText>
      <StandardText center={true} style={styles.description}>
        Enter the e-mail address you use to sign in and we will send you a reset
        link.
      </StandardText>

      <SignFormInput
        text="E-mail"
        image="user"
        inputProps={{
          value: email,
          onChangeText: (value) => {
            setEmail(value);
            if (error) {
              setError(null);
            }
            if (successMessage) {
              setSuccessMessage(null);
            }
          },
          keyboardType: "email-address",
          autoCapitalize: "none",
          editable: !isSubmitting,
        }}
      />

      <TouchableOpacity
        style={[styles.primaryButton, isSubmitting ? styles.buttonDisabled : null]}
        onPress={handleSubmitPress}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#000" />
        ) : (
          <StandardText textColor="#000" fontSize={22}>
            Send reset link
          </StandardText>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleBackPress}
        disabled={isSubmitting}
      >
        <StandardText center={true}>Back to sign in</StandardText>
      </TouchableOpacity>

      {successMessage ? (
        <StandardText center={true} style={styles.successText}>
          {successMessage}
        </StandardText>
      ) : null}

      {error ? (
        <StandardText center={true} style={styles.errorText}>
          {error}
        </StandardText>
      ) : null}
    </View>
  );
});

export default ResetPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  description: {
    marginHorizontal: 20,
    marginBottom: 20,
    fontSize: 20,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 120,
    height: 70,
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 12,
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    minHeight: 40,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  successText: {
    color: "#4ADE80",
    marginHorizontal: 20,
  },
  errorText: {
    marginHorizontal: 20,
  },
});
