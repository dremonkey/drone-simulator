'use strict';

var path = require('path');
var fs = require('fs');

var Drone = require('./Drone');
var Ansible = require('./Ansible');

Ansible.connect('http://192.168.99.100:8080')
.then(function () {
  var fpath = path.resolve(__dirname, './resources/waypoints.txt');
  var waypoints = JSON.parse(fs.readFileSync(fpath, 'utf8'));
  var speed = 20; // speed in meters per second

  (new Drone(waypoints, speed)).register();
});
