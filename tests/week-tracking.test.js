// getCurrentWeek and isTodayLogged — depend on localStorage meta

beforeEach(() => {
  localStorage.clear()
})

function daysAgoISO(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

describe('getCurrentWeek', () => {
  it('returns 1 when no meta is stored', () => {
    expect(getCurrentWeek()).toBe(1)
  })

  it('returns 1 on the program start day', () => {
    saveMeta({ programStartDate: todayISO() })
    expect(getCurrentWeek()).toBe(1)
  })

  it('returns 1 for days 1–6 after start', () => {
    saveMeta({ programStartDate: daysAgoISO(6) })
    expect(getCurrentWeek()).toBe(1)
  })

  it('returns 2 at exactly 7 days after start', () => {
    saveMeta({ programStartDate: daysAgoISO(7) })
    expect(getCurrentWeek()).toBe(2)
  })

  it('returns 5 at 28 days after start', () => {
    saveMeta({ programStartDate: daysAgoISO(28) })
    expect(getCurrentWeek()).toBe(5)
  })

  it('never exceeds week 12 regardless of elapsed time', () => {
    saveMeta({ programStartDate: daysAgoISO(365) })
    expect(getCurrentWeek()).toBe(12)
  })

  it('never goes below week 1 for future start dates', () => {
    // A start date 7 days in the future gives negative days
    const future = new Date()
    future.setDate(future.getDate() + 7)
    saveMeta({ programStartDate: future.toISOString().split('T')[0] })
    expect(getCurrentWeek()).toBe(1)
  })
})

describe('isTodayLogged', () => {
  it('returns false when no logs exist', () => {
    expect(isTodayLogged('mon')).toBe(false)
  })

  it("returns true when a log with today's date and matching day exists", () => {
    addLog({ id: 'x', day: 'mon', date: todayISO(), type: 'lift' })
    expect(isTodayLogged('mon')).toBe(true)
  })

  it('returns false for a different day', () => {
    addLog({ id: 'x', day: 'mon', date: todayISO(), type: 'lift' })
    expect(isTodayLogged('wed')).toBe(false)
  })

  it('returns false for a log from a previous date', () => {
    addLog({ id: 'x', day: 'mon', date: daysAgoISO(1), type: 'lift' })
    expect(isTodayLogged('mon')).toBe(false)
  })
})
