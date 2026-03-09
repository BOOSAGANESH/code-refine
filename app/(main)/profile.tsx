import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Platform, Alert, Switch } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { ColorPalette } from "@/constants/colors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { RadarChart } from "@/components/RadarChart";

const getStyles = (c: ColorPalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  profileCard: { backgroundColor: c.surface, borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 14 },
  avatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: c.accent, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarInitials: { fontFamily: "Inter_700Bold", fontSize: 26, color: c.isDark ? c.background : "#FFFFFF" },
  profileName: { fontFamily: "Inter_700Bold", fontSize: 22, color: c.text, marginBottom: 4 },
  profileEmail: { fontFamily: "Inter_400Regular", fontSize: 14, color: c.textSecondary, marginBottom: 6 },
  joinDate: { fontFamily: "Inter_400Regular", fontSize: 12, color: c.textMuted },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  statPill: { flex: 1, backgroundColor: c.surface, borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: c.textMuted, marginTop: 2 },
  sectionCard: { backgroundColor: c.surface, borderRadius: 14, padding: 16, marginBottom: 14, alignItems: "center" },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: c.text, marginBottom: 12, alignSelf: "flex-start" },
  settingsCard: { backgroundColor: c.surface, borderRadius: 14, marginBottom: 14, overflow: "hidden" },
  settingsTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: c.textMuted, textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  settingLabel: { fontFamily: "Inter_500Medium", fontSize: 15, color: c.text, flex: 1 },
  settingSubLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: c.textSecondary, flex: 1 },
  divider: { height: 1, backgroundColor: c.border },
  formCard: { backgroundColor: c.surface, borderRadius: 14, padding: 16, marginBottom: 14 },
  formTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: c.text, marginBottom: 16 },
  inputLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: c.textSecondary, marginBottom: 6 },
  input: { backgroundColor: c.background, borderRadius: 10, borderWidth: 1, borderColor: c.border, padding: 12, fontFamily: "Inter_400Regular", fontSize: 14, color: c.text, marginBottom: 14 },
  formBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: c.surfaceElevated, alignItems: "center" },
  cancelBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: c.textSecondary },
  saveBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: c.accent, borderRadius: 10, paddingVertical: 12 },
  saveBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: c.isDark ? c.background : "#FFFFFF" },
  actionsCard: { backgroundColor: c.surface, borderRadius: 14, marginBottom: 14, overflow: "hidden" },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  actionText: { fontFamily: "Inter_500Medium", fontSize: 15, color: c.text, flex: 1 },
  historyCard: { backgroundColor: c.surface, borderRadius: 14, padding: 16, marginBottom: 14 },
  scoreHistory: { flexDirection: "row", alignItems: "flex-end", gap: 6, height: 80 },
  scoreBar: { flex: 1, height: "100%", justifyContent: "flex-end", alignItems: "center", gap: 4 },
  scoreBarFill: { width: "100%", borderRadius: 3, minHeight: 4 },
  scoreBarLabel: { fontFamily: "Inter_400Regular", fontSize: 9, color: c.textMuted },
  appInfoCard: { backgroundColor: c.surface, borderRadius: 14, padding: 16, alignItems: "center" },
  appInfoTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: c.accent, marginBottom: 4 },
  appInfoText: { fontFamily: "Inter_400Regular", fontSize: 12, color: c.textSecondary },
  appInfoVersion: { fontFamily: "Inter_400Regular", fontSize: 11, color: c.textMuted, marginTop: 4 },
});

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors, mode, toggle } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { profile, login, logout } = useUser();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [editing, setEditing] = useState(!profile.isLoggedIn);

  const avgQuiz = profile.quizScores.length > 0
    ? Math.round(profile.quizScores.reduce((a, b) => a + b, 0) / profile.quizScores.length)
    : 0;

  const save = async () => {
    if (!name.trim()) { Alert.alert("Name required", "Please enter your name."); return; }
    await login(name.trim(), email.trim());
    setEditing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const initials = profile.name ? profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "?";
  const joinDate = new Date(profile.joinDate).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const STAT_PILLARS = [
    { label: "Solved", value: profile.problemsSolved.length, color: colors.accentGreen },
    { label: "Quiz Avg", value: `${avgQuiz}%`, color: colors.accentOrange },
    { label: "Reviews", value: profile.codeAnalysisCount, color: colors.accent },
    { label: "Interviews", value: profile.interviewCount, color: "#B39DDB" },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader title="Profile & Settings" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 20 }]}>
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{profile.isLoggedIn ? profile.name : "Guest User"}</Text>
          {profile.email ? <Text style={styles.profileEmail}>{profile.email}</Text> : null}
          <Text style={styles.joinDate}>Member since {joinDate}</Text>
        </View>

        <View style={styles.statsRow}>
          {STAT_PILLARS.map((stat) => (
            <View key={stat.label} style={[styles.statPill, { borderColor: `${stat.color}40` }]}>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 18, color: stat.color }}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Skill Radar</Text>
          <RadarChart skills={profile.skills} size={200} />
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Appearance</Text>
          <View style={styles.settingRow}>
            <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: `${colors.accent}18`, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name={mode === "dark" ? "moon" : "sunny"} size={18} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>{mode === "dark" ? "Dark Theme" : "Light Theme"}</Text>
              <Text style={styles.settingSubLabel}>{mode === "dark" ? "Easy on the eyes" : "Bright and clean"}</Text>
            </View>
            <Switch
              value={mode === "light"}
              onValueChange={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggle(); }}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={mode === "light" ? (colors.isDark ? colors.background : "#FFFFFF") : colors.surfaceElevated}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>

        {editing || !profile.isLoggedIn ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{profile.isLoggedIn ? "Edit Profile" : "Create Profile"}</Text>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your full name" placeholderTextColor={colors.textMuted} autoCapitalize="words" />
            <Text style={styles.inputLabel}>Email (optional)</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="your@email.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
            <View style={styles.formBtns}>
              {profile.isLoggedIn && (
                <Pressable style={styles.cancelBtn} onPress={() => setEditing(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
              )}
              <Pressable style={styles.saveBtn} onPress={save}>
                <Ionicons name="checkmark" size={16} color={colors.isDark ? colors.background : "#FFFFFF"} />
                <Text style={styles.saveBtnText}>{profile.isLoggedIn ? "Save Changes" : "Create Profile"}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.actionsCard}>
            <Pressable style={styles.actionRow} onPress={() => setEditing(true)}>
              <Ionicons name="pencil-outline" size={18} color={colors.text} />
              <Text style={styles.actionText}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.actionRow} onPress={() => Alert.alert("Logout", "Sign out?", [
              { text: "Cancel", style: "cancel" },
              { text: "Logout", style: "destructive", onPress: logout },
            ])}>
              <Ionicons name="log-out-outline" size={18} color={colors.accentRed} />
              <Text style={[styles.actionText, { color: colors.accentRed }]}>Logout</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        )}

        {profile.quizScores.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.sectionTitle}>Quiz History</Text>
            <View style={styles.scoreHistory}>
              {profile.quizScores.slice(-8).map((s, i) => {
                const color = s >= 75 ? colors.scoreGood : s >= 50 ? colors.scoreOk : colors.scoreBad;
                return (
                  <View key={i} style={styles.scoreBar}>
                    <View style={[styles.scoreBarFill, { height: `${s}%`, backgroundColor: color }]} />
                    <Text style={styles.scoreBarLabel}>{s}%</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={styles.appInfoCard}>
          <Text style={styles.appInfoTitle}>CodeMentor AI</Text>
          <Text style={styles.appInfoText}>AI-powered coding preparation platform</Text>
          <Text style={styles.appInfoVersion}>v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}
