$(document).ready(function(){
  var body = d3.select("body");
  // var div = body.append("div");
  // var data = [8,4,3,7,1];


  // div.selectAll("div")
  //     .data(data)
  //   .enter().append("div")
  //     .style("width", function(d) { return d * 10 + "px"; })
  //     .style("background-color", "red")
  //     .style("margin-bottom", "5px")
  //     .text(function(d) { return d; });

  var linify = function(points) {
    var lines = []
    for(var i=0; i<points.length-1; i++) {
      lines.push({p1:points[i],p2:points[i+1]});
    }
    return lines;
  }

  var findMaxMin = function(points, isMax, isX) {
    var soFar = isMax ? -Infinity : Infinity;
    for(var i=0; i<points.length; i++) {
      var val = isX ? Date.parse(points[i][0]) : points[i][1];
      if(isMax ? val > soFar : val < soFar) {
        soFar = val;
      }
    }
    return soFar;
  }

  var multiSetMaxMin = function(data, isMax, isX) {
    var soFar = isMax ? -Infinity : Infinity;
    for(var i=0; i<data.length; i++) {
      var val = findMaxMin(data[i], isMax, isX);
      if(isMax ? val > soFar : val < soFar) {
        soFar = val;
      }
    }
    return soFar;
  }

  var transformData = function(data) {
    var transformedData = [];
    for(var i=0; i<data.length; i++) {
      var dataset = data[i];
      var ratio = 900/(dataset.refMax-dataset.refMin);
      var offset = 900-(dataset.refMax*ratio);
      transformedData.push([]);
      for(var j=0; j<dataset.values.length; j++) {
        var transformedPoint = [];
        var point = dataset.values[j];
        transformedPoint[0] = point[0];
        transformedPoint[1] = point[1]*ratio + offset;
        transformedPoint[2] = point[1];
        transformedData[i].push(transformedPoint);
      }
    }
    return transformedData;
  }

  var lineGraph = function(svg, data) {
    var metaData = [];
    for(var i=0; i<data.length; i++) {
      metaData.push({name:data[i].name, unit:data[i].unit});
    }
    data = transformData(data);
    var padding = 25;
    var paddingLarge = 100;
    var h = svg.style("height");
    var w = svg.style("width");
    h = parseInt(h.substring(0,h.length-2));
    w = parseInt(w.substring(0,w.length-2));
    var minX = multiSetMaxMin(data, false, true);
    var maxX = multiSetMaxMin(data, true, true);
    var minY = multiSetMaxMin(data, false, false);
    var maxY = multiSetMaxMin(data, true, false);

    var yScale = d3.scaleLinear()
      .domain([minY, maxY])
      .range([h-padding, padding])
    //var yAxis = d3.axisLeft(yScale);

    var xScale = d3.scaleLinear()
      .domain([minX, maxX])
      .range([padding, w-paddingLarge])
    debugger;
    var xTimeScale = d3.scaleTime()
                        .domain([minX, maxX])
                        .range([padding, w-paddingLarge])
    var xTimeAxis = d3.axisBottom(xTimeScale);
    var xAxis = d3.axisBottom(xTimeScale);
    // var verticalGuide = svg.append("g")
    //   .attr("class", "axis")
    //   .attr("transform", "translate("+padding+",0)")
    // yAxis(verticalGuide);
    var horizGuide = svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0,"+(h-padding)+")")
    xAxis(horizGuide);

    var graph = svg.append("g");

    graph.append("rect")
      .attr("x", xScale(minX))
      .attr("y", yScale(maxY))
      .attr("width", xScale(maxX)-padding)
      .attr("height", yScale(minY)-yScale(maxY))
      .style("fill", "#ffb")

    graph.append("rect")
      .attr("x", xScale(minX))
      .attr("y", yScale(900))
      .attr("width", xScale(maxX)-padding)
      .attr("height", yScale(0)-yScale(900))
      .style("fill", "#9f9")

    for(var i=0; i<data.length; i++) {
      var dataSetName = metaData[i].name;
      var dataSetUnit = metaData[i].unit;
      //labels
      graph.append("line")
        .attr("x1", w-paddingLarge+5)
        .attr("x2", w-5)
        .attr("y1", 35*(i+1))
        .attr("y2", 35*(i+1))
        .style("stroke-width", 1)
        .attr("class", "series"+i+"-line");
      graph.append("text")
        .attr("x", w-paddingLarge+5)
        .attr("y", 35*(i+1)+20)
        .text(dataSetName+" ("+dataSetUnit+")")
      graph.append("rect")
        .attr("width", 4)
        .attr("height", 4)
        .attr("x", w-paddingLarge/2-2)
        .attr("y", 35*(i+1)-2)
        .attr("class", "series"+i+"-point")

      //trendlines
      var lineData = linify(data[i]);
      var trendLine = graph.append("g")
        .attr("unit", dataSetUnit);
      trendLine.selectAll("line")
          .data(lineData)
        .enter().append("line")
          .attr("x1", function(d){return xTimeScale(Date.parse(d.p1[0]))})
          .attr("y1", function(d){return yScale(d.p1[1])})
          .attr("x2", function(d){return xTimeScale(Date.parse(d.p2[0]) )})
          .attr("y2", function(d){return yScale(d.p2[1])})
          .style("stroke-width", 1)
          .attr("class", "series"+i+"-line");

      trendLine.selectAll("rect")
          .data(data[i])
        .enter().append("rect")
          .attr("width", 4)
          .attr("height", 4)
          .attr("x", function(d) {return xTimeScale(Date.parse(d[0]))-2})
          .attr("y", function(d) {return yScale(d[1])-2})
          .attr("class", "series"+i+"-point")
          .on("mouseover", function(d) {
            d3.select(this.parentNode)
              .append("text")
                .attr("x", xTimeScale(Date.parse(d[0]))-2)
                .attr("y", yScale(d[1])-10)
                .text(d[2]+" "+d3.select(this.parentNode).attr("unit"))
          })
          .on("mouseout", function(d) {
            d3.select(this.parentNode)
              .selectAll("text")
              .remove();
          });
    }
  }



  debugger;
  var data = [ {name:"test-data-0", unit:"a", refMin:0, refMax:20, values:[["10/11/16",23],["10/12/16",30],["10/13/16",15],["10/14/16",15],["10/15/16",20],["10/16/16",23]]}, {name:"test-data-1", unit:"b", refMin:20, refMax:40, values:[["10/13/16",20],["10/14/16",12],["10/15/16",27]]} ];
  //var transformedData = transformData(data);
  var svg = body.append("svg")
    .style("width", "800px")
    .style("height", "400px")
  lineGraph(svg, data);

});
