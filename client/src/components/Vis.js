import React from "react";
import * as d3 from "d3";
import io from "socket.io-client";

class Vis extends React.Component {
  constructor(props) {
    super(props);
    this.socket = io("http://localhost:3000");
  }

  componentDidMount() {
    this.drawChart();

    this.socket.on("highlight", i => {
      d3.select("#b-" + i)
        .attr("fill", "red")
        .attr("width", this.dx);
    });

    this.socket.on("unhighlight", i => {
      d3.select("#b-" + i)
        .attr("fill", "green")
        .attr("width", this.dx / 2);
    });
  }

  onMouseOver = (d, i) => {
    d3.select("#b-" + i)
      .attr("fill", "orange")
      .attr("width", this.dx);

    // Specify where to put label of text
    d3.select("svg")
      .append("text")
      .attr("id", "t-" + i)
      .attr("x", this.t(d.year))
      .attr("y", this.y(d.income) - 20)
      .attr("text-anchor", "middle")
      .text(d.year + ": " + d.income);

    this.socket.emit("highlightServer", i);
  };

  onMouseOut = (d, i) => {
    d3.select("#b-" + i)
      .attr("fill", "green")
      .attr("width", this.dx / 2);

    d3.select("#t-" + i).remove(); // Remove text location

    this.socket.emit("unhighlightServer", i);
  };

  drawChart() {
    d3.csv("/data/income.csv").then(data => {
      this.data = data;
      const w = this.divElement.clientWidth;
      const h = document.documentElement.clientHeight;
      const country = data[0];
      const countryData = Object.keys(country).reduce((res, k) => {
        if (k !== "country") {
          res.push({ year: +k, income: +country[k] });
        }
        return res;
      }, []);

      const maxIncome = d3.max(countryData, d => d.income);

      this.x = d3
        .scaleLinear()
        .domain([1800, 2040])
        .range([0.05 * w, 0.95 * w]);

      this.t = this.x;

      this.xAxis = d3
        .axisBottom()
        .scale(this.t)
        .tickFormat(d3.format("d"));

      this.dx = w / (2040 - 1800);

      this.y = d3
        .scaleLinear()
        .domain([0, maxIncome])
        .range([0.95 * h, 0.05 * h])
        .nice();

      this.yAxis = d3.axisLeft().scale(this.y);

      const svg = d3
        .select("#vis")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

      svg
        .append("g")
        .attr("id", "xAxis")
        .attr("transform", `translate(0,${0.96 * h})`)
        .call(this.xAxis);

      svg
        .append("g")
        .attr("transform", `translate(${0.04 * w}, 0)`)
        .call(this.yAxis);

      const zoom = d3
        .zoom()
        .scaleExtent([0.8, 20])
        .translateExtent([[-100, 0], [w + 100, 0]])
        .on("zoom", this.zoomed);

      d3.select("svg").call(zoom);

      // Clipping
      svg
        .append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("x", 0.05*w)
        .attr("y", 0.05*h)
        .attr("width", 0.9*w)
        .attr("height", 0.9*h);

      const main = svg
        .append("g")
        .attr("class", "main")
        .attr("clip-path", "url(#clip)");

      main
        .selectAll("rect")
        .data(countryData)
        .enter()
        .append("rect")
        .classed("bar", true)
        .attr("x", d => {
          return this.x(d.year);
        })
        .attr("y", d => {
          return this.y(d.income);
        })
        .attr("width", this.dx / 2)
        .attr("height", d => 0.95 * h - this.y(d.income))
        .attr("fill", "green")
        .attr("id", (_, i) => "b-" + i)
        .on("mouseover", this.onMouseOver)
        .on("mouseout", this.onMouseOut);
    });
  }

  zoomed = () => {
    this.t = d3.event.transform.rescaleX(this.x);
    d3.selectAll("rect.bar").attr("x", d => {
      return this.t(d.year);
    });
    d3.select("#xAxis").call(this.xAxis.scale(this.t));
  };

  render() {
    return <div id="vis" ref={divElement => (this.divElement = divElement)} />;
  }
}

export default Vis;
