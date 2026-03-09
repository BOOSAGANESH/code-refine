import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { ColorPalette } from "@/constants/colors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { apiRequest } from "@/lib/query-client";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const GOALS = ["Get a software engineering job", "Ace FAANG interviews", "Master DSA fundamentals", "Build AI/ML projects", "Improve competitive programming"];

interface DayPlan { day: number; title: string; tasks: string[]; resources: string[]; estimatedHours: number; }
interface Roadmap { overview: string; days: DayPlan[]; tips: string[]; }

const getStyles = (c: ColorPalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: c.textSecondary, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 },
  levelRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  levelBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: "center" },
  levelBtnActive: { backgroundColor: c.accent, borderColor: c.accent },
  levelText: { fontFamily: "Inter_500Medium", fontSize: 13, color: c.textSecondary },
  levelTextActive: { color: c.isDark ? c.background : "#FFFFFF", fontFamily: "Inter_600SemiBold" },
  goalsBox: { backgroundColor: c.surface, borderRadius: 14, padding: 14, gap: 10, marginBottom: 20 },
  goalChip: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  goalText: { fontFamily: "Inter_400Regular", fontSize: 14, color: c.textSecondary, flex: 1 },
  goalTextActive: { color: c.text, fontFamily: "Inter_500Medium" },
  generateBtn: { backgroundColor: c.accent, borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 },
  generateBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: c.isDark ? c.background : "#FFFFFF" },
  overviewCard: { backgroundColor: c.surface, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: `${c.accent}30` },
  overviewHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  overviewTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: c.accent },
  overviewText: { fontFamily: "Inter_400Regular", fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: c.text, marginBottom: 12 },
  dayCard: { backgroundColor: c.surface, borderRadius: 14, marginBottom: 8, overflow: "hidden" },
  dayHeader: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  dayBadge: { backgroundColor: c.accent, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  dayNum: { fontFamily: "Inter_700Bold", fontSize: 11, color: c.isDark ? c.background : "#FFFFFF" },
  dayInfo: { flex: 1 },
  dayTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: c.text },
  dayHours: { fontFamily: "Inter_400Regular", fontSize: 11, color: c.textMuted, marginTop: 2 },
  dayBody: { paddingHorizontal: 14, paddingBottom: 14 },
  dayDivider: { height: 1, backgroundColor: c.border, marginBottom: 12 },
  taskTitle: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: c.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  taskRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  taskDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: c.accent, marginTop: 6 },
  taskText: { fontFamily: "Inter_400Regular", fontSize: 13, color: c.textSecondary, flex: 1, lineHeight: 19 },
  resourceRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  resourceText: { fontFamily: "Inter_400Regular", fontSize: 12, color: c.accent, flex: 1 },
  tipsCard: { backgroundColor: c.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: `${c.accentOrange}25`, marginTop: 4 },
  tipsHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  tipsTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: c.accentOrange },
  tipText: { fontFamily: "Inter_400Regular", fontSize: 13, color: c.textSecondary, lineHeight: 21 },
});

export default function RoadmapScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { profile } = useUser();
  const [level, setLevel] = useState("Intermediate");
  const [goal, setGoal] = useState(GOALS[0]);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const generate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true); setRoadmap(null);
    try {
      const res = await apiRequest("POST", "/api/roadmap/generate", { level, skills: profile.skills, goals: goal });
      setRoadmap(await res.json());
      setExpandedDay(0);
    } catch { Alert.alert("Error", "Could not generate roadmap. Try again."); }
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Roadmap" subtitle="AI-generated 7-day plan" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 20 }]}>
        <Text style={styles.label}>Your Level</Text>
        <View style={styles.levelRow}>
          {LEVELS.map((l) => (
            <Pressable key={l} style={[styles.levelBtn, level === l && styles.levelBtnActive]} onPress={() => { setLevel(l); Haptics.selectionAsync(); }}>
              <Text style={[styles.levelText, level === l && styles.levelTextActive]}>{l}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Your Goal</Text>
        <View style={styles.goalsBox}>
          {GOALS.map((g) => (
            <Pressable key={g} style={styles.goalChip} onPress={() => { setGoal(g); Haptics.selectionAsync(); }}>
              <Ionicons name={goal === g ? "radio-button-on" : "radio-button-off"} size={14} color={goal === g ? colors.accent : colors.textMuted} />
              <Text style={[styles.goalText, goal === g && styles.goalTextActive]}>{g}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={[styles.generateBtn, loading && { opacity: 0.7 }]} onPress={generate} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.isDark ? colors.background : "#FFFFFF"} /> : (
            <><MaterialCommunityIcons name="map-marker-path" size={18} color={colors.isDark ? colors.background : "#FFFFFF"} /><Text style={styles.generateBtnText}>Generate 7-Day Roadmap</Text></>
          )}
        </Pressable>
        {roadmap && (
          <>
            <View style={styles.overviewCard}>
              <View style={styles.overviewHeader}><Ionicons name="information-circle" size={16} color={colors.accent} /><Text style={styles.overviewTitle}>Overview</Text></View>
              <Text style={styles.overviewText}>{roadmap.overview}</Text>
            </View>
            <Text style={styles.sectionTitle}>7-Day Plan</Text>
            {roadmap.days?.map((day, i) => (
              <View key={i} style={styles.dayCard}>
                <Pressable style={styles.dayHeader} onPress={() => { setExpandedDay(expandedDay === i ? null : i); Haptics.selectionAsync(); }}>
                  <View style={styles.dayBadge}><Text style={styles.dayNum}>Day {day.day}</Text></View>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayTitle}>{day.title}</Text>
                    <Text style={styles.dayHours}>{day.estimatedHours}h estimated</Text>
                  </View>
                  <Ionicons name={expandedDay === i ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
                </Pressable>
                {expandedDay === i && (
                  <View style={styles.dayBody}>
                    <View style={styles.dayDivider} />
                    <Text style={styles.taskTitle}>Tasks</Text>
                    {day.tasks?.map((task, j) => (
                      <View key={j} style={styles.taskRow}><View style={styles.taskDot} /><Text style={styles.taskText}>{task}</Text></View>
                    ))}
                    {day.resources?.length > 0 && (
                      <><Text style={[styles.taskTitle, { marginTop: 10 }]}>Resources</Text>
                      {day.resources.map((r, j) => (
                        <View key={j} style={styles.resourceRow}><Ionicons name="link-outline" size={12} color={colors.accent} /><Text style={styles.resourceText}>{r}</Text></View>
                      ))}</>
                    )}
                  </View>
                )}
              </View>
            ))}
            {roadmap.tips?.length > 0 && (
              <View style={styles.tipsCard}>
                <View style={styles.tipsHeader}><Ionicons name="bulb" size={16} color={colors.accentOrange} /><Text style={styles.tipsTitle}>Pro Tips</Text></View>
                {roadmap.tips.map((tip, i) => <Text key={i} style={styles.tipText}>• {tip}</Text>)}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
