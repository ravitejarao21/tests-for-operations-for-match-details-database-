const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const path = require("path");
const dbpath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;
const initialize = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server runs at localhost 3000");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initialize();

const playerconvert = (dbobject) => {
  return {
    playerId: dbobject.player_id,
    playerName: dbobject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const query = `SELECT * FROM player_details`;
  const details = await db.all(query);
  response.send(details.map((dbobject) => playerconvert(dbobject)));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT * FROM player_details WHERE player_id = ${playerId}`;
  const details = await db.get(query);

  response.send(playerconvert(details));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const updatingbody = request.body;

  const { playerName } = updatingbody;

  const query = `UPDATE player_details  SET player_name= "${playerName}"
    WHERE player_id = ${playerId}`;

  await db.run(query);
  response.send("Player Details Updated");
});

const matchconvert = (dbobject) => {
  return {
    matchId: dbobject.match_id,
    match: dbobject.match,
    year: dbobject.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const query = `SELECT * FROM match_details WHERE match_id = ${matchId}`;
  const details = await db.get(query);

  response.send(matchconvert(details));
});
const listofmatches = [];
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT * FROM player_match_score NATURAL JOIN 
  match_details 
   WHERE player_id = ${playerId}`;

  const details = await db.all(query);
  response.send(details.map((dbobject) => matchconvert(dbobject)));
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const query = `SELECT * FROM player_match_score NATURAL JOIN player_details 
    WHERE match_id = ${matchId}`;
  const details = await db.all(query);
  response.send(details.map((dbobject) => playerconvert(dbobject)));
});

const scoreconvert = (dbobject) => {
  return {
    playerId: dbobject.player_id,
    playerName: dbobject.player_name,
    totalScore: dbobject["SUM(score)"],
    totalFours: dbobject["SUM(fours)"],
    totalSixes: dbobject["SUM(sixes)"],
  };
};

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const query = `SELECT SUM(fours), SUM(sixes),SUM(score),player_name,player_id FROM player_match_score NATURAL JOIN player_details
    WHERE player_id = ${playerId}`;

  const query2 = `SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`;

  const playerScores = await db.get(query2);
  response.send(playerScores);
});

module.exports = app;
