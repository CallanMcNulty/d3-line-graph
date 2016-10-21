$(document).ready(function(){
  var linify = function(points) {
    points.sort(function(a, b) {
      if(a[0] < b[0]) {
        return -1;
      }
      if(b[0] < a[0]) {
        return 1;
      }
      return 0;
    });
    var lines = [];
    for(var i=0; i<points.length-1; i++) {
      lines.push({p1:points[i],p2:points[i+1]});
    }
    return lines;
  }

  var findMaxMin = function(data, isMax, isX) {
    var soFar = isMax ? -Infinity : Infinity;
    for(var i=0; i<data.length; i++) {
      if(typeof data[i][0] === "object") {
        var val = findMaxMin(data[i], isMax, isX);
      } else {
        var val = isX ? data[i][0] : data[i][1];
      }
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
        transformedPoint[0] = Date.parse(point[0]);
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
    var h = svg.style("height");
    var w = svg.style("width");
    h = parseInt(h.substring(0,h.length-2));
    w = parseInt(w.substring(0,w.length-2));
    var padding = 25;
    var paddingLarge = w/3;
    var minX = findMaxMin(data, false, true);
    var maxX = findMaxMin(data, true, true);
    var xInnerPadding = (maxX - minX)/10;
    maxX += xInnerPadding;
    minX -= xInnerPadding;
    var minY = Math.min(0,findMaxMin(data, false, false));
    var maxY = Math.max(900,findMaxMin(data, true, false));
    var yInnerPadding = (maxY - minY)/10;
    maxY += yInnerPadding;
    minY -= yInnerPadding;

    var yScale = d3.scaleLinear()
      .domain([minY, maxY])
      .range([h-padding, padding])

    var xTimeScale = d3.scaleTime()
                        .domain([minX, maxX])
                        .range([padding, w-paddingLarge])
    var numberOfDays = (maxX - minX) / 86400000 + 1;
    var xAxis = d3.axisBottom(xTimeScale)
      //.ticks(6)
      .tickFormat(d3.timeFormat("%m-%d-%y"));
    var horizGuide = svg.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0,"+(h-padding)+")");
    xAxis(horizGuide);

    var graph = svg.append("g");

    //background
    graph.append("rect")
      .attr("x", xTimeScale(minX)-1)
      .attr("y", yScale(maxY))
      .attr("width", xTimeScale(maxX)-padding+2)
      .attr("height", yScale(minY)-yScale(maxY))
      .attr("class", "out-of-range")
    graph.append("rect")
      .attr("x", xTimeScale(minX))
      .attr("y", yScale(900))
      .attr("width", xTimeScale(maxX)-padding)
      .attr("height", yScale(0)-yScale(900))
      .attr("class", "in-range")

    //datasets
    for(var i=0; i<data.length; i++) {
      var dataSetName = metaData[i].name;
      var dataSetUnit = metaData[i].unit;

      //legend
      var legendPadding = 25;
      var legendLineLength = 50;
      var legendPointWidth = 6;
      var legend = graph.append("g");
      legend.append("rect")
        .attr("x", w-paddingLarge+legendPadding/2)
        .attr("y", 35*i+padding)
        .attr("width", paddingLarge-padding-legendPadding/2)
        .attr("height", 40)
        .style("fill", "#ddd")
      legend.append("line")
        .attr("x1", w-paddingLarge+legendPadding)
        .attr("x2", w-paddingLarge+legendPadding+legendLineLength)
        .attr("y1", 35*(i+1))
        .attr("y2", 35*(i+1))
        .attr("class", "series"+Math.min(i,7)+"-line series-line");
      var labelText = legend.append("text")
        .attr("x", w-paddingLarge+legendPadding)
        .attr("y", 35*(i+1)+20)
        .text(dataSetName+" ("+dataSetUnit+")");
      var textWidth = parseInt(labelText.style("width"));
      if(textWidth > paddingLarge-padding-legendPadding) {
        labelText.attr("textLength", paddingLarge-padding-legendPadding)
      }
      legend.append("rect")
        .attr("width", legendPointWidth)
        .attr("height", legendPointWidth)
        .attr("x", w-paddingLarge+legendPadding+(legendLineLength/2)-(legendPointWidth/2))
        .attr("y", 35*(i+1)-(legendPointWidth/2))
        .attr("class", "series"+Math.min(i,7)+"-point series-point")

      //trendlines
      var lineData = linify(data[i]);
      var pointWidth = 6;
      var tooltipWidth = 60;
      var tooltipHeight = 30;
      var tooltipTailHeight = 10;
      var tooltipPadding = 6;
      var trendLine = graph.append("g")
        .attr("unit", dataSetUnit)
      trendLine.selectAll("line")
          .data(lineData)
        .enter().append("line")
          .attr("x1", function(d){return xTimeScale(d.p1[0])})
          .attr("y1", function(d){return yScale(d.p1[1])})
          .attr("x2", function(d){return xTimeScale(d.p2[0])})
          .attr("y2", function(d){return yScale(d.p2[1])})
          .attr("class", "series"+Math.min(i,7)+"-line series-line");

      trendLine.selectAll("rect")
          .data(data[i])
        .enter().append("rect")
          .attr("width", pointWidth)
          .attr("height", pointWidth)
          .attr("x", function(d) {return xTimeScale(d[0])-(pointWidth/2)})
          .attr("y", function(d) {return yScale(d[1])-(pointWidth/2)})
          .attr("class", "series"+Math.min(i,7)+"-point series-point")
          .on("mouseover", function(d) {
            var tooltip = d3.select(this.parentNode.parentNode)
              .append("g")
                .attr("class", "value-tooltip tooltip-unlocked");
            tooltip.append("rect")
              .attr("x", xTimeScale(d[0])-(tooltipWidth/2))
              .attr("y", yScale(d[1])-(tooltipHeight+tooltipTailHeight))
              .attr("width", tooltipWidth)
              .attr("height", tooltipHeight)
              .attr("rx", tooltipHeight/4)
              .attr("ry", tooltipHeight/4);
            tooltip.append("polygon")
              .attr("points", xTimeScale(d[0])+","+(yScale(d[1])-(pointWidth/2))+" "+(xTimeScale(d[0])-5)+","+(yScale(d[1])-tooltipTailHeight-1)+" "+(xTimeScale(d[0])+5)+","+(yScale(d[1])-tooltipTailHeight-1))
            var tooltipLabel = tooltip.append("text")
              .attr("x", xTimeScale(d[0])-(tooltipWidth/2)+tooltipPadding)
              .attr("y", yScale(d[1])-(tooltipHeight+tooltipTailHeight)/2)
              .text(d[2]+" "+d3.select(this.parentNode).attr("unit"));
            var tooltipLabelWidth = parseInt(tooltipLabel.style("width"));
            var rec = tooltip.select("rect")
              .attr("width", Math.max(tooltipLabelWidth+(2*tooltipPadding), tooltipWidth/2+2*tooltipPadding) );
            var tooltipX = parseInt(rec.attr("x"));
            if(tooltipX+tooltipLabelWidth > (2/3)*w ) {
              var overflow = (tooltipX+tooltipLabelWidth) - (2/3)*w;
              rec.attr("x", tooltipX-overflow)
              tooltipLabel.attr("x", tooltipX-overflow+tooltipPadding)
            }
          })
          .on("mouseout", function() {
            if(!d3.select(this).attr("class").includes("tooltip-locked")) {
              var tts = d3.select(this.parentNode.parentNode)
                .selectAll(".tooltip-unlocked")
                .remove();
            }
          })
          .on("click", function(d){
            var pts = xTimeScale(d[0])+","+(yScale(d[1])-(pointWidth/2))+" "+(xTimeScale(d[0])-5)+","+(yScale(d[1])-tooltipTailHeight-1)+" "+(xTimeScale(d[0])+5)+","+(yScale(d[1])-tooltipTailHeight-1);
            var tail = d3.select(this.parentNode.parentNode).selectAll("polygon[points='"+pts+"']");
            if(tail.node()===null){return;}
            var tt = d3.select(tail.node().parentNode);
            var ttclass = tt.attr("class");
            if(ttclass.includes("tooltip-locked")) {
              tt.remove();
            } else {
              tt.attr("class", ttclass.replace("tooltip-unlocked", "tooltip-locked"));
            }
          });
    }
    //legend box outline
    legend.append("line")
      .attr("x1", w-paddingLarge+legendPadding/2)
      .attr("x2", w-padding)
      .attr("y1", padding)
      .attr("y2", padding)
      .style("stroke", "black")
    legend.append("line")
      .attr("x1", w-paddingLarge+legendPadding/2)
      .attr("x2", w-padding)
      .attr("y1", 35*i+padding+5)
      .attr("y2", 35*i+padding+5)
      .style("stroke", "black")
    legend.append("line")
      .attr("x1", w-paddingLarge+legendPadding/2)
      .attr("x2", w-paddingLarge+legendPadding/2)
      .attr("y1", padding)
      .attr("y2", 35*i+padding+5)
      .style("stroke", "black")
    legend.append("line")
      .attr("x1", w-padding)
      .attr("x2", w-padding)
      .attr("y1", padding)
      .attr("y2", 35*i+padding+5)
      .style("stroke", "black")
  }

  // var data = [ {name:"in-range-data", unit:"a", refMin:0, refMax:100, values:[["10/12/16",30],["10/11/16",23],["10/13/16",15]]}];
  var data = [{name:"test-data-0", unit:"a", refMin:0, refMax:20, values:[["10/12/16",30],["10/11/16",23],["10/13/16",15],["10/14/16",15],["10/15/16",20],["10/16/16",23]]},
              {name:"test-data-1", unit:"b", refMin:20, refMax:40, values:[["10/13/16",2],["10/14/16",12],["10/15/16",27]]},
              {name:"test-data-2", unit:"cc", refMin:100, refMax:800, values:[["10/13/16",500],["10/14/16",550],["10/18/16",600]]},
              {name:"test-data-3", unit:"cc", refMin:500, refMax:800, values:[["10/13/16",500],["10/14/16",550],["10/18/16",600]]},
              {name:"test-data-4", unit:"bc", refMin:2, refMax:40, values:[["10/13/16",2],["10/14/16",12],["10/15/16",27]]},
              {name:"test-data-5", unit:"aaaaaaaaaaaaaaaa", refMin:10, refMax:20, values:[["10/11/16",15],["10/14/16",15],["10/18/16",20],["10/16/16",23]]},
              {name:"test-data-6", unit:"lbs", refMin:30, refMax:50, values:[["10/11/16",30],["10/16/16",32]]}
            ];
  var body = d3.select("body");
  var svg = body.append("svg")
    .style("width", "800px")
    .style("height", "300px")
  lineGraph(svg, data);
});
