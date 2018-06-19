(() => {
    'use strict';

    angular
        .module('clusterEditor')
        .controller('HistoryController', HistoryController);

        HistoryController.$inject = ['$location', 'AuthenticationService', 'ClusterService', 'StaticDataService'];

    function HistoryController($location, AuthenticationService, ClusterService, StaticDataService) {
        var vm = this;

        vm.Dashboard = Dashboard;
        vm.TermDisplay = TermDisplay;

        vm.historyList = [];
        
        vm.academicDepartmentsMap = new Map();
        vm.academicDisciplinesMap = new Map();

        /**
         * Initialize lookup tables for the view.
         */
        vm.academicDisciplinesMap = StaticDataService.GetAcademicDisciplineMap();

        StaticDataService.GetAcademicDepartments((response) => {
            let departments = response.data.results;

            for(let i = 0; i < departments.length; i++){
                if(!vm.academicDepartmentsMap.has(departments[i].code)){
                    vm.academicDepartmentsMap.set(departments[i].code, departments[i].label);
                }
            }
        });

        /**
         * Load up all clusters sitting in the archive environment.
         */
        ClusterService.GetHistory()
        .then((response) => {
            console.log(response);
            if(response.data.ERR) {
                AuthenticationService.Reset();
                $location.path('/');
            }
            else
                vm.historyList = response.data.results;
        });


        /**
         * Input Handlers
         */
        function Dashboard() {
            $location.path('/');
        }

        /**
         * Resolve a YYYYTT term display to human readable format.
         * 
         * @param string term - Year term to convert (ex. 201801)
         */
        function TermDisplay(term) {
            return StaticDataService.ParseTerm(term);
        }
    }
})();