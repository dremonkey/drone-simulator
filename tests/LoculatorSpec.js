'use strict';

var Loculator = require('../app/utils/Loculator');
var chai = require('chai');

var expect = chai.expect;

describe('Loculator', function () {
  describe('#$$calculateBearing', function () {
    it('should calculate the initial bearing between two latlng points', function () {
      var latlng1 = {
        lat: 37.7833,
        lng: -122.4167
      };

      var latlng2 = {
        lat: 40.7127,
        lng: -74.0059
      };

      var bearing = Loculator.$$calculateBearing(latlng1, latlng2);
      expect(+bearing.toFixed(6)).to.equal(69.919445);
    });
  });

  describe('#$$calculateDistance', function () {
    it('should calculate the distance between two latlng points', function () {
      var latlng1 = {
        lat: 37.7833,
        lng: -122.4167
      };

      var latlng2 = {
        lat: 40.7127,
        lng: -74.0059
      };

      var d = Math.round(Loculator.$$calculateDistance(latlng1, latlng2) / 1000);
      expect(d).to.equal(4129); // distance in kilometers
    });
  });

  describe('#$$calculateDestLatLng', function () {
    it('should calculate the destination latlng', function () {
      var latlng1 = {
        lat: 37.7833,
        lng: -122.4167
      };

      var bearing = 69.919445;
      var distance = 4128553.030413071; // in meters
      var dest = Loculator.$$calculateDestLatLng(latlng1, distance, bearing);

      dest.lat = +dest.lat.toFixed(4);
      dest.lng = +dest.lng.toFixed(4);

      expect(dest).to.deep.equal({
        lat: 40.7127,
        lng: -74.0059
      });
    });
  });
  
  describe('#$$toDegrees', function () {
    it('should convert radians to degrees', function () {
      var r1 = Math.PI;
      var r2 = Math.PI / 4;

      expect(Loculator.$$toDegrees(r1)).to.equal(180);
      expect(Loculator.$$toDegrees(r2)).to.equal(45);
    });
  });

  describe('#$$toRadians', function () {
    it('should convert degrees to radians', function () {
      var d1 = 180;
      var d2 = 45;

      expect(Loculator.$$toRadians(d1)).to.equal(Math.PI);
      expect(Loculator.$$toRadians(d2)).to.equal(Math.PI/4);
    });
  });
});