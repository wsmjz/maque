import { findDOM, compareTwoVdom } from './react-dom';
class Updater {
    constructor(classInstance) {
        this.classInstance = classInstance;
        this.pendingStates = [];
        this.callbacks = [];
    }
    addState(partialState, callback) {
        this.pendingStates.push(partialState);///等待更新的或者说等待生效的状态
        if (typeof callback === 'function')
            this.callbacks.push(callback);//状态更新后的回调
        this.emitUpdate();
    }
    emitUpdate() {
        this.updateComponent();
    }
    updateComponent() {
        let { classInstance, pendingStates } = this;
        if (pendingStates.length > 0) {
            shouldUpdate(classInstance, this.getState());
        }
    }
    getState() {
        let { classInstance, pendingStates } = this;
        let { state } = classInstance;
        pendingStates.forEach((nextState) => {
            if (typeof nextState === 'function') {
                nextState = nextState(state);
            }
            state = { ...state, ...nextState };
        });
        pendingStates.length = 0;
        return state;
    }
}
function shouldUpdate(classInstance, nextState) {
    classInstance.state = nextState;
    classInstance.forceUpdate();
}
export class Component {
    static isReactComponent = true;
    constructor(props) {
        this.props = props;
        this.state = {};
        this.updater = new Updater(this);
    }
    setState(partialState, callback) {
        this.updater.addState(partialState, callback);
    }
    forceUpdate() {
        let oldRenderVdom = this.oldRenderVdom;
        let oldDOM = findDOM(oldRenderVdom);
        let newRenderVdom = this.render();
        compareTwoVdom(oldDOM.parentNode, oldRenderVdom, newRenderVdom);
        this.oldRenderVdom = newRenderVdom;
    }
}