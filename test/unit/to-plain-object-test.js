import test from 'blue-tape'
import {toPlainObject} from "../../lib";

test('toPlainObject', (t) => {
    class TestClassObject  {
        constructor(name) {
            this.name = name;
        }
    }

    const obj = new TestClassObject('class object');
    const result = toPlainObject(obj);

    t.equals(obj instanceof TestClassObject, true, 'obj is instanceof TestClassObject');
    t.equals(obj, result, 'toPlainObject returns same object');
    t.equals(typeof result.toPlainObject === 'function', true, 'enhanced object has function "toPlainObject"');
    t.notEqual(result, result.toPlainObject(), 'obj.toPlainObject() returns copy');
    t.end();
})
