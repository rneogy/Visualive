import React from "react";
import Vis from "./Vis";
import Tree from "./Tree";
import TopBar from "./TopBar";
import * as d3 from "d3";
import io from "socket.io-client";

class Root extends React.Component {
  constructor(props) {
    super(props);
    this.socket = io();
    this.state = {
      selectedCountries: [],
      data: []
    };
    d3.csv("/data/income.csv").then(d => {
      this.setState({ data: d });
    });

    this.socket.on("changeCountry", c => {
      console.log(c);
      this.setState({selectedCountries: c});
    });
  }

  selectCountry = c => {
    const countries = c.map(i => i.value);
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
          />
          <Vis
            data={this.state.data}
            selected={this.state.selectedCountries}
            socket={this.socket}
          />
        </div>
      );
    } else {
      return <div>Loading...</div>;
    }
  }
}

export default Root;
