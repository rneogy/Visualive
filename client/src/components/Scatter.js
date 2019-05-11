import React from "react";
import * as d3 from "d3";

const barColor = "#c5d2e8";
const highlightColor = "#69efed";
const transitionDuration = 1000;

class Scatter extends React.Component {
  constructor(props) {
    super(props);
    this.socket = this.props.socket;
    this.data = this.props.data;
    this.colors = d3.schemePastel1;
    this.brush = d3.brush();
  }

  componentDidMount() {
    this.loadChart();

    this.socket.on("highlight", i => {
      d3.select("#b-" + i)
        .attr("fill", "white")
        .classed("selected", true);
    });

    this.socket.on("unhighlight", i => {
      d3.select("#b-" + i)
        .attr("fill", barColor)
        .classed("selected", false);
    });

    this.socket.on("changeZoom", d => {
      this.t.domain(d);
      // this.t2.domain(d[1]);
      d3.selectAll("circle").attr("cx", d => {
        return this.t(d.year);
      });
      // d3.selectAll("circle").attr("cy", d => {
      //   return this.t2(d.income);
      // });
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

  onMouseOverCircle = (d, i) => {
    d3.select("#c-" + i)
      .attr("fill", highlightColor)
      .attr("stroke", highlightColor)
      .attr("stroke-width", this.dx / 2);

    // Specify where to put label of text
    d3.select("svg")
      .append("text")
      .attr("id", "t-" + i)
      .attr("x", this.t(d.year))
      .attr("y", this.t2(d.income) - 20)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", "20px")
      .text(d.year + ": $" + d.income);

    this.socket.emit("highlightServer", i);
  };

  onMouseOutCircle = (d, i) => {
    d3.select("#c-" + i)
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
      .translateExtent([[0, 0], [w, h]])
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
      .y(d => this.t2(d.income));

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
      // console.log(countryData);

      const maxIncome = d3.max(countryData, c => c.income);

      this.t = this.x;
      this.xAxis.scale(this.t);

      this.y.domain([0, maxIncome]).nice();

      this.t2 = this.y
      this.yAxis.scale(this.t2);

      d3.select("#xAxis")
        .transition()
        .duration(transitionDuration)
        .call(this.xAxis);

      d3.select("#yAxis")
        .transition()
        .duration(transitionDuration)
        .call(this.yAxis);

      const dots = main.selectAll("circle").data(countryData);

      dots
        .enter()
        .append("circle")
        .classed("dot", true)
        .attr("r", 5)
        .attr("cx", d => {
          return this.x(d.year);
        })
        .attr("cy", d => {
          return this.y(d.income);
        })
        .attr("fill", barColor)
        .attr("opacity", 0)
        .attr("id", (_, i) => "c-" + i)
        .on("mouseover", this.onMouseOverCircle)
        .on("mouseout", this.onMouseOutCircle)
        .transition()
        .duration(transitionDuration)
        .attr("opacity", 1);

      dots
        .transition()
        .delay((_, i) => i * 3)
        .duration(transitionDuration)
        .attr("cx", d => {
          return this.x(d.year);
        })
        .attr("cy", d => {
          return this.y(d.income);
        })
        .attr("r", 5)
        .attr("fill", barColor)
        .attr("id", (_, i) => "c-" + i);

      dots
        .exit()
        .transition()
        .duration(500)
        .attr("opacity", 0)
        .remove();
      

      // brushing
      const remove_brush = () => {
        this.brush.move(main, [[0, 0], [0, 0]]);
        document.getElementsByClassName("overlay")[0].style.display = "none";
        main.on(".brush", null)
      }

      const add_brush = () => {
        main.call(this.brush);
        document.getElementsByClassName("overlay")[0].style.display = "initial";
      }

      // add or remove brush
      document.addEventListener("keydown", e => {
        if (e.keyCode === 16) {
          const brush_overlay = document.getElementsByClassName("overlay")[0]
          if (!brush_overlay) {
            main.call(this.brush)
          } else {
            const displayed = brush_overlay.style.display;
            if (displayed == "none") {
              add_brush();
            } else {
              remove_brush();
            }
          }
        }
      });

      // move lets you brush programmatically
      const move_brush = (x1, x2, y1, y2) => {
        this.brush.move(main, [[this.x(x1), this.y(y1)], [this.x(x2), this.y(y2)]]);
      }
      
      // function called when brush is started or moved, color doesn't work
      const brush_start = function() {
        const selection = document.getElementsByClassName("selection")[0]
        // console.log(selection);
        selection.style.color = "steelblue";

        // console.log(d3.event.selection);
      }
      this.brush.on("start brush", brush_start);
    };

    setTimeout(this.renderChart, 100);
  }

  zoomed = () => {
    this.t = d3.event.transform.rescaleX(this.x);
    d3.selectAll("circle").attr("cx", d => {
      return this.t(d.year);
    });
    this.t2 = d3.event.transform.rescaleY(this.y);
    d3.selectAll("circle").attr("cy", d => {
      return this.t2(d.income);
    });
    d3.select("#xAxis").call(this.xAxis.scale(this.t));
    d3.select("#yAxis").call(this.yAxis.scale(this.t2));
    this.socket.emit("changeZoomServer", this.t.domain());
  };

  componentDidUpdate = () => {
    this.renderChart();
  };

  render() {
    return <div id="vis" ref={divElement => (this.divElement = divElement)} />;
  }
}

export default Scatter;
