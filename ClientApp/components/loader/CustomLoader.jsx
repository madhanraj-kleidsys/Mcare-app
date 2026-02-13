import React, { useEffect } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Skia,
  useComputedValue,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  useAnimatedStyle,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIZE = 140;  
const STROKE_WIDTH = 12;
const CENTER = SIZE / 2;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;

const CustomLoader = ({ loading }) => {
  if (!loading) return null;

  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: 2000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true // auto-reverse
    );

    pulse.value = withRepeat(
      withTiming(1.08, {
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, []);

  // Animated arc path
  const animatedPath = useComputedValue(() => {
    const endAngle = progress.value * Math.PI * 2;
    const path = Skia.Path.Make();
    path.addArc(
      { x: CENTER - RADIUS, y: CENTER - RADIUS, width: RADIUS * 2, height: RADIUS * 2 },
      -Math.PI / 2, // start at top
      endAngle
    );
    return path;
  }, [progress]);

  // Rotate the dot position based on progress
  const dotTransform = useComputedValue(() => {
    const angle = progress.value * Math.PI * 2 - Math.PI / 2; // align with arc start
    const x = CENTER + RADIUS * Math.cos(angle);
    const y = CENTER + RADIUS * Math.sin(angle);
    return [{ translateX: x - CENTER }, { translateY: y - CENTER }];
  }, [progress]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        {
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        },
      ]}
    >
      <Animated.View style={pulseStyle}>
        <Canvas style={{ width: SIZE, height: SIZE }}>
          {/* Faint background ring */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            color="#ed1a3b33"
            style="stroke"
            strokeWidth={STROKE_WIDTH}
          />

          {/* Progress arc */}
          <Group>
            <Circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              color="#ed1a3b"
              style="stroke"
              strokeWidth={STROKE_WIDTH}
              strokeCap="round"
              path={animatedPath}
            />
          </Group>

          {/* Moving dot at end of arc */}
          <Circle
            cx={CENTER}
            cy={CENTER}
            r={STROKE_WIDTH * 0.7}
            color="#ed1a3b"
          >
            <useComputedValue value={dotTransform} />
          </Circle>
        </Canvas>
      </Animated.View>

      <Text
        style={{
          marginTop: 28,
          color: '#ed1a3b',
          fontSize: 18,
          fontWeight: 'bold',
          letterSpacing: 0.5,
        }}
      >
        Loading GA Morgan Dynamics...
      </Text>
    </View>
  );
};

export default CustomLoader;