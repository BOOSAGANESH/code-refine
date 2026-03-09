import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Platform, ActivityIndicator, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { ColorPalette } from "@/constants/colors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { apiRequest } from "@/lib/query-client";

const TOPICS = ["Data Structures", "Algorithms", "System Design", "OOP", "Python", "JavaScript", "Database"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

interface Question { question: string; expectedPoints: string[]; topic: string; difficulty: string; }
interface Evaluation { score: number; grade: string; feedback: string; missedPoints: string[]; strengths: string[]; }
interface Round { question: Question; answer: string; evaluation: Evaluation; }
type Phase = "setup" | "answering" | "evaluating" | "round_result";

const getStyles = (c: ColorPalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: c.textSecondary, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10, marginTop: 16 },
  chipRow: { gap: 8, paddingBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  chipActive: { backgroundColor: c.accent, borderColor: c.accent },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: c.textSecondary },
  chipTextActive: { color: c.isDark ? c.background : "#FFFFFF" },
  diffRow: { flexDirection: "row", gap: 10 },
  diffChip: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: "center" },
  diffChipActive: { backgroundColor: c.accent, borderColor: c.accent },
  diffText: { fontFamily: "Inter_500Medium", fontSize: 13, color: c.textSecondary },
  diffTextActive: { color: c.isDark ? c.background : "#FFFFFF", fontFamily: "Inter_600SemiBold" },
  statsCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: c.surface, borderRadius: 12, padding: 14, marginTop: 16 },
  statsInfo: { flex: 1 },
  statsValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: c.text },
  statsLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: c.textSecondary },
  startBtn: { backgroundColor: c.accent, borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 },
  startBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: c.isDark ? c.background : "#FFFFFF" },
  centerContent: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  evalText: { fontFamily: "Inter_500Medium", fontSize: 15, color: c.textSecondary },
  questionCard: { backgroundColor: c.surface, borderRadius: 14, padding: 18, marginBottom: 12 },
  questionMeta: { flexDirection: "row", gap: 8, marginBottom: 12 },
  questionMetaText: { fontFamily: "Inter_500Medium", fontSize: 11, color: c.textMuted, backgroundColor: c.surfaceElevated, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  questionText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: c.text, lineHeight: 24 },
  answerInput: { backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 14, fontFamily: "Inter_400Regular", fontSize: 14, color: c.text, lineHeight: 21, minHeight: 150, textAlignVertical: "top", marginBottom: 16 },
  submitBtn: { backgroundColor: c.accent, borderRadius: 12, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: c.isDark ? c.background : "#FFFFFF" },
  gradeCard: { backgroundColor: c.surface, borderRadius: 16, padding: 28, alignItems: "center", marginBottom: 16 },
  gradeScore: { fontFamily: "Inter_600SemiBold", fontSize: 20, color: c.text, marginTop: 6 },
  feedbackCard: { backgroundColor: c.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
  feedbackTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: c.accent, marginBottom: 8 },
  feedbackText: { fontFamily: "Inter_400Regular", fontSize: 14, color: c.textSecondary, lineHeight: 21 },
  pointsCard: { backgroundColor: c.surface, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: `${c.accentGreen}30` },
  pointsCardWarn: { backgroundColor: c.surface, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: `${c.accentOrange}30` },
  pointsHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  pointsTitle: { fontFamily: "Inter_600SemiBold", fontSize: 12, textTransform: "uppercase" },
  pointItem: { fontFamily: "Inter_400Regular", fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  endBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12, paddingVertical: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  endBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: c.textSecondary },
  nextBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: c.accent, borderRadius: 12, paddingVertical: 14 },
  nextBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: c.isDark ? c.background : "#FFFFFF" },
  hintRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  hintText: { fontFamily: "Inter_400Regular", fontSize: 12, color: c.textMuted },
});

const GRADE_COLORS: Record<string, string> = { Excellent: "#00E676", Good: "#00D4FF", Fair: "#FFA726", Poor: "#FF4757" };

export default function InterviewScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { profile, incrementInterview } = useUser();
  const [topic, setTopic] = useState("Data Structures");
  const [difficulty, setDifficulty] = useState("Medium");
  const [phase, setPhase] = useState<Phase>("setup");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(false);
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const startSession = async () => {
    setLoading(true);
    setPreviousQuestions([]); setRounds([]);
    try {
      const res = await apiRequest("POST", "/api/interview/question", { topic, difficulty, previousQuestions: [] });
      const q: Question = await res.json();
      setCurrentQuestion(q); setAnswer(""); setPhase("answering");
      await incrementInterview();
    } catch { Alert.alert("Error", "Could not start interview. Try again."); }
    finally { setLoading(false); }
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !currentQuestion) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase("evaluating"); setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/interview/evaluate", { question: currentQuestion.question, answer: answer.trim(), expectedPoints: currentQuestion.expectedPoints });
      const eval_: Evaluation = await res.json();
      setEvaluation(eval_);
      setRounds((prev) => [...prev, { question: currentQuestion, answer: answer.trim(), evaluation: eval_ }]);
      setPreviousQuestions((prev) => [...prev, currentQuestion.question]);
      setPhase("round_result");
    } catch { Alert.alert("Error", "Could not evaluate. Try again."); setPhase("answering"); }
    finally { setLoading(false); }
  };

  const nextQuestion = async () => {
    setLoading(true); setAnswer("");
    try {
      const res = await apiRequest("POST", "/api/interview/question", { topic, difficulty, previousQuestions });
      const q: Question = await res.json();
      setCurrentQuestion(q); setEvaluation(null); setPhase("answering");
    } catch { Alert.alert("Error", "Could not get next question."); }
    finally { setLoading(false); }
  };

  if (phase === "setup") {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Interview Sim" subtitle="AI-powered mock interviews" />
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 20 }]}>
          <Text style={styles.label}>Topic</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {TOPICS.map((t) => (
              <Pressable key={t} style={[styles.chip, topic === t && styles.chipActive]} onPress={() => { setTopic(t); Haptics.selectionAsync(); }}>
                <Text style={[styles.chipText, topic === t && styles.chipTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.label}>Difficulty</Text>
          <View style={styles.diffRow}>
            {DIFFICULTIES.map((d) => (
              <Pressable key={d} style={[styles.diffChip, difficulty === d && styles.diffChipActive]} onPress={() => { setDifficulty(d); Haptics.selectionAsync(); }}>
                <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>{d}</Text>
              </Pressable>
            ))}
          </View>
          {profile.interviewCount > 0 && (
            <View style={styles.statsCard}>
              <Ionicons name="mic" size={20} color={colors.accent} />
              <View style={styles.statsInfo}>
                <Text style={styles.statsValue}>{profile.interviewCount} sessions completed</Text>
                <Text style={styles.statsLabel}>Keep practicing to improve!</Text>
              </View>
            </View>
          )}
          <Pressable style={styles.startBtn} onPress={startSession} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.isDark ? colors.background : "#FFFFFF"} /> : (
              <><Ionicons name="mic" size={18} color={colors.isDark ? colors.background : "#FFFFFF"} /><Text style={styles.startBtnText}>Start Interview</Text></>
            )}
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (phase === "evaluating") {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Interview Sim" />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.evalText}>AI is evaluating your answer...</Text>
        </View>
      </View>
    );
  }

  if (phase === "round_result" && evaluation && currentQuestion) {
    const gradeColor = GRADE_COLORS[evaluation.grade] || colors.accent;
    return (
      <View style={styles.container}>
        <ScreenHeader title="Feedback" />
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 20 }]}>
          <View style={styles.gradeCard}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 32, color: gradeColor }}>{evaluation.grade}</Text>
            <Text style={styles.gradeScore}>{evaluation.score}/10</Text>
          </View>
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>Feedback</Text>
            <Text style={styles.feedbackText}>{evaluation.feedback}</Text>
          </View>
          {evaluation.strengths.length > 0 && (
            <View style={styles.pointsCard}>
              <View style={styles.pointsHeader}>
                <Ionicons name="checkmark-circle" size={14} color={colors.accentGreen} />
                <Text style={[styles.pointsTitle, { color: colors.accentGreen }]}>Strengths</Text>
              </View>
              {evaluation.strengths.map((s, i) => <Text key={i} style={styles.pointItem}>• {s}</Text>)}
            </View>
          )}
          {evaluation.missedPoints.length > 0 && (
            <View style={styles.pointsCardWarn}>
              <View style={styles.pointsHeader}>
                <Ionicons name="alert-circle-outline" size={14} color={colors.accentOrange} />
                <Text style={[styles.pointsTitle, { color: colors.accentOrange }]}>Missed Points</Text>
              </View>
              {evaluation.missedPoints.map((s, i) => <Text key={i} style={[styles.pointItem, { color: colors.accentOrange }]}>• {s}</Text>)}
            </View>
          )}
          <View style={styles.actionRow}>
            <Pressable style={styles.endBtn} onPress={() => setPhase("setup")}>
              <Ionicons name="stop-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.endBtnText}>End Session</Text>
            </Pressable>
            <Pressable style={styles.nextBtn} onPress={nextQuestion} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.isDark ? colors.background : "#FFFFFF"} size="small" /> : (
                <><Text style={styles.nextBtnText}>Next Question</Text><Ionicons name="arrow-forward" size={16} color={colors.isDark ? colors.background : "#FFFFFF"} /></>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (phase === "answering" && currentQuestion) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={`Q${rounds.length + 1} • ${topic}`} />
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 20 }]} keyboardDismissMode="interactive">
          <View style={styles.questionCard}>
            <View style={styles.questionMeta}>
              <Text style={styles.questionMetaText}>{currentQuestion.difficulty}</Text>
              <Text style={styles.questionMetaText}>{currentQuestion.topic}</Text>
            </View>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </View>
          {currentQuestion.expectedPoints?.length > 0 && (
            <View style={styles.hintRow}>
              <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
              <Text style={styles.hintText}>Cover: {currentQuestion.expectedPoints.slice(0, 2).join(", ")}...</Text>
            </View>
          )}
          <Text style={styles.label}>Your Answer</Text>
          <TextInput
            style={styles.answerInput}
            value={answer}
            onChangeText={setAnswer}
            placeholder="Type your answer here..."
            placeholderTextColor={colors.textMuted}
            multiline
            scrollEnabled={false}
            autoCapitalize="sentences"
          />
          <Pressable style={[styles.submitBtn, !answer.trim() && { opacity: 0.5 }]} onPress={submitAnswer} disabled={!answer.trim()}>
            <Ionicons name="send" size={16} color={colors.isDark ? colors.background : "#FFFFFF"} />
            <Text style={styles.submitBtnText}>Submit Answer</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return null;
}
