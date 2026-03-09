import React, { useState, useCallback, useMemo } from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView, TextInput,
  Platform, ActivityIndicator, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import type { ColorPalette } from "@/constants/colors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useReviewHistory } from "@/contexts/ReviewHistoryContext";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { apiRequest } from "@/lib/query-client";

const LANGUAGES = [
  { id: "python", label: "Python" },
  { id: "javascript", label: "JS" },
  { id: "typescript", label: "TS" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
];

const EXAMPLE = `def find_duplicates(arr):
    duplicates = []
    for i in range(len(arr)):
        for j in range(len(arr)):
            if i != j and arr[i] == arr[j]:
                if arr[i] not in duplicates:
                    duplicates.append(arr[i])
    return duplicates

password = "admin123"
def get_user(user_id):
    query = "SELECT * FROM users WHERE id = " + str(user_id)
    return execute_query(query)`;

const getStyles = (c: ColorPalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: 16 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: c.textSecondary, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 },
  langRow: { gap: 8, paddingRight: 4, marginBottom: 20 },
  langChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  langChipActive: { backgroundColor: c.accent, borderColor: c.accent },
  langChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: c.textSecondary },
  langChipTextActive: { color: c.isDark ? c.background : "#FFFFFF" },
  codeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  exampleLink: { fontFamily: "Inter_500Medium", fontSize: 12, color: c.accent },
  codeBox: { backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 14, minHeight: 200, marginBottom: 8 },
  codeInput: { fontFamily: "Inter_400Regular", fontSize: 13, color: c.text, lineHeight: 20, minHeight: 180, textAlignVertical: "top" },
  charCount: { fontFamily: "Inter_400Regular", fontSize: 11, color: c.textMuted, textAlign: "right", marginBottom: 16 },
  badges: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: c.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: c.border },
  badgeText: { fontFamily: "Inter_500Medium", fontSize: 11, color: c.textSecondary },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: c.background, borderTopWidth: 1, borderTopColor: c.border },
  analyzeBtn: { backgroundColor: c.accent, borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  analyzeBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: c.isDark ? c.background : "#FFFFFF" },
});

export default function AnalyzerScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { addReview } = useReviewHistory();
  const { incrementAnalysis } = useUser();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const analyze = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("No Code", "Please paste some code to analyze.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    btnScale.value = withSpring(0.96, {}, () => { btnScale.value = withSpring(1); });
    setIsAnalyzing(true);
    try {
      const res = await apiRequest("POST", "/api/review", { code: trimmed, language });
      const result = await res.json();
      const record = await addReview({ code: trimmed, language, result });
      await incrementAnalysis();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({ pathname: "/review", params: { id: record.id } });
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Failed", "Could not analyze code. Try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [code, language]);

  const BADGE_ITEMS = [
    { icon: "bug-outline", label: "Bugs", color: colors.accentRed },
    { icon: "shield-checkmark-outline", label: "Security", color: colors.accentOrange },
    { icon: "flash-outline", label: "Optimize", color: colors.accentGreen },
    { icon: "analytics-outline", label: "Complexity", color: colors.accent },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader title="Code Analyzer" subtitle="AI-powered code review" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 100 }]} keyboardDismissMode="interactive">
        <Text style={styles.label}>Language</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langRow}>
          {LANGUAGES.map((lang) => (
            <Pressable
              key={lang.id}
              style={[styles.langChip, language === lang.id && styles.langChipActive]}
              onPress={() => { setLanguage(lang.id); Haptics.selectionAsync(); }}
            >
              <Text style={[styles.langChipText, language === lang.id && styles.langChipTextActive]}>{lang.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.codeHeader}>
          <Text style={styles.label}>Your Code</Text>
          <Pressable onPress={() => { setCode(EXAMPLE); Haptics.selectionAsync(); }}>
            <Text style={styles.exampleLink}>Try example</Text>
          </Pressable>
        </View>
        <View style={styles.codeBox}>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={setCode}
            placeholder="Paste your code here..."
            placeholderTextColor={colors.textMuted}
            multiline
            scrollEnabled={false}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {code.length > 0 && (
            <Pressable style={{ position: "absolute", top: 10, right: 10 }} onPress={() => setCode("")}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
        {code.length > 0 && <Text style={styles.charCount}>{code.length} chars</Text>}

        <View style={styles.badges}>
          {BADGE_ITEMS.map((b) => (
            <View key={b.label} style={styles.badge}>
              <Ionicons name={b.icon as any} size={13} color={b.color} />
              <Text style={styles.badgeText}>{b.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(bottomPad, 16) + 8 }]}>
        <Animated.View style={[{ flex: 1 }, btnStyle]}>
          <Pressable style={[styles.analyzeBtn, isAnalyzing && { opacity: 0.7 }]} onPress={analyze} disabled={isAnalyzing}>
            {isAnalyzing ? <ActivityIndicator color={colors.isDark ? colors.background : "#FFFFFF"} size="small" /> : <Ionicons name="search" size={18} color={colors.isDark ? colors.background : "#FFFFFF"} />}
            <Text style={styles.analyzeBtnText}>{isAnalyzing ? "Analyzing..." : "Analyze Code"}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}
