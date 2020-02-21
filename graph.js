"use strict";

(function() {
  let data = "";
  let orig_Data = "";
  let svgContainer = "";
  let tooltipSvg = "";

  window.onload = function() {
    svgContainer = d3
      .select("body")
      .append("svg")
      .attr("width", 1200)
      .attr("height", 700);

    d3.csv("gapminder.csv").then(data => makeScatterPlot(data));
  };

  function makeScatterPlot(csvData) {
    data = csvData.filter(function(d) {
      return d.year == 1980;
    });
    orig_Data = csvData;

    let fert_data = data.map(row => parseFloat(row["fertility"]));
    let life_data = data.map(row => parseFloat(row["life_expectancy"]));
    let pop_data = data.map(row => parseInt(row["population"]));
    let pop_limits = d3.extent(pop_data);

    let axesLimits = findMinMax(fert_data, life_data);

    let xScale = d3
      .scaleLinear()
      .domain([axesLimits.xMin - 0.5, axesLimits.xMax + 0.5]) // give domain buffer room
      .range([50, 1150]);

    let yScale = d3
      .scaleLinear()
      .domain([axesLimits.yMax + 5, axesLimits.yMin - 5]) // give domain buffer
      .range([50, 650]);

    let rScale = d3
      .scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 40]);

    drawAxes(xScale, yScale);

    plotData(xScale, yScale, rScale);
  }

  function plotData(xScale, yScale, rScale) {
    const xMap = function(d) {
      return xScale(+d["fertility"]);
    };

    const yMap = function(d) {
      return yScale(+d["life_expectancy"]);
    };

    const rMap = function(d) {
      return rScale(+d["population"]);
    };

    let div = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    tooltipSvg = div
      .append("svg")
      .attr("width", 500)
      .attr("height", 400);

    svgContainer
      .selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", xMap)
      .attr("cy", yMap)
      .attr("r", rMap)
      .attr("stroke", "navy")
      .attr("stroke-width", 2)
      .attr("fill", "#e3efff")
      .attr("fill-opacity", "0")
      .on("mouseover", d => {
        plotTooltip(d.country);
        div
          .transition()
          .duration(200)
          .style("opacity", 0.9);
        div
          .style("left", d3.event.pageX + "px")
          .style("top", d3.event.pageY - 28 + "px");
      })
      .on("mouseout", d => {
        div
          .transition()
          .duration(500)
          .style("opacity", 0);
      });

    let bigCountry = data.filter(function(d) {
      return +d["population"] > 100000000;
    });

    svgContainer
      .selectAll(".text")
      .data(bigCountry)
      .enter()
      .append("text")
      .attr("x", function(d) {
        return xScale(+d["fertility"]) + 20;
      })
      .attr("y", function(d) {
        return yScale(+d["life_expectancy"]);
      })
      .text(function(d) {
        return d["country"];
      });
  }

  function plotTooltip(country) {
    tooltipSvg.selectAll("*").remove();

    let countryData = orig_Data.filter(function(d) {
      return d.country == country;
    });

    let years = d3.extent(countryData, d => d["year"]);

    let xScale = d3
      .scaleLinear()
      .domain([years[0], years[1]])
      .range([25, 475]);

    tooltipSvg
      .append("g")
      .attr("transform", "translate(0," + 350 + ")")
      .call(d3.axisBottom(xScale));

    let countryPop = countryData.map(row => parseInt(row["population"]));
    let pops = [d3.min(countryPop), d3.max(countryPop)];

    let yScale = d3
      .scaleLinear()
      .domain([pops[1], pops[0]])
      .range([25, 350]);

    tooltipSvg
      .append("g")
      .attr("transform", "translate(" + 25 + ",0)")
      .call(
        d3.axisRight(yScale).tickFormat(function(d) {
          var s = d / 1000000;
          return s + "M";
        })
      );

    let line = d3
      .line()
      .x(d => xScale(d["year"])) // set the x values for the line generator
      .y(d => yScale(d["population"])); // set the y values for the line generator

    tooltipSvg
      .append("path")
      .datum(countryData)
      .attr("d", function(d) {
        return line(d);
      })
      .attr("stroke", "navy");

    tooltipSvg
      .append("text")
      .attr("x", 240)
      .attr("y", 380)
      .style("font-size", "8pt")
      .text("Year");

    tooltipSvg
      .append("text")
      .attr("transform", "translate(15, 220)rotate(-90)")
      .style("font-size", "8pt")
      .text("Population");

    tooltipSvg
      .append("text")
      .attr("x", 170)
      .attr("y", 20)
      .style("font-size", "10pt")
      .text("Population over time in " + country);
  }

  function drawAxes(xScale, yScale) {
    let xAxis = d3.axisBottom().scale(xScale);

    svgContainer
      .append("g")
      .attr("transform", "translate(0, 650)")
      .call(xAxis);

    svgContainer
      .append("text")
      .attr("x", 550)
      .attr("y", 690)
      .style("font-size", "14pt")
      .text("Fertility Rate");

    let yAxis = d3.axisLeft().scale(yScale);

    svgContainer
      .append("g")
      .attr("transform", "translate(50, 0)")
      .call(yAxis);

    svgContainer
      .append("text")
      .attr("transform", "translate(20, 450)rotate(-90)")
      .style("font-size", "14pt")
      .text("Life Expectancy in Years");

    svgContainer
      .append("text")
      .attr("x", 480)
      .attr("y", 30)
      .style("font-size", "14pt")
      .text("Fertility vs. Life Expectancy in 1980");
  }

  function findMinMax(x, y) {
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    let yMin = d3.min(y);
    let yMax = d3.max(y);

    return {
      xMin: xMin,
      xMax: xMax,
      yMin: yMin,
      yMax: yMax
    };
  }
})();
