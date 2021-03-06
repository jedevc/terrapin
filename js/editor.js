import CodeMirror from 'codemirror'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/keymap/sublime'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/monokai.css'

import {TrapProccessor} from './preprocessor'

const LOOP_COUNTER = 'window.LOOP_COUNTER'
const LOOP_MAX = 10000

let tproc = new TrapProccessor({
  for: `if(${LOOP_COUNTER}>${LOOP_MAX}){throw new Error("Possible infinite loop detected");}else{${LOOP_COUNTER}++}`,
  while: `if(${LOOP_COUNTER}>${LOOP_MAX}){throw new Error("Possible infinite loop detected");}else{${LOOP_COUNTER}++}`
})

export default class CodeEditor {
  constructor (textarea, error, delay = 200) {
    this.callbacks = []

    this.error = document.getElementById(error)
    this.internal = CodeMirror.fromTextArea(document.getElementById(textarea), {
      mode: 'javascript',
      theme: 'monokai',
      keyMap: 'sublime',
      lineNumbers: true,
      lineWrapping: true,
      scrollbarStyle: null
    })

    let timeout = null
    this.internal.on('change', () => {
      clearTimeout(timeout)
      timeout = setTimeout(this.update.bind(this), delay)
    })
  }

  onupdate (callback) {
    this.callbacks.push(callback)
  }

  get contents () {
    return this.internal.getValue()
  }

  set contents (data) {
    this.internal.setValue(data)
  }

  update () {
    this.callbacks.forEach(c => c.call())

    let code = this.internal.getValue()
    code = tproc.evaluate(code)
    code = 'window.LOOP_COUNTER = 0\n' + code

    let err = null
    try {
      window.eval(code) // eslint-disable-line no-eval
    } catch (e) {
      err = e
    } finally {
      if (err) {
        this.error.classList.remove('success')
        this.error.classList.add('error')
        this.error.innerHTML = err
      } else {
        this.error.classList.remove('error')
        this.error.classList.add('success')
        this.error.innerHTML = 'No errors!'
      }
    }
  }
}
