(() => {
    'use strict';

    angular
        .module('clusterEditor')
        .controller('ResultsController', ResultsController);

    ResultsController.$inject = ['$location', '$window', '$document', 'StaticDataService', 'SearchService', 'ClusterService'];

    function ResultsController($location, $window, $document, StaticDataService, SearchService, ClusterService){
        var vm = this;
        vm.ScrollToLocation = ScrollToLocation;
        vm.EditCluster = EditCluster;
        vm.Search = Search;
        vm.SearchCheck = SearchCheck;
        vm.GenerateLink = GenerateLink;

        vm.transferInProgress = true;
        vm.emptySearch = false;
        vm.showExpired = false;

        vm.headerInformation = null;
        vm.clusterInformation = null;
        vm.departmentMap = new Map();
        vm.crosslistMap = new Map();
        vm.lastOfferedMap = new Map();

        /**
         * Initialize data structures for fast lookup during page load.
         */
        vm.disciplineMap = StaticDataService.GetAcademicDisciplineMap();
        vm.currentTerm = StaticDataService.GetCurrentTerm();        

        StaticDataService.GetAcademicDepartments(function(response){
            let departments = response.data.results;
            for(let i = 0; i < departments.length; i++)
                vm.departmentMap.set(departments[i].code, departments[i].label);
        });

        StaticDataService.GetCrosslistings()
        .then((response) => {
            let courses = response.data.results;
            for(let i = 0; i < courses.length; i++){
                let index = courses[i].courseNumber;
                
                if(courses[i].crossListedCourse != ''){
                    if(!vm.crosslistMap.has(index))
                    vm.crosslistMap.set(index, courses[i].crossListedCourse);
                    else 
                        vm.crosslistMap.set(index, vm.crosslistMap.get(index) + " " + courses[i].crossListedCourse);
                }


                if(courses[i].lastOffered != ''){
                    if(!vm.lastOfferedMap.has(index))
                    vm.lastOfferedMap.set(index, StaticDataService.ParseTerm(courses[i].lastOffered));
                }
            }
        });

        /**
         * Execute the search query stored in the search service and allow the display to 
         * start rendering the results.
         */
        SearchService.ExecuteQuery(function (searchResults){
            vm.headerInformation = searchResults.headerData;
            vm.clusterInformation = searchResults.clusterData;            

            console.log(searchResults);

            if(Object.keys(vm.clusterInformation).length === 0)
                vm.emptySearch = true;

            vm.transferInProgress = false;
        });

        /**
         * User Interface Action Handlers
         */
        function EditCluster(number){
            ClusterService.SetClusterNumber(number);
            $location.path('/edit');
        }

        function Search(){
            $location.path('/search');
        }

        /**
         * Scroll the window from the source to the location.
         * 
         * @param element source 
         * @param element location 
         */
        function ScrollToLocation(source, location = null){
            const duration = 16; // Scroll duration just below the 60HZ screen refresh

            const sourceElement = $document[0].getElementById(source);
            const sourceY = sourceElement.getBoundingClientRect().top;

            let locationElement = null;
            let locationY = null;

            if(location){
                locationElement = $document[0].getElementById(location);
                locationY = locationElement.getBoundingClientRect().top;
            }

            let difference = $window.pageYOffset + locationY;
            let downFlag = false;

            if(locationY){
                difference = $window.pageYOffset + locationY;
                downFlag = true;
            }
            else{
                difference = $window.pageYOffset + sourceY;
            }

            var start = null;

            $window.requestAnimationFrame(function step(timestamp){
                if(!start) { start = timestamp; }

                let time = timestamp - start; 
                let percent = Math.min(time / duration, 1); 

                // Gradually each frame 'ease' towards our target destination
                let scrollToThisStep = (downFlag ? difference * percent : difference - (difference * percent)); 

                $window.scrollTo(0, scrollToThisStep);

                if(time < duration)
                    $window.requestAnimationFrame(step);
            });
        }

        /**
         * Check if a course was part of the search query.
         * 
         * @param string course 
         * @returns bool
         */
        function SearchCheck(course){
            let courseList = SearchService.GetCourseList();

            if(courseList === null)
                return false;
            
            let index = courseList.indexOf(course);
            if(index > -1)
                return true;
            
            return false;
        }

        /**
         * Create a CDCS URL link from the course number.
         * 
         * @param string course 
         * @returns string
         */
        function GenerateLink(course){
            let pattern1 = /^[A-Z]{2}\d{3}$/; //PH202
            let pattern2 = /^[A-Z]{2}\d{3}[A-Z]{1}$/; //PH202W

            let courseNumber = null;
            let courseSubject = null;
            if(pattern1.test(course) || pattern2.test(course)){
                courseSubject = course.slice(0,2);
                courseNumber = course.slice(2);
            }
            else {
                courseSubject = course.slice(0,3);
                courseNumber = course.slice(3);
            }

            let link = "https://cdcs.ur.rochester.edu/Query.aspx?id=DARS&div=1&dept=" + courseSubject + "&cn=" + courseNumber;

            return link;
        }
    }
})();