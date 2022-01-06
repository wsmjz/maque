
/**
 * 创建仓库 
 * @param {*} reducer 计算新状态的处理器
 * @param {*} initialState 初始状态 
 */
 function createStore(reducer, initialState) {
    //先在仓库内部定义一个初始状态
    let state = initialState;
    //监听函数的数组
    let listeners = [];
    function getState() {
        return state;
    }
    function dispatch(action) {
        //先根据老状态和新的动作对象计算新状态
        state = reducer(state, action);
        //让监听函数依次执行
        listeners.forEach(listener => listener());
    }
    function subscribe(listener) {
        listeners.push(listener);
        //返回一个取消此监听的函数
        return () => {
            listeners = listeners.filter(item => item !== listener);
        }
    }
    //派发这个动作是为了给初始状态赋值
    dispatch({ type: '@@REDUX/INIT' });
    return { getState, dispatch, subscribe };
}
export default createStore;