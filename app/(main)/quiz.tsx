import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { ColorPalette } from "@/constants/colors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useUser } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { apiRequest } from "@/lib/query-client";

const TOPICS = ["All Topics", "Python", "DSA", "AI", "OS", "DBMS"];
const QUIZ_TIME = 20;

interface Question { id: string; topic: string; question: string; options: string[]; correct: number; explanation: string; }
type Phase = "setup" | "quiz" | "result";

const getStyles = (c: ColorPalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: c.textSecondary, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 12 },
  topicGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  topicCard: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  topicCardActive: { backgroundColor: c.accent, borderColor: c.accent },
  topicCardText: { fontFamily: "Inter_500Medium", fontSize: 14, color: c.textSecondary },
  topicCardTextActive: { color: c.isDark ? c.background : "#FFFFFF", fontFamily: "Inter_600SemiBold" },
  infoCard: { backgroundColor: c.surface, borderRadius: 14, padding: 16, gap: 12, marginBottom: 24 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoText: { fontFamily: "Inter_400Regular", fontSize: 14, color: c.textSecondary },
  startBtn: { backgroundColor: c.accent, borderRadius: 14, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  startBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: c.isDark ? c.background : "#FFFFFF" },
  progressBar: { height: 3, backgroundColor: c.border, marginHorizontal: 16, marginBottom: 16, borderRadius: 2 },
  timerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  topicTag: { fontFamily: "Inter_500Medium", fontSize: 12, color: c.textSecondary, backgroundColor: c.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  questionCard: { backgroundColor: c.surface, borderRadius: 14, padding: 18, marginBottom: 20 },
  questionText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: c.text, lineHeight: 24 },
  optionsGrid: { gap: 10, marginBottom: 16 },
  explanationCard: { backgroundColor: `${c.accent}12`, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: `${c.accent}30` },
  explanationText: { fontFamily: "Inter_400Regular", fontSize: 13, color: c.textSecondary, lineHeight: 19 },
  nextBtn: { backgroundColor: c.accent, borderRadius: 12, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  nextBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: c.isDark ? c.background : "#FFFFFF" },
  resultCard: { backgroundColor: c.surface, borderRadius: 16, padding: 32, alignItems: "center", marginBottom: 24 },
  resultGrade: { fontFamily: "Inter_600SemiBold", fontSize: 20, color: c.text, marginTop: 8 },
  resultDetail: { fontFamily: "Inter_400Regular", fontSize: 14, color: c.textSecondary, marginTop: 6 },
  reviewTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: c.text, marginBottom: 12 },
  reviewCard: { backgroundColor: c.surface, borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 3 },
  reviewHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 4 },
  reviewQ: { fontFamily: "Inter_500Medium", fontSize: 13, color: c.text, flex: 1 },
  explanation: { fontFamily: "Inter_400Regular", fontSize: 12, color: c.textSecondary, lineHeight: 17 },
  retakeBtn: { backgroundColor: c.accent, borderRadius: 12, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8 },
  retakeBtnText: { fontFamily: "Inter_700Bold", fontSize: 15, color: c.isDark ? c.background : "#FFFFFF" },
});

export default function QuizScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { addQuizScore } = useUser();
  const [topic, setTopic] = useState("All Topics");
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUIZ_TIME);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (phase === "quiz" && !answered) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { clearInterval(timerRef.current!); handleAnswer(null); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, currentIdx, answered]);

  const startQuiz = async () => {
    setLoading(true);
    try {
      const t = topic === "All Topics" ? "" : topic;
      const res = await apiRequest("GET", `/api/quiz/questions?topic=${t}&count=10`);
      const qs: Question[] = await res.json();
      setQuestions(qs);
      setCurrentIdx(0); setScore(0); setSelected(null); setAnswered(false); setTimeLeft(QUIZ_TIME); setAnswers([]);
      setPhase("quiz");
    } catch { setQuestions([]); }
    finally { setLoading(false); }
  };

  const handleAnswer = (optionIdx: number | null) => {
    if (answered) return;
    clearInterval(timerRef.current!);
    setSelected(optionIdx);
    setAnswered(true);
    if (optionIdx === questions[currentIdx].correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScore((s) => s + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setAnswers((prev) => [...prev, optionIdx]);
  };

  const nextQuestion = () => {
    if (currentIdx + 1 >= questions.length) {
      const pct = Math.round(((score + (selected === questions[currentIdx].correct ? 1 : 0)) / questions.length) * 100);
      addQuizScore(pct);
      setPhase("result");
    } else {
      setCurrentIdx((i) => i + 1); setSelected(null); setAnswered(false); setTimeLeft(QUIZ_TIME);
    }
  };

  const finalScore = Math.round((score / questions.length) * 100);
  const scoreColor = finalScore >= 75 ? colors.scoreGood : finalScore >= 50 ? colors.scoreOk : colors.scoreBad;

  if (phase === "setup") {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Quiz" subtitle="Test your knowledge" />
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 20 }]}>
          <Text style={styles.label}>Select Topic</Text>
          <View style={styles.topicGrid}>
            {TOPICS.map((t) => (
              <Pressable key={t} style={[styles.topicCard, topic === t && styles.topicCardActive]} onPress={() => { setTopic(t); Haptics.selectionAsync(); }}>
                <Text style={[styles.topicCardText, topic === t && styles.topicCardTextActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.infoCard}>
            {[{ icon: "help-circle-outline", text: "10 questions" }, { icon: "timer-outline", text: `${QUIZ_TIME}s per question` }, { icon: "trophy-outline", text: "Score tracked" }].map((info) => (
              <View key={info.text} style={styles.infoRow}>
                <Ionicons name={info.icon as any} size={16} color={colors.accent} />
                <Text style={styles.infoText}>{info.text}</Text>
              </View>
            ))}
          </View>
          <Pressable style={styles.startBtn} onPress={startQuiz} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.isDark ? colors.background : "#FFFFFF"} /> : (
              <><Ionicons name="play" size={18} color={colors.isDark ? colors.background : "#FFFFFF"} /><Text style={styles.startBtnText}>Start Quiz</Text></>
            )}
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (phase === "result") {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Quiz Results" />
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 20 }]}>
          <View style={styles.resultCard}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 56, color: scoreColor }}>{finalScore}%</Text>
            <Text style={styles.resultGrade}>{finalScore >= 85 ? "Excellent!" : finalScore >= 70 ? "Good Job!" : finalScore >= 50 ? "Keep Practicing" : "Need More Study"}</Text>
            <Text style={styles.resultDetail}>{score} of {questions.length} correct</Text>
          </View>
          <Text style={styles.reviewTitle}>Review Answers</Text>
          {questions.map((q, i) => {
            const isCorrect = answers[i] === q.correct;
            return (
              <View key={q.id} style={[styles.reviewCard, { borderLeftColor: isCorrect ? colors.accentGreen : colors.accentRed }]}>
                <View style={styles.reviewHeader}>
                  <Ionicons name={isCorrect ? "checkmark-circle" : "close-circle"} size={16} color={isCorrect ? colors.accentGreen : colors.accentRed} />
                  <Text style={styles.reviewQ} numberOfLines={2}>{q.question}</Text>
                </View>
                {!isCorrect && <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: colors.accentGreen, marginBottom: 4 }}>Correct: {q.options[q.correct]}</Text>}
                <Text style={styles.explanation}>{q.explanation}</Text>
              </View>
            );
          })}
          <Pressable style={styles.retakeBtn} onPress={() => setPhase("setup")}>
            <Ionicons name="refresh" size={16} color={colors.isDark ? colors.background : "#FFFFFF"} />
            <Text style={styles.retakeBtnText}>Take Another Quiz</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  const q = questions[currentIdx];
  const timerColor = timeLeft <= 5 ? colors.accentRed : timeLeft <= 10 ? colors.accentOrange : colors.accentGreen;

  return (
    <View style={styles.container}>
      <ScreenHeader title={`Q${currentIdx + 1} of ${questions.length}`} />
      <View style={styles.progressBar}>
        <View style={{ height: 3, width: `${(currentIdx / questions.length) * 100}%`, backgroundColor: colors.accent, borderRadius: 2 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 20 }]}>
        <View style={styles.timerRow}>
          <Text style={styles.topicTag}>{q.topic}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1.5, borderColor: timerColor, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Ionicons name="timer-outline" size={14} color={timerColor} />
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: timerColor }}>{timeLeft}s</Text>
          </View>
        </View>
        <View style={styles.questionCard}><Text style={styles.questionText}>{q.question}</Text></View>
        <View style={styles.optionsGrid}>
          {q.options.map((opt, i) => {
            let bg = colors.surface;
            let border = colors.border;
            let textColor = colors.text;
            if (answered) {
              if (i === q.correct) { bg = `${colors.accentGreen}20`; border = colors.accentGreen; textColor = colors.accentGreen; }
              else if (i === selected && selected !== q.correct) { bg = `${colors.accentRed}20`; border = colors.accentRed; textColor = colors.accentRed; }
            }
            return (
              <Pressable key={i} style={{ flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, padding: 14, borderWidth: 1.5, backgroundColor: bg, borderColor: border }} onPress={() => handleAnswer(i)} disabled={answered}>
                <View style={{ width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, borderColor: border, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontFamily: "Inter_700Bold", fontSize: 12, color: textColor }}>{String.fromCharCode(65 + i)}</Text>
                </View>
                <Text style={{ fontFamily: "Inter_500Medium", fontSize: 14, color: textColor, flex: 1 }}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
        {answered && <View style={styles.explanationCard}><Text style={styles.explanationText}>{q.explanation}</Text></View>}
        {answered && (
          <Pressable style={styles.nextBtn} onPress={nextQuestion}>
            <Text style={styles.nextBtnText}>{currentIdx + 1 >= questions.length ? "See Results" : "Next Question"}</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.isDark ? colors.background : "#FFFFFF"} />
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
