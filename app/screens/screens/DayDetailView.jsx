// npx expo install react-native-webview

import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { WebView } from "react-native-webview";
import QuestionnaireShell from "./QuestionnaireShell.jsx";

function toYouTubeEmbed(url) {
    try {
        const parsed = new URL(url);
        if (parsed.hostname.includes("youtu.be")) {
            const id = parsed.pathname.replace("/", "");
            return id ? `https://www.youtube.com/embed/${id}` : null;
        }
        if (parsed.hostname.includes("youtube.com")) {
            const id = parsed.searchParams.get("v");
            return id ? `https://www.youtube.com/embed/${id}` : null;
        }
        return null;
    } catch {
        return null;
    }
}

export default function DayDetailView({ week, day, exercises = [], onBack, onFinish }) {
    const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(0);

    if (!exercises || exercises.length === 0) return null;

    const selectedExercise = exercises[selectedExerciseIndex];
    const embedUrl = selectedExercise?.videoUrl ? toYouTubeEmbed(selectedExercise.videoUrl) : null;
    const summaryText = selectedExercise
        ? `${selectedExercise.name} – ${selectedExercise.sets} x ${selectedExercise.reps}`
        : "No exercises available for this day yet.";

    return (
        <QuestionnaireShell>
            <ScrollView contentContainerStyle={styles.center}>
                <View style={styles.card}>
                    <View style={styles.headerRow}>
                        <View style={styles.heading}>
                            <Text style={styles.eyebrow}>Suggested workout</Text>
                            <Text style={styles.title}>Day {day} • Week {week}</Text>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.backButton} onPress={onBack}>
                                <Text style={styles.backButtonText}>Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.finishButton} onPress={onFinish}>
                                <Text style={styles.finishButtonText}>Finish</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.contentBlock}>
                        <Text style={styles.subtitle}>Current Exercise:</Text>
                        <Text style={styles.summary}>{summaryText}</Text>

                        <View style={styles.videoBox}>
                            {embedUrl ? (
                                <WebView
                                    source={{ uri: embedUrl }}
                                    style={styles.videoEmbed}
                                    allowsFullscreenVideo
                                />
                            ) : (
                                <View style={styles.videoPlaceholder}>
                                    <Text style={styles.videoPlaceholderText}>
                                        No video available for this exercise{"\n"}
                                        Try searching YouTube for: "{selectedExercise.name} tutorial"
                                    </Text>
                                </View>
                            )}
                        </View>

                        {selectedExercise?.notes && (
                            <View style={styles.notesBox}>
                                <Text style={styles.notesLabel}>💡 Tips:</Text>
                                <Text style={styles.notesText}>{selectedExercise.notes}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.exerciseTabs}>
                        <Text style={styles.tabsLabel}>All exercises ({exercises.length}):</Text>
                        <View style={styles.tabsContainer}>
                            {exercises.map((ex, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.tabButton, i === selectedExerciseIndex ? styles.tabButtonActive : styles.tabButtonInactive]}
                                    onPress={() => setSelectedExerciseIndex(i)}
                                >
                                    <View style={styles.tabButtonContent}>
                                        <View style={styles.tabButtonNumber}>
                                            <Text style={{ fontSize: 12, fontWeight: '700' }}>{i + 1}</Text>
                                        </View>
                                        <View style={styles.tabButtonText}>
                                            <Text style={styles.tabButtonName}>{ex.name}</Text>
                                            <Text style={styles.tabButtonSets}>{ex.sets} x {ex.reps}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.listBlock}>
                        <Text style={styles.listLabel}>Complete workout breakdown:</Text>
                        {exercises.map((ex, i) => (
                            <View key={i} style={styles.exerciseRow}>
                                <View>
                                    <Text style={styles.exerciseName}>{ex.name}</Text>
                                    <Text style={styles.exerciseNotes}>{ex.notes}</Text>
                                </View>
                                <Text style={styles.exerciseSets}>{ex.sets} x {ex.reps}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </QuestionnaireShell>
    );
}

const styles = StyleSheet.create({
    center: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        width: '100%',
        maxWidth: 980,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: 28,
        gap: 18,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    heading: { flexDirection: 'column', gap: 4 },
    eyebrow: {
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontSize: 12,
        opacity: 0.7,
    },
    title: { fontSize: 30, fontWeight: '700' },
    headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    backButton: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#111',
    },
    backButtonText: { fontSize: 16, color: '#111' },
    finishButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#111',
        backgroundColor: '#111',
    },
    finishButtonText: { fontSize: 16, color: 'white' },
    contentBlock: { flexDirection: 'column', gap: 10 },
    subtitle: { fontSize: 16, opacity: 0.8 },
    summary: { fontSize: 20, fontWeight: '600' },
    videoBox: { marginTop: 8 },
    videoEmbed: { width: '100%', height: 360, borderRadius: 12 },
    videoPlaceholder: {
        width: '100%',
        height: 360,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.2)',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f2f2f2',
    },
    videoPlaceholderText: { fontSize: 16, opacity: 0.7, textAlign: 'center' },
    notesBox: {
        padding: 12,
        backgroundColor: '#f9f3ff',
        borderWidth: 1,
        borderColor: '#e8d5ff',
        borderRadius: 10,
        gap: 6,
    },
    notesLabel: { fontSize: 14, fontWeight: '600', opacity: 0.9 },
    notesText: { fontSize: 14, lineHeight: 21, opacity: 0.85 },
    exerciseTabs: {
        gap: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.08)',
    },
    tabsLabel: { fontSize: 14, fontWeight: '600', opacity: 0.7 },
    tabsContainer: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    tabButton: { borderRadius: 10 },
    tabButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
    tabButtonNumber: { alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6 },
    tabButtonText: { flexDirection: 'column', gap: 2 },
    tabButtonName: { fontSize: 13, fontWeight: '600' },
    tabButtonSets: { fontSize: 11, opacity: 0.7 },
    tabButtonActive: { backgroundColor: '#111' },
    tabButtonInactive: { backgroundColor: 'rgba(0,0,0,0.05)' },
    listBlock: {
        gap: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.08)',
    },
    listLabel: { fontSize: 14, fontWeight: '600', opacity: 0.7 },
    exerciseRow: {
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        alignItems: 'center',
    },
    exerciseName: { fontSize: 16, fontWeight: '600' },
    exerciseNotes: { fontSize: 14, opacity: 0.75 },
    exerciseSets: { fontSize: 16, fontWeight: '600', minWidth: 70, textAlign: 'right' },
});

// import { useState } from "react";
// import QuestionnaireShell from "./QuestionnaireShell.jsx";

// function toYouTubeEmbed(url) {
//     try {
//         const parsed = new URL(url);
//         if (parsed.hostname.includes("youtu.be")) {
//             const id = parsed.pathname.replace("/", "");
//             return id ? `https://www.youtube.com/embed/${id}` : null;
//         }
//         if (parsed.hostname.includes("youtube.com")) {
//             const id = parsed.searchParams.get("v");
//             return id ? `https://www.youtube.com/embed/${id}` : null;
//         }
//         return null;
//     } catch {
//         return null;
//     }
// }

// export default function DayDetailView({ week, day, exercises = [], onBack, onFinish }) {
//     const [selectedExerciseIndex, setSelectedExerciseIndex] = useState(0);

//     if (!exercises || exercises.length === 0) return null;

//     const selectedExercise = exercises[selectedExerciseIndex];
//     const embedUrl = selectedExercise?.videoUrl ? toYouTubeEmbed(selectedExercise.videoUrl) : null;
//     const summaryText = selectedExercise
//         ? `${selectedExercise.name} – ${selectedExercise.sets} x ${selectedExercise.reps}`
//         : "No exercises available for this day yet.";

//     return (
//         <QuestionnaireShell>
//             <div style={styles.center}>
//                 <div style={styles.card}>
//                     <div style={styles.headerRow}>
//                         <div style={styles.heading}>
//                             <p style={styles.eyebrow}>Suggested workout</p>
//                             <h2 style={styles.title}>Day {day} • Week {week}</h2>
//                         </div>
//                         <div style={styles.headerActions}>
//                             <button style={styles.backButton} onClick={onBack}>
//                                 Back
//                             </button>
//                             <button style={styles.finishButton} onClick={onFinish}>
//                                 Finish
//                             </button>
//                         </div>
//                     </div>

//                     <div style={styles.contentBlock}>
//                         <p style={styles.subtitle}>Current Exercise:</p>
//                         <p style={styles.summary}>{summaryText}</p>

//                         <div style={styles.videoBox}>
//                             {embedUrl ? (
//                                 <iframe
//                                     src={embedUrl}
//                                     title={`${selectedExercise.name} video`}
//                                     style={styles.videoEmbed}
//                                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//                                     allowFullScreen
//                                 />
//                             ) : (
//                                 <div style={styles.videoPlaceholder}>
//                                     <span style={styles.videoPlaceholderText}>
//                                         No video available for this exercise
//                                         Try searching YouTube for: "{selectedExercise.name} tutorial"
//                                     </span>
//                                 </div>
//                             )}
//                         </div>

//                         {selectedExercise?.notes && (
//                             <div style={styles.notesBox}>
//                                 <p style={styles.notesLabel}>💡 Tips:</p>
//                                 <p style={styles.notesText}>{selectedExercise.notes}</p>
//                             </div>
//                         )}
//                     </div>

//                     {/* Exercise tabs/selector */}
//                     <div style={styles.exerciseTabs}>
//                         <p style={styles.tabsLabel}>All exercises ({exercises.length}):</p>
//                         <div style={styles.tabsContainer}>
//                             {exercises.map((ex, i) => (
//                                 <button
//                                     key={i}
//                                     style={{
//                                         ...styles.tabButton,
//                                         ...(i === selectedExerciseIndex ? styles.tabButtonActive : styles.tabButtonInactive),
//                                     }}
//                                     onClick={() => setSelectedExerciseIndex(i)}
//                                 >
//                                     <div style={styles.tabButtonContent}>
//                                         <div style={styles.tabButtonNumber}>
//                                             {i + 1}
//                                         </div>
//                                         <div style={styles.tabButtonText}>
//                                             <div style={styles.tabButtonName}>{ex.name}</div>
//                                             <div style={styles.tabButtonSets}>{ex.sets} x {ex.reps}</div>
//                                         </div>
//                                     </div>
//                                 </button>
//                             ))}
//                         </div>
//                     </div>

//                     {/* Full exercise list below */}
//                     <div style={styles.listBlock}>
//                         <p style={styles.listLabel}>Complete workout breakdown:</p>
//                         {exercises.map((ex, i) => (
//                             <div key={i} style={styles.exerciseRow}>
//                                 <div>
//                                     <div style={styles.exerciseName}>{ex.name}</div>
//                                     <div style={styles.exerciseNotes}>{ex.notes}</div>
//                                 </div>
//                                 <div style={styles.exerciseSets}>{ex.sets} x {ex.reps}</div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </div>
//         </QuestionnaireShell>
//     );
// }

// const styles = {
//     center: {
//         minHeight: "72vh",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//     },
//     card: {
//         width: "100%",
//         maxWidth: "980px",
//         background: "white",
//         border: "1px solid rgba(0,0,0,0.08)",
//         borderRadius: "16px",
//         boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
//         padding: "28px 30px",
//         display: "flex",
//         flexDirection: "column",
//         gap: "18px",
//     },
//     headerRow: {
//         display: "flex",
//         justifyContent: "space-between",
//         alignItems: "flex-start",
//         gap: "12px",
//     },
//     heading: { display: "flex", flexDirection: "column", gap: "4px" },
//     eyebrow: {
//         margin: 0,
//         textTransform: "uppercase",
//         letterSpacing: "0.08em",
//         fontSize: "12px",
//         opacity: 0.7,
//     },
//     title: { margin: 0, fontSize: "30px", fontWeight: 700 },
//     headerActions: { display: "flex", gap: "8px", alignItems: "center" },
//     backButton: {
//         padding: "10px 14px",
//         fontSize: "16px",
//         borderRadius: "10px",
//         border: "2px solid #111",
//         background: "transparent",
//         color: "#111",
//         cursor: "pointer",
//     },
//     finishButton: {
//         padding: "10px 16px",
//         fontSize: "16px",
//         borderRadius: "10px",
//         border: "2px solid #111",
//         background: "#111",
//         color: "white",
//         cursor: "pointer",
//     },
//     contentBlock: {
//         display: "flex",
//         flexDirection: "column",
//         gap: "10px",
//     },
//     subtitle: { margin: 0, fontSize: "16px", opacity: 0.8 },
//     summary: { margin: 0, fontSize: "20px", fontWeight: 600 },
//     videoBox: { marginTop: "8px" },
//     videoEmbed: {
//         width: "100%",
//         height: "360px",
//         border: "none",
//         borderRadius: "12px",
//     },
//     videoPlaceholder: {
//         width: "100%",
//         height: "360px",
//         borderRadius: "12px",
//         border: "1px dashed rgba(0,0,0,0.2)",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         background: "linear-gradient(145deg, #fafafa, #f2f2f2)",
//     },
//     videoPlaceholderText: { fontSize: "16px", opacity: 0.7 },
//     notesBox: {
//         padding: "12px 16px",
//         background: "#f9f3ff",
//         border: "1px solid #e8d5ff",
//         borderRadius: "10px",
//         display: "flex",
//         flexDirection: "column",
//         gap: "6px",
//     },
//     notesLabel: {
//         margin: 0,
//         fontSize: "14px",
//         fontWeight: 600,
//         opacity: 0.9,
//     },
//     notesText: {
//         margin: 0,
//         fontSize: "14px",
//         lineHeight: "1.5",
//         opacity: 0.85,
//     },
//     exerciseTabs: {
//         display: "flex",
//         flexDirection: "column",
//         gap: "10px",
//         paddingTop: "8px",
//         borderTop: "1px solid rgba(0,0,0,0.08)",
//     },
//     tabsLabel: {
//         margin: 0,
//         fontSize: "14px",
//         fontWeight: 600,
//         opacity: 0.7,
//     },
//     tabsContainer: {
//         display: "flex",
//         gap: "8px",
//         flexWrap: "wrap",
//     },
//     tabButton: {
//         padding: "0",
//         border: "none",
//         borderRadius: "10px",
//         cursor: "pointer",
//         transition: "all 0.2s ease",
//         fontSize: "14px",
//     },
//     tabButtonContent: {
//         display: "flex",
//         alignItems: "center",
//         gap: "8px",
//         padding: "10px 12px",
//     },
//     tabButtonNumber: {
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//         width: "24px",
//         height: "24px",
//         borderRadius: "6px",
//         fontSize: "12px",
//         fontWeight: 700,
//     },
//     tabButtonText: {
//         display: "flex",
//         flexDirection: "column",
//         gap: "2px",
//         textAlign: "left",
//     },
//     tabButtonName: {
//         fontSize: "13px",
//         fontWeight: 600,
//     },
//     tabButtonSets: {
//         fontSize: "11px",
//         opacity: 0.7,
//     },
//     tabButtonActive: {
//         background: "#111",
//         color: "white",
//     },
//     tabButtonInactive: {
//         background: "rgba(0,0,0,0.05)",
//         color: "#111",
//     },
//     listBlock: {
//         display: "flex",
//         flexDirection: "column",
//         gap: "10px",
//         paddingTop: "8px",
//         borderTop: "1px solid rgba(0,0,0,0.08)",
//     },
//     listLabel: {
//         margin: 0,
//         fontSize: "14px",
//         fontWeight: 600,
//         opacity: 0.7,
//     },
//     exerciseRow: {
//         padding: "12px 14px",
//         borderRadius: "10px",
//         border: "1px solid rgba(0,0,0,0.08)",
//         display: "flex",
//         justifyContent: "space-between",
//         gap: "10px",
//         alignItems: "center",
//     },
//     exerciseName: { fontSize: "16px", fontWeight: 600 },
//     exerciseNotes: { fontSize: "14px", opacity: 0.75 },
//     exerciseSets: { fontSize: "16px", fontWeight: 600, minWidth: "70px", textAlign: "right" },
// };
