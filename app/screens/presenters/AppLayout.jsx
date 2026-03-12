import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { View, StyleSheet } from "react-native";
import { UpBar } from "./UpBarPresenter.jsx";
import LoadingView from "../screens/LoadingView.jsx";

const AppLayout = observer(function AppLayout(props) {
    const model = props.model;

    // Start the background date change detector when app mounts
    useEffect(() => {
        model.startDateChangeDetector();

        // Clean up: stop the detector when app unmounts
        return () => {
            model.stopDateChangeDetector();
        };
    }, [model]);

    const isGeneratingPlan = model.trainingPlanPromiseState.promise && !model.trainingPlanPromiseState.data && !model.trainingPlanPromiseState.error;
    const isLoading = !model.ready || isGeneratingPlan;

    return (
        <View style={styles.container}>
            {isLoading && <LoadingView />}

            <View style={styles.sideBar}>
                <UpBar model={model} />
            </View>
            <View style={styles.mainContent}>
                {/* Expo Router will handle the route rendering */}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    sideBar: {
        width: '20%',
    },
    mainContent: {
        flex: 1,
    },
});

export { AppLayout };