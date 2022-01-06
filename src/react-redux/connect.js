import React from 'react';
import ReactReduxContext from './ReactReduxContext';
import { bindActionCreators } from '../redux';
/**
 * 连接 组件和仓库
 * @param {*} mapStateToProps 把仓库中的状态变成组件的属性 
 * @param {*} mapDispatchToProps  把dispatch方法变成组件的属性
 * @returns 
 */
/* function connect(mapStateToProps, mapDispatchToProps) {
    return function (OldComponent) {
        return class extends React.Component {
            static contextType = ReactReduxContext
            constructor(props, context) {
                super(props);
                const store = context.store;
                this.state = mapStateToProps(store.getState());
                //写在构造函数里只需要执行一次
                this.dispatchProps = bindActionCreators(mapDispatchToProps, store.dispatch);
            }
            componentDidMount() {
                let store = this.context.store;
                this.unsubscribe = store.subscribe(() => {
                    this.setState(mapStateToProps(store.getState()));
                });
            }
            componentWillUnmount() {
                this.unsubscribe();
            }
            render() {
                return <OldComponent {...this.props} {...this.state} {...this.dispatchProps} />
            }
        }
    }
} */

function connect(mapStateToProps, mapDispatchToProps) {
    return function (OldComponent) {
        return function (props) {
            const { store } = React.useContext(ReactReduxContext);
            const { getState, dispatch, subscribe } = store;
            const prevState = getState();
            const stateProps = React.useMemo(() => mapStateToProps(prevState), [prevState]);
            const dispatchProps = React.useMemo(() => {
                //其实mapDispatchToProps有多种写法，常见有三种
                if (typeof mapDispatchToProps === 'function') {
                    return mapDispatchToProps(dispatch);
                } else if (typeof mapDispatchToProps === 'object' && mapDispatchToProps !== null) {
                    return bindActionCreators(mapDispatchToProps, dispatch);
                } else {// null undefined
                    return { dispatch }
                }
            }, [store.dispatch]);
            const [, forceUpdate] = React.useReducer(x => x + 1, 0);
            React.useLayoutEffect(() => {
                return subscribe(forceUpdate);
            }, [subscribe]);
            return <OldComponent {...props} {...stateProps} {...dispatchProps} />
        }
    }
}
export default connect