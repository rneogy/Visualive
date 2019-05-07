import React from "react";
import Select from "react-select";

class TopBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      slidden: false
    };
  }

  callback = v => {
    if (!this.state.slidden) {
      document.querySelector("#top-bar").style.top = 0;
      this.setState({ slidden: true });
    }
    this.props.cb(v);
  };

  componentDidMount() {
    if (!this.state.slidden && this.props.slidden) {
      document.querySelector("#top-bar").style.top = 0;
      this.setState({ slidden: true });
    }
  }

  componentDidUpdate() {
    if (this.props.selected.length > 0) {
      if (!this.state.slidden) {
        document.querySelector("#top-bar").style.top = 0;
        this.setState({ slidden: true });
      }
    }
  }

  render() {
    return (
      <div id="top-bar">
        <h2 className="main-title">Average Income Over Time in 2011 USD</h2>
        <Select
          onChange={this.callback}
          options={this.props.items}
          isMulti={this.props.multi}
          id="country-dropdown"
          autoFocus
          value={this.props.selected.map(c => {
            return { label: c, value: c };
          })}
        />
      </div>
    );
  }
}

export default TopBar;
