// src/views/UpBarView.jsx
import "/src/style.css";
import logo from "/src/assets/logo.png";
import { useNavigate } from "react-router-dom";

export function UpBarView(props) {
    const { isAuthenticated, isSubscribed, path, onLogoClick } = props;
    const navigate = useNavigate();

    const isOnSignupPage = path === "/signup";
    const isOnMyProfilePage = path === "/myProfile";

    function handleLogoClickACB() {
        if (onLogoClick) onLogoClick();
        else navigate("/");
    }

    function handleRightButtonClickACB() {
        if (!isAuthenticated && !isOnSignupPage) {
            navigate("/signup");
            return;
        }

        if (isAuthenticated && isOnMyProfilePage) {
            navigate("/");
            return;
        }

        if (isAuthenticated && !isOnMyProfilePage) {
            navigate("/myProfile");
        }
    }

    let rightLabel = null;

    if (!isAuthenticated && !isOnSignupPage) {
        rightLabel = "Sign Up/ Log In";
    } 
    else if (isAuthenticated && isOnMyProfilePage) {
        rightLabel = "☰";
    }
    else if (isAuthenticated && !isOnMyProfilePage) {
        rightLabel = "👤";
    }


    return (
        <header className="upbar">
            <div className="upbar-left" onClick={handleLogoClickACB}>
                <img
                    src={logo}
                    alt="Power Training Coach logo"
                    className="upbar-logo"
                />
            </div>

            <h1 className="upbar-title">Power Training Coach</h1>

            <div className="upbar-right">
                {rightLabel && (
                    <button
                        className="upbar-button"
                        type="button"
                        onClick={handleRightButtonClickACB}
                    >
                        {rightLabel}
                    </button>
                )}
            </div>
        </header>
    );
}
