import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { ColorPalette } from "@/constants/colors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useReviewHistory, ReviewRecord } from "@/contexts/ReviewHistoryContext";
import { useTheme } from "@/contexts/ThemeContext";

const LANG_ICONS: Record<string, string> = {
  python: "language-python",
  javascript: "language-javascript",
  typescript: "language-typescript",
  java: "language-java",
  cpp: "language-cpp",
  go: "language-go",
  rust: "language-rust",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const getStyles = (c: ColorPalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  list: { paddingHorizontal: 16 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.surface, borderRadius: 14, padding: 14 },
  langBadge: { width: 40, height: 40, borderRadius: 10, backgroundColor: `${c.accent}18`, alignItems: "center", justifyContent: "center" },
  itemInfo: { flex: 1 },
  itemLang: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: c.text },
  itemMeta: { fontFamily: "Inter_400Regular", fontSize: 12, color: c.textSecondary, marginTop: 2 },
  clearBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: `${c.accentRed}15`, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: c.text },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: c.textSecondary, textAlign: "center", paddingHorizontal: 40 },
});

function HistoryItem({ item, onPress, onDelete, colors }: { item: ReviewRecord; onPress: () => void; onDelete: () => void; colors: ColorPalette }) {
  const styles = useMemo(() => getStyles(colors), [colors]);
  const avg = Math.round((item.result.scores.quality + item.result.scores.performance + item.result.scores.security) / 3);
  const scoreColor = avg >= 75 ? colors.scoreGood : avg >= 50 ? colors.scoreOk : colors.scoreBad;
  const issueCount = (item.result.bugs?.length || 0) + (item.result.securityIssues?.length || 0);
  return (
    <Pressable
      style={styles.item}
      onPress={onPress}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert("Delete", "Remove this review?", [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: onDelete },
        ]);
      }}
    >
      <View style={styles.langBadge}>
        <MaterialCommunityIcons name={(LANG_ICONS[item.language] || "code-braces") as any} size={18} color={colors.accent} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemLang}>{item.language.charAt(0).toUpperCase() + item.language.slice(1)}</Text>
        <Text style={styles.itemMeta}>{issueCount} issue{issueCount !== 1 ? "s" : ""} • {formatDate(item.createdAt)}</Text>
      </View>
      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 20, color: scoreColor }}>{avg}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { history, deleteReview, clearHistory } = useReviewHistory();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="History"
        rightElement={
          history.length > 0 ? (
            <Pressable
              style={styles.clearBtn}
              onPress={() => Alert.alert("Clear All", "Delete all reviews?", [
                { text: "Cancel", style: "cancel" },
                { text: "Clear", style: "destructive", onPress: clearHistory },
              ])}
            >
              <Ionicons name="trash-outline" size={18} color={colors.accentRed} />
            </Pressable>
          ) : <View style={{ width: 40 }} />
        }
      />
      {history.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No reviews yet</Text>
          <Text style={styles.emptyText}>Your code analysis history will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HistoryItem
              item={item}
              colors={colors}
              onPress={() => router.push({ pathname: "/review", params: { id: item.id } })}
              onDelete={() => deleteReview(item.id)}
            />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 20 }]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
}
