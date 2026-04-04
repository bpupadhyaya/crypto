import { fonts } from '../utils/theme';
/**
 * Pie Chart — Shows token allocation as a donut chart.
 * Pure React Native + SVG, no heavy chart library.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

interface PieSlice {
  label: string;
  value: number; // percentage 0-100
  color: string;
}

interface PieChartProps {
  slices: PieSlice[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}

export const PieChart = React.memo(({ slices, size = 160, centerLabel, centerValue }: PieChartProps) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const strokeWidth = 20;

  // Filter out zero slices and calculate offsets
  const validSlices = slices.filter((s) => s.value > 0);
  let accumulated = 0;

  return (
    <View style={[s.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={center} cy={center} r={radius}
          stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} fill="none"
        />
        {/* Slices */}
        <G rotation="-90" origin={`${center}, ${center}`}>
          {validSlices.map((slice, i) => {
            const dashLength = (slice.value / 100) * circumference;
            const dashGap = circumference - dashLength;
            const offset = -(accumulated / 100) * circumference;
            accumulated += slice.value;

            return (
              <Circle
                key={slice.label}
                cx={center} cy={center} r={radius}
                stroke={slice.color} strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${dashLength} ${dashGap}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            );
          })}
        </G>
      </Svg>
      {/* Center text */}
      <View style={s.centerText}>
        {centerLabel && <Text style={{ color: '#a0a0b0', fontSize: fonts.xs }}>{centerLabel}</Text>}
        {centerValue && <Text style={{ color: '#f0f0f5', fontSize: fonts.xl, fontWeight: fonts.heavy as any, marginTop: 2 }}>{centerValue}</Text>}
      </View>
    </View>
  );
});

const s = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  centerText: { position: 'absolute', alignItems: 'center' },
  centerLabel: { color: '#a0a0b0', fontSize: fonts.xs },
  centerValue: { color: '#f0f0f5', fontSize: fonts.xl, fontWeight: fonts.heavy, marginTop: 2 },
});
