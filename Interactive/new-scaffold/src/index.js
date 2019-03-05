
const domReady = require('domready');

import {select} from 'd3-selection';
import {interpolateInferno} from 'd3-scale-chromatic';
import {scaleOrdinal, scaleTime, scaleLinear} from 'd3-scale';
import {timeFormat} from 'd3-time-format';
import {line} from 'd3-shape';
import {axisBottom, axisRight} from 'd3-axis';
import {annotation, annotationCalloutCircle} from 'd3-svg-annotation';
var d3 = require("d3");

domReady(() => {
    fetch('data/cbo.json')
    .then(response => response.json())
    .then(data => Visify(data));
    });

function Visify(data) {
  // portrait
    const width = 1000;
    const height = 24 / 36 * width;

    var margin = {left: 50,
                right: 20,
                top: 20,
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
                        .domain([d3.min(data, function(d) { return d.year; }),
                            d3.max(data, function(d) { return d.year; })])
                        .range([0, plotWidth])
                        .nice();

    var yScale = scaleLinear()
                        .domain([d3.min(data, function(d) { return d.amount; }),
                            d3.max(data, function(d) { return d.amount; })])
                        .range([plotHeight, 0])
                        .nice();

    const color = d3.scaleOrdinal(d3.schemeDark2);

    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(10,' + plotHeight + ')')
        .call(d3.axisBottom(xScale)
        .tickFormat(d3.format("d")));

    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(10,0)')
        .call(d3.axisLeft(yScale)
        .tickFormat(d3.format("$.0s"))
    );


  console.table(data)
  console.log()
  
}
