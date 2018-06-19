/**
 * SearchService - This service stores and executes a search query from the API, and handles
 *                 transforming the data for the view model.
 * 
 * 
 * - Jeffery A. White - University of Rochester Registrar's Office - March 2018
 */
(() => {
    'use strict';

    angular
        .module('clusterEditor')
        .factory('SearchService', SearchService);

    SearchService.$inject = ['$http', '$window'];

    function SearchService($http, $window){

        var academicDiscipline = null;
        var academicDepartment = null;
        var freeText = null;
        var courseListing = null;
        
        var service = {};
        service.StoreQuery = StoreQuery;
        service.ExecuteQuery = ExecuteQuery;
        service.GetCourseList = GetCourseList;
        return service;

        /**
         * Store query information from a controller, so we can use it at will.
         * 
         * @param string academicDiscipline 
         * @param string academicDepartment 
         * @param string freeText 
         * @param array courseListing 
         */
        function StoreQuery(academicDiscipline, academicDepartment, freeText, courseListing){
            this.academicDiscipline = academicDiscipline;
            this.academicDepartment = academicDepartment;
            this.freeText = freeText;
            this.courseListing = courseListing.join(',');
        }

        /**
         * Submit a previously stored query to the API, transform the response,
         * and defer to the provided callback function.
         * 
         * @param function callback 
         */
        function ExecuteQuery(callback){
            const host = $window.location.hostname;

            $http({
                method: 'POST',
                url: "https://" + host + "/registrar/api/clusters/query",
                data: { freeText: this.freeText, 
                        academicDiscipline: this.academicDiscipline, 
                        academicDepartment: this.academicDepartment, 
                        courseList: this.courseListing }
            })
            .then((response) => {                 
                var finalClusterInformation = null;
                finalClusterInformation = Transform(response.data.results);
                callback(finalClusterInformation);  
            });
        }

        /**
         * Get the course listing stored by the last query.
         * 
         * @returns array
         */
        function GetCourseList(){
            return this.courseListing;
        }

        /**
         * Create a header object and cluster data object, sort the clusters groups and courses.
         * 
         * @param object clusterData 
         * @returns object
         */
        function Transform(clusterData){          
            var headers = {};
            var clusters = {};
            var finalClusterInformation = {};

            for(let key in clusterData){
                if(clusterData.hasOwnProperty(key)){
                    let header = clusterData[key].header;

                    if(!headers.hasOwnProperty(header.academicDepartment))
                        headers[header.academicDepartment] = [];

                    headers[header.academicDepartment].push({"title" : header.title,
                                                             "number" : header.clusterNumber,
                                                             "expirationTerm" : ParseTerm(header.expirationTerm),
                                                             "expirationNumeric" : header.expirationTerm });

                    clusterData[key].groups = SortClusterItems(clusterData[key].groups);

                    if(!clusters.hasOwnProperty(clusterData[key].header.academicDepartment))
                        clusters[clusterData[key].header.academicDepartment] = [];
                                         
                    clusterData[key].header.expirationNumeric = clusterData[key].header.expirationTerm;
                    clusterData[key].header.expirationTerm = ParseTerm(clusterData[key].header.expirationTerm);
                                         
                    clusters[clusterData[key].header.academicDepartment].push(clusterData[key]);
                }
            }

            finalClusterInformation['headerData'] = HeaderSort(DepartmentSort(headers));
            finalClusterInformation['clusterData'] = ClusterSort(DepartmentSort(clusters));
            return finalClusterInformation;
        }

        /**
         * Sort an object by its keys (in this case by the department).
         * 
         * @param object unordered 
         */
        function DepartmentSort(unordered){
            const ordered = {};
            Object.keys(unordered).sort().forEach((key) => { 
                ordered[key] = unordered[key]; 
            });            
            return ordered;
        }

        /**
         * Sort a header object by its title.
         * 
         * @param object headers 
         */
        function HeaderSort(headers){
            for(let key in headers){
                if(headers.hasOwnProperty(key)){
                    let ordered = headers[key].slice(0);
                    ordered.sort((a,b) => {
                        const x = a.title.toLowerCase();
                        const y = b.title.toLowerCase();

                        return x < y ? -1 : x > y ? 1 : 0; 
                    });

                    headers[key] = ordered;
                }
            }
            return headers;
        }

        /**
         * Sort a cluster object by its title.
         * 
         * @param object clusters 
         */
        function ClusterSort(clusters){
            for(let key in clusters){
                if(clusters.hasOwnProperty(key)){
                    let ordered = clusters[key].slice(0);

                    ordered.sort(function(a,b){
                        const x = a.header.title.toLowerCase();
                        const y = b.header.title.toLowerCase();

                        return x < y ? -1 : x > y ? 1 : 0; 
                    });

                    clusters[key] = ordered;
                }
            }
            return clusters;
        }

        /**
         * Counting sort to sort groups and courses by their defined ordering.
         * 
         * @param array cluster 
         */
        function SortClusterItems(cluster){
            var sortedGroups = [];
            for(let i = 0; i < cluster.length; i++){
                let courseData = cluster[i].courses;

                let sortedCourses = [];
                for(let j = 0; j < courseData.length; j++){
                    courseData[j].validStartNumeric = courseData[j].validStart;
                    courseData[j].validEndNumeric = courseData[j].validEnd;
                    courseData[j].validStart = ParseTerm(courseData[j].validStart);
                    courseData[j].validEnd = ParseTerm(courseData[j].validEnd);                    

                    sortedCourses[courseData[j].courseOrder - 1] = courseData[j];
                }

                cluster[i].courses = sortedCourses;
                sortedGroups[cluster[i].groupOrder - 1] = cluster[i];
            }

            return sortedGroups;
        }

        /**
         * Convert a numeric Year-Term value to human readable format.
         * 
         * @param string term 
         */
        function ParseTerm(term){
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
    }
})();