import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ReviewIssue {
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  line?: number;
  fix?: string;
  recommendation?: string;
}

export interface ReviewSuggestion {
  type: "performance" | "readability" | "bestpractice" | "refactor";
  title: string;
  description: string;
  originalCode?: string;
  optimizedCode?: string;
}

export interface ReviewResult {
  scores: { quality: number; performance: number; security: number };
  summary: string;
  bugs: ReviewIssue[];
  securityIssues: ReviewIssue[];
  suggestions: ReviewSuggestion[];
  complexity: { level: "low" | "medium" | "high" | "very_high"; explanation: string };
}

export interface ReviewRecord {
  id: string;
  code: string;
  language: string;
  result: ReviewResult;
  createdAt: string;
}

interface ReviewHistoryContextValue {
  history: ReviewRecord[];
  addReview: (record: Omit<ReviewRecord, "id" | "createdAt">) => Promise<ReviewRecord>;
  deleteReview: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  isLoading: boolean;
}

const ReviewHistoryContext = createContext<ReviewHistoryContextValue | null>(null);

const STORAGE_KEY = "review_history";
const MAX_HISTORY = 50;

export function ReviewHistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<ReviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((data) => {
        if (data) setHistory(JSON.parse(data));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const saveHistory = async (records: ReviewRecord[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  };

  const addReview = async (record: Omit<ReviewRecord, "id" | "createdAt">): Promise<ReviewRecord> => {
    const newRecord: ReviewRecord = {
      ...record,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    const updated = [newRecord, ...history].slice(0, MAX_HISTORY);
    setHistory(updated);
    await saveHistory(updated);
    return newRecord;
  };

  const deleteReview = async (id: string) => {
    const updated = history.filter((r) => r.id !== id);
    setHistory(updated);
    await saveHistory(updated);
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ history, addReview, deleteReview, clearHistory, isLoading }),
    [history, isLoading]
  );

  return (
    <ReviewHistoryContext.Provider value={value}>
      {children}
    </ReviewHistoryContext.Provider>
  );
}

export function useReviewHistory() {
  const context = useContext(ReviewHistoryContext);
  if (!context) throw new Error("useReviewHistory must be used within ReviewHistoryProvider");
  return context;
}
