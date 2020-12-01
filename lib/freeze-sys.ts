// copied from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze

function deepFreeze<T>(object: T): T {
  const propNames = Object.getOwnPropertyNames(object)

  for (const name of propNames) {
    // @ts-expect-error
    const value = object[name]

    if (value && typeof value === 'object') {
      deepFreeze(value)
    }
  }

  return Object.freeze(object)
}


export default function freezeSys<T>(obj: T): T {
  // @ts-expect-error
  deepFreeze(obj.sys || {})
  return obj
}
