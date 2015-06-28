'use strict';

var Drone = require('./Drone');
var Ansible = require('./Ansible');

Ansible.connect('http://localhost:8080')
.then(function () {
  (new Drone()).register();
});
