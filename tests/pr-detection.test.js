// detectPRs and getSuggestedWeight — depend on localStorage

beforeEach(() => {
  localStorage.clear()
})

// ─── Test fixtures ────────────────────────────────────
function makeLiftLog({ exercise = 'Back Squat', sets = [] } = {}) {
  return {
    id: 'log1',
    type: 'lift',
    day: 'mon',
    week: 1,
    date: todayISO(),
    compound: { exercise, sets },
    supersets: {}
  }
}

function makeSet(weight, reps, completed = true) {
  return { setNum: 1, weight, reps, completed }
}

// ─── detectPRs ────────────────────────────────────────
describe('detectPRs', () => {
  it('returns empty array for a zone2 log', () => {
    const log = { id: 'z', type: 'zone2', day: 'tue' }
    expect(detectPRs(log)).toEqual([])
  })

  it('returns empty array when no sets are completed', () => {
    const log = makeLiftLog({
      sets: [makeSet(225, 5, false)]
    })
    expect(detectPRs(log)).toEqual([])
  })

  it('detects a PR when no prior max exists', () => {
    saveMeta({ programStartDate: todayISO(), maxes: {} })
    const log = makeLiftLog({ sets: [makeSet(225, 5)] })
    const prs = detectPRs(log)
    expect(prs).toHaveLength(1)
    expect(prs[0].exercise).toBe('Back Squat')
    expect(prs[0].weight).toBe(225)
    expect(prs[0].reps).toBe(5)
    expect(prs[0].estimated1RM).toBe(265)
  })

  it('detects a PR when estimated 1RM exceeds the stored max', () => {
    // Stored: 225 × 1 = 225 lbs 1RM
    saveMeta({
      programStartDate: todayISO(),
      maxes: { 'Back Squat': { weight: 225, reps: 1, date: '2026-01-01' } }
    })
    // New set: 230 × 1 = 230 lbs → new PR
    const log = makeLiftLog({ sets: [makeSet(230, 1)] })
    const prs = detectPRs(log)
    expect(prs).toHaveLength(1)
    expect(prs[0].weight).toBe(230)
  })

  it('does NOT detect a PR when estimated 1RM is below the stored max', () => {
    // Stored: 265 lbs 1RM
    saveMeta({
      programStartDate: todayISO(),
      maxes: { 'Back Squat': { weight: 265, reps: 1, date: '2026-01-01' } }
    })
    // New set: 225 × 5 = est. 265 — equal, not greater
    const log = makeLiftLog({ sets: [makeSet(225, 5)] })
    expect(detectPRs(log)).toEqual([])
  })

  it('picks the best set within the session, not the first', () => {
    saveMeta({ programStartDate: todayISO(), maxes: {} })
    const log = makeLiftLog({
      sets: [
        makeSet(185, 5),  // est ~220
        makeSet(205, 5),  // est ~240
        makeSet(225, 5),  // est ~265 — best
      ]
    })
    const prs = detectPRs(log)
    expect(prs[0].weight).toBe(225)
    expect(prs[0].estimated1RM).toBe(265)
  })
})

// ─── savePRs ─────────────────────────────────────────
describe('savePRs', () => {
  it('writes PR entries to meta.maxes', () => {
    saveMeta({ programStartDate: todayISO(), maxes: {} })
    savePRs([{ exercise: 'Back Squat', weight: 225, reps: 5, estimated1RM: 265 }])
    const meta = getMeta()
    expect(meta.maxes['Back Squat'].weight).toBe(225)
    expect(meta.maxes['Back Squat'].reps).toBe(5)
    expect(meta.maxes['Back Squat'].estimated1RM).toBe(265)
  })

  it('is a no-op for an empty PR array', () => {
    saveMeta({ programStartDate: todayISO(), maxes: {} })
    savePRs([])
    expect(getMeta().maxes).toEqual({})
  })

  it('overwrites a previous max with the new PR', () => {
    saveMeta({
      programStartDate: todayISO(),
      maxes: { 'Back Squat': { weight: 200, reps: 1 } }
    })
    savePRs([{ exercise: 'Back Squat', weight: 230, reps: 1, estimated1RM: 230 }])
    expect(getMeta().maxes['Back Squat'].weight).toBe(230)
  })
})

// ─── getSuggestedWeight ───────────────────────────────
describe('getSuggestedWeight', () => {
  it('returns null when no previous log and no stored max', () => {
    saveMeta({ programStartDate: todayISO(), maxes: {} })
    expect(getSuggestedWeight('Back Squat', 1)).toBeNull()
  })

  it('uses stored 1RM × load factor when no prior session exists', () => {
    saveMeta({
      programStartDate: todayISO(),
      maxes: { 'Back Squat': { weight: 300, reps: 1 } }
    })
    // Week 1 = M1 training, loadMin = 0.65 → 300 × 0.65 = 195 → rounded to 195
    const suggested = getSuggestedWeight('Back Squat', 1)
    expect(suggested).toBe(195)
  })

  it('returns last session weight when reps were not all at the top', () => {
    saveMeta({ programStartDate: todayISO(), maxes: {} })
    addLog({
      id: 'log1', type: 'lift', day: 'mon', week: 1, date: todayISO(),
      compound: {
        exercise: 'Back Squat',
        sets: [
          { setNum: 1, weight: 185, reps: 8, completed: true },  // below repsMax of 10
        ]
      },
      supersets: {}
    })
    expect(getSuggestedWeight('Back Squat', 1)).toBe(185)
  })

  it('adds 5 lbs when all sets hit the top rep count', () => {
    saveMeta({ programStartDate: todayISO(), maxes: {} })
    addLog({
      id: 'log1', type: 'lift', day: 'mon', week: 1, date: todayISO(),
      compound: {
        exercise: 'Back Squat',
        // repsMax for week 1 (M1) = 10 — all sets hit 10
        sets: [
          { setNum: 1, weight: 185, reps: 10, completed: true },
          { setNum: 2, weight: 185, reps: 10, completed: true },
          { setNum: 3, weight: 185, reps: 10, completed: true },
          { setNum: 4, weight: 185, reps: 10, completed: true },
        ]
      },
      supersets: {}
    })
    expect(getSuggestedWeight('Back Squat', 1)).toBe(190)
  })
})
