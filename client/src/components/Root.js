import React from "react";
import TopBar from "./TopBar";
import UserPanel from "./UserPanel";
import * as d3 from "d3";
import io from "socket.io-client";
import { BarVis } from "./BarVis";
import { LineVis } from "./LineVis";
import { ScatterVis } from "./ScatterVis";

const chartTypes = ["bars", "lines", "scatter"];

class Root extends React.Component {
  constructor(props) {
    super(props);
    this.socket = io();
    this.state = {
      selectedCountries: [],
      data: [],
      chartOpen: false,
      chartType: chartTypes[0],
      connections: [],
      tracking: [],
      following: null,
      color: "",
      id: "",
      tracking: false
    };
    d3.csv("/data/income.csv").then(d => {
      this.setState({ data: d });
    });

    this.socket.on("initState", s => {
      this.setState({
        ...s
      });
      console.log(this.state);
    });

    this.socket.on("connectionsUpdate", c => {
      this.setState({ connections: c });
    });

    this.socket.on("changeCountry", c => {
      this.setState({ selectedCountries: c, chartOpen: true });
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

  setChartType = type => {
    this.setState({chartType: type});
  }

  followUser = id => {
    if (this.state.following) {
      this.socket.emit("unfollowUser", this.state.following);
    }
    if (this.state.following === id) {
      this.setState({ following: null });
    } else {
      this.socket.emit("followUser", id);
      this.setState({ following: id });
    }
  };

  trackUser = id => {
    this.socket.emit("trackUser", id);
    this.setState({tracking: true})
  }

  untrackUser = id => {
    this.socket.emit("untrackUser", id);
    this.setState({tracking: false})
  }

  selectCountry = c => {
    let countries = c;
    if (!this.isMultiSelect()) {
      countries = [c];
    }
    countries = countries.map(i => i.value);
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
          <BarVis
            data={this.state.data}
            selected={this.state.selectedCountries}
            socket={this.socket}
            color={this.state.color}
            tracking={this.state.tracking}
            following={this.state.following}
            unfollowUser={this.followUser}
          />
        );
      case "lines":
        return (
          <LineVis
            data={this.state.data}
            selected={this.state.selectedCountries}
            socket={this.socket}
            color={this.state.color}
            tracking={this.state.tracking}
            following={this.state.following}
            unfollowUser={this.followUser}
          />
        );
      case "scatter":
        return (
          <ScatterVis
            data={this.state.data}
            selected={this.state.selectedCountries}
            socket={this.socket}
            color={this.state.color}
            tracking={this.state.tracking}
            following={this.state.following}
            unfollowUser={this.followUser}
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
      case "scatter":
        return false;
    }
  };

  render() {
    if (this.state.data.length > 0) {
      return (
        <div className="container-fluid">
          {this.state.chartOpen ? (
            <div className="row">
              <div className="col-11">{this.renderChart()}</div>
              <div className="col-1">
                <UserPanel
                  users={this.state.connections}
                  followUser={this.followUser}
                  trackUser={this.trackUser}
                  untrackUser={this.untrackUser}
                  following={this.state.following}
                  thisUser={this.state.id}
                />
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
              chartType={this.state.chartType}
              setChartType={this.setChartType}
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
