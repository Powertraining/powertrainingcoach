import { Stack } from "expo-router";
import { View, StyleSheet } from "react-native";

export default function AuthLayout() {
  return (
    <View style={styles.container}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000", },
          animation: "slide_from_right",
          
        }}
      >
        <Stack.Screen name="auth" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
});
