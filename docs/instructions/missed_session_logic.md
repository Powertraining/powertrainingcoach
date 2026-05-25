# Missed Session Logic
The app should treat Day 1, Day 2, Day 3, etc. as sessions that belong to one training week, not as an endless rolling queue. That fits the current structure better, because the programs are written as a fixed number of sessions per week inside a 12-week plan.
So the default missed-session logic should be:
1. Reschedule inside the same week first
If Day 2 is missed and there is still room later that week, the app should move Day 2 to the next viable slot, then keep Day 3 after it. The main goal is to preserve the intended weekly order without turning the week into chaos. This matches the session-based weekly structure in the programs.
2. Do not auto-roll missed sessions into the next week
If the week runs out of room, the session should usually expire rather than being pushed forward forever. Since the plans are built around weekly training structure, the cleanest logic is to finish the week, then start the next week as written.
3. If the session must be salvaged late in the week, trim from the bottom
Keep the highest-value parts of the workout and remove lower-priority parts first. A good hierarchy is:
power / plyo / med-ball
main compound lift
main weighted row / primary pull
high-stimulus core
accessories last
4. Never “make up” a missed session by cramming two full sessions together
Value the strength stimulus while keeping fatigue and soreness under control so the athlete stays fresh for sport practice. So if the week is crowded, the app should shorten or drop work, not brute-force completion.
5. Use substitutions only if they preserve the training category
If a missed session has to be done under travel or limited-equipment conditions, the app should replace exercises with comparable ones, not random filler.
The simplest app philosophy becomes:
## Preserve the weekly structure first. Preserve session order second. Preserve the main stimulus third. Sacrifice accessories before recovery.
1. Missed session logic should be phase-aware
In normal 3:1 training blocks, one missed session can simply roll forward. But if the miss happens in week 4 deload, don’t carry extra fatigue into the next block just to “catch up.” Rules already use a 3 loading weeks + 1 deload structure, and deload weeks are where volume and sometimes stimulus are intentionally reduced.
2. Testing sessions need special rules
If the missed session contained an RPE-based 1RM estimation top set, 2–5RM test, or true 1RM test, treat it differently from a normal workout:
RPE-based 1RM estimation top sets: reschedule only if still inside the allowed week/block
2–5RM tests: reschedule only if still far enough from competition
true 1RM tests: skip rather than force if timing is no longer appropriate
3. Near a fight, missed volume should usually be abandoned, not repaid
In taper periods, the app should not try to recover lost volume. The taper guidance is clear: reduce volume, maintain reasonably high intensity, and avoid exhaustion. So if an athlete misses a taper session, the replacement should be a small primer, not a full catch-up lift.
4. Substitutions must preserve the category, not just fill space
If a missed session is being salvaged under limited equipment or travel conditions, the app should swap with a comparable stimulus. Your rulebook explicitly says substitutions should match the exercise category and emphasis. So if the athlete cannot perform a wall med-ball throw, use an explosive band rotation; if they cannot do a chest-supported row, use a DB row; and for strikers, do not suddenly insert deadlifts if the rules say to skip them.
## Decision tree for multiple missed sessions:
### 1 missed session
If that is only about 25–33% of the week, the app should try to rescue it inside the same week. If there are enough open slots left, shift the order forward. If there is only one slot left, do a rescue version of the missed day: keep power/plyo or med-ball first, then the main lift, then the primary weighted row or main pull, then one high-stimulus core slot if planned; cut smaller accessories, band work, and finishers first. Next week can usually continue as planned if the key lift exposure was still achieved. This fits the session hierarchy, the weighted-row rule, and the “high-stimulus core first” rule.
#### Action plan for 1 miss
Check if at least one viable slot remains this week.
If yes, shift the missed day forward in order.
If only one late-week slot remains, run a shortened rescue session.
Start next week normally unless that miss represented half the weekly S&C volume.
### 2 missed sessions
This is where I’d stop thinking “catch up both” and start thinking “protect the week.” In a 4-session week, 2 misses is already 50%. In a 3-session week, it is 67%. The app should allow at most one meaningful rescue session for the remainder of that week, not two full makeups. Which session gets rescued should depend on phase: in strength-heavy weeks, protect the biggest compound exposure; in power/speed-heavy weeks, protect the velocity session; in high sport-load weeks, protect freshness and drop more volume. Then freeze progression for the following week instead of advancing harder. In practice that means either repeat the same week number next week, or keep the same loads/RPE targets rather than moving up. That fits your weekly progression model, the lighter week logic, and the repeated instruction not to improvise when fitness is volatile.
#### Action plan for 2 misses
Do not try to complete both sessions in full.
Pick one rescue session only.
Build it around the week’s top priority stimulus.
Drop the other missed session.
Next week: freeze progression and repeat the same week target or same loading tier.
### 3 missed sessions
At that point, the week is basically disrupted. The app should stop trying to “complete the week.” If one slot remains, make it a re-entry session, not a catch-up session: reduced volume, conservative loading, good movement quality, no heroics. The closest internal model is your lighter week pattern: reduce sets and/or drop load roughly into a more conservative zone rather than forcing overload. Then repeat that same training week on the next calendar week. This is an inference, but it is the cleanest fit with your 3:1 loading structure and the repeated emphasis on readiness and controlled progression.
#### Action plan for 3 misses
Mark the week as failed for progression purposes.
No multi-session catch-up.
If one slot remains, use a conservative re-entry session only.
Repeat the same week next week.
### 4 or more missed sessions, or the whole S&C week missed
That should be treated as a full missed week. The app should not advance to the next harder week. It should repeat the missed week on the next calendar week, and the first session back should be conservative: lower-end RPE, no max attempts, no aggressive progression. That is especially important because your progressions are planned week to week, and the programs assume the athlete actually received the preceding week’s stimulus.
#### Action plan for 4+ misses / full week lost
Repeat the same week next calendar week.
First session back is conservative.
No RM tests on the first session back.
Resume normal progression only after the athlete is back on sequence.
The smartest general threshold is this:
- Missed up to one-third of the weekly S&C plan → rescue inside the week if possible.
- Missed about half of the weekly S&C plan → one rescue only, then freeze progression.
- Missed more than half → abandon catch-up and repeat the week.
That gives you a better system than pure raw count. For example:
- 1 of 4 missed → usually salvage and continue.
- 1 of 2 missed → freeze progression, because half the week is gone.
- 2 of 4 missed → one rescue, then repeat or hold progression.
- 2 of 3 missed → repeat the week.
- 3 of 4 missed → repeat the week.
Then add these hard overrides:
##### Deload week
Do not import missed loading-week work into deload week, and do not try to “make up” deload volume either. Deload exists to reduce fatigue.
##### Taper / fight week
No catch-up volume. At most, replace a missed session with a short primer. Otherwise skip.
RM / test week
If the missed session contained a true 1RM, multi-RM, or RPE-based 1RM estimation top set, only rescue it within that same week. If the week is gone, skip the test and keep the last usable training max.
##### Reason-based modifier
The app should also ask why the session was missed:
schedule/travel → use normal rescue logic
fatigue / poor readiness → same logic, but reduce volume or stay at lower-end RPE
illness / injury flag → no catch-up; use substitutions or re-entry only. This is consistent with the readiness/autoregulation emphasis and substitution rules.
If you want the shortest version for the app, I’d make it this:
Miss a little: rescue.
Miss half: rescue one, freeze progression.
Miss most: stop chasing, repeat the week.
#### Long-term sickness rule (7+ days)
Any sickness-related interruption of 7 consecutive days or more is regarded as long-term sickness. Once this threshold is reached, the absence is no longer treated as ordinary missed sessions inside the week. Instead, the current training rhythm is considered broken enough that the athlete should not attempt to catch up missed sessions or jump back in where they left off. When the athlete is recovered and ready to train again, the app should restart the current cycle/block from the beginning rather than continuing mid-stream. This fits the weekly and block-based structure of the program, where progression is built across planned weeks and lighter/deload weeks, not random fragmented exposures.
A tighter operational version:
##### If sickness absence is 7+ consecutive days:
- classify as long-term sickness
- cancel all missed sessions from the interrupted week
- do not perform catch-up volume
- restart the current block/cycle from its first week when training resumes
- if the athlete was in a taper/fight week, do not restart the old block; switch to taper/re-entry logic instead, since peaking phases are handled differently from normal loading phases.
If you want a one-line app version:
7+ consecutive days out due to sickness = long-term sickness; restart the current block from the beginning, with no catch-up sessions.
