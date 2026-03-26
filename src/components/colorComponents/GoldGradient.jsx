import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet } from "react-native";

export default function BlackGradient({ children, style }) {
    return (
        <LinearGradient
            colors={['#C9B259', '#6A5500']}
            locations={[0, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, style]}
        >
            {children}
        </LinearGradient>
    );
}