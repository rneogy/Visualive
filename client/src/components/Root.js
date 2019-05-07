import React from "react";
import Vis from "./Vis";
import Bars from "./Bars";
import TopBar from "./TopBar";
import UserPanel from "./UserPanel";
import * as d3 from "d3";
import io from "socket.io-client";

const chartTypes = ["bars", "lines"];

class Root extends React.Component {
  constructor(props) {
    super(props);
    this.socket = io("http://localhost:3000");
    this.state = {
      selectedCountries: [],
      data: [],
      chartOpen: false,
      chartType: "bars",
      connections: [],
      tracking: [],
      following: null
    };
    d3.csv("/data/income.csv").then(d => {
      this.setState({ data: d });
    });

    this.socket.on("initState", s => {
      this.setState({
        ...s
      });
    });

    this.socket.on("connectionsUpdate", c => {
      this.setState({ connections: c });
      console.log(this.state.connections);
    });

    this.socket.on("changeCountry", c => {
      console.log(c);
      this.setState({ selectedCountries: c });
    });

    this.socket.on("changeChart", t => this.setState({ chartType: t }));

    document.addEventListener("keydown", e => {
      if (e.keyCode === 17) {
        this.setState({
          chartType:
            chartTypes[
              (chartTypes.indexOf(this.state.chartType) + 1) % chartTypes.length
            ]
        });
        this.socket.emit("changeChartServer", this.state.chartType);
      }
    });
  }

  selectCountry = c => {
    let countries = c;
    if (!this.isMultiSelect()) {
      countries = [c];
    }
    countries = countries.map(i => i.value);
    console.log(countries);
    this.setState({
      selectedCountries: countries,
      chartOpen: true
    });
    this.socket.emit("changeCountryServer", countries);
  };

  renderChart = () => {
    switch (this.state.chartType) {
      case "bars":
        return (
          <Bars
            data={this.state.data}
            selected={this.state.selectedCountries}
            socket={this.socket}
          />
        );
      case "lines":
        return (
          <Vis
            data={this.state.data}
            selected={this.state.selectedCountries}
            socket={this.socket}
          />
        );
    }
  };

  isMultiSelect = () => {
    switch (this.state.chartType) {
      case "bars":
        return false;
      case "lines":
        return true;
    }
  };

  render() {
    if (this.state.data.length > 0) {
      return (
        <div className="container-fluid">
          {this.state.chartOpen ? (
            <div className="row">
              <div className="col-10">{this.renderChart()}</div>
              <div className="col-2">
                <UserPanel users={this.state.connections} />
              </div>
            </div>
          ) : null}
          <div className="row">
            <TopBar
              items={this.state.data.map(d => {
                return { value: d.country, label: d.country };
              })}
              cb={this.selectCountry}
              selected={this.state.selectedCountries}
              multi={this.isMultiSelect()}
              slidden={this.state.chartOpen}
            />
          </div>
        </div>
      );
    } else {
      return <div>Loading...</div>;
    }
  }
}

export default Root;
