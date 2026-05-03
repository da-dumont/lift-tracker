// Storage layer — all localStorage reads/writes go through these wrappers

beforeEach(() => {
  localStorage.clear()
})

describe('getMeta / saveMeta', () => {
  it('getMeta returns null when nothing is stored', () => {
    expect(getMeta()).toBeNull()
  })

  it('round-trips a meta object', () => {
    const meta = { programStartDate: '2026-05-01', maxes: {}, bodyweight: [] }
    saveMeta(meta)
    expect(getMeta()).toEqual(meta)
  })

  it('overwrites previous meta on repeated saves', () => {
    saveMeta({ programStartDate: '2026-01-01' })
    saveMeta({ programStartDate: '2026-05-01' })
    expect(getMeta().programStartDate).toBe('2026-05-01')
  })
})

describe('getLogs / saveLogs / addLog / deleteLog', () => {
  it('getLogs returns empty array when nothing is stored', () => {
    expect(getLogs()).toEqual([])
  })

  it('addLog appends an entry', () => {
    const entry = { id: 'abc', type: 'zone2', date: '2026-05-01' }
    addLog(entry)
    expect(getLogs()).toHaveLength(1)
    expect(getLogs()[0]).toEqual(entry)
  })

  it('addLog preserves existing entries', () => {
    addLog({ id: 'a', date: '2026-05-01' })
    addLog({ id: 'b', date: '2026-05-02' })
    expect(getLogs()).toHaveLength(2)
  })

  it('deleteLog removes only the matching entry', () => {
    addLog({ id: 'keep', date: '2026-05-01' })
    addLog({ id: 'remove', date: '2026-05-02' })
    deleteLog('remove')
    const logs = getLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0].id).toBe('keep')
  })

  it('deleteLog with unknown id is a no-op', () => {
    addLog({ id: 'x', date: '2026-05-01' })
    deleteLog('nonexistent')
    expect(getLogs()).toHaveLength(1)
  })
})

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(typeof generateId()).toBe('string')
    expect(generateId().length).toBeGreaterThan(0)
  })

  it('produces unique ids across calls', () => {
    const ids = new Set(Array.from({ length: 100 }, generateId))
    expect(ids.size).toBe(100)
  })
})

describe('importData', () => {
  it('restores meta and logs from a JSON string', () => {
    const data = {
      meta: { programStartDate: '2026-01-01', maxes: {}, bodyweight: [] },
      logs: [{ id: 'z', type: 'zone2' }]
    }
    const result = importData(JSON.stringify(data))
    expect(result).toBe(true)
    expect(getMeta().programStartDate).toBe('2026-01-01')
    expect(getLogs()).toHaveLength(1)
  })

  it('returns false and leaves storage unchanged on invalid JSON', () => {
    saveMeta({ programStartDate: '2026-05-01' })
    const result = importData('not valid json {{{')
    expect(result).toBe(false)
    expect(getMeta().programStartDate).toBe('2026-05-01')
  })

  it('handles partial payloads — meta only', () => {
    const result = importData(JSON.stringify({ meta: { programStartDate: '2026-03-01' } }))
    expect(result).toBe(true)
    expect(getMeta().programStartDate).toBe('2026-03-01')
    expect(getLogs()).toEqual([])
  })
})
