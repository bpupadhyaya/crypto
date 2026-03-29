/**
 * Splash Screen — Shown during app initialization.
 * Displays the "OW" logo with a fade-in animation, then fades out
 * to reveal the main app once initialization completes.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { Animated, View, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  /** Called when the splash has fully faded out */
  onComplete: () => void;
  /** Minimum display time in ms (default 500) */
  minDisplayTime?: number;
}

export function SplashScreen({ onComplete, minDisplayTime = 500 }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  const animateOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1.1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => onComplete());
  }, [fadeAnim, logoScale, onComplete]);

  useEffect(() => {
    // Fade in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // After minimum display time, fade out
    const timer = setTimeout(animateOut, minDisplayTime);
    return () => clearTimeout(timer);
  }, [fadeAnim, logoScale, minDisplayTime, animateOut]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.View style={{ transform: [{ scale: logoScale }] }}>
        <View style={styles.logoContainer}>
          <Animated.Text style={styles.logoText}>OW</Animated.Text>
        </View>
        <Animated.Text style={styles.appName}>Open Wallet</Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 72,
    fontWeight: '900',
    color: '#22c55e',
    letterSpacing: 4,
    textAlign: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#22c55e',
    opacity: 0.7,
    marginTop: 12,
    textAlign: 'center',
    letterSpacing: 2,
  },
});
