import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';

const Dotted = ({ children }) => {
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent',}}>
      {/* 1. The SVG Pattern Layer */}
      <Svg style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id="dotPattern"
            width="10"   // Spacing between dots
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <Circle cx="2" cy="2" r="1" fill="#CCCCCC" opacity={0.08}/>
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#dotPattern)" />
      </Svg>

      {/* 2. Your Content Layer */}
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </View>
  );
};

export default Dotted;
