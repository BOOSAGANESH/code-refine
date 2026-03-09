import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import type { ColorPalette } from "@/constants/colors";
import { useSidebar } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

const getStyles = (c: ColorPalette) => StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: c.background,
  },
  hamburger: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: c.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  titleBlock: { flex: 1 },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: c.text,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: c.textSecondary,
    marginTop: 1,
  },
});

export function ScreenHeader({ title, subtitle, rightElement }: ScreenHeaderProps) {
  const { toggle } = useSidebar();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  return (
    <View style={[styles.header, { paddingTop: topPad + 12 }]}>
      <Pressable
        style={styles.hamburger}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          toggle();
        }}
      >
        <Ionicons name="menu" size={22} color={colors.text} />
      </Pressable>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightElement ?? <View style={{ width: 40 }} />}
    </View>
  );
}
