import * as d3 from "d3";

class ChartType {
  constructor(
    props,
    svg,
    main,
    zoom,
    x,
    y,
    xAxis,
    yAxis,
    w,
    h,
    barColor,
    transitionDuration
  ) {
    this.props = props;
    this.socket = this.props.socket;
    this.svg = svg;
    this.main = main;
    this.zoom = zoom;
    this.x = x;
    this.y = y;
    this.xAxis = xAxis;
    this.yAxis = yAxis;
    this.w = w;
    this.h = h;
    this.dx = w / (2040 - 1800);
    this.barColor = barColor;
    this.transitionDuration = transitionDuration;
  }

  updateProps(props) {
    this.props = props;
  }

  keydownEventHandler = e => {
    if (e.keyCode === 27) {
      // escape
      this.svg
        .transition()
        .duration(this.transitionDuration)
        .call(this.zoom.transform, d3.zoomIdentity.scale(1));
    }
  };
}

class ChartTypeXZoom extends ChartType {
  onSendZoom = () => {
    this.socket.emit("changeZoomSmoothServer", {
      z: this.t.domain(),
      color: this.props.color
    });
  };

  onTrackZoom = d => {
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
      .attr("opacity", 0.8)
      .attr("display", "initial");
  };

  onSendTrackZoom = () => {
    this.socket.emit("trackZoomServer", {
      z: this.t.domain(),
      color: this.props.color
    });
  };
}

export class Bars extends ChartTypeXZoom {
  wrangleData = data => {
    const rawCountryData = data.find(c => c.country === this.props.selected[0]);
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
    return [countryData, maxIncome];
  };

  render = countryData => {
    console.log("bars!");
    this.t = this.x;
    this.xAxis.scale(this.t);

    const bars = this.main.selectAll("rect.bar").data(countryData);

    bars
      .enter()
      .append("rect")
      .classed("bar", true)
      .attr("x", d => {
        return this.x(d.year);
      })
      .attr("y", d => {
        return this.y(d.income) - this.h / 2;
      })
      .attr("width", this.dx / 2)
      .attr("height", d => 0.95 * this.h - this.y(d.income))
      .attr("fill", this.barColor)
      .attr("id", (_, i) => "b-" + i)
      .attr("opacity", 0)
      .on("mouseover", this.onMouseOverBar)
      .on("mouseout", this.onMouseOutBar)
      .transition()
      .delay((_, i) => i * 3)
      .duration(this.transitionDuration)
      .attr("opacity", 1)
      .attr("y", d => {
        return this.y(d.income);
      });

    bars
      .transition()
      .delay((_, i) => i * 3)
      .duration(this.transitionDuration)
      .attr("x", d => {
        return this.x(d.year);
      })
      .attr("y", d => {
        return this.y(d.income);
      })
      .attr("width", this.dx / 2)
      .attr("height", d => 0.95 * this.h - this.y(d.income))
      .attr("fill", this.barColor)
      .attr("id", (_, i) => "b-" + i);
  };

  onHighlight = d => {
    d3.select("#b-" + d.i)
      .attr("fill", d.color)
      .attr("stroke", d.color)
      .attr("stroke-width", this.dx / 2);
  };

  onUnhighlight = i => {
    d3.select("#b-" + i)
      .attr("fill", this.barColor)
      .attr("stroke", "none");
  };

  onChangeZoom = d => {
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
  };

  onChangeZoomSmooth = d => {
    this.t.domain(d.z);
    this.dx =
      (this.t.range()[1] - this.t.range()[0]) /
      (this.t.domain()[1] - this.t.domain()[0]);
    d3.select("#xAxis")
      .transition()
      .duration(this.transitionDuration)
      .call(this.xAxis);
    d3.selectAll("rect.bar")
      .transition()
      .duration(this.transitionDuration)
      .attr("x", d => {
        return this.t(d.year);
      })
      .attr("width", this.dx / 2);
  };

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
      .attr("fill", this.barColor)
      .attr("stroke", "none");

    d3.select("#t-" + i).remove(); // Remove text location

    this.socket.emit("unhighlightServer", i);
  };

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
}

export class Lines extends ChartTypeXZoom {
  constructor(...args) {
    super(...args);
    this.colors = d3.schemePastel1;
  }

  wrangleData = data => {
    const rawCountryData = [];
    for (const country of data) {
      if (this.props.selected.includes(country.country)) {
        rawCountryData[this.props.selected.indexOf(country.country)] = country;
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

    return [countryData, maxIncome];
  };

  render = countryData => {
    console.log("lines!");

    this.t = this.x;
    this.xAxis.scale(this.t);

    this.line = d3
      .line()
      .x(d => this.t(d.year))
      .y(d => this.y(d.income));

    const paths = this.main.selectAll("path.chart-line").data(countryData);

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
      .duration(this.transitionDuration)
      .attr("opacity", 1);

    paths
      .transition()
      .duration(this.transitionDuration)
      .attr("d", this.line);

    paths
      .exit()
      .transition()
      .duration(this.transitionDuration)
      .attr("opacity", 0)
      .remove();
  };

  onHighlight = d => {
    d3.select("#line-" + d.i)
      .attr("stroke", d.color)
      .classed("selected", true);
  };

  onUnhighlight = i => {
    d3.select("#line-" + i)
      .attr("stroke", this.colors[i])
      .classed("selected", false);
  };

  onChangeZoom = d => {
    this.t.domain(d.z);
    d3.select("#xAxis").call(this.xAxis);
    d3.selectAll(".chart-line").attr("d", this.line);
  };

  onChangeZoomSmooth = d => {
    this.t.domain(d.z);
    d3.select("#xAxis")
      .transition()
      .duration(this.transitionDuration)
      .call(this.xAxis);
    d3.selectAll(".chart-line")
      .transition()
      .duration(this.transitionDuration)
      .attr("d", this.line);
  };

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
    document.querySelector("#tt-" + i).remove();
  };

  zoomed = () => {
    this.t = d3.event.transform.rescaleX(this.x);
    d3.selectAll(".chart-line").attr("d", this.line);
    d3.select("#xAxis").call(this.xAxis.scale(this.t));
    this.socket.emit("changeZoomServer", {
      z: this.t.domain(),
      color: this.props.color
    });
  };
}

export class Scatter extends ChartType {
  wrangleData = data => {
    const rawCountryData = data.find(c => c.country === this.props.selected[0]);
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
    return [countryData, maxIncome];
  };

  render = countryData => {
    this.t = this.x;
    this.xAxis.scale(this.t);

    this.t2 = this.y;
    this.yAxis.scale(this.t2);

    const dots = this.main.selectAll("circle").data(countryData);

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
      .attr("fill", this.barColor)
      .attr("opacity", 0)
      .attr("id", (_, i) => "c-" + i)
      .on("mouseover", this.onMouseOverCircle)
      .on("mouseout", this.onMouseOutCircle)
      .transition()
      .duration(this.transitionDuration)
      .attr("opacity", 1);

    dots
      .transition()
      .delay((_, i) => i * 3)
      .duration(this.transitionDuration)
      .attr("cx", d => {
        return this.x(d.year);
      })
      .attr("cy", d => {
        return this.y(d.income);
      })
      .attr("r", 5)
      .attr("fill", this.barColor)
      .attr("id", (_, i) => "c-" + i);

    dots
      .exit()
      .transition()
      .duration(500)
      .attr("opacity", 0)
      .remove();
  };

  onHighlight = i => {
    d3.select("#b-" + i)
      .attr("fill", "white")
      .classed("selected", true);
  };

  onUnhighlight = i => {
    d3.select("#b-" + i)
      .attr("fill", this.barColor)
      .classed("selected", false);
  };

  onChangeZoom = d => {
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
  };

  onChangeZoomSmooth = d => {};

  onSendZoom = () => {};

  onTrackZoom = d => {};

  onSendTrackZoom = () => {};

  onMouseOverCircle = (d, i) => {
    d3.select("#c-" + i)
      .attr("fill", this.props.color)
      .attr("stroke", this.props.color)
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
      .attr("fill", this.barColor)
      .attr("stroke", "none");

    d3.select("#t-" + i).remove(); // Remove text location

    this.socket.emit("unhighlightServer", i);
  };

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
  };
}
