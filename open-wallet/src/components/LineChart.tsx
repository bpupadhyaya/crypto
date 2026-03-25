/**
 * Simple line chart — SVG, no heavy chart library.
 * Shows price history as a smooth line with gradient fill.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polyline, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface LineChartProps {
  data: number[];
  width: number;
  height: number;
  color?: string;
}

export const LineChart = React.memo(({ data, width, height, color = '#22c55e' }: LineChartProps) => {
  if (data.length < 2) {
    return <View style={{ width, height, backgroundColor: '#16161f', borderRadius: 12 }} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  // Determine if price went up or down
  const isUp = data[data.length - 1] >= data[0];
  const lineColor = isUp ? color : '#ef4444';

  return (
    <View style={[s.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {/* Gradient fill under the line */}
        <Polyline
          points={points + ` ${width - padding},${height} ${padding},${height}`}
          fill="url(#gradient)"
          stroke="none"
        />
        {/* The line itself */}
        <Polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
});

const s = StyleSheet.create({
  container: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#16161f' },
});
