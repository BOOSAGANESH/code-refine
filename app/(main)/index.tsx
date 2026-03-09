import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { ColorPalette } from "@/constants/colors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { RadarChart } from "@/components/RadarChart";
import { useUser } from "@/contexts/UserContext";
import { useReviewHistory } from "@/contexts/ReviewHistoryContext";
import { useTheme } from "@/contexts/ThemeContext";

const QUICK_ACTIONS = [
  { label: "Analyze Code", icon: "code-slash", route: "/(main)/analyzer", colorKey: "accent" },
  { label: "DSA Practice", icon: "barbell-outline", route: "/(main)/practice", colorKey: "accentGreen" },
  { label: "Take Quiz", icon: "help-circle-outline", route: "/(main)/quiz", colorKey: "accentOrange" },
  { label: "Interview", icon: "mic-outline", route: "/(main)/interview", colorKey: "purple" },
];

const getStyles = (c: ColorPalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: 16, paddingTop: 4 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  statCard: { width: "47.5%", backgroundColor: c.surface, borderRadius: 14, padding: 14, gap: 6 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: c.textSecondary },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: c.text },
  seeAll: { fontFamily: "Inter_500Medium", fontSize: 13, color: c.accent },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  actionCard: { width: "47.5%", backgroundColor: c.surface, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: c.border },
  actionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: c.text },
  radarCard: { backgroundColor: c.surface, borderRadius: 16, padding: 16, marginBottom: 20, alignItems: "center" },
  skillLegend: { width: "100%", marginTop: 12, gap: 6 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent },
  legendKey: { fontFamily: "Inter_500Medium", fontSize: 11, color: c.textSecondary, width: 60 },
  legendBarBg: { flex: 1, height: 4, backgroundColor: c.border, borderRadius: 2 },
  legendBar: { height: 4, backgroundColor: c.accent, borderRadius: 2 },
  legendVal: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: c.text, width: 24, textAlign: "right" },
  recentCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: c.surface, borderRadius: 12, padding: 12, marginBottom: 8 },
  recentLang: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: c.text, flex: 1 },
  recentBugs: { fontFamily: "Inter_400Regular", fontSize: 12, color: c.textSecondary },
  dcCard: { backgroundColor: c.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: c.border, marginTop: 8 },
  dcHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  dcTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: c.accentOrange },
  dcText: { fontFamily: "Inter_400Regular", fontSize: 13, color: c.textSecondary, lineHeight: 19, marginBottom: 12 },
  dcBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: c.accentOrange, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignSelf: "flex-start" },
  dcBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#FFFFFF" },
});

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { profile } = useUser();
  const { history } = useReviewHistory();

  const avgQuiz = profile.quizScores.length > 0
    ? Math.round(profile.quizScores.reduce((a, b) => a + b, 0) / profile.quizScores.length)
    : 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const STAT_ITEMS = [
    { label: "Problems Solved", value: profile.problemsSolved.length, icon: "checkmark-circle", color: colors.accentGreen },
    { label: "Quiz Average", value: `${avgQuiz}%`, icon: "help-circle", color: colors.accentOrange },
    { label: "Code Reviews", value: profile.codeAnalysisCount, icon: "code-slash", color: colors.accent },
    { label: "Interviews", value: profile.interviewCount, icon: "mic", color: "#B39DDB" },
  ];

  const ACTION_COLORS = [colors.accent, colors.accentGreen, colors.accentOrange, "#B39DDB"];

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="CodeMentor AI"
        subtitle={`${greeting()}${profile.name ? ", " + profile.name.split(" ")[0] : ""}`}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 20 }]}>
        <View style={styles.statsGrid}>
          {STAT_ITEMS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: `${stat.color}18`, alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={stat.icon as any} size={18} color={stat.color} />
              </View>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 24, color: stat.color }}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action, i) => {
            const color = ACTION_COLORS[i];
            return (
              <Pressable
                key={action.label}
                style={[styles.actionCard, { borderColor: `${color}40` }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(action.route as any); }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${color}18`, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={action.icon as any} size={22} color={color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Skill Radar</Text>
          <Pressable onPress={() => router.push("/(main)/practice" as any)}>
            <Text style={styles.seeAll}>Practice</Text>
          </Pressable>
        </View>
        <View style={styles.radarCard}>
          <RadarChart skills={profile.skills} size={220} />
          <View style={styles.skillLegend}>
            {Object.entries(profile.skills).map(([key, val]) => (
              <View key={key} style={styles.legendRow}>
                <View style={styles.legendDot} />
                <Text style={styles.legendKey}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                <View style={styles.legendBarBg}>
                  <View style={[styles.legendBar, { width: `${val}%` }]} />
                </View>
                <Text style={styles.legendVal}>{val}</Text>
              </View>
            ))}
          </View>
        </View>

        {history.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Reviews</Text>
              <Pressable onPress={() => router.push("/(main)/history" as any)}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            {history.slice(0, 3).map((rec) => {
              const avg = Math.round((rec.result.scores.quality + rec.result.scores.performance + rec.result.scores.security) / 3);
              const scoreColor = avg >= 75 ? colors.scoreGood : avg >= 50 ? colors.scoreOk : colors.scoreBad;
              return (
                <Pressable key={rec.id} style={styles.recentCard} onPress={() => router.push({ pathname: "/review", params: { id: rec.id } })}>
                  <Ionicons name="code-slash" size={16} color={colors.accent} />
                  <Text style={styles.recentLang}>{rec.language}</Text>
                  <Text style={styles.recentBugs}>{rec.result.bugs?.length || 0} bugs</Text>
                  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 16, color: scoreColor }}>{avg}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                </Pressable>
              );
            })}
          </>
        )}

        <View style={styles.dcCard}>
          <View style={styles.dcHeader}>
            <Ionicons name="flash" size={16} color={colors.accentOrange} />
            <Text style={styles.dcTitle}>Daily Challenge</Text>
          </View>
          <Text style={styles.dcText}>Complete a DSA problem, a quiz, and analyze some code today!</Text>
          <Pressable style={styles.dcBtn} onPress={() => router.push("/(main)/practice" as any)}>
            <Text style={styles.dcBtnText}>Start Challenge</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
