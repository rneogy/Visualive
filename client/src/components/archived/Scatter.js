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
    this.extent = null;
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
      this.t.domain(d.x);
      d3.select("#xAxis").call(this.xAxis);
      d3.select("#yAxis").call(this.yAxis);
      this.t2.domain(d.y);
      d3.selectAll("circle").attr("cx", d => {
        return this.t(d.year);
      });
      d3.selectAll("circle").attr("cy", d => {
        return this.t2(d.income);
      });
    });

    this.socket.on("changeBrush", d => {
      this.extent = d;
      const brush_overlay = document.getElementsByClassName("overlay")[0]
      const main = d3.select(".main");
      if (!brush_overlay) {
        main.call(this.brush);
      } else {
        document.getElementsByClassName("overlay")[0].style.display = "initial";
        this.move_brush_to_extent();
      }
    });

    this.socket.on("removeBrush", d => {
      const main = d3.select(".main");
      d3.selectAll("circle").classed("brush-selected", false);
      this.brush.move(main, [[0, 0], [0, 0]]);
      main.on("brush", null);
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

      const maxIncome = d3.max(countryData, c => c.income);

      this.t = this.x;
      this.xAxis.scale(this.t);

      this.y.domain([0, maxIncome]).nice();

      this.t2 = this.y;
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
        .attr("opacity", 0.8);

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
        document.getElementsByClassName("overlay")[0].style.display = "none";
        main.on(".brush", null)

        d3.selectAll("circle").classed("brush-selected", false);
        this.brush.move(main, [[0, 0], [0, 0]]);
        this.extent = null;
        
        this.socket.emit("removeBrushServer", this.extent);
      }

      const add_brush = () => {
        main.call(this.brush);
        document.getElementsByClassName("overlay")[0].style.display = "initial";
      };

      // add or remove brush
      document.addEventListener("keydown", e => {
        if (e.keyCode === 16) {
          const brush_overlay = document.getElementsByClassName("overlay")[0];
          if (!brush_overlay) {
            main.call(this.brush);
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
      const move_brush = (x1, y1, x2, y2) => {
        this.brush.move(main, [[this.t(x1), this.t2(y1)], [this.t(x2), this.t2(y2)]]);
      }

      const is_brushed = (brush_coords, cx, cy) => {
        var x0 = brush_coords[0][0],
            x1 = brush_coords[1][0],
            y0 = brush_coords[0][1],
            y1 = brush_coords[1][1];
        var ret = x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;    // This return TRUE or FALSE depending on if the points is in the selected area
        return ret;
      }
      
      // function called when brush is started or moved, color doesn't work
      const brush_start = () => {
        // const selection = document.getElementsByClassName("selection")[0]
        // selection.style.color = "steelblue";

        var selection = d3.event.selection;
        if (selection) {
          d3.selectAll("circle").classed("brush-selected", (d) => { 
            return is_brushed(selection, this.t(d.year), this.t2(d.income))
          })
          this.extent = [[this.t.invert(selection[0][0]), this.t2.invert(selection[0][1])],
                          [this.t.invert(selection[1][0]), this.t2.invert(selection[1][1])]]
        }
        
        this.socket.emit("changeBrushServer", this.extent);
      }
      this.brush.on("start brush", brush_start);
    };

    setTimeout(this.renderChart, 100);
  }

  move_brush_to_extent = () => {
    const main = d3.select(".main");
    this.brush.move(main, [[this.t(this.extent[0][0]),
                            this.t2(this.extent[0][1])],
                            [this.t(this.extent[1][0]),
                            this.t2(this.extent[1][1])]]);
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
    
    this.socket.emit("changeZoomServer", {
      x: this.t.domain(),
      y: this.t2.domain()
    });
    
    if (this.extent) {
      this.move_brush_to_extent();
      this.socket.emit("changeBrushServer", this.extent);
    }
  };

  shouldComponentUpdate(nextProps) {
    // if (this.props.tracking && !nextProps.tracking) {
    //   const tracker = this.main.select("rect.trackZoom");
    //   tracker.attr("opacity", 0);
    // }
    return this.props.selected !== nextProps.selected;
  }

  componentDidUpdate = () => {
    this.renderChart();
  };

  render() {
    return <div id="vis" ref={divElement => (this.divElement = divElement)} />;
  }
}

export default Scatter;
