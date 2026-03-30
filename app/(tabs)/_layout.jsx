import { Tabs, Redirect } from "expo-router";
import { observer } from "mobx-react-lite";
import { View, StyleSheet, Image } from "react-native";
import { useLocalSearchParams, usePathname } from "expo-router";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";

function TabIcon({ source, size, focused }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Image
        source={source}
        style={[
          styles.tabIconImage,
          { width: size, height: size },
          focused ? styles.tabIconImageActive : styles.tabIconImageInactive,
        ]}
      />
    </View>
  );
}

function getActiveTabName(pathname) {
  if (pathname === "/" || pathname === "/index" || pathname === "/(tabs)" || pathname === "/(tabs)/index") {
    return "index";
  }

  if (pathname === "/forum" || pathname === "/(tabs)/forum") {
    return "forum";
  }

  if (pathname === "/overview" || pathname === "/(tabs)/overview") {
    return "overview";
  }

  if (pathname === "/profile" || pathname === "/(tabs)/profile") {
    return "profile";
  }

  return null;
}

const TabsLayout = observer(function TabsLayout() {
  const model = reactiveModel;
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const activeTabName = getActiveTabName(pathname);

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

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: "transparent" },
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarShowLabel: false,
          tabBarIconStyle: styles.tabBarIconWrapper,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarItemStyle:
              activeTabName === "index" ? styles.tabBarItemActive : [styles.tabBarItemInactive, { paddingLeft: 10 }],
            tabBarIcon: ({ size, focused }) => (
              <TabIcon
                source={require("../../src/assets/icons/home.png")}
                size={size}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="forum"
          options={{
            title: "Forum",
            tabBarItemStyle:
              activeTabName === "forum" ? styles.tabBarItemActive : styles.tabBarItemInactive,
            tabBarIcon: ({ size, focused }) => (
              <TabIcon
                source={require("../../src/assets/icons/conversation.png")}
                size={size}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="overview"
          options={{
            title: "Plan",
            tabBarItemStyle:
              activeTabName === "overview" ? styles.tabBarItemActive : styles.tabBarItemInactive,
            tabBarIcon: ({ size, focused }) => (
              <TabIcon
                source={require("../../src/assets/icons/sport.png")}
                size={size}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarItemStyle:
              activeTabName === "profile" ? styles.tabBarItemActive : [styles.tabBarItemInactive, { paddingRight: 10 }], 
            tabBarIcon: ({ size, focused }) => (
              <TabIcon
                source={require("../../src/assets/icons/user.png")}
                size={size}
                focused={focused}
              />
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
  tabBar: {
    backgroundColor: "#fff",
    height: 70,
    marginHorizontal: 30,
    marginVertical: 20,
    position: "absolute",
    borderRadius: 120,
    justifyContent: "center",
    overflow: "hidden",
    padding: 6,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  tabBarItemInactive: {
    flex: 1,
    height: "100%",
  },
  tabBarItemActive: {
    flex: 3,
    height: "100%",
  },
  tabBarIconWrapper: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  tabIcon: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 120,
  },
  tabIconActive: {
    backgroundColor: "#000",
  },
  tabIconImage: {
    resizeMode: "contain",
  },
  tabIconImageActive: {
    tintColor: "#fff",
  },
  tabIconImageInactive: {
    tintColor: "#000",
  },
});
