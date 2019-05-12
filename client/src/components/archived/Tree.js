import React from "react";
import * as d3 from "d3";

class Tree extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.drawChart();
  }

  drawChart() {
    var margin = { top: 100, right: 10, bottom: 240, left: 10 },
      width = 600 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom;

    var orientations = {
      "left-to-right": {
        size: [width, height],
        x: function(d) {
          return d.y;
        },
        y: function(d) {
          return d.x;
        }
      }
    };

    var svg = d3
      .select("#tree")
      .selectAll("svg")
      .data(d3.entries(orientations))
      .enter()
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const data = {
      name: "Q1",
      children: [
        {
          name: "A1",
          children: [{ name: "A1" }, { name: "A2" }]
        },
        {
          name: "A2",
          children: [{ name: "A1" }, { name: "A2" }]
        }
      ]
    };

    svg.each(function(orientation) {
      var svg = d3.select(this),
        o = orientation.value;

      // Compute the layout.
      var treemap = d3.tree().size(o.size);

      var nodes = d3.hierarchy(data);

      nodes = treemap(nodes);

      var links = nodes.descendants().slice(1);

      // Create the link lines.
      svg
        .selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .style("stroke", "white")
        .attr("d", function(d) {
          return (
            "M" +
            o.x(d) +
            "," +
            o.y(d) +
            "C" +
            (o.x(d) + o.x(d.parent)) / 2 +
            "," +
            o.y(d) +
            " " +
            (o.x(d) + o.x(d.parent)) / 2 +
            "," +
            o.y(d.parent) +
            " " +
            o.x(d.parent) +
            "," +
            o.y(d.parent)
          );
        });

      // Create the node circles.
      var node = svg
        .selectAll(".node")
        .data(nodes.descendants())
        .enter()
        .append("g");
      node
        .append("circle")
        .attr("class", "node")
        .attr("r", 4.5)
        .attr("cx", o.x)
        .attr("cy", o.y);

      node
        .append("text")
        .text(function(d) {
          return d.data.name;
        })
        .attr("text-anchor", "middle")
        .attr("x", o.x)
        .attr("dy", -10)
        .attr("y", o.y)
        .style("fill", "white");
    });
  }

  render() {
    return <div id="tree" ref={divElement => (this.divElement = divElement)} />;
  }
}

export default Tree;
