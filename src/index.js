import React from './react';
import ReactDOM from './react-dom';

function FunctionComponent(props){
 return <div className="title" style={{ color: 'red' }}><span>{props.name}</span>{props.children}</div>;
}
class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = { number: 0 };
  }
  handleClick = () => {
      // this.setState({ number: this.state.number + 1 });
      console.log(this.state);

  }
  render() {
      return (
          <div>
              <p>{this.props.title}</p>
              <p>number:{this.state.number}</p>
              <button onClick={this.handleClick}>+</button>
          </div>
      )
  }
}

let element1 = (
  <div className="title" style={{ color: "red" }}>
    <span>hello</span>world
    <FunctionComponent name="函数组件">哈哈</FunctionComponent>
    {/* <Main></Main> */}
  </div>
);
// console.log(JSON.stringify(element1));
ReactDOM.render(element1, document.getElementById("root"));
