/**
 * MiniSparkline — Tiny 7-point line chart for token rows.
 * Uses Svg-free approach: renders as a series of thin View bars
 * simulating a sparkline without any native SVG dependency.
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

interface MiniSparklineProps {
  /** 7 data points representing the last 24h price trend */
  data: number[];
  /** Width of the sparkline container (default: 40) */
  width?: number;
  /** Height of the sparkline container (default: 20) */
  height?: number;
  /** Color of the sparkline */
  color: string;
}

export const MiniSparkline = React.memo(function MiniSparkline({
  data,
  width: w = 40,
  height: h = 20,
  color,
}: MiniSparklineProps) {
  const bars = useMemo(() => {
    if (!data || data.length === 0) return [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const barWidth = Math.max(2, (w - (data.length - 1) * 2) / data.length);

    return data.map((value, index) => {
      const normalized = (value - min) / range;
      const barHeight = Math.max(2, normalized * h);
      return {
        key: index,
        height: barHeight,
        marginTop: h - barHeight,
        width: barWidth,
        marginLeft: index === 0 ? 0 : 2,
      };
    });
  }, [data, w, h]);

  if (bars.length === 0) return null;

  return (
    <View style={[styles.container, { width: w, height: h }]}>
      {bars.map((bar) => (
        <View
          key={bar.key}
          style={{
            width: bar.width,
            height: bar.height,
            marginTop: bar.marginTop,
            marginLeft: bar.marginLeft,
            backgroundColor: color,
            borderRadius: 1,
            opacity: 0.6,
          }}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
});
