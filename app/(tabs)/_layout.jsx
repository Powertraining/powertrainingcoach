import { Tabs, Redirect } from "expo-router";
import { observer } from "mobx-react-lite";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { useLocalSearchParams, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";

function TabIcon({ source, size, focused, label }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <View
        style={[
          styles.tabIconContent,
          focused ? styles.tabIconContentActive : styles.tabIconContentInactive,
        ]}
      >
        <Image
          source={source}
          style={[
            styles.tabIconImage,
            { width: size, height: size },
            focused ? styles.tabIconImageActive : styles.tabIconImageInactive,
          ]}
        />
        {focused ? (
          <Text numberOfLines={1} style={styles.tabIconLabel}>
            {label}
          </Text>
        ) : null}
      </View>
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

  if (
    pathname === "/profile" ||
    pathname === "/(tabs)/profile" ||
    pathname === "/profile-personal-details" ||
    pathname === "/(tabs)/profile-personal-details" ||
    pathname === "/profile-plan-adjustments" ||
    pathname === "/(tabs)/profile-plan-adjustments" ||
    pathname === "/profile-event-preparation" ||
    pathname === "/(tabs)/profile-event-preparation" ||
    pathname === "/profile-injuries" ||
    pathname === "/(tabs)/profile-injuries"
  ) {
    return "profile";
  }

  return null;
}

const VISIBLE_TAB_ROUTES = new Set(["index", "overview", "forum", "profile"]);
const PROFILE_SECONDARY_ROUTES = new Set([
  "/profile-personal-details",
  "/(tabs)/profile-personal-details",
  "/profile-plan-adjustments",
  "/(tabs)/profile-plan-adjustments",
  "/profile-event-preparation",
  "/(tabs)/profile-event-preparation",
  "/profile-injuries",
  "/(tabs)/profile-injuries",
]);

function getTabBarBottomOffset(bottomInset) {
  return Math.max(Math.round(bottomInset / 2), 12);
}

function shouldHideTabBar(pathname, activeTabName, requestedHidden) {
  if (PROFILE_SECONDARY_ROUTES.has(pathname)) {
    return true;
  }

  if (activeTabName === "forum") {
    return false;
  }

  return Boolean(requestedHidden);
}

function CustomTabBar({ state, descriptors, navigation, activeTabName, hidden, bottomOffset }) {
  if (hidden) {
    return null;
  }

  const visibleRoutes = state.routes.filter((route) => VISIBLE_TAB_ROUTES.has(route.name));

  return (
    <View style={[styles.customTabBar, { bottom: bottomOffset }]}>
      {visibleRoutes.map((route) => {
        const options = descriptors[route.key]?.options ?? {};
        const focused = activeTabName === route.name;

        function onPress() {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        }

        function onLongPress() {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        }

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[
              styles.tabBarButton,
              focused ? styles.tabBarButtonActive : styles.tabBarButtonInactive,
            ]}
          >
            {typeof options.tabBarIcon === "function"
              ? options.tabBarIcon({
                  focused,
                  color: focused ? "#fff" : "#000",
                  size: 24,
                })
              : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const TabsLayout = observer(function TabsLayout() {
  const model = reactiveModel;
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const activeTabName = getActiveTabName(pathname);
  const isTabBarHidden = shouldHideTabBar(pathname, activeTabName, model.forumTabBarHidden);
  const tabBarBottomOffset = getTabBarBottomOffset(insets.bottom);

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
        tabBar={(props) => (
          <CustomTabBar
            {...props}
            activeTabName={activeTabName}
            hidden={isTabBarHidden}
            bottomOffset={tabBarBottomOffset}
          />
        )}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: "transparent" },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ size, focused }) => (
              <TabIcon
                source={require("../../src/assets/icons/home.png")}
                size={size}
                focused={focused}
                label="Home"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="overview"
          options={{
            title: "Plan",
            tabBarIcon: ({ size, focused }) => (
              <TabIcon
                source={require("../../src/assets/icons/sport.png")}
                size={size}
                focused={focused}
                label="Plan"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="forum"
          options={{
            title: "Forum",
            tabBarIcon: ({ size, focused }) => (
              <TabIcon
                source={require("../../src/assets/icons/conversation.png")}
                size={size}
                focused={focused}
                label="Forum"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ size, focused }) => (
              <TabIcon
                source={require("../../src/assets/icons/user.png")}
                size={size}
                focused={focused}
                label="Profile"
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
          name="profile-personal-details"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile-plan-adjustments"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile-event-preparation"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile-injuries"
          options={{
            href: null,
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
      {model.forumOverlayVisible && !isTabBarHidden ? (
        <Pressable
          onPress={() => model.requestForumOverlayDismiss()}
          style={[styles.tabBarDisabledOverlay, { bottom: tabBarBottomOffset }]}
        />
      ) : null}
    </View>
  );
});

export default TabsLayout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customTabBar: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    height: 70,
    borderRadius: 120,
    overflow: "hidden",
    padding: 6,
    flexDirection: "row",
    zIndex: 10,
    marginBottom: 5,
  },
  tabBarDisabledOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    height: 70,
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 120,
    zIndex: 20,
  },
  tabBarButton: {
    height: "100%",
    borderRadius: 120,
    overflow: "hidden",
    flex: 1,
  },
  tabBarButtonInactive: {
    flex: 1,
  },
  tabBarButtonActive: {
    flex: 3,
  },
  tabIcon: {
    flex: 1,
    width: "100%",
    borderRadius: 120,
  },
  tabIconActive: {
    backgroundColor: "#000",
  },
  tabIconContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
  tabIconContentInactive: {
    justifyContent: "center",
  },
  tabIconContentActive: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
  },
  tabIconImage: {
    resizeMode: "contain",
  },
  tabIconLabel: {
    color: "#fff",
    fontFamily: "BebasNeue",
    fontSize: 24,
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  tabIconImageActive: {
    tintColor: "#fff",
  },
  tabIconImageInactive: {
    tintColor: "#000",
  },
});
