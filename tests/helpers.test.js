// Pure helper functions — no localStorage, no DOM

describe('estimateMax', () => {
  it('returns weight directly for 1 rep', () => {
    expect(estimateMax(225, 1)).toBe(225)
  })

  it('applies Epley formula rounded to nearest 5', () => {
    // 225 × (1 + 5/30) = 262.5 → round to 265
    expect(estimateMax(225, 5)).toBe(265)
    // 135 × (1 + 8/30) = 171 → round to 170
    expect(estimateMax(135, 8)).toBe(170)
    // 200 × (1 + 10/30) = 266.67 → round to 265
    expect(estimateMax(200, 10)).toBe(265)
  })

  it('returns 0 when weight is missing or zero', () => {
    expect(estimateMax(0, 5)).toBe(0)
    expect(estimateMax(null, 5)).toBe(0)
  })

  it('returns 0 when reps is missing or zero', () => {
    expect(estimateMax(225, 0)).toBe(0)
    expect(estimateMax(225, null)).toBe(0)
  })
})

describe('formatDuration', () => {
  it('formats zero as 0:00', () => {
    expect(formatDuration(0)).toBe('0:00')
  })

  it('pads seconds below 10 with a leading zero', () => {
    expect(formatDuration(65)).toBe('1:05')
    expect(formatDuration(601)).toBe('10:01')
  })

  it('handles exact minutes', () => {
    expect(formatDuration(3600)).toBe('60:00')
    expect(formatDuration(90)).toBe('1:30')
  })
})

describe('rpeColor', () => {
  it('returns muted for falsy RPE', () => {
    expect(rpeColor(null)).toBe('var(--muted)')
    expect(rpeColor(0)).toBe('var(--muted)')
    expect(rpeColor(undefined)).toBe('var(--muted)')
  })

  it('returns green for RPE 5–6', () => {
    expect(rpeColor(5)).toBe('#3a8c4a')
    expect(rpeColor(6)).toBe('#3a8c4a')
  })

  it('returns yellow for RPE 7', () => {
    expect(rpeColor(7)).toBe('#c8a020')
  })

  it('returns orange for RPE 8', () => {
    expect(rpeColor(8)).toBe('#e07820')
  })

  it('returns red for RPE 9–10', () => {
    expect(rpeColor(9)).toBe('#d63a20')
    expect(rpeColor(10)).toBe('#d63a20')
  })
})

describe('dayLabel', () => {
  it('returns uppercase 3-letter abbreviations', () => {
    expect(dayLabel('mon')).toBe('MON')
    expect(dayLabel('wed')).toBe('WED')
    expect(dayLabel('fri')).toBe('FRI')
    expect(dayLabel('sat')).toBe('SAT')
    expect(dayLabel('sun')).toBe('SUN')
  })

  it('uppercases unknown days as fallback', () => {
    expect(dayLabel('xyz')).toBe('XYZ')
  })
})

describe('dayBadgeClass', () => {
  it('maps lift days to their badge classes', () => {
    expect(dayBadgeClass('mon')).toBe('badge-ss-a')
    expect(dayBadgeClass('wed')).toBe('badge-ss-b')
    expect(dayBadgeClass('fri')).toBe('badge-compound')
    expect(dayBadgeClass('sat')).toBe('badge-ss-c')
  })

  it('falls back to badge-z2 for zone 2 / rest days', () => {
    expect(dayBadgeClass('tue')).toBe('badge-z2')
    expect(dayBadgeClass('thu')).toBe('badge-z2')
    expect(dayBadgeClass('sun')).toBe('badge-z2')
  })
})

describe('getNextLiftDay', () => {
  it('cycles through lift days in order', () => {
    expect(getNextLiftDay('mon')).toBe('wed')
    expect(getNextLiftDay('wed')).toBe('fri')
    expect(getNextLiftDay('fri')).toBe('sat')
  })

  it('wraps from sat back to mon', () => {
    expect(getNextLiftDay('sat')).toBe('mon')
  })
})

describe('todayISO', () => {
  it('returns a yyyy-mm-dd formatted string', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('matches the current date', () => {
    const expected = new Date().toISOString().split('T')[0]
    expect(todayISO()).toBe(expected)
  })
})
