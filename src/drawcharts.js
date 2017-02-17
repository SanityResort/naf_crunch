let barWidth = 10;
let barPadding = 5;
let xAxisMargin = 5;
let noWinHeight = 1;
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

let drawChart = function(ratios) {
            let values = ratios.values()
            let keys = ratios.keys()
            values.unshift(createEmptyEntry());
            keys.unshift('');

            let height = 100;
            let width = values.length * (barWidth + barPadding);


            let svg = d3.select('body').append('svg').attr('width', width).attr('height', height);

            svg.selectAll('rect').data(values).enter().append('rect')
                .attr('width', barWidth)
        	    .attr('height', function(value){return barHeight(height, value.percentage, value.games)})
        	    .attr('y', function(value){ return barYPos(height, value.percentage, value.games) } )
        	    .attr('x', function(value, index){return tickXPos(index, width, values.length)-barWidth/2});


            let xRange = d3.range(values.length +1).map(function(index){return tickXPos(index, width, values.length)})
            let xScale = d3.scaleOrdinal(xRange).domain(keys);
            let xAxis = d3.axisBottom(xScale);
            svg.append('g')
                .attr('transform', 'translate(0, '+height+')')
                .call(xAxis).selectAll('text')
                .style('text-anchor', 'end')
                .attr('dx', '-.8em')
                .attr('dy', '.15em')
                .attr('transform', 'rotate(-55)');

            let yRange = d3.range(5).map(function(d){return (4-d)*height/4});
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
          filterMap.set('tournament', ['EuroBowl - 2003']);
          filterMap.set('race', ['Amazons']);
          filterMap.set('opponentrace', []);
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
                let field = 'race';
                console.log('singleRatio: ' + singleRatio[field]+ ' vs ' + singleRatio.opponentrace)

                if (!ratios.has(singleRatio.opponentrace)) {
                    ratios.set(singleRatio.opponentrace, {'games':0, 'wins':0, 'draws':0, 'losses':0, 'isRatio': true})
                }
                let ratio = ratios.get(singleRatio.opponentrace)
                ratio.games += +singleRatio.games
                ratio.wins += +singleRatio.wins
                ratio.draws += +singleRatio.draws
                ratio.losses += +singleRatio.losses
            })


            ratios.entries().forEach(function(entry){
                entry.value.percentage = (+entry.value.wins + +entry.value.draws/2)/+entry.value.games

                console.log('Entry:' +entry.key + ' ' + JSON.stringify(entry.value) )
            })


            drawChart(ratios)

          });
}

