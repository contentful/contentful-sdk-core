// copied from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze

type FreezeObject = {
  [index: string]: any
}

function deepFreeze<T extends FreezeObject>(object: T): T {
  const propNames = Object.getOwnPropertyNames(object)

  for (const name of propNames) {
    const value = object[name]

    if (value && typeof value === 'object') {
      deepFreeze(value)
    }
  }

  return Object.freeze(object)
}

export default function freezeSys<T extends FreezeObject>(obj: T): T {
  deepFreeze(obj.sys || {})
  return obj
}
