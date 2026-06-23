import { useTheme } from "tamagui";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";

export interface ChartPoint {
  label: string;
  value: number;
  /** out-of-range emphasis color; defaults to primary */
  color?: string;
}

/**
 * Deltalab area/line chart. Normal zone = green-soft band with dashed green edges;
 * area fill = primary @10%; line = primary; dots = surface fill + status-color stroke.
 * Mirrors buildChart() in the Deltalab prototype. Pure SVG -> works on web + native.
 */
export function LineChart({
  points,
  low,
  high,
  height = 170,
  width = 520,
  type = "area",
  axis = true,
}: {
  points: ChartPoint[];
  low?: number;
  high?: number;
  height?: number;
  width?: number;
  type?: "area" | "line";
  axis?: boolean;
}) {
  const t = useTheme();
  const v = (k: string, fb: string) => ((t as any)[k]?.val as string) ?? fb;
  const primary = v("primary", "#0b4ea0");
  const green = v("good", "#1f9d6b");
  const greenSoft = v("goodSoft", "#e2f4ec");
  const surface = v("surface", "#ffffff");
  const text3 = v("text3", "#7c8b9e");

  if (!points.length) return null;

  const vals = points.map((p) => p.value).concat([low, high].filter((x): x is number => x != null));
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  const span = max - min || 1;
  min -= span * 0.22;
  max += span * 0.22;

  const pad = { l: 8, r: 8, t: 14, b: axis ? 26 : 10 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const X = (i: number) => (points.length <= 1 ? pad.l + iw / 2 : pad.l + (iw * i) / (points.length - 1));
  const Y = (val: number) => pad.t + ih * (1 - (val - min) / (max - min));

  const zTop = high != null ? Y(high) : pad.t;
  const zBot = low != null ? Y(low) : pad.t + ih;
  const pts = points.map((d, i) => [X(i), Y(d.value)] as const);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${(pad.t + ih).toFixed(1)} L ${pts[0][0].toFixed(1)} ${(pad.t + ih).toFixed(1)} Z`;

  return (
    <Svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="xMidYMid meet">
      <Rect x={pad.l} y={zTop} width={iw} height={Math.max(0, zBot - zTop)} fill={greenSoft} opacity={0.7} />
      {high != null && (
        <Line x1={pad.l} y1={zTop} x2={pad.l + iw} y2={zTop} stroke={green} strokeWidth={1} strokeDasharray="3 4" opacity={0.55} />
      )}
      {low != null && (
        <Line x1={pad.l} y1={zBot} x2={pad.l + iw} y2={zBot} stroke={green} strokeWidth={1} strokeDasharray="3 4" opacity={0.55} />
      )}
      {type === "area" && <Path d={area} fill={primary} opacity={0.1} />}
      <Path d={line} fill="none" stroke={primary} strokeWidth={2.4} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((d, i) => (
        <Circle key={i} cx={pts[i][0]} cy={pts[i][1]} r={4} fill={surface} stroke={d.color ?? primary} strokeWidth={2.4} />
      ))}
      {axis &&
        points.map((d, i) =>
          points.length > 7 && i % 2 ? null : (
            <SvgText key={`x${i}`} x={X(i)} y={height - 7} fontSize={11} fill={text3} textAnchor="middle" fontFamily="IBMPlexSans_400Regular">
              {d.label}
            </SvgText>
          ),
        )}
    </Svg>
  );
}
