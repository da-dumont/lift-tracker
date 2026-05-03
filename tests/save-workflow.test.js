// Prove-It tests for four reported bugs:
// Bug 1: "Save Workout" button does nothing
// Bug 2: Navigate away then back → in-progress session lost
// Bug 3: Dashboard still shows "Start Today's Workout" after saving
// Bug 4: History view crashes after a workout is saved

beforeEach(() => {
  localStorage.clear()
  saveMeta({ programStartDate: todayISO(), maxes: {}, bodyweight: [] })
})

function renderLift(app) {
  // Use Monday (a known lift day) and week 1
  renderLiftLogger(app, 'mon', 1, 'm1', PROGRAM.days.mon)
}

function checkAllCompoundSets(app) {
  app.querySelectorAll('.check-btn[data-type="compound"]').forEach(btn => btn.click())
}

// ─── Bug 1: Save button does nothing ─────────────────
describe('Bug 1 — save button wires up correctly', () => {
  it('clicking Save Workout after completing sets persists a log entry', () => {
    const app = document.getElementById('app')
    app.innerHTML = ''

    renderLift(app)
    checkAllCompoundSets(app)

    const saveBtn = app.querySelector('#save-session')
    expect(saveBtn).not.toBeNull()   // button must exist in DOM
    saveBtn.click()

    // A log entry must have been saved
    const logs = getLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0].type).toBe('lift')
    expect(logs[0].day).toBe('mon')
  })
})

// ─── Bug 2: In-progress state lost on navigation ─────
describe('Bug 2 — draft survives navigation away and back', () => {
  it('restores custom weight after re-rendering the log view', () => {
    const app = document.getElementById('app')
    app.innerHTML = ''

    renderLift(app)

    // Enter a custom weight on the first compound set
    const firstWeightInput = app.querySelector('.weight-input[data-type="compound"][data-set="0"]')
    expect(firstWeightInput).not.toBeNull()
    firstWeightInput.value = '225'
    firstWeightInput.dispatchEvent(new Event('input', { bubbles: true }))

    // Simulate navigation away and back (fresh render)
    app.innerHTML = ''
    renderLift(app)

    // Weight should be restored from draft
    const restoredInput = app.querySelector('.weight-input[data-type="compound"][data-set="0"]')
    expect(restoredInput.value).toBe('225')
  })

  it('clears the draft after a successful save', () => {
    const app = document.getElementById('app')
    app.innerHTML = ''

    renderLift(app)

    // Enter a custom weight
    const wi = app.querySelector('.weight-input[data-type="compound"][data-set="0"]')
    wi.value = '225'
    wi.dispatchEvent(new Event('input', { bubbles: true }))

    // Complete sets and save
    checkAllCompoundSets(app)
    app.querySelector('#save-session').click()

    // Draft should be cleared — a new render should start fresh (default suggested weight)
    app.innerHTML = ''
    renderLift(app)
    const freshInput = app.querySelector('.weight-input[data-type="compound"][data-set="0"]')
    expect(freshInput.value).not.toBe('225')
  })
})

// ─── Bug 3: Dashboard shows stale CTA after saving ───
describe('Bug 3 — dashboard reflects logged state after save', () => {
  it('isTodayLogged returns true for mon after saving a mon workout', () => {
    const app = document.getElementById('app')
    app.innerHTML = ''

    renderLift(app)
    checkAllCompoundSets(app)
    app.querySelector('#save-session').click()

    // The log was saved — isTodayLogged should recognise it
    expect(isTodayLogged('mon')).toBe(true)
  })
})

// ─── Bug 4 & 5: View crashes after saving ────────────
describe('Bug 4 — history view renders after a saved workout', () => {
  it('renders without throwing when a lift log exists', () => {
    const app = document.getElementById('app')
    app.innerHTML = ''

    renderLift(app)
    checkAllCompoundSets(app)
    app.querySelector('#save-session').click()

    // Navigate to history — should not throw
    app.innerHTML = ''
    expect(() => VIEWS['history'](app)).not.toThrow()

    // At least one row should appear
    expect(app.querySelector('.history-row')).not.toBeNull()
  })

  it('progress view renders without throwing when a lift log exists', () => {
    const app = document.getElementById('app')
    app.innerHTML = ''

    renderLift(app)
    checkAllCompoundSets(app)
    app.querySelector('#save-session').click()

    app.innerHTML = ''
    expect(() => VIEWS['progress'](app)).not.toThrow()
  })
})
