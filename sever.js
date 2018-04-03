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
const BusContract = require('./busContract')
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
var count = 129;

Promise.promisifyAll(mongoose);
mongoose.Promise = Promise;
//mongoose.connect(process.env.MONGODB_URI || 'mongodb://admin:Nongbee1407@ds231658.mlab.com:31658/project');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/basedir');
mongoose.connection.on('error', function (err) {
  console.log('Mongoose default connection error: ' + err);
});

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

// let newcurrentCycleOnRoad = 0

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

checkDistance = (lat1, lng1, lat2, lng2) => {
  const distance = geodist({ lat: lat1, lon: lng1 }, { lat: lat2, lon: lng2 }, { exact: true, unit: 'km' })
  return distance
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
async function checkBusData(roadMapBus, busID, speed, busStopSequence, busLat, busLng, road, currentBusLocation, busOnroad, timeStamp) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      var busdata = []
      var returnData = {}
      var result = busOnroad.filter(element => (
        element.busID === busID && element.busRoad === road
      ))
      if (parseInt(result.length) !== parseInt(0)) {
        var previousTime = moment(new Date(result[0].timeStamp))
        previousTime.add(7, 'minutes')
        var presentTime = moment(new Date(timeStamp))
        if (presentTime > previousTime)
          result[0].canCompute = false
        else
          result[0].canCompute = true
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
          passCenter: result[0].passCenter,
          busLock: result[0].busLock,
          newBus: false,
          timeStamp: result[0].timeStamp,
          canCompute: result[0].canCompute,
        })
      }
      else {
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
          passCenter: false,
          newBus: true,
          busLock: [{ lat: busLat, lng: busLng }],
          timeStamp: timeStamp,
          canCompute: true,
        })
      }
    }, 10);
  });
}



//step2
async function checkBusOutofRoad(busroad, busData, roadMapBus, lat, lng, timeStamp, centerPath) {
  console.log(centerPath)
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const indexRoadGo = []
      const indexRoadReturn = []
      var gulityData = []
      const checkBaseDistance = geodist({ lat: lat, lon: lng }, { lat: roadMapBus[0].lat, lon: roadMapBus[0].lng }, { exact: true, unit: 'km' })
      const resultCheckOutOfRoad = roadMapBus.filter(element => (
        ((parseFloat(element.lat).toFixed(4) === parseFloat(lat).toFixed(4)) && (parseFloat(element.lng).toFixed(4) === parseFloat(lng).toFixed(4))) ||
        (parseFloat(checkDistance(element.lat, element.lng, lat, lng)) < parseFloat(2.5))
      ))
      if (resultCheckOutOfRoad.length === 0) {
        busData.busLock.push({ lat: lat, lng: lng })
        if (busData.gulityState1 === false) {
          var newBusGulity = BusGulity({
            busRoad: busroad,
            busID: busData.busID,
            type: 'ขับออกนอกเส้นทาง',
            cycleOnRoad: busData.cycleOnRoad,
            timeStamp: timeStamp,
            lat: lat,
            lng: lng,
            busLock: busData.busLock,
            state: 0
          })
          newBusGulity.save(function (err) {
            console.log('savee gulity 1111')
          })
          resolve({ currentOnRoad: -1, lat: lat, lng: lng, gulityState1: true, passCenter: busData.passCenter })
        } else {
          BusGulity.find({ busID: busData.busID, cycleOnRoad: busData.cycleOnRoad, state: 0 }, function (err, data) {
            if (data.length !== 0) {
              BusGulity.findOneAndUpdate({ busID: busData.busID, cycleOnRoad: busData.cycleOnRoad, state: 0 }, { state: 1, busLock: busData.busLock }, function (err, checkdata) {
                resolve({ currentOnRoad: -1, lat: lat, lng: lng, gulityState1: true, passCenter: busData.passCenter })
                console.log('update success')
              })
            }
            else {
              resolve({ currentOnRoad: -1, lat: lat, lng: lng, gulityState1: true, passCenter: busData.passCenter })
            }
          })
        }
      }
      else {
        if (parseFloat(checkBaseDistance) < parseFloat(1)) {
          resolve({
            currentOnRoad: resultCheckOutOfRoad[0].index,
            lat: resultCheckOutOfRoad[0].lat,
            lng: resultCheckOutOfRoad[0].lng,
            gulityState1: busData.gulityState1,
            passCenter: busData.passCenter
          })
        }
        else {
          const indexRoadGo = roadMapBus.filter(element => (
            (((parseFloat(element.lat).toFixed(3) === parseFloat(lat).toFixed(3)) && (parseFloat(element.lng).toFixed(3) === parseFloat(lng).toFixed(3))) ||
              (parseFloat(checkDistance(element.lat, element.lng, lat, lng)) < parseFloat(1.5)))
            && (element.index < centerPath.index)
          ))
          const indexRoadReturn = roadMapBus.filter(element => (
            (((parseFloat(element.lat).toFixed(3) === parseFloat(lat).toFixed(3)) && (parseFloat(element.lng).toFixed(3) === parseFloat(lng).toFixed(3))) ||
              parseFloat(checkDistance(element.lat, element.lng, lat, lng)) < parseFloat(1.5))
            && (element.index > centerPath.index)
          ))
          const checkPassCenter = geodist({ lat: lat, lon: lng }, { lat: centerPath.lat, lon: centerPath.lng }, { exact: true, unit: 'km' })

          console.log('checkPassCenter')
          console.log(checkPassCenter)
          if ((parseFloat(checkPassCenter) < parseFloat(1.75)) && (busData.passCenter === false)) {
            console.log('workkkk shitttt hereeeeeee')
            busData.passCenter = true
          }
          if (busData.passCenter !== true) {
            if (indexRoadGo.length === 0) {

              const newIndexRoadGo = resultCheckOutOfRoad.filter(element => (element.index < centerPath.index))
              resolve({
                currentOnRoad: newIndexRoadGo[Math.floor(newIndexRoadGo.length / 2)].index,
                lat: newIndexRoadGo[Math.floor(newIndexRoadGo.length / 2)].lat,
                lng: newIndexRoadGo[Math.floor(newIndexRoadGo.length / 2)].lng,
                gulityState1: busData.gulityState1,
                passCenter: busData.passCenter
              })
            }
            else {
              resolve({
                currentOnRoad: indexRoadGo[Math.floor(indexRoadGo.length / 2)].index,
                lat: indexRoadGo[Math.floor(indexRoadGo.length / 2)].lat,
                lng: indexRoadGo[Math.floor(indexRoadGo.length / 2)].lng,
                gulityState1: busData.gulityState1,
                passCenter: busData.passCenter
              })
            }
          }
          else {
            if (indexRoadReturn.length === 0) {
              const newIndexRoadReturn = resultCheckOutOfRoad.filter(element => (element.index > centerPath.index))
              if (newIndexRoadReturn.length !== 0) {
                resolve({
                  currentOnRoad: newIndexRoadReturn[Math.floor(newIndexRoadReturn.length / 2)].index,
                  lat: newIndexRoadReturn[Math.floor(newIndexRoadReturn.length / 2)].lat,
                  lng: newIndexRoadReturn[Math.floor(newIndexRoadReturn.length / 2)].lng,
                  gulityState1: busData.gulityState1,
                  passCenter: busData.passCenter
                })
              }
              else {
                const newIndexRoadGo = resultCheckOutOfRoad.filter(element => (element.index < centerPath.index))
                resolve({
                  currentOnRoad: newIndexRoadGo[Math.floor(newIndexRoadGo.length / 2)].index,
                  lat: newIndexRoadGo[Math.floor(newIndexRoadGo.length / 2)].lat,
                  lng: newIndexRoadGo[Math.floor(newIndexRoadGo.length / 2)].lng,
                  gulityState1: busData.gulityState1,
                  passCenter: busData.passCenter
                })
              }
            } else {
              resolve({
                currentOnRoad: indexRoadReturn[Math.floor(indexRoadReturn.length / 2)].index,
                lat: indexRoadReturn[Math.floor(indexRoadReturn.length / 2)].lat,
                lng: indexRoadReturn[Math.floor(indexRoadReturn.length / 2)].lng,
                gulityState1: busData.gulityState1,
                passCenter: busData.passCenter
              })
            }
          }
        }
      }
    }, 10);
  });
}

//step3
async function checkBusCompleteCycle(busroad, busStopSequence, busData, timeStamp, currentCycleOnroad) {
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
          console.log(busData.currentOnRoad)
          if (busData.currentOnRoad < busStopSequence[busStopSequence.length - 3] && busData.currentBusStop > busStopSequence[busStopSequence.length - 4]) {
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
            if (busData.currentOnRoad >= busStopSequence[busData.currentBusStop + 2] && busData.currentOnRoad <= busStopSequence[busData.currentBusStop + 5]) {
              checkBusComplete = 1
            }
            if ((busData.currentOnRoad <= busStopSequence[busData.currentBusStop] && busData.currentOnRoad >= busStopSequence[busData.currentBusStop - 1]) || (busData.currentOnRoad <= busStopSequence[busData.currentBusStop] && busData.currentOnRoad >= busStopSequence[busData.currentBusStop - 2])) {
              checkBusComplete = 1
            }
          }
        }
        if (checkBusComplete === 1) {
          console.log('busData.currentOnRoad')
          console.log(busData.currentOnRoad)
          console.log('busStopSequence[busData.currentBusStop + 1]')
          console.log(busStopSequence[busData.currentBusStop + 1])
          if (busData.currentOnRoad > busStopSequence[busData.currentBusStop + 1]) {
            let returnData = busData.currentBusStop + 1
            if (busData.cycleOnRoad === 0 && returnData === 2) {
              console.log('work here1')
              let newcurrentCycleOnroad = currentCycleOnroad + 1
              Road.findOneAndUpdate({ name: busroad }, { currentCycleOnRoad: newcurrentCycleOnroad }, function (err) {
                console.log('update success cycleOnroad')
              })
              //newcurrentCycleOnRoad = newcurrentCycleOnRoad + 1
              resolve({ currentBusStop: returnData, cycleOnRoad: newcurrentCycleOnroad, gulityState2: busData.gulityState2 });
            }
            else {
              console.log('work here2')
              let returnData = busData.currentBusStop + 1
              resolve({ currentBusStop: returnData, cycleOnRoad: busData.cycleOnRoad, gulityState2: busData.gulityState2 });
            }
          }
          else {
            console.log('work here3')
            resolve({ currentBusStop: busData.currentBusStop, cycleOnRoad: busData.cycleOnRoad, gulityState2: busData.gulityState2 });
          }
        }
        else {
          if (busData.gulityState2 === false) {
            busData.busLock.push({ lat: busData.lat, lng: busData.lng })
            var newBusGulity = BusGulity({
              busRoad: busroad,
              busID: busData.busID,
              type: 'ขับไม่ครบทุกป้าย',
              cycleOnRoad: busData.cycleOnRoad,
              timeStamp: timeStamp,
              lat: busData.lat,
              lng: busData.lng,
              busLock: busData.busLock,
              state: 1,
            })
            newBusGulity.save(function (err) {
              resolve({ currentBusStop: -2, cycleOnRoad: busData.cycleOnRoad, gulityState2: true });
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
async function checkBusOverRide(busData, timeStamp, busOnroad) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (busData.gulityState3 === true) {
        resolve(busData.gulityState3)
      }
      else {
        const result = busOnroad.filter(element => (
          (busData.currentOnRoad > element.currentOnRoad && busData.cycleOnRoad > element.cycleOnRoad)
          && element.cycleOnRoad !== 0
          && element.cycleOnRoad !== -1
          && element.currentOnRoad !== 0
          && element.currentOnRoad !== -1
          && element.busID !== busData.busID
          && element.gulityState1 === false
          && element.gulityState2 === false
          && element.gulityState3 === false
          && element.canCompute === true
        ))
        if (result.length > 0) {
          busData.busLock.push({ lat: busData.lat, lng: busData.lng })
          var newBusGulity = BusGulity({
            busRoad: busData.busRoad,
            busID: busData.busID,
            type: 'ขับแซงรถในสายเดียวกัน',
            cycleOnRoad: busData.cycleOnRoad,
            timeStamp: timeStamp,
            lat: busData.lat,
            lng: busData.lng,
            busLock: busData.busLock,
            state: 1,
            overDriveOtherBus: { busID: result[0].busID, lat: result[0].lat, lng: result[0].lng }
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
async function updateBusOnroad(busData, busStopSequence, busroad, roadMapBus, firstBusStop) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const checkBaseFirstBusStop = geodist({ lat: busData.lat, lon: busData.lng }, { lat: firstBusStop.lat, lon: firstBusStop.lng }, { exact: true, unit: 'km' })
      const checkBaseDistance = geodist({ lat: busData.lat, lon: busData.lng }, { lat: roadMapBus[0].lat, lon: roadMapBus[0].lng }, { exact: true, unit: 'km' })
      console.log('checkBaseDistance')
      console.log(checkBaseDistance)
      // var result = newBusOnRoad.filter(element => (
      //   element.busID === busData.busID && element.busRoad === busData.busRoad
      // ))
      // var index = result[0].index
      if (((busData.currentOnRoad > (busStopSequence[busStopSequence.length - 1]) - 10) || ((parseFloat(checkBaseFirstBusStop) < parseFloat(2.5))) && ((busData.passCenter === true) || (busData.gulityState2 === true))) && busData.cycleOnRoad > 0) {
        console.log('fuckkkkkkk')
        busData.cycleOnRoad = 0
        busData.currentBusStop = -1
        busData.gulityState1 = false
        busData.gulityState2 = false
        busData.gulityState3 = false
        busData.passCenter = false
        busData.canCompute = true
      }
      if (((busData.currentOnRoad > (busStopSequence[busStopSequence.length - 1]) - 10) || ((parseFloat(checkBaseDistance) < parseFloat(1.15))))) {
        if (busData.cycleOnRoad > 0) {
          Road.findOneAndUpdate({ name: busData.busRoad }, { currentCycleOnRoad: busData.cycleOnRoad - 1 }, function (err) {
            console.log('update cycleOnroad')
          })
        }
        busData.cycleOnRoad = 0
        busData.currentBusStop = -1
        busData.gulityState1 = false
        busData.gulityState2 = false
        busData.gulityState3 = false
        busData.passCenter = false
        busData.canCompute = true
      }
      // console.log('busData Step5')
      // console.log(busData)
      if (busData.newBus === true) {
        // console.log("it is workkkk newbus = true")
        var newBus = BusOnroad({
          index: 2,
          busRoad: busData.busRoad,
          busID: busData.busID,
          speed: busData.speed,
          lat: busData.lat,
          lng: busData.lng,
          cycleOnRoad: busData.cycleOnRoad,
          currentOnRoad: busData.currentOnRoad,
          currentBusStop: busData.currentBusStop,
          gulityState1: busData.gulityState1,
          gulityState2: busData.gulityState2,
          gulityState3: busData.gulityState3,
          passCenter: busData.passCenter,
          busLock: busData.busLock,
          timeStamp: busData.timeStamp,
          canCompute: busData.canCompute,
        });
        newBus.save(function (err, data) {
          if (err) throw err;
          resolve(data)
        });
      }
      else {
        busData.busLock.push({ lat: busData.lat, lng: busData.lng })
        if (busData.busLock.length > 30) {
          busData.busLock = busData.busLock.splice(0, 20)
        }
        BusOnroad.findOneAndUpdate({ busRoad: busData.busRoad, busID: busData.busID },
          {
            cycleOnRoad: busData.cycleOnRoad,
            currentOnRoad: busData.currentOnRoad,
            currentBusStop: busData.currentBusStop,
            passCenter: busData.passCenter,
            speed: busData.speed,
            lat: busData.lat,
            lng: busData.lng,
            gulityState1: busData.gulityState1,
            gulityState2: busData.gulityState2,
            gulityState3: busData.gulityState3,
            busLock: busData.busLock,
            timeStamp: busData.timeStamp,
            canCompute: busData.canCompute,
          }, function (err, bus) {
            if (err) throw err;
            // we have the updated user returned to us
            resolve(busData)
          });
      }
    }, 10);
  });

}


async function getBusOnRoad(roadMapBus, busID, speed, busStopSequence, busLat, busLng, road, timeStamp, busOnroad, currentCycleOnroad, centerPath, firstBusStop) {
  let currentBusLocation = await findBusCurrentLocation(roadMapBus, busLat, busLng, busStopSequence, road)
  let data = await checkBusData(roadMapBus, busID, speed, busStopSequence, busLat, busLng, road, currentBusLocation, busOnroad, timeStamp)
  if (data.canCompute) {
    let checkOutOfRoadData = await checkBusOutofRoad(road, data, roadMapBus, busLat, busLng, timeStamp, centerPath)
    data = await assignData(data, checkOutOfRoadData)
    let checkBusCompleteCycleData = await checkBusCompleteCycle(road, busStopSequence, data, timeStamp, currentCycleOnroad)
    data = await assigncheckBusCompleteCycle(data, checkBusCompleteCycleData)
    let checkBusOverRideData = await checkBusOverRide(data, timeStamp, busOnroad)
    data = await assigncheckBusOverRide(data, checkBusOverRideData)
    data = await updateBusOnroad(data, busStopSequence, road, roadMapBus, firstBusStop)
    return data;
  }
  else {
    let checkOutOfRoadData = await checkBusOutofRoad(road, data, roadMapBus, busLat, busLng, timeStamp, centerPath)
    data = await assignData(data, checkOutOfRoadData)
    data = await updateBusOnroad(data, busStopSequence, road, roadMapBus, firstBusStop)
    return data;
  }
}

var newCurrentBusLocation = 0;
var newCurrentOnRoad = 0;

async function findBusCurrentLocation(roadMapBus, lat, lng, busStopSequence, busroad) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const result = roadMapBus.filter(element => (
        ((parseFloat(element.lat).toFixed(4) === parseFloat(lat).toFixed(4)) && (parseFloat(element.lng).toFixed(4) === parseFloat(lng).toFixed(4))) ||
        (parseFloat(checkDistance(element.lat, element.lng, lat, lng)) < parseFloat(2.5))
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
      busData.passCenter = checkOutOfRoadData.passCenter
      resolve(busData)
    }, 10);
  });
}

async function assigncheckBusCompleteCycle(busData, checkBusCompleteCycleData) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(checkBusCompleteCycleData)
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

findRoadPath = (busStop1, busStop2) => {
  let roadBusStop = []
  let contactPath = []
  let start = []
  let end = []
  let contract = []
  let path = []
  let contract1 = []
  RoadBusStop.find({}, function (err, data) {
    roadBusStop = data
  }).then(() => {
    BusContract.find({}, function (err, data) {
      contactPath = data
    }).then(() => {
      for (var j = 0; j < roadBusStop.length; j++) {
        const startPath = roadBusStop[j].busStop.filter(element => (
          element.nameTH === busStop1
        ))
        const endPath = roadBusStop[j].busStop.filter(element => (
          element.nameTH === busStop2
        ))
        if (startPath.length !== 0) {
          start.push({ pathStart: 0, path: roadBusStop[j].busRoad, busPoint: startPath[0].nameTH })
        }
        if (endPath.length !== 0) {
          end.push({ pathEnd: 0, path: roadBusStop[j].busRoad, busPoint: endPath[0].nameTH })
        }
      }
      console.log(start)
      console.log(end)

      for (var j = 0; j < start.length; j++) {
        var samePath = end.filter(element => (
          element.path === start[j].path
        ))
        if (samePath.length !== 0) {
          path.push(start[j].path)
        }
      }

      if (path.length !== 0) {
        console.log(start[0].path)
        var busStopPath = roadBusStop.filter(element => (
          element.busRoad === start[0].path
        ))
        var pathStart = busStopPath[0].busStop.filter(element => (
          element.nameTH === busStop1
        ))
        var pathEnd = busStopPath[0].busStop.filter(element => (
          element.nameTH === busStop2
        ))
        var startSequence = pathStart[0].sequence
        var endSequence = pathEnd[0].sequence
        if (startSequence < endSequence) {
          console.log("it is work shitttttttttt")
        }
        else {
          console.log("Ho noooo")
        }
      }
      else {
        for (var j = 0; j < start.length; j++) {
          end.forEach(endData => {
            var endContact = contactPath.filter(element => (
              element.busRoad === endData.path
            ))
            var result = endContact[0].contract.filter(element => (
              element.contractWith === start[j].path
            ))
            if (result.length !== 0) {
              contract.push({ start: start[j], end: endData })
            }
          })
        }
        console.log(contract)
        start.forEach(data => {
          var startContact = contactPath.filter(element => (
            element.busRoad === data.path
          ))
          startContact[0].contract.forEach(element => {
            start.push({ pathStart: startContact[0].busRoad, path: element.contractWith })
          })
        })
        end.forEach(data => {
          var endContact = contactPath.filter(element => (
            element.busRoad === data.path
          ))
          endContact[0].contract.forEach(element => {
            end.push({ pathEnd: endContact[0].busRoad, path: element.contractWith })
          })
        })
        console.log(start)
        console.log(end)
        for (var j = 1; j < start.length; j++) {
          end.forEach(endData => {
            var endContact = contactPath.filter(element => (
              element.busRoad === endData.path
            ))
            var result = endContact[0].contract.filter(element => (
              element.contractWith === start[j].path
            ))
            if (result.length !== 0) {
              contract.push({ start: start[j], end: endData, busPoint: result[0].nameTH })
            }
          })
        }
        var answer = []
        for (var i = 0; i < contract.length; i++) {
          var roadPath = []
          var roadPathStart = []
          var roadPathEnd = []
          var testStart = contract[i].start
          if (testStart.pathStart === 0) {
            roadPathStart.push(testStart.path)
          }
          else {
            while (testStart.pathStart !== 0) {
              roadPathStart.push(testStart.path)
              roadPathStart.push(testStart.pathStart)
              var result = start.filter(element => (
                element.path === testStart.pathStart
              ))
              testStart = result[0]
            }
          }
          var test = contract[i].end
          if (test.pathEnd === 0) {
            roadPathEnd.push(test.path)
          }
          else {
            while (test.pathEnd !== 0) {
              roadPathEnd.push(test.path)
              roadPathEnd.push(test.pathEnd)
              var result = end.filter(element => (
                element.path === test.pathEnd
              ))
              test = result[0]
            }
          }
          roadPathStart = roadPathStart.reverse()
          roadPath = roadPathStart.concat(roadPathEnd)
          answer.push({ roadPath: roadPath })
        }
        var minRoadPath = 0
        answer.forEach((element, index) => {
          if (index === 0) {
            minRoadPath = element.roadPath.length
          }
          else {
            if (element.roadPath.length < minRoadPath)
              minRoadPath = element.roadPath.length
          }
        })
        // console.log(minRoadPath)
        answer = answer.filter(element => (element.roadPath.length === minRoadPath))
        answer.forEach((answer, index) => {
          var busStopPathStart = roadBusStop.filter(element => (
            element.busRoad === answer.roadPath[0]
          ))
          var contractStart = contactPath.filter(element => (
            element.busRoad === answer.roadPath[0]
          ))
          var resultStart = busStopPathStart[0].busStop.filter(element => (
            element.nameTH === busStop1
          ))
          var startSequence = resultStart[0].sequence
          var contractWithStart = contractStart[0].contract.filter(element => (
            element.contractWith === answer.roadPath[1]
          ))
          var resultPathStart = contractWithStart[0].path.filter(element => (
            element.sequence > startSequence
          ))
          var busStopPathEnd = roadBusStop.filter(element => (
            element.busRoad === answer.roadPath[answer.roadPath.length - 1]
          ))
          var contractEnd = contactPath.filter(element => (
            element.busRoad === answer.roadPath[answer.roadPath.length - 1]
          ))
          var resultEnd = busStopPathEnd[0].busStop.filter(element => (
            element.nameTH === busStop2
          ))
          var endSequence = resultEnd[0].sequence
          var contractWithEnd = contractEnd[0].contract.filter(element => (
            element.contractWith === answer.roadPath[answer.roadPath.length - 2]
          ))
          var resultPathEnd = contractWithEnd[0].path.filter(element => (
            element.sequence < endSequence
          ))

          if (resultPathStart.length !== 0 && resultPathEnd.length !== 0) {
            console.log('it is workkk shittttt')
          }
        })
        let busPoint = []
        answer.forEach(road => {
          var point = []
          for (var i = 0; i < road.roadPath.length; i++) {
            if (i === 0) {
              point.push(busStop1)
              var busStopPath = roadBusStop.filter(element => (
                element.busRoad === road.roadPath[0]
              ))
              var contract = contactPath.filter(element => (
                element.busRoad === road.roadPath[0]
              ))
              var result = busStopPath[0].busStop.filter(element => (
                element.nameTH === busStop1
              ))
              var startSequence = result[0].sequence
              var contractWith = contract[0].contract.filter(element => (
                element.contractWith === road.roadPath[1]
              ))
              var resultPath = contractWith[0].path.filter(element => (
                element.sequence > startSequence
              ))
              console.log(resultPath[0].nameTH)
              point.push(resultPath[0].nameTH)
            }
            else if (i === road.roadPath.length - 1) {
              point.push(busStop1)
              console.log(busStop2)
              busPoint.push({ point: point })
            }
            else {
              var busStopPath = roadBusStop.filter(element => (
                element.busRoad === road.roadPath[i]
              ))
              var contract = contactPath.filter(element => (
                element.busRoad === road.roadPath[i]
              ))
              var contractWith = contract[0].contract.filter(element => (
                element.contractWith === road.roadPath[i + 1]
              ))
              var resultPath = contractWith[0].path.filter(element => (
                element.sequence > inItPath
              ))
              console.log(resultPath[0].nameTH)
              point.push(resultPath[0].nameTH)
            }
          }
        })
        console.log(answer)
        console.log(busPoint)
      }
    })
  })
}

roadPathWay = (startPlace, endPlace, roadPath) => {
  let roadBusStop = []
  let roadMapBus = []
  let contactPath = []
  let roadWay = []
  let inItPath = null
  RoadBusStop.find({}, function (err, data) {
    roadBusStop = data
  }).then(() => {
    RoadMapBus.find({}, function (err, data) {
      roadMapBus = data
    }).then(() => {
      BusContract.find({}, function (err, data) {
        contactPath = data
      }).then(() => {
        var i = 0;
        if (roadPath.length === 1) {
          var busStopPath = roadBusStop.filter(element => (
            element.busRoad === roadPath[0]
          ))
          var pathStart = busStopPath[0].busStop.filter(element => (
            element.nameTH === startPlace
          ))
          var pathEnd = busStopPath[0].busStop.filter(element => (
            element.nameTH === endPlace
          ))
          var startSequence = pathStart[0].sequence
          var endSequence = pathEnd[0].sequence
          var roadMap = roadMapBus.filter(element => (
            element.busRoad === roadPath[0]
          ))
          var path = roadMap[0].roadMap.filter(element => (
            element.index >= busStopPath[0].busStop[startSequence].roadIndex &&
            element.index <= busStopPath[0].busStop[endSequence].roadIndex
          ))
          roadWay = roadWay.concat(path)
          console.log(path)
        }
        else {
          for (var i = 0; i < roadPath.length; i++) {
            if (i === 0) {
              var busStopPath = roadBusStop.filter(element => (
                element.busRoad === roadPath[0]
              ))
              var contract = contactPath.filter(element => (
                element.busRoad === roadPath[0]
              ))
              var result = busStopPath[0].busStop.filter(element => (
                element.nameTH === startPlace
              ))
              var startSequence = result[0].sequence
              //console.log(startSequence)
              var contractWith = contract[0].contract.filter(element => (
                element.contractWith === roadPath[1]
              ))
              var resultPath = contractWith[0].path.filter(element => (
                element.sequence > startSequence
              ))
              var endSequence = resultPath[0].sequence
              inItPath = resultPath[0].contractAt
              //console.log(endSequence)
              var roadMap = roadMapBus.filter(element => (
                element.busRoad === roadPath[0]
              ))
              // console.log(busStopPath[0].busStop[startSequence])
              // console.log(busStopPath[0].busStop[endSequence])
              var path = roadMap[0].roadMap.filter(element => (
                element.index >= busStopPath[0].busStop[startSequence].roadIndex &&
                element.index <= busStopPath[0].busStop[endSequence].roadIndex
              ))
              //console.log(roadMap[0].roadMap)
              roadWay = roadWay.concat(path)
              console.log(path)
            }
            else if (i === roadPath.length - 1) {
              var busStopPath = roadBusStop.filter(element => (
                element.busRoad === roadPath[i]
              ))
              var result = busStopPath[0].busStop.filter(element => (
                element.nameTH === endPlace
              ))
              var endSequence = result[0].sequence
              var roadMap = roadMapBus.filter(element => (
                element.busRoad === roadPath[i]
              ))
              var path = roadMap[0].roadMap.filter(element => (
                element.index >= busStopPath[0].busStop[inItPath].roadIndex &&
                element.index <= busStopPath[0].busStop[endSequence].roadIndex
              ))
              console.log("-------------------")
              console.log(path)
              console.log(inItPath)
              roadWay = roadWay.concat(path)
            }
            else {
              var busStopPath = roadBusStop.filter(element => (
                element.busRoad === roadPath[i]
              ))
              var contract = contactPath.filter(element => (
                element.busRoad === roadPath[i]
              ))
              var contractWith = contract[0].contract.filter(element => (
                element.contractWith === roadPath[i + 1]
              ))
              var startSequence = inItPath
              var resultPath = contractWith[0].path.filter(element => (
                element.sequence > inItPath
              ))
              var endSequence = resultPath[0].sequence
              inItPath = resultPath[0].contractAt
              var roadMap = roadMapBus.filter(element => (
                element.busRoad === roadPath[i]
              ))
              var path = roadMap[0].roadMap.filter(element => (
                element.index >= busStopPath[0].busStop[startSequence].roadIndex &&
                element.index <= busStopPath[0].busStop[endSequence].roadIndex
              ))
              console.log("xxxxxxxxxxxx")
              console.log(path)
              roadWay = roadWay.concat(path)
            }
          }
        }
        console.log('roadWayyy')
        console.log(roadWay)
      })
    })
  })

}

roadBusPoint = (startPlace, endPlace, roadPath) => {
  let roadBusStop = []
  let roadMapBus = []
  let contactPath = []
  let roadWay = []
  let inItPath = null
  RoadBusStop.find({}, function (err, data) {
    roadBusStop = data
  }).then(() => {
    RoadMapBus.find({}, function (err, data) {
      roadMapBus = data
    }).then(() => {
      BusContract.find({}, function (err, data) {
        contactPath = data
      }).then(() => {
        for (var i = 0; i < roadPath.length; i++) {
          if (i === 0) {
            var busStopPath = roadBusStop.filter(element => (
              element.busRoad === roadPath[0]
            ))
            var contract = contactPath.filter(element => (
              element.busRoad === roadPath[0]
            ))
            var result = busStopPath[0].busStop.filter(element => (
              element.nameTH === startPlace
            ))
            var startSequence = result[0].sequence
            var contractWith = contract[0].contract.filter(element => (
              element.contractWith === roadPath[1]
            ))
            var resultPath = contractWith[0].path.filter(element => (
              element.sequence > startSequence
            ))
            console.log(resultPath[0].nameTH)
          }
          else if (i === roadPath.length - 1) {
            console.log(endPlace)
          }
          else {
            var busStopPath = roadBusStop.filter(element => (
              element.busRoad === roadPath[i]
            ))
            var contract = contactPath.filter(element => (
              element.busRoad === roadPath[i]
            ))
            var contractWith = contract[0].contract.filter(element => (
              element.contractWith === roadPath[i + 1]
            ))
            var resultPath = contractWith[0].path.filter(element => (
              element.sequence > inItPath
            ))
            console.log(resultPath[0].nameTH)
          }
        }
      })
    })
  })

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
  var s = "ต.33"
  var a = s.slice(2)
  // console.log(a)
  // axios.get('http://analytics.dlt.transcodeglobal.com/test_businfo.txt')
  //   .then(data => {
  //     var busData = data.data
  //     var arr = [];
  //     var count = 0;
  //     arr = Object.values(busData)
  //     // for (count = 0; count < Object.keys(busData).length - 1; count++) {
  //     //   var insertArr = Object.entries(busData)[count]
  //     //   insertArr[1].busID = insertArr[0]
  //     //   arr.push(insertArr[1])
  //     // }
  //     const result = arr.filter(element => (
  //       element.path === "ต.97"
  //     ))
  //     console.log(result)
  //   })
  //findRoadPath("โรงเรียนหอวัง", "ซอยพหลโยธิน 8,ซอยสายลม")//โรงแรมมิโดโฮเต็ล
  //roadPathWay("โรงเรียนหอวัง", "ซอยพหลโยธิน 8,ซอยสายลม", ['A1', '39','97'])
  //roadBusPoint("โรงเรียนหอวัง", "ซอยพหลโยธิน 8,ซอยสายลม", ['A1', '39','97'])
  // var busStop = []
  // var roadBusStop = []
  // var busStopName = ['กระทรวงสาธารณสุข', 'ตรงข้ามบิ๊กซีติวานนท์', 'โรงเรียนวัดลานนาบุญ', 'ซอยประชาราษฎร์ 3, อู่สายพิน', 'หมู่บ้านช.รุ่งเรือง 4,โรงเรียนนนทบุรี', 'ตรงข้ามวัดทินกร', 'ซอย ประชาราษฎ์ 13', 'ท่าน้ำนนทบุรี',
  //   'เมเจอร์นนทบุรี', 'ธนาคารกรุงศรีอยุธยา(ถนนพิบูลสงคราม)', 'โรงเรียนการัญศึกษา', 'ตรงข้ามวัดนครอินทร์', 'วัดกำแพง(ขาเข้า)', 'ปั๊มน้ำมัน ESSO', 'สวิตบาร์', 'ตรงข้ามคอนโดริเวอร์ไรน์', 'ซอยพิลบูลสงคราม 14', 'ตรงข้ามวัดเขมา', 'ตรงข้ามโรงเรียนสตรีนนทบุรี-วัดปากน้ำ', 'หมู่บ้านพิบูลย์บางซื่อ',
  //   'ตรงข้ามบริษัท พูลผลจำกัด', 'มหาวิทยาลัยเทคโนโลยีพระจอมเกล้า', 'ไอ.คิว.เซ็นเตอร์เชิงสะพานพระราม 7', 'ตรงข้ามวัดเสาหิน', 'วัดน้อย,ซอยวงศ์สว่าง 13', 'ชุมชนวัดหลวง', 'วัดเลียบ,ซอยวงศ์สว่าง 21', 'ตรงข้ามบิ๊กซีวงศ์สว่าง,ซอยวงศ์สว่าง 27', 'กรมยุทธบริการ',
  //   'ซอยกรุงเทพ-นนทบุรี 44,ตรงข้ามซอยสมถวิล', 'ดีสแควร์,ครัวคุณสุ,โรงเรียนอนุบาลพิริยะโยธิน', 'ตลาดบางซ่อน,ถนนกรุงเทพ-นนทบุรี 25', 'ตรงข้ามโรงงานทอผ้า,ซอยกรุงเทพ-นนทบุรี 34', 'ตรงข้ามวัดเชิงหวาย,ไปรษณีย์บางซื่อ', 'สถานีตำรวจเตาปูนซอยกรุงเทพ-นนทบุรี 26', 'ตรงข้ามซอยไสว', 'ตรงข้ามประชานฤมิตร,ตรงข้ามธนาคารกสิกรไทย', 'ตลาดเตาปูน,ซอยกรุงเทพ-นนทบุรี4', 'ข้างตลาดเตาปูน,แยกเตาปูน',
  //   'MRTบางซื่อ', 'ตรงข้ามตึก SCG', 'เตาปูนแมนชั่น', 'โรงเรียนช่างอากาศอำรุง', 'สะพานแดง', 'กรมช่างอากาศ', 'ตรงข้ามกรมทหารปืนใหญ่ที่1', 'ซอยประดิพัทธ์ 1', 'ตรงช้ามสำนักงานเลขาธิการ', 'โรงแรมกานต์มณี', 'ซอยประดิพัทธ์ 21', 'สถานีตำรวจบางซื่อ', 'ซอยพหลโยธิน 8,ซอยสายลม', 'BTS อารีย์(ทางออก4)', 'ซอยราชครู,ตรงข้ามซอยพหลโยธิน 5', 'ซอยพหลโยธิน 2,ซอยกาญจนาคม', 'BTSสนามเป้า(ทางออก4)', 'ททบ.5', 'ซอยลือชา,ตรงข้ามซอยพหลโยธิน 1',
  //   'อนุสาวรีย์ชัยสมรภูมิ(เกาะราชวิถี)', 'โรงพยาบาลเด็ก', 'โรงเรียนสอนคนตาบอดกรุงเทพ', 'องค์การเภสัชกรรม', 'กระทรวงอุตสาหกรรม', 'โรงพยาบาลสงฆ์', 'สำนักงานเขตราชเทวี', 'กรมแพทย์ทหารบก', 'อนุสาวรีย์ชัยสมรภูมิ(เกาะพหลโยธิน)', 'ซอยพหลโยธิน 1,ซอยลือชา', 'โรงพยาบาลพญาไท 2', 'BTS สนามเป้า(ทางออก1)', 'BTS สนามเป้า(ทางออก3)', 'ซอยพหลโยธิน 5,ซอยราชครู', 'BTS อารีย์(ทางออก3)', 'กองบัญชาการตำรวจตระเวนชายแดน', 'ซอยพหลโยธิน 11,ซอยเสนาร่วม', 'แยกสะพานควาย,ซอยประดิพัทธ์ 20',
  //   'โรงแรมมิโดโฮเต็ล', 'สำนักงานเลขาธิการ', 'ตรงข้ามซอยประดิพัทธ์ 1', 'กรมทหารปืนใหญ่ที่1รักษาพระองค์', 'กรมสรรพวุธ,สะพานแดง', 'ตรงข้ามโรงเรียนช่างอากาศอำรุง,กรมสรรพาวุธ', 'วัดธรรมาภิรตาราม,ตรงข้ามวัดสะพานสูง', 'ตรงข้ามเตาปูนแมนชั่น', 'ตรงข้ามหลังตลาดเตาปูน,เฉลิมพันธ์เก่า', 'MRTบางซื่อ', 'ตรงข้ามตลาดเตาปูน', 'ประชานฤมิตร,ธนาคารกสิกรไทย,ประชาคม,กรุงเทพ-นนทบรุี 5', 'ซอยกรุงเทพ-นนทบุรี 13,ซอยไสวสุวรรณ', 'สถานีตำรวจเตาปูน,ซอยกรุงเทพ-นนทบุรี 17', 'วัดเชิงหวาย,ซอยกรุงเทพ-นนทบุรี 21/1', 'โรงงานทอผ้า'
  //   , 'ตลาดบางซ่อน,ซอยกรุงเทพ-นนทบุรี 25', 'ซอยกรุงเทพ-นนทบุรี 29', 'ตรงข้ามกรมยุทธบริการ(ขาออก)', 'บิ๊กซีวงศ์สว่าง', 'ตรงข้ามซอยวัดหลวง', 'ตรงข้ามวัดน้อย,ตรงข้ามซอยวงศ์สว่าง 15', 'ซอยยิ้มประยูร', 'วัดเสาหิน', 'ตรงข้ามมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ', 'ใต้สะพานพระราม7(ขาออก)', 'ธนาคารอาคารสงเคราะห์สาขาพระราม7', 'ตรงข้ามหมู่บ้านพิบูลย์บางซื่อ', 'โรงเรียนสตรีนนทบุรี-วัดปากน้ำ', 'โรงเรียนเขมพิทยา', 'ตรงข้ามหมู่บ้านพิบูลย์การ์เดน,ซอยแสงเสนีย์1', 'สวนอาหารนัดพบ', 'ตรงข้ามวัดกำแพง', 'วิทยาลัยพาณิชย์พงษ์สวัสดิ์เทคโนโลยี',
  //   'ตลาดนนท์', 'ตรงข้ามซอยประชาราษฎ์ 13', 'โรงเรียนเทศบาล 2,วัดทินกรนิมิต', 'ซอยประชาราษฏร์ 16/1,ตรงข้ามโรงเรียนคริสเตียนวิทยา', 'ตรงข้ามโรงเรียนวัดลานนาบุญ', 'บิ๊กซี นนทบุรี'
  // ]

  var busStopSequence = [];
  var roadMapBus = []
  var roadBusStop = []
  var busOnroad = []
  var currentBusLocation = null
  var busRoad = null
  var busData = 0
  var currentCycleOnroad = 0
  var centerPath = null
  var busFromFile = []
  var firstBusStop = null
  var busFromUrl = null
  var road = null
  var roadData = null
  var busOnroadData = null






  // // //create busStopOnroad
  // AllBusStop.find({}, function (err, data) {
  //   if (err) throw err;
  //   console.log(data)
  //   busStop = data
  // }).then(() => {
  //   var i = 0
  //   busStopName.forEach(element => {
  //     var result = busStop.filter(data => (
  //       data.nameTH === element
  //     ))
  //     if (result.length > 0) {
  //       //roadBusStop.push()
  //       // console.log(result[0])
  //       roadBusStop.push({
  //         sequence: i, index: result[0].index, nameTH: result[0].nameTH,
  //         nameEG: result[0].nameEG, detail: result[0].detail, lat: result[0].lat, lng: result[0].lng
  //       })
  //       i = i + 1
  //     }
  //   })
  // }).then(() => {
  //   //console.log(roadBusStop)
  //   var newroadBusStop = RoadBusStop({
  //     busRoad: '97',
  //     busStop: roadBusStop,
  //   })
  //   newroadBusStop.save(function (err) {
  //     if (err) throw err;
  //     console.log('busStop 97 has create')
  //   })
  // })
  //create busSequence
  // var busStop = []
  // var roadMap = []
  // var seq = []
  // var sequenceBusStop = []
  // var distest = []
  // var i = 0
  // RoadBusStop.find({ busRoad: '97' }, function (err, data) {
  //   busStop = data[0].busStop
  // }).then(() => {
  //   RoadMapBus.find({ busRoad: '97' }, function (err, data) {
  //     roadMap = data[0].roadMap
  //   }).then(() => {
  //     busStop.forEach((element, index) => {
  //       roadMap.forEach(data => {
  //         const checkDistance = geodist({ lat: data.lat, lon: data.lng }, { lat: element.lat, lon: element.lng }, { exact: true, unit: 'km' })
  //         if (checkDistance < 0.2) {
  //           seq.push({ index: index, seq: data.index })
  //         }
  //       })
  //     })
  //   }).then(() => {
  //     for (var j = 0; j < busStop.length; j++) {
  //       var result = seq.filter(element => (
  //         element.index === j
  //       ))
  //       if (result.length > 0) {
  //         if (j <= 56) {
  //           var finalPath = result.filter(element => (
  //             element.seq < 495
  //           ))
  //           var closePoint = 0
  //           var point = 0
  //           for (var z = 0; z < finalPath.length; z++) {
  //             var dis = geodist({ lat: roadMap[finalPath[z].seq].lat, lon: roadMap[finalPath[z].seq].lng }, { lat: busStop[j].lat, lon: busStop[j].lng }, { exact: true, unit: 'km' })
  //             if (z === 0) {
  //               closePoint = dis
  //               point = finalPath[z].seq
  //             }
  //             else {
  //               if (dis <= closePoint)
  //                 closePoint = dis
  //               point = finalPath[z].seq
  //             }
  //             if (z === finalPath.length - 1) {
  //               distest.push({ index: j, dis: point })
  //             }
  //           }
  //           // if (finalPath.length === 0) {
  //           //   sequenceBusStop.push(sequenceBusStop[j - 1])
  //           // }
  //           // else {
  //           //   sequenceBusStop.push(finalPath[finalPath.length-1])
  //           // }
  //           sequenceBusStop.push(finalPath[finalPath.length - 1].seq)
  //         }
  //         else {
  //           var finalPath = result.filter(element => (
  //             element.seq >= 495
  //           ))
  //           for (var z = 0; z < finalPath.length; z++) {
  //             var dis = geodist({ lat: roadMap[finalPath[z].seq].lat, lon: roadMap[finalPath[z].seq].lng }, { lat: busStop[j].lat, lon: busStop[j].lng }, { exact: true, unit: 'km' })
  //             if (z === 0) {
  //               closePoint = dis
  //               point = finalPath[z].seq
  //             }
  //             else {
  //               if (dis <= closePoint)
  //                 closePoint = dis
  //               point = finalPath[z].seq
  //             }
  //             if (z === finalPath.length - 1) {
  //               distest.push({ index: j, dis: point })
  //             }
  //           }
  //           // if (finalPath.length === 0) {
  //           //   sequenceBusStop.push(sequenceBusStop[j - 1])
  //           // }
  //           // else {
  //           //   sequenceBusStop.push(finalPath[finalPath.length-1])
  //           // }
  //           sequenceBusStop.push(finalPath[finalPath.length - 1].seq)
  //         }
  //       }
  //       else {
  //         sequenceBusStop.push(sequenceBusStop[j - 1])
  //       }
  //     }
  //     sequenceBusStop.push(roadMap.length - 1)
  //     sequenceBusStop.forEach((element, index) => {
  //       console.log(index)
  //       console.log(element)
  //     })
  //     RoadBusStop.find({ busRoad: '97' }, function (err, data) {
  //       busStop = data[0].busStop
  //     }).then(() => {
  //       busStop.forEach((element, index) => {
  //         element.roadIndex = sequenceBusStop[index]
  //       })
  //       RoadBusStop.findOneAndUpdate({ busRoad: '97' }, { busStop: busStop }, function (err, bus) {
  //         if (err) throw err;
  //         console.log('update finish')
  //       })
  //     })

  //     // var newBusStopSequence = BusStopSequence({
  //     //   busRoad: '97',
  //     //   sequence:  sequenceBusStop
  //     // })
  //     // newBusStopSequence.save(function(err) {
  //     //   if (err) throw err;
  //     //   console.log('BusStopSequence created!');
  //     // });

  //     BusStopSequence.findOneAndUpdate({ busRoad: '97' },
  //       {
  //         sequence: sequenceBusStop
  //       }, function (err, bus) {
  //         if (err) throw err;
  //         console.log('update finish')
  //       });
  //   })
  // })

  //create Road
  // var busStopSequence = []
  // var roadMapBus = []
  // BusStopSequence.find({ busRoad: '63' }, function (err, data) {
  //   busStopSequence = data
  //   console.log(busStopSequence)
  // }).then(() => {
  //   RoadMapBus.find({ busRoad: '63' }, function (err, data) {
  //     roadMapBus = data
  //     console.log(roadMapBus)
  //   }).then(() => {
  //     var newRoad = Road({
  //       name: '63',
  //       fullname: '63 อู่นครอินทร์ - อนุสาวรีย์ชัยสมรภูมิ',
  //       currentCycleOnRoad: 0,
  //       busStopSequence: busStopSequence[0]._id,
  //       roadMapBus: roadMapBus[0]._id,
  //       centerPath: {
  //         index: 354,
  //         lat: 13.7657305088901,
  //         lng:  100.53802991187,
  //       },
  //       firstBusStop:{
  //         lat:  13.8361605322906,
  //         lng:  100.498551209858,
  //       }
  //     });
  //     newRoad.save(function (err) {
  //       if (err) throw err;
  //     });
  //   })
  // })


  //create Connect Path
  // var roadBusStop = []
  // RoadBusStop.find({}, function (err, data) {
  //   roadBusStop = data
  //   console.log(data.length)
  // }).then(() => {
  //   var i = 0
  //   var j = 0
  //   var x = []
  //   for (i = 0; i < roadBusStop.length; i++) {
  //     var contract = []
  //     var busStopName = roadBusStop[i].busStop
  //     const resultBusStop = roadBusStop.filter(element => (
  //       element.busRoad !== roadBusStop[i].busRoad
  //     ))
  //     for (j = 0; j < resultBusStop.length; j++) {
  //       var path = []
  //       busStopName.forEach(element => {
  //         const result = resultBusStop[j].busStop.filter(data => (
  //           element.nameTH === data.nameTH
  //         ))
  //         if (result.length !== 0)
  //           path.push({ nameTH: result[0].nameTH, sequence: element.sequence ,contractAt:result[0].sequence })
  //       })
  //       if (path.length !== 0) {
  //         contract.push({ contractWith: resultBusStop[j].busRoad, path })
  //       }
  //     }
  //     var newbusCotract = BusContract({
  //       busRoad:roadBusStop[i].busRoad,
  //       contract:contract
  //     });

  //     newbusCotract.save(function (err) {
  //       if (err) throw err;
  //     });
  //     // console.log(roadBusStop[i].busRoad)
  //     // console.log(contract)
  //   }
  // })

  //creater road center

  // var roadMap = []
  // RoadMapBus.find({ busRoad: '97' }, function (err, data) {
  //   if (err) throw err;
  //   roadMap = data[0].roadMap
  // }).then(() => {
  //   const result = roadMap.filter(element => (
  //     ((parseFloat(13.7609334227478).toFixed(3) === parseFloat(element.lat).toFixed(3) || parseFloat(100.528105428693).toFixed(4) === parseFloat(element.lng).toFixed(4))
  //       || (parseFloat(13.7609334227478).toFixed(4) === parseFloat(element.lat).toFixed(4) || parseFloat(100.528105428693).toFixed(3) === parseFloat(element.lng).toFixed(3))
  //       || (parseFloat(13.7609334227478).toFixed(4) === parseFloat(element.lat).toFixed(4) || parseFloat(100.528105428693).toFixed(4) === parseFloat(element.lng).toFixed(4))
  //       || (parseFloat(13.7609334227478).toFixed(3) === parseFloat(element.lat).toFixed(3) && parseFloat(100.528105428693).toFixed(3) === parseFloat(element.lng).toFixed(3))
  //     )
  //     ))
  //   console.log(result[Math.floor(result.length / 2)])
  // })

  // var roadMap = []
  // RoadMapBus.find({ busRoad: '97' }, function (err, data) {
  //   roadMap = data[0].roadMap
  // }).then(() => {
  //   for (var i = 0; i < roadMap.length; i++) {
  //     roadMap[i].index = i
  //   }
  //   RoadMapBus.findOneAndUpdate({ busRoad: '97' },
  //     {
  //       roadMap: roadMap
  //     }, function (err, bus) {
  //       if (err) throw err;
  //       console.log('update finish')
  //     });
  // })



  // User.find({username: 'star'}, function(err, users) {
  //   if (err) throw err;
  //   console.log(users.length)
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
  var currentCycleOnroad = 0
  var centerPath = null
  var busFromFile = []
  var firstBusStop = null
  var busFromUrl = null
  var stream = fs.createReadStream("97.csv");

  csv
    .fromStream(stream, { headers: true })
    .on("data", function (data) {
      busFromFile.push({
        index: parseInt(data.index), busID: data.busID, lat: parseFloat(data.lat), lng: parseFloat(data.lng), speed: data.speed, timeStamp: data.time
      })
    })
    .on("end", function () {
      // Road
      //   .find({})
      //   .populate('busStopSequence')
      //   .populate('roadMapBus')
      //   .exec(function (err, data) {
      //     cycleOnRoad = data.cycleOnRoad
      //     busStopSequence = data.busStopSequence.sequence.sort()
      //     roadMapBus = data.roadMapBus.roadMap
      //     BusOnroad.find({}, function (err, data) {
      //       busOnroad = data
      //     }).then(() => {
      //console.log(busStopSequence)
      // getBusOnRoad(roadMapBus, bus.busID, bus.speed, busStopSequence, bus.lat, bus.lng, 'A1', bus.timeStamp).then(val => {
      //   itemsProcessed++
      //   chainStart()
      //   if (itemsProcessed === busFromFile.length) {
      //     console.log(newBusGulityArray)
      //     console.log('ENDDDDDDD')
      //   }
      // })
      //   })
      // })
    })
    setInterval(() => {
       axios.get('http://analytics.dlt.transcodeglobal.com/test_businfo.txt')
         .then(data => {
           var busData = data.data
           var count = 0;
           busFromUrl = Object.values(busData)
           busFromUrl = busFromUrl.filter(element => (
             element.path === "39" || element.path === "63" || element.path === "97"
          ))
          console.log(busFromUrl)
        }).then(() => {
          Road
            .find({})
            .populate('busStopSequence')
            .populate('roadMapBus')
            .exec(function (err, data) {
              road = data
              BusOnroad.find({}, function (err, data) {
                busOnroad = data
              }).then(() => {
                for (let i = 0; i < busFromUrl.length; i++) {
                  setTimeout(function () {
                    if (busFromUrl[i].path === '39') {
                      roadData = road.filter(element => (
                        element.name === '39'
                      ))
                      busStopSequence = roadData[0].busStopSequence.sequence
                      roadMapBus = roadData[0].roadMapBus.roadMap
                      centerPath = roadData[0].centerPath
                      firstBusStop = roadData[0].firstBusStop
                      currentCycleOnroad = roadData[0].currentCycleOnRoad
                      busOnroadData = busOnroad.filter(element => (
                        element.busRoad === '39'
                      ))
                    }
                    else if (busFromUrl[i].path === '63') {
                      roadData = road.filter(element => (
                        element.name === '63'
                      ))
                      busStopSequence = roadData[0].busStopSequence.sequence
                      roadMapBus = roadData[0].roadMapBus.roadMap
                      centerPath = roadData[0].centerPath
                      firstBusStop = roadData[0].firstBusStop
                      currentCycleOnroad = roadData[0].currentCycleOnRoad
                      busOnroadData = busOnroad.filter(element => (
                        element.busRoad === '63'
                      ))
                    }
                    else {
                      roadData = road.filter(element => (
                        element.name === '97'
                      ))
                      busStopSequence = roadData[0].busStopSequence.sequence
                      roadMapBus = roadData[0].roadMapBus.roadMap
                      centerPath = roadData[0].centerPath
                      firstBusStop = roadData[0].firstBusStop
                      currentCycleOnroad = roadData[0].currentCycleOnRoad
                      busOnroadData = busOnroad.filter(element => (
                        element.busRoad === '97'
                      ))
                    }
                    getBusOnRoad(roadMapBus, busFromUrl[i].busID, busFromUrl[i].speed, busStopSequence, busFromUrl[i].lat, busFromUrl[i].lon, busFromUrl[i].path, busFromUrl[i].time, busOnroadData, currentCycleOnroad, centerPath, firstBusStop).then(val => {
                      console.log(val)
                    })
                  }, 200);
                }
              })
            })
        })
   }, 60000)

  // setInterval(() => {
  //   var i = count
  //   if (count + 5 < busFromFile.length) {
  //     Road
  //       .findOne({ name: '97' })
  //       .populate('busStopSequence')
  //       .populate('roadMapBus')
  //       .exec(function (err, data) {
  //         busStopSequence = data.busStopSequence.sequence
  //         roadMapBus = data.roadMapBus.roadMap
  //         centerPath = data.centerPath
  //         firstBusStop = data.firstBusStop
  //         currentCycleOnroad = data.currentCycleOnRoad
  //         BusOnroad.find({ busRoad: '97' }, function (err, data) {
  //           busOnroad = data
  //         }).then(() => {
  //           getBusOnRoad(roadMapBus, busFromFile[i].busID, busFromFile[i].speed, busStopSequence, busFromFile[i].lat, busFromFile[i].lng, '97', busFromFile[i].time, busOnroad, currentCycleOnroad, centerPath, firstBusStop).then(val => {
  //             console.log(i)
  //             console.log(val)
  //             count = count+1
  //           })
  //         })
  //       })
  //   }
  //   else {
  //     console.log("endddddd")
  //   }
  // }, 1000)


  setInterval(() => {
    var day = new Date();
    console.log(day.getMinutes())
    console.log(day.getHours())
    if (day.getMinutes() === 0 && day.getHours() === 3) {
      var roadData = []
      Road.find({}, function (err, data) {
        if (err) throw err;
        roadData = data
      }).then(() => {
        for (var i = 0; i < roadData.length; i++) {
          Road.findOneAndUpdate({ name: roadData[i].name }, { currentCycleOnRoad: 0 }, function (err, checkdata) {
            console.log('update success')
          })
        }
      })
    }
  }, 60000)

  //   BusGulity.find({}, function (err, data) {
  //     if (err) throw err;
  //     console.log(data[20].timeStamp)
  //     var a = new Date(data[20].timeStamp)
  //     console.log(a)
  // })

});
