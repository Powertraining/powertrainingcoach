import {
  useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { observer } from "mobx-react-lite";
import { useLocalSearchParams, useRouter } from "expo-router";
import WhiteBottomMenu from "../../src/components/profileComponents/WhiteBottomMenu.jsx";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import IBMPlexText from "../../src/components/textComponents/IBMPlexText.jsx";
import { getFriendlyErrorMessage } from "../../src/services/utils/errorMessages.js";

function getParamValue(value) {
  return Array.isArray(value) ? value[0] : value;
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
    if (isSubmitting) {
      return;
    }

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
      const message = "Enter the e-mail address for your account.";
      setError(message);
      model.showError?.(message);
      setSuccessMessage(null);
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await model.submitPasswordReset(normalizedEmail);
      setSuccessMessage(RESET_PASSWORD_SUCCESS_MESSAGE);
      model.showSuccess?.(RESET_PASSWORD_SUCCESS_MESSAGE);
      setEmail(normalizedEmail);
    } catch (submitError) {
      if (submitError?.message === "auth/user-not-found") {
        setSuccessMessage(RESET_PASSWORD_SUCCESS_MESSAGE);
        model.showSuccess?.(RESET_PASSWORD_SUCCESS_MESSAGE);
        setEmail(normalizedEmail);
        return;
      }

      const nextMessage = getFriendlyErrorMessage(
        submitError,
        "We could not send the reset link right now. Please try again."
      );
      setError(nextMessage);
      model.showError?.(nextMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <WhiteBottomMenu
        visible
        title="Reset password"
        description="Enter your account e-mail and we will send a reset link."
        onDismiss={handleBackPress}
        buttonText={isSubmitting ? "Sending..." : "Send reset link"}
        buttonDisabled={isSubmitting}
        onButtonPress={handleSubmitPress}
        secondaryButtonText="Back to sign in"
        secondaryButtonDisabled={isSubmitting}
        onSecondaryButtonPress={handleBackPress}
        sheetStyle={styles.sheet}
        contentStyle={styles.sheetContent}
        bottomPadding={10}
      >
        <TextInput
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (error) {
              setError(null);
            }
            if (successMessage) {
              setSuccessMessage(null);
            }
          }}
          placeholder="E-mail"
          placeholderTextColor="#777777"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isSubmitting}
          style={styles.emailInput}
        />

        {successMessage ? (
          <IBMPlexText style={styles.successText}>
            {successMessage}
          </IBMPlexText>
        ) : null}

        {error ? (
          <IBMPlexText style={styles.errorText}>
            {error}
          </IBMPlexText>
        ) : null}
      </WhiteBottomMenu>
    </View>
  );
});

export default ResetPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sheet: {
    gap: 10,
    paddingTop: 8,
  },
  sheetContent: {
    gap: 8,
  },
  emailInput: {
    backgroundColor: "#f7f7f7",
    borderColor: "#dedede",
    borderRadius: 16,
    borderWidth: 1,
    color: "#141414",
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 16,
  },
  successText: {
    color: "#047857",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
});
