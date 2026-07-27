import { View, StyleSheet } from "react-native";

import PersonalDetailsUsernameCard from "../../components/profileComponents/PersonalDetailsUsernameCard.jsx";
import PersonalDetailsPasswordCard from "../../components/profileComponents/PersonalDetailsPasswordCard.jsx";
import DeleteAccountCard from "../../components/profileComponents/DeleteAccountCard.jsx";
import FadeInFromBottomView from "../../components/navigation/FadeInFromBottomView.jsx";

export default function ProfilePersonalDetailsView(props) {
  return (
    <View style={styles.inlineSection}>
      <View style={styles.cardsStack}>
        <FadeInFromBottomView delay={60}>
          <PersonalDetailsUsernameCard
            username={props.username || props.usernamePlaceholder || ""}
            disabled={props.isSubmitting}
            onPress={props.onUsernameEdit}
          />
        </FadeInFromBottomView>
        <FadeInFromBottomView delay={120}>
          <PersonalDetailsPasswordCard
            disabled={props.isSubmitting}
            onPress={props.onPasswordResetMenuOpen}
          />
        </FadeInFromBottomView>
        <FadeInFromBottomView delay={180}>
          <DeleteAccountCard
            disabled={props.isSubmitting}
            onPress={props.onDeleteAccountRequest}
          />
        </FadeInFromBottomView>
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
