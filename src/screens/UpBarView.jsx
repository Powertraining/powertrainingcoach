import { View, TouchableOpacity, Image } from "react-native";
import logo from "../assets/logo.png";
import IBMPlexText from "../components/textComponents/IBMPlexText.jsx";
export function UpBarView(props) {
    const { isAuthenticated, isSubscribed, path, onLogoClick, onNavigate } = props;

    const isOnSignupPage = path === "/signup";
    const isOnMyProfilePage = path === "/myProfile";

    function handleLogoClickACB() {
        if (onLogoClick) onLogoClick();
        else onNavigate?.("/");
    }

    function handleRightButtonClickACB() {
        if (!isAuthenticated && !isOnSignupPage) {
            onNavigate?.("/signup");
            return;
        }
        if (isAuthenticated && isOnMyProfilePage) {
            onNavigate?.("/");
            return;
        }
        if (isAuthenticated && !isOnMyProfilePage) {
            onNavigate?.("/myProfile");
        }
    }

    let rightLabel = null;
    if (!isAuthenticated && !isOnSignupPage) rightLabel = "Sign Up/ Log In";
    else if (isAuthenticated && isOnMyProfilePage) rightLabel = "☰";
    else if (isAuthenticated && !isOnMyProfilePage) rightLabel = "👤";

    return (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <TouchableOpacity onPress={handleLogoClickACB}>
                <Image source={logo} style={{ width: 40, height: 40 }} />
            </TouchableOpacity>

            <IBMPlexText>Power Training Coach</IBMPlexText>

            <View>
                {rightLabel && (
                    <TouchableOpacity onPress={handleRightButtonClickACB}>
                        <IBMPlexText>{rightLabel}</IBMPlexText>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

// // src/views/UpBarView.jsx
// import logo from "../assets/logo.png";
// import { useNavigate } from "react-router-dom";

// export function UpBarView(props) {
//     const { isAuthenticated, isSubscribed, path, onLogoClick } = props;
//     const navigate = useNavigate();

//     const isOnSignupPage = path === "/signup";
//     const isOnMyProfilePage = path === "/myProfile";

//     function handleLogoClickACB() {
//         if (onLogoClick) onLogoClick();
//         else navigate("/");
//     }

//     function handleRightButtonClickACB() {
//         if (!isAuthenticated && !isOnSignupPage) {
//             navigate("/signup");
//             return;
//         }

//         if (isAuthenticated && isOnMyProfilePage) {
//             navigate("/");
//             return;
//         }

//         if (isAuthenticated && !isOnMyProfilePage) {
//             navigate("/myProfile");
//         }
//     }

//     let rightLabel = null;

//     if (!isAuthenticated && !isOnSignupPage) {
//         rightLabel = "Sign Up/ Log In";
//     } 
//     else if (isAuthenticated && isOnMyProfilePage) {
//         rightLabel = "☰";
//     }
//     else if (isAuthenticated && !isOnMyProfilePage) {
//         rightLabel = "👤";
//     }


//     return (
//         <header className="upbar">
//             <div className="upbar-left" onClick={handleLogoClickACB}>
//                 <img
//                     src={logo}
//                     alt="Power Training Coach logo"
//                     className="upbar-logo"
//                 />
//             </div>

//             <h1 className="upbar-title">Power Training Coach</h1>

//             <div className="upbar-right">
//                 {rightLabel && (
//                     <button
//                         className="upbar-button"
//                         type="button"
//                         onClick={handleRightButtonClickACB}
//                     >
//                         {rightLabel}
//                     </button>
//                 )}
//             </div>
//         </header>
//     );
// }
