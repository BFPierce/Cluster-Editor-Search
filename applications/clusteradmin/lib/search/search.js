(() => {
    'use strict';

    angular
        .module('clusterEditor')
        .controller('SearchController', SearchController);

    SearchController.$inject = ['$location', 'AuthenticationService', 'StaticDataService', 'SearchService'];

    function SearchController($location, AuthenticationService, StaticDataService, SearchService){
        var vm = this;

        vm.academicDepartments = {"":[{label: "All Departments", code: ""}],
                                  "HUM":[{label: "All Departments", code: ""}], 
                                  "SSC": [{label: "All Departments", code: ""}], 
                                  "NSE": [{label: "All Departments", code: ""}]};
        
        StaticDataService.GetAcademicDepartments(function(response){
            var placedInAll = [];
            var departments = response.data.results;

            for(let i = 0; i < departments.length; i++){
                const label = departments[i].label;
                const code = departments[i].code;

                vm.academicDepartments[departments[i].division].push({label : label, code: code});

                // Some departments are in multiple divisions, so we'll keep track of
                // those already placed into the initial list to avoid duplicates
                if(placedInAll.indexOf(code) < 0){
                    vm.academicDepartments[""].push({label : label, code: code});
                    placedInAll.push(code);
                }
            }
        });

        vm.academicDisciplines = StaticDataService.GetAcademicDisciplines();
        vm.course = "";

        // Search Data
        vm.selectedDepartment = "";
        vm.selectedDiscipline = "";
        vm.freeText = "";
        vm.courseList = [];

        vm.Search = Search;
        vm.AddCourse = AddCourse;
        vm.RemoveCourse = RemoveCourse;
        vm.Dashboard = Dashboard;

        function AddCourse(){

            // Common formatting errors we can clean up for the query
            var course = vm.course.toUpperCase();
            course = course.replace(/\s/g, "");

            // Check that we have a valid formatted UR course
            var pattern1 = /^[A-Z]{2}\d{3}$/; //PH202
            var pattern2 = /^[A-Z]{3}\d{3}$/; //CSC123
            var pattern3 = /^[A-Z]{2}\d{3}[A-Z]{1}$/; //PH202W
            var pattern4 = /^[A-Z]{3}\d{3}[A-Z]{1}$/; //CSC123W

            if(!(pattern1.test(course) || pattern2.test(course) || pattern3.test(course) || pattern4.test(course)))
                return;

            // Only add in the course if we haven't added it already.
            if(vm.courseList.indexOf(course)){
                vm.courseList.push(course);
                vm.course = "";
            }
        }

        function RemoveCourse(course){
            var index = vm.courseList.indexOf(course);

            if(index > -1){
                vm.courseList.splice(index,1);
            }
        }

        function Search(){
            SearchService.StoreQuery(vm.selectedDiscipline,
                                     vm.selectedDepartment,
                                     vm.freeText,
                                     vm.courseList);

            $location.path('/results');

        }

        function Dashboard(){
            $location.path('/');
        }
    }

})();