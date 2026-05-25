# RM attempts in the program
The athlete will have three options for gauging strength level for future % prescriptions as the program progresses.
1.    	True 1RM tests
2.    	Multiple RM tests (up to 5) then estimating 1RM using Epley’s formula
3.    	RPE-based 1RM Estimation

Remember, maxing out is only necessary when using the percentage system. Not RPE. Because RPE is by default autoregulatory. 
2–5 RM test
Every 4–6 weeks
Allowed in off-season and early/mid camp
Blocked in final 5 weeks before fight
That gives enough flexibility without letting the app spam hard tests.

True 1RM
Be more cautious with this alternative, as it has limited utility for fighters. It’ll be more useful for other sports (E.g., powerlifters, strongmen, weightlifters—but we haven’t added these yet).
Every 12–16 weeks (if athlete explicitly desires this method)--expection is if the program explicitly has worked on 1-rep style sets prior, e.g., 5-10 sets of 1, then it can probably be done more frequently. But this rep scheme is rare, and is an exception. 
Max 2–3 times per year per lift
Only off-season / general strength phase
Never close to competition
Max 1 true 1RM test in any week


Here are the explanations for each method to be shown in the app:
## Option 1 – True 1RM Test
What it is
You work up to a single, all-out rep (RPE 10) on a key lift (e.g., squat, deadlift, bench). The heaviest successful rep that day is your 1RM.
Why use it?
Most precise number for %-based strength work.
Strong psychological benchmark (“I squatted 180 kg today”).
Shows clearly how your strength has changed over months/years.
Risks / downsides
High fatigue for nervous system, joints, and connective tissue.
Technique can break down under max strain.
Can interfere with sparring and skill work if done too often or at the wrong time.
More stressful/anxiety-provoking for some athletes.
Suitable for you if…
You have 1–2+ years of lifting experience with good technique.
You feel confident and motivated by true max attempts.
You’re not close to a fight (off-season / general strength block).
You want very accurate %s for heavy strength work.
Not ideal if…
You’re in fight camp or your training load is already very high.
You have a history of back, knee, or shoulder issues that worsen with true max singles.
Max attempts make you overly anxious or cause you to lose form.

## Option 2 – 2–5RM Test (Estimated 1RM)
What it is
You work up to a heavy set of 2–5 reps (RPE 9–10). The app uses your load and reps (Epley formula) to estimate your 1RM and adjust your training weights.
Why use it?
Much safer and less stressful than frequent 1RMs.
Still very specific to max strength (low reps, heavy weight).
Easy to build into a normal session as your top set.
Accurate enough to set training %s for most combat athletes.
Risks / downsides
A true 2–5RM is still very hard and fatiguing.
Form can slip if you chase reps when tired.
The estimated 1RM isn’t perfect, especially if you sandbag or overshoot.
Suitable for you if…
You want objective strength numbers, but don’t need constant true maxes.
You’re okay with pushing 1–2 hard sets as part of training.
You’re in off-season or early camp, where a bit of extra fatigue is acceptable.
You prefer “heavy sets” over single-rep max attempts.
Not ideal if…
You’re very close to a fight and need to minimize fatigue.
You struggle to keep technique tight when pushing near failure.
You dislike very hard sets and tend to stop too early or go too far past RPE 9–10.

## Option 3 – RPE-based 1RM Estimation
What it is
You work up to a clean submax top set of 1–3 reps, with 3 reps at RPE 8 as the default. The app adds estimated reps in reserve to the reps you completed, then uses Epley’s formula to estimate your 1RM and update your training weights.
Why use it?
Lowest fatigue option that still keeps strength estimates current.
Can be used more often (weekly/biweekly) without wrecking you for sparring.
Keeps you used to handling meaningful loads and builds confidence.
Very useful during fight camp when big tests are too costly.
Risks / downsides
Relies on honest RPE rating from you.
If you misjudge RPE (call a 10 “8”), the estimate can be off.
Less “dramatic” than a true max; fewer big “PR moments”.
Suitable for you if…
You want to track strength regularly with minimal disruption to your combat training.
You’re in camp or train hard in your sport several times per week.
You’re comfortable judging how many reps you have in reserve (RPE).
You care more about steady progress and feeling good than chasing big max numbers.
Not ideal if…
You hate using RPE or find it very hard to rate effort.
You strongly prefer clear, absolute numbers from max tests.
You almost never lift heavy enough for a 1–3 rep RPE 8–9 top set to be meaningful.
 
 
## 1. True 1RM Tests
Purpose in the app
Provide a high-precision anchor for %-based programming on key lifts.
Give the athlete an objective benchmark a few times per year (“I’m actually stronger now”).
Expose them occasionally to very heavy loads in a controlled, planned context.
When the generator is allowed to schedule true 1RMs
1. Phase restriction
Only in off-season / general strength phases.
Never within 3–4 weeks of a fight.
Never inside a high-fatigue peak sparring block.
2. Lift selection
Only on primary strength lifts (e.g., trap bar deadlift, squat/front squat, bench, bench variant).
No 1RM tests on isolation or accessory lifts.
3. Athlete profile filter
Allowed only if:
Athlete is marked as “intermediate or advanced” in strength training.
Athlete preference is “ok with max testing” (a profile toggle).
If athlete is beginner or “prefers submax tests”, generator never prescribes true 1RMs and defaults to 2–5RM testing.
How the app uses a true 1RM result
The test 1RM becomes the new training max for that lift.
All %-based work is recalculated from that value.
To stay conservative, the app can:
Optionally set training max = 95–97.5% of test 1RM (buffer for daily variation).
The app expects no further max or 2–5RM tests for that lift for at least 4–6 weeks afterward.

## 2. Multiple RM Tests (2–5RM + Epley)
Purpose in the app
Default method to update strength levels with less fatigue and risk than true 1RMs.
Easy to embed into normal training sessions as a “top set” rather than a special test day.
Accurate enough in the 2–5 rep range to set training %s.
When the generator should use 2–5RM tests
Default option
For combat sports athletes, 2–5RM testing is the default way to estimate 1RM.
Used in:
General strength blocks
Early/mid-off-camp strength phases
Frequency
Approximately every 4–8 weeks per lift, usually:
At the end of a mesocycle
Or at the beginning of a new phase as a “baseline”
In fight camp:
At most 1 early-camp test per key lift.
No 2–5RM tests in the final 3–4 weeks before a fight.
Rep target choice (2–5 reps)
Generator can choose the target based on profile:
2–3RM → for athletes comfortable with heavy loads and stable technique.
4–5RM → for those who prefer slightly higher reps / feel safer with them.
All tests are programmed as a top set @RPE 9–10 (1 or 0 reps in reserve).
How the test is programmed in a session
Warm-up progression (submax sets).
Then generator prescribes:
“Work up to a top set of 2–5 reps @RPE 9–10.”
Athlete logs:
Load lifted
Exact number of reps
RPE (if you want the extra info)
How the app uses a 2–5RM result
1. Estimate 1RM with Epley
est 1RM = load*(1+reps / 30)
(for 2–5 reps, close enough for programming)
2. Update training max
New training max is derived from the estimate, with a safety buffer:
e.g., training max = 95–97.5% of est 1RM
To avoid big jumps:
Limit change to e.g., ±5–7.5% from previous training max per test.
3. Recalculate %s
All %-based prescriptions for that lift are updated to the new training max.
Day-to-day loading still fine-tuned via RPE or your 2.5%-per-RPE rule.
 
## 3. RPE/RIR-Based Estimated 1RM 
Rule: The app should estimate an athlete’s current strength from a normal training set by using the athlete’s logged load, completed reps, and RPE.
The goal is to avoid unnecessary max testing while still keeping training loads updated. The app should use any suitable top set where the athlete reports how many reps they likely had left.
RPE should be interpreted through reps in reserve.
An RPE 10 means the athlete had no reps left.
An RPE 9 means the athlete likely had about 1 rep left.
 An RPE 8 means the athlete likely had about 2 reps left.
 An RPE 7 means the athlete likely had about 3 reps left.
The app should add the estimated reps in reserve to the reps the athlete actually completed. This gives an estimated rep max at that load.
For example, if an athlete performs 180 kg for 3 reps at RPE 8, the app assumes the athlete had about 2 reps left. That means 180 kg was probably close to a 5-rep max for that athlete on that day.
The app can then use that estimated rep max to calculate an estimated 1RM.
Top Set Attempt Format
The app should prescribe the max-estimation attempt in a practical and easy-to-follow format.
For example:
Work up to 3 reps at RPE 8. 
This should be the default. Always. 
The athlete should also have a “Change” option where they can select a different top-set format from a dropdown menu relevant to the format.
1 rep at RPE 8
1 rep at RPE 9
2 reps at RPE 8
2 reps at RPE 9
3 reps at RPE 9
Allowed Calibration Options
For RPE 8 attempts, the dropdown should only include:
The app should not allow top-set estimation above 3 reps. To reduce the risk of inaccuracies. 
The app should also (obviously) avoid RPE 10 for this feature. The purpose is not to max out or reach failure. The purpose is to estimate strength from a hard, clean, submaximal set.
Example
The athlete logs:
180 kg × 3 reps at RPE 8
Since RPE 8 means roughly 2 reps in reserve, the app estimates that the athlete could have completed about 5 total reps with 180 kg.
So the logic is:
3 completed reps + 2 estimated reps in reserve = 5 estimated max reps
The app then estimates the athlete’s 1RM from the idea that 180 kg was approximately a 5-rep max.
Using the Epley method, this gives an estimated 1RM of approximately 210 kg.
This number should be treated as the athlete’s 1RM until a new RM attempt is made at whatever occasion. 


## How Often the App Will Test Your Strength (Once You Choose a Method)

1. 2–5RM Test (Estimate 1RM from a Hard Set)
If you choose 2–5RM testing for a lift:
The app will schedule a 2–5RM test on that lift roughly every 4–6 weeks.
Only one test lift per week:
If you have multiple main lifts, the app won’t test all of them heavy in the same week.
In fight camp:
2–5RM tests are allowed early in camp, but
They are blocked in the last 3–4 weeks before a fight to avoid extra fatigue.
Between tests, that lift is trained normally using the last known estimate.
Summary to show user:
“With this option, you’ll do a very hard 2–5 rep set on a main lift about once every 4–6 weeks, and never in the last weeks before a fight. The app caps it so you’re not testing heavy all the time.”

2. True 1RM Test
If you choose true 1RM testing for a lift:
The app will schedule a true 1RM test very rarely:
About once every 12–16 weeks per lift (2–3× per year at most).
Only one 1RM test per week total:
You’ll never get squat + deadlift + bench 1RM tests in the same week.
Phase and fight constraints:
Only in off-season / general strength phases.
Disabled if you are within 8 weeks of a fight.
Between 1RM tests, the app uses:
RPE-based 1RM estimates and/or 2–5RM tests (if you enabled them) to keep estimates updated.
Summary to show user:
“With this option, you’ll see a true 1-rep max test on a lift only a few times per year, and never close to a fight. It’s for occasional, precise testing – not something you’ll be doing often.”

Global text you can put above the options
How often will I be testing?
By default, the app uses RPE-based 1RM estimation in a 3:1 format – three loading weeks and one deload week. You’ll hit a clean 1–3 rep estimation top set about every 3rd week, then deload.
If you choose 2–5RM testing, those hard test sets happen about every 4–6 weeks per lift, and not in the final weeks before a fight.
If you choose true 1RM testing, those max attempts are limited to every 12–16 weeks per lift and only when you’re far from competition.
The app auto-limits test frequency to protect your recovery and performance in sparring and fights.
