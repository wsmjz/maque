import React from 'react';
const NavigationContext = React.createContext();
const LocationContext = React.createContext();
const RouteContext = React.createContext({
    outlet: null,
    matches: []
});
export function Outlet() {
    return useOutlet();
}
export function useOutlet() {
    let outlet = React.useContext(RouteContext).outlet;
    return outlet;
}
/**
 * 路由容器
 * @param {*} children 儿子 
 * @param {*} navigator 历史对象，其实就是history
 * @param {*} location 地址对象 {pathname:"当前路径"}
 * @returns 
 */
function Router({ children, navigator, location }) {
    return (
        <NavigationContext.Provider value={{ navigator }}>
            <LocationContext.Provider value={{ location }}>
                {children}
            </LocationContext.Provider>
        </NavigationContext.Provider>
    )
}
export function useLocation() {
    return React.useContext(LocationContext).location;
}
export function useParams() {
    let { matches } = React.useContext(RouteContext);
    //找到最后一个匹配
    let routeMatch = matches[matches.length - 1];
    //返回匹配结果中的路径参数对象params
    return routeMatch ? routeMatch.params : {};
}
function Routes({ children }) {
    let routes = createRoutesFromChildren(children);
    console.log('routes', routes);
    return useRoutes(routes);
}

/**
 * 自定义的hook 渲染routes
 * @param {*} routes 
 * @returns 
 */
export function useRoutes(routes) {
    let location = useLocation();
    let pathname = location.pathname || '/';// 当前的pathname /user/add
    //把routes和pathname进行匹配
    let matches = matchRoutes(routes, { pathname });
    console.log(matches);
    return _renderMatches(matches);
}
function _renderMatches(matches) {
    if (matches === null) return null;
    // /user 0~1   /user/add 0~2
    return matches.reduceRight((outlet, match, index) => {
        return (
            <RouteContext.Provider value={{
                outlet,
                matches: matches.slice(0, index + 1)
            }}>
                {match.route.element}
            </RouteContext.Provider>
        )
    }, null);
}
/**
 * 用路由配置匹配真正浏览器中的路径对象
 * @param {*} routes 路由配置
 * @param {*} location 当前的浏览器的路径对象
 * @returns 
 */
function matchRoutes(routes, location) {
    //获取当前地址中的路径名
    let pathname = location.pathname || '/';
    //打平所有的分支 把路由进行展开
    let branches = flattenRoutes(routes);
    rankRouteBranches(branches);
    console.log('branches', branches);
    //匹配的结果 
    let matches = null;
    //只要匹配上第一个，后续的就不再匹配了
    for (let i = 0; matches === null && i < branches.length; i++) {
        matches = matchRoutesBranch(branches[i], pathname);
    }
    return matches;
}
function rankRouteBranches(branches) {
    branches.sort((a, b) => {
        if (a.score === b.score) {
            return compareIndexes(
                a.routesMeta.map(meta => meta.childrenIndex),
                b.routesMeta.map(meta => meta.childrenIndex)
            );
        } else {
            //按分数降序排列
            return b.score - a.score;
        }
    });
}
/**
 * a /user/add routesMeta=>[1,1]
 * b /user/list routesMeta=[1,2]
 * 
 * @param {*} a []
 * @param {*} b []
 */
function compareIndexes(a, b) {
    //如果a的长度和B的长度是一样的话，并且a的每一项和b的每一项都相同的话，说明a和b是兄弟
    let siblings = a.length === b.length && a.slice(0, -1).every((n, i) => n === b[i]);
    //如果是兄弟的话就比较 最后一级 
    return siblings ? a[a.length - 1] - b[b.length - 1] : 0;
}
/**
 * 匹配各个分支 
 * 第1级的meta relativePath /user/星/list
 * 第2级的meta relativePath list
 */
function matchRoutesBranch(branch, pathname) {
    //获取当前的分支的meta数组
    let { routesMeta } = branch;
    let matchedParams = {};//匹配的路径参数 
    let matchedPathname = '/';//匹配的路径 /
    let matches = [];
    for (let i = 0; i < routesMeta.length; i++) {
        let meta = routesMeta[i];//获取当前的meta
        let end = i === routesMeta.length - 1;//判断是否是最后一级的meta
        //用来匹配的路径名 对于第一级meta而言，就是pathname /user/add,后续的话会前面匹配到的截取掉再进行匹配
        let remainingPathname = matchedPathname === '/' ? pathname : pathname.slice(matchedPathname.length);
        //开始用正则进行匹配
        let match = matchPath({ path: meta.relativePath, end }, remainingPathname);
        if (!match) return null;
        // /user/:id  /add/:name 合并父子路径参数
        Object.assign(matchedParams, match.params);
        let route = meta.route;
        matches.push({
            params: matchedParams,///最终路径参数对象
            pathname: joinPaths([matchedPathname, match.pathname]), //自己完整的匹配路径
            pathnameBase: joinPaths([matchedPathname, match.pathnameBase]),//?类似于我们父路径或者说基本路径
            route
        });
        if (match.pathnameBase) {
            matchedPathname = joinPaths([matchedPathname, match.pathnameBase]);
        }
    }
    return matches;
}
//如果路径中有*就减少2
const splatPenalty = -2;
const indexRouteValue = 2;
const paramRegexp = /^:\w+$/;
const dynamicSegmentValue = 3;
const emptySegmentValue = 1;
const staticSegmentValue = 10;

const isSplat = s => s === '*';
/**
 * 通过路径和索引计算每个分支的分数
 * @param {*} path  /user/*
 * @param {*} index 
 */
function computeScore(path, index) {
    // /user/add
    let segments = path.split('/');//['','user','*']
    let initialScore = segments.length;//3
    if (segments.some(isSplat)) {
        initialScore += splatPenalty;//1
    }
    if (typeof index !== 'undefined') {
        initialScore += indexRouteValue;//3
    }
    //['','user','*']=>['','user']
    return segments.filter(s => !isSplat(s)).reduce((score, segment) => {
        let currentScope = 0;
        //如果这个片断是路径参数的话 :id
        if (paramRegexp.test(segment)) {
            currentScope += dynamicSegmentValue;
        } else {
            if (segment === '') {
                currentScope += emptySegmentValue;
            } else {
                currentScope += staticSegmentValue;
            }
        }
        score += currentScope;
        return score;
    }, initialScore);

}
/**
 * 把路由进行展开
 * @param {*} routes 路由数组
 * @param {*} branches 分支数组
 * @param {*} parentMeta 父meta数组
 * @param {*} parentPath 父路径字符串
 */
function flattenRoutes(routes, branches = [], parentsMeta = [], parentPath = '') {
    routes.forEach(route => {
        //创建路由元数据
        let meta = {
            relativePath: route.path || '',///相对路径 add
            childrenIndex: route.index,
            route
        }
        //得到当前路由的路径
        let path = joinPaths([parentPath, meta.relativePath]);//   /user/*/add
        //得到当前路由的元数组数组
        let routesMeta = parentsMeta.concat(meta);//[user/*Meta,addMeta]
        //判断如果有儿子的话，展开儿子
        if (route.children && route.children.length > 0) {
            //自己的routesMeta成为儿子们的parentsMeta,自己的path会成为儿子们的parentPath
            flattenRoutes(route.children, branches, routesMeta, path);
        }
        //添加到分支数组中
        branches.push({
            path,//代表此分支的路径
            //给每个分支计算一个分数，后面会按分数对分支进行倒序排序
            score: computeScore(path, route.index),
            routesMeta//代表meta的数组
        });
    });
    return branches;
}
function joinPaths(paths) {
    return paths.join('/').replace(/\/\/+/g, '/');
}
/**
 * 判断此route对应的path路径和地址中的pathname是否匹配
 * @param {*} path 
 * @param {*} pathname 
 */
function matchPath(pattern, pathname) {
    let [matcher, paramNames] = compilePath(pattern.path, pattern.end);
    let match = pathname.match(matcher);
    if (!match) return null;
    //获取当前匹配的路径
    let matchedPathname = match[0];// /user
    //其实就是把结尾的/去掉  /user/add/   /user/add
    let pathnameBase = matchedPathname.replace(/(.)\/+$/, '$1');
    //获取后面分组的值
    let values = match.slice(1);
    //获取捕获的分组
    let captureGroups = match.slice(1);
    let params = paramNames.reduce((memo, paramName, index) => {
        if (paramName === '*') {
            let value = captureGroups[index];
            //生新计算pathnameBase
            pathnameBase = matchedPathname.slice(0, matchedPathname.length - value.length)
                .replace(/(.)\/+$/, '$1');
        }
        memo[paramName] = values[index];
        return memo;
    }, {});
    return {
        params,
        pathname: matchedPathname,//自己匹配到的完整路径 
        pathnameBase,//匹配子路由的基路径
        pattern
    }
}
/**
 * 把路径转化成正则表达式
 * @param {*} path 路径
 * @param {*} end 是否立即结束
 */
function compilePath(path, end) {
    let paramNames = [];
    let regexpSource = "^" + path
        .replace(/\/*\*?$/, '') // 把结尾 的 /*替换 为空   /user*  /user/* /user//* /user//**
        .replace(/^\/*/, '/') //把开始的任意多个星转成一个/    //add=>/add
        .replace(/:(\w+)/g, (_, key) => {
            paramNames.push(key);
            return '([^\\/]+)';
        })
    if (path.endsWith('*')) {// /user/*
        paramNames.push('*');//代表后面的内容可以是任意多个/也可以是/任意内容
        regexpSource += "(?:\\/(.+)|\\/*)$";
    } else {
        regexpSource += end ? "\\/*$" : "(?:\\b|\\/|$)";
    }
    let matcher = new RegExp(regexpSource);
    return [matcher, paramNames];
}
/**
 * 把Route组件的儿子们变成routes数组，如果路由有子元素，也要递归处理
 * @param {*} children 
 * @returns 
 */
function createRoutesFromChildren(children) {
    let routes = [];
    React.Children.forEach(children, child => {
        let route = {
            path: child.props.path,//代表Route的路径
            index: child.index,
            element: child.props.element//代表此Route要渲染的元素
        }
        if (child.props.children) {
            route.children = createRoutesFromChildren(child.props.children);
        }
        routes.push(route);
    });
    return routes;
}
function Route() {

}
export {
    Router,
    Routes,
    Route
}

export function useNavigate() {
    let { navigator } = React.useContext(NavigationContext);
    let navigate = React.useCallback((to) => {
        navigator.push(to);
    }, [navigator]);
    return navigate;
}

export function Navigate({ to }) {
    let navigate = useNavigate();
    React.useEffect(() => {
        navigate(to);
    });
    return null;
}