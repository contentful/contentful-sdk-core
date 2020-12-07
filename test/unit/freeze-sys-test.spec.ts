import freezeSys from '../../src/freeze-sys'

it('Freezes sys and child objects', () => {
  expect.assertions(2)
  const obj = {
    sys: {
      a: 1,
      b: {
        c: 2,
      },
    },
  }
  const frozen = freezeSys(obj)

  expect(() => {
    frozen.sys.a = 2
  }).toThrowErrorMatchingInlineSnapshot(
    `"Cannot assign to read only property 'a' of object '#<Object>'"`
  )

  expect(() => {
    frozen.sys.b.c = 3
  }).toThrowErrorMatchingInlineSnapshot(
    `"Cannot assign to read only property 'c' of object '#<Object>'"`
  )
})
