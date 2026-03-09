import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useReviewHistory } from "@/contexts/ReviewHistoryContext";
import { ScoreRing } from "@/components/ScoreRing";
import { IssueCard } from "@/components/IssueCard";
import { SuggestionCard } from "@/components/SuggestionCard";

type Tab = "overview" | "bugs" | "security" | "optimize";

const COMPLEXITY_COLORS: Record<string, string> = {
  low: Colors.dark.scoreGood,
  medium: Colors.dark.accentOrange,
  high: "#FF7043",
  very_high: Colors.dark.accentRed,
};

const COMPLEXITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  very_high: "Very High",
};

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { history } = useReviewHistory();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const record = useMemo(() => history.find((r) => r.id === id), [history, id]);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!record) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.dark.textMuted} />
          <Text style={styles.notFoundText}>Review not found</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const { result, language } = record;
  const { scores, summary, bugs, securityIssues, suggestions, complexity } = result;
  const avgScore = Math.round((scores.quality + scores.performance + scores.security) / 3);

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "bugs", label: "Bugs", count: bugs?.length },
    { id: "security", label: "Security", count: securityIssues?.length },
    { id: "optimize", label: "Optimize", count: suggestions?.length },
  ];

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.navBar}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backArrow}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.dark.text} />
        </Pressable>
        <Text style={styles.navTitle}>
          {language.charAt(0).toUpperCase() + language.slice(1)} Review
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.scoreHeader}>
        <View style={styles.avgScoreWrap}>
          <ScoreRing score={avgScore} label="Overall" size={90} />
        </View>
        <View style={styles.scoresRow}>
          <ScoreRing score={scores.quality} label="Quality" size={68} />
          <ScoreRing score={scores.performance} label="Speed" size={68} />
          <ScoreRing score={scores.security} label="Security" size={68} />
        </View>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.id}
            style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab(tab.id);
            }}
          >
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {tab.count !== undefined && tab.count > 0 && (
              <View style={[
                styles.tabBadge,
                { backgroundColor: tab.id === "bugs" ? Colors.dark.accentRed : tab.id === "security" ? Colors.dark.accentOrange : Colors.dark.accentGreen }
              ]}>
                <Text style={styles.tabBadgeText}>{tab.count}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "overview" && (
          <View>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <MaterialCommunityIcons name="robot-outline" size={16} color={Colors.dark.accent} />
                <Text style={styles.summaryTitle}>AI Summary</Text>
              </View>
              <Text style={styles.summaryText}>{summary}</Text>
            </View>

            {complexity && (
              <View style={styles.complexityCard}>
                <View style={styles.complexityHeader}>
                  <Text style={styles.cardTitle}>Complexity</Text>
                  <View style={[styles.complexityBadge, { backgroundColor: `${COMPLEXITY_COLORS[complexity.level]}20` }]}>
                    <Text style={[styles.complexityBadgeText, { color: COMPLEXITY_COLORS[complexity.level] }]}>
                      {COMPLEXITY_LABELS[complexity.level]}
                    </Text>
                  </View>
                </View>
                <Text style={styles.complexityText}>{complexity.explanation}</Text>
              </View>
            )}

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="bug-outline" size={20} color={Colors.dark.accentRed} />
                <Text style={styles.statNum}>{bugs?.length || 0}</Text>
                <Text style={styles.statLabel}>Bugs</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="shield-outline" size={20} color={Colors.dark.accentOrange} />
                <Text style={styles.statNum}>{securityIssues?.length || 0}</Text>
                <Text style={styles.statLabel}>Security</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="flash-outline" size={20} color={Colors.dark.accentGreen} />
                <Text style={styles.statNum}>{suggestions?.length || 0}</Text>
                <Text style={styles.statLabel}>Suggestions</Text>
              </View>
            </View>

            {bugs && bugs.length > 0 && (
              <Pressable
                style={styles.quickViewCard}
                onPress={() => setActiveTab("bugs")}
              >
                <View style={styles.quickViewLeft}>
                  <Ionicons name="bug" size={16} color={Colors.dark.accentRed} />
                  <Text style={styles.quickViewText}>
                    {bugs.length} bug{bugs.length !== 1 ? "s" : ""} detected
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.dark.textMuted} />
              </Pressable>
            )}

            {securityIssues && securityIssues.length > 0 && (
              <Pressable
                style={styles.quickViewCard}
                onPress={() => setActiveTab("security")}
              >
                <View style={styles.quickViewLeft}>
                  <Ionicons name="warning-outline" size={16} color={Colors.dark.accentOrange} />
                  <Text style={styles.quickViewText}>
                    {securityIssues.length} security issue{securityIssues.length !== 1 ? "s" : ""} found
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.dark.textMuted} />
              </Pressable>
            )}
          </View>
        )}

        {activeTab === "bugs" && (
          <View>
            {!bugs || bugs.length === 0 ? (
              <View style={styles.emptyTab}>
                <Ionicons name="checkmark-circle" size={40} color={Colors.dark.accentGreen} />
                <Text style={styles.emptyTabTitle}>No Bugs Found</Text>
                <Text style={styles.emptyTabText}>Your code looks clean!</Text>
              </View>
            ) : (
              bugs.map((bug, i) => (
                <IssueCard
                  key={i}
                  title={bug.title}
                  description={bug.description}
                  severity={bug.severity}
                  fix={bug.fix}
                  type="bug"
                />
              ))
            )}
          </View>
        )}

        {activeTab === "security" && (
          <View>
            {!securityIssues || securityIssues.length === 0 ? (
              <View style={styles.emptyTab}>
                <Ionicons name="shield-checkmark" size={40} color={Colors.dark.accentGreen} />
                <Text style={styles.emptyTabTitle}>No Security Issues</Text>
                <Text style={styles.emptyTabText}>Your code appears secure.</Text>
              </View>
            ) : (
              securityIssues.map((issue, i) => (
                <IssueCard
                  key={i}
                  title={issue.title}
                  description={issue.description}
                  severity={issue.severity}
                  recommendation={issue.recommendation}
                  type="security"
                />
              ))
            )}
          </View>
        )}

        {activeTab === "optimize" && (
          <View>
            {!suggestions || suggestions.length === 0 ? (
              <View style={styles.emptyTab}>
                <Ionicons name="rocket" size={40} color={Colors.dark.accentGreen} />
                <Text style={styles.emptyTabTitle}>Already Optimized</Text>
                <Text style={styles.emptyTabText}>No optimization suggestions.</Text>
              </View>
            ) : (
              suggestions.map((s, i) => (
                <SuggestionCard
                  key={i}
                  type={s.type}
                  title={s.title}
                  description={s.description}
                  originalCode={s.originalCode}
                  optimizedCode={s.optimizedCode}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backArrow: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dark.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.dark.text,
  },
  scoreHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.dark.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 16,
  },
  avgScoreWrap: {
    alignItems: "center",
  },
  scoresRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 6,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: Colors.dark.surface,
    gap: 4,
  },
  tabItemActive: {
    backgroundColor: Colors.dark.accent,
  },
  tabLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  tabLabelActive: {
    color: Colors.dark.background,
    fontFamily: "Inter_600SemiBold",
  },
  tabBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    color: Colors.dark.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  summaryCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.15)",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  summaryTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.dark.accent,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  summaryText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 21,
  },
  complexityCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  complexityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.dark.text,
  },
  complexityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  complexityBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  complexityText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 19,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  statNum: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.dark.text,
  },
  statLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  quickViewCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  quickViewLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quickViewText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.dark.text,
  },
  emptyTab: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 10,
  },
  emptyTabTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.dark.text,
  },
  emptyTabText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  backBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.dark.accent,
    borderRadius: 10,
  },
  backBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.dark.background,
  },
});
