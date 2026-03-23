// npx expo install @react-native-picker/picker

import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Picker } from "@react-native-picker/picker";
import QuestionnaireShell from "./QuestionnaireShell.jsx";

export default function InputFormView({
    onSubmit,
    onBack,
    useApi,
    onToggleUseApi,
    hasApiKey,
    subscription,
    daysRemaining,
    initialValues = {},
}) {
    const [goal, setGoal] = useState(initialValues.goal || "hypertrophy");
    const [experience, setExperience] = useState(initialValues.experience || "beginner");
    const [daysPerWeek, setDaysPerWeek] = useState(
        Number.parseInt(initialValues.daysPerWeek, 10) || 3
    );
    const [weightClass, setWeightClass] = useState(initialValues.weightClass || "");
    const [primaryStyle, setPrimaryStyle] = useState(initialValues.primaryStyle || "balanced");
    const [competitionPeriod, setCompetitionPeriod] = useState(
        initialValues.competitionPeriod || "off_season"
    );
    const [injuries, setInjuries] = useState(
        Array.isArray(initialValues.injuries)
            ? initialValues.injuries.join(", ")
            : initialValues.injuries || ""
    );
    const [equipmentAccess, setEquipmentAccess] = useState(
        initialValues.equipment || "full_gym"
    );
    const [focusEmphasis, setFocusEmphasis] = useState(
        initialValues.focusEmphasis ||
            initialValues.preferences?.[0] ||
            "mixed"
    );

    function handleSubmit() {
        const normalizedDaysPerWeek =
            Number.isFinite(daysPerWeek) && daysPerWeek > 0 ? daysPerWeek : 3;

        onSubmit({
            goal,
            experience,
            daysPerWeek: normalizedDaysPerWeek,
            weightClass,
            primaryStyle,
            competitionPeriod,
            equipment: equipmentAccess,
            injuries: injuries ? injuries.split(",").map((s) => s.trim()).filter(Boolean) : [],
            preferences: [focusEmphasis].filter(Boolean)
        });
    }

    return (
        <QuestionnaireShell>
            <ScrollView contentContainerStyle={styles.center}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Training Preferences</Text>
                        <Text style={styles.subtitle}>Fine-tune goal, experience, and schedule before we generate your plan.</Text>
                    </View>

                    <View style={styles.form}>
                        {!subscription && (
                            <View style={styles.subscriptionAlert}>
                                <Text style={styles.alertText}>📋 Subscription Required{"\n"}You need an active subscription to generate training plans.</Text>
                                <TouchableOpacity onPress={handleSubmit} style={styles.subscribeButton}>
                                    <Text style={styles.subscribeButtonText}>Subscribe & Generate</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {subscription && (
                            <View style={styles.subscriptionActive}>
                                <Text style={styles.activeText}>✅ Subscription Active ({daysRemaining} days remaining)</Text>
                            </View>
                        )}

                        <View style={styles.field}>
                            <Text style={styles.label}>Weight class</Text>
                            <TextInput
                                placeholder="e.g. -70 kg / Lightweight"
                                value={weightClass}
                                onChangeText={setWeightClass}
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Primary style focus</Text>
                            <Picker selectedValue={primaryStyle} onValueChange={setPrimaryStyle} style={styles.input}>
                                <Picker.Item label="Balanced (striking & grappling)" value="balanced" />
                                <Picker.Item label="Striking-heavy" value="striking" />
                                <Picker.Item label="Grappling-heavy" value="grappling" />
                                <Picker.Item label="Clinching & throws" value="clinching" />
                            </Picker>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Competition period</Text>
                            <Picker selectedValue={competitionPeriod} onValueChange={setCompetitionPeriod} style={styles.input}>
                                <Picker.Item label="Off-season / general prep" value="off_season" />
                                <Picker.Item label="Pre-season (4-8 weeks out)" value="pre_season" />
                                <Picker.Item label="Fight camp (1-4 weeks out)" value="fight_camp" />
                                <Picker.Item label="In-season / frequent bouts" value="in_season" />
                            </Picker>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Injuries / weaknesses</Text>
                            <TextInput
                                placeholder="e.g. sore shoulder, weak left kick, knee rehab"
                                value={injuries}
                                onChangeText={setInjuries}
                                multiline
                                numberOfLines={3}
                                style={styles.textarea}
                            />
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Equipment access</Text>
                            <Picker selectedValue={equipmentAccess} onValueChange={setEquipmentAccess} style={styles.input}>
                                <Picker.Item label="Full gym + bags/mats" value="full_gym" />
                                <Picker.Item label="Home setup (bands/dumbbells)" value="home_minimal" />
                                <Picker.Item label="Bodyweight + roadwork" value="bodyweight_only" />
                            </Picker>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Focus emphasis</Text>
                            <Picker selectedValue={focusEmphasis} onValueChange={setFocusEmphasis} style={styles.input}>
                                <Picker.Item label="Mixed (sparring/technique + conditioning)" value="mixed" />
                                <Picker.Item label="Heavier on sparring/technique" value="more_sparring" />
                                <Picker.Item label="Heavier on conditioning/strength" value="more_conditioning" />
                            </Picker>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Goal</Text>
                            <Picker selectedValue={goal} onValueChange={setGoal} style={styles.input}>
                                <Picker.Item label="Hypertrophy" value="hypertrophy" />
                                <Picker.Item label="Strength" value="strength" />
                                <Picker.Item label="Power / Speed" value="power" />
                            </Picker>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Experience</Text>
                            <Picker selectedValue={experience} onValueChange={setExperience} style={styles.input}>
                                <Picker.Item label="Beginner" value="beginner" />
                                <Picker.Item label="Intermediate" value="intermediate" />
                                <Picker.Item label="Advanced" value="advanced" />
                            </Picker>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>Days per week</Text>
                            <TextInput
                                keyboardType="numeric"
                                value={daysPerWeek > 0 ? String(daysPerWeek) : ""}
                                onChangeText={(v) => {
                                    const parsedValue = Number.parseInt(v, 10);
                                    setDaysPerWeek(Number.isFinite(parsedValue) ? parsedValue : 0);
                                }}
                                style={styles.input}
                            />
                        </View>

                        <View style={styles.actions}>
                            {onBack && (
                                <TouchableOpacity onPress={onBack} style={styles.secondaryButton}>
                                    <Text style={styles.secondaryButtonText}>Back</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                onPress={handleSubmit}
                                style={styles.primaryButton}
                            >
                                <Text style={styles.primaryButtonText}>
                                    {subscription ? "Generate My Plan" : "Subscribe & Generate Plan"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </QuestionnaireShell>
    );
}

const styles = StyleSheet.create({
    center: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
    card: {
        width: "100%",
        maxWidth: 900,
        padding: 26,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.08)",
        backgroundColor: "white",
        gap: 14,
    },
    header: { gap: 6 },
    title: { fontSize: 30, fontWeight: "700" },
    subtitle: { fontSize: 17, opacity: 0.8, lineHeight: 25 },
    form: { gap: 14, marginTop: 4 },
    field: { gap: 6 },
    label: { fontSize: 15, fontWeight: "600", color: "#111" },
    input: {
        height: 46,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.18)",
        paddingHorizontal: 12,
        fontSize: 16,
        backgroundColor: "#f8f8f8",
    },
    textarea: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.18)",
        padding: 10,
        fontSize: 16,
        backgroundColor: "#f8f8f8",
    },
    subscriptionAlert: {
        padding: 16,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#ef4444",
        backgroundColor: "#fee2e2",
        gap: 12,
    },
    alertText: { fontSize: 14, color: "#991b1b", lineHeight: 22 },
    subscribeButton: {
        padding: 10,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: "#ef4444",
        backgroundColor: "#ef4444",
        alignSelf: "flex-start",
    },
    subscribeButtonText: { color: "white", fontWeight: "600", fontSize: 14 },
    subscriptionActive: {
        padding: 16,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#10b981",
        backgroundColor: "#ecfdf5",
    },
    activeText: { fontSize: 14, color: "#065f46", lineHeight: 22 },
    actions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4, gap: 12, flexWrap: "wrap" },
    primaryButton: {
        paddingVertical: 12,
        paddingHorizontal: 22,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#111",
        backgroundColor: "#111",
    },
    primaryButtonText: { color: "white", fontSize: 18 },
    secondaryButton: {
        paddingVertical: 12,
        paddingHorizontal: 22,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: "#111",
    },
    secondaryButtonText: { color: "#111", fontSize: 18 },
});

// import { useState } from "react";
// import QuestionnaireShell from "./QuestionnaireShell.jsx";

// export default function InputFormView({ onSubmit, onBack, useApi, onToggleUseApi, hasApiKey, subscription, daysRemaining, onPaymentClick }) {
//     const [goal, setGoal] = useState("hypertrophy");
//     const [experience, setExperience] = useState("beginner");
//     const [daysPerWeek, setDaysPerWeek] = useState(3);
//     const [weightClass, setWeightClass] = useState("");
//     const [primaryStyle, setPrimaryStyle] = useState("balanced");
//     const [competitionPeriod, setCompetitionPeriod] = useState("off_season");
//     const [injuries, setInjuries] = useState("");
//     const [equipmentAccess, setEquipmentAccess] = useState("full_gym");
//     const [focusEmphasis, setFocusEmphasis] = useState("mixed");

//     function handleSubmit(e) {
//         e.preventDefault();
        
//         // Check if subscription is required and active
//         if (!subscription) {
//             alert("You need an active subscription to generate a training plan. Please subscribe first.");
//             onPaymentClick?.();
//             return;
//         }
        
//         onSubmit({
//             goal,
//             experience,
//             daysPerWeek,
//             weightClass,
//             primaryStyle,
//             competitionPeriod,
//             equipment: equipmentAccess,
//             injuries: injuries ? injuries.split(",").map((s) => s.trim()).filter(Boolean) : [],
//             preferences: [focusEmphasis].filter(Boolean)
//         });
//     }

//     return (
//         <QuestionnaireShell>
//             <div style={styles.center}>
//                 <div style={styles.card}>
//                     <div style={styles.header}>
//                         <h2 style={styles.title}>Training Preferences</h2>
//                         <p style={styles.subtitle}>Fine-tune goal, experience, and schedule before we generate your plan.</p>
//                     </div>

//                     <form onSubmit={handleSubmit} style={styles.form}>
//                         {!subscription && (
//                             <div style={styles.subscriptionAlert}>
//                                 <p style={styles.alertText}>
//                                     📋 <strong>Subscription Required</strong><br />
//                                     You need an active subscription to generate training plans.
//                                 </p>
//                                 <button 
//                                     type="button" 
//                                     onClick={onPaymentClick}
//                                     style={styles.subscribeButton}
//                                 >
//                                     Subscribe Now
//                                 </button>
//                             </div>
//                         )}
                        
//                         {subscription && (
//                             <div style={styles.subscriptionActive}>
//                                 <p style={styles.activeText}>
//                                     ✅ <strong>Subscription Active</strong> ({daysRemaining} days remaining)
//                                 </p>
//                             </div>
//                         )}
//                         <label style={styles.field}>
//                             <span style={styles.label}>Weight class</span>
//                             <input
//                                 type="text"
//                                 placeholder="e.g. -70 kg / Lightweight"
//                                 value={weightClass}
//                                 onChange={e => setWeightClass(e.target.value)}
//                                 style={styles.input}
//                             />
//                         </label>

//                         <label style={styles.field}>
//                             <span style={styles.label}>Primary style focus</span>
//                             <select
//                                 value={primaryStyle}
//                                 onChange={e => setPrimaryStyle(e.target.value)}
//                                 style={styles.input}
//                             >
//                                 <option value="balanced">Balanced (striking & grappling)</option>
//                                 <option value="striking">Striking-heavy</option>
//                                 <option value="grappling">Grappling-heavy</option>
//                                 <option value="clinching">Clinching & throws</option>
//                             </select>
//                         </label>

//                         <label style={styles.field}>
//                             <span style={styles.label}>Competition period</span>
//                             <select
//                                 value={competitionPeriod}
//                                 onChange={e => setCompetitionPeriod(e.target.value)}
//                                 style={styles.input}
//                             >
//                                 <option value="off_season">Off-season / general prep</option>
//                                 <option value="pre_season">Pre-season (4-8 weeks out)</option>
//                                 <option value="fight_camp">Fight camp (1-4 weeks out)</option>
//                                 <option value="in_season">In-season / frequent bouts</option>
//                             </select>
//                         </label>

//                         <label style={styles.field}>
//                             <span style={styles.label}>Injuries / weaknesses</span>
//                             <textarea
//                                 placeholder="e.g. sore shoulder, weak left kick, knee rehab"
//                                 value={injuries}
//                                 onChange={e => setInjuries(e.target.value)}
//                                 style={styles.textarea}
//                                 rows={3}
//                             />
//                         </label>

//                         <label style={styles.field}>
//                             <span style={styles.label}>Equipment access</span>
//                             <select
//                                 value={equipmentAccess}
//                                 onChange={e => setEquipmentAccess(e.target.value)}
//                                 style={styles.input}
//                             >
//                                 <option value="full_gym">Full gym + bags/mats</option>
//                                 <option value="home_minimal">Home setup (bands/dumbbells)</option>
//                                 <option value="bodyweight_only">Bodyweight + roadwork</option>
//                             </select>
//                         </label>

//                         <label style={styles.field}>
//                             <span style={styles.label}>Focus emphasis</span>
//                             <select
//                                 value={focusEmphasis}
//                                 onChange={e => setFocusEmphasis(e.target.value)}
//                                 style={styles.input}
//                             >
//                                 <option value="mixed">Mixed (sparring/technique + conditioning)</option>
//                                 <option value="more_sparring">Heavier on sparring/technique</option>
//                                 <option value="more_conditioning">Heavier on conditioning/strength</option>
//                             </select>
//                         </label>

//                         <label style={styles.field}>
//                             <span style={styles.label}>Goal</span>
//                             <select
//                                 value={goal}
//                                 onChange={e => setGoal(e.target.value)}
//                                 style={styles.input}
//                             >
//                                 <option value="hypertrophy">Hypertrophy</option>
//                                 <option value="strength">Strength</option>
//                                 <option value="power">Power / Speed</option>
//                             </select>
//                         </label>

//                         <label style={styles.field}>
//                             <span style={styles.label}>Experience</span>
//                             <select
//                                 value={experience}
//                                 onChange={e => setExperience(e.target.value)}
//                                 style={styles.input}
//                             >
//                                 <option value="beginner">Beginner</option>
//                                 <option value="intermediate">Intermediate</option>
//                                 <option value="advanced">Advanced</option>
//                             </select>
//                         </label>

//                         <label style={styles.field}>
//                             <span style={styles.label}>Days per week</span>
//                             <input
//                                 type="number"
//                                 min="2"
//                                 max="6"
//                                 value={daysPerWeek}
//                                 onChange={e => setDaysPerWeek(Number(e.target.value))}
//                                 style={styles.input}
//                             />
//                         </label>

//                         <div style={styles.actions}>
//                             {onBack && (
//                                 <button type="button" onClick={onBack} style={styles.secondaryButton}>
//                                     Back
//                                 </button>
//                             )}
//                             <div style={styles.rightActions}>
//                                 <button 
//                                     type="submit" 
//                                     style={{
//                                         ...styles.primaryButton,
//                                         opacity: !subscription ? 0.5 : 1,
//                                         cursor: !subscription ? 'not-allowed' : 'pointer'
//                                     }}
//                                     disabled={!subscription}
//                                 >
//                                     {subscription ? 'Find Training Plans' : 'Subscribe to Continue'}
//                                 </button>
//                             </div>
//                         </div>
//                     </form>
//                 </div>
//             </div>
//         </QuestionnaireShell>
//     );
// }

// const styles = {
//     center: {
//         minHeight: "68vh",
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//     },
//     card: {
//         width: "100%",
//         maxWidth: "900px",
//         padding: "26px 28px",
//         borderRadius: "14px",
//         border: "1px solid rgba(0,0,0,0.08)",
//         background: "white",
//         boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
//         display: "flex",
//         flexDirection: "column",
//         gap: "14px",
//     },
//     header: { display: "flex", flexDirection: "column", gap: "6px" },
//     title: { fontSize: "30px", fontWeight: 700, margin: 0 },
//     subtitle: { margin: 0, fontSize: "17px", opacity: 0.8, lineHeight: 1.5 },
//     form: { display: "flex", flexDirection: "column", gap: "14px", marginTop: "4px" },
//     field: { display: "flex", flexDirection: "column", gap: "6px" },
//     label: { fontSize: "15px", fontWeight: 600, color: "#111" },
//     input: {
//         height: "46px",
//         borderRadius: "10px",
//         border: "1px solid rgba(0,0,0,0.18)",
//         padding: "0 12px",
//         fontSize: "16px",
//         background: "#f8f8f8",
//     },
//     textarea: {
//         borderRadius: "10px",
//         border: "1px solid rgba(0,0,0,0.18)",
//         padding: "10px 12px",
//         fontSize: "16px",
//         background: "#f8f8f8",
//         resize: "vertical",
//     },
//     subscriptionAlert: {
//         padding: "16px 14px",
//         borderRadius: "10px",
//         border: "2px solid #ef4444",
//         background: "#fee2e2",
//         display: "flex",
//         justifyContent: "space-between",
//         alignItems: "center",
//         gap: "12px",
//         flexWrap: "wrap",
//     },
//     alertText: {
//         margin: 0,
//         fontSize: "14px",
//         color: "#991b1b",
//         lineHeight: 1.5,
//         flex: 1,
//     },
//     subscriptionActive: {
//         padding: "16px 14px",
//         borderRadius: "10px",
//         border: "2px solid #10b981",
//         background: "#ecfdf5",
//         display: "flex",
//         alignItems: "center",
//     },
//     activeText: {
//         margin: 0,
//         fontSize: "14px",
//         color: "#065f46",
//         lineHeight: 1.5,
//     },
//     subscribeButton: {
//         padding: "10px 18px",
//         fontSize: "14px",
//         borderRadius: "8px",
//         border: "2px solid #ef4444",
//         background: "#ef4444",
//         color: "white",
//         cursor: "pointer",
//         fontWeight: 600,
//         whiteSpace: "nowrap",
//     },
//     actions: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px", gap: "12px", flexWrap: "wrap" },
//     rightActions: { display: "flex", alignItems: "center", gap: "12px" },
//     primaryButton: {
//         padding: "12px 22px",
//         fontSize: "18px",
//         borderRadius: "10px",
//         border: "2px solid #111",
//         background: "#111",
//         color: "white",
//         cursor: "pointer",
//     },
//     secondaryButton: {
//         padding: "12px 22px",
//         fontSize: "18px",
//         borderRadius: "10px",
//         border: "2px solid #111",
//         background: "transparent",
//         color: "#111",
//         cursor: "pointer",
//     },
//     toggleLabel: { display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" },
//     checkbox: { width: "18px", height: "18px" },
// };
