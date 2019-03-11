
const domReady = require('domready');
var d3Transition = require("d3-transition");
import {select} from 'd3-selection';
import {interpolateInferno} from 'd3-scale-chromatic';
import {scaleOrdinal, scaleTime, scaleLinear} from 'd3-scale';
import {timeFormat} from 'd3-time-format';
import {line} from 'd3-shape';
import {axisBottom, axisRight} from 'd3-axis';
import {annotation, annotationCalloutCircle} from 'd3-svg-annotation';
var d3 = require("d3");


domReady(() => {
    fetch('data/cboSpend.json')
    .then(response => response.json())
    .then(data => Visify(data));
});


/*
domReady(() => {
        d3.csv('data/cboSpend.csv')
        .then(data => Visify(data));
        });
*/
function Visify(data) {
  // portrait
    const width = 999;
    const height = 24 / 36 * width;

    var margin = {left: 60,
                right: 20,
                top: 40,
                bottom: 20
                };

    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.bottom - margin.top;

    const svg = select('.vis-container')
                    .attr('width', width)
                    .attr('height', height)
                    .append('g')
                    .attr('transform', `translate(${margin.left},${margin.top})`);

    var xScale = scaleLinear()
                        .domain([d3.min(data, (d => d.Year)),
                            d3.max(data, (d => d.Year))])
                        .range([0, plotWidth])
                        .nice();

    var yScale = scaleLinear()
                        .domain([0,1.60])
                        .range([plotHeight, 0])
                        .nice();

    const color = d3.scaleOrdinal(d3.schemeDark2);

    var yFormat = d3.axisBottom(xScale)
                .tickFormat(d3.format("d"));

    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(10,' + plotHeight + ')')
        .call(yFormat);

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Percent of GDP");

    var xFormat = d3.axisLeft(yScale)
                .tickFormat(d3.format(".2%"));

    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(10,0)')
        .call(xFormat);

    // Create a line generator
    var line = d3.line()
        .curve(d3.curveMonotoneX)
        .x(function(d) { return xScale(d.Year); })
        .y(function(d) { return yScale(d.pctgdp); });

    const clipPath = svg.append("clipPath")
            .attr("id", "clip")
          .append("rect")
            .attr("width", plotWidth)
            .attr("height", plotHeight);

    // Only look at the toplines for now
    var subset = [(data.filter(d => d.Category=="Debt Held by the Public")),
                    (data.filter(d => d.Category=="Total Spending")),
                    (data.filter(d => d.Category=="Total Revenues"))
                ];

    var lineHolder = svg.append("g").attr("transform", "translate(10,0)")
        .attr('class', 'line-holder');

    lineHolder.selectAll(".line")
            .data(subset)
                .enter()
            .append("path")
            .attr('class', 'line')
            .style('stroke', function(d) {
              return color(Math.random() * 50);
          }) // This was borrowed from a website that I now can't find.
          // Have to find a way to map the colors I want to the categories.
            .attr('clip-path', 'url(#clip)')
            .attr('d', function(d) {
              return line(d);
          });

    var curtain = svg.append('rect')
        .attr('class', 'curtain')
        .attr('x', 12)
        .attr('y', 0)
        .attr('height', plotHeight)
        .attr('width', plotWidth)
        .style('fill', '#ffffff');

    svg.select('rect.curtain')
        .transition()
        .duration(5000)
        .ease(d3.easeLinear)
        .attr('x', plotWidth);

    // Add chart title
    svg.append("text")
            .attr('class', 'chart-title')
            .attr("x", (width / 2))
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "24px")
            .style("text-decoration", "bold")
            .text("Revenues Stagnate, and Debt Grows");

    // Add line for this year (actual vs cbo projected)
    var todayX = xScale(2019);

    lineHolder.append('line')
                .attr('class', 'date-marker')
                .attr('x1', todayX)
                .attr('y1', plotHeight)
                .attr('x2', todayX)
                .attr('y2', 0)
                .style("stroke-width", 1)
                .style("stroke", "red")
                .style("stroke-dasharray", ("3, 3"))
                .style("fill", "none");

    // To-do: Add label for 2019 marker ^^

/*
    var legend = svg.append("g")
              .attr("class","legend")
              .attr("transform","translate(50,30)")
              .style("font-size","12px");
*/

  console.table(data)
  console.log()
}
