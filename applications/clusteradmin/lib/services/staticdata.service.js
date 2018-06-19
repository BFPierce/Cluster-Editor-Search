(() => {
    'use strict';

    angular
        .module('clusterEditor')
        .factory('StaticDataService', StaticDataService);

    StaticDataService.$inject = ['$http','$window'];

    function StaticDataService($http, $window){
        var service = {};
        service.GetAcademicDepartments = GetAcademicDepartments;
        service.GetAcademicDisciplines = GetAcademicDisciplines;
        service.GetCrosslistings = GetCrosslistings;
        service.GetAcademicDisciplinesEditor = GetAcademicDisciplinesEditor;
        service.GetAcademicDisciplineMap = GetAcademicDisciplineMap;
        service.GetTermOptions = GetTermOptions;
        service.GetCurrentTerm = GetCurrentTerm;
        service.ParseTerm = ParseTerm;
        service.GetTitle = GetTitle;
        return service;

        /**
         * @description Get all academic departments and defer to the callback function.
         * @param {function} callback 
         * @returns defers to the callback function provided.
         */
        function GetAcademicDepartments(callback){   
            const host = $window.location.hostname;

            $http({	     
                method: 'GET',
                url: "https://" + host + "/registrar/api/clusters/departments"
            })
            .then( function(response){         
                callback(response);
            });
        }

        /**
         * Hit the crosslisting endpoint to get all crosslistings, return a promise to the caller.
         * 
         * @returns promise
         */
        function GetCrosslistings(){
            const host = $window.location.hostname;

            return $http({
                method: 'GET',
                url: "https://" + host + "/registrar/api/clusters/crosslist" });
        }
        
        /**
         * @description Get a list of academic disciplines.
         * @returns object { discipline: keycode, ... }
         */
        function GetAcademicDisciplines(){
            let disciplines = { "All Disciplines": "",
                                "Humanities": "HUM", 
                                "Social Sciences": "SSC",
                                "Natural Sciences and Engineering": "NSE" };

            return disciplines;
        }

        /**
         * @description Get a list of academic disciplines for the editor screen.
         * @returns object { discipline: keycode, ... }
         */
        function GetAcademicDisciplinesEditor(){
            let disciplines = { "-- SELECT --": "",
                                "Humanities": "HUM", 
                                "Social Sciences": "SSC",
                                "Natural Sciences and Engineering": "NSE" };

            return disciplines;
        }

        /**
         * @description Get a listing of all possible year term options.
         * @param {string} start
         * @param {string} end
         * @returns object {term: keycode, ... }
         */
        function GetTermOptions(start, end){
            let startYear = start;
            let options = {};
            options["--"] = "0";

            while(startYear <= end){
                options["Fall " + (startYear - 1)] = startYear + "01";
                options["Spring " + startYear] = startYear + "02";
                options["Summer " + startYear] = startYear + "04";
                startYear++;
            }

            return options;
        }

        /**
         * @description Get a mapping of discpline codes to discpline text.
         * @returns Map (code -> discipline)
         */
        function GetAcademicDisciplineMap(){
            let disciplines = new Map();
            disciplines.set("HUM", "Humanities");
            disciplines.set("SSC", "Social Sciences");
            disciplines.set("NSE", "Natural Sciences and Engineering");

            return disciplines;
        }

        /**
         * @description Get the current term.
         * @returns string in YYYYTT Format.
         */
        function GetCurrentTerm(){
            let date = new Date();
            let year = date.getFullYear();
            let month = date.getMonth();

            if(month >= 5 && month <= 12)
                return (year + 1).toString() + "01";
            else
                return year.toString() + "02"; 
        }

        /**
         * Convert a numeric Year-Term value to human readable format.
         * 
         * @param string term 
         */
        function ParseTerm(term = null){
            if(term === "0" || term === null)
                return "";
    
            const year = term.slice(0,4);
            const semester = term.slice(4);

            if(semester === "01")
                return "Fall " + (year - 1);
            else if(semester === "02")
                return "Spring " + year;
            else
                return "Summer " + year;
        }

        /**
         * Get the course title for the provided course number
         * 
         * @param string number 
         */
        function GetTitle(number){
                const host = $window.location.hostname;

                return $http({
                    method: 'GET',
                    url: "https://" + host + "/registrar/api/cdcs/title/" + number });
        }
    }
})();