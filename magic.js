window.setupMap = function() {
  window.map = new L.Map('map', {center: L.latLng(49.2, 10.1), zoom: 4, closePopupOnClick: false});

  L.Icon.Default.imagePath = 'images';

  var osmOpt = {attribution: 'Map data © OpenStreetMap contributors', maxZoom: 18, type: 'osm'};
  var osm = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', osmOpt);

  var mqTilesAttr = 'Tiles &copy; <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png" /><br/>Imagery &copy; NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency';
  var mqOpt = {attribution: mqTilesAttr, maxZoom: 18, subdomains: '1234', type: 'sat'};
  var mq = new L.TileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg', mqOpt);

  map.addLayer(osm);

  window.layerChooser = new L.Control.Layers({
    'OpenStreetMap': osm,
    'MapQuest Sat View': mq
    });
  map.addControl(window.layerChooser);

  L.control.scale({imperial: false}).addTo(map);
}


window.readGPSInfo = function(file, callback) {
  var url = window.URL || window.webkitURL;
  var path = url.createObjectURL(file);

  // only consider first 128 kB, because that’s where the EXIF data is
  // stored
  // http://code.flickr.net/2012/06/01/parsing-exif-client-side-using-javascript-2/
  var filePart;
  if (file.slice) {
      filePart = file.slice(0, 131072);
  } else if (file.webkitSlice) {
      filePart = file.webkitSlice(0, 131072);
  } else if (file.mozSlice) {
      filePart = file.mozSlice(0, 131072);
  } else {
      filePart = file;
  }

  // try to extract position
  var reader = new FileReader;
  reader.onload = function() {
    var gps, f, lat, lng;

    try {
      gps = Exif.loadFromArrayBuffer(reader.result).gpsifd;
      if(typeof gps === "undefined") {
        throw "GPS data is unavailable.";
      } else {
        f = function (b, a) { return a + b / 60; };
        lat = gps.latitude.reduceRight(f)  * (gps.latitudeRef.indexOf("N") >= 0 ? 1 : -1);
        lng = gps.longitude.reduceRight(f) * (gps.longitudeRef.indexOf("E") >= 0 ? 1 : -1);
        callback(path, file.name, lat, lng);
      }
    } catch(e) {
      var c = map.getCenter();
      var lat = Math.round(c.lat*100)/100;
      var lng = Math.round(c.lng*100)/100;
      callback(path, file.name, lat, lng);
    }
  };
  reader.readAsArrayBuffer(filePart);
}

// http://stackoverflow.com/a/5786281/1684530
window.convertDDToDMS = function(D, lng) {
  return {
    dir : D<0?lng?'W':'S':lng?'E':'N',
    deg : 0|(D<0?D=-D:D),
    min : 0|D%1*60,
    sec :(0|D*60%1*6000)
  };
}

window.round = function(num, length) {
  var e = Math.pow(10, length);
  return Math.round(num*e)/e;
}

window.renderExportLines = function() {
  var t = "";
  var l;
  $.each(window.newLocations, function(filename, latLng) {
    l = convertDDToDMS(latLng.lat, false);
    t += 'exiv2 -M"set Exif.GPSInfo.GPSLatitude '+l.deg+'/1 '+l.min+'/1 '+l.sec+'/100" "'+filename+'"\n';
    t += 'exiv2 -M"set Exif.GPSInfo.GPSLatitudeRef '+l.dir+'" "'+filename+'"\n';

    l = convertDDToDMS(latLng.lng, true);
    t += 'exiv2 -M"set Exif.GPSInfo.GPSLongitude '+l.deg+'/1 '+l.min+'/1 '+l.sec+'/100" "'+filename+'"\n';
    t += 'exiv2 -M"set Exif.GPSInfo.GPSLongitudeRef '+l.dir+'" "'+filename+'"\n';

    t += '\n';
  });
  $('#export').val(t);
}

window.loadPictures = function(files) {
  // reject all non-jpg files
  files = jQuery.grep(files, function(file) {
    return file.type === "image/jpeg";
  });

  if(files.length === 0)
    return alert("No pictures selected. Only JPG files are supported right now.");

  window.filesLoaded = files.length;
  window.filesLoadedLLs = [];

  $.each(files, function(ind, file) {
    window.readGPSInfo(file, window.createPictureMarker);
  });

  $('#picSelector').attr('disabled', 'disabled');
}

window.createPictureMarker = function(path, name, lat, lng) {
  var img = '<img src="'+path+'" style="width:110px"/>';

  var ll = L.latLng([lat, lng]);

  var m = L.marker(ll, {draggable: true})
    .addTo(map)
    .bindPopup(img, {minWidth: 110, maxWidth: 110})
    .openPopup();


  m.on('dragstart drag dragend', function(event) {
    var marker = event.target;
    var newLoc = marker.getLatLng();
    window.newLocations[name] = newLoc;
    $('#preview').html(
      '<img src="'+path+'" style="width:100%"/>' +
      '<table><tr><th></th><th>lat</th><th>lng</th></tr>' +
      '<tr><th>org</th><td>' +
      window.round(lat, 8) +
      '</td><td>' +
      window.round(lng, 8) +
      '</td></tr>' +
      '<tr><th>new</th><td>' +
      window.round(newLoc.lat, 8) +
      '</td><td>' +
      window.round(newLoc.lng, 8) +
      '</td></tr>' +
      '</table>'
    );
  });

  m.on('dragend', function(event) {
    var marker = event.target;
    marker.openPopup();
    window.renderExportLines();
  });

  window.filesLoadedLLs.push(ll);
  window.filesLoaded--;
  if(window.filesLoaded === 0) {
    map.fitBounds(L.latLngBounds(window.filesLoadedLLs));
  }
}

$(document).ready(function() {
  // allow more than one popup to be opened
  L.Map = L.Map.extend({
    openPopup: function(popup) {
      this._popup = popup;

      return this.addLayer(popup).fire('popupopen', {
          popup: this._popup
      });
    }
  });

  // where changes are stored
  window.newLocations = {};

  window.setupMap();
});
