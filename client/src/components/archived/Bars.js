import React from "react";
import * as d3 from "d3";

const barColor = "#c5d2e8";
const transitionDuration = 1000;

class Bars extends React.Component {
  constructor(props) {
    super(props);
    this.socket = this.props.socket;
    this.data = this.props.data;
  }

  componentDidMount() {
    this.loadChart();

    this.socket.on("highlight", d => {
      d3.select("#b-" + d.i)
        .attr("fill", d.color)
        .attr("stroke", d.color)
        .attr("stroke-width", this.dx / 2);
    });

    this.socket.on("unhighlight", i => {
      d3.select("#b-" + i)
        .attr("fill", barColor)
        .attr("stroke", "none");
    });

    this.socket.on("changeZoom", d => {
      this.t.domain(d.z);
      this.dx =
        (this.t.range()[1] - this.t.range()[0]) /
        (this.t.domain()[1] - this.t.domain()[0]);
      d3.selectAll("rect.bar")
        .attr("x", d => {
          return this.t(d.year);
        })
        .attr("width", this.dx / 2);
      d3.select("#xAxis").call(this.xAxis);
    });

    this.socket.on("changeZoomSmooth", d => {
      this.t.domain(d.z);
      this.dx =
        (this.t.range()[1] - this.t.range()[0]) /
        (this.t.domain()[1] - this.t.domain()[0]);
      d3.select("#xAxis")
        .transition()
        .duration(transitionDuration)
        .call(this.xAxis);
      d3.selectAll("rect.bar")
        .transition()
        .duration(transitionDuration)
        .attr("x", d => {
          return this.t(d.year);
        })
        .attr("width", this.dx / 2);
    });

    this.socket.on("sendZoom", () => {
      console.log("sending zoom to followers!");
      this.socket.emit("changeZoomSmoothServer", {
        z: this.t.domain(),
        color: this.props.color
      });
    });

    this.socket.on("sendTrackZoom", () => {
      this.socket.emit("trackZoomServer", {
        z: this.t.domain(),
        color: this.props.color
      });
    });

    this.socket.on("trackZoom", d => {
      if (!this.props.tracking) {
        return;
      }
      let tracker = this.main.select("rect.trackZoom");
      if (!tracker.node()) {
        tracker = this.main.append("rect").classed("trackZoom", true);
      }
      tracker
        .attr("x", this.t(d.z[0]))
        .attr("y", this.y.range()[1])
        .attr("width", this.t(d.z[1]) - this.t(d.z[0]))
        .attr("height", this.y.range()[0] - this.y.range()[1])
        .attr("stroke", d.color)
        .attr("stroke-width", 5)
        .attr("fill-opacity", 0)
        .attr("opacity", 0.8);
    });

    document.addEventListener("keydown", e => {
      if (e.keyCode === 27) {
        // escape
        this.svg
          .transition()
          .duration(transitionDuration)
          .call(this.zoom.transform, d3.zoomIdentity.scale(1));
      }
    });
  }

  onMouseOverBar = (d, i) => {
    d3.select("#b-" + i)
      .attr("fill", this.props.color)
      .attr("stroke", this.props.color)
      .attr("stroke-width", this.dx / 2);

    // Specify where to put label of text
    d3.select("svg")
      .append("text")
      .attr("id", "t-" + i)
      .attr("x", this.t(d.year))
      .attr("y", this.y(d.income) - 20)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "20px")
      .text(d.year + ": $" + d.income);

    this.socket.emit("highlightServer", { i: i, color: this.props.color });
  };

  onMouseOutBar = (d, i) => {
    d3.select("#b-" + i)
      .attr("fill", barColor)
      .attr("stroke", "none");

    d3.select("#t-" + i).remove(); // Remove text location

    this.socket.emit("unhighlightServer", i);
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

    this.main = this.svg
      .append("g")
      .attr("class", "main")
      .attr("clip-path", "url(#clip)");

    this.renderChart = () => {
      console.log("rendering " + this.props.selected);
      const rawCountryData = this.data.find(
        c => c.country === this.props.selected[0]
      );
      if (!rawCountryData) {
        return;
      }
      const countryData = Object.keys(rawCountryData).reduce((res, k) => {
        if (k !== "country") {
          res.push({ year: +k, income: +rawCountryData[k] });
        }
        return res;
      }, []);

      const maxIncome = d3.max(countryData, c => c.income);

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

      const bars = this.main.selectAll("rect.bar").data(countryData);

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
        .attr("fill", barColor)
        .attr("id", (_, i) => "b-" + i)
        .attr("opacity", 0)
        .on("mouseover", this.onMouseOverBar)
        .on("mouseout", this.onMouseOutBar)
        .transition()
        .delay((_, i) => i * 3)
        .duration(transitionDuration)
        .attr("opacity", 1)
        .attr("y", d => {
          return this.y(d.income);
        });

      bars
        .transition()
        .delay((_, i) => i * 3)
        .duration(transitionDuration)
        .attr("x", d => {
          return this.x(d.year);
        })
        .attr("y", d => {
          return this.y(d.income);
        })
        .attr("width", this.dx / 2)
        .attr("height", d => 0.95 * h - this.y(d.income))
        .attr("fill", barColor)
        .attr("id", (_, i) => "b-" + i);
    };

    setTimeout(this.renderChart, 100);
  }

  zoomed = () => {
    this.t = d3.event.transform.rescaleX(this.x);
    this.dx =
      (this.t.range()[1] - this.t.range()[0]) /
      (this.t.domain()[1] - this.t.domain()[0]);
    d3.selectAll("rect.bar")
      .attr("x", d => {
        return this.t(d.year);
      })
      .attr("width", this.dx / 2);
    d3.select("#xAxis").call(this.xAxis.scale(this.t));
    this.socket.emit("changeZoomServer", {
      z: this.t.domain(),
      color: this.props.color
    });
  };

  componentDidUpdate = () => {
    this.renderChart();
  };

  // d3 handles rerendering, don't let react rerender unless data changes!
  shouldComponentUpdate(nextProps) {
    if (this.props.tracking && !nextProps.tracking) {
      const tracker = this.main.select("rect.trackZoom");
      tracker.attr("opacity", 0);
    }
    return this.props.selected !== nextProps.selected;
  }

  render() {
    return <div id="vis" ref={divElement => (this.divElement = divElement)} />;
  }
}

export default Bars;
