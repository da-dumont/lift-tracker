// Automation engine — depends on PROGRAM global, no localStorage

describe('getMesoId', () => {
  it('returns m1 for weeks 1–4', () => {
    expect(getMesoId(1)).toBe('m1')
    expect(getMesoId(4)).toBe('m1')
  })

  it('returns m2 for weeks 5–8', () => {
    expect(getMesoId(5)).toBe('m2')
    expect(getMesoId(8)).toBe('m2')
  })

  it('returns m3 for weeks 9–12', () => {
    expect(getMesoId(9)).toBe('m3')
    expect(getMesoId(12)).toBe('m3')
  })
})

describe('isDeload', () => {
  it('returns true for deload weeks 4, 8, and 12', () => {
    expect(isDeload(4)).toBe(true)
    expect(isDeload(8)).toBe(true)
    expect(isDeload(12)).toBe(true)
  })

  it('returns false for all training weeks', () => {
    const trainingWeeks = [1, 2, 3, 5, 6, 7, 9, 10, 11]
    trainingWeeks.forEach(w => expect(isDeload(w)).toBe(false))
  })
})

describe('getMesoLabel', () => {
  it('returns correct label for each mesocycle', () => {
    expect(getMesoLabel(1)).toBe('Hypertrophy')
    expect(getMesoLabel(5)).toBe('Strength-Hypertrophy')
    expect(getMesoLabel(9)).toBe('Strength')
  })

  it('deload weeks still return their mesocycle label', () => {
    expect(getMesoLabel(4)).toBe('Hypertrophy')
    expect(getMesoLabel(8)).toBe('Strength-Hypertrophy')
    expect(getMesoLabel(12)).toBe('Strength')
  })
})

describe('getCompoundScheme', () => {
  it('returns M1 training scheme for week 1', () => {
    const s = getCompoundScheme(1)
    expect(s.sets).toBe(4)
    expect(s.repsMin).toBe(8)
    expect(s.repsMax).toBe(10)
  })

  it('returns M2 training scheme for week 5', () => {
    const s = getCompoundScheme(5)
    expect(s.sets).toBe(4)
    expect(s.repsMin).toBe(6)
    expect(s.repsMax).toBe(8)
  })

  it('returns M3 training scheme for week 9 — more sets, heavier', () => {
    const s = getCompoundScheme(9)
    expect(s.sets).toBe(5)
    expect(s.repsMin).toBe(5)
    expect(s.repsMax).toBe(6)
  })

  it('returns deload scheme for week 4 — fewer sets, load factor instead of range', () => {
    const s = getCompoundScheme(4)
    expect(s.sets).toBe(3)
    expect(s.loadFactor).toBe(0.60)
  })

  it('returns M2 deload scheme for week 8', () => {
    const s = getCompoundScheme(8)
    expect(s.sets).toBe(3)
    expect(s.loadFactor).toBe(0.65)
  })

  it('returns M3 deload/peak scheme for week 12', () => {
    const s = getCompoundScheme(12)
    expect(s.sets).toBe(3)
    expect(s.loadFactor).toBe(0.70)
  })
})

describe('getAccScheme', () => {
  it('returns M1 accessory scheme for week 1', () => {
    const s = getAccScheme(1)
    expect(s.sets).toBe(3)
    expect(s.repsMin).toBe(12)
    expect(s.repsMax).toBe(15)
  })

  it('returns M3 accessory scheme for week 9 — heavier reps', () => {
    const s = getAccScheme(9)
    expect(s.sets).toBe(3)
    expect(s.repsMin).toBe(8)
    expect(s.repsMax).toBe(10)
  })

  it('deload weeks return reduced set count', () => {
    const s = getAccScheme(4)
    expect(s.sets).toBe(2)
    expect(s.repsMin).toBeNull()
    expect(s.repsMax).toBeNull()
  })
})
