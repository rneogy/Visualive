import React from "react";
import * as d3 from "d3";
import io from "socket.io-client";

class Vis extends React.Component {
  constructor(props) {
    super(props);
    this.socket = io("http://localhost:3000");
    this.state = {
      selectedCountry: ""
    };
  }

  componentDidMount() {
    this.loadChart();

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

    this.socket.on("changeCountry", c => {
      this.dropdown.property("value", c);
      this.renderChart();
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

  loadChart() {
    d3.csv("/data/income.csv").then(data => {
      this.data = data;
      const countryNames = d3.map(data, d => d.country).keys();

      const w = this.divElement.clientWidth;
      const h = document.documentElement.clientHeight;
      this.dx = w / (2040 - 1800);

      const svg = d3
        .select("#vis")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

      svg
        .append("g")
        .attr("id", "xAxis")
        .attr("transform", `translate(0,${0.96 * h})`);

      svg
        .append("g")
        .attr("id", "yAxis")
        .attr("transform", `translate(${0.04 * w}, 0)`);

      this.x = d3
        .scaleLinear()
        .domain([1800, 2040])
        .range([0.05 * w, 0.95 * w]);

      this.xAxis = d3
        .axisBottom()
        .scale(this.x)
        .tickFormat(d3.format("d"));

      this.y = d3.scaleLinear().range([0.95 * h, 0.05 * h]);

      this.yAxis = d3.axisLeft();

      const zoom = d3
        .zoom()
        .scaleExtent([0.8, 20])
        .translateExtent([[-100, 0], [w + 100, 0]])
        .on("zoom", this.zoomed);

      svg.call(zoom);

      // Clipping
      svg
        .append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("x", 0.05 * w)
        .attr("y", 0.05 * h)
        .attr("width", 0.9 * w)
        .attr("height", 0.9 * h);

      const main = svg
        .append("g")
        .attr("class", "main")
        .attr("clip-path", "url(#clip)");

      this.renderChart = () => {
        this.setState({ selectedCountry: this.dropdown.property("value") });
        console.log("rendering " + this.state.selectedCountry);
        const rawCountryData = data.find(
          d => d.country === this.state.selectedCountry
        );
        const countryData = Object.keys(rawCountryData).reduce((res, k) => {
          if (k !== "country") {
            res.push({ year: +k, income: +rawCountryData[k] });
          }
          return res;
        }, []);

        const maxIncome = d3.max(countryData, d => d.income);

        this.t = this.x;
        this.xAxis.scale(this.t);

        this.y.domain([0, maxIncome]).nice();

        this.yAxis.scale(this.y);

        d3.select("#xAxis")
          .transition()
          .duration(2000)
          .call(this.xAxis);

        d3.select("#yAxis")
          .transition()
          .duration(2000)
          .call(this.yAxis);

        const bars = main.selectAll("rect.bar").data(countryData);

        bars
          .enter()
          .append("rect")
          .classed("bar", true)
          .attr("x", d => {
            return this.x(d.year);
          })
          .attr("y", d => {
            return this.y(d.income) - h / 2;
          })
          .attr("width", this.dx / 2)
          .attr("height", d => 0.95 * h - this.y(d.income))
          .attr("fill", "green")
          .attr("id", (_, i) => "b-" + i)
          .attr("opacity", 0)
          .on("mouseover", this.onMouseOver)
          .on("mouseout", this.onMouseOut)
          .transition()
          .delay((_, i) => i * 3)
          .duration(1000)
          .attr("opacity", 1)
          .attr("y", d => {
            return this.y(d.income);
          });

        bars
          .transition()
          .delay((_, i) => i * 3)
          .duration(1000)
          .attr("x", d => {
            return this.x(d.year);
          })
          .attr("y", d => {
            return this.y(d.income);
          })
          .attr("width", this.dx / 2)
          .attr("height", d => 0.95 * h - this.y(d.income))
          .attr("fill", "green")
          .attr("id", (_, i) => "b-" + i);
      };

      const changeCountry = () => {
        this.socket.emit("changeCountryServer", this.dropdown.property("value"))
        this.renderChart();
      }

      this.dropdown = d3
        .select("body")
        .append("select")
        .attr("id", "country-dropdown")
        .on("change", changeCountry);

      this.dropdown
        .selectAll("option")
        .data(countryNames)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

      this.renderChart();
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
