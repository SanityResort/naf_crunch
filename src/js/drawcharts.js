const scaleMultiplier = 7;
const barWidth = scaleMultiplier * 3;
const barPadding = scaleMultiplier;
const xAxisMargin = scaleMultiplier;
const noWinHeight = 1;
const graphHeight = scaleMultiplier*20;
const axisHeight = scaleMultiplier*6;
const barGroupPadding = scaleMultiplier*6
const margin = {left: scaleMultiplier*5, top: scaleMultiplier*2, right: scaleMultiplier*2}
const rotatedAxisPadding = scaleMultiplier*11
const axisPadding = scaleMultiplier*6
const tournamentMax = 16;
const racesMax = 24;
const headingFontSize = scaleMultiplier*2;
const headingSpacing = scaleMultiplier/2;

let barHeight = function(maxHeight, percentage, games) {
    if (percentage>0) {
        return percentage*maxHeight;
    } else if (games > 0) {
        return noWinHeight;
    }else {
        return 0;
    }
}

let barYPos = function(maxHeight, percentage, games) {
    return maxHeight - barHeight(maxHeight, percentage, games);
}

let tickXPos = function(index, width, size) {
    return index*width/size;
}

let createEmptyEntry = function() {
    return {
            percentage:0,
            games:0
    }
}

let populateTickPos = function(ratios, splitFields, tickPos, offset, allRatios, allLabels){
    if (splitFields.length > 0) {
        let ticks = tickPos.get(splitFields[0]);
        ratios.keys().sort().forEach(function(key){
            let padding = 0;
            if (splitFields.length == 1) {
                padding = 0;
            } else if (splitFields.length == 2) {
                padding = barGroupPadding;
            }
            offset = populateTickPos(ratios.get(key), splitFields.slice(1), tickPos, offset, allRatios, allLabels) + padding
            ticks.push(offset)
        })

        let labels = allLabels.get(splitFields[0]);
                    ratios.keys().sort().forEach(function(key){
                        let label = key;
                        while (labels.includes(label)) {
                            label= ' '+label
                        }
                        labels.push(label)
                    });

    } else {
        offset += barPadding + barWidth
        allRatios.push(ratios)
    }

    return offset;
}

let drawChart = function(ratios, splitFields, parent) {

            let values = ratios.values()
            let keys = ratios.keys()

            let tickPos = d3.map();
            let allLabels = d3.map();
            splitFields.forEach(function(field){
                tickPos.set(field, [0]);
                allLabels.set(field, [''])
            })


            let allRatios = [createEmptyEntry()]

            let width = populateTickPos(ratios, splitFields, tickPos, 0, allRatios, allLabels);

            splitFields = splitFields.reverse()

            let finestTicks = tickPos.get(splitFields[0])
            let finestLabels = allLabels.get(splitFields[0])
            finestTicks.push(width+barWidth)

            allLabels.values().forEach(function(labels){
                labels.push('');
            })

            allRatios.push(createEmptyEntry())
            let wrapper = d3.select('#'+parent).append('svg').attr('width', width + margin.left + margin.right)
            .attr('height', graphHeight + margin.top + axisPadding * (splitFields.length-1) +rotatedAxisPadding )
            .attr('overflow','wrap')
            .attr('onload', function(){
                d3.selectAll('.spinner').remove();
                $('#a-'+parent).scrollintoview({duration:1000});
            });
            let svg = wrapper.append('g').attr('class', 'chart').attr('transform', 'translate('+margin.left+','+ margin.top  +')');
            let tooltip= d3.select('#tooltip');

            svg.selectAll('g').data(allRatios).enter().append('g').append('rect')
                .attr('width', barWidth)
        	    .attr('height', function(value){return barHeight(graphHeight, value.percentage, value.games)})
        	    .attr('y', function(value){ return barYPos(graphHeight, value.percentage, value.games) } )
        	    .attr('x', function(value, index){return finestTicks[index]-barWidth/2})
        	    .attr('class', 'bar')
                .on("mouseover", function(value, index) {
                            tooltip.html(createToolTip(value))
                                .style("left",  (d3.event.pageX) + "px")
                                .style("top",   (d3.event.pageY) + "px");
                            tooltip.transition()
                                .duration(200)
                                .style("opacity", .8);

                            })
                        .on("mouseout", function(d) {
                            tooltip.transition()
                                .duration(500)
                                .style("opacity", 0);
                        })

            svg.selectAll('g').data(allRatios).insert('text')
                .text(function(value){return value.percentage>0?Math.round(value.percentage*100):""})
                .attr('y', function(value){ return barYPos(graphHeight, value.percentage, value.games) -2 } )
                .attr('x', function(value, index){return finestTicks[index]-barWidth/(value.percentage==1?2:4)} )
                .attr('font-family', 'sans-serif')
                .attr('font-size','10px')

            let xRange = d3.range(finestTicks.length).map(function(index){return finestTicks[index]})
            let xScale = d3.scaleOrdinal(xRange).domain(finestLabels);
            let xAxis = d3.axisBottom(xScale);
            svg.append('g')
                .attr('transform', 'translate(0, '+graphHeight+')')
                .call(xAxis).attr('class', 'barAxis')
                .selectAll('text')
                .style('text-anchor', 'end')
                .attr('dx', '-.8em')
                .attr('dy', '.15em')
                .attr('transform', 'rotate(-55)');

            let axisGap = axisHeight;
            splitFields.slice(1).forEach(function(field){
                let ticks = tickPos.get(field);
                let textTicks = createTextTicks(ticks);

                if (ticks.slice(-1)[0] != width) {
                    ticks.push(width)
                }
                let range = d3.range(ticks.length).map(function(index){return ticks[index]});
                let scale = d3.scaleOrdinal(range).domain(allLabels.get(field));
                let axis = d3.axisBottom(scale);
                 svg.append('g')
                                .attr('transform', 'translate(0, '+(graphHeight+axisHeight+axisGap)+')')
                                .call(axis).attr('class', 'lineAxis')



                let textRange = d3.range(textTicks.length).map(function(index){return textTicks[index]});

                let textScale = d3.scaleOrdinal(textRange).domain(allLabels.get(field));
                let textAxis = d3.axisBottom(textScale);
                var graphic = svg.append('g').attr('class', 'textAxis')
                                .attr('transform', 'translate(0, '+(graphHeight+axisHeight+axisGap)+')')
                                .call(textAxis)

                 axisGap += axisHeight
            })

            let yRange = d3.range(5).map(function(d){return (4-d)*graphHeight/4});
            let yScale = d3.scaleOrdinal().range(yRange).domain([0,25,50,75,100]);
            let yAxis = d3.axisLeft(yScale);
            svg.append('g').attr('transform', 'translate(0,0)').call(yAxis);
}

let createToolTip = function(ratio) {
    return 'Wins: '+ratio.wins+'<br/>Draws: '+ratio.draws+'<br/>Losses: '+ratio.losses+'<br/>Games: '+ratio.games
}

let createTextTicks = function(ticks) {
    let textTicks = [0]
    for (let index = 1; index<ticks.length; index++) {
        textTicks.push((ticks[index]+ticks[index-1])/2)
    }
    textTicks.push(ticks.slice(-1)[0])
    return textTicks;
}

let draw = function(tournaments, races, opponentRaces, splitFields, splitfieldNames, parent) {
  let dataset;
  d3.csv('eurogames.csv', function(data) {
          dataset = data

          let filterMap = d3.map();
          filterMap.set('tournament', tournaments);
          filterMap.set('race', races);
          filterMap.set('opponentrace', opponentRaces);

          let filteredData = dataset.filter(function(ratio){

              let accept = true;
              filterMap.entries().forEach(function(filter){

                  if (filter.value != undefined && filter.value.length > 0 && !filter.value.includes(ratio[filter.key])) {
                    accept = false;
                  }
                })
    
              return accept;
           })

           let headingLabels = []
           headingLabels.push("Tournaments: " + (tournaments.length == tournamentMax ? "All" : tournaments.join(', ')))
           headingLabels.push("Races: " + (races.length == racesMax ? "All" : races.join(', ')))
           headingLabels.push("Opponent Races: " + (opponentRaces.length == racesMax ? "All" : opponentRaces.join(', ')))
           headingLabels.push("Split On: " + splitfieldNames.join(', '))

            headingLabels.forEach(function(headingLabel, index){
                d3.select('#'+parent).append('p').attr('font-size', headingFontSize+'px')
                .style('font-weight','bold').style('margin',headingSpacing+'px').text(headingLabel)
            })

            let ratios = d3.map();

            splitFields.reverse()
            filteredData.forEach(function(singleRatio){
                mapRatio(ratios, splitFields, singleRatio);

            })

            splitFields.reverse()
            drawChart(ratios, splitFields, parent)
          });
}

let mapRatio = function(ratioMap, splitFields, singleRatio) {
                    let key = splitFields[0];
                    let value = singleRatio[key];

                    if (splitFields.length > 1) {
                        if (!ratioMap.has(value)) {
                          ratioMap.set(value, d3.map());
                        }
                        return mapRatio(ratioMap.get(value), splitFields.slice(1), singleRatio);
                    }

                    if (!ratioMap.has(value)) {
                        ratioMap.set(value, {'games':0, 'wins':0, 'draws':0, 'losses':0})
                    }

                    let cummulativeRatio = ratioMap.get(value)
                    cummulativeRatio.games += +singleRatio.games
                    cummulativeRatio.wins += +singleRatio.wins
                    cummulativeRatio.draws += +singleRatio.draws
                    cummulativeRatio.losses += +singleRatio.losses
                    cummulativeRatio.percentage = (cummulativeRatio.wins + cummulativeRatio.draws/2)/cummulativeRatio.games;
}

let ChartService = function () {
    return {
        draw: draw
    }

}