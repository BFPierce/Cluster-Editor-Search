(() => {
    'use strict';

    angular
        .module('clusterEditor')
        .controller('PublishController', PublishController);

        PublishController.$inject = ['$location', '$route', 'AuthenticationService', 'ClusterService', 'StaticDataService'];

    function PublishController($location, $route, AuthenticationService, ClusterService, StaticDataService) {
        var vm = this;

        vm.Dashboard = Dashboard;
        vm.Review = Review;
        vm.Publish = Publish;
        vm.Edit = Edit;
        vm.TermDisplay = TermDisplay;

        vm.publishList = [];
        vm.listDisplay = true;
        vm.modelData = null;

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
         * Load up all clusters sitting in the stage environment.
         */
        ClusterService.ListStage()
        .then((response) => {
            if(response.data.ERR) {
                AuthenticationService.Reset();
                $location.path('/');
            }
            else
                vm.publishList = response.data.results;
        });


        /**
         * Input Handlers
         */
        function Dashboard() {
            $location.path('/');
        }

        function Review(clusterNumber) {

            ClusterService.SetClusterNumber(clusterNumber);
            ClusterService.GetStage()
            .then((response) => {
                 ClusterService.SetModel(response.data.results);
                 vm.modelData = ClusterService.GetModel();
                 vm.listDisplay = false;
                 $window.scrollTo(0,0);
            });
        }

        function Publish() {
            let result = confirm("Publishing this cluster will make it viewable to students, are you sure you want to do this?");
            
            if(result){
                ClusterService.SetPublish()
                .then((response) => {
                    $route.reload();
                });      
            }         
        }

        function Edit() {
            $location.path('/edit');
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