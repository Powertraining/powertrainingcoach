# Heart Rate rules

HR in the app do more than just display pulse afterward. It should have four jobs: set aerobic intensity, quantify internal load, help interpret recovery/context, and improve its own accuracy over time.
Heart-rate integration should be optional, but meaningful when used.
 If the athlete connects a monitor, HR data should be used across session prescription, live guidance, and post-session analytics rather than just shown as a passive graph. Chest straps should be treated as the highest-confidence source, while wrist-based optical data should be marked lower-confidence, especially in intervals and sessions with rapid HR changes, where chest straps are generally more accurate.
Estimated HRmax should be treated as a starting point, not a fact.
 Use HRmax ≈ 208 − 0.7 × age as the default estimate, because it is a stronger general formula than the old 220 − age approach, but keep it labeled as estimated HRmax, since age-based equations still have substantial individual error. 
The app should store a personal resting-HR baseline.
 Instead of comparing the athlete to generic population norms, store a rolling morning baseline and compare the athlete mainly to themself. That is usually more useful for coaching decisions than a one-off reading. This can then feed into readiness interpretation, especially when paired with athlete-reported fatigue, sleep, soreness, or illness. This part is more of a design recommendation than a hard physiological law, but it is the more practical coaching approach.
What HR should do inside the app
For endurance and conditioning sessions, HR should help prescribe and verify the session.
 The app can give target zones or caps for aerobic work, tempo work, and longer intervals, then show whether the athlete actually stayed where intended. HR is especially useful for steady aerobic work and submaximal conditioning.
Every session should get an internal-load score from HR.
 A very useful feature is an HR-based load metric such as TRIMP, since it combines duration and cardiovascular intensity into one internal-load score. That gives you something much better than “session was hard” and lets the app track weekly load trends.
The app should track heart-rate recovery after hard efforts.
 A good feature is 1-minute HR recovery, meaning how much HR drops in the first minute after exercise or after a hard interval set. It is a useful marker to display and trend over time.
Analytics worth adding
I would include these in the post-session analytics:
Average HR
Peak HR
Time in zone
%HRR reached
TRIMP / HR load
1-minute HR recovery
HR graph with 5–15 second smoothing to reduce noise
Device source + confidence tag such as chest strap / arm sensor / wrist optical
If pace, speed, or power is also available, you can add HR drift / decoupling as a more advanced endurance metric. That is a good later-stage feature.
Important rules the app should follow
1. Do not trust all HR data equally.
 Signal quality matters. If the sensor drops out, spikes unrealistically, or comes from a lower-confidence source during combat or intervals, the app should flag the reading rather than build conclusions from junk data. Chest-based ECG-style sensors are generally more accurate than wrist optical wearables, especially when intensity changes quickly.
2. Always let RPE and the talk test back up HR.
 When HR data is missing, noisy, or obviously distorted, the app should fall back to athlete-reported exertion and simple intensity checks like the talk test. Moderate work generally allows talking but not singing; vigorous work usually limits speech to only a few words at a time.
3. HR should be interpreted in context, not in isolation.
 Heat and dehydration can raise cardiovascular strain and push HR upward without that automatically meaning the athlete is fitter or less fit. So the app should allow context tags such as heat, poor hydration, or poor sleep, and it should down-weight hard conclusions from those sessions.
4. The app should recalibrate over time.
 If the athlete repeatedly hits verified values above the predicted HRmax, the app should not keep clinging to the original formula forever. Predicted HRmax should be a bootstrap value, then the system should gradually personalize itself. That is the only sane way to use age formulas in practice.
A tighter app-ready version
You could rewrite your section like this:
Heart Rate Integration Rules
The athlete may connect a heart-rate monitor to the app.
Heart-rate data should be used for live session guidance, post-session analytics, internal-load scoring, and long-term trend analysis.
The app should prioritize sensor accuracy hierarchically, with chest strap data treated as highest confidence and wrist-based optical data treated as lower confidence, especially during intervals, combat sessions, and other high-movement activities.
The app should estimate maximum heart rate initially using HRmax ≈ 208 − 0.7 × age, but this value should be stored as an estimate rather than a true measured maximum.
Heart-rate zones should by default be calculated from heart-rate reserve using resting heart rate and estimated or measured HRmax.
The athlete must be able to manually override HRmax, resting HR, and zone settings, and the app may progressively refine them based on repeated verified session data.
The app should display, at minimum, average HR, peak HR, time in zone, internal HR load, and 1-minute HR recovery for relevant sessions.
HR should be used primarily to guide endurance and conditioning work, while serving as a secondary monitoring metric in strength, power, and explosive sessions due to the lagging nature of HR response.
When HR data quality is poor or contextual factors are likely distorting HR, the app should rely more heavily on RPE, session type, and athlete feedback rather than forcing HR-based conclusions.
Best extra functions to add
The highest-ROI additions would be:
HR zone builder
 Creates personalized bpm zones from HRrest + HRmax.
HR load score
 Weekly internal load from HR duration and intensity.
Recovery widget
 Morning resting HR trend + 1-minute HR recovery trend.
Sensor confidence system
 Analytics labeled according to data quality and device type.
Auto-recalibration
 Suggest updated HRmax / zones when repeated observed data conflicts with the estimate.
Session-type-specific HR interpretation
 The app interprets HR differently for aerobic work, intervals, sparring, bag work, circuits, lifting, and explosive power work.
