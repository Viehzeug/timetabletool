'use strict';

var $rootScope;
var ttt;
var defaultValues = {};
defaultValues.width = 100;
defaultValues.height = 30;
defaultValues.fontSize = 4;
defaultValues.fontSizeHeader = 7;
defaultValues.strokeWidth = 0.3;
defaultValues['fill-opacity'] = 0.4;
defaultValues.startTime = 8;
defaultValues.endTime = 20;
defaultValues.wordwrap = 60;
defaultValues.lineHeight = 1.2;


function setupHandles($uibModal)
{
  $('svg rect, svg polygon, svg text').click(function(){
    var row = this.getAttribute('myttt:rowCoordinate');
    var col = this.getAttribute('myttt:colCoordinate');
    var index = this.getAttribute('myttt:arrayCoordinate');
    if (row >= 1 && col >= 1 && ttt.timeTableMatrix[row-1][col-1])
      $uibModal.open({animation: true,
                      templateUrl: 'detailModal.html',
                      controller:'detailModalController',
                      resolve: {isNew: function(){return false;},
                                row: function(){return row;},
                                col: function(){return col;},
                                index: function(){return index;}} }).
    result.then(function(){
      $rootScope.$broadcast('viewUpdate', {showUpload: false,
                                           showMenu: true,
                                           showDisplay: true});
    });
  });
}

/**
 * @ngdoc overview
 * @name angularApp
 * @description
 * # angularApp
 *
 * Main module of the application.
 */
var app = angular
  .module('angularApp', [
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'LocalStorageModule',
    'color.picker',
    'ui.bootstrap'
  ]);

app.config(['localStorageServiceProvider', function(localStorageServiceProvider){
  localStorageServiceProvider.setPrefix('timetabletool');
}]);

var cachedLoadedState;

app.factory('loadedSate', function(localStorageService) {
  if (cachedLoadedState === undefined)
  {
    var stateJSON = localStorageService.get('state');
    if (stateJSON !== undefined)
    {
      cachedLoadedState = JSON.parse(stateJSON);
    }
  }
  return cachedLoadedState;
});


app.controller('uploadController', function($scope, localStorageService, loadedSate, $uibModal){
  $scope.show = true;
  function init(){

    if(loadedSate)
    {
      Dropzone.autoDiscover = false;
      ttt = new TimeTableTool(undefined, defaultValues, function(){setupHandles($uibModal);},
                              function(data){localStorageService.set('state', data);});
      ttt.loadFromState(loadedSate);
      $scope.show = false;
      setTimeout(function(){
        $rootScope.$broadcast('viewUpdate', {showUpload: false,
                                             showMenu: true,
                                             showDisplay: true});
      }, 1000);
    } else
    {
      Dropzone.autoDiscover = false;
      var myDropzone = new Dropzone("div#dropzoneIcs",
      {
        paramName: "file", // The name that will be used to transfer the file
        maxFilesize: 2, // MB
        accept: function(file, done) {
          var reader = new FileReader();
          reader.readAsDataURL(file, 'UTF-8');
          reader.onload = function(){
            var data = reader.result.replace('data:text/calendar;base64,', '');
            data = atob(data);
            $rootScope.$broadcast('dataUploaded', {'data':data});
            done();
          }
        },
        url: '#',
        method: "post",
        clickable: true,
        maxFiles: 1,
        acceptedFiles: '.ics',
        autoProcessQueue: false,
        fallback: true
      });
    }
  }

  $scope.$on('viewUpdate', function(event, args){
    $scope.show = args.showUpload;
    $scope.$apply();
  });

  $scope.$on('dataUploaded', function(event, args){
    ttt = new TimeTableTool(args.data, defaultValues, function(){setupHandles($uibModal);},
                            function(data){localStorageService.set('state', data);});
    $rootScope.$broadcast('viewUpdate', {showUpload: false,
                                         showMenu: true,
                                         showDisplay: true});
  });

  $rootScope = angular.element(document.body).injector().get('$rootScope');
  init();
});

app.controller('displayController', function($scope){
  $scope.show = true;  

  $scope.$on('viewUpdate', function(event, args){
    $scope.show = args.showDisplay;
    $scope.$apply();
  });

});

app.controller('menuController', function($scope, localStorageService, $uibModal){
  $scope.show = false;
  $scope.controls = {};
  $scope.controls.height = defaultValues.height;
  $scope.controls.width = defaultValues.width;
  $scope.controls.fontSize = defaultValues.fontSize;
  $scope.controls.fontSizeHeader = defaultValues.fontSizeHeader;
  $scope.controls.strokeWidth = defaultValues.strokeWidth;
  $scope.controls.fillOpacity = defaultValues['fill-opacity'];
  $scope.controls.startTime = defaultValues.startTime;
  $scope.controls.endTime = defaultValues.endTime;
  $scope.controls.wordwrap = defaultValues.wordwrap;
  $scope.controls.lineHeight = defaultValues.lineHeight;
  $scope.colors = [];


  $scope.newEntry = function()
  {
    $uibModal.open({animation: true,
                      templateUrl: 'detailModal.html',
                      controller:'detailModalController',
                      resolve: {isNew: function(){return true;},
                                row: function(){return undefined;},
                                col: function(){return undefined;},
                                index: function(){return undefined;}} });
    // result.then(function(){
    //   $rootScope.$broadcast('viewUpdate', {showUpload: false,
    //                                        showMenu: true,
    //                                        showDisplay: true});
    // });
  }

  $scope.reset = function()
  {
    localStorageService.set('state', undefined);
    location.reload();
  }

  $scope.download = function()
  {
    //https://stackoverflow.com/questions/2483919/how-to-save-svg-canvas-to-local-filesystem
     // Add some critical information
    function downloadURI(uri, name) {
      var link = document.createElement("a");
      link.download = name;
      link.href = uri;
      link.click();
    }
     $("svg").attr({ version: '1.1' , xmlns:"http://www.w3.org/2000/svg"});
     var svg = $("#svgTarget").html();
     svg = '<svg height="' + ttt.getHeight() + '" width="' + ttt.getWidth() + '">' + svg + '</svg>';
     var b64 = btoa(svg);
     // Works in recent Webkit(Chrome)
     //$("body").append($("<img src='data:image/svg+xml;base64,\n"+b64+"' alt='file.svg'/>"));
     // Works in Firefox 3.6 and Webit and possibly any browser which supports the data-uri
     downloadURI('data:image/svg+xml;base64,\n'+b64, 'timetable.svg');
     // $("body").append($("<a href-lang='image/svg+xml' href='data:image/svg+xml;base64,\n"+b64+"' title='file.svg'>Download</a>"));
  };

  $scope.$watch("controls", function(){
    if(ttt && $scope.show)
    {
      ttt.rectHeight = $scope.controls.height;
      ttt.rectWidth = $scope.controls.width;
      ttt.fontSize = $scope.controls.fontSize;
      ttt.fontSizeHeader = $scope.controls.fontSizeHeader;
      ttt.strokeWidth = $scope.controls.strokeWidth;
      ttt['fill-opacity'] = $scope.controls.fillOpacity;
      ttt.wordwrap = $scope.controls.wordwrap;
      ttt.lineHeight = $scope.controls.lineHeight;
      ttt.render();
    }
  }, true);

  $scope.$watch("controls.startTime", function(){
    if(ttt && $scope.show)
    {
      ttt.setStartTime($scope.controls.startTime);
      ttt.render();
    }
  });

  $scope.$watch("controls.endTime", function(){
    if(ttt && $scope.show)
    {
      ttt.setEndTime($scope.controls.endTime);
      ttt.render();
    }
  });

  $scope.$watch("colors", function(){
    if(ttt && $scope.show)
    {
      var colors = {};
      for (var i = 0; i < $scope.colors.length; i++) {
        var c = $scope.colors[i];
        colors[c.id] = c.color;
      }
      ttt.colorChart = colors;
      ttt.render();
    }
  },true);


  $scope.$on('viewUpdate', function(event, args){
    $scope.show = args.showMenu;
    if($scope.show)
    {
      $scope.colors = Object.keys(ttt.idChart).map(function(e){ return {name: e, id:ttt.idChart[e], color: ttt.colorChart[ttt.idChart[e]]}; });      
      $scope.controls = {};
      $scope.controls.height = ttt.rectHeight;
      $scope.controls.width = ttt.rectWidth;
      $scope.controls.fontSize = ttt.fontSize;
      $scope.controls.fontSizeHeader = ttt.fontSizeHeader;
      $scope.controls.strokeWidth = ttt.strokeWidth;
      $scope.controls.fillOpacity = ttt['fill-opacity'];
      $scope.controls.startTime = ttt.startTime;
      $scope.controls.endTime = ttt.endTime;
      $scope.controls.wordwrap = ttt.wordwrap;
      $scope.controls.lineHeight = ttt.lineHeight;
    }
    $scope.$apply();
  });

});


app.controller('detailModalController', function($scope, $uibModalInstance, isNew, row, col, index, $uibModal){

  if (index === undefined) index = 0;
  $scope.isNew = isNew;
  $scope.colheaders = ttt.colheaders;
  var data = {};
  function setGroup()
  {
    $scope.data.group = Object.keys(ttt.idChart)[$scope.data.id];
    $scope.data.groups = Object.keys(ttt.idChart).map(function(e){
      return {name: e,
              id:   ttt.idChart[e]};
    }).filter(function(e){ return e.id != $scope.data.id;});
  }

  if(isNew)
  {
    $scope.data = {};
    $scope.data.useDefaultFontSize = true;
    $scope.data.useDefaultDisplayText = true;
    $scope.data.start = ttt.startTime;
    $scope.data.end = ttt.startTime + 1;
    $scope.data.name = "New Entry";
    $scope.data.displayName = "New Entry";
    $scope.data.location = "";
    $scope.data.displayNameRows = 3;
    $scope.data.dayOfWeek = 2;
    $scope.data.fontSize = ttt.fontSize;
  } else {
    data = ttt.timeTableMatrix[row-1][col-1][index];
    $scope.data = {};
    for (var key in data)
    {
      if (data.hasOwnProperty(key))
        $scope.data[key] = data[key];
    }
    $scope.data.displayNameRows = $scope.data.displayName.length;
    $scope.data.displayName = $scope.data.displayName.join('\n');
    setGroup();
  }

  $scope.$watch("data", function(){
    if ($scope.data.useDefaultDisplayText)
    {
      $scope.data.displayName = ttt.generateDisplayName($scope.data.name,
                                                        $scope.data.location);
      $scope.data.displayNameRows = $scope.data.displayName.length;
      $scope.data.displayName = $scope.data.displayName.join('\n');
    }
  }, true);

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.groupSelect = function(id){
    $scope.data.id = id;
    setGroup();
  };

  $scope.newGroup = function(){
      $uibModal.open({animation: true,
                      templateUrl: 'newGroupModal.html',
                      controller:'newGroupModalController'})
      .result.then(function(id){
        $scope.data.id = id;
        setGroup();
      }, function(){});
  };

  $scope.ok = function(){
    if(!isNew) ttt.timeTableMatrix[row-1][col-1].splice(index,1);
    if(isNew) $scope.data.id = ttt.generateId($scope.data.name)
    data.id = $scope.data.id;
    data.name = $scope.data.name;
    data.start = $scope.data.start;
    data.end = $scope.data.end;
    data.location = $scope.data.location;
    data.displayName = $scope.data.displayName.split('\n');
    data.dayOfWeek = $scope.data.dayOfWeek;
    data.fontSize = $scope.data.fontSize;
    data.useDefaultFontSize = $scope.data.useDefaultFontSize;
    data.useDefaultDisplayText = $scope.data.useDefaultDisplayText;
    ttt.addEntry(data);
    ttt.render();
    $uibModalInstance.close();
  };

});

app.controller('newGroupModalController', function($scope, $uibModalInstance){
  $scope.name = "";

  $scope.ok = function(){
    var id = ttt.generateId($scope.name);
    $uibModalInstance.close(id);
  };
  $scope.cancel = function(){
    $uibModalInstance.dismiss();
  };
});

