import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { ColorPalette } from "@/constants/colors";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useUser, SkillProgress } from "@/contexts/UserContext";
import { useTheme } from "@/contexts/ThemeContext";
import { apiRequest } from "@/lib/query-client";

interface Problem {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: keyof SkillProgress;
  description: string;
  examples: string;
}

const PROBLEMS: Problem[] = [
  { id: "arr1", title: "Two Sum", difficulty: "Easy", topic: "arrays", description: "Given an array of integers and a target, return indices of two numbers that add up to the target.", examples: "Input: [2,7,11,15], target=9\nOutput: [0,1]" },
  { id: "arr2", title: "Best Time to Buy Stock", difficulty: "Easy", topic: "arrays", description: "Find the maximum profit from buying and selling a stock once.", examples: "Input: [7,1,5,3,6,4]\nOutput: 5" },
  { id: "arr3", title: "Maximum Subarray", difficulty: "Medium", topic: "arrays", description: "Find the contiguous subarray with the largest sum (Kadane's Algorithm).", examples: "Input: [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6" },
  { id: "str1", title: "Valid Palindrome", difficulty: "Easy", topic: "strings", description: "Check if a string is a palindrome considering only alphanumeric characters.", examples: "Input: 'A man a plan a canal Panama'\nOutput: true" },
  { id: "str2", title: "Longest Substring No Repeat", difficulty: "Medium", topic: "strings", description: "Find the length of the longest substring without repeating characters.", examples: "Input: 'abcabcbb'\nOutput: 3" },
  { id: "tree1", title: "Max Depth of Binary Tree", difficulty: "Easy", topic: "trees", description: "Find the maximum depth of a binary tree.", examples: "Input: [3,9,20,null,null,15,7]\nOutput: 3" },
  { id: "tree2", title: "Invert Binary Tree", difficulty: "Easy", topic: "trees", description: "Invert a binary tree (mirror it).", examples: "Input: [4,2,7,1,3,6,9]\nOutput: [4,7,2,9,6,3,1]" },
  { id: "tree3", title: "Lowest Common Ancestor", difficulty: "Medium", topic: "trees", description: "Find the lowest common ancestor of two nodes in a BST.", examples: "Input: root=[6,2,8], p=2, q=8\nOutput: 6" },
  { id: "graph1", title: "Number of Islands", difficulty: "Medium", topic: "graphs", description: "Count the number of islands in a 2D grid of '1's and '0's.", examples: "Input: 2D grid\nOutput: count" },
  { id: "graph2", title: "Clone Graph", difficulty: "Medium", topic: "graphs", description: "Deep clone a connected undirected graph.", examples: "Input: adjacency list\nOutput: cloned graph" },
  { id: "dp1", title: "Climbing Stairs", difficulty: "Easy", topic: "dp", description: "Count ways to climb n stairs taking 1 or 2 steps.", examples: "Input: n=5\nOutput: 8" },
  { id: "dp2", title: "Coin Change", difficulty: "Medium", topic: "dp", description: "Find the minimum number of coins to make up the amount.", examples: "Input: coins=[1,5,11], amount=15\nOutput: 3" },
  { id: "dp3", title: "Longest Common Subsequence", difficulty: "Medium", topic: "dp", description: "Find the LCS length of two strings.", examples: "Input: 'abcde', 'ace'\nOutput: 3" },
  { id: "bfs1", title: "Binary Tree Level Order", difficulty: "Medium", topic: "bfsdfs", description: "Return level-order traversal of binary tree.", examples: "Input: [3,9,20,null,null,15,7]\nOutput: [[3],[9,20],[15,7]]" },
  { id: "bfs2", title: "Word Ladder", difficulty: "Hard", topic: "bfsdfs", description: "Find shortest transformation from beginWord to endWord.", examples: "Input: 'hit' → 'cog'\nOutput: 5" },
];

const TOPICS = ["All", "arrays", "strings", "trees", "graphs", "dp", "bfsdfs"];
const DIFF_COLOR_FN = (c: ColorPalette) => ({ Easy: c.accentGreen, Medium: c.accentOrange, Hard: c.accentRed });

const getStyles = (c: ColorPalette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  topicRow: { gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  topicChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  topicChipActive: { backgroundColor: c.accent, borderColor: c.accent },
  topicChipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: c.textSecondary },
  topicChipTextActive: { color: c.isDark ? c.background : "#FFFFFF" },
  progressBar: { height: 3, backgroundColor: c.border, marginHorizontal: 16, marginBottom: 14, borderRadius: 2 },
  list: { paddingHorizontal: 16, paddingTop: 4 },
  card: { backgroundColor: c.surface, borderRadius: 14, padding: 14 },
  cardSolved: { opacity: 0.6 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: c.border, alignItems: "center", justifyContent: "center" },
  checkCircleDone: { backgroundColor: c.accentGreen, borderColor: c.accentGreen },
  cardInfo: { flex: 1 },
  cardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: c.text },
  cardTitleDone: { textDecorationLine: "line-through", color: c.textSecondary },
  cardMeta: { flexDirection: "row", gap: 8, marginTop: 3 },
  topicTag: { fontFamily: "Inter_400Regular", fontSize: 10, color: c.textMuted },
  bodyDivider: { height: 1, backgroundColor: c.border, marginVertical: 12 },
  descText: { fontFamily: "Inter_400Regular", fontSize: 13, color: c.textSecondary, lineHeight: 19, marginBottom: 12 },
  exampleBox: { backgroundColor: c.background, borderRadius: 8, padding: 12, marginBottom: 12 },
  exampleLabel: { fontFamily: "Inter_600SemiBold", fontSize: 10, color: c.textMuted, textTransform: "uppercase", marginBottom: 4 },
  exampleText: { fontFamily: "Inter_400Regular", fontSize: 12, color: c.text, lineHeight: 18 },
  actionsRow: { flexDirection: "row", gap: 10 },
  hintBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: `${c.accentOrange}18`, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  hintBtnText: { fontFamily: "Inter_500Medium", fontSize: 12, color: c.accentOrange },
  solveBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: `${c.accentGreen}18`, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  solveBtnText: { fontFamily: "Inter_500Medium", fontSize: 12, color: c.accentGreen },
  hintBox: { marginTop: 10, backgroundColor: `${c.accentOrange}10`, borderRadius: 8, padding: 10 },
  hintText: { fontFamily: "Inter_400Regular", fontSize: 12, color: c.accentOrange, lineHeight: 18 },
});

function ProblemCard({ problem, solved, onSolve, colors }: { problem: Problem; solved: boolean; onSolve: () => void; colors: ColorPalette }) {
  const [expanded, setExpanded] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const styles = useMemo(() => getStyles(colors), [colors]);
  const diffColors = DIFF_COLOR_FN(colors);

  const fetchHint = async () => {
    setLoadingHint(true);
    try {
      const res = await apiRequest("GET", `/api/problems/${problem.id}/hint`);
      const data = await res.json();
      setHint(data.hint);
    } catch {
      setHint("Try breaking the problem into smaller subproblems.");
    } finally {
      setLoadingHint(false);
    }
  };

  return (
    <View style={[styles.card, solved && styles.cardSolved]}>
      <Pressable onPress={() => setExpanded(!expanded)}>
        <View style={styles.cardHeader}>
          <View style={styles.cardLeft}>
            <Pressable style={[styles.checkCircle, solved && styles.checkCircleDone]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSolve(); }}>
              {solved && <Ionicons name="checkmark" size={14} color="#fff" />}
            </Pressable>
            <View style={styles.cardInfo}>
              <Text style={[styles.cardTitle, solved && styles.cardTitleDone]}>{problem.title}</Text>
              <View style={styles.cardMeta}>
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, color: diffColors[problem.difficulty] }}>{problem.difficulty}</Text>
                <Text style={styles.topicTag}>{problem.topic}</Text>
              </View>
            </View>
          </View>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
        </View>
      </Pressable>
      {expanded && (
        <View>
          <View style={styles.bodyDivider} />
          <Text style={styles.descText}>{problem.description}</Text>
          <View style={styles.exampleBox}>
            <Text style={styles.exampleLabel}>Example</Text>
            <Text style={styles.exampleText}>{problem.examples}</Text>
          </View>
          <View style={styles.actionsRow}>
            <Pressable style={styles.hintBtn} onPress={() => { if (!hint) fetchHint(); }} disabled={loadingHint}>
              <Ionicons name="bulb-outline" size={14} color={colors.accentOrange} />
              <Text style={styles.hintBtnText}>{loadingHint ? "Loading..." : hint ? "Hint loaded" : "Get Hint"}</Text>
            </Pressable>
            {!solved && (
              <Pressable style={styles.solveBtn} onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); onSolve(); }}>
                <Ionicons name="checkmark-circle" size={14} color={colors.accentGreen} />
                <Text style={styles.solveBtnText}>Mark Solved</Text>
              </Pressable>
            )}
          </View>
          {hint && <View style={styles.hintBox}><Text style={styles.hintText}>{hint}</Text></View>}
        </View>
      )}
    </View>
  );
}

export default function PracticeScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { profile, markProblemSolved } = useUser();
  const [activeTopic, setActiveTopic] = useState("All");
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = activeTopic === "All" ? PROBLEMS : PROBLEMS.filter(p => p.topic === activeTopic);
  const solvedCount = PROBLEMS.filter(p => profile.problemsSolved.includes(p.id)).length;

  return (
    <View style={styles.container}>
      <ScreenHeader title="DSA Practice" subtitle={`${solvedCount}/${PROBLEMS.length} solved`} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.topicRow}>
        {TOPICS.map((t) => (
          <Pressable
            key={t}
            style={[styles.topicChip, activeTopic === t && styles.topicChipActive]}
            onPress={() => { setActiveTopic(t); Haptics.selectionAsync(); }}
          >
            <Text style={[styles.topicChipText, activeTopic === t && styles.topicChipTextActive]}>
              {t === "All" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.progressBar}>
        <View style={{ height: 3, width: `${(solvedCount / PROBLEMS.length) * 100}%`, backgroundColor: colors.accentGreen, borderRadius: 2 }} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <ProblemCard
            problem={item}
            solved={profile.problemsSolved.includes(item.id)}
            onSolve={() => markProblemSolved(item.id, item.topic)}
            colors={colors}
          />
        )}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 20 }]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </View>
  );
}
