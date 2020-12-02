import test from 'blue-tape'

import freezeSys from '../../lib/freeze-sys'

test('Freezes sys and child objects', (t) => {
  t.plan(2)
  const obj = {
    sys: {
      a: 1,
      b: {
        c: 2,
      },
    },
  }
  const frozen = freezeSys(obj)
  t.throws(() => {
    frozen.sys.a = 2
  }, /TypeError/)
  t.throws(() => {
    frozen.sys.b.c = 3
  }, /TypeError/)
})
