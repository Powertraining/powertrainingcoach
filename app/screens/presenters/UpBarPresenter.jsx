// src/reactjs/UpBarPresenter.jsx
import { observer } from "mobx-react-lite";
import { useRouter } from "expo-router";
import { UpBarView } from "../screens/UpBarView.jsx";

const UpBar = observer(function UpBar(props) {
    const model = props.model;
    const isAuthenticated = model.user;
    const router = useRouter();

    function openMenuACB() {
        console.log("Open profile navigation module");
    }

    function handleLogoClickACB() {
        // If training plan exists, navigate to overview; otherwise go home
        if (model.trainingPlan) {
            router.push("/app/overview");
        } else {
            router.push("/app");
        }
    }

    return (
        <UpBarView
            isAuthenticated={isAuthenticated}
            onOpenMenu={openMenuACB}
            onLogoClick={handleLogoClickACB}
        />
    );
});

export { UpBar };
