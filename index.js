'use strict';

(function() {

  let data = "no data";
  let svgContainer = ""; // keep SVG reference in global scope

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 2000)
      .attr('height', 2000);
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("gapminder.csv")
      .then((data) => makeScatterPlot(data));

      
  }

  // make scatter plot with trend line
  function makeScatterPlot(csvData) {
    data = csvData // assign data as global variable

    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

    // find data limits
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);
    console.log(axesLimits);
    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "fertility", "life_expectancy");

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels();

    var dropDown = d3.select("#filter").append("select")
      .attr("name", "country-list");


    let allYear = []
    for (let i = 0; i < data.length; i ++){
      if (i == 0){
        let year = {year:data[i].year};
        allYear.push(year)
        console.log(i);
      } else if (data[i-1].year !== data[i].year){
        let year = {year:data[i].year};
        allYear.push(year)
      }
    }

      var options = dropDown.selectAll("option")
           .data(allYear)
            .enter()
           .append("option");

      options.text(function (d) { 
        return d.year; })
      .attr("value", function (d) { return d.year; });


      dropDown.on("change", function() {
      var selected = this.value;
      console.log(selected);
      var displayOthers = this.checked ? "inline" : "none";
      console.log(displayOthers)
      var display = this.checked ? "none" : "inline";


      svgContainer.selectAll("circle")
          .filter(function(d) {return selected != d.year;})
          .attr("display", displayOthers);
          
      svgContainer.selectAll("circle")
          .filter(function(d) {return selected == d.year;})
          .attr("display", display);
      });
  }

  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 600)
      .attr('y', 50)
      .style('font-size', '20pt')
      .text("Countries by Life Expectancy and Fertility Rate");

    svgContainer.append('text')
      .attr('x', 770)
      .attr('y', 850)
      .style('font-size', '15pt')
      .text('Fertility Rates (Avg Children per Woman)');

    svgContainer.append('text')
      .attr('transform', 'translate(30, 500)rotate(-90)')
      .style('font-size', '15pt')
      .text('Life Expectancy (years)');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    
    // get population data as array
    let pop_data = data.map((row) => +row["population"]);
    let pop_limits = d3.extent(pop_data);
    console.log(pop_limits);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([5, 150]);

    // mapping functions
    let xMap = map.x;
    let yMap = map.y;
    console.log('hi')
    console.log(xMap)

    // make tooltip
    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);



    // append data to SVG and plot as points
    svgContainer.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', (d) => pop_map_func(d["population"]))
        .style('fill', 'none')
        .style('stroke', 'rgb(93,120,164)')
        .style("stroke-width", 3) 
        // add tooltip functionality to points
        .on("mouseover", (d) => {
          div.transition()
            .duration(10)
            .style("opacity", .9);
          div.html(d.country + "<br/>" + 'year: ' +numberWithCommas(d['year']) 
                    + "<br/>" + 'Life expectancy: ' +numberWithCommas(d['life_expectancy']) 
                    + "<br/>" + 'Fertility: ' +numberWithCommas(d['fertility']) 
                    + "<br/>" + 'Population: ' +numberWithCommas(d['population']) 
                    )
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        });
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([50, 1700]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
      .attr('transform', 'translate(50, 800)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([50, 800]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(100, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();
