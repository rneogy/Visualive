import React from "react";
import * as d3 from "d3";

class Vis extends React.Component {
  componentDidMount() {
    this.drawChart();
  }

  drawChart() {
    d3.csv("/data/income.csv").then(d => {
      const w = this.divElement.clientWidth;
      const h = document.documentElement.clientHeight;
      console.log(d.columns);

      const svg = d3
        .select("#vis")
        .append("svg")
        .attr("width", w)
        .attr("height", h)

      svg
        .selectAll("rect")
        .data(d)
        .enter()
        .append("rect")
        .attr("x", (d, i) => i * 20)
        .attr("y", (d, i) => h - 10 * i)
        .attr("width", 20)
        .attr("height", (d, i) => i * 10)
        .attr("fill", "green");
    });
  }

  render() {
    return <div id="vis" ref={ (divElement) => this.divElement = divElement}/>;
  }
}

export default Vis;
