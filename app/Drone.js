'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var uuid = require('node-uuid');

var Ansible = require('./Ansible');
var Loculator = require('./utils/Loculator');
var constants = require('./utils/constants');

/**
 * @module  Drone
 * @description Drone Simulator
 */

var drone;

function Drone (waypoints, speed) {

  var home, homeIndex;

  // singleton
  if (drone) {
    return drone;
  }
  
  homeIndex = Math.floor(Math.random() * (waypoints.length-1));
  waypoints = formatWaypoints(waypoints);
  home = waypoints[homeIndex];

  _.extend(this, {
    id: uuid.v4(),
    home: home,
    location: home,
    lastWaypoint: homeIndex,
    nextWaypoint: (homeIndex + 1) % waypoints.length,
    speed: speed,
    status: constants.STATUS.STOPPED,
    waypoints: waypoints
  });

  drone = this;
}

Drone.prototype = {
  
  /**
   * Move the drone back to it's starting location, using the fastest route
   * possible
   * 
   * @return {Promise}
   */
  abort: function () {
    var destination = this._waypoints[this._homeIndex];
  },

  /**
   * Moves the drone and ensures that the database has the latest information.
   * This will recursively call itself UNTIL the `stop` command has been made.
   * 
   * @return {[type]} [description]
   */
  move: function () {

    var loculator;

    var _this = this;
    var current = this.location;
    var destination = this.waypoints[this.nextWaypoint];
    var speed = this.speed;
      
    loculator = new Loculator(current, destination, speed);
    
    return loculator.getNext()
    .tap(function () {
      if (_this.status === constants.COMMAND.STOP) {
        return Promise.reject(constants.COMMAND.STOP);
      }
    })
    .spread(function (newLocation) {

      _this.location = newLocation;
      _this.status = constants.STATUS.MOVING;
      
      // reached the waypoint
      if (_.isEqual(newLocation, destination)) {
        _this.lastWaypoint = _this.nextWaypoint;
        _this.nextWaypoint = (_this.nextWaypoint + 1) % _this.waypoints.length;
      }

      return _this.updateAnsible();
    })
    .then(function () {
      // repeat
      _this.move();
    })
    .catch(function (err) {
      if (err === constants.COMMAND.STOP) {
        this.status = constants.STATUS.STOPPED;
        return this.updateAnsible();
      } else {
        throw new Error(err);
      }
    });
  },

  stop: function () {
    this.status = constants.COMMAND.STOP;
  },

  updateAnsible: function () {
    return Ansible.update(this.id, {
      location: this.location,
      lastWaypoint: this.lastWaypoint,
      nextWaypoint: this.nextWaypoint,
      status: this.status
    });
  },

  /**
   * Register the drone with the Overmind using Ansible
   * 
   * @return {Promise}
   */
  register: function () {
    var _this = this;

    if (!this.registered) {
      return Ansible.register(this)
      .then(function () {
        Ansible.monitor(_this.onNewCommand.bind(_this));
        return _this;
      });
    } else {
      return Promise.resolve(this);
    }
  },

  onNewCommand: function (command) {

    var id = this.id;

    console.log('Drone `%s` commanded to `%s`', id, command);

    switch (command) {
      case constants.COMMANDS.ABORT:
        this.abort();
        break;
      case constants.COMMANDS.MOVE:
        this.move();
        break;
      case constants.COMMANDS.STOP:
        this.stop();
        break;
    }
  }
};

module.exports = Drone;

////////////////////////////////////////////////////////////////////////////////
// Helpers
////////////////////////////////////////////////////////////////////////////////

/**
 * Convert array of [lat,lng] waypoints to array of {lat:lat, lng:lng} objects
 */
function formatWaypoints (waypoints) {
  return _.reduce(waypoints, function (waypoints, waypoint) {
    return waypoints.concat(arrayToLatLng(waypoint));
  }, []);
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