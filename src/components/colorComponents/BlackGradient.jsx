import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

export default function BlackGradient({ children, style }) {
    return (
        <LinearGradient
            pointerEvents="none"
            colors={['#333333', '#000000', '#000000', '#333333']}
            locations={[0, 0.5, 0.6, 1]}
            start={{ x: -0.3, y: 1.3 }}
            end={{ x: 1.3, y: -0.1 }}
            style={[StyleSheet.absoluteFill, style]}
        >
            {children}
        </LinearGradient>
    );
}
