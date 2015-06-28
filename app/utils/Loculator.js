'use strict';

var Promise = require('bluebird');

var EARTHS_RADIUS = 6371000; // meters
var UPDATE_FREQ = 250; // milliseconds

module.exports = Loculator;

/**
 * [Loculator description]
 * 
 * @param {Object} start LatLng
 * @param {Object} end LatLng
 * @param {Integer} speed Drone speed in meters per second
 */
function Loculator (start, end, speed) { 
  // convert speed to meters per UPDATE_FREQ
  this._speed = speed * (UPDATE_FREQ/1000);
  this.setStartEnd(start, end);
}

Loculator.$$calculateBearing = calculateBearing;
Loculator.$$calculateDistance = calculateDistance;
Loculator.$$calculateDestLatLng = calculateDestLatLng;
Loculator.$$toRadians = toRadians;
Loculator.$$toDegrees = toDegrees;

Loculator.prototype = {
  
  /**
   * Calculates the position (latlng) of the drone on each tick as it moves between 
   * two points at the specified speed.
   * 
   * @return {Promise} Resolves with the latlng position of the drone
   */
  getNext: function () {
    var _this = this;
    var location;

    // get initial bearing
    var bearing = calculateBearing(this._current, this._end);

    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        if (_this._remainingDistance > _this._speed) {
          location = calculateDestLatLng(_this._current, _this._speed, bearing);
          _this._remainingDistance = _this._remainingDistance - _this._speed;
        }
        // arrived at our destination 
        else {
          _this._remainingDistance = 0;
          location = _this._end;
        }

        // update current
        _this._current = location;
        resolve(location);
      }, UPDATE_FREQ);
    });
  },

  setStartEnd: function (start, end) {
    this._start = arrayToLatLng(start);
    this._end = arrayToLatLng(end);
    this._current = this._start; // latlng indicating drones current position
    this._distance = calculateDistance(this._start, this._end);
    this._remainingDistance = this._distance; // distance remaining until destination
  }
};

///////////////////////////////////////////////////////////////////////////////////////////////////
// Methods for calculating bearing, distance, and destination latlng
// @see http://www.movable-type.co.uk/scripts/latlong.html
///////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Calculate a destination latlng given a starting point, distance to travel, and a bearing
 * 
 * @param  {Object} start   LatLng
 * @param  {Number} distance Distance in meters
 * @param  {Number} bearing Bearing in degrees
 * @return {Object} LatLng
 */
function calculateDestLatLng (start, distance, bearing) {

  var latlng;
  var dR = distance/EARTHS_RADIUS; // angular distance

  // console.log(start, distance, bearing);

  // convert to radians
  var lat1 = toRadians(start.lat);
  var lng1 = toRadians(start.lng);
  bearing = toRadians(bearing);

  var lat = Math.asin(Math.sin(lat1) * Math.cos(dR) +
                      Math.cos(lat1) * Math.sin(dR) * Math.cos(bearing));
  var lng = lng1 + Math.atan2(Math.sin(bearing) * Math.sin(dR) * Math.cos(lat1),
                      Math.cos(dR) - Math.sin(lat1) * Math.sin(lat));

  // normalize to -180...+180
  lng = (lng + 3 * Math.PI) % (2 * Math.PI) - Math.PI;

  return {
    lat: toDegrees(lat),
    lng: toDegrees(lng)
  };
}

/**
 * Calculate the metric distance between two latlng points using the Haversine formula
 * 
 * @param  {[type]} latlng1 [description]
 * @param  {[type]} latlng2 [description]
 * @return {Integer} distance in meters
 */
function calculateDistance (latlng1, latlng2) {

  var lat1 = toRadians(latlng1.lat);
  var lat2 = toRadians(latlng2.lat);
  var dLat = toRadians(latlng2.lat - latlng1.lat);
  var dLng = toRadians(latlng2.lng - latlng1.lng);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1) * Math.cos(lat2) *
          Math.sin(dLng/2) * Math.sin(dLng/2);

  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = EARTHS_RADIUS * c; // distance
  return d;
}

/**
 * Calculate initial bearing given a start and destination point
 * 
 * @param  {Object} latlng1
 * @param  {Object} latlng2
 * @return {Number} bearing in degrees
 */
function calculateBearing (latlng1, latlng2) {

  var lat1 = toRadians(latlng1.lat);
  var lat2 = toRadians(latlng2.lat);
  var lng1 = toRadians(latlng1.lng);
  var lng2 = toRadians(latlng2.lng);

  var dlng = lng2 - lng1;

  var y = Math.sin(dlng) * Math.cos(lat2);
  var x = Math.cos(lat1) * Math.sin(lat2) -
          Math.sin(lat1) * Math.cos(lat2) * Math.cos(dlng);

  return toDegrees(Math.atan2(y, x));
}

function toRadians (degrees) {
  return degrees * Math.PI / 180;
}

function toDegrees (radians) {
  return radians * 180 / Math.PI;
}

function arrayToLatLng (obj) {
  if (Array.isArray(obj)) {
    return {
      lat: obj[0],
      lng: obj[1]
    };
  } else {
    return obj;
  }
}