/**
 * Created by user on 2018/3/16/016.
 */
import { ClassProxyStatic } from 'class-proxy';
declare const _classPrototype: (<T>(target: _classPrototype.IClassProxyStatic<T>, all?: boolean) => T) & {
    default: <T>(target: _classPrototype.IClassProxyStatic<T>, all?: boolean) => T;
    classPrototype: <T>(target: _classPrototype.IClassProxyStatic<T>, all?: boolean) => T;
};
declare module _classPrototype {
    interface IClassProxyStatic<T> extends ClassProxyStatic<T> {
    }
}
export = _classPrototype;
