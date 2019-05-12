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
    console.log(this.props.chartType);
    return (
      <div id="top-bar" className="container-fluid">
        <div className="row">
          <div className="col">
            {this.state.slidden ? (
              <div id="instructions">
                <h6 className="main-title">esc to reset</h6>
                <h6 className="main-title">shift to brush</h6>
                <h6 className="main-title">ctrl to change chart</h6>
              </div>
            ) : null}
          </div>
          <div className="col-8">
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
          <div className="col">
            {this.state.slidden ? (
              <div id="controls">
                <div
                  className="btn-group btn-group-toggle"
                  data-toggle="buttons"
                >
                  <label
                    className={
                      "btn btn-secondary" +
                      (this.props.chartType === "bars" ? " active" : "")
                    }
                  >
                    <input
                      type="radio"
                      onClick={this.props.setChartType.bind(this, "bars")}
                    />
                    Bar
                  </label>
                  <label
                    className={
                      "btn btn-secondary" +
                      (this.props.chartType === "lines" ? " active" : "")
                    }
                  >
                    <input
                      type="radio"
                      onClick={this.props.setChartType.bind(this, "lines")}
                    />
                    Line
                  </label>
                  <label
                    className={
                      "btn btn-secondary" +
                      (this.props.chartType === "scatter" ? " active" : "")
                    }
                  >
                    <input
                      type="radio"
                      onClick={this.props.setChartType.bind(this, "scatter")}
                    />
                    Scatter
                  </label>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }
}

export default TopBar;
