'use strict';

/**
 * @module Ansible
 * @description Allows the drone and overmind to communicate
 */

var io = require('socket.io-client');
var Promise = require('bluebird');
var constants = require('./utils/constants');

function Ansible () {
  this._drone = null;
  this._socket = null;
  this._connected = false;
  this._registered = false;
}

Ansible.prototype = {
  connect: function (host) {
    var socket;
    var _this = this;
    
    this._socket = socket = io.connect(host, {reconnect:true});

    return new Promise(function (resolve) {
      socket.on('connect', function () {
        console.log('Contacted the Overmind and awaiting commands');
        _this._connected = true;

        // If already registered, we are reconnecting after a disconnect
        if (_this._registered) {
          _this.reconnect();
        }

        resolve();
      });

      socket.on('disconnect', function () {
        console.log('Lost contact with the Overmind');
        _this._connected = false;
      });
    });
  },

  monitor: function (cb) {
    this._socket.on('overmind:abort', function () {
      cb(constants.COMMANDS.ABORT);
    });
    this._socket.on('overmind:stop', function () {
      cb(constants.COMMANDS.STOP);
    });
    this._socket.on('overmind:move', function () {
      cb(constants.COMMANDS.MOVE);
    });
  },

  reconnect: function () {
    this._socket.emit('drone:connect', this._drone);
  },

  register: function (drone) {
    if (!this._registered) {
      this._socket.emit('drone:connect', drone);
      
      // cache
      this._drone = drone;
      this._registered = true;
    }
  },

  update: function (data) {
    this._socket.emit('drone:update', data);
  }
};

module.exports = exports = new Ansible();