import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';

const DOT_SPACING = 10;
const DOT_CENTER = DOT_SPACING / 2;
const DOT_RADIUS = 1;
const DOT_COLOR = "#CCCCCC";
const DOT_OPACITY = 0.07;

const Dotted = ({ children }) => {
  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.dotLayer}>
        <Svg
          width="100%"
          height="100%"
          style={StyleSheet.absoluteFill}
        >
          <Defs>
            <Pattern
              id="dotPattern"
              width={DOT_SPACING}
              height={DOT_SPACING}
              x="0"
              y="0"
              patternUnits="userSpaceOnUse"
            >
              <Circle
                cx={DOT_CENTER}
                cy={DOT_CENTER}
                r={DOT_RADIUS}
                fill={DOT_COLOR}
                opacity={DOT_OPACITY}
              />
            </Pattern>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#dotPattern)" />
        </Svg>
      </View>

      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

export default Dotted;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dotLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
  },
});
