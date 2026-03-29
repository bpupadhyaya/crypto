/**
 * Reusable animation utilities for smooth UI transitions.
 */

import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Fade in — for screen transitions and element reveals.
 */
export function fadeIn(
  value: Animated.Value,
  duration: number = 400,
): Animated.CompositeAnimation {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
}

/**
 * Fade out — reverse of fadeIn.
 */
export function fadeOut(
  value: Animated.Value,
  duration: number = 300,
): Animated.CompositeAnimation {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    easing: Easing.in(Easing.cubic),
    useNativeDriver: true,
  });
}

/**
 * Slide up — for modals, bottom sheets, and cards entering from below.
 */
export function slideUp(
  value: Animated.Value,
  duration: number = 350,
): Animated.CompositeAnimation {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
}

/**
 * Scale bounce — for button press feedback and emphasis animations.
 */
export function scaleBounce(
  value: Animated.Value,
): Animated.CompositeAnimation {
  return Animated.sequence([
    Animated.timing(value, {
      toValue: 0.92,
      duration: 80,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }),
    Animated.spring(value, {
      toValue: 1,
      friction: 4,
      tension: 300,
      useNativeDriver: true,
    }),
  ]);
}

/**
 * Hook: animated number that smoothly transitions to a target value.
 * Returns an Animated.Value that can be used with Animated.Text.
 */
export function useAnimatedNumber(
  targetValue: number,
  duration: number = 600,
): Animated.Value {
  const animRef = useRef(new Animated.Value(targetValue));
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      animRef.current.setValue(targetValue);
      return;
    }
    Animated.timing(animRef.current, {
      toValue: targetValue,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // cannot use native driver for value interpolation
    }).start();
  }, [targetValue, duration]);

  return animRef.current;
}

/**
 * Stagger children — for list items appearing one by one.
 */
export function staggerIn(
  values: Animated.Value[],
  staggerDelay: number = 60,
): Animated.CompositeAnimation {
  return Animated.stagger(
    staggerDelay,
    values.map((v) =>
      Animated.timing(v, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ),
  );
}
