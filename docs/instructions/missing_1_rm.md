# Missing 1 RM for each cycle

Percentage-Based Loading: Max Input and Auto-Adjustment Logic

Purpose
If the user chooses percentage-based loading, the app needs a Program Max for each required main lift that is generated in the program. 
If a Program Max is missing, the program starts in Week 1, and missing lifts use RPE-based loading until the app has enough data to estimate a Program Max. Collect all data in Week 1 with the RPE method, and update their 1RM for week 2. Based on the method we will go through here. 
Core Rule
Lift status
App behavior
Max known
Use percentage-based loading from Week 1
Max missing
Use RPE-based loading temporarily
Enough data collected
Estimate Program Max and switch to percentage-based loading

Step 1: Identify Required Percentage-Based Lifts
Only main big lifts need max data.
Examples:
Back squat
Front squat
Bench press
Deadlift
Overhead press
Do not require maxes for:
Accessories
Isolation exercises
Plyos
Throws
Conditioning
Mobility/prehab

Step 2: Ask Max Knowledge Question
Ask:
Do you know your current maxes or estimated maxes for the required main lifts?
Option
App behavior
I know all my maxes
User enters all required maxes. Start Week 1 with percentages.
I know some of my maxes
Known lifts use percentages. Missing lifts use RPE until estimated.
I know none of my maxes
Start Week 1 RPE-based. App estimates Program Maxes for week 2 (using method RPE estimation + Epley).


Step 3: Confidence Adjustment for Known Maxes
For each entered max, ask:
How confident are you that this number reflects your current strength?

Confidence level
Criteria
App action
Very confident
Tested recently, usually within the last 4–8 weeks. 
Use 100% of entered max as Program Max
Somewhat confident
Tested around 8–16 weeks ago. Some uncertainty, but still probably close.
Use 90% of entered max
Not confident
Older than 16 weeks.
Use 80% of entered max


All percentage prescriptions use the Program Max, not the raw entered max.
Example:
User enters squat max = 100 kg.
Confidence
Program Max
Very confident
100 kg
Somewhat confident
90 kg
Not confident
80 kg

If the program says:
Squat 5×5 @ 75%
The app calculates from the Program Max.

Step 4: Missing Maxes
If a required max is missing, do not block the program.
Start Week 1 normally.
For missing lifts, prescribe RPE-based loading.
Example:
Lift
Status
Week 1 prescription
Back squat
Known
4×5 @ 70%
Bench press
Known
4×5 @ 72.5%
Trap-bar deadlift
Missing
3×5 @ RPE 7–8
Overhead press
Missing
3×6 @ RPE 7–8

The app uses the logged RPE-based sets to estimate a Program Max for the next week.

Step 5: Auto-Estimate Program Max From Training Data
When the user logs a main lift with load, reps, and RPE, the app can estimate 1RM.
Use this only when the set is suitable.
Acceptable estimation set:
Main lift
Load entered
Reps entered
RPE entered
RPE between 7 and 9
Reps between 3 and 10 (Try to stay between 3 and 5, very rarely go higher).
Estimated 1RM Calculation
Use RPE/RIR logic.
RPE
Estimated reps in reserve
10
0
9
1
8
2
7
3

Formula:
Estimated max reps = completed reps + estimated reps in reserve
Estimated 1RM = load × (1 + estimated max reps / 30)
Example:
User logs:
140 kg × 5 reps @ RPE 8
Calculation:
5 completed reps
RPE 8 = 2 reps in reserve
Estimated max reps = 7
140 × (1 + 7/30) = 172.7 kg estimated 1RM
Then:
Program Max = 100% of the estimated 1RM (no reduction applied to auto-estimated maxes)
Program Max = 172.7 kg
Round load:
kg: nearest 2.5 kg
lb: nearest 5 lb

Step 6: When to Switch From RPE to Percentage-Based Loading
If the app gets one acceptable estimation set, it can create a Provisional Program Max. Use the best set for the lift. 
From the next exposure of that lift, the app can switch to percentage-based loading
That will then be the new 1RM until a next RM test is introduced. 

Final App Logic
Situation
Default behavior
All maxes known
Start Week 1 with percentages
Some maxes known
Known lifts use %. Missing lifts use RPE until estimated
No maxes known
Start Week 1 RPE-based. Estimate Program Maxes over time


User-Facing Copy
Start Week 1 Now
You can start your program immediately. Lifts with known maxes will use percentage-based loading. Lifts without maxes will use RPE-based loading at first, and the app will estimate your Program Maxes from your logged training data.
Missing Maxes
No problem. We’ll start those lifts with RPE-based loading and estimate your Program Max once enough training data is available.
