import { View, Text, TextInput, StyleSheet } from "react-native";

export default function ProfilePersonalDetailsView(props) {
  return (
    <View style={styles.inlineSection}>
      <Text style={styles.preferenceSummaryLabel}>Personal Details</Text>
      <View style={styles.accountCard}>
        <View style={styles.field}>
          <Text style={styles.label}>E-mail</Text>
          <TextInput
            value={props.email}
            placeholder={props.emailPlaceholder}
            editable={false}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#8E8E8E"
            style={[styles.input, styles.inputDisabled]}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            value={props.username}
            placeholder={props.usernamePlaceholder}
            placeholderTextColor="#8E8E8E"
            onChangeText={props.onUsernameChange}
            editable={!props.isSubmitting}
            style={styles.input}
          />
        </View>

        {!props.hidePassword && (
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={props.password}
              onChangeText={props.onPasswordChange}
              editable={!props.isSubmitting}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#8E8E8E"
              style={styles.input}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inlineSection: {
    gap: 5,
  },
  accountCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#141414",
    borderWidth: 2,
    borderColor: "#1E1E1E",
    gap: 14,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1E1E1E",
    backgroundColor: "#000000",
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#ffffff",
  },
  inputDisabled: {
    color: "#8E8E8E",
  },
  preferenceSummaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
  },
});
