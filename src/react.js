import { wrapToVdom } from "./utils";
import {Component} from './Component';
import { REACT_ELEMENT } from "./constants";
function createElement(type, config, children) {
  let ref;
  let key;
  if (config) {
    delete config.__source;
    delete config.__self;
    ref = config.ref;
    delete config.ref;
    key = config.key;
    delete config.key;
  }
  let props = { ...config };
  if (arguments.length > 3) {
    props.children = Array.prototype.slice.call(arguments, 2).map(wrapToVdom);
  } else {
    props.children = wrapToVdom(children);
  }
  return {
    $$typeof: REACT_ELEMENT,
    type,
    ref,
    key,
    props,
  };
}

function createRef() {
    return {
        current:null
    }
}
function createContext() {}
function PureComponent() {}
function memo() {}
function useState() {}
function useReducer() {}
function useContext() {}
function useRef(content) {
  return content.current
}
function useEffect() {}
function useLayoutEffect() {}

const React = {
  createElement,
  Component,
  PureComponent,
  createContext,
  createRef,
  memo,
  useState,
  useReducer,
  useContext,
  useRef,
  useEffect,
  useLayoutEffect
};
export default React;