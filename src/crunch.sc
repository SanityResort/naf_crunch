import java.nio.file.{Files, Paths}

case class Ratio(var games:Int = 0, var wins: Int=0, var draws:Int=0, var losses:Int=0) {
  def addWin(): Unit ={
    wins+=1
    games+=1
  }
  def addDraw(): Unit ={
    draws+=1
    games+=1
  }
  def addLoss(): Unit ={
    losses+=1
    games+=1
  }

  def percentage():Double = {
    if (games > 0) {(wins.asInstanceOf[Double]+draws.asInstanceOf[Double]/2.0)/games.asInstanceOf[Double]} else {0}
  }
}

val races:Seq[String] = Vector("Amazons","Chaos","Chaos Dwarves","Chaos Pact",
  "Dark Elves","Dwarves","Elves","Goblins","Halflings","High Elves","Humans",
  "Khemri","Lizardmen","Necromantic","Norse","Nurgle's Rotters","Ogres","Orc",
  "Skaven","Slann","Undead","Underworld","Vampires","Wood Elves")

val tournaments:collection.mutable.Map[String,Map[String, Map[String, Ratio]]] = collection.mutable.Map()

  Vector(
  "Eurobowl - 2003","Eurobowl 2004 - 2004","Eurobowl - 2005","Eurobowl 2006 - 2006",
  "Eurobowl V - 2008", "Eurobowl 2009 - 2009","eurobowl 7 - 2010","Eur'Open Bowl - 2010",
  "EUROBOWL 2012 - 2012","EurOpen 2012 - 2012","Eurobowl 2013 - 2013","EurOpen 2013 - 2013",
  "Eurobowl X - 2015", "Eur'open IV - 2015","EuroBowl 2016 - 2016", "EurOpen 2016 - 2016")
  .map(tournament => (tournament,races.map(race => (race, races.map(race => (race, Ratio())).toMap)).toMap)).toMap

def normalize(tournament: String, day: String): String = {
  val normalizedTournament: String = tournament match {
    case t if t contains("pen") => "EurOpen"
    case _ => "EuroBowl"
  }

  val year = day.split("\\.").last.split(" ").head

  s"$normalizedTournament - $year"
}

val bufferedSource = io.Source.fromFile("D:\\Media\\Docs\\Bloodbowl\\naf_game_full.csv")
for (line <- bufferedSource.getLines) {
  val cols = line.split(",").map(_.trim)
  if (cols(0).startsWith("Eur")) {
    val normaliedTournament:String = normalize(cols(0), cols(12))
  println(s"normalized: $normaliedTournament")
    if (!tournaments.contains(normaliedTournament)){
      tournaments.put(normaliedTournament, races.map(race => (race, races.map(race => (race, Ratio())).toMap)).toMap)
    }

    val tournament = tournaments.get(normaliedTournament)
    val race1:Ratio = tournament.get(cols(6))(cols(10))
    val race2:Ratio = tournament.get(cols(10))(cols(6))
    val score1:Int = cols(7).toInt
    val score2:Int = cols(11).toInt
    val result:Int = score1 - score2

    if (result == 0) {
      race1.addDraw()
      race2.addDraw()
    } else if (result < 0) {
      race1.addLoss()
      race2.addWin()
    } else {
      race2.addLoss()
      race1.addWin()
    }
  }
}

val writer = Files.newBufferedWriter(Paths.get("D:\\Development\\projects\\naf_crunch\\src\\eurogames.csv"))

writer.write("tournament,race,opponentrace,games,wins,draws,losses,year")
writer.newLine()
for ((tournament,races) <- tournaments; (race,opposingraces)<-races; (opponentrace,ratio )<- opposingraces)
  yield {
if (ratio.games > 0) {
  writer.write(s"${tournament},${race},${opponentrace},${ratio.games},${ratio.wins},${ratio.draws},${ratio.losses},${tournament.split(" ").last}")
  writer.newLine()
}
  }

writer.flush()
writer.close()


