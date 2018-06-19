(() => {
    'use strict';

    angular
        .module('clusterEditor')
        .controller('ProcessController', ProcessController);

    ProcessController.$inject = ['$location', '$window', 'ClusterService', 'AuthenticationService', 'StaticDataService'];

    function ProcessController($location, $window, ClusterService, AuthenticationService, StaticDataService) {
        var vm = this;

        vm.Dashboard = Dashboard;
        vm.TermDisplay = TermDisplay;
        vm.Return = Return;
        vm.Review = Review;
        vm.Process = Process;

        vm.listDisplay = true;

        vm.uAchieveList = null;
        vm.sisList = null;
        vm.modelData = null;
        vm.processType = null;

        ClusterService.GetProcessList('uAchieve')
            .then((response) => {
                vm.uAchieveList = response.data.results;
            });

        ClusterService.GetProcessList('sis')
            .then((response) => {
                vm.sisList = response.data.results;
            });

        vm.academicDepartmentsMap = new Map();
        vm.academicDisciplinesMap = new Map();

        /**
         * Initialize lookup tables for the view.
         */
        vm.academicDisciplinesMap = StaticDataService.GetAcademicDisciplineMap();

        StaticDataService.GetAcademicDepartments((response) => {
            let departments = response.data.results;

            for (let i = 0; i < departments.length; i++) {
                if (!vm.academicDepartmentsMap.has(departments[i].code)) {
                    vm.academicDepartmentsMap.set(departments[i].code, departments[i].label);
                }
            }
        });


        /**
         * User Interface Handlers
         */
        function Dashboard() {
            $location.path('/');
        }

        function Review(clusterNumber, type) {
            vm.processType = type;
            ClusterService.SetClusterNumber(clusterNumber);
            ClusterService.GetPublish()
                .then((response) => {
                    ClusterService.SetModel(response.data.results);
                    vm.modelData = ClusterService.GetModel();
                    vm.listDisplay = false;
                    $window.scrollTo(0,0);
                });
        }

        function Return(){
            vm.listDisplay = !vm.listDisplay;
            $window.scrollTo(0,0);
        }

        function Process() {
            ClusterService.UpdateProcess(vm.modelData.recordID, vm.processType)
                .then((response) => {
                    return ClusterService.GetProcessList('uAchieve');
                })
                .then((response) => {
                    vm.uAchieveList = response.data.results;
                    return ClusterService.GetProcessList('sis')
                })
                .then((response) => {
                    vm.sisList = response.data.results;
                    vm.listDisplay = true;
                    $window.scrollTo(0,0);
                });
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