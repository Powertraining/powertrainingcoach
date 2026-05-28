import {
  Tabs,
  Redirect } from "expo-router";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  View,
  StyleSheet,
  Image,
  Pressable,
} from "react-native";
import { useLocalSearchParams, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import IBMPlexText from "../../src/components/textComponents/IBMPlexText.jsx";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const TAB_BAR_ANIMATION_DURATION = 220;

function TabIcon({ source, size, focused, label }) {
  return (
    <View style={styles.tabIcon}>
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
          <IBMPlexText numberOfLines={1} style={styles.tabIconLabel}>
            {label}
          </IBMPlexText>
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
    pathname === "/profile-subscription-details" ||
    pathname === "/(tabs)/profile-subscription-details" ||
    pathname === "/profile-exercise-analysis" ||
    pathname === "/(tabs)/profile-exercise-analysis" ||
    pathname === "/profile-exercise-analyses" ||
    pathname === "/(tabs)/profile-exercise-analyses" ||
    pathname === "/profile-exercise-analysis-post" ||
    pathname === "/(tabs)/profile-exercise-analysis-post" ||
    pathname === "/profile-personal-details" ||
    pathname === "/(tabs)/profile-personal-details" ||
    pathname === "/profile-plan-adjustments" ||
    pathname === "/(tabs)/profile-plan-adjustments" ||
    pathname === "/profile-event-preparation" ||
    pathname === "/(tabs)/profile-event-preparation" ||
    pathname === "/profile-injuries" ||
    pathname === "/(tabs)/profile-injuries" ||
    pathname === "/profile-saved-posts" ||
    pathname === "/(tabs)/profile-saved-posts" ||
    pathname === "/profile-my-posts" ||
    pathname === "/(tabs)/profile-my-posts"
  ) {
    return "profile";
  }

  return null;
}

const VISIBLE_TAB_ROUTES = new Set(["index", "overview", "forum", "profile"]);
const PROFILE_SECONDARY_ROUTES = new Set([
  "/profile-personal-details",
  "/(tabs)/profile-personal-details",
  "/profile-subscription-details",
  "/(tabs)/profile-subscription-details",
  "/profile-exercise-analysis",
  "/(tabs)/profile-exercise-analysis",
  "/profile-exercise-analyses",
  "/(tabs)/profile-exercise-analyses",
  "/profile-exercise-analysis-post",
  "/(tabs)/profile-exercise-analysis-post",
  "/profile-plan-adjustments",
  "/(tabs)/profile-plan-adjustments",
  "/profile-event-preparation",
  "/(tabs)/profile-event-preparation",
  "/profile-injuries",
  "/(tabs)/profile-injuries",
  "/profile-saved-posts",
  "/(tabs)/profile-saved-posts",
  "/profile-my-posts",
  "/(tabs)/profile-my-posts",
]);
const FULL_SCREEN_ROUTES = new Set([
  "/subscription",
  "/(tabs)/subscription",
]);
const GLOBAL_HIDDEN_TAB_ROUTES = new Set([
  "/",
  "/index",
  "/(tabs)",
  "/(tabs)/index",
  "/forum",
  "/(tabs)/forum",
  "/active-session",
  "/(tabs)/active-session",
]);

function getTabBarBottomOffset(bottomInset) {
  return Math.max(Math.round(bottomInset / 2), 12);
}

function shouldHideTabBar(pathname, activeTabName, requestedHidden) {
  if (FULL_SCREEN_ROUTES.has(pathname)) {
    return true;
  }

  if (PROFILE_SECONDARY_ROUTES.has(pathname)) {
    return true;
  }

  return Boolean(requestedHidden) && GLOBAL_HIDDEN_TAB_ROUTES.has(pathname);
}

function CustomTabBar({ state, descriptors, navigation, activeTabName, hidden, bottomOffset }) {
  const pillTranslateX = useRef(new Animated.Value(0)).current;
  const pillWidth = useRef(new Animated.Value(0)).current;
  const pillInitializedRef = useRef(false);
  const routeFlexAnimationsRef = useRef({});
  const [tabBarWidth, setTabBarWidth] = useState(0);

  const visibleRoutes = state.routes.filter((route) => VISIBLE_TAB_ROUTES.has(route.name));
  const visibleRouteNames = visibleRoutes.map((route) => route.name).join("|");

  function getRouteFlexAnimation(routeName) {
    if (!routeFlexAnimationsRef.current[routeName]) {
      routeFlexAnimationsRef.current[routeName] = new Animated.Value(
        activeTabName === routeName ? 3 : 1
      );
    }

    return routeFlexAnimationsRef.current[routeName];
  }

  function getPillTarget(tabName) {
    const activeIndex = visibleRoutes.findIndex((route) => route.name === tabName);
    const innerWidth = Math.max(tabBarWidth - 12, 0);

    if (activeIndex < 0 || innerWidth <= 0) {
      return null;
    }

    const inactiveFlex = 1;
    const activeFlex = 3;
    const totalFlex = visibleRoutes.length - 1 + activeFlex;
    const unitWidth = innerWidth / totalFlex;

    return {
      x: 6 + activeIndex * inactiveFlex * unitWidth,
      width: activeFlex * unitWidth,
    };
  }

  function animatePillTo(tabName, animated = true) {
    const activeLayout = getPillTarget(tabName);

    if (!activeLayout) {
      return;
    }

    if (!pillInitializedRef.current || !animated) {
      pillTranslateX.setValue(activeLayout.x);
      pillWidth.setValue(activeLayout.width);
      pillInitializedRef.current = true;
      return;
    }

    Animated.parallel([
      Animated.timing(pillTranslateX, {
        toValue: activeLayout.x,
        duration: TAB_BAR_ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(pillWidth, {
        toValue: activeLayout.width,
        duration: TAB_BAR_ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }

  useEffect(() => {
    if (!activeTabName) {
      return;
    }

    animatePillTo(activeTabName);
  }, [activeTabName, tabBarWidth, visibleRouteNames]);

  useEffect(() => {
    if (!activeTabName) {
      return;
    }

    Animated.parallel(
      visibleRoutes.map((route) =>
        Animated.timing(getRouteFlexAnimation(route.name), {
          toValue: activeTabName === route.name ? 3 : 1,
          duration: TAB_BAR_ANIMATION_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        })
      )
    ).start();
  }, [activeTabName, visibleRouteNames]);

  if (hidden) {
    return null;
  }

  return (
    <View
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setTabBarWidth((previousWidth) =>
          previousWidth === width ? previousWidth : width
        );
      }}
      style={[styles.customTabBar, { bottom: bottomOffset }]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.tabBarActivePill,
          {
            transform: [{ translateX: pillTranslateX }],
            width: pillWidth,
          },
        ]}
      />
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
            animatePillTo(route.name);
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
          <AnimatedPressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[
              styles.tabBarButton,
              { flex: getRouteFlexAnimation(route.name) },
            ]}
          >
            {typeof options.tabBarIcon === "function"
              ? options.tabBarIcon({
                  focused,
                  color: focused ? "#fff" : "#000",
                  size: 24,
                })
              : null}
          </AnimatedPressable>
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
  const isTabBarHidden = shouldHideTabBar(
    pathname,
    activeTabName,
    model.forumTabBarHidden || model.planGenerationTabBarHidden
  );
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
          name="profile-subscription-details"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile-exercise-analysis"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile-exercise-analyses"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile-exercise-analysis-post"
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
          name="profile-saved-posts"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile-my-posts"
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
        <Tabs.Screen
          name="active-session"
          options={{
            href: null,
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
  tabBarActivePill: {
    position: "absolute",
    top: 6,
    bottom: 6,
    left: 0,
    backgroundColor: "#000",
    borderRadius: 120,
    zIndex: 0,
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
    zIndex: 1,
  },
  tabIcon: {
    flex: 1,
    width: "100%",
    borderRadius: 120,
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
    fontFamily: "IBMPlexSans_600SemiBold",
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
