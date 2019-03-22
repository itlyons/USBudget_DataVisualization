
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
    Promise.all(['data/cboSpend.json', 'data/TypesOfSpend.json']
    .map(url => fetch(url).then(allData => allData.json())))
    .then(allData => Visify(allData));
    });

/*
domReady(() => {
        d3.csv('data/cboSpend.csv')
        .then(data => Visify(data));
        });
*/

function Visify(allData, whatChart) {

    var [overviewData, spendData] = allData;

    var chooseData = function indexizer(overviewData, spendData, whatChart) {
        if (whatChart === 'Overview')
            {var lineData = [(overviewData.filter(d => d.Category==='Publicly Held Debt')),
                            (overviewData.filter(d => d.Category==='Total Spending')),
                            (overviewData.filter(d => d.Category==='Total Revenues'))
                                ];
            return [overviewData, lineData]}
        if (whatChart === 'CBO Spending')
            {var lineData = [(spendData.filter(d => d.Category==='Discretionary')),
                            (spendData.filter(d => d.Category==='Mandatory')),
                            (spendData.filter(d => d.Category==='Net Interest'))
                            ];
            return [spendData, lineData]}
        else {
            var lineData = [(overviewData.filter(d => d.Category==='Publicly Held Debt')),
                            (overviewData.filter(d => d.Category==='Total Spending')),
                            (overviewData.filter(d => d.Category==='Total Revenues'))
                        ];
            return [overviewData, lineData]};
        }

    var [data, lineData] = chooseData(overviewData, spendData, whatChart)
    // console.log('HERE', data, lineData)

    var uniqCats = d3.set(data, function(d) {return d.Category});
    var uniqCats = uniqCats.values();

    const width = 999;
    const height = 1.9/3 * width;

    const margin = {left: 60,
                right: 80,
                top: 40,
                bottom: 20
                };

    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.bottom - margin.top;

    const svg = select('.vis-container')
                    .attr('width', width)
                    .attr('height', height)
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

    // Meow
    var cats = ['Publicly Held Debt','Total Spending', 'Total Revenues',
                'Discretionary', 'Mandatory', 'Net Interest']


//    , 'Social Security', 'Federal Healthcare Spending',
//    'Other Noninterest Spending', 'Net Interest']

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
        .on('mouseover', function() { focus.style('display', null); })
        .on('mousemove', function(d) {
            var xPosition = d3.mouse(this)[0];
            var yPosition = d3.mouse(this)[1];
            var ttYear = (xScale.invert(xPosition)).toFixed(0)
            var ttPct = (yScale.invert(yPosition)*100).toFixed(0)
            focus.attr('transform','translate(' +xPosition + ',' + yPosition + ')')
                .style('opacity', 1);
            focus.select('text')
                .text('Year: ' + ttYear + ', Percent of GDP: ' + ttPct + '%')
                .attr('fill', 'black')
                .style('opacity', 1)
            })
         .on('mouseout', function() {
                            focusText.transition()
                                .delay(1500)
                                .style('opacity', 0);
                            focus.transition()
                                .delay(1500)
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
// button --> change class of line you are choosing to not have delete class
// remove lines, and func that undoes it

    var annos = svg.append('g').attr('class', 'random-text');
    // Add labels for 2019 marker
    annos.append('text')
            .attr('class', 'annotation')
            .attr('x', todayX+25)
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
        .style('fill', '#ffffff');

    svg.select('rect.curtain')
        .transition()
        .duration(4000)
        .ease(d3.easeLinear)
        .attr('x', plotWidth*2);

    // Add chart title
    annos.append('text')
        .attr('class', 'chart-title')
        .attr('x', (width / 2))
        .attr('y', 0 - (margin.top / 2))
        .attr('text-anchor', 'middle')
        .style('font-size', '24px')
        .style('text-decoration', 'bold')
        .text('Revenues Stagnate, and Debt Grows');


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



      var focus = svg.append('g')
          .attr('class', 'focus')
          .style('display', 'none')
          ;

      var focusX = focus.append('line')
          .attr('class', 'x-hover-line hover-line')
          .attr('y1', 0)
          .attr('y2', plotHeight);

      var focusY = focus.append('line')
          .attr('class', 'y-hover-line hover-line')
          .attr('x1', -plotWidth)
          .attr('x2', 0);

      var focusCirc = focus.append('circle')
          .attr('r', 5.0);

      var focusText = focus.append('text')
            .attr('x', 15)
            .attr('dy', '.31em')
            .style('opacity', 0);






//****************** <LEGEND TIME> ******************
//***************************************************
    var legend = svg.append('g')
              .attr('class','legend')
              .attr('transform','translate(50,50)')
              .style('font-size','12px');

    // Add the legend's colored boxes.
    legend.selectAll('rect')
        .data(uniqCats)
        .enter()
        .append('rect')
          .attr('class', 'legendBox')
          .attr('x', plotWidth *.01)
          .attr('y', function(d, i){ return i *  20;})
          .attr('width', 18)
          .attr('height', 18)
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
            .attr('x', 20+ plotWidth*.01)
            .attr('y', function(d, i){ return (i * 20)+13;})
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
//                    .attr('transform','translate('+ plotWidth*.8 + ',50)')
                    .attr('id', 'button-time');

    var selectors = [{'Label':'CBO Spending'},
            {'Label':'CBO Revenues'},
            {'Label':'CBO Debt'},
            {'Label':'Overview'}];


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

    function changeChart (d, inputValue) {
        //console.log(d, inputValue)
        function removeStuff() {
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
                .attr('x', width*.80)
                .attr('y', function(d, i){ return ((height*.20)+i * 40);})
                .attr('fill', 'black')
                .style('opacity', 1)
                .on('click', inputChange);

    console.log(uniqCats)
}
