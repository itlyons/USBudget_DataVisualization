
const domReady = require('domready');

import {geoPath, geoAlbersUsa} from 'd3-geo';
import {select} from 'd3-selection';
import {interpolateInferno} from 'd3-scale-chromatic';
import {scaleLinear} from 'd3-scale';

domReady(() => {
  Promise.all(["../app/data/cbo.json"]).then(data => data.json())
    .then(data => myVis(data));
});

function myVis(data) {
  // portrait
    const width = 5000;
    const height = 36 / 24 * width;

    var margin = {left: 75,
                right: 50,
                top: 50,
                bottom: 75
                };

    var xScale = d3.scaleLinear()
                        .domain([d3.min(dataset, function(d) { return d.year; }),
                            d3.max(dataset, function(d) { return d.year; })])
                        .range([padding, w - padding * 2])
                        .nice();

    var yScale = d3.scaleLinear()
                        .domain([d3.min(dataset, function(d) { return d.amount; }),
                            d3.max(dataset, function(d) { return d.amount; })])
                        .range([h - padding, padding])
                        .nice();

    //Create SVG
    var svg = d3.select("body")
                .append("svg")
                .attr("width", w)
                .attr("height", h);

  console.log(data)
  console.log('Hi! My name is Ian and Im changing things.')
  // EXAMPLE FIRST FUNCTION
}
