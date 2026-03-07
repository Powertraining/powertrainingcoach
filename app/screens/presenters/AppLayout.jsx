import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { UpBar } from "./UpBarPresenter.jsx";

import LoadingView from "../views/LoadingView.jsx";

const AppLayout = observer(function AppLayout(props) {
    const location = useLocation();
    const path = location.pathname;      // with createHashRouter, this is the actual path after the hash
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
        <div className="reactRoot">
            {isLoading && <LoadingView />}

            <div className="sideBar">
                <UpBar model={model} path={path} />
            </div>
            <div className="mainContent">
                <Outlet />   {/*the point where React Router "inserts" the current child route element*/}
            </div>
        </div>
    );
});

export { AppLayout };