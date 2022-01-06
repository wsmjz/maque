// 数据持久化
import React, {Component} from "react";
class PersistGate extends React.Component {
    // 原理：从localStorage里获得数据，然后同步到仓库中去
    componentDidMount() {
        this.props.persistor.initState()
    }
    render() {
        return this.props.children
    }
}
export {
    PersistGate
}