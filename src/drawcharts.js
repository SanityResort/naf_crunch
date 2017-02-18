const barWidth = 10;
const barPadding = 5;
const xAxisMargin = 5;
const noWinHeight = 1;
const graphHeight = 100;

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
            offset = populateTickPos(ratios.get(key), splitFields.slice(1), tickPos, offset, allRatios, allLabels) + barPadding
            ticks.push(offset)
        })

        let labels = allLabels.get(splitFields[0]);
                    ratios.keys().sort().forEach(function(key){
                        let label = key;
                        while (labels.includes(label)) {
                            label= " "+label
                        }
                        labels.push(label)
                    });

    } else {
        offset += barPadding + barWidth
        allRatios.push(ratios)
    }

    return offset;
}

let drawChart = function(ratios, splitFields) {
            let values = ratios.values()
            let keys = ratios.keys()

            let tickPos = d3.map();
            let allLabels = d3.map();
            splitFields.forEach(function(field){
                tickPos.set(field, [0]);
                allLabels.set(field, [""])
            })


            let allRatios = [createEmptyEntry()]

            let width = populateTickPos(ratios, splitFields, tickPos, 0, allRatios, allLabels);

            splitFields = splitFields.reverse()

            let finestTicks = tickPos.get(splitFields[0])
            let finestLabels = allLabels.get(splitFields[0])
            finestTicks.push(width)

            allLabels.values().forEach(function(labels){
                labels.push("");
            })

            allRatios.push(createEmptyEntry())

            let svg = d3.select('body').append('svg').attr('width', width).attr('height', graphHeight);

            svg.selectAll('rect').data(allRatios).enter().append('rect')
                .attr('width', barWidth)
        	    .attr('height', function(value){return barHeight(graphHeight, value.percentage, value.games)})
        	    .attr('y', function(value){ return barYPos(graphHeight, value.percentage, value.games) } )
        	    .attr('x', function(value, index){return finestTicks[index]-barWidth/2});


            let xRange = d3.range(finestTicks.length).map(function(index){return finestTicks[index]})
            let xScale = d3.scaleOrdinal(xRange).domain(finestLabels);
            let xAxis = d3.axisBottom(xScale);
            svg.append('g')
                .attr('transform', 'translate(0, '+graphHeight+')')
                .call(xAxis).selectAll('text')
                .style('text-anchor', 'end')
                .attr('dx', '-.8em')
                .attr('dy', '.15em')
                .attr('transform', 'rotate(-55)');

            let axisGap = 50;
            splitFields.slice(1).forEach(function(field){
                let ticks = tickPos.get(field);
                console.log("field: "+ field)
                console.log("ticks: " + JSON.stringify(ticks))
                let range = d3.range(ticks.length).map(function(index){return ticks[index]});
                let scale = d3.scaleOrdinal(range).domain(allLabels.get(field));
                let axis = d3.axisBottom(scale);
                 svg.append('g')
                                .attr('transform', 'translate(0, '+(graphHeight+50+axisGap)+')')
                                .call(axis)

                 axisGap += 50
            })

            let yRange = d3.range(5).map(function(d){return (4-d)*graphHeight/4});
            let yScale = d3.scaleOrdinal().range(yRange).domain([0,25,50,75,100]);
            let yAxis = d3.axisLeft(yScale);
            svg.append('g').call(yAxis);
}


let draw = function() {
  let dataset;
  d3.csv('eurogames.csv', function(data) {
          dataset = data

          let filterMap = d3.map();
          filterMap.set('year', undefined);
          filterMap.set('tournament', ['EuroBowl - 2003', 'EuroBowl - 2006']);
          filterMap.set('race', ['Amazons', 'Norse']);
          filterMap.set('opponentrace', []);

          let splitFields = ["year", "tournament", "race", "opponentrace"];

          let filteredData = dataset.filter(function(ratio){

              let accept = true;
              filterMap.entries().forEach(function(filter){

                  if (filter.value != undefined && filter.value.length > 0 && !filter.value.includes(ratio[filter.key])) {
                    accept = false;
                  }
                })
    
              return accept;
           })

            let ratios = d3.map();

            filteredData.forEach(function(singleRatio){

                mapRatio(ratios, splitFields, singleRatio);

            })

            drawChart(ratios, splitFields)

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

