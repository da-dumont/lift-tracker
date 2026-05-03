// Prove-It tests for future start date bug:
// When programStartDate is in the future, the app should show a
// "not started yet" state instead of letting the user log workouts.

beforeEach(() => {
  localStorage.clear()
})

function daysFromNowISO(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

describe('future start date — dashboard', () => {
  it('does not show Start Today\'s Workout when program has not started', () => {
    saveMeta({ programStartDate: daysFromNowISO(2), maxes: {}, bodyweight: [] })
    const app = document.getElementById('app')
    app.innerHTML = ''
    VIEWS['dashboard'](app)
    expect(app.innerHTML).not.toContain("Start Today's Workout")
  })

  it('does not show Log Zone 2 when program has not started', () => {
    saveMeta({ programStartDate: daysFromNowISO(2), maxes: {}, bodyweight: [] })
    const app = document.getElementById('app')
    app.innerHTML = ''
    VIEWS['dashboard'](app)
    expect(app.innerHTML).not.toContain('Log Zone 2')
  })
})

describe('future start date — log view', () => {
  it('does not render a save button when program has not started', () => {
    saveMeta({ programStartDate: daysFromNowISO(2), maxes: {}, bodyweight: [] })
    const app = document.getElementById('app')
    app.innerHTML = ''
    VIEWS['log'](app)
    expect(app.querySelector('#save-session')).toBeNull()
  })
})
