export default function tryDefer (condition = () => true) {
  let _queue: []
  let enqueue = (fn, args, errors) => _queue.push({ fn, args, errors })

  function _flush () {
    const queue = _queue
    _queue = []
    return queue
  }

  function replay (queue = _flush()) {
    while(queue.length > 0) {
      attempt(queue.shift())
    }
  }

  function attempt ({ fn, args, errors = [], attempt = 0 }) {
    try {
      if(condition())
        return fn(...args)
      enqueue(fn, args, errors, attempt + 1)
      return { deferred: true, attempt }
    } catch(err) {
      enqueue(fn, args, [ ...errors, err ], attempt + 1)
      return { deferred: false, err, attempt }
    }
  }

  function serialize() {
    const serialized = require('serialize-javascript')({ execute: () => replay(_queue) })
    return `
if(typeof window === 'object') {
  window.__replay__ = ${serialized};
  window.__replay__.execute();
}`
  }

  function reactReplay(React) {
    return props => <script dangerouslySetInnerHTML={{ __html: serialize() }} />
  }

  const defer = { replay, serialize, reactReplay }

  /** Returns a 2 item array of [ thunk, defer ] that wraps a function and functions for replaying in various scenarios. */
  return ([ fn => (...args) => attempt({ fn, args })
          , defer
          ])
}
