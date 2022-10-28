import toPlainObject from '../../src/to-plain-object'

it('toPlainObject', () => {
  class TestClassObject {
    private name: string
    private nestedProp: any
    constructor(name: string) {
      this.name = name
      this.nestedProp = {
        int: 42,
        string: 'value',
        array: [0, 'hello'],
      }
    }

    testFunction() {
      return 'test function called'
    }
  }

  const obj = new TestClassObject('class object')
  const result = toPlainObject(obj)

  expect(obj instanceof TestClassObject).toBeTruthy()
  expect(obj).toBe(result)
  expect(typeof result.toPlainObject).toBe('function')
  expect(result).not.toBe(result.toPlainObject())
  expect(result).toEqual(result.toPlainObject())
  expect(obj).toEqual(result.toPlainObject())
})
