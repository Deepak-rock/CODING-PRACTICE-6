const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const app = express()
app.use(express.json())

const databasePath = path.join(__dirname, 'covid19India.db')

let database = null

const intializeDBAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`Error: ${error.message}`)
    process.exit(1)
  }
}
intializeDBAndServer()

const convertStateDBObjectToResponseObject = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}

const convertDistrictDBObjectToResponseObject = dbObject => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

const convertstatisticsObjectToResponseObject = dbObject => {
  return {
    totalCases: dbObject.cases,
    totalCured: dbObject.cured,
    totalActive: dbObject.active,
    totalDeaths: dbObject.deaths,
  }
}
//API 1 Returns a list of all states in the state table

app.get('/states/', async (request, response) => {
  const getListOfStates = `
  SELECT 
    *
  FROM 
    state
  ORDER BY state_id;`
  const statesArray = await database.all(getListOfStates)
  response.send(
    statesArray.map(eachstate =>
      convertStateDBObjectToResponseObject(eachstate),
    ),
  )
})

//API 2 Returns a state based on the state ID

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateBaseOnId = `
  SELECT 
    *
  FROM 
    state
  WHERE
    state_id = ${stateId};`
  const stateDetails = await database.get(getStateBaseOnId)
  response.send(convertStateDBObjectToResponseObject(stateDetails))
})

//API 3 Create a district in the district table, district_id is auto-incremented

app.post('/districts/', async (request, response) => {
  const {stateId, districtName, cases, cured, active, deaths} = request.body
  const postDistrictQuery = `
  INSERT INTO
    district (state_id, district_name, cases, cured, active, deaths)
  VALUES
    (${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths});`
  await database.run(postDistrictQuery)
  response.send('District Successfully Added')
})
//API 4 Returns a district based on the district ID

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictBaseOnId = `
  SELECT 
    *
  FROM 
    district
  WHERE 
    district_id = ${districtId};`
  const districtDetails = await database.get(getDistrictBaseOnId)
  response.send(convertDistrictDBObjectToResponseObject(districtDetails))
})

//API 5 Deletes a district from the district table based on the district ID

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictBaseOnId = `
  DELETE FROM 
    district 
  WHERE
    district_id = ${districtId};`
  await database.run(deleteDistrictBaseOnId)
  response.send('District Removed')
})

//API 6 Updates the details of a specific district based on the district ID

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateDistrictBaseOnId = `
  UPDATE 
    district
  SET 
    district_name = '${districtName}' ,
    state_id = '${stateId}' ,
    cases ='${cases}' ,
    cured = '${cured}' ,
    active = '${active}' ,
    deaths ='${deaths}'
  WHERE 
  district_id = ${districtId};`

  await database.run(updateDistrictBaseOnId)
  response.send('District Details Updated')
})

//API 7 Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const statisticsOfTotal = `
  SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths) 
  FROM 
    district
  WHERE
    state_id = ${stateId};`
  const stats = await database.get(statisticsOfTotal)
  console.log(stats)
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})

//API 8 Returns an object containing the state name of a district based on the district ID

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`
  const state = await database.get(getStateNameQuery)
  response.send({stateName: state.state_name})
})
module.exports = app
