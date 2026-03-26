import { Tabs, Redirect } from "expo-router";
import { observer } from "mobx-react-lite";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import logo from "../../src/assets/logo.png";

const TabsLayout = observer(function TabsLayout() {
  const model = reactiveModel;
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams();

  function buildProtectedReturnTo() {
    if (typeof pathname !== "string" || !pathname.startsWith("/")) {
      return "/(tabs)";
    }

    const searchParams = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (typeof entry === "string") {
            searchParams.append(key, entry);
          }
        });
        return;
      }

      if (typeof value === "string") {
        searchParams.set(key, value);
      }
    });

    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  const protectedReturnTo = buildProtectedReturnTo();

  // Redirect to auth if not logged in
  if (!model.user && model.ready) {
    return (
      <Redirect
        href={{
          pathname: "/(auth)/login",
          params: { returnTo: protectedReturnTo },
        }}
      />
    );
  }

  function handleLogoPress() {
    // If training plan exists, navigate to overview; otherwise go home
    if (model.trainingPlan) {
      router.push("/(tabs)/overview");
    } else {
      router.push("/(tabs)");
    }
  }

  return (
    <View style={styles.container}>
      Custom Header
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={handleLogoPress} style={styles.logoContainer}>
          <Image source={logo} style={styles.logo} />
        </TouchableOpacity>

        <Text style={styles.title}>Power Training Coach</Text>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/profile")}
          style={styles.profileButton}
        >
          <Text style={styles.profileButtonText}>👤</Text>
        </TouchableOpacity>
      </View> */}

      {/* Tab Navigator */}
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: "transparent" },
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: "#111827",
          tabBarInactiveTintColor: "#6b7280",
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>🏠</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="overview"
          options={{
            title: "Plan",
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>📋</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Text style={{ fontSize: size, color }}>👤</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="subscription"
          options={{
            href: null, // Hide from tab bar, accessible via navigation
          }}
        />
        <Tabs.Screen
          name="feedback"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="day-detail"
          options={{
            href: null, // Hide from tab bar
          }}
        />
      </Tabs>
    </View>
  );
});

export default TabsLayout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  logoContainer: {
    padding: 4,
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
    letterSpacing: 0.3,
  },
  profileButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  profileButtonText: {
    fontSize: 16,
    color: "#ffffff",
  },
  tabBar: {
    backgroundColor: "transparent",
    borderTopWidth: 1,
    borderTopColor: "#e2e2e2",
    paddingTop: 4,
    paddingBottom: 4,
    height: 56,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
});
