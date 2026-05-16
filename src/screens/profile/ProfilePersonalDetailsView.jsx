import { View, StyleSheet } from "react-native";

import PersonalDetailsUsernameCard from "../../components/profileComponents/PersonalDetailsUsernameCard.jsx";
import PersonalDetailsPasswordCard from "../../components/profileComponents/PersonalDetailsPasswordCard.jsx";

export default function ProfilePersonalDetailsView(props) {
  return (
    <View style={styles.inlineSection}>
      <View style={styles.cardsStack}>
        <PersonalDetailsUsernameCard
          username={props.username || props.usernamePlaceholder || ""}
          disabled={props.isSubmitting}
          onPress={props.onUsernameEdit}
        />
        <PersonalDetailsPasswordCard
          disabled={props.isSubmitting}
          onPress={props.onPasswordResetMenuOpen}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inlineSection: {
    paddingBottom: 12,
  },
  cardsStack: {
    gap: 12,
  },
});
