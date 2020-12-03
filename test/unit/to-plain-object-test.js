import test from 'blue-tape'
import {toPlainObject} from "../../lib";

test.only('toPlainObject', (t) => {
    class TestClassObject {
        constructor(name) {
            this.name = name;
            this.nestedProp = {
                int: 42,
                string: 'value',
                array: [0, 'hello']
            }
        }

        testFunction() {
            return "test function called"
        }
    }

    const obj = new TestClassObject('class object');
    const result = toPlainObject(obj);

    t.equals(obj instanceof TestClassObject, true, 'obj is instanceof TestClassObject');
    t.equals(obj, result, 'toPlainObject returns same object');
    t.equals(typeof result.toPlainObject === 'function', true, 'enhanced object has function "toPlainObject"');
    t.notEquals(result, result.toPlainObject(), 'obj.toPlainObject() returns copy');
    t.deepEquals(result, result.toPlainObject(), 'toPlainObject returns of same shape');
    t.deepEquals(obj, result.toPlainObject(), 'toPlainObject returns of same shape as input object');
    t.equals(result.toPlainObject().testFunction, undefined, 'no functions copied to plain object result');
    t.end();
})
