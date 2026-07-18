import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

export const GOLD_GRADIENT_COLORS = ["#C9B259", "#6A5500"];
export const GOLD_GRADIENT_LOCATIONS = [0, 1];
export const GOLD_GRADIENT_START = { x: 0.4, y: 0 };
export const GOLD_GRADIENT_END = { x: 0.5, y: 1.4 };

export default function GoldGradient({ children, style }) {
    return (
        <LinearGradient
            pointerEvents="none"
            colors={GOLD_GRADIENT_COLORS}
            locations={GOLD_GRADIENT_LOCATIONS}
            start={GOLD_GRADIENT_START}
            end={GOLD_GRADIENT_END}
            style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, style]}
        >
            {children}
        </LinearGradient>
    );
}
