// src/reactjs/UpBarPresenter.jsx
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { UpBarView } from "/src/views/UpBarView.jsx";

const UpBar = observer(function UpBar(props) {
    const model = props.model;
    const path = props.path;
    const isAuthenticated = model.user;
    const navigate = useNavigate();

    function openMenuACB() {
        console.log("Open profile navigation module");
    }

    function handleLogoClickACB() {
        // If training plan exists, navigate to overview; otherwise go home
        if (model.trainingPlan) {
            window.location.hash = "#/overview";
        } else {
            // Signal AppPresenter to reset to start view
            window.dispatchEvent(new Event("app:go-home"));
            navigate("/");
        }
    }

    return (
        <UpBarView
            isAuthenticated={isAuthenticated}
            path={path}
            onOpenMenu={openMenuACB}
            onLogoClick={handleLogoClickACB}
        />
    );
});

export { UpBar };
