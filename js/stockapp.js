var app = angular.module('myApp', ['googlechart', "angucomplete-alt", 'ngRoute']);

app.controller('myCtrl', function ($scope, $http, $q, $rootScope) {

    $http.get("data/nasdaq.json")
        .then(function(response) {
            $scope.nasdaq = response.data;
        })
        .catch(function(response) {
            console.error('Error Loading Data: ', response.status);
        })
        .finally(function() {
            $rootScope.loadedStocks = $scope.nasdaq;
        });

});

app.config(function($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix('');
        $routeProvider
            .when("/", {
                templateUrl: 'templates/homeTemplate.html'
            })
            .when("/:Symbol", {
                templateUrl: 'templates/stockTemplate.html',
                controller: 'loadStockCtrl'
            });
});


app.controller("loadStockCtrl", function($scope, $routeParams, $http, $q, $rootScope) {

    $scope.trading = function() {
        var d = new Date();
        var currentTime = "" + d.getHours() + d.getMinutes(); 

        if(currentTime > 2230 && currentTime < 0600) {
            return true;
        }
        else {
            return false;
        }
    }

    $scope.getData = function (timeseries) {

        $scope.loading = true;

        var timeseriesJSON = "";

        if(timeseries == 'TIME_SERIES_DAILY') {
            timeseriesJSON = "Time Series (Daily)";
        }
        else if(timeseries == 'TIME_SERIES_WEEKLY') {
            timeseriesJSON = "Weekly Time Series";
        }
        else if(timeseries == 'TIME_SERIES_MONTHLY') {
            timeseriesJSON = "Monthly Time Series";
        }

        $scope.endpoint = 'https://www.alphavantage.co/query?function=' + timeseries + '&symbol=' + $scope.Symbol + '&apikey=9WQX9H8JIJS9J84I';

        $http.get($scope.endpoint)
            .then(function (response) {
                $scope.data = response.data;
            })
            .catch(function (response) {
                console.log('Error Loading Data: ', response.status);
                $scope.loading = false;
            })
            .finally(function () {
                $scope.loadedData = $scope.data;

                $scope.lastRefreshed = $scope.loadedData["Meta Data"]["3. Last Refreshed"].split(" ")[0];
                $scope.timeZone = "US/Eastern";
                $scope.open = $scope.loadedData[timeseriesJSON][Object.keys($scope.loadedData[timeseriesJSON])[0]]["1. open"];
                $scope.close = $scope.loadedData[timeseriesJSON][Object.keys($scope.loadedData[timeseriesJSON])[0]]["4. close"];
                $scope.high = $scope.loadedData[timeseriesJSON][Object.keys($scope.loadedData[timeseriesJSON])[0]]["2. high"];
                $scope.low = $scope.loadedData[timeseriesJSON][Object.keys($scope.loadedData[timeseriesJSON])[0]]["3. low"];
                $scope.volume = $scope.loadedData[timeseriesJSON][Object.keys($scope.loadedData[timeseriesJSON])[0]]["5. volume"];

                $scope.priceArray = new Array();

                Object.keys($scope.loadedData[timeseriesJSON]).forEach(function (key) {
                    var object = '{"c": [{"v": "' + key + '"},{"v": "' + $scope.loadedData[timeseriesJSON][key]["4. close"] + '"}]}';
                    $scope.priceArray.unshift(JSON.parse(object));
                });

                $scope.loading = false;
                $scope.generateChart();
            });
    }

    $scope.generateChart = function () {

        $scope.myChartObject = {};

        $scope.myChartObject = {
            "type": "LineChart",
            "displayed": false,
            "data": {
                "cols": [
                    {
                        "id": "day",
                        "label": "Day",
                        "type": "string",
                        "p": {}
                    },
                    {
                        "id": "price",
                        "type": "number",
                        "p": {}
                    }
                ],
                "rows": $scope.priceArray
            },
            "options": {
                "title": "",
                "isStacked": "true",
                "fill": 20,
                "displayExactValues": true,
                "vAxis": {
                    "title": "",
                    "gridlines": {
                        "count": 5
                    }
                },
                "hAxis": {
                    "title": ""
                }
            },
            "formatters": {}
        }
    }
    
    $scope.Symbol = $routeParams.Symbol;

    $scope.Name = $rootScope.loadedStocks.filter(function(item) {return item.Symbol === $scope.Symbol})[0]["Security Name"];

    $scope.getData('TIME_SERIES_DAILY');
});

