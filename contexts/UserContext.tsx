import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SkillProgress {
  arrays: number;
  trees: number;
  graphs: number;
  dp: number;
  strings: number;
  bfsdfs: number;
}

export interface UserProfile {
  name: string;
  email: string;
  isLoggedIn: boolean;
  avatar: string;
  problemsSolved: string[];
  quizScores: number[];
  codeAnalysisCount: number;
  interviewCount: number;
  skills: SkillProgress;
  joinDate: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  email: "",
  isLoggedIn: false,
  avatar: "",
  problemsSolved: [],
  quizScores: [],
  codeAnalysisCount: 0,
  interviewCount: 0,
  skills: { arrays: 0, trees: 0, graphs: 0, dp: 0, strings: 0, bfsdfs: 0 },
  joinDate: new Date().toISOString(),
};

interface UserContextValue {
  profile: UserProfile;
  isLoading: boolean;
  login: (name: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  markProblemSolved: (problemId: string, topic: keyof SkillProgress) => Promise<void>;
  addQuizScore: (score: number) => Promise<void>;
  incrementAnalysis: () => Promise<void>;
  incrementInterview: () => Promise<void>;
}

const USER_KEY = "user_profile_v2";
const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(USER_KEY).then((data) => {
      if (data) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(data) });
      setIsLoading(false);
    });
  }, []);

  const save = async (updated: UserProfile) => {
    setProfile(updated);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
  };

  const login = async (name: string, email: string) => {
    await save({ ...profile, name, email, isLoggedIn: true });
  };

  const logout = async () => {
    await save({ ...profile, isLoggedIn: false });
  };

  const markProblemSolved = async (problemId: string, topic: keyof SkillProgress) => {
    if (profile.problemsSolved.includes(problemId)) return;
    const updated = {
      ...profile,
      problemsSolved: [...profile.problemsSolved, problemId],
      skills: { ...profile.skills, [topic]: Math.min(100, profile.skills[topic] + 8) },
    };
    await save(updated);
  };

  const addQuizScore = async (score: number) => {
    await save({ ...profile, quizScores: [...profile.quizScores, score] });
  };

  const incrementAnalysis = async () => {
    await save({ ...profile, codeAnalysisCount: profile.codeAnalysisCount + 1 });
  };

  const incrementInterview = async () => {
    await save({ ...profile, interviewCount: profile.interviewCount + 1 });
  };

  const value = useMemo(() => ({
    profile, isLoading, login, logout, markProblemSolved,
    addQuizScore, incrementAnalysis, incrementInterview,
  }), [profile, isLoading]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
