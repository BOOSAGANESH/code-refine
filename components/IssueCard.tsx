import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";

type Severity = "critical" | "high" | "medium" | "low";

interface IssueCardProps {
  title: string;
  description: string;
  severity: Severity;
  fix?: string;
  recommendation?: string;
  type?: "bug" | "security";
}

const SEVERITY_CONFIG: Record<Severity, { color: string; bg: string; label: string }> = {
  critical: { color: Colors.dark.accentRed, bg: "rgba(255,71,87,0.12)", label: "Critical" },
  high: { color: "#FF7043", bg: "rgba(255,112,67,0.12)", label: "High" },
  medium: { color: Colors.dark.accentOrange, bg: "rgba(255,167,38,0.12)", label: "Medium" },
  low: { color: Colors.dark.accent, bg: "rgba(0,212,255,0.12)", label: "Low" },
};

export function IssueCard({ title, description, severity, fix, recommendation, type = "bug" }: IssueCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.low;
  const hasExtra = !!(fix || recommendation);

  return (
    <Pressable
      style={[styles.card, { borderLeftColor: config.color }]}
      onPress={() => hasExtra && setExpanded(!expanded)}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: config.bg }]}>
          <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
        </View>
        {type === "security" && (
          <MaterialCommunityIcons name="shield-alert" size={14} color={config.color} style={styles.typeIcon} />
        )}
        {type === "bug" && (
          <Ionicons name="bug" size={14} color={config.color} style={styles.typeIcon} />
        )}
        {hasExtra && (
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={Colors.dark.textMuted}
            style={styles.chevron}
          />
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {expanded && (fix || recommendation) && (
        <View style={styles.fixContainer}>
          <View style={styles.fixDivider} />
          <View style={styles.fixHeader}>
            <Ionicons name="bulb-outline" size={13} color={Colors.dark.accentGreen} />
            <Text style={styles.fixLabel}>Recommendation</Text>
          </View>
          <Text style={styles.fixText}>{fix || recommendation}</Text>
        </View>
      )}
    </Pressable>
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
  typeIcon: {
    marginLeft: 8,
  },
  chevron: {
    marginLeft: "auto",
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
  fixContainer: {
    marginTop: 10,
  },
  fixDivider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginBottom: 10,
  },
  fixHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  fixLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: Colors.dark.accentGreen,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fixText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
});
