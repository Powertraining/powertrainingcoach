import { View } from "react-native";

export default function QuestionnaireShell({ children, onLogoClick }) {
    return (
        <View style={{ flex: 1 }} >
            {children}
        </View>
    );
}

// export default function QuestionnaireShell({ children, onLogoClick }) {
//     return (
//         <div className="questionnaire-page">
//             <main className="questionnaire-main">{children}</main>
//         </div>
//     );
// }
