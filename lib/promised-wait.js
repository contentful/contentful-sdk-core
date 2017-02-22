import { Promise } from 'es6-promise'

export default function promisedWait (ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms || 3000)
  })
}
