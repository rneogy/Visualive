import React from "react";
import * as d3 from "d3";

class Vis extends React.Component {
  componentDidMount() {
    this.drawChart();
  }

  onMouseOver = (d, i) => {
    d3.select("#b-" + i)
      .attr("fill", "orange")
      .attr("width", this.dx)
      .attr("x", this.dx*i - this.dx/4);

    // Specify where to put label of text
    d3.select("svg")
      .append("text")
      .attr("id", "t-" + i)
      .attr("x", this.dx * i)
      .attr("y", this.y(+d["1800"]) - 10)
      .attr("text-anchor", "middle")
      .text(d.country + ": " + d["1800"]);
  };

  onMouseOut = (d, i) => {
    d3.select("#b-" + i)
      .attr("fill", "green")
      .attr("width", this.dx / 2)
      .attr("x", this.dx*i);

    d3.select("#t-" + i).remove(); // Remove text location
  };

  drawChart() {
    d3.csv("/data/income.csv").then(data => {
      const w = this.divElement.clientWidth;
      const h = document.documentElement.clientHeight;

      const maxIncome = d3.max(data, d => parseInt(d["1800"]));

      this.y = d3
        .scaleLinear()
        .domain([0, maxIncome])
        .range([h, 0])
        .nice();

      const countries = data.map(d => d.country);

      this.dx = w / countries.length;

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
          return i * this.dx;
        })
        .attr("y", d => {
          return this.y(parseInt(d["1800"]));
        })
        .attr("width", this.dx / 2)
        .attr("height", d => h - this.y(parseInt(d["1800"])))
        .attr("fill", "green")
        .attr("id", (_, i) => "b-" + i)
        .on("mouseover", this.onMouseOver)
        .on("mouseout", this.onMouseOut);
    });
  }

  render() {
    return <div id="vis" ref={divElement => (this.divElement = divElement)} />;
  }
}

export default Vis;
