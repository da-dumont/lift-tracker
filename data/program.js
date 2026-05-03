/**
 * program.js — 12-Week Hybrid Strength & Mirror Program
 * Single source of truth for all exercise data, progressions, and schemes.
 * Used by the Lift Tracker PWA (lift.ddumont.dev).
 *
 * Structure:
 *   PROGRAM.meta        — mesocycle definitions, deload weeks
 *   PROGRAM.schemes     — compound + accessory rep/load schemes per meso
 *   PROGRAM.days.mon    — Back Squat Focus
 *   PROGRAM.days.tue    — Zone 2
 *   PROGRAM.days.wed    — Bench Press Focus
 *   PROGRAM.days.thu    — Zone 2
 *   PROGRAM.days.fri    — Deadlift Focus
 *   PROGRAM.days.sat    — Overhead Press Focus
 *   PROGRAM.days.sun    — Rest
 */

const PROGRAM = {

  // ─────────────────────────────────────────────
  // META
  // ─────────────────────────────────────────────
  meta: {
    name: "12-Week Strength & Mirror",
    totalWeeks: 12,
    mesocycles: [
      {
        id: "m1",
        label: "Hypertrophy",
        weeks: [1, 2, 3, 4],
        trainingWeeks: [1, 2, 3],
        deloadWeek: 4
      },
      {
        id: "m2",
        label: "Strength-Hypertrophy",
        weeks: [5, 6, 7, 8],
        trainingWeeks: [5, 6, 7],
        deloadWeek: 8
      },
      {
        id: "m3",
        label: "Strength",
        weeks: [9, 10, 11, 12],
        trainingWeeks: [9, 10, 11],
        deloadWeek: 12  // also optional 1RM test week
      }
    ],
    deloadWeeks: [4, 8, 12],
    liftDays: ["mon", "wed", "fri", "sat"],
    zone2Days: ["tue", "thu"],
    restDays: ["sun"]
  },

  // ─────────────────────────────────────────────
  // SCHEMES
  // ─────────────────────────────────────────────
  schemes: {
    compound: {
      m1: { sets: 4, repsMin: 8, repsMax: 10, loadMin: 0.65, loadMax: 0.75, rpe: "7-8" },
      m2: { sets: 4, repsMin: 6, repsMax: 8,  loadMin: 0.75, loadMax: 0.85, rpe: "7-8" },
      m3: { sets: 5, repsMin: 5, repsMax: 6,  loadMin: 0.85, loadMax: 0.90, rpe: "8-9" }
    },
    compoundDeload: {
      m1: { sets: 3, repsMin: 8, repsMax: 8,  loadFactor: 0.60, note: "Deload — reduce load, focus on movement quality" },
      m2: { sets: 3, repsMin: 6, repsMax: 6,  loadFactor: 0.65, note: "Deload — flush fatigue, maintain pattern" },
      m3: { sets: 3, repsMin: 5, repsMax: 5,  loadFactor: 0.70, note: "Peak week — deload or optional 1RM test on Big 4" }
    },
    accessory: {
      m1: { sets: 3, repsMin: 12, repsMax: 15, rpe: "7-8" },
      m2: { sets: 3, repsMin: 10, repsMax: 12, rpe: "7-8" },
      m3: { sets: 3, repsMin: 8,  repsMax: 10, rpe: "8-9" }
    },
    accessoryDeload: {
      sets: 2
    },
    compoundRest: "2-3 min",
    ssARest: "90 sec after round",
    ssBRest: "75 sec after round",
    ssCRest: "60 sec after round"
  },

  // ─────────────────────────────────────────────
  // ZONE 2 PROTOCOL
  // ─────────────────────────────────────────────
  zone2: {
    duration: 60,
    hrMin: 0.60,
    hrMax: 0.70,
    rpeMin: 5,
    rpeMax: 6,
    activities: ["Assault Runner", "Row", "Echo Bike", "Brisk Walk"],
    structure: "5 min easy warmup · 50 min steady · 5 min cool",
    note: "Conversational pace throughout. Running is a single-leg sport — Zone 2 reinforces unilateral work."
  },

  // ─────────────────────────────────────────────
  // DAYS
  // ─────────────────────────────────────────────
  days: {

    // ── MONDAY — BACK SQUAT ──────────────────────
    mon: {
      name: "Back Squat Focus",
      sub: "Quads · Hammies · Lats · Arms · Delts · Core",
      type: "lift",
      compound: {
        name: "Back Squat",
        equipment: "barbell",
        note: "Full depth. Controlled descent. Progressive overload each week.",
        muscleGroup: "quads"
      },
      supersets: [
        {
          id: "ssa",
          label: "SS-A",
          restLabel: "90 sec after round",
          restSeconds: 90,
          m1: {
            equip: ["barbell / DB", "pull-up bar"],
            exercises: [
              {
                letter: "A", name: "Single-Leg RDL",
                isUnilateral: true, uniLabel: "UNILATERAL LOWER",
                muscleGroup: "hamstrings",
                sub: "Hamstrings / glutes · exposes left-right imbalances",
                setsLabel: "3 × 8–10 ea"
              },
              {
                letter: "B", name: "Weighted Pull-ups",
                isUnilateral: false,
                muscleGroup: "lats",
                sub: "Lats · back width · lower body fully resting",
                setsLabel: "3 × 8–10"
              }
            ]
          },
          m2: {
            equip: ["barbell / DB", "cable"],
            exercises: [
              {
                letter: "A", name: "Single-Leg RDL",
                isUnilateral: true, uniLabel: "UNILATERAL LOWER",
                muscleGroup: "hamstrings",
                sub: "Hamstrings / glutes · heavier than M1, controlled tempo",
                setsLabel: "3 × 8 ea"
              },
              {
                letter: "B", name: "Wide-Grip Lat Pulldown",
                isUnilateral: false,
                muscleGroup: "lats",
                sub: "Lats · constant cable tension · different width from pull-ups",
                setsLabel: "3 × 8–10"
              }
            ]
          },
          m3: {
            equip: ["barbell / DB", "pull-up bar"],
            exercises: [
              {
                letter: "A", name: "Single-Leg RDL",
                isUnilateral: true, uniLabel: "UNILATERAL LOWER",
                muscleGroup: "hamstrings",
                sub: "Hamstrings / glutes · heaviest loading, 3-sec eccentric",
                setsLabel: "3 × 6–8 ea"
              },
              {
                letter: "B", name: "Neutral-Grip Pull-ups",
                isUnilateral: false,
                muscleGroup: "lats",
                sub: "Lats / biceps · neutral grip reduces elbow stress",
                setsLabel: "3 × 6–8"
              }
            ]
          }
        },
        {
          id: "ssb",
          label: "SS-B",
          restLabel: "75 sec after round",
          restSeconds: 75,
          m1: {
            equip: ["DB", "cable"],
            exercises: [
              {
                letter: "A", name: "Single-Arm DB Curl",
                isUnilateral: true, uniLabel: "UNILATERAL UPPER",
                muscleGroup: "biceps",
                sub: "Biceps · alternate arms · catches side-to-side gaps",
                setsLabel: "3 × 12–15 ea"
              },
              {
                letter: "B", name: "Tricep Rope Pushdown",
                isUnilateral: false,
                muscleGroup: "triceps",
                sub: "Triceps · cable · antagonist pair, zero fatigue overlap",
                setsLabel: "3 × 12–15"
              }
            ]
          },
          m2: {
            equip: ["incline bench + DB", "cable"],
            exercises: [
              {
                letter: "A", name: "Incline DB Curl",
                isUnilateral: true, uniLabel: "UNILATERAL UPPER",
                muscleGroup: "biceps",
                sub: "Biceps · stretched position · different angle from M1",
                setsLabel: "3 × 10–12 ea"
              },
              {
                letter: "B", name: "Overhead Cable Tricep Extension",
                isUnilateral: false,
                muscleGroup: "triceps",
                sub: "Triceps · long head emphasis · constant cable tension",
                setsLabel: "3 × 10–12"
              }
            ]
          },
          m3: {
            equip: ["cable", "cable"],
            exercises: [
              {
                letter: "A", name: "Single-Arm Cable Curl",
                isUnilateral: true, uniLabel: "UNILATERAL UPPER",
                muscleGroup: "biceps",
                sub: "Biceps · cable constant tension · peak contraction focus",
                setsLabel: "3 × 8–10 ea"
              },
              {
                letter: "B", name: "Straight-Bar Pushdown",
                isUnilateral: false,
                muscleGroup: "triceps",
                sub: "Triceps · heavier load than rope · lateral head emphasis",
                setsLabel: "3 × 8–10"
              }
            ]
          }
        },
        {
          id: "ssc",
          label: "SS-C",
          restLabel: "60 sec after round",
          restSeconds: 60,
          m1: {
            equip: ["DBs", "ab wheel"],
            exercises: [
              {
                letter: "A", name: "DB Lateral Raises",
                isUnilateral: false,
                muscleGroup: "shoulders",
                sub: "Medial delts · shoulder width · arms recovered from curls",
                setsLabel: "3 × 12–15"
              },
              {
                letter: "B", name: "Ab Wheel Rollouts",
                isUnilateral: false,
                muscleGroup: "core",
                sub: "Core · anti-extension · delts rest completely",
                setsLabel: "3 × 8–12"
              }
            ]
          },
          m2: {
            equip: ["cable", "pull-up bar"],
            exercises: [
              {
                letter: "A", name: "Cable Lateral Raises",
                isUnilateral: false,
                muscleGroup: "shoulders",
                sub: "Medial delts · constant tension at bottom of range · different feel to DB",
                setsLabel: "3 × 12–15"
              },
              {
                letter: "B", name: "Hanging Knee Raises",
                isUnilateral: false,
                muscleGroup: "core",
                sub: "Lower abs · grip endurance bonus · delts rest completely",
                setsLabel: "3 × 12–15"
              }
            ]
          },
          m3: {
            equip: ["DBs", "pull-up bar / floor"],
            exercises: [
              {
                letter: "A", name: "Leaning DB Lateral Raises",
                isUnilateral: false,
                muscleGroup: "shoulders",
                sub: "Medial delts · leaning increases ROM at bottom · hardest variation",
                setsLabel: "3 × 10–12"
              },
              {
                letter: "B", name: "L-Sit / Dragon Flag",
                isUnilateral: false,
                muscleGroup: "core",
                sub: "Core · advanced compression strength · delts rest",
                setsLabel: "3 × 15–30s"
              }
            ]
          }
        }
      ]
    },

    // ── TUESDAY — ZONE 2 ─────────────────────────
    tue: { type: "zone2", name: "Zone 2 Cardio", sub: "Aerobic base · 60 min · 60–70% max HR" },

    // ── WEDNESDAY — BENCH PRESS ──────────────────
    wed: {
      name: "Bench Press Focus",
      sub: "Chest · Back · Triceps · Biceps · Calves · Abs",
      type: "lift",
      compound: {
        name: "Barbell Bench Press",
        equipment: "barbell",
        note: "Controlled eccentric. Pause 1 sec at chest on final set.",
        muscleGroup: "chest"
      },
      supersets: [
        {
          id: "ssa",
          label: "SS-A",
          restLabel: "90 sec after round",
          restSeconds: 90,
          m1: {
            equip: ["DBs + bench", "DBs + bench"],
            exercises: [
              {
                letter: "A", name: "Incline DB Press",
                isUnilateral: false,
                muscleGroup: "chest",
                sub: "Upper chest · DBs only, bench already set up",
                setsLabel: "3 × 12–15"
              },
              {
                letter: "B", name: "Chest-Supported Single-Arm DB Row",
                isUnilateral: true, uniLabel: "UNILATERAL UPPER",
                muscleGroup: "back",
                sub: "Rhomboids / mid-back · bench right there · eliminates lower back from pull",
                setsLabel: "3 × 12–15 ea"
              }
            ]
          },
          m2: {
            equip: ["DBs + incline bench", "landmine"],
            exercises: [
              {
                letter: "A", name: "Incline DB Chest Flyes",
                isUnilateral: false,
                muscleGroup: "chest",
                sub: "Upper chest · stretch-focused · different stimulus to press",
                setsLabel: "3 × 10–12"
              },
              {
                letter: "B", name: "Single-Arm Landmine Row",
                isUnilateral: true, uniLabel: "UNILATERAL UPPER",
                muscleGroup: "back",
                sub: "Upper lats · landmine angle hits different than DB row",
                setsLabel: "3 × 10–12 ea"
              }
            ]
          },
          m3: {
            equip: ["cable", "landmine"],
            exercises: [
              {
                letter: "A", name: "Cable Chest Flyes (high-to-low)",
                isUnilateral: false,
                muscleGroup: "chest",
                sub: "Lower pec emphasis · constant cable tension · hardest chest isolation",
                setsLabel: "3 × 10–12"
              },
              {
                letter: "B", name: "Single-Arm Meadows Row",
                isUnilateral: true, uniLabel: "UNILATERAL UPPER",
                muscleGroup: "back",
                sub: "Upper lats / teres · landmine, elbow flares wide · unique angle",
                setsLabel: "3 × 8–10 ea"
              }
            ]
          }
        },
        {
          id: "ssb",
          label: "SS-B",
          restLabel: "75 sec after round",
          restSeconds: 75,
          m1: {
            equip: ["DB / cable", "DBs"],
            exercises: [
              {
                letter: "A", name: "Overhead DB Tricep Extension",
                isUnilateral: false,
                muscleGroup: "triceps",
                sub: "Triceps · long head stretch · no 2nd barbell press",
                setsLabel: "3 × 12–15"
              },
              {
                letter: "B", name: "Hammer Curls",
                isUnilateral: false,
                muscleGroup: "biceps",
                sub: "Brachialis / biceps · antagonist pair · DBs in hand",
                setsLabel: "3 × 12–15"
              }
            ]
          },
          m2: {
            equip: ["dip station", "EZ bar"],
            exercises: [
              {
                letter: "A", name: "Weighted Dips",
                isUnilateral: false,
                muscleGroup: "triceps",
                sub: "Triceps / lower chest · heavier than M1 · bodyweight + load",
                setsLabel: "3 × 8–10"
              },
              {
                letter: "B", name: "EZ Bar Drag Curls",
                isUnilateral: false,
                muscleGroup: "biceps",
                sub: "Biceps · drag bar up torso · different groove to standard curl",
                setsLabel: "3 × 10–12"
              }
            ]
          },
          m3: {
            equip: ["cable", "cable / DB"],
            exercises: [
              {
                letter: "A", name: "Tricep Rope Pushdowns",
                isUnilateral: false,
                muscleGroup: "triceps",
                sub: "Triceps · high volume finisher after heavier dips last meso",
                setsLabel: "3 × 10–12"
              },
              {
                letter: "B", name: "Reverse Curls",
                isUnilateral: false,
                muscleGroup: "biceps",
                sub: "Brachioradialis / forearms · underused, reduces elbow imbalances",
                setsLabel: "3 × 10–12"
              }
            ]
          }
        },
        {
          id: "ssc",
          label: "SS-C",
          restLabel: "60 sec after round",
          restSeconds: 60,
          m1: {
            equip: ["step / plate", "pull-up bar"],
            exercises: [
              {
                letter: "A", name: "Single-Leg Calf Raises",
                isUnilateral: true, uniLabel: "UNILATERAL LOWER",
                muscleGroup: "calves",
                sub: "Gastrocnemius · 3-sec eccentric · critical for runners",
                setsLabel: "3 × 12–15 ea"
              },
              {
                letter: "B", name: "Hanging Knee Raises",
                isUnilateral: false,
                muscleGroup: "core",
                sub: "Lower abs · calves rest completely, zero conflict",
                setsLabel: "3 × 10–15"
              }
            ]
          },
          m2: {
            equip: ["seated calf station", "floor"],
            exercises: [
              {
                letter: "A", name: "Single-Leg Seated Calf Raises",
                isUnilateral: true, uniLabel: "UNILATERAL LOWER",
                muscleGroup: "calves",
                sub: "Soleus · seated targets deeper calf than standing",
                setsLabel: "3 × 12–15 ea"
              },
              {
                letter: "B", name: "Dead Bugs",
                isUnilateral: false,
                muscleGroup: "core",
                sub: "Core · anti-extension with contralateral pattern · calves rest",
                setsLabel: "3 × 10–12 ea"
              }
            ]
          },
          m3: {
            equip: ["step / plate", "GHD / pull-up bar"],
            exercises: [
              {
                letter: "A", name: "Single-Leg Calf Raises (loaded)",
                isUnilateral: true, uniLabel: "UNILATERAL LOWER",
                muscleGroup: "calves",
                sub: "Gastrocnemius · add DB for load · progressed from M1",
                setsLabel: "3 × 10–12 ea"
              },
              {
                letter: "B", name: "Toes-to-Bar / GHD Sit-ups",
                isUnilateral: false,
                muscleGroup: "core",
                sub: "Core / hip flexors · most demanding ab movement in program",
                setsLabel: "3 × 8–12"
              }
            ]
          }
        }
      ]
    },

    // ── THURSDAY — ZONE 2 ────────────────────────
    thu: { type: "zone2", name: "Zone 2 Cardio", sub: "Aerobic base · 60 min · 60–70% max HR" },

    // ── FRIDAY — DEADLIFT ────────────────────────
    fri: {
      name: "Deadlift Focus",
      sub: "Hammies · Lats · Rear Delts · Biceps · Calves · Core",
      type: "lift",
      compound: {
        name: "Conventional / Sumo Deadlift",
        equipment: "barbell",
        note: "Sumo available as elbow/hip-friendly sub. Reset each rep from floor.",
        muscleGroup: "hamstrings"
      },
      supersets: [
        {
          id: "ssa",
          label: "SS-A",
          restLabel: "90 sec after round",
          restSeconds: 90,
          m1: {
            equip: ["cable", "bench / floor"],
            exercises: [
              {
                letter: "A", name: "Half-Kneeling Single-Arm Cable Row",
                isUnilateral: true, uniLabel: "UNILATERAL UPPER",
                muscleGroup: "back",
                sub: "Lats / upper back · kneeling removes leg drive · different angle to DB row",
                setsLabel: "3 × 12–15 ea"
              },
              {
                letter: "B", name: "Single-Leg Hip Thrust",
                isUnilateral: true, uniLabel: "UNILATERAL LOWER",
                muscleGroup: "glutes",
                sub: "Glutes / hamstrings · lats rest completely · key single-leg posterior chain",
                setsLabel: "3 × 10–12 ea"
              }
            ]
          },
          m2: {
            equip: ["landmine", "DBs"],
            exercises: [
              {
                letter: "A", name: "Single-Arm Landmine Row",
                isUnilateral: true, uniLabel: "UNILATERAL UPPER",
                muscleGroup: "back",
                sub: "Lats · landmine angle is more horizontal than cable row · heavier loading",
                setsLabel: "3 × 10–12 ea"
              },
              {
                letter: "B", name: "Deficit Reverse Lunge",
                isUnilateral: true, uniLabel: "UNILATERAL LOWER",
                muscleGroup: "quads",
                sub: "Quads / glutes · front foot elevated · greater ROM than standard lunge",
                setsLabel: "3 × 8–10 ea"
              }
            ]
          },
          m3: {
            equip: ["cable", "bench / floor"],
            exercises: [
              {
                letter: "A", name: "Single-Arm Cable Pulldown",
                isUnilateral: true, uniLabel: "UNILATERAL UPPER",
                muscleGroup: "back",
                sub: "Lats · full overhead stretch to hip · different ROM to rows",
                setsLabel: "3 × 8–10 ea"
              },
              {
                letter: "B", name: "Single-Leg Hip Thrust (weighted)",
                isUnilateral: true, uniLabel: "UNILATERAL LOWER",
                muscleGroup: "glutes",
                sub: "Glutes / hamstrings · add barbell/DB load · progressed from M1",
                setsLabel: "3 × 8–10 ea"
              }
            ]
          }
        },
        {
          id: "ssb",
          label: "SS-B",
          restLabel: "75 sec after round",
          restSeconds: 75,
          m1: {
            equip: ["cable", "DBs + incline bench"],
            exercises: [
              {
                letter: "A", name: "Face Pulls",
                isUnilateral: false,
                muscleGroup: "shoulders",
                sub: "Rear delts · rotator cuff health · cable, posterior shoulder",
                setsLabel: "3 × 15–20"
              },
              {
                letter: "B", name: "Incline DB Curls",
                isUnilateral: false,
                muscleGroup: "biceps",
                sub: "Biceps · full stretch at bottom · rear delts rest completely",
                setsLabel: "3 × 12–15"
              }
            ]
          },
          m2: {
            equip: ["band / cable", "DBs"],
            exercises: [
              {
                letter: "A", name: "Band Pull-Aparts",
                isUnilateral: false,
                muscleGroup: "shoulders",
                sub: "Rear delts / rhomboids · high rep · different from cable face pull",
                setsLabel: "3 × 20–25"
              },
              {
                letter: "B", name: "Hammer Curls",
                isUnilateral: false,
                muscleGroup: "biceps",
                sub: "Brachialis · heavier DB load than M1 curls",
                setsLabel: "3 × 10–12"
              }
            ]
          },
          m3: {
            equip: ["DBs", "EZ bar"],
            exercises: [
              {
                letter: "A", name: "Rear Delt DB Flyes",
                isUnilateral: false,
                muscleGroup: "shoulders",
                sub: "Rear delts · prone or bent-over · heaviest rear delt isolation in program",
                setsLabel: "3 × 12–15"
              },
              {
                letter: "B", name: "EZ Bar Curls",
                isUnilateral: false,
                muscleGroup: "biceps",
                sub: "Biceps · bilateral, heavier load · strength bias matches M3 theme",
                setsLabel: "3 × 8–10"
              }
            ]
          }
        },
        {
          id: "ssc",
          label: "SS-C",
          restLabel: "60 sec after round",
          restSeconds: 60,
          m1: {
            equip: ["seated calf station", "floor"],
            exercises: [
              {
                letter: "A", name: "Seated Calf Raises",
                isUnilateral: false,
                muscleGroup: "calves",
                sub: "Soleus · different head from Wed standing variation",
                setsLabel: "4 × 15–20"
              },
              {
                letter: "B", name: "Plank / L-Sit Hold",
                isUnilateral: false,
                muscleGroup: "core",
                sub: "Core · isometric stability · calves rest completely",
                setsLabel: "3 × 30–45s"
              }
            ]
          },
          m2: {
            equip: ["step / plate", "cable"],
            exercises: [
              {
                letter: "A", name: "Single-Leg Calf Raises",
                isUnilateral: true, uniLabel: "UNILATERAL LOWER",
                muscleGroup: "calves",
                sub: "Gastrocnemius · unilateral variation on Friday · runner-specific",
                setsLabel: "3 × 12–15 ea"
              },
              {
                letter: "B", name: "Pallof Press",
                isUnilateral: true, uniLabel: "UNILATERAL CORE",
                muscleGroup: "core",
                sub: "Core · anti-rotation · cable · calves rest, zero conflict",
                setsLabel: "3 × 10–12 ea"
              }
            ]
          },
          m3: {
            equip: ["leg press machine", "ab wheel"],
            exercises: [
              {
                letter: "A", name: "Calf Raises on Leg Press",
                isUnilateral: false,
                muscleGroup: "calves",
                sub: "Both heads · heavy load possible on machine · progressed from bodyweight",
                setsLabel: "3 × 12–15"
              },
              {
                letter: "B", name: "Ab Wheel Rollouts",
                isUnilateral: false,
                muscleGroup: "core",
                sub: "Core · anti-extension · peak difficulty in M3",
                setsLabel: "3 × 8–12"
              }
            ]
          }
        }
      ]
    },

    // ── SATURDAY — OVERHEAD PRESS ────────────────
    sat: {
      name: "Overhead Press Focus",
      sub: "Shoulders · Quads · Back · Triceps · Grip · Core",
      type: "lift",
      compound: {
        name: "Standing Overhead Press",
        equipment: "barbell",
        note: "Strict press. HSPU progressions on final set if chasing that goal.",
        muscleGroup: "shoulders"
      },
      supersets: [
        {
          id: "ssa",
          label: "SS-A",
          restLabel: "90 sec after round",
          restSeconds: 90,
          m1: {
            equip: ["DBs", "DBs"],
            exercises: [
              {
                letter: "A", name: "Bulgarian Split Squats",
                isUnilateral: true, uniLabel: "UNILATERAL LOWER",
                muscleGroup: "quads",
                sub: "Quads / glutes · DBs only · exposes quad imbalances from squat day",
                setsLabel: "3 × 10–12 ea"
              },
              {
                letter: "B", name: "Renegade Row",
                isUnilateral: true, uniLabel: "UNILATERAL UPPER",
                muscleGroup: "back",
                sub: "Upper back · DBs in hand · adds anti-rotation core demand on top of pull",
                setsLabel: "3 × 8–10 ea"
              }
            ]
          },
          m2: {
            equip: ["DBs", "incline bench + DB"],
            exercises: [
              {
                letter: "A", name: "DB Step-ups",
                isUnilateral: true, uniLabel: "UNILATERAL LOWER",
                muscleGroup: "quads",
                sub: "Quads / glutes · drive through heel · different pattern to split squat",
                setsLabel: "3 × 10 ea"
              },
              {
                letter: "B", name: "Single-Arm Incline DB Row",
                isUnilateral: true, uniLabel: "UNILATERAL UPPER",
                muscleGroup: "back",
                sub: "Lats / mid-back · chest on incline bench · different torso angle than renegade",
                setsLabel: "3 × 10–12 ea"
              }
            ]
          },
          m3: {
            equip: ["DBs", "cable"],
            exercises: [
              {
                letter: "A", name: "Deficit Reverse Lunge",
                isUnilateral: true, uniLabel: "UNILATERAL LOWER",
                muscleGroup: "quads",
                sub: "Quads / glutes · front foot elevated · greatest ROM in series",
                setsLabel: "3 × 8–10 ea"
              },
              {
                letter: "B", name: "Single-Arm High Cable Row",
                isUnilateral: true, uniLabel: "UNILATERAL UPPER",
                muscleGroup: "back",
                sub: "Lats · high anchor point · pulls toward hip, maximum lat stretch",
                setsLabel: "3 × 8–10 ea"
              }
            ]
          }
        },
        {
          id: "ssb",
          label: "SS-B",
          restLabel: "75 sec after round",
          restSeconds: 75,
          m1: {
            equip: ["DBs", "cable / DB"],
            exercises: [
              {
                letter: "A", name: "Seated DB Lateral Raises",
                isUnilateral: false,
                muscleGroup: "shoulders",
                sub: "Medial delts · seated removes cheat · after press, keeps shoulders under load",
                setsLabel: "3 × 12–15"
              },
              {
                letter: "B", name: "Cable Tricep Pushdowns",
                isUnilateral: false,
                muscleGroup: "triceps",
                sub: "Triceps · no barbell after OHP · delts rest between rounds",
                setsLabel: "3 × 12–15"
              }
            ]
          },
          m2: {
            equip: ["cable", "EZ bar / DBs"],
            exercises: [
              {
                letter: "A", name: "Cable Lateral Raises",
                isUnilateral: false,
                muscleGroup: "shoulders",
                sub: "Medial delts · constant tension at bottom · harder than seated DB",
                setsLabel: "3 × 12–15"
              },
              {
                letter: "B", name: "DB Skull Crushers",
                isUnilateral: false,
                muscleGroup: "triceps",
                sub: "Triceps · DBs allow more natural wrist rotation · long head stretch",
                setsLabel: "3 × 10–12"
              }
            ]
          },
          m3: {
            equip: ["DBs", "barbell / DBs"],
            exercises: [
              {
                letter: "A", name: "Arnold Press (pump weight)",
                isUnilateral: false,
                muscleGroup: "shoulders",
                sub: "Medial + front delts · rotation hits full delt head · different from straight lateral",
                setsLabel: "3 × 10–12"
              },
              {
                letter: "B", name: "JM Press",
                isUnilateral: false,
                muscleGroup: "triceps",
                sub: "Triceps · hybrid skull crusher / close-grip · heaviest tricep loading in program",
                setsLabel: "3 × 8–10"
              }
            ]
          }
        },
        {
          id: "ssc",
          label: "SS-C",
          restLabel: "60 sec after round",
          restSeconds: 60,
          m1: {
            equip: ["DBs / KBs", "cable"],
            exercises: [
              {
                letter: "A", name: "Farmer's Carry",
                isUnilateral: false,
                muscleGroup: "grip",
                sub: "Grip / traps / core · DBs or KBs · loaded carry",
                setsLabel: "3 × 40 yd"
              },
              {
                letter: "B", name: "Pallof Press",
                isUnilateral: true, uniLabel: "UNILATERAL CORE",
                muscleGroup: "core",
                sub: "Core anti-rotation · cable · grip rests, zero conflict",
                setsLabel: "3 × 10–12 ea"
              }
            ]
          },
          m2: {
            equip: ["KB / DB", "cable"],
            exercises: [
              {
                letter: "A", name: "Single-Arm Overhead Carry",
                isUnilateral: true, uniLabel: "UNILATERAL UPPER",
                muscleGroup: "shoulders",
                sub: "Shoulder stability / core · one arm locks out overhead · harder than farmer's",
                setsLabel: "3 × 30 yd ea"
              },
              {
                letter: "B", name: "Pallof Press",
                isUnilateral: true, uniLabel: "UNILATERAL CORE",
                muscleGroup: "core",
                sub: "Core anti-rotation · cable · carry recovers, same station",
                setsLabel: "3 × 10–12 ea"
              }
            ]
          },
          m3: {
            equip: ["DB / KB", "floor"],
            exercises: [
              {
                letter: "A", name: "Suitcase Carry",
                isUnilateral: true, uniLabel: "UNILATERAL CORE",
                muscleGroup: "core",
                sub: "Core anti-lateral flexion / obliques · hardest carry variation",
                setsLabel: "3 × 40 yd ea"
              },
              {
                letter: "B", name: "Copenhagen Plank",
                isUnilateral: true, uniLabel: "UNILATERAL LOWER",
                muscleGroup: "core",
                sub: "Hip adductors / obliques · uncommon, high value for runners · zero carry conflict",
                setsLabel: "3 × 20–30s ea"
              }
            ]
          }
        }
      ]
    },

    // ── SUNDAY — REST ────────────────────────────
    sun: { type: "rest", name: "Rest Day", sub: "Recovery · mobility · next session: Monday" }

  } // end days

}; // end PROGRAM
