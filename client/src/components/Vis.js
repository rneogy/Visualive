import React from "react";
import * as d3 from "d3";
import io from "socket.io-client";

class Vis extends React.Component {
  constructor(props) {
    super(props)
    this.socket = io("http://localhost:3000");
  }

  componentDidMount() {
    // this.drawChart();
    this.drawTree();
    document.addEventListener("keydown", this.keypress);
  }

  keypress = () => {
    this.socket.emit("keypress")
  }

  drawChart() {
    d3.csv("/data/income.csv").then(data => {
      const w = this.divElement.clientWidth;
      const h = document.documentElement.clientHeight;
      console.log(data.columns);

      const maxIncome = d3.max(data, d => parseInt(d["1800"]));

      const y = d3
        .scaleLinear()
        .domain([0, maxIncome])
        .range([0, h])
        .nice();

      const svg = d3
        .select("#vis")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

      svg
        .selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", (d, i) => {
          return i * 20;
        })
        .attr("y", d => {
          return h-y(parseInt(d["1800"]));
        })
        .attr("width", 10)
        .attr("height", (d) => y(parseInt(d["1800"])))
        .attr("fill", "green");
    });
  }

  render() {
    return <div id="vis" ref={divElement => (this.divElement = divElement)} />;
  }
}

export default Vis;
