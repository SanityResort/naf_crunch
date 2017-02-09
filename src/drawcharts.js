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


            d3.select('body').selectAll()
          });


}