import React from "react";
import * as d3 from "d3";

const barColor = "#c5d2e8";
const transitionDuration = 1000;

class Lines extends React.Component {
  constructor(props) {
    super(props);
    this.socket = this.props.socket;
    this.data = this.props.data;
    this.colors = d3.schemePastel1;
  }

  componentDidMount() {
    this.loadChart();

    this.socket.on("highlight", d => {
      d3.select("#line-" + d.i)
        .attr("stroke", d.color)
        .classed("selected", true);
    });

    this.socket.on("unhighlight", i => {
      d3.select("#line-" + i)
        .attr("stroke", this.colors[i])
        .classed("selected", false);
    });

    this.socket.on("changeZoom", d => {
      this.t.domain(d);
      d3.selectAll(".chart-line").attr("d", this.line);
    });

    this.socket.on("sendZoom", () => {
      this.socket.emit("changeZoomServer", this.t.domain());
    });

    document.addEventListener("keydown", e => {
      if (e.keyCode === 27) {
        // escape
        this.svg
          .transition()
          .duration(1000)
          .call(this.zoom.transform, d3.zoomIdentity.scale(1));
      }
    });
  }

  onMouseOverLine = (d, i) => {
    d3.select("#line-" + i).classed("selected", true);
    this.socket.emit("highlightServer", { i: i, color: this.props.color });

    const e = d3.event;
    const tt = document.createElement("div");
    tt.classList.add("mytooltip");
    tt.id = "tt-" + i;
    tt.style.left = e.clientX + "px";
    tt.style.top = e.clientY - 40 + "px";
    tt.innerText = this.props.selected[i];
    document.body.prepend(tt);
  };

  onMouseOutLine = (d, i) => {
    d3.select("#line-" + i).classed("selected", false);
    this.socket.emit("unhighlightServer", i);
    document.querySelector("#tt-"+i).remove();
  };

  loadChart() {
    const w = this.divElement.clientWidth;
    const h = this.divElement.clientHeight;
    this.dx = w / (2040 - 1800);

    this.svg = d3
      .select("#vis")
      .append("svg")
      .attr("width", w)
      .attr("height", h);

    this.svg
      .append("g")
      .attr("id", "xAxis")
      .attr("transform", `translate(0,${0.96 * h})`)
      .style("color", barColor);

    this.svg
      .append("g")
      .attr("id", "yAxis")
      .attr("transform", `translate(${0.04 * w}, 0)`)
      .style("color", barColor);

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

    this.zoom = d3
      .zoom()
      .scaleExtent([1, 20])
      .translateExtent([[0, 0], [w, 0]])
      .on("zoom", this.zoomed);

    this.svg.call(this.zoom);

    // Clipping
    this.svg
      .append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("x", 0.05 * w)
      .attr("y", 0.05 * h)
      .attr("width", 0.9 * w)
      .attr("height", 0.9 * h);

    const main = this.svg
      .append("g")
      .attr("class", "main")
      .attr("clip-path", "url(#clip)");

    this.line = d3
      .line()
      .x(d => this.t(d.year))
      .y(d => this.y(d.income));

    this.renderChart = () => {
      console.log("rendering " + this.props.selected);
      const rawCountryData = [];
      for (const country of this.data) {
        if (this.props.selected.includes(country.country)) {
          rawCountryData[
            this.props.selected.indexOf(country.country)
          ] = country;
        }
      }
      if (!rawCountryData) {
        return;
      }
      const countryData = rawCountryData.map(c =>
        Object.keys(c).reduce((res, k) => {
          if (k !== "country") {
            res.push({ year: +k, income: +c[k] });
          }
          return res;
        }, [])
      );

      const maxIncome = d3.max(countryData, c => d3.max(c, d => d.income));

      this.t = this.x;
      this.xAxis.scale(this.t);

      this.y.domain([0, maxIncome]).nice();

      this.yAxis.scale(this.y);

      d3.select("#xAxis")
        .transition()
        .duration(transitionDuration)
        .call(this.xAxis);

      d3.select("#yAxis")
        .transition()
        .duration(transitionDuration)
        .call(this.yAxis);

      const paths = main.selectAll("path.chart-line").data(countryData);

      paths
        .enter()
        .append("path")
        .attr("class", "chart-line")
        .attr("id", (_, i) => "line-" + i)
        .attr("d", this.line)
        .attr("stroke", (_, i) => this.colors[i])
        .attr("opacity", 0)
        .on("mouseover", this.onMouseOverLine)
        .on("mouseout", this.onMouseOutLine)
        .transition()
        .duration(transitionDuration)
        .attr("opacity", 1);

      paths
        .transition()
        .duration(transitionDuration)
        .attr("d", this.line);

      paths
        .exit()
        .transition()
        .duration(500)
        .attr("opacity", 0)
        .remove();
    };

    setTimeout(this.renderChart, 100);
  }

  zoomed = () => {
    this.t = d3.event.transform.rescaleX(this.x);
    // d3.selectAll("rect.bar").attr("x", d => {
    //   return this.t(d.year);
    // });
    d3.selectAll(".chart-line")
      .attr("d", this.line)
    d3.select("#xAxis").call(this.xAxis.scale(this.t));
    this.socket.emit("changeZoomServer", this.t.domain());
  };

  componentDidUpdate = () => {
    this.renderChart();
  };

  // d3 handles rerendering, don't let react rerender unless data changes!
  shouldComponentUpdate(nextProps) {
    return this.props.selected !== nextProps.selected;
  }

  render() {
    return <div id="vis" ref={divElement => (this.divElement = divElement)} />;
  }
}

export default Lines;
