import { readFileSync } from 'fs'
import { join } from 'path'

const root = process.cwd()

// Minimal DOM shell that app.js expects at init time
document.body.innerHTML = `
  <header id="appHeader">
    <div class="header-inner"><span id="headerWeek"></span></div>
  </header>
  <main id="app"></main>
  <nav id="bottomNav">
    <button data-nav="dashboard"></button>
    <button data-nav="log"></button>
    <button data-nav="history"></button>
    <button data-nav="progress"></button>
    <button data-nav="program"></button>
  </nav>
`

// Load program.js — promote const PROGRAM → var so indirect eval hoists it to window
const programSrc = readFileSync(join(root, 'data/program.js'), 'utf8')
  .replace('const PROGRAM', 'var PROGRAM')
window.eval(programSrc)

// Load app.js — promote top-level consts that other functions reference
const appSrc = readFileSync(join(root, 'app.js'), 'utf8')
  .replace('const STORAGE_KEYS', 'var STORAGE_KEYS')
  .replace('const VIEWS', 'var VIEWS')
window.eval(appSrc)
