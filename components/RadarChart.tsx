import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Polygon, Circle, Line, Text as SvgText } from "react-native-svg";
import type { ColorPalette } from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import type { SkillProgress } from "@/contexts/UserContext";

const SKILLS = [
  { key: "arrays", label: "Arrays" },
  { key: "trees", label: "Trees" },
  { key: "graphs", label: "Graphs" },
  { key: "dp", label: "DP" },
  { key: "strings", label: "Strings" },
  { key: "bfsdfs", label: "BFS/DFS" },
] as const;

interface RadarChartProps {
  skills: SkillProgress;
  size?: number;
}

export function RadarChart({ skills, size = 200 }: RadarChartProps) {
  const { colors } = useTheme();
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35;
  const n = SKILLS.length;

  const getPoint = (index: number, r: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const dataPoints = SKILLS.map((skill, i) => {
    const value = (skills[skill.key] / 100) * radius;
    return getPoint(i, Math.max(4, value));
  });

  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <View>
      <Svg width={size} height={size}>
        {gridLevels.map((level, li) => {
          const pts = SKILLS.map((_, i) => getPoint(i, radius * level));
          const polygon = pts.map((p) => `${p.x},${p.y}`).join(" ");
          return (
            <Polygon key={li} points={polygon} fill="transparent" stroke={colors.border} strokeWidth={1} />
          );
        })}
        {SKILLS.map((_, i) => {
          const outerPt = getPoint(i, radius);
          return <Line key={i} x1={cx} y1={cy} x2={outerPt.x} y2={outerPt.y} stroke={colors.border} strokeWidth={1} />;
        })}
        <Polygon
          points={dataPolygon}
          fill={colors.isDark ? "rgba(0,212,255,0.15)" : "rgba(0,153,187,0.12)"}
          stroke={colors.accent}
          strokeWidth={2}
        />
        {dataPoints.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={colors.accent} />
        ))}
        {SKILLS.map((skill, i) => {
          const pt = getPoint(i, radius + 18);
          return (
            <SvgText
              key={i}
              x={pt.x}
              y={pt.y}
              textAnchor="middle"
              alignmentBaseline="middle"
              fill={colors.textSecondary}
              fontSize={9}
              fontWeight="600"
            >
              {skill.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
