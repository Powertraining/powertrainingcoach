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
  Pressable,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { useLocalSearchParams, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import IBMPlexText from "../../src/components/textComponents/IBMPlexText.jsx";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const TAB_BAR_ANIMATION_DURATION = 220;

function HomeNavIcon({ size, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 182 177" fill="none">
      <Path d="M97 0H104C147.078 0 182 34.9218 182 78V157C182 168.046 173.046 177 162 177H117C105.954 177 97 168.046 97 157V0Z" fill={color} />
      <Path d="M85 0H78C34.9218 0 0 34.9218 0 78V157C0 168.046 8.95431 177 20 177H65C76.0457 177 85 168.046 85 157V0Z" fill={color} />
    </Svg>
  );
}

function PlanNavIcon({ size, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 562 562" fill="none">
      <Rect x="432.829" y="59.2859" width="98.2751" height="98.2747" rx="49.1374" transform="rotate(44.8952 432.829 59.2859)" fill={color} />
      <Path d="M254.457 130.3C252.104 127.946 252.104 124.131 254.457 121.778C277.989 98.2464 316.141 98.2463 339.673 121.778L478.174 260.279C480.527 262.632 480.527 266.447 478.174 268.8C454.642 292.332 416.489 292.332 392.958 268.8L254.457 130.3Z" fill={color} />
      <Path d="M228.267 225.633C226.256 227.644 222.996 227.644 220.985 225.633C200.876 205.524 200.876 172.921 220.985 152.812L235.101 138.696C237.891 135.905 242.415 135.905 245.206 138.696L266.77 160.26C274.19 167.68 274.19 179.71 266.77 187.13L228.267 225.633Z" fill={color} />
      <Path d="M504.268 164.623C506.279 162.612 509.539 162.612 511.55 164.623C531.659 184.732 531.659 217.336 511.55 237.445L497.434 251.56C494.644 254.351 490.12 254.351 487.329 251.56L465.765 229.996C458.345 222.576 458.345 210.546 465.765 203.126L504.268 164.623Z" fill={color} />
      <Path d="M326.89 248.663C334.701 240.853 347.364 240.853 355.174 248.663L377.265 270.754C383.139 276.628 383.139 286.152 377.265 292.026L313.51 355.781C289.978 379.313 251.826 379.313 228.294 355.781C225.941 353.428 225.941 349.613 228.294 347.259L326.89 248.663Z" fill={color} />
      <Path d="M272.894 194.668C280.704 186.857 293.368 186.857 301.178 194.668L319.763 213.252C327.573 221.063 327.573 233.726 319.763 241.536L136.359 424.94C112.828 448.471 74.6754 448.471 51.1437 424.94C48.7905 422.586 48.7905 418.771 51.1437 416.418L272.894 194.668Z" fill={color} />
    </Svg>
  );
}

function ForumNavIcon({ size, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 252 182" fill="none">
      <Path d="M234.653 182C244.234 182 252 174.234 252 164.653C252 127.289 221.711 97 184.347 97H117.5C94.0279 97 75 116.028 75 139.5C75 162.972 94.0279 182 117.5 182H234.653Z" fill={color} />
      <Path d="M134.5 85C157.972 85 177 65.9721 177 42.5C177 19.0279 157.972 0 134.5 0H67.6531C30.2893 0 0 30.2893 0 67.6531C0 77.2335 7.76649 85 17.3469 85H134.5Z" fill={color} />
    </Svg>
  );
}

function ProfileNavIcon({ size, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 263 176" fill="none">
      <Rect x="82" width="98.2751" height="98.2747" rx="49.1374" fill={color} />
      <Path d="M6.02565 175.591C2.69777 175.591 0 172.894 0 169.566C0 136.287 26.9778 109.309 60.2566 109.309L256.126 109.309C259.454 109.309 262.152 112.007 262.152 115.335C262.152 148.613 235.174 175.591 201.895 175.591L6.02565 175.591Z" fill={color} />
    </Svg>
  );
}

function TabIcon({ icon: Icon, size, iconSize, focused, label, showLabel = focused }) {
  const iconColor = focused ? "#fff" : "#000";
  const visualSize = iconSize ?? size;

  return (
    <View style={styles.tabIcon}>
      <View
        style={[
          styles.tabIconContent,
          focused ? styles.tabIconContentActive : styles.tabIconContentInactive,
        ]}
      >
        <Icon size={visualSize} color={iconColor} />
        {showLabel ? (
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
  "/day-detail",
  "/(tabs)/day-detail",
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
  const pillInitializedRef = useRef(false);
  const routeIconAnimationsRef = useRef({});
  const transitionIdRef = useRef(0);
  const transitionTargetRef = useRef(null);
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const [visualActiveTabName, setVisualActiveTabName] = useState(activeTabName);
  const [labelVisibleTabName, setLabelVisibleTabName] = useState(activeTabName);

  const visibleRoutes = state.routes.filter((route) => VISIBLE_TAB_ROUTES.has(route.name));
  const visibleRouteNames = visibleRoutes.map((route) => route.name).join("|");
  const resolvedActiveTabName = visualActiveTabName || activeTabName;
  const activePillLayout = getPillTarget(resolvedActiveTabName);
  const collapsedSlotWidth = activePillLayout?.unitWidth || 0;

  function getRouteIconAnimation(routeName) {
    if (!routeIconAnimationsRef.current[routeName]) {
      routeIconAnimationsRef.current[routeName] = new Animated.Value(0);
    }

    return routeIconAnimationsRef.current[routeName];
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
      unitWidth,
      activeIndex,
    };
  }

  function getRouteIconX(routeName, tabName) {
    const activeLayout = getPillTarget(tabName);
    const routeIndex = visibleRoutes.findIndex((route) => route.name === routeName);

    if (!activeLayout || routeIndex < 0) {
      return 0;
    }

    if (routeIndex < activeLayout.activeIndex) {
      return 6 + routeIndex * activeLayout.unitWidth;
    }

    if (routeIndex > activeLayout.activeIndex) {
      return 6 + (routeIndex + 2) * activeLayout.unitWidth;
    }

    return activeLayout.x + activeLayout.unitWidth;
  }

  function setTabBarPosition(tabName) {
    const activeLayout = getPillTarget(tabName);

    if (!activeLayout) {
      return false;
    }

    pillTranslateX.stopAnimation();
    pillTranslateX.setValue(activeLayout.x);
    visibleRoutes.forEach((route) => {
      const routeIconAnimation = getRouteIconAnimation(route.name);
      routeIconAnimation.stopAnimation();
      routeIconAnimation.setValue(getRouteIconX(route.name, tabName));
    });
    pillInitializedRef.current = true;
    return true;
  }

  function animateTabBarPosition(tabName, onComplete) {
    const activeLayout = getPillTarget(tabName);

    if (!activeLayout) {
      onComplete?.();
      return;
    }

    pillTranslateX.stopAnimation();

    if (!pillInitializedRef.current) {
      setTabBarPosition(tabName);
      pillInitializedRef.current = true;
      onComplete?.();
      return;
    }

    Animated.parallel([
      Animated.timing(pillTranslateX, {
        toValue: activeLayout.x,
        duration: TAB_BAR_ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      ...visibleRoutes.map((route) => {
        const routeIconAnimation = getRouteIconAnimation(route.name);
        routeIconAnimation.stopAnimation();

        return Animated.timing(routeIconAnimation, {
          toValue: getRouteIconX(route.name, tabName),
          duration: TAB_BAR_ANIMATION_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        });
      }),
    ]).start(onComplete);
  }

  function runTabTransition(tabName, onMovedToTab) {
    if (!tabName) {
      return;
    }

    transitionIdRef.current += 1;
    const transitionId = transitionIdRef.current;
    transitionTargetRef.current = tabName;

    setVisualActiveTabName(tabName);
    setLabelVisibleTabName(tabName);

    requestAnimationFrame(() => {
      if (transitionIdRef.current !== transitionId) {
        return;
      }

      animateTabBarPosition(tabName, ({ finished }) => {
        if (transitionTargetRef.current === tabName) {
          transitionTargetRef.current = null;
        }

        if (finished === false || transitionIdRef.current !== transitionId) {
          return;
        }
      });

      onMovedToTab?.();
    });
  }

  useEffect(() => {
    if (!activeTabName) {
      setVisualActiveTabName(null);
      setLabelVisibleTabName(null);
      return;
    }

    if (!pillInitializedRef.current || activeTabName === visualActiveTabName) {
      setVisualActiveTabName(activeTabName);
      setLabelVisibleTabName(activeTabName);
      if (transitionTargetRef.current === activeTabName) {
        return;
      }

      setTabBarPosition(activeTabName);
      return;
    }

    runTabTransition(activeTabName);
  }, [activeTabName, tabBarWidth, visibleRouteNames]);

  useEffect(() => {
    if (activeTabName || !visualActiveTabName) {
      return;
    }

    setVisualActiveTabName(null);
  }, [activeTabName, visualActiveTabName]);

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
      {activePillLayout ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tabBarActivePill,
            {
              transform: [{ translateX: pillTranslateX }],
              width: activePillLayout.width,
            },
          ]}
        >
          {visibleRoutes.map((route) => {
            if (route.name !== resolvedActiveTabName) {
              return null;
            }

            const options = descriptors[route.key]?.options ?? {};

            return typeof options.tabBarIcon === "function"
              ? options.tabBarIcon({
                  focused: true,
                  showLabel: labelVisibleTabName === route.name,
                  color: "#fff",
                  size: 24,
                })
              : null;
          })}
        </Animated.View>
      ) : null}
      {collapsedSlotWidth > 0
        ? visibleRoutes.map((route) => {
            const options = descriptors[route.key]?.options ?? {};
            const isVisuallyActive = resolvedActiveTabName === route.name;

            return (
              <Animated.View
                key={`${route.key}:icon`}
                pointerEvents="none"
                style={[
                  styles.tabBarInactiveIconSlot,
                  {
                    opacity: isVisuallyActive ? 0 : 1,
                    transform: [
                      { translateX: getRouteIconAnimation(route.name) },
                    ],
                    width: collapsedSlotWidth,
                  },
                ]}
              >
                {typeof options.tabBarIcon === "function"
                  ? options.tabBarIcon({
                      focused: false,
                      showLabel: false,
                      color: "#000",
                      size: 24,
                    })
                  : null}
              </Animated.View>
            );
          })
        : null}
      {visibleRoutes.map((route) => {
        const options = descriptors[route.key]?.options ?? {};
        const routeFocused = activeTabName === route.name;
        const focused = resolvedActiveTabName === route.name;

        function onPress() {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!routeFocused && !event.defaultPrevented) {
            runTabTransition(route.name, () => {
              navigation.navigate(route.name, route.params);
            });
          } else if (event.defaultPrevented) {
            runTabTransition(activeTabName);
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
            style={styles.tabBarButton}
          />
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
            tabBarIcon: ({ size, focused, showLabel }) => (
              <TabIcon
                icon={HomeNavIcon}
                size={size}
                iconSize={24}
                focused={focused}
                label="Home"
                showLabel={showLabel}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="overview"
          options={{
            title: "Plan",
            tabBarIcon: ({ size, focused, showLabel }) => (
              <TabIcon
                icon={PlanNavIcon}
                size={size}
                iconSize={38}
                focused={focused}
                label="Plan"
                showLabel={showLabel}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="forum"
          options={{
            title: "Forum",
            tabBarIcon: ({ size, focused, showLabel }) => (
              <TabIcon
                icon={ForumNavIcon}
                size={size}
                iconSize={33}
                focused={focused}
                label="Forum"
                showLabel={showLabel}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ size, focused, showLabel }) => (
              <TabIcon
                icon={ProfileNavIcon}
                size={size}
                iconSize={36}
                focused={focused}
                label="Profile"
                showLabel={showLabel}
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
  tabBarInactiveIconSlot: {
    alignItems: "center",
    bottom: 6,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    top: 6,
    zIndex: 1,
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
    flex: 1,
    height: "100%",
    borderRadius: 120,
    overflow: "hidden",
    zIndex: 2,
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
  tabIconLabel: {
    color: "#fff",
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 24,
    letterSpacing: 0.8,
    flexShrink: 1,
  },
});
