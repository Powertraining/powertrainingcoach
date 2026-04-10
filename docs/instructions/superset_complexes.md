# Superset/Complexes When Relevant
Rule: Prioritize Unrelated, Time-Efficient Supersets — and always pair medicine-ball throws with plyometrics WHEN both are included in the session. 
When session time is limited, the app should compress the session by pairing exercises that do not meaningfully interfere with each other, so important qualities can still be trained without turning the session into a marathon. Supersets must be clearly labeled in numerical order (for example, 1a/1b).
## Default pairing behavior
(Use this with common sense) When sessions_per_week <= 2 and/or available_time <= 40 min, the app should preferentially use supersets for:
upper push + upper pull
lower-body strength + upper-body accessory
core + grip / neck
non-conflicting accessory pairs
medicine-ball throws + plyometrics/jumps as the default explosive-power pairing
When sessions_per_week > 2 and time is adequate, the app may spread work out more and use fewer supersets, but it should still keep explosive pairings concise and near the start of the session. The more expanded format is for athletes with more time; the concise format is for athletes with less time.
## Non-negotiable explosive pairing rule
If a session includes medicine-ball throws and plyometrics, they should be paired together as a superset/complex by default, unless equipment flow or safety makes it impossible.
## Interference rule
To keep the supersets productive instead of sloppy:
Do not pair two highly fatiguing lifts that compete for the same output unless the program explicitly wants a contrast pairing. Prefer unrelated or minimally competing patterns.
So:
good: bench + row
good: squat + chin-up
good: grip + abs
good: med-ball throw + jump
avoid by default: heavy squat + heavy RDL
avoid by default: heavy bench + heavy overhead press
avoid by default: two dense conditioning elements together
Your book allows contrast methods, including related and unrelated pairings, but for app defaults I would bias toward the cleaner, lower-interference option because it is more reliable for general users.
## Best app logic
You could write it like this:
Superset Compression Rule
 If time is limited or weekly S&C frequency is low, pair exercises using non-conflicting supersets to preserve key training elements in short sessions.
Priority order:
Pair medicine-ball throws with plyometrics whenever both are programmed.
Pair upper-body push with upper-body pull when appropriate.
Pair main lift with unrelated accessory only if performance on the main lift will not drop.
Pair core, grip, neck, and low-skill accessory work near the end of the session.
If weekly frequency is higher, the app may spread exercises across more days and reduce superset density, but explosive pairings may still remain supersetted for efficiency.
## Good exception clause
Add one line so the app does not become dogmatic:
Exception: break the superset apart if setup friction, crowding, safety, or output quality drops too much.
That matters because explosive work is still quality-dependent, and your material repeatedly emphasizes not doing power work in a fatigued state and resting enough to maintain output.
## Even tighter version for the rulebook
If you want it shorter and more “app-rulebook” in tone:
Rule: Use unrelated supersets when time or weekly session count is limited.
 The app should compress shorter programs by pairing non-conflicting exercises such as push/pull, lower/upper, and accessory/core/grip combinations.
 Medicine-ball throws must be paired with plyometrics by default whenever both appear in the same session.
 With over 2x per week weekly S&C days, the app may spread exercises out more and reduce superset density, but explosive pairings can still remain supersetted.
 Avoid pairing exercises that meaningfully reduce output, technique quality, or safety.
The next refinement I’d make is to turn this into a pairing matrix for the generator, like “always allowed / allowed / avoid / never,” so the app knows exactly which exercise categories can be matched.
