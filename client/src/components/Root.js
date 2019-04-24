import React from "react";
import Vis from "./Vis";
import Tree from "./Tree";
import Bars from "./Bars";
import TopBar from "./TopBar";
import * as d3 from "d3";
import io from "socket.io-client";

class Root extends React.Component {
  constructor(props) {
    super(props);
    this.socket = io();
    this.state = {
      selectedCountries: [],
      data: [],
      bars: true
    };
    d3.csv("/data/income.csv").then(d => {
      this.setState({ data: d });
    });

    this.socket.on("changeCountry", c => {
      console.log(c);
      this.setState({ selectedCountries: c });
    });

    this.socket.on("changeChart", b => this.setState({bars: b}));

    document.addEventListener("keydown", e => {
      if (e.keyCode === 17) {
        this.setState({ bars: !this.state.bars });
        this.socket.emit("changeChartServer", this.state.bars);
      }
    });
  }

  selectCountry = c => {
    let countries = c;
    if (this.state.bars) {
      countries = [c];
    }
    countries = countries.map(i => i.value);
    console.log(countries);
    this.setState({
      selectedCountries: countries
    });
    this.socket.emit("changeCountryServer", countries);
  };

  render() {
    if (this.state.data.length > 0) {
      return (
        <div className="container">
          <TopBar
            items={this.state.data.map(d => {
              return { value: d.country, label: d.country };
            })}
            cb={this.selectCountry}
            selected={this.state.selectedCountries}
            multi={!this.state.bars}
          />
          {this.state.bars ? (
            <Bars
              data={this.state.data}
              selected={this.state.selectedCountries}
              socket={this.socket}
            />
          ) : (
            <Vis
              data={this.state.data}
              selected={this.state.selectedCountries}
              socket={this.socket}
            />
          )}
        </div>
      );
    } else {
      return <div>Loading...</div>;
    }
  }
}

export default Root;
