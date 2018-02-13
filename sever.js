const Express = require("express");
const firebase = require("firebase")
const axios = require('axios');
const User = require('./user');
const Story = require('./story');
const AllBusStop = require('./allBusStop')
const RoadBusStop = require('./roadBusStop')
const RoadMapBus = require('./roadMapBus')
const BusStopSequence = require('./busStopSequence')
const BusGulity = require('./busGulity');
const BusOnroad = require('./busOnroad')
const Road = require('./road')
const fs = require('fs')
const csv = require('fast-csv')
const assert = require('assert')
const async = require("async");
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const Promise = require('bluebird');
const direction = require('google-maps-direction');
const bodyParser = require('body-parser');
const cors = require('cors');
const geodist = require('geodist')
const moment = require('moment')
var itemsProcessed = 0;
var count = 0;

Promise.promisifyAll(mongoose);
mongoose.Promise = Promise;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:Nongbee1407@ds231658.mlab.com:31658/project');



const config = {
  apiKey: 'AIzaSyBG50FDcDb07OA7ti6mdAcbbotW6eoSW-k',
  authDomain: 'bbfl-8301a.firebaseapp.com',
  databaseURL: 'https://bbfl-8301a.firebaseio.com',
  storageBucket: 'bbfl-8301a.appspot.com',
}
if (!firebase.apps.length) {
  firebase.initializeApp(config)
}

const database = firebase.database()
const pathValues = [{}]
let testCount2 = [1, 2, 3, 4, 5, 6, 7]
let newBusGulityArray = []
let newBusOnRoad = [
  {
    index: 0,
    busRoad: 'A1',
    busID: '0430005000LTYLTTYL122200150',
    speed: 7,
    lat: 13.86999,
    lng: 100.57369,
    cycleOnRoad: 0,
    currentOnRoad: 0,
    currentBusStop: -1,
    gulityState1: false,
    gulityState2: false,
    gulityState3: false,
  }
  ,
  {
    index: 1,
    busRoad: 'A1',
    busID: '0430005000LTYLTTYL122200047',
    speed: 6,
    lat: 13.984463,
    lng: 100.60441,
    cycleOnRoad: 0,
    currentOnRoad: 0,
    currentBusStop: -1,
    gulityState1: false,
    gulityState2: false,
    gulityState3: false,
  }

]

let newcurrentCycleOnRoad = 0

tick = (data) => {
  console.log(data)
  const dataFirebase = getFirebase('address')
  console.log(dataFirebase)
}

function increment(counter) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      var check = counter + 1
      resolve(check);
    }, 40000000000000000);
  });
}

function increment22(counter) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      var check = counter + 2
      resolve(check);
    }, 40000000000000000);
  });
}
async function chainStart(counter) {
  counter = await increment(counter);
  counter = await increment22(counter);
  return counter;
}

function waitData(data) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(data);
    }, 2000);
  });
}

async function saveData(busID) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      var busData = []
      BusOnroad.find({ busRoad: 'A1', busID: busID }, function (err, data) {
        if (err) throw err;
        busData = data
      }).then(() => {
        if (busData.length > 0)
          resolve(1);
        else {
          resolve(0);
        }
      })
    }, 1000);
  });
}
async function testStart(busID) {
  let counter = await saveData(busID);
  return counter;
}


//step1
async function checkBusData(roadMapBus, busID, speed, busStopSequence, busLat, busLng, road, currentBusLocation, busOnroad) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      var busdata = []
      var returnData = {}
      var result = busOnroad.filter(element => (
        element.busID === busID && element.busRoad === road
      ))
      if (parseInt(result.length) !== parseInt(0)) {
        console.log('result.lenght1')
        console.log(result.length)
        resolve({
          busRoad: road,
          busID: busID,
          speed: busdata.speed,
          lat: result[0].lat,
          lng: result[0].lng,
          cycleOnRoad: result[0].cycleOnRoad,
          currentOnRoad: result[0].currentOnRoad,
          currentBusStop: result[0].currentBusStop,
          gulityState1: result[0].gulityState1,
          gulityState2: result[0].gulityState2,
          gulityState3: result[0].gulityState3,
          newBus: false,
        })
      }
      else {
        console.log('result.lenght2')
        console.log(result.length)
        newBusOnRoad.push({
          busRoad: road,
          busID: busID,
          speed: speed,
          lat: busLat,
          lng: busLng,
          cycleOnRoad: currentBusLocation.cycleOnRoad,
          currentOnRoad: currentBusLocation.currentOnRoad,
          currentBusStop: currentBusLocation.currentBusStop,
          gulityState1: false,
          gulityState2: false,
          gulityState3: false,
          newBus: true,
        })
        resolve({
          busRoad: road,
          busID: busID,
          speed: speed,
          lat: busLat,
          lng: busLng,
          cycleOnRoad: currentBusLocation.cycleOnRoad,
          currentOnRoad: currentBusLocation.currentOnRoad,
          currentBusStop: currentBusLocation.currentBusStop,
          gulityState1: false,
          gulityState2: false,
          gulityState3: false,
          newBus: true,
        })
      }
    }, 10);
  });
}



//step2
async function checkBusOutofRoad(busroad, busData, roadMapBus, lat, lng, timeStamp) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const indexRoadGo = []
      const indexRoadReturn = []
      var gulityData = []
      const checkBaseDistance = geodist({ lat: lat, lon: lng }, { lat: roadMapBus[0].lat, lon: roadMapBus[0].lng }, { exact: true, unit: 'km' })
      const resultCheckOutOfRoad = roadMapBus.filter(element => (
        ((parseFloat(element.lat).toFixed(4) === parseFloat(lat).toFixed(4)) && (parseFloat(element.lng).toFixed(4) === parseFloat(lng).toFixed(4))) ||
        (Math.abs(parseFloat((parseFloat(element.lat).toFixed(4) - parseFloat(lat).toFixed(4)) + (parseFloat(element.lng).toFixed(4) - parseFloat(lng).toFixed(4)))) < parseFloat(0.025))
      ))
      if (resultCheckOutOfRoad.length === 0) {
        if (busData.gulityState1 === false) {
          newBusGulityArray.push({
            busRoad: 'A1',
            busID: busData.busID,
            type: 'ขับออกนอกเส้นทาง',
            cycleOnRoad: busData.cycleOnRoad,
            timeStamp: timeStamp,
          })
          var newBusGulity = BusGulity({
            busRoad: 'A1',
            busID: busData.busID,
            type: 'ขับออกนอกเส้นทาง',
            cycleOnRoad: busData.cycleOnRoad,
            timeStamp: timeStamp,
            state: 0
          })
          newBusGulity.save(function (err) {
            resolve({ currentOnRoad: -1, lat: lat, lng: lng, gulityState1: true })
          })
        } else {
          BusGulity.find({ busID: busData.busID, cycleOnRoad: busData.cycleOnRoad, state: 0 }, function (err, data) {
            if (data !== null) {
              BusGulity.findOneAndUpdate({ busID: busData.busID, cycleOnRoad: busData.cycleOnRoad, state: 0 }, { state: 1 }, function (err, checkdata) {
                resolve({ currentOnRoad: -1, lat: lat, lng: lng, gulityState1: true })
              })
            }
            else {
              resolve({ currentOnRoad: -1, lat: lat, lng: lng, gulityState1: true })
            }
          })
        }
      }
      else {
        if (parseFloat(checkBaseDistance) < parseFloat(2.5)) {
          resolve({
            currentOnRoad: resultCheckOutOfRoad[0].index,
            lat: resultCheckOutOfRoad[0].lat,
            lng: resultCheckOutOfRoad[0].lng,
            gulityState1: busData.gulityState1
          })
        }
        else {
          const indexRoadGo = roadMapBus.filter(element => (
            (((parseFloat(element.lat).toFixed(3) === parseFloat(lat).toFixed(3)) && (parseFloat(element.lng).toFixed(3) === parseFloat(lng).toFixed(3))) ||
              (Math.abs(parseFloat((parseFloat(element.lat).toFixed(5) - parseFloat(lat).toFixed(5)) + (parseFloat(element.lng).toFixed(5) - parseFloat(lng).toFixed(5)))) < parseFloat(0.01)))
            && (element.index < 343)
          ))
          const indexRoadReturn = roadMapBus.filter(element => (
            (((parseFloat(element.lat).toFixed(3) === parseFloat(lat).toFixed(3)) && (parseFloat(element.lng).toFixed(3) === parseFloat(lng).toFixed(3))) ||
              (Math.abs(parseFloat((parseFloat(element.lat).toFixed(5) - parseFloat(lat).toFixed(5)) + (parseFloat(element.lng).toFixed(5) - parseFloat(lng).toFixed(5)))) < parseFloat(0.01)))
            && (element.index > 343)
          ))

          if (busData.currentBusStop < 5) {

            if (indexRoadGo.length === 0) {
              const newIndexRoadGo = resultCheckOutOfRoad.filter(element => (element.index < 343))
              resolve({
                currentOnRoad: newIndexRoadGo[Math.floor(newIndexRoadGo.length / 2)].index,
                lat: newIndexRoadGo[Math.floor(newIndexRoadGo.length / 2)].lat,
                lng: newIndexRoadGo[Math.floor(newIndexRoadGo.length / 2)].lng,
                gulityState1: busData.gulityState1
              })
            }
            else {
              resolve({
                currentOnRoad: indexRoadGo[Math.floor(indexRoadGo.length / 2)].index,
                lat: indexRoadGo[Math.floor(indexRoadGo.length / 2)].lat,
                lng: indexRoadGo[Math.floor(indexRoadGo.length / 2)].lng,
                gulityState1: busData.gulityState1
              })
            }
          }
          else {
            if (indexRoadReturn.length === 0) {
              const newIndexRoadReturn = resultCheckOutOfRoad.filter(element => (element.index > 343))
              resolve({
                currentOnRoad: newIndexRoadReturn[Math.floor(newIndexRoadReturn.length / 2)].index,
                lat: newIndexRoadReturn[Math.floor(newIndexRoadReturn.length / 2)].lat,
                lng: newIndexRoadReturn[Math.floor(newIndexRoadReturn.length / 2)].lng,
                gulityState1: busData.gulityState1
              })
            } else {
              resolve({
                currentOnRoad: indexRoadReturn[Math.floor(indexRoadReturn.length / 2)].index,
                lat: indexRoadReturn[Math.floor(indexRoadReturn.length / 2)].lat,
                lng: indexRoadReturn[Math.floor(indexRoadReturn.length / 2)].lng,
                gulityState1: busData.gulityState1
              })
            }
          }
        }
      }
    }, 10);
  });
}

//step3
async function checkBusCompleteCycle(busroad, busStopSequence, busData) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (busData.currentOnRoad === -1) {
        resolve({ currentBusStop: busData.currentBusStop, cycleOnRoad: busData.cycleOnRoad, gulityState2: busData.gulityState2 })
      }
      if (busData.currentBusStop === -2) {
        resolve({ currentBusStop: -2, cycleOnRoad: busData.cycleOnRoad, gulityState2: busData.gulityState2 })
      } else {
        var checkBusComplete = 0
        if (busData.currentOnRoad < busStopSequence[0]) {
          checkBusComplete = 1
        }
        else if (busData.currentOnRoad > busStopSequence[0] && busData.currentBusStop === -1) {
          checkBusComplete = 1
        }
        else {
          if (busData.currentOnRoad > busStopSequence[busStopSequence.length - 3] && busData.currentBusStop > busStopSequence[busStopSequence.length - 4]) {
            if (busData.currentOnRoad >= busStopSequence[busStopSequence.length - 3] && busData.currentOnRoad <= busStopSequence[busStopSequence.length - 2]) {
              checkBusComplete = 1
            }
            if (busData.currentOnRoad >= busStopSequence[busStopSequence.length - 2] && busData.currentOnRoad <= busStopSequence[busStopSequence.length - 1]) {
              checkBusComplete = 1
            }
          }
          else {
            if (busData.currentOnRoad >= busStopSequence[busData.currentBusStop] && busData.currentOnRoad <= busStopSequence[busData.currentBusStop + 1]) {
              checkBusComplete = 1
            }
            if (busData.currentOnRoad >= busStopSequence[busData.currentBusStop + 1] && busData.currentOnRoad <= busStopSequence[busData.currentBusStop + 2]) {
              checkBusComplete = 1
            }
            if (busData.currentOnRoad <= busStopSequence[busData.currentBusStop] && busData.currentOnRoad >= busStopSequence[busData.currentBusStop - 1]) {
              checkBusComplete = 1
            }
          }
        }
        if (checkBusComplete === 1) {
          if (busData.currentOnRoad > busStopSequence[busData.currentBusStop + 1]) {
            let returnData = busData.currentBusStop + 1
            if (busData.cycleOnRoad === 0) {
              newcurrentCycleOnRoad = newcurrentCycleOnRoad + 1
              resolve({ currentBusStop: returnData, cycleOnRoad: newcurrentCycleOnRoad, gulityState2: busData.gulityState2 });
            }
            else {
              resolve({ currentBusStop: returnData, cycleOnRoad: busData.cycleOnRoad, gulityState2: busData.gulityState2 });
            }
          }
          else {
            resolve({ currentBusStop: busData.currentBusStop, cycleOnRoad: busData.cycleOnRoad, gulityState2: busData.gulityState2 });
          }
        }
        else {
          if (busData.gulityState2 === false) {
            newBusGulityArray.push({
              busRoad: busroad,
              busID: busData.id,
              type: 'ขับไม่ครบทุกป้าย',
              cycleOnRoad: busData.cycleOnRoad,
              timeStamp: busData.timeStamp
            })
            var newBusGulity = BusGulity({
              busRoad: busroad,
              busID: busData.busID,
              type: 'ขับไม่ครบทุกป้าย',
              cycleOnRoad: busData.cycleOnRoad,
              timeStamp: timeStamp,
              state: 1
            })
            newBusGulity.save(function (err) {
              resolve({ currentBusStop: busData.currentBusStop, cycleOnRoad: busData.cycleOnRoad, gulityState2: true });
            })
          }
          else {
            resolve({ currentBusStop: busData.currentBusStop, cycleOnRoad: busData.cycleOnRoad, gulityState2: busData.gulityState2 });
          }
        }
      }
    }, 10);
  });
}

//step4
async function checkBusOverRide(busData) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (busData.gulityState3 === true) {
        resolve(busData.gulityState3)
      }
      else {
        const result = newBusOnRoad.filter(element => (
          (busData.currentOnRoad > element.currentOnRoad && busData.cycleOnRoad > element.cycleOnRoad)
          && element.cycleOnRoad !== 0
          && element.cycleOnRoad !== -1
          && element.currentOnRoad !== 0
          && element.currentOnRoad !== -1
          && element.busID !== busData.busID
          && element.gulityState1 === false
          && element.gulityState2 === false
          && element.gulityState3 === false
        ))
        if (result.length > 0) {
          newBusGulityArray.push({
            busRoad: busroad,
            busID: busData.id,
            type: 'ขับแซงรถในสายเดียวกัน',
            cycleOnRoad: busData.cycleOnRoad,
            state: 1,
            timeStamp: busData.timeStamp,
          })
          var newBusGulity = BusGulity({
            busRoad: busroad,
            busID: busData.busID,
            type: 'ขับแซงรถในสายเดียวกัน',
            cycleOnRoad: busData.cycleOnRoad,
            timeStamp: timeStamp,
            state: 1
          })
          newBusGulity.save(function (err) {
            resolve(true)
          })
        }
        else {
          resolve(false)
        }
      }
    }, 10);
  });
}



//step5
async function updateBusOnroad(busData, busStopSequence, busroad, busOnroad) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      var result = newBusOnRoad.filter(element => (
        element.busID === busData.busID && element.busRoad === busData.busRoad
      ))
      var index = result[0].index
      if (((busData.currentOnRoad > (busStopSequence[busStopSequence.length - 1]) - 10) || busData.currentOnRoad === 0) && busData.cycleOnRoad > 0) {
        busData.cycleOnRoad = 0
        busData.currentBusStop = -1
      }
      console.log('busData Step5')
      console.log(busData)
      if (busData.newBus === true) {
        console.log("it is workkkk newbus = true")
        var newBus = BusOnroad({
          index: 2,
          busRoad: 'A1',
          busID: busData.busID,
          speed: 20.5,
          lat: busData.lat,
          lng: busData.lng,
          cycleOnRoad: busData.cycleOnRoad,
          currentOnRoad: busData.currentOnRoad,
          currentBusStop: busData.currentBusStop,
          gulityState1: false,
          gulityState2: false,
          gulityState3: false,
        });
        newBus.save(function (err, data) {
          if (err) throw err;
          resolve(data)
        });
      }
      else {
        console.log("it is workkkk newbus = false")
        BusOnroad.findOneAndUpdate({ busRoad: busData.busRoad, busID: busData.busID },
          {
            cycleOnRoad: busData.cycleOnRoad, currentOnRoad: busData.currentOnRoad,
            speed: busData.speed, lat: busData.lat, lng: busData.lng,
            gulityState1: busData.gulityState1,
            gulityState2: busData.gulityState2,
            gulityState3: busData.gulityState3,
          }, function (err, bus) {
            if (err) throw err;
            // we have the updated user returned to us
            resolve(bus)
          });
      }
    }, 10);
  });

}


async function getBusOnRoad(roadMapBus, busID, speed, busStopSequence, busLat, busLng, road, timeStamp, busOnroad) {
  let currentBusLocation = await findBusCurrentLocation(roadMapBus, busLat, busLng, busStopSequence, road)
  let data = await checkBusData(roadMapBus, busID, speed, busStopSequence, busLat, busLng, road, currentBusLocation, busOnroad)
  console.log('data1')
  console.log(data)
  let checkOutOfRoadData = await checkBusOutofRoad(road, data, roadMapBus, busLat, busLng, timeStamp)
  data = await assignData(data, checkOutOfRoadData)
  console.log('data2')
  console.log(data)
  let checkBusCompleteCycleData = await checkBusCompleteCycle(road, busStopSequence, data)
  data = await assigncheckBusCompleteCycle(data, checkBusCompleteCycleData)
  console.log('data3')
  console.log(data)
  let checkBusOverRideData = await checkBusOverRide(data)
  data = await assigncheckBusOverRide(data, checkBusOverRideData)
  console.log('data4')
  console.log(data)
  data = await updateBusOnroad(data, busStopSequence, road, busOnroad)
  return data;
}

var newCurrentBusLocation = 0;
var newCurrentOnRoad = 0;

async function findBusCurrentLocation(roadMapBus, lat, lng, busStopSequence, busroad) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const result = roadMapBus.filter(element => (
        ((parseFloat(element.lat).toFixed(4) === parseFloat(lat).toFixed(4)) && (parseFloat(element.lng).toFixed(4) === parseFloat(lng).toFixed(4))) ||
        (Math.abs(parseFloat((parseFloat(element.lat).toFixed(4) - parseFloat(lat).toFixed(4)) + (parseFloat(element.lng).toFixed(4) - parseFloat(lng).toFixed(4)))) < parseFloat(0.025))
      ))
      if (result.length > 0) {
        if (result[0].index < busStopSequence[0])
          resolve({ cycleOnRoad: 0, currentOnRoad: result[0].index, currentBusStop: -1 })
        else
          resolve({ cycleOnRoad: -1, currentOnRoad: result[0].index, currentBusStop: -2 })
      }
      else {
        resolve({ cycleOnRoad: -1, currentOnRoad: -1, currentBusStop: -2 })
      }
    }, 10);
  });
}

async function assignData(busData, checkOutOfRoadData) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      busData.currentOnRoad = checkOutOfRoadData.currentOnRoad
      busData.lat = checkOutOfRoadData.lat
      busData.lng = checkOutOfRoadData.lng
      busData.gulityState1 = checkOutOfRoadData.gulityState1
      resolve(busData)
    }, 10);
  });
}

async function assigncheckBusCompleteCycle(busData, checkBusCompleteCycleData) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      busData.currentBusStop = checkBusCompleteCycleData.currentBusStop
      busData.cycleOnRoad = checkBusCompleteCycleData.cycleOnRoad
      busData.gulityState2 = checkBusCompleteCycleData.gulityState2
      resolve(busData)
    }, 10);
  });
}

async function assigncheckBusOverRide(busData, checkBusOverRideData) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      busData.gulityState3 = checkBusOverRideData
      resolve(busData)
    }, 10);
  });
}

var pathA = { name: 'pathA', link: [{ connect: 'pathB', indexPoint: 5, unIndexPoint: 8 }] }
var pathB = { name: 'pathB', link: [{ connect: 'pathA', indexPoint: 8, unIndexPoint: 5 }, { connect: 'pathC', indexPoint: 10, indexPoint: 14 }] }
var pathC = { name: 'pathC', link: [{ connect: 'pathB', indexPoint: 14, unIndexPoint: 10 }] }
var pathD = { name: 'pathD', link: [{ connect: 'pathC', indexPoint: 25, unIndexPoint: 30 }] }

findPath = (path1, path2) => {
  var finalPath = []
  var startPath = []
  var endPath = []
  var resultPath1 = path1.link.filter(element => (
    element.connect === path2.name
  ))
  var resultPath2 = path2.link.filter(element => (
    element.connect === path1.name
  ))
  startPath = path1
  endPath = path2
  if (resultPath1.length === 0 && resultPath2.length === 0) {
    while (finalPath.length === 0) {
      var pathfirst = startPath.link.filter(element => (
        element.connect === endPath.link[0].connect
      ))
      if (pathfirst.length > 0) {
        var path = pathB.link.filter(element => (
          element.connect === 'pathA' || element.connect === 'pathC'
        ))
        var finalPath = startPath.link.concat(path)
        finalPath = finalPath.concat(endPath.link)
      }
      else {

      }
    }
    return finalPath
  }
  else {
    var returnArray = resultPath1.concat(resultPath2)
    console.log(returnArray)
    return returnArray
  }
}

testRecusive = (count) => {
  if (count > 0) {
    return count * testRecusive(count - 1)
  }
  else {
    return 1
  }
}


test = () => {
  axios.get('https://roads.googleapis.com/v1/snapToRoads', {
    interpolate: true,
    key: 'AIzaSyA1xME8xCwj0GBjJVQGyE5cqx5xeGmu4Aw',
    path: '35.27801,149.12958|-35.28032,149.12907|-35.28099,149.12929|-35.28144,149.12984|-35.28194,149.13003|-35.28282,149.12956|-35.28302,149.12881|-35.28473,149.12836'
  }, function (data) {
    console.log(data)
  });
}

const app = Express();


app.use(bodyParser.json())
app.use(cors())
app.use(require('./controllers'))

var port = process.env.PORT || 3000;
app.get('/', function (req, res) {
  res.send('Hello W');
})


app.listen(port, () => {
  console.log('Started ');
  // var day = new Date("2013-02-08 09:30:26");
  // console.log(day)
  // axios.get('http://analytics.dlt.transcodeglobal.com/test_businfo.txt')
  //   .then(data => {
  //     var busData = data.data
  //     var arr = [];
  //     for (let o in busData) {
  //       if (busData.hasOwnProperty(o)) {
  //         arr.push(busData[o]);
  //       }
  //     }
  //     var str = arr[0].path
  //     var pos = str.indexOf("ต.")
  //     var res = arr[0].path.slice(2);
  //     console.log(str)
  //     console.log(pos)
  //   })


  // var busStop = []
  // var path = ''
  // RoadBusStop.find({ busRoad: 'A1' }, function (err, data) {
  //   if (err) throw err;
  //   busStop = data[0].busStop
  // },400000000000).then(() => {
  //   busStop.forEach(elelement =>{
  //     path = path + elelement.lat.toString() + ',' + elelement.lng.toString() + '|'
  //   })
  //   path = path.slice(0,path.length-2)
  //   console.log(path)
  // })

  // var busStop = []
  // var stream = fs.createReadStream("busstop.csv");

  // csv
  //   .fromStream(stream, { headers: true })
  //   .on("data", function (data) {
  //     busStop.push({ index: parseInt(data.ลำดับป้ายรถเมล์), nameTH: data.ชื่อภาษาไทย,nameEG: data.ชื่อภาษาอังกฤษ, detail: data.รายละเอียด,
  //     lat: parseFloat(data.ละติจูด), lng: parseFloat(data.ลองติจูด)
  //     })
  //   })
  //   .on("end", function () {
  //     busStop.forEach(element =>{
  //       var newBusStop = AllBusStop({
  //         index: element.index,
  //         nameTH: element.nameTH,
  //         nameEG: element.nameEG,
  //         detail: element.detail,
  //         lat: parseFloat(element.lat),
  //         lng: parseFloat(element.lng)
  //       })
  //       newBusStop.save(function (err) {
  //         if (err) throw err;
  //       })
  //     })
  //   })

  // User.find({username: 'star'}, function(err, users) {
  //   if (err) throw err;
  //   console.log(users.length)
  // })



  // Story
  // .findOne({ title: 'NewwStoryyyyyyyyyy' })
  // .populate('author') //This populates the author id with actual author information!
  // .exec(function (err, story) {
  //   if (err) return handleError(err);
  //   if (story === null){
  //     console.log('no data')
  //   }
  //   // prints "The author is Bob Smith"
  // });



  //     // save the user
  //     newsequenceBusStop.save(function (err) {
  //       if (err) throw err;
  //       console.log('creae newsequenceBusStop')
  //     });
  //   })
  // })


  // csv
  //   .fromStream(stream, { headers: true })
  //   .on("data", function (data) {
  //     bus.push({ lat: data.lat, lng: data.lon })
  //   })
  //   .on("end", function () {
  //     AllBusStop.find({}, function (err, data) {
  //       if (err) throw err;
  //       busStop = data
  //     }).then(() => {
  //       bus.forEach((element,index) => {
  //         const result = busStop.filter(data =>
  //           (parseFloat(data.lat).toFixed(4) === parseFloat(element.lat).toFixed(4) && parseFloat(data.lng).toFixed(4) === parseFloat(element.lng).toFixed(4))
  //           || (parseFloat(data.lat).toFixed(3) === parseFloat(element.lat).toFixed(3) && parseFloat(data.lng).toFixed(4) === parseFloat(element.lng).toFixed(4))
  //           || (parseFloat(data.lat).toFixed(4) === parseFloat(element.lat).toFixed(4) && parseFloat(data.lng).toFixed(3) === parseFloat(element.lng).toFixed(3))
  //         )
  //         if (result.length === 1) {
  //           const checkData = busStopOnRoad.filter(data =>
  //           data.nameTH === result[0].nameTH
  //           )
  //           if(checkData.length === 0)
  //           {
  //             busStopOnRoad.push({sequence: index,index: result[0].index,nameTH: result[0].nameTH , nameEG: result[0].nameEG,
  //               detail: result[0].detail,lat:result[0].lat,lng:result[0].lng})
  //           }
  //         }
  //       })
  //     }).then(() =>{
  //       console.log(busStopOnRoad)
  //     })
  //   })

  // AllBusStop.find({}, function(err, busStop) {
  //   if (err) throw err;
  //   console.log(busStop.length);
  // }).then(() =>{
  //   test11()
  // })


  //   AllBusStop.find({}, function (err, data) {
  //     if (err) throw err;
  //     busStop = data
  //   }).then(() => {
  //     busStopName.forEach((element, index) => {
  //       const result = busStop.filter(data =>
  //         data.nameTH === element
  //       )
  //       if (result.length > 0) {
  //         busStopOnRoad.push({
  //           sequence: index, index: result[0].index, nameTH: result[0].nameTH, nameEG: result[0].nameEG,
  //           detail: result[0].detail, lat: result[0].lat, lng: result[0].lng
  //         })
  //       }
  //     })
  //   }).then(() => {
  //     console.log(busStopOnRoad)

  // })

  // RoadMapBus.find({ busRoad: 'A1' }, function (err, roadMapdata) {
  //   if (err) throw err;
  //   roadMapBus = roadMapdata
  // }).then(() => {
  //   const result = roadMapBus.filter(element => {
  //     ((parseFloat(element.lat).toFixed(4) === parseFloat(busData.lat).toFixed(4)) && (parseFloat(element.lng).toFixed(4) === parseFloat(busData.lng).toFixed(4))) ||
  //       (Math.abs(parseFloat((parseFloat(element.lat).toFixed(4) - parseFloat(busData.lat).toFixed(4)) + (parseFloat(element.lng).toFixed(4) - parseFloat(busData.lng).toFixed(4)))) > parseFloat(0.25))
  //   })
  //   if (result.length === 0) {
  //     var cycleOnRoad =
  //       BusGulity.find({ busRoad: 'A1', busID: busData.id, cycleOnRoad: cycleOnRoad, type: 'ขับออกนอกเส้นทาง', state: 0 }, function (err, result) {
  //         if (err) throw err;
  //         if (result.length === 0) {
  //           var newBusGulity = BusGulity({
  //             busRoad: 'A1',
  //             busID: busData, id,
  //             type: 'ขับออกนอกเส้นทาง',
  //             cycleOnRoad: busData.cycleOnRoad,
  //             state: 0,
  //           });
  //           BusGulity.save(function (err) {
  //             if (err) throw err;
  //           });
  //         }
  //         else {
  //           var newBusGulity = BusGulity({
  //             busRoad: 'A1',
  //             busID: busData, id,
  //             type: 'ขับออกนอกเส้นทาง',
  //             cycleOnRoad: busData.cycleOnRoad,
  //             state: 1,
  //           });
  //           BusGulity.save(function (err) {
  //             if (err) throw err;
  //           });
  //         }
  //       })
  //   }
  // })


  // +++ Save all to Road
  // var busStopSequence = [];
  // var roadMapBus = []
  // var roadBusStop = []
  // var busOnroad = []

  // BusStopSequence.find({ busRoad: 'A1' }, function (err, data) {
  //   busStopSequence = data
  // }).then(() => {
  //   RoadMapBus.find({ busRoad: 'A1' }, function (err, data) {
  //     roadMapBus = data
  //   }).then(() => {
  //     var newRoad = Road({
  //       name: 'A1',
  //       fullname: 'A1 ทางด่วน (รถ ขสมก.-รถปรับอากาศ)',
  //       cycleOnRoad: 0,
  //       busStopSequence: busStopSequence[0]._id,
  //       roadMapBus: roadMapBus[0]._id,

  //     });

  //     newRoad.save(function (err) {
  //       if (err) throw err;
  //     });
  //   })
  // })

  //-------------------------------------------------++++++++++++++++

  var busStopSequence = [];
  var roadMapBus = []
  var roadBusStop = []
  var busOnroad = []
  var currentBusLocation = null
  var busRoad = null
  var busData = 0

  var busFromFile = []
  var stream = fs.createReadStream("test22.csv");

  csv
    .fromStream(stream, { headers: true })
    .on("data", function (data) {
      busFromFile.push({
        index: parseInt(data.index), busID: data.busID, lat: parseFloat(data.lat), lng: parseFloat(data.lng), speed: data.speed, timeStamp: data.time
      })
    })
    .on("end", function () {

      Road
        .findOne({ name: 'A1' })
        .populate('busStopSequence')
        .populate('roadMapBus')
        .exec(function (err, data) {
          cycleOnRoad = data.cycleOnRoad
          busStopSequence = data.busStopSequence.sequence.sort()
          roadMapBus = data.roadMapBus.roadMap
          BusOnroad.find({}, function (err, data) {
            busOnroad = data
          }).then(() => {
            //console.log(busStopSequence)
            // getBusOnRoad(roadMapBus, bus.busID, bus.speed, busStopSequence, bus.lat, bus.lng, 'A1', bus.timeStamp).then(val => {
            //   itemsProcessed++
            //   chainStart()
            //   if (itemsProcessed === busFromFile.length) {
            //     console.log(newBusGulityArray)
            //     console.log('ENDDDDDDD')
            //   }
            // })
          })
        })
    })
  setInterval(() => {
    if (count + 5 < busFromFile.length) {
      var i = count
      console.log('i')
      console.log(i)
      Road
        .findOne({ name: 'A1' })
        .populate('busStopSequence')
        .populate('roadMapBus')
        .exec(function (err, data) {
          cycleOnRoad = data.cycleOnRoad
          busStopSequence = data.busStopSequence.sequence.sort()
          roadMapBus = data.roadMapBus.roadMap
          BusOnroad.find({}, function (err, data) {
            busOnroad = data
            // console.log('busOnroad')
            // console.log(busOnroad)
          }).then(() => {
            getBusOnRoad(roadMapBus, busFromFile[i].busID, busFromFile[i].speed, busStopSequence, busFromFile[i].lat, busFromFile[i].lng, 'A1', busFromFile[i].timeStamp, busOnroad).then(val => {
              count++
              console.log(val)
              //console.log(newBusOnRoad)
              //console.log(busFromFile[i].timeStamp)
              // console.log('count')
              // console.log(count)
              // if (i = count + 5){
              //   // console.log(val)
              //   // console.log(busFromFile[i].timeStamp)
              //   // console.log(i)
              //   console.log('it is work')
              //   count = count + 5
              // }
            })
          })
        })
    }
    else {
      console.log("endddddd")
    }
  }, 8000)

  // var testArray = [1, 2, 3]
  // console.log(testArray.indexOf(1))
  // console.log(testArray.indexOf(0))
  // RoadMapBus.find({ busRoad: 'A1' }, function (err, data) {
  //   if (err) throw err;
  //   const result = data[0].roadMap.filter(element => (
  //     (((parseFloat(element.lat).toFixed(4) === parseFloat(13.94712).toFixed(4)) && (parseFloat(element.lng).toFixed(4) === parseFloat(100.61669).toFixed(4))) ||
  //       (Math.abs(parseFloat((parseFloat(element.lat).toFixed(5) - parseFloat(13.94712).toFixed(5)) + (parseFloat(element.lng).toFixed(5) - parseFloat(100.61669).toFixed(5)))) < parseFloat(0.015)))
  //     && (element.index > 324)
  //   ))
  //   console.log(result[Math.floor(result.length / 2)])
  //   var lat = result[Math.floor(result.length / 2)].lat
  //   var lng = result[Math.floor(result.length / 2)].lng
  //   var dist = geodist({ lat:  13.94712, lon: 100.61669 }, { lat: lat, lon: lng }, { exact: true, unit: 'km' })
  //   console.log(dist)
  // })


  // RoadBusStop.find({ busRoad: 'A1' }, function (err, data) {
  //   busStop = data[0].busStop
  // }).then(() => {
  //   RoadMapBus.find({ busRoad: 'A1' }, function (err, data) {
  //     roadMap = data[0].roadMap
  //   }).then(() => {
  //     busStop.forEach(element => {
  //       const result = roadMap.filter(data =>
  //         ((parseFloat(data.lat).toFixed(3) === parseFloat(element.lat).toFixed(3) || parseFloat(data.lat).toFixed(4) === parseFloat(element.lat).toFixed(4))
  //           || (parseFloat(data.lat).toFixed(4) === parseFloat(element.lat).toFixed(4) || parseFloat(data.lat).toFixed(3) === parseFloat(element.lat).toFixed(3))
  //           || (parseFloat(data.lat).toFixed(4) === parseFloat(element.lat).toFixed(4) || parseFloat(data.lat).toFixed(4) === parseFloat(element.lat).toFixed(4))
  //         )
  //       )
  //       sequenceBusStop.push(result[result.length - 1].index)
  //     })
  //     sequenceBusStop.push(roadMap.length - 1)
  //   }).then(() => {
  //     var newsequenceBusStop = BusStopSequence({
  //       busRoad: 'A1',
  //       sequence: sequenceBusStop
  //     });

  // var testBusID = [4, 8, 3]


  // testBusID.forEach(element => {
  //   chainStart(element).then(val => {
  //     console.log(val)
  //   })
  // })

  // testCount2.forEach(element => {
  //   chainStart(element).then(val => {
  //     console.log(val)
  //   })
  // })

  //findPath(pathA, pathB)

});
