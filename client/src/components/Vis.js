import React from "react";
import * as d3 from "d3";
import io from "socket.io-client";

class Vis extends React.Component {
  constructor(props) {
    super(props);
    this.socket = io("http://localhost:3000");
    this.selectedCountry = "";
  }

  componentDidMount() {
    this.drawChart();

    this.socket.on("highlight", i => {
      console.log("highlighting " + i);
      d3.select("#b-" + i)
        .attr("fill", "red")
        .attr("width", this.dx);
      // .attr("x", this.dx * i - this.dx / 4);
    });

    this.socket.on("unhighlight", i => {
      console.log("unhighlighting " + i);
      d3.select("#b-" + i)
        .attr("fill", "green")
        .attr("width", this.dx / 2)
        .attr("x", this.dx * i);
    });
  }

  onMouseOver = (d, i) => {
    d3.select("#b-" + i)
      .attr("fill", "orange")
      .attr("width", this.dx);
    // .attr("x", this.dx * i - this.dx / 4);

    // Specify where to put label of text
    d3.select("svg")
      .append("text")
      .attr("id", "t-" + i)
      .attr("x", this.dx * i)
      .attr("y", this.y(d.income) - 20)
      .attr("text-anchor", "middle")
      .text(d.year + ": " + d.income);

    this.socket.emit("highlightServer", i);
  };

  onMouseOut = (d, i) => {
    d3.select("#b-" + i)
      .attr("fill", "green")
      .attr("width", this.dx / 2);
    // .attr("x", this.dx * i);

    d3.select("#t-" + i).remove(); // Remove text location

    this.socket.emit("unhighlightServer", i);
  };

  drawChart() {
    d3.csv("/data/income.csv").then(data => {
      this.data = data;
      let countryNames = d3.map(data, d => d.country).keys()

      function onChange() {
        let countryValue = d3.select('select').property('value')
        console.log(countryValue);
      }

      console.log(countryNames);
      let dropdown = d3.select("#vis").append("select").attr("id", "country-dropdown");
      dropdown
        .selectAll("option")
        .data(countryNames)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d)
        .on("change", onChange);

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
        .range([0, w]);

      this.dx = w / (2040 - 1800);

      this.y = d3
        .scaleLinear()
        .domain([0, maxIncome])
        .range([h, 0])
        .nice();

      const svg = d3
        .select("#vis")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

      svg
        .selectAll("rect")
        .data(countryData)
        .enter()
        .append("rect")
        .attr("x", d => {
          return this.x(d.year);
        })
        .attr("y", d => {
          return this.y(d.income);
        })
        .attr("width", this.dx / 2)
        .attr("height", d => h - this.y(d.income))
        .attr("fill", "green")
        .attr("id", (_, i) => "b-" + i)
        .on("mouseover", this.onMouseOver)
        .on("mouseout", this.onMouseOut);

      const zoom = d3.zoom()
                      .scaleExtent([0.5, 20])
                      .translateExtent([[-100, -50], [w + 100, h]])
                      .on("zoom", zoomed);

      d3.select("svg").call(zoom);

      function zoomed() {
        d3.selectAll("rect").attr("transform", d3.event.transform);
      }
    });
  }

  render() {
    return <div id="vis" ref={divElement => (this.divElement = divElement)} />;
  }
}

export default Vis;
