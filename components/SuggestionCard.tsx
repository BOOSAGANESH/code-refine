import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

type SuggestionType = "performance" | "readability" | "bestpractice" | "refactor";

interface SuggestionCardProps {
  type: SuggestionType;
  title: string;
  description: string;
  originalCode?: string;
  optimizedCode?: string;
}

const TYPE_CONFIG: Record<SuggestionType, { color: string; bg: string; icon: string; label: string }> = {
  performance: { color: Colors.dark.accentGreen, bg: "rgba(0,230,118,0.1)", icon: "flash-outline", label: "Performance" },
  readability: { color: Colors.dark.accent, bg: "rgba(0,212,255,0.1)", icon: "eye-outline", label: "Readability" },
  bestpractice: { color: "#B39DDB", bg: "rgba(179,157,219,0.1)", icon: "checkmark-circle-outline", label: "Best Practice" },
  refactor: { color: Colors.dark.accentOrange, bg: "rgba(255,167,38,0.1)", icon: "construct-outline", label: "Refactor" },
};

export function SuggestionCard({ type, title, description, originalCode, optimizedCode }: SuggestionCardProps) {
  const [showCode, setShowCode] = useState(false);
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.bestpractice;
  const hasCode = !!(originalCode || optimizedCode);

  return (
    <View style={[styles.card, { borderLeftColor: config.color }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: config.bg }]}>
          <Ionicons name={config.icon as any} size={11} color={config.color} />
          <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {hasCode && (
        <Pressable style={styles.codeToggle} onPress={() => setShowCode(!showCode)}>
          <MaterialCommunityIcons name="code-braces" size={14} color={Colors.dark.accent} />
          <Text style={styles.codeToggleText}>{showCode ? "Hide code" : "Show example"}</Text>
          <Ionicons
            name={showCode ? "chevron-up" : "chevron-down"}
            size={14}
            color={Colors.dark.accent}
          />
        </Pressable>
      )}

      {showCode && (
        <View style={styles.codeBlock}>
          {originalCode && (
            <View style={styles.codeSection}>
              <View style={styles.codeLabelRow}>
                <View style={[styles.dot, { backgroundColor: Colors.dark.accentRed }]} />
                <Text style={[styles.codeLabel, { color: Colors.dark.accentRed }]}>Before</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={styles.code}>{originalCode}</Text>
              </ScrollView>
            </View>
          )}
          {optimizedCode && (
            <View style={[styles.codeSection, originalCode && { marginTop: 10 }]}>
              <View style={styles.codeLabelRow}>
                <View style={[styles.dot, { backgroundColor: Colors.dark.accentGreen }]} />
                <Text style={[styles.codeLabel, { color: Colors.dark.accentGreen }]}>After</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={styles.code}>{optimizedCode}</Text>
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
  codeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 4,
  },
  codeToggleText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.dark.accent,
  },
  codeBlock: {
    marginTop: 8,
    backgroundColor: Colors.dark.background,
    borderRadius: 8,
    padding: 12,
  },
  codeSection: {},
  codeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  codeLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  code: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.dark.text,
    lineHeight: 18,
  },
});
