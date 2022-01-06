import React from 'react';
import ReactReduxContext from '../ReactReduxContext';
const useSelector = (selector, equalityFn = shallowEqual) => {
    const { store } = React.useContext(ReactReduxContext);
    let state = store.getState();
    let lastSelectedState = React.useRef(null);
    let selectedState = selector(state);
    //类组件调用setState可以让组件刷新
    let [, forceUpdate] = React.useReducer(x => x + 1, 0);
    //let [state, setState] = React.useState(0);
    React.useLayoutEffect(() => {
        //在此监听仓库中状态的变化事件，仓库中状态变化后执行回调函数
        return store.subscribe(() => {
            //获取新的状态
            let selectedState = selector(store.getState());
            //对比新的状态是相同
            if (!equalityFn(selectedState, lastSelectedState.current)) {
                console.log('counter1 render ');
                forceUpdate();
                lastSelectedState.current = selectedState;
            }
        });
    }, [store]);//按理应该是需要添加store依赖，因为我们一个应用最多只有一个store
    return selectedState;
}
export function shallowEqual(obj1, obj2) {
    if (obj1 === obj2) {
        return true;
    }
    if (typeof obj1 != "object" || obj1 === null || typeof obj2 != "object" || obj2 === null) {
        return false;
    }
    let keys1 = Object.keys(obj1);
    let keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) {
        return false;
    }
    for (let key of keys1) {
        if (!obj2.hasOwnProperty(key) || obj1[key] !== obj2[key]) {
            return false;
        }
    }
    return true;
}
export default useSelector;