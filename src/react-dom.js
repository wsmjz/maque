import { REACT_TEXT } from "./constants";
function render(vdom, container) {
    debugger
    mount(vdom, container);
}
export function mount(vdom, container) {
    let newDOM = createDOM(vdom);
    container.appendChild(newDOM);
}
export function createDOM(vdom) {
    let { type, props } = vdom;
    let dom;
    if (type === REACT_TEXT) {
        dom = document.createTextNode(props.content);
    } else if (typeof type === "function") {
        if (type.isReactComponent) {
            return mountClassComponent(vdom);
        } else {
            return mountFunctionComponent(vdom);
        }
    }
    else {
        dom = document.createElement(type);
    }
    if (props) {
        updateProps(dom, {}, props);
        if (typeof props.children == "object" && props.children.type) {
            mount(props.children, dom);
        } else if (Array.isArray(props.children)) {
            reconcileChildren(props.children, dom);
        }
    }
    vdom.dom = dom;
    return dom;
}

function mountClassComponent(vdom) {
    let { type, props } = vdom;
    let classInstance = new type(props);
    let renderVdom = classInstance.render();
    classInstance.oldRenderVdom = renderVdom
    return createDOM(renderVdom);
}

function mountFunctionComponent(vdom) {
    let { type, props } = vdom;
    let renderVdom = type(props);
    vdom.oldRenderVdom = renderVdom
    return createDOM(renderVdom);
}

function updateProps(dom, oldProps = {}, newProps = {}) {
    for (let key in newProps) {
        if (key === 'children') {
            continue;
        } else if (key === 'style') {
            let styleObj = newProps[key];
            for (let attr in styleObj) {
                dom.style[attr] = styleObj[attr];
            }
        } else if (/^on[A-Z].*/.test(key)) {
            dom[key.toLowerCase()] = newProps[key]
        } else {
            dom[key] = newProps[key];
        }
    }
    for (let key in oldProps) {
        if (!newProps.hasOwnProperty(key)) {
            dom[key] = null;
        }
    }
}

export function findDOM(vdom) {
    if (!vdom) return null;
    if (vdom.dom) {
        return vdom.dom;
    } else {
        let renderVdom = vdom.oldRenderVdom;
        return findDOM(renderVdom);
    }
}


export function compareTwoVdom(parentDOM, oldVdom, newVdom) {
    let oldDOM = findDOM(oldVdom);
    let newDOM = createDOM(newVdom);
    parentDOM.replaceChild(newDOM, oldDOM);
}
function reconcileChildren(childrenVdom, parentDOM) {
    for (let i = 0; i < childrenVdom.length; i) {
        let childVdom = childrenVdom[i];
        mount(childVdom, parentDOM);
    }
}
const ReactDOM = {
    render,
};
export default ReactDOM;