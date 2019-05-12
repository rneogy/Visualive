import React from "react";
import * as d3 from "d3";

const barColor = "#c5d2e8";
const transitionDuration = 1000;

class Vis extends React.Component {
  constructor(props) {
    super(props);
    this.socket = this.props.socket;
    this.data = this.props.data;
    this.barColor = barColor;
    this.transitionDuration = transitionDuration;
    this.extent = null;
  }

  componentDidMount() {
    this.loadChart();

    this.socket.on("highlight", d => {
      // don't inline since chartType changes!
      this.chartType.onHighlight(d);
    });

    this.socket.on("unhighlight", i => {
      this.chartType.onUnhighlight(i);
    });

    this.socket.on("changeZoom", d => {
      this.chartType.onChangeZoom(d);
    });

    this.socket.on("changeZoomSmooth", d => {
      this.chartType.onChangeZoomSmooth(d);
    });

    this.socket.on("sendZoom", () => {
      this.chartType.onSendZoom();
    });

    this.socket.on("sendTrackZoom", () => {
      this.chartType.onSendTrackZoom();
    });

    this.socket.on("trackZoom", d => {
      this.chartType.onTrackZoom(d);
    });

    document.addEventListener("keydown", this.keydownEventHandler);

    this.socket.on("changeBrush", d => {
      this.chartType.onChangeBrush(d);
    });

    this.socket.on("removeBrush", () => {
      this.chartType.onRemoveBrush();
    });
  }

  keydownEventHandler = (e) => {
    this.chartType.keydownEventHandler(e);
  }

  loadChart() {
    const w = this.divElement.clientWidth;
    const h = this.divElement.clientHeight;
    this.w = w;
    this.h = h;
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

    setTimeout(this.renderChart, 100);
  }

  renderChart = () => {
    console.log("rendering " + this.props.selected);

    const wrangledData = this.chartType.wrangleData(this.data);

    if (!wrangledData) {
      return;
    }

    const countryData = wrangledData[0];
    const maxIncome = wrangledData[1];

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

    this.chartType.render(countryData);
  };

  zoomed = () => {
    this.chartType.zoomed();
    if (this.props.following) {
      this.props.unfollowUser(this.props.following);
    }
  };

  componentDidUpdate = () => {
    this.renderChart();
  };

  // d3 handles rerendering, don't let react rerender unless data changes!
  shouldComponentUpdate(nextProps) {
    if (this.props.tracking && !nextProps.tracking) {
      const tracker = this.main.select("rect.trackZoom");
      tracker.attr("display", "none");
    }
    this.chartType.updateProps(nextProps);
    return (
      this.props.selected !== nextProps.selected ||
      this.props.chartType !== nextProps.chartType
    );
  }

  componentWillUnmount() {
    this.socket.off("highlight");
    this.socket.off("unhighlight");
    this.socket.off("changeZoom");
    this.socket.off("changeZoomSmooth");
    this.socket.off("sendZoom");
    this.socket.off("sendTrackZoom");
    this.socket.off("trackZoom");
    this.socket.off("changeBrush");
    this.socket.off("removeBrush");
    document.removeEventListener("keydown", this.keydownEventHandler);
  }

  render() {
    return (
      <div
        id="vis"
        ref={divElement => (this.divElement = divElement)}
        className={this.props.chartType}
      />
    );
  }
}

export default Vis;
