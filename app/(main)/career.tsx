import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Platform, ActivityIndicator, Alert, Clipboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { ColorPalette } from "@/constants/colors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { apiRequest } from "@/lib/query-client";

interface CareerPath { title: string; match: number; description: string; nextSteps: string[]; }
interface CareerAdvice {
  topPath: { title: string; description: string; salary: string; companies: string[] };
  paths: CareerPath[];
  linkedinTips: string[];
  linkedinPost: string;
  skillGaps: string[];
}

const getStyles = (c: ColorPalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: c.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  statChipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: c.textSecondary },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: c.textSecondary, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 },
  input: { backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 14, fontFamily: "Inter_400Regular", fontSize: 14, color: c.text, minHeight: 90, textAlignVertical: "top", marginBottom: 16 },
  adviseBtn: { backgroundColor: c.accent, borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 20 },
  adviseBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: c.isDark ? c.background : "#FFFFFF" },
  topPathCard: { backgroundColor: c.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: `${c.accentOrange}30`, marginBottom: 16 },
  topPathHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  topPathLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: c.accentOrange, textTransform: "uppercase" },
  topPathTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: c.text, marginBottom: 6 },
  topPathDesc: { fontFamily: "Inter_400Regular", fontSize: 13, color: c.textSecondary, lineHeight: 19, marginBottom: 8 },
  topPathSalary: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: c.accentGreen, marginBottom: 10 },
  companiesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  companyChip: { backgroundColor: c.surfaceElevated, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  companyText: { fontFamily: "Inter_500Medium", fontSize: 12, color: c.text },
  tabRow: { flexDirection: "row", gap: 6, marginBottom: 14 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: c.surface, alignItems: "center" },
  tabActive: { backgroundColor: c.accent },
  tabText: { fontFamily: "Inter_500Medium", fontSize: 12, color: c.textSecondary },
  tabTextActive: { color: c.isDark ? c.background : "#FFFFFF", fontFamily: "Inter_600SemiBold" },
  pathCard: { backgroundColor: c.surface, borderRadius: 14, padding: 16, marginBottom: 10 },
  pathHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  pathTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: c.text },
  matchBar: { height: 4, backgroundColor: c.border, borderRadius: 2, marginBottom: 10 },
  pathDesc: { fontFamily: "Inter_400Regular", fontSize: 13, color: c.textSecondary, lineHeight: 19 },
  stepsBox: { marginTop: 10, backgroundColor: c.background, borderRadius: 8, padding: 10 },
  stepsTitle: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: c.textMuted, textTransform: "uppercase", marginBottom: 6 },
  stepItem: { fontFamily: "Inter_400Regular", fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  linkedinCard: { backgroundColor: c.surface, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(0,119,181,0.2)" },
  linkedinHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  linkedinTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#0077B5" },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  tipDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: c.accent, marginTop: 6 },
  tipText: { fontFamily: "Inter_400Regular", fontSize: 13, color: c.textSecondary, flex: 1, lineHeight: 19 },
  postCard: { backgroundColor: c.surface, borderRadius: 14, padding: 16, marginBottom: 12 },
  postHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  postTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: c.text },
  postText: { fontFamily: "Inter_400Regular", fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  gapsCard: { backgroundColor: c.surface, borderRadius: 14, padding: 16, marginBottom: 12 },
  gapsHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  gapsTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: c.text },
  gapRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  gapText: { fontFamily: "Inter_400Regular", fontSize: 14, color: c.textSecondary, flex: 1 },
});

export default function CareerScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { profile } = useUser();
  const [interests, setInterests] = useState("");
  const [advice, setAdvice] = useState<CareerAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"paths" | "linkedin" | "gaps">("paths");
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const avgQuiz = profile.quizScores.length > 0
    ? Math.round(profile.quizScores.reduce((a, b) => a + b, 0) / profile.quizScores.length)
    : 0;

  const getAdvice = async () => {
    if (!interests.trim()) { Alert.alert("Tell us more", "Please enter your interests or goals."); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/career/advice", { skills: profile.skills, problemsSolved: profile.problemsSolved.length, quizAvg: avgQuiz, interests: interests.trim() });
      setAdvice(await res.json());
    } catch { Alert.alert("Error", "Could not get career advice. Try again."); }
    finally { setLoading(false); }
  };

  const MATCH_COLOR = (m: number) => m >= 80 ? colors.accentGreen : m >= 60 ? colors.accent : colors.accentOrange;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Career Advisor" subtitle="AI-powered career guidance" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 20 }]} keyboardDismissMode="interactive">
        <View style={styles.statsRow}>
          <View style={styles.statChip}><Ionicons name="checkmark-circle" size={14} color={colors.accentGreen} /><Text style={styles.statChipText}>{profile.problemsSolved.length} solved</Text></View>
          <View style={styles.statChip}><Ionicons name="help-circle" size={14} color={colors.accentOrange} /><Text style={styles.statChipText}>{avgQuiz}% quiz avg</Text></View>
          <View style={styles.statChip}><Ionicons name="mic" size={14} color={colors.accent} /><Text style={styles.statChipText}>{profile.interviewCount} interviews</Text></View>
        </View>
        <Text style={styles.label}>Your Interests and Goals</Text>
        <TextInput style={styles.input} value={interests} onChangeText={setInterests} placeholder="e.g. I enjoy backend development, AI, system design..." placeholderTextColor={colors.textMuted} multiline numberOfLines={3} />
        <Pressable style={[styles.adviseBtn, loading && { opacity: 0.7 }]} onPress={getAdvice} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.isDark ? colors.background : "#FFFFFF"} /> : (
            <><MaterialCommunityIcons name="robot-outline" size={18} color={colors.isDark ? colors.background : "#FFFFFF"} /><Text style={styles.adviseBtnText}>Get AI Career Advice</Text></>
          )}
        </Pressable>
        {advice && (
          <>
            <View style={styles.topPathCard}>
              <View style={styles.topPathHeader}><Ionicons name="trophy" size={18} color={colors.accentOrange} /><Text style={styles.topPathLabel}>Best Match</Text></View>
              <Text style={styles.topPathTitle}>{advice.topPath.title}</Text>
              <Text style={styles.topPathDesc}>{advice.topPath.description}</Text>
              <Text style={styles.topPathSalary}>{advice.topPath.salary}</Text>
              <View style={styles.companiesRow}>
                {advice.topPath.companies?.slice(0, 4).map((c) => (
                  <View key={c} style={styles.companyChip}><Text style={styles.companyText}>{c}</Text></View>
                ))}
              </View>
            </View>
            <View style={styles.tabRow}>
              {(["paths", "linkedin", "gaps"] as const).map((tab) => (
                <Pressable key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => { setActiveTab(tab); Haptics.selectionAsync(); }}>
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab === "paths" ? "Career Paths" : tab === "linkedin" ? "LinkedIn" : "Skill Gaps"}</Text>
                </Pressable>
              ))}
            </View>
            {activeTab === "paths" && advice.paths?.map((path, i) => (
              <View key={i} style={styles.pathCard}>
                <View style={styles.pathHeader}>
                  <Text style={styles.pathTitle}>{path.title}</Text>
                  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 18, color: MATCH_COLOR(path.match) }}>{path.match}%</Text>
                </View>
                <View style={styles.matchBar}><View style={{ height: 4, width: `${path.match}%`, backgroundColor: MATCH_COLOR(path.match), borderRadius: 2 }} /></View>
                <Text style={styles.pathDesc}>{path.description}</Text>
                {path.nextSteps?.length > 0 && (
                  <View style={styles.stepsBox}>
                    <Text style={styles.stepsTitle}>Next Steps</Text>
                    {path.nextSteps.slice(0, 3).map((s, j) => <Text key={j} style={styles.stepItem}>→ {s}</Text>)}
                  </View>
                )}
              </View>
            ))}
            {activeTab === "linkedin" && (
              <>
                <View style={styles.linkedinCard}>
                  <View style={styles.linkedinHeader}><MaterialCommunityIcons name="linkedin" size={18} color="#0077B5" /><Text style={styles.linkedinTitle}>LinkedIn Strategy</Text></View>
                  {advice.linkedinTips?.map((tip, i) => (
                    <View key={i} style={styles.tipRow}><View style={styles.tipDot} /><Text style={styles.tipText}>{tip}</Text></View>
                  ))}
                </View>
                {advice.linkedinPost && (
                  <View style={styles.postCard}>
                    <View style={styles.postHeader}>
                      <Text style={styles.postTitle}>AI-Generated LinkedIn Post</Text>
                      <Pressable onPress={() => { Clipboard.setString(advice.linkedinPost); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); Alert.alert("Copied!", "Post copied to clipboard."); }}>
                        <Ionicons name="copy-outline" size={18} color={colors.accent} />
                      </Pressable>
                    </View>
                    <Text style={styles.postText}>{advice.linkedinPost}</Text>
                  </View>
                )}
              </>
            )}
            {activeTab === "gaps" && (
              <View style={styles.gapsCard}>
                <View style={styles.gapsHeader}><Ionicons name="trending-up" size={16} color={colors.accent} /><Text style={styles.gapsTitle}>Skills to Develop</Text></View>
                {advice.skillGaps?.map((gap, i) => (
                  <View key={i} style={styles.gapRow}><Ionicons name="arrow-up-circle-outline" size={14} color={colors.accentOrange} /><Text style={styles.gapText}>{gap}</Text></View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
