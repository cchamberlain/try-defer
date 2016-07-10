export default function tryDefer (condition = () => true) {
  let _queue: []
  let enqueue = (fn, args, errors, attempt) => _queue.push({ fn, args, errors, attempt })

  function replay () {
    const queue = _queue
    _queue = []
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
    const serialized = require('serialize-javascript')({ replay })
    return `
if(typeof window === 'object') {
  var defer = JSON.parse(${serialized});
  defer.replay();
}`
  }

  function reactReplay(React) {
    const serialized = serialize()
    return props => <script dangerouslySetInnerHTML={{ __html: serialized }} />
  }

  const defer = { replay, serialize, reactReplay }

  /** Returns a 2 item array of [ thunk, defer ] that wraps a function and functions for replaying in various scenarios. */
  return ([ fn => (...args) => attempt({ fn, args })
          , defer
          ])
}
