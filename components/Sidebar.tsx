import React, { useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { router, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ColorPalette } from "@/constants/colors";
import { useSidebar } from "@/contexts/SidebarContext";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = Math.min(300, SCREEN_WIDTH * 0.82);

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", route: "/(main)/", icon: "grid-outline" },
  { label: "Code Analyzer", route: "/(main)/analyzer", icon: "code-slash-outline" },
  { label: "Review History", route: "/(main)/history", icon: "time-outline" },
  { label: "DSA Practice", route: "/(main)/practice", icon: "barbell-outline" },
  { label: "Quiz", route: "/(main)/quiz", icon: "help-circle-outline" },
  { label: "Interview Sim", route: "/(main)/interview", icon: "mic-outline" },
  { label: "Career Advisor", route: "/(main)/career", icon: "briefcase-outline" },
  { label: "Roadmap", route: "/(main)/roadmap", icon: "map-outline" },
  { label: "Profile", route: "/(main)/profile", icon: "person-outline" },
];

const getStyles = (c: ColorPalette) => StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 100,
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: c.surface,
    zIndex: 101,
    borderRightWidth: 1,
    borderRightColor: c.border,
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: c.isDark ? c.background : "#FFFFFF",
  },
  userInfo: { flex: 1 },
  userName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: c.text,
  },
  userStats: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: c.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: c.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: c.border,
    marginHorizontal: 18,
    marginVertical: 6,
  },
  navList: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 6,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 2,
    gap: 12,
  },
  navRowActive: {
    backgroundColor: c.accent,
  },
  navIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: c.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  navIconActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  navLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: c.textSecondary,
    flex: 1,
  },
  navLabelActive: {
    color: c.isDark ? c.background : "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: c.isDark ? c.background : "#FFFFFF",
    opacity: 0.6,
  },
  sidebarFooter: { paddingHorizontal: 10 },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 10,
  },
  footerLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: c.textMuted,
  },
});

function NavRow({ item, active, onPress, colors }: { item: NavItem; active: boolean; onPress: () => void; colors: ColorPalette }) {
  const styles = useMemo(() => getStyles(colors), [colors]);
  return (
    <Pressable style={[styles.navRow, active && styles.navRowActive]} onPress={onPress}>
      <View style={[styles.navIcon, active && styles.navIconActive]}>
        <Ionicons
          name={item.icon as any}
          size={18}
          color={active ? (colors.isDark ? colors.background : "#FFFFFF") : colors.textSecondary}
        />
      </View>
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
      {active && <View style={styles.activeDot} />}
    </Pressable>
  );
}

export function Sidebar() {
  const { isOpen, close } = useSidebar();
  const { profile } = useUser();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      translateX.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(1, { duration: 280 });
    } else {
      translateX.value = withTiming(-SIDEBAR_WIDTH, { duration: 220, easing: Easing.in(Easing.cubic) });
      backdropOpacity.value = withTiming(0, { duration: 220 });
    }
  }, [isOpen]);

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
    pointerEvents: backdropOpacity.value > 0 ? "auto" : "none",
  }));

  const navigate = (route: string) => {
    Haptics.selectionAsync();
    close();
    setTimeout(() => router.push(route as any), 50);
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const initials = profile.name
    ? profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "?";
  const avgQuiz = profile.quizScores.length > 0
    ? Math.round(profile.quizScores.reduce((a, b) => a + b, 0) / profile.quizScores.length)
    : 0;

  return (
    <>
      <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="none">
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
      </Animated.View>
      <Animated.View style={[styles.sidebar, sidebarStyle, { paddingTop: topPad, paddingBottom: bottomPad + 12 }]}>
        <View style={styles.sidebarHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {profile.isLoggedIn ? profile.name : "Guest User"}
            </Text>
            <Text style={styles.userStats}>
              {profile.problemsSolved.length} solved • {avgQuiz}% quiz avg
            </Text>
          </View>
          <Pressable onPress={close} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.divider} />

        <View style={styles.navList}>
          {NAV_ITEMS.map((item) => (
            <NavRow
              key={item.route}
              item={item}
              colors={colors}
              active={
                pathname === item.route ||
                (item.route === "/(main)/" && pathname === "/") ||
                (item.route !== "/(main)/" && pathname !== "/" && item.route.includes(pathname))
              }
              onPress={() => navigate(item.route)}
            />
          ))}
        </View>

        <View style={styles.sidebarFooter}>
          <View style={styles.divider} />
          <Pressable style={styles.footerRow} onPress={() => navigate("/(main)/profile")}>
            <Ionicons name="settings-outline" size={18} color={colors.textMuted} />
            <Text style={styles.footerLabel}>Settings</Text>
          </Pressable>
        </View>
      </Animated.View>
    </>
  );
}
