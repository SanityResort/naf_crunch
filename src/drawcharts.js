var barWidth = 10;
var barPadding = 5;
var xAxisMargin = 5;
var noWinHeight = 1;
var barHeight = function(maxHeight, percentage, games) {
    if (percentage>0) {
        return percentage*maxHeight;
    } else if (games > 0) {
        return noWinHeight;
    }else {
        return 0;
    }
}

var barYPos = function(maxHeight, percentage, games) {
    return maxHeight - barHeight(maxHeight, percentage, games);
}

var tickXPos = function(index, width, size) {
    return index*width/size;
}

var createEmptyEntry = function() {
    return {
        value: {
            percentage:0,
            games:0
        }
    }
}

var drawChart = function(width, height, keys, values) {
            values.unshift(createEmptyEntry());
            keys.unshift("");
            values.push(createEmptyEntry());
            keys.push("");
            var svg = d3.select("body").append("svg").attr("width", width).attr("height", height);

            svg.selectAll("rect").data(values).enter().append("rect")
                .attr("width", barWidth)
        	    .attr("height", function(entry){return barHeight(height, entry.value.percentage, entry.value.games)})
        	    .attr("y", function(entry){ return barYPos(height, entry.value.percentage, entry.value.games) } )
        	    .attr("x", function(entry, index){return tickXPos(index, width, values.length)-barWidth/2});


            var xRange = d3.range(values.length).map(function(index){return tickXPos(index, width, values.length)})
            var xScale = d3.scaleOrdinal(xRange).domain(keys);
            var xAxis = d3.axisBottom(xScale);
            svg.append("g")
                .attr("transform", "translate(0, "+height+")")
                .call(xAxis).selectAll("text")
                .style("text-anchor", "end")
                .attr("dx", "-.8em")
                .attr("dy", ".15em")
                .attr("transform", "rotate(-65)");

            var yRange = d3.range(10).map(function(d){return d*height/10});
            var yScale = d3.scaleLinear().range([height,0]).domain([0,1]);
            var yAxis = d3.axisLeft(yScale);
            svg.append("g").call(yAxis);
}


var draw = function() {
  var dataset;
  d3.csv('eurogames.csv', function(data) {
          dataset = data
           var filteredData = dataset.filter(function(ratio){

                  return ratio.tournament == 'EuroBowl - 2003' && ratio.race == 'Amazons';
              })

            var ratios = d3.map();

            filteredData.forEach(function(singleRatio){
                var field = 'race';
                console.log('singleRatio: ' + singleRatio[field]+ ' vs ' + singleRatio.opponentrace)

                if (!ratios.has(singleRatio.opponentrace)) {
                    ratios.set(singleRatio.opponentrace, {'games':0, 'wins':0, 'draws':0, 'losses':0})
                }
                var ratio = ratios.get(singleRatio.opponentrace)
                ratio.games += +singleRatio.games
                ratio.wins += +singleRatio.wins
                ratio.draws += +singleRatio.draws
                ratio.losses += +singleRatio.losses
            })


            ratios.entries().forEach(function(entry){
                entry.value.percentage = (+entry.value.wins + +entry.value.draws/2)/+entry.value.games

                console.log('Entry:' +entry.key + ' ' + JSON.stringify(entry.value) )
            })


            drawChart(500, 300, ratios.keys(), ratios.entries())

          });
}

