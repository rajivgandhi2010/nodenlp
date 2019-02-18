"use strict";
/**
 * Created by user on 2018/3/16/016.
 */
function classPrototype(target, all) {
    // @ts-ignore
    let desc = Object.getOwnPropertyDescriptors(target.prototype);
    let prototype = Object.keys(desc).reduce(function (a, b) {
        if (all || !desc[b].get && !desc[b].set) {
            // @ts-ignore
            a[b] = target.prototype[b];
        }
        return a;
    }, {});
    // @ts-ignore
    return Object.assign({}, target.prototype, prototype);
}
const _classPrototype = classPrototype;
_classPrototype.default = _classPrototype.classPrototype = _classPrototype;
module.exports = _classPrototype;
