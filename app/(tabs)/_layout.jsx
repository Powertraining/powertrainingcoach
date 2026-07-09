import {
  Tabs,
  Redirect } from "expo-router";
import { observer } from "mobx-react-lite";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  View,
  StyleSheet,
  Pressable,
} from "react-native";
import { GlassView } from "expo-glass-effect";
import { requireOptionalNativeModule } from "expo-modules-core";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useLocalSearchParams, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { reactiveModel } from "../../src/services/models/mobxReactiveModel.js";
import IBMPlexText from "../../src/components/textComponents/IBMPlexText.jsx";

const ANDROID_NATIVE_BLUR_AVAILABLE =
  Platform.OS === "android" &&
  Boolean(requireOptionalNativeModule("ExpoBlur"));
const androidBlurComponents = ANDROID_NATIVE_BLUR_AVAILABLE
  ? require("expo-blur")
  : {};
const AndroidBlurTargetView = androidBlurComponents.BlurTargetView;
const AndroidBlurView = androidBlurComponents.BlurView;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const TAB_BAR_ANIMATION_DURATION = 220;
const TAB_BAR_INACTIVE_FLEX = 1;
const TAB_BAR_ACTIVE_FLEX = 1.45;
const TAB_SCREEN_TRANSITION = {
  animation: "timing",
  config: {
    duration: TAB_BAR_ANIMATION_DURATION,
    easing: Easing.out(Easing.cubic),
  },
};

function HomeNavIcon({ size, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 10.8 12 4l8 6.8v7.7a1.5 1.5 0 0 1-1.5 1.5h-4.2v-5.6H9.7V20H5.5A1.5 1.5 0 0 1 4 18.5v-7.7Z"
        fill={color}
      />
    </Svg>
  );
}

function TabIcon({
  icon: Icon,
  iconName,
  size,
  iconSize,
  focused,
  label,
  showLabel = focused,
}) {
  const iconColor = focused ? "#FFFFFF" : "#E0E0E6";
  const visualSize = iconSize ?? size;

  return (
    <View style={styles.tabIcon}>
      <View
        style={[
          styles.tabIconContent,
          focused ? styles.tabIconContentActive : styles.tabIconContentInactive,
        ]}
      >
        <View style={styles.tabIconGlyph}>
          {Icon ? (
            <Icon color={iconColor} size={visualSize} />
          ) : (
            <Ionicons color={iconColor} name={iconName} size={visualSize} />
          )}
        </View>
        {showLabel ? (
          <IBMPlexText
            numberOfLines={1}
            style={[
              styles.tabIconLabel,
              focused ? styles.tabIconLabelActive : styles.tabIconLabelInactive,
            ]}
          >
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
  "/overview",
  "/(tabs)/overview",
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

function CustomTabBar({
  state,
  descriptors,
  navigation,
  activeTabName,
  blurTargets,
  hidden,
  bottomOffset,
}) {
  const navigationActiveRouteName = state.routes[state.index]?.name;
  const currentActiveTabName = VISIBLE_TAB_ROUTES.has(navigationActiveRouteName)
    ? navigationActiveRouteName
    : activeTabName;
  const pillTranslateX = useRef(new Animated.Value(0)).current;
  const pillSmearProgress = useRef(new Animated.Value(0)).current;
  const hiddenProgress = useRef(new Animated.Value(hidden ? 1 : 0)).current;
  const emptyBlurTarget = useRef(null);
  const pillInitializedRef = useRef(false);
  const routeIconAnimationsRef = useRef({});
  const routePressAnimationsRef = useRef({});
  const transitionIdRef = useRef(0);
  const transitionAnimationRef = useRef(null);
  const transitionFrameRef = useRef(null);
  const transitionTargetRef = useRef(null);
  const [tabBarWidth, setTabBarWidth] = useState(0);
  const [visualActiveTabName, setVisualActiveTabName] = useState(currentActiveTabName);
  const [labelVisibleTabName, setLabelVisibleTabName] = useState(currentActiveTabName);

  const visibleRoutes = state.routes.filter((route) => VISIBLE_TAB_ROUTES.has(route.name));
  const visibleRouteNames = visibleRoutes.map((route) => route.name).join("|");
  const resolvedActiveTabName = visualActiveTabName || currentActiveTabName;
  const activeBlurTarget =
    blurTargets.current[resolvedActiveTabName] || emptyBlurTarget;
  const activePillLayout = getPillTarget(resolvedActiveTabName);
  const collapsedSlotWidth = activePillLayout?.unitWidth || 0;

  function getRouteIconAnimation(routeName) {
    if (!routeIconAnimationsRef.current[routeName]) {
      routeIconAnimationsRef.current[routeName] = new Animated.Value(0);
    }

    return routeIconAnimationsRef.current[routeName];
  }

  function getRoutePressAnimation(routeName) {
    if (!routePressAnimationsRef.current[routeName]) {
      routePressAnimationsRef.current[routeName] = new Animated.Value(0);
    }

    return routePressAnimationsRef.current[routeName];
  }

  function stopRunningTabBarAnimation() {
    if (!transitionAnimationRef.current) {
      return;
    }

    const animation = transitionAnimationRef.current;
    transitionAnimationRef.current = null;
    animation.stop();
  }

  function applyTabBarPosition(tabName) {
    const activeLayout = getPillTarget(tabName);

    if (!activeLayout) {
      return false;
    }

    pillTranslateX.setValue(activeLayout.x);
    pillSmearProgress.setValue(0);
    visibleRoutes.forEach((route) => {
      getRouteIconAnimation(route.name).setValue(
        getRouteIconX(route.name, tabName)
      );
    });
    pillInitializedRef.current = true;
    return true;
  }

  function getPillTarget(tabName) {
    const activeIndex = visibleRoutes.findIndex((route) => route.name === tabName);
    const innerWidth = Math.max(tabBarWidth - 12, 0);

    if (activeIndex < 0 || innerWidth <= 0) {
      return null;
    }

    const totalFlex = visibleRoutes.length - 1 + TAB_BAR_ACTIVE_FLEX;
    const unitWidth = innerWidth / totalFlex;

    return {
      x: 6 + activeIndex * TAB_BAR_INACTIVE_FLEX * unitWidth,
      width: TAB_BAR_ACTIVE_FLEX * unitWidth,
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
      return 6 + (
        routeIndex +
        TAB_BAR_ACTIVE_FLEX -
        TAB_BAR_INACTIVE_FLEX
      ) * activeLayout.unitWidth;
    }

    return activeLayout.x + (activeLayout.width - activeLayout.unitWidth) / 2;
  }

  function getRouteHitTarget(routeName, tabName) {
    const activeLayout = getPillTarget(tabName);
    const routeIndex = visibleRoutes.findIndex((route) => route.name === routeName);

    if (!activeLayout || routeIndex < 0) {
      return null;
    }

    if (routeIndex === activeLayout.activeIndex) {
      return {
        x: activeLayout.x,
        width: activeLayout.width,
      };
    }

    return {
      x: getRouteIconX(routeName, tabName),
      width: activeLayout.unitWidth,
    };
  }

  function setTabBarPosition(tabName) {
    stopRunningTabBarAnimation();
    return applyTabBarPosition(tabName);
  }

  function animateTabBarPosition(tabName, onComplete) {
    const activeLayout = getPillTarget(tabName);

    if (!activeLayout) {
      onComplete?.({ finished: false });
      return;
    }

    stopRunningTabBarAnimation();

    if (!pillInitializedRef.current) {
      setTabBarPosition(tabName);
      pillInitializedRef.current = true;
      onComplete?.({ finished: true });
      return;
    }

    pillSmearProgress.setValue(0);

    const animation = Animated.parallel([
      Animated.timing(pillTranslateX, {
        toValue: activeLayout.x,
        duration: TAB_BAR_ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(pillSmearProgress, {
          duration: 90,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(pillSmearProgress, {
          duration: 130,
          easing: Easing.inOut(Easing.cubic),
          toValue: 0,
          useNativeDriver: true,
        }),
      ]),
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
    ], { stopTogether: false });

    transitionAnimationRef.current = animation;
    animation.start(({ finished }) => {
      if (transitionAnimationRef.current !== animation) {
        return;
      }

      transitionAnimationRef.current = null;

      if (finished !== false) {
        applyTabBarPosition(tabName);
      }

      onComplete?.({ finished });
    });
  }

  function runTabTransition(tabName, onMovedToTab) {
    if (!tabName) {
      return;
    }

    if (transitionFrameRef.current != null) {
      cancelAnimationFrame(transitionFrameRef.current);
      transitionFrameRef.current = null;
    }

    transitionIdRef.current += 1;
    const transitionId = transitionIdRef.current;
    transitionTargetRef.current = tabName;

    setVisualActiveTabName(tabName);
    setLabelVisibleTabName(tabName);

    transitionFrameRef.current = requestAnimationFrame(() => {
      transitionFrameRef.current = null;

      if (transitionIdRef.current !== transitionId) {
        return;
      }

      animateTabBarPosition(tabName, ({ finished }) => {
        if (finished === false || transitionIdRef.current !== transitionId) {
          return;
        }

        if (transitionTargetRef.current === tabName) {
          transitionTargetRef.current = null;
        }
      });

      onMovedToTab?.();
    });
  }

  useEffect(() => {
    hiddenProgress.stopAnimation();

    const animation = Animated.timing(hiddenProgress, {
      toValue: hidden ? 1 : 0,
      duration: TAB_BAR_ANIMATION_DURATION,
      easing: hidden ? Easing.in(Easing.cubic) : Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      if (finished) {
        hiddenProgress.setValue(hidden ? 1 : 0);
      }
    });

    return () => animation.stop();
  }, [hidden, hiddenProgress]);

  useEffect(() => {
    if (!currentActiveTabName) {
      transitionTargetRef.current = null;
      stopRunningTabBarAnimation();
      setVisualActiveTabName(null);
      setLabelVisibleTabName(null);
      return;
    }

    if (!pillInitializedRef.current || currentActiveTabName === visualActiveTabName) {
      setVisualActiveTabName(currentActiveTabName);
      setLabelVisibleTabName(currentActiveTabName);
      if (transitionTargetRef.current === currentActiveTabName) {
        runTabTransition(currentActiveTabName);
        return;
      }

      setTabBarPosition(currentActiveTabName);
      return;
    }

    runTabTransition(currentActiveTabName);
  }, [currentActiveTabName, tabBarWidth, visibleRouteNames]);

  useEffect(() => {
    if (currentActiveTabName || !visualActiveTabName) {
      return;
    }

    setVisualActiveTabName(null);
  }, [currentActiveTabName, visualActiveTabName]);

  useEffect(() => () => {
    if (transitionFrameRef.current != null) {
      cancelAnimationFrame(transitionFrameRef.current);
      transitionFrameRef.current = null;
    }

    stopRunningTabBarAnimation();
  }, []);

  return (
    <Animated.View
      onLayout={(event) => {
        const { width } = event.nativeEvent.layout;
        setTabBarWidth((previousWidth) =>
          previousWidth === width ? previousWidth : width
        );
      }}
      pointerEvents={hidden ? "none" : "auto"}
      style={[
        styles.customTabBar,
        Platform.OS === "web"
          ? {
              backdropFilter: "blur(14px) saturate(135%)",
              WebkitBackdropFilter: "blur(14px) saturate(135%)",
            }
          : null,
        {
          bottom: bottomOffset,
          transform: [
            {
              translateY: hiddenProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, bottomOffset + 96],
              }),
            },
          ],
        },
      ]}
    >
      {Platform.OS === "ios" ? (
        <GlassView
          colorScheme="dark"
          glassEffectStyle="regular"
          pointerEvents="none"
          style={styles.tabBarMaterial}
          tintColor="rgba(18, 18, 22, 0.64)"
        />
      ) : ANDROID_NATIVE_BLUR_AVAILABLE ? (
        <AndroidBlurView
          blurTarget={activeBlurTarget}
          blurMethod="dimezisBlurView"
          blurReductionFactor={2}
          intensity={48}
          pointerEvents="none"
          style={styles.tabBarMaterial}
          tint="systemChromeMaterialDark"
        />
      ) : null}
      <View pointerEvents="none" style={styles.tabBarFallbackMaterial} />
      {activePillLayout ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tabBarActivePill,
            {
              transform: [
                { translateX: pillTranslateX },
                {
                  scaleX: pillSmearProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.08],
                  }),
                },
                {
                  scaleY: pillSmearProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.97],
                  }),
                },
                {
                  scale: getRoutePressAnimation(resolvedActiveTabName).interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.95],
                  }),
                },
              ],
              width: activePillLayout.width,
            },
          ]}
        >
          {Platform.OS === "ios" ? (
            <GlassView
              colorScheme="dark"
              glassEffectStyle="clear"
              pointerEvents="none"
              style={styles.tabBarActivePillMaterial}
              tintColor="rgba(255, 255, 255, 0.12)"
            />
          ) : ANDROID_NATIVE_BLUR_AVAILABLE ? (
            <AndroidBlurView
              blurTarget={activeBlurTarget}
              blurMethod="dimezisBlurView"
              blurReductionFactor={2}
              intensity={64}
              pointerEvents="none"
              style={styles.tabBarActivePillMaterial}
              tint="systemThinMaterialDark"
            />
          ) : null}
          <View
            pointerEvents="none"
            style={styles.tabBarActivePillFallback}
          />
          {visibleRoutes.map((route) => {
            if (route.name !== resolvedActiveTabName) {
              return null;
            }

            const options = descriptors[route.key]?.options ?? {};

            return typeof options.tabBarIcon === "function" ? (
              <Fragment key={`${route.key}:active-icon`}>
                {options.tabBarIcon({
                  focused: true,
                  showLabel: labelVisibleTabName === route.name,
                  color: "#fff",
                  size: 24,
                })}
              </Fragment>
            ) : null;
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
                      {
                        scale: getRoutePressAnimation(route.name).interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 0.88],
                        }),
                      },
                    ],
                    width: collapsedSlotWidth,
                  },
                ]}
              >
                {typeof options.tabBarIcon === "function"
                  ? options.tabBarIcon({
                      focused: false,
                      showLabel: true,
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
        const routeFocused = currentActiveTabName === route.name;
        const focused = resolvedActiveTabName === route.name;
        const hitTarget = getRouteHitTarget(route.name, resolvedActiveTabName);

        function onPress() {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!routeFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          } else if (event.defaultPrevented) {
            runTabTransition(currentActiveTabName);
          }
        }

        function onLongPress() {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        }

        function onPressIn() {
          Animated.spring(getRoutePressAnimation(route.name), {
            damping: 18,
            mass: 0.55,
            stiffness: 340,
            toValue: 1,
            useNativeDriver: true,
          }).start();
        }

        function onPressOut() {
          Animated.spring(getRoutePressAnimation(route.name), {
            damping: 15,
            mass: 0.5,
            stiffness: 260,
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }

        return (
          <AnimatedPressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onLongPress={onLongPress}
            style={[
              styles.tabBarButton,
              hitTarget
                ? {
                    transform: [{ translateX: hitTarget.x }],
                    width: hitTarget.width,
                  }
                : null,
            ]}
          />
        );
      })}
    </Animated.View>
  );
}

const TabsLayout = observer(function TabsLayout() {
  const model = reactiveModel;
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const blurTargets = useRef({});
  const activeTabName = getActiveTabName(pathname);
  const isTabBarHidden = shouldHideTabBar(
    pathname,
    activeTabName,
    model.forumTabBarHidden ||
      model.forumOverlayVisible ||
      model.planGenerationTabBarHidden
  );
  const tabBarBottomOffset = getTabBarBottomOffset(insets.bottom);

  function getBlurTarget(routeName) {
    if (!blurTargets.current[routeName]) {
      blurTargets.current[routeName] = { current: null };
    }

    return blurTargets.current[routeName];
  }

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
            blurTargets={blurTargets}
            hidden={isTabBarHidden}
            bottomOffset={tabBarBottomOffset}
          />
        )}
        screenOptions={{
          headerShown: false,
          animation: "shift",
          sceneStyle: { backgroundColor: "transparent" },
          transitionSpec: TAB_SCREEN_TRANSITION,
        }}
        screenLayout={({ children, route }) =>
          ANDROID_NATIVE_BLUR_AVAILABLE ? (
            <AndroidBlurTargetView
              ref={getBlurTarget(route.name)}
              style={styles.container}
            >
              {children}
            </AndroidBlurTargetView>
          ) : (
            children
          )
        }
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ size, focused, showLabel }) => (
              <TabIcon
                icon={HomeNavIcon}
                size={size}
                iconSize={28}
                focused={focused}
                label="Home"
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
                iconName="people"
                size={size}
                iconSize={24}
                focused={focused}
                label="Forum"
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
                iconName="calendar"
                size={size}
                iconSize={25}
                focused={focused}
                label="Plan"
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
                iconName="person"
                size={size}
                iconSize={28}
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
    left: 24,
    right: 24,
    backgroundColor: "rgba(10, 10, 12, 0.14)",
    borderColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
    height: 72,
    borderRadius: 30,
    overflow: "hidden",
    padding: 6,
    flexDirection: "row",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.34,
    shadowRadius: 24,
    elevation: 18,
    zIndex: 10,
    marginBottom: 5,
  },
  tabBarMaterial: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    overflow: "hidden",
  },
  tabBarFallbackMaterial: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(12, 12, 15, 0.14)",
    borderRadius: 30,
  },
  tabBarActivePill: {
    position: "absolute",
    top: 6,
    bottom: 6,
    left: 0,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.28)",
    borderRadius: 25,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    zIndex: 0,
  },
  tabBarActivePillMaterial: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 25,
    overflow: "hidden",
  },
  tabBarActivePillFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 25,
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
    height: 72,
    position: "absolute",
    left: 24,
    right: 24,
    borderRadius: 26,
    zIndex: 20,
  },
  tabBarButton: {
    bottom: 6,
    borderRadius: 22,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    top: 6,
    zIndex: 2,
  },
  tabIcon: {
    flex: 1,
    width: "100%",
    borderRadius: 22,
  },
  tabIconContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },
  tabIconGlyph: {
    alignItems: "center",
    height: 30,
    justifyContent: "center",
    width: 30,
  },
  tabIconContentInactive: {
    gap: 4,
    justifyContent: "center",
  },
  tabIconContentActive: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
  },
  tabIconLabel: {
    fontFamily: "IBMPlexSans_600SemiBold",
    fontSize: 14,
    flexShrink: 1,
    lineHeight: 18,
  },
  tabIconLabelActive: {
    color: "#FFFFFF",
  },
  tabIconLabelInactive: {
    color: "#E0E0E6",
  },
});
