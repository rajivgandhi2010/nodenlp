/**
 * Created by user on 2018/3/16/016.
 */

import { ClassProxyStatic } from 'class-proxy';

function classPrototype<T>(target: _classPrototype.IClassProxyStatic<T>, all?: boolean): T
{
	// @ts-ignore
	let desc = Object.getOwnPropertyDescriptors(target.prototype);

	let prototype = Object.keys(desc).reduce(function (a, b)
	{
		if (all || !desc[b].get && !desc[b].set)
		{
			// @ts-ignore
			a[b] = target.prototype[b];
		}

		return a;
	}, {});

	// @ts-ignore
	return Object.assign({}, target.prototype, prototype);
}

const _classPrototype = classPrototype as typeof classPrototype & {
	default: typeof classPrototype,
	classPrototype: typeof classPrototype,
};

module _classPrototype
{
	export interface IClassProxyStatic<T> extends ClassProxyStatic<T>
	{

	}
}

_classPrototype.default = _classPrototype.classPrototype = _classPrototype;

export = _classPrototype;
