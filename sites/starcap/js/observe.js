
require('array.observe')
require('object.observe')

type Observer = ((changes: any) => void)

export function unobserveArray <O> (array: Array<O>, observer: Observer): Observer {
  Object.unobserve(oo[0], oo[1])
}

export function observeArray <O> (
  objects: Array<O>,
  onAdd: (obj: O) => void,
  onRemove: (obj: O) => void
): Observer {
  let observer = (changes) => {
    for (let change of changes) {
      if (change.type === 'splice') {
        for (let removed of change.removed) {
          onRemove(removed)
        }
        for (let i = 0; i < change.addedCount; i ++) {
          onAdd(objects[change.index + i])
        }
      }
    }
  }
  Array.observe(objects, observer)
  return observer
}

export function observeObject <O> (
  object: O,
  onKeyAdded: (obj: O, key: string) => void,
  onKeyRemoved: (obj: O, key: string) => void,
  onKeyChanged: (obj: O, key: string) => void
): Observer {
  let observer = (changes) => {
    for (let change of changes) {
      if (change.type === 'add') {
        onKeyAdded(object, change.name)
      }
      if (change.type === 'update') {
        onKeyChanged(object, change.name)
      }
      if (change.type === 'delete') {
        onKeyRemoved(object, change.name)
      }
    }
  }
  Object.observe(object, observer)
  return observer
}
