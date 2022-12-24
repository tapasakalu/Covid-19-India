const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
app.use(express.json());

const intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error is ${error}`);
    process.exit(1);
  }
};
intializeDBAndServer();

// API 1
// Returns a list of all states in the state table

const convertStateDBObjectAPI1 = (objectItem) => {
  return {
    stateId: objectItem.state_id,
    stateName: objectItem.state_name,
    population: objectItem.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStateQuery = `SELECT * FROM state`;
  const getStateQueryResponse = await db.all(getStateQuery);
  response.send(
    getStateQueryResponse.map((eachState) =>
      convertStateDBObjectAPI1(eachState)
    )
  );
});

//API 2
//Returns a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQueryById = `SELECT * FROM state WHERE state_id = ${stateId}`;
  const getStateQueryByIdResponse = await db.get(getStateQueryById);
  response.send(getStateQueryByIdResponse);
});

//API 3
//Create a district in the district table, district_id is auto-incremented

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const creteDistrictQuery = `INSERT INTO 
     district(district_name,state_id,cases,cured,active,deaths)
     VALUES('${districtName}',${stateId}, ${cases},${cured},${active},${deaths})
    `;
  const createDistrictQueryResponse = await db.run(creteDistrictQuery);
  response.send("District Successfully Added");
});

//API 4
//Returns a district based on the district ID

const convertDbObjectAPI4 = (objectItem) => {
  return {
    districtId: objectItem.district_id,
    districtName: objectItem.district_name,
    stateId: objectItem.state_id,
    cases: objectItem.cases,
    cured: objectItem.cured,
    active: objectItem.active,
    deaths: objectItem.deaths,
  };
};
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictByIdQuery = `SELECT * FROM district WHERE district_id=${districtId};`;
  const getDistrictByIdQueryResponse = await db.get(getDistrictByIdQuery);
  response.send(convertDbObjectAPI4(getDistrictByIdQueryResponse));
});

//API 5
// Deletes a district from the district table based on the district ID

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id=${districtId}`;
  const deleteResponse = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6
//Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `UPDATE district SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths} where district_id = ${districtId};`;

  const updateDistrictQueryResponse = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API 7
//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateByIDStatsQuery = `SELECT sum(cases) as totalCases, sum(cured) as totalCured,
    sum(active) as totalActive , sum(deaths) as totalDeaths FROM district WHERE state_id = ${stateId};`;

  const getStateByIDStatsQueryResponse = await db.get(getStateByIDStatsQuery);
  response.send(getStateByIDStatsQueryResponse);
});

//API 8
// Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `SELECT state_id FROM district WHERE district_id = ${districtId};`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  //console.log(typeof getDistrictIdQueryResponse.state_id);
  const getStateNameQuery = `select state_name as stateName from state where 
  state_id = ${getDistrictIdQueryResponse.state_id}`;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
