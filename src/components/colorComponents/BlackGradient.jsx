import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

export default function BlackGradient({ children, style }) {
    return (
        <LinearGradient
            colors={['#1c1c1c', '#000000', '#000000', '#1c1c1c']}
            locations={[0, 0.5, 0.6, 1]}
            start={{ x: -0.3, y: 1.3 }}
            end={{ x: 1.3, y: -0.3 }}
            style={[StyleSheet.absoluteFill, style]}
        >
            {children}
        </LinearGradient>
    );
}