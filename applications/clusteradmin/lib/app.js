(() => {
    'use strict';

    angular
        .module('clusterEditor', ['ngRoute','regrAuth'])
        .config(config);

    config.$inject = ['$routeProvider','$locationProvider'];

    function config($routeProvider, $locationProvider){

        $routeProvider
            .when("/", {
                templateUrl: "lib/main/main.html",
                controller: "MainController",
                controllerAs: "vm"
            })
            .when("/search", {
                templateUrl: "lib/search/search.html",
                controller: "SearchController",
                controllerAs: "vm"
            })
            .when("/results", {
                templateUrl: "lib/results/results.html",
                controller: "ResultsController",
                controllerAs: "vm"
            })
            .when("/create", {
                templateUrl: "lib/create/create.html",
                controller: "CreateController",
                controllerAs: "vm"
            })
            .when("/edit", {
                templateUrl: "lib/edit/edit.html",
                controller: "EditController",
                controllerAs: "vm"
            })
            .when("/publish", {
                templateUrl: "lib/publish/publish.html",
                controller: "PublishController",
                controllerAs: "vm"
            })
            .when("/process", {
                templateUrl: "lib/process/process.html",
                controller: "ProcessController",
                controllerAs: "vm"
            })
            .when("/history", {
                templateUrl: "lib/history/history.html",
                controller: "HistoryController",
                controllerAs: "vm"
            })
            .otherwise({ redirectTo: "/" });

        $locationProvider.html5Mode({ enabled: true }).hashPrefix('!');
    }
})();