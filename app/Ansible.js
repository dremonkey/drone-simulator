'use strict';

/**
 * @module Ansible
 * @description Allows the drone and overmind to communicate
 */

var io = require('socket.io-client');
var Promise = require('bluebird');
var constants = require('./utils/constants');

function Ansible () {
  this._socket = null;
  this._connected = false;
  this._registered = false;
}

Ansible.prototype = {
  connect: function (host) {
    var _this, socket;
    this._socket = socket = io.connect(host, {reconnect:true});

    return new Promise(function (resolve) {
      socket.on('connect', function () {
        console.log('Contacted the Overmind and awaiting commands');
        _this._connected = true;
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
      cb(constants.COMMAND.ABORT);
    });
    this._socket.on('overmind:stop', function () {
      cb(constants.COMMAND.STOP);
    });
    this._socket.on('overmind:move', function () {
      cb(constants.COMMAND.MOVE);
    });
  },

  register: function (drone) {
    if (!this._registered) {
      this._socket.emit('drone:register', drone);
      this._registered = true;
    }
  },

  update: function (data) {
    this._socket.emit('drone:update', data);
  }
};

module.exports = exports = new Ansible();