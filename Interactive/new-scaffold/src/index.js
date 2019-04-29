
const domReady = require('domready');
var d3Transition = require('d3-transition');
import {select, event} from 'd3-selection';
import {interpolateInferno} from 'd3-scale-chromatic';
import {scaleOrdinal, scaleTime, scaleLinear} from 'd3-scale';
import {timeFormat} from 'd3-time-format';
import {line} from 'd3-shape';
import {axisBottom, axisRight} from 'd3-axis';
import {annotation, annotationCalloutCircle} from 'd3-svg-annotation';
var annotate = require('d3-svg-annotation');
var d3 = require('d3');

domReady(() => {
    Promise.all(['data/cboSpend.json',
    'data/TypesOfSpend.json',
    'data/TypesOfRev.json']
    .map(url => fetch(url)
    .then(allData => allData.json())))
    .then(allData => Visify(allData));
    });


function Visify(allData, whatChart = 'Overview') {
    var [overviewData, spendData, revData] = allData;

    // Create a function that returns the data we want
    // whatChart is set when the user clicks one of the button options
    var chooseData = function indexizer(overviewData, spendData, revData, whatChart) {
        if (whatChart === 'CBO Spending')
            {var lineData = [(spendData.filter(d => d.Category==='Discretionary')),
                            (spendData.filter(d => d.Category==='Mandatory')),
                            (spendData.filter(d => d.Category==='Net Interest'))
                            ];
            return [spendData, lineData]}

        if (whatChart === 'CBO Revenues')
            {var lineData = [(revData.filter(d => d.Category==='Individual Income Taxes')),
                            (revData.filter(d => d.Category==='Corporate Income Taxes')),
                            (revData.filter(d => d.Category==='Payroll Taxes')),
                            (revData.filter(d => d.Category==='Other Sources'))
                            ];
            return [revData, lineData]}

        else {
            var lineData = [(overviewData.filter(d => d.Category==='Publicly Held Debt')),
                            (overviewData.filter(d => d.Category==='Total Spending')),
                            (overviewData.filter(d => d.Category==='Total Revenues'))
                        ];
            return [overviewData, lineData]};
        }

    // I created the original graph with a data subset
    // That's why I set up the viz & plot the viz with differently formatted arrays
    var [data, lineData] = chooseData(overviewData, spendData, revData, whatChart)

    // Grab the UNIQUE categories from this particular chart
    var uniqCats = d3.set(data, function(d) {return d.Category});
    var uniqCats = uniqCats.values();


    //******************** SVG & SCALE SETUP ********************//
    //********************                   ********************//
    const width = 1200;
    const height = 2/3 * width;

    const margin = {left: 75,
                right: 120,
                top: 50,
                bottom: 75
                };

    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.bottom - margin.top;
    /*
    const background = d3.select('background-curtain').style("height", "100%")
                            .append('div')
                            .attr('class', 'background')
                            .append('.vis-container');
                            */
    const svg = select('.vis-container')
                    .attr('width', width)
                    .attr('height', height)
                    .style('background', '#f4f4f4')
                    .append('g')
                    .attr('class', whatChart)
                    .attr('transform', `translate(${margin.left},${margin.top})`);

    var xScale = scaleLinear()
                        .domain([d3.min(data, (d => d.Year)),
                            d3.max(data, (d => d.Year))])
                        .range([0, plotWidth])
                        .nice();

    var yScale = scaleLinear()
                        .domain([0, d3.max(data, (d => d.pctgdp))])
                        .range([plotHeight, 0])
                        .nice();

    // Meow. List all categories so that colors don't repeat.
    var cats = ['Publicly Held Debt','Total Spending', 'Total Revenues',
                'Discretionary', 'Mandatory', 'Net Interest',
            'Individual Income Taxes',	'Corporate Income Taxes', 'Payroll Taxes',
            'Other Sources']

    const color = d3.scaleOrdinal()
                    .domain(cats)
                    .range(d3.schemeDark2);

    var yFormat = d3.axisBottom(xScale)
                .tickFormat(d3.format('d'));

    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0,' + plotHeight + ')')
        .call(yFormat);

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('class', 'ylabel')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text('Percent of GDP');

    var xFormat = d3.axisLeft(yScale)
                .tickFormat(d3.format('.0%'));

    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0,0)')
        .call(xFormat);

    //********************                      ********************//
    //******************** </SVG & SCALE SETUP> ********************//





    //          Create a line generator         //
    var line = d3.line()
        .curve(d3.curveLinear)
        .x(function(d) { return xScale(d.Year); })
        .y(function(d) { return yScale(d.pctgdp); });

    const clipPath = svg.append('clipPath')
            .attr('id', 'clip')
          .append('rect')
            .attr('width', plotWidth)
            .attr('height', plotHeight);

    var lineHolder = svg.append('g').attr('transform', 'translate(0,0)')
        .attr('class', 'line-holder');
 //***********************************************************************//
    lineHolder.selectAll('.line')
        .data(lineData)
            .enter()
        .append('path')
        .attr('class', 'line')
        .style('stroke', (d => (color(d[0].Category))))
        .attr('clip-path', 'url(#clip)')
        .attr('d', (d => line(d)))
        .on('mouseover', function() { tooltip.style('display', null); })
        .on('mousemove', function(d) {
            var xPosition = d3.mouse(this)[0];
            var yPosition = d3.mouse(this)[1];
            var ttYear = (xScale.invert(xPosition)).toFixed(0)
            var ttPct = (yScale.invert(yPosition)*100).toFixed(0)
            tooltip.attr('transform','translate(' +xPosition + ',' + yPosition + ')')
                .style('opacity', 1);
            tooltip.select('text')
                .text('Year: ' + ttYear + ', Percent of GDP: ' + ttPct + '%')
                .attr('fill', 'black')
                .style('opacity', 1)
            })
         .on('mouseout', function() {
                            tooltipText.transition()
                                .delay(2000)
                                .style('opacity', 0);
                            tooltip.transition()
                                .delay(2000)
                                .style('opacity', 0);
            });

      // Add line for this year (actual vs cbo projected)
      var todayX = xScale(2019);
      var todayLine = lineHolder.append('line')
                          .attr('class', 'date-marker')
                          .attr('x1', todayX)
                          .attr('y1', plotHeight)
                          .attr('x2', todayX)
                          .attr('y2', 0)
                          .style('stroke-width', 1)
                          .style('stroke', 'red')
                          .style('stroke-dasharray', ('3, 3'))
                          .style('fill', 'none');


    var annos = svg.append('g').attr('class', 'random-text');

    function writeText(whatChart, annos) {
        if (whatChart === 'CBO Revenues') {
        ;}

        if (whatChart === 'CBO Spending') {
            annos.append('text')
                .attr('id', 'annoSpecial')
                .attr('x', todayX+10)
                .attr('y', plotHeight*0.90)
                .attr('text-anchor', 'left')
                .text('Higher Interest Rates And Higher Deficits');

            annos.append('text')
                .attr('id', 'annoSpecial')
                .attr('x', todayX+10)
                .attr('y', plotHeight*0.92)
                .attr('text-anchor', 'left')
                .text('Projected To Nearly Double Interest Payments');
        ;}

        if (whatChart === 'Overview') {
            annos.append('text')
                .attr('id', 'annoSpecial')
                .attr('x', plotWidth*.65)
                .attr('y', plotHeight*0.80)
                .attr('text-anchor', 'left')
                .text('CBO Projects Spending to Outpace Revenues');

            annos.append('text')
                .attr('transform', 'rotate(-30)')
                .attr('id', 'annoSpecial')
                .attr('x', plotWidth*.6)
                .attr('y', plotHeight*.72)
                .attr('text-anchor', 'left')
                .text('Higher Deficits, Higher Debt');
        ;};
    }


    writeText(whatChart, annos)
    // Add labels for 2019 marker //
    annos.append('text')
            .attr('class', 'annotation')
            .attr('x', todayX+10)
            .attr('y', plotHeight*0.35)
            .attr('text-anchor', 'right')
            .text('CBO Projection -->');

    annos.append('text')
            .attr('class', 'annotation')
            .attr('x', todayX-90)
            .attr('y', plotHeight*0.35)
            .attr('text-anchor', 'left')
            .text('<-- Actual');


    var curtain = svg.append('rect')
        .attr('class', 'curtain')
        .attr('x', 12)
        .attr('y', 0)
        .attr('height', plotHeight)
        .attr('width', plotWidth)
        .style('fill', '#f4f4f4');

    svg.select('rect.curtain')
        .transition()
        .duration(4000)
        .ease(d3.easeLinear)
        .attr('x', plotWidth*2);


    const title = {
        'Overview':'Revenues Stagnate, and Debt Grows',
        'CBO Revenues':'Revenues Are Projected to Stagnate, Except Personal Income Taxes',
        'CBO Spending':'Mandatory Spending Squeezes Discretionary Spending'

    }

    // Add chart title
    annos.append('text')
        .attr('class', 'chart-title')
        .attr('x', (plotWidth / 2))
        .attr('y', 0 - (margin.top / 2))
        .attr('text-anchor', 'middle')
        .style('font-size', '24px')
        .style('text-decoration', 'bold')
        .text(title[whatChart]);





    // https://bl.ocks.org/d3noob/c506ac45617cf9ed39337f99f8511218
    // The gridlines code was borrowed from the above address with
    // minimal modification.
    function make_grid() {
        // gridlines in x axis function
        function make_x_gridlines() {
            return d3.axisBottom(xScale)
                .ticks(5)}
        // gridlines in y axis function
        function make_y_gridlines() {
            return d3.axisLeft(yScale)
                .ticks(5)}
          // add the X gridlines
        svg.append('g')
              .attr('class', 'grid')
              .attr('transform', 'translate(0,' + plotHeight + ')')
              .call(make_x_gridlines()
                  .tickSize(-plotHeight)
                  .tickFormat(''));
          // add the Y gridlines
        svg.append('g')
            .attr('class', 'grid')
            .attr('transform', 'translate(0,' + 0 + ')')
            .call(make_y_gridlines()
                .tickSize(-plotWidth)
                .tickFormat(''));
    }
    make_grid();



    // Add some things for the tooltip to work.
    var tooltip = svg.append('g')
          .attr('class', 'tooltip')
          .style('display', 'none')
          ;

      var tooltipX = tooltip.append('line')
          .attr('class', 'x-hover-line hover-line')
          .attr('y1', 0)
          .attr('y2', plotHeight);

      var tooltipY = tooltip.append('line')
          .attr('class', 'y-hover-line hover-line')
          .attr('x1', -plotWidth)
          .attr('x2', 0);

      var tooltipCirc = tooltip.append('circle')
          .attr('r', 5.0);

      var tooltipText = tooltip.append('text')
            .attr('class', 'tooltip')
            .attr('x', 15)
            .attr('dy', '.31em')
            .style('opacity', 0);






//****************** <LEGEND TIME> ******************
//***************************************************
    var legend = svg.append('g').attr('id', 'legendID')
                    .append('rect')
              .attr('transform','translate(50,50)')
              .style('font-size','12px')
              .style('class', 'legendCanvas')
                .attr('width', margin.right*.99)
                .attr('height', plotHeight*.3);

    // Add the legend's colored boxes.
    legend.selectAll('rect')
                .data(uniqCats)
                .enter()
                .append('rect')
                  .attr('class', 'legendBox')
                  .attr('x', plotWidth *.01)
                  .attr('y', function(d, i){ return i *  30;})
                  .attr('width', 24)
                  .attr('height', 24)
                  .style('fill', function(d) {
                     var boxColor = color(d);
                     return boxColor;
                 });

    // Add the labels to the legend positioned next to the boxes.
    legend.selectAll('text')
        .data(uniqCats)
        .enter()
        .append('text')
            .attr('class', 'legendtext')
            .style('text-anchor', 'left')
            .attr('x', 30+ plotWidth*.01)
            .attr('y', function(d, i){ return (i * 30)+16;})
            .text(function(d){
                var catLabel = d;
                return [catLabel];
            })
            .attr('fill', 'black')
            .style('opacity', 1);
//****************** </LEGEND TIME> ******************
//****************************************************









//****************** <BUTTON TIME> ******************
//****************************************************
    var buttons = svg.append('g')
                    .attr('id', 'button-time');

    buttons.append('rect')
            .attr('transform', 'translate(' + (plotWidth+1) + ',' + (height*.13) + ')')
            .attr('width', margin.right*.99)
            .attr('height', plotHeight*.3)
            .attr('fill', 'gold')
            .style('stroke-width', 1)
            .style('stroke', 'black');

    var selectors = [{'Label':'CBO Spending'},
            {'Label':'CBO Revenues'},
            {'Label':'Overview'}];

    // Set up functions for the buttons to run
    function inputChange (d) {
        var inputValue = d.Label;

        if (inputValue === 'CBO Spending')
            {changeChart(d, inputValue);}

        else if (inputValue === 'CBO Revenues')
            {changeChart(d, inputValue);}

        else if (inputValue === 'CBO Debt')
            {changeChart(d, inputValue);}

        else if (inputValue === 'Overview')
            {changeChart(d, inputValue);};
    }

    // inputChange() calls changeChart()
    function changeChart (d, inputValue) {
        function removeStuff() {
            // This isn't how I wanted to do this, but
            svg.transition()
                .remove();};
        removeStuff();

        Visify(allData, inputValue);
    }

    buttons.selectAll('text')
            .data(selectors).enter()
            .append('text')
                .text(d => d.Label)
                .attr('class', 'button-text')
                .style('text-anchor', 'left')
                .attr('x', plotWidth*1.01)
                .attr('y', function(d, i){ return ((height*.20)+i * 40);})
                .attr('fill', 'black')
                .style('opacity', 1)
                .on('click', inputChange);

    buttons.append('text')
        .attr('class', 'button-text')
        .attr('x', plotWidth*1.02)
        .attr('y', height*.160)
        .style('font-weight', 'bold')
        .style('fill', 'black')
        .text('Show Me:');

        d3.select('#button').on('click', inputChange)
}
