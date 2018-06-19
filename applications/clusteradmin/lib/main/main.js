(() => {
    'use strict';

    angular
        .module('clusterEditor')
        .controller('MainController', MainController);

    MainController.$inject = ['$q', '$route', '$location', 'AuthenticationService', 'ClusterService'];

    function MainController($q, $route, $location, AuthenticationService, ClusterService) {
        var vm = this;

        vm.Login = Login;
        vm.EditCluster = EditCluster;
        vm.CreateCluster = CreateCluster;
        vm.HistoryDisplay = HistoryDisplay;
        vm.Search = Search;
        vm.Create = Create;
        vm.Edit = Edit;
        vm.Publish = Publish;
        vm.Process = Process;
        vm.History = History;
        vm.Logout = Logout;

        vm.loggedIn = false;
        vm.adminType = null;

        let userData = AuthenticationService.GetUserData();
        if (userData) {
            vm.loggedIn = true;
            ClusterService.GetAdminType(userData.netID)
                .then((response) => {
                    vm.adminType = response.data.results.department;
                });
        }

        vm.loginFailure = false;
        vm.authFailure = false;

        vm.userName = "";
        vm.password = "";

        vm.editMessage = null;
        vm.editNumber = "";
        vm.editClusterDisplay = false;

        vm.createMessage = null;
        vm.createNumber = "";
        vm.createClusterDisplay = false;

        vm.historyMessage = null;
        vm.historyNumber = "";
        vm.viewHistoryDisplay = false;



        /**
         * + Handle logging in the user.
         */
        function Login() {
            vm.loginFailure = false;
            vm.authFailure = false;
            AuthenticationService.Reset();

            AuthenticationService.Login(vm.userName, vm.password)
                .then((response) => {
                    AuthenticationService.SetAuthorization(response.data.token);

                    let userData = AuthenticationService.GetUserData();
                    if (userData)
                        return ClusterService.GetAdminType(userData.netID);
                    else
                        return $q.when(userData);
                })
                .then((response) => {
                    vm.password = "";

                    if (response === null) {
                        vm.loginFailure = true;
                    } else {
                        if (response.data.ERR) {
                            vm.authFailure = true;
                        } else {
                            vm.adminType = response.data.results.department;
                            vm.loggedIn = true;
                        }
                    }
                });
        }

        /**
         * + Handle attempts to edit a cluster, check the publish and stage environments,
         *   if the cluster isn't there handle an error.
         */
        function EditCluster() {

            if (vm.editNumber === "" || vm.editNumber === null) {
                vm.editMessage = "Please enter a cluster number to edit.";
                return;
            }

            ClusterService.GetPublish(vm.editNumber)
                .then((response) => {
                    if (response.data.results === null)
                        return ClusterService.GetStage(vm.editNumber);
                    else
                        return $q.when(response);
                })
                .then((response) => {
                    if (response.data.results === null)
                        vm.editMessage = "A cluster with this number has not been created. Please create the cluster and then edit it.";
                    else {
                        ClusterService.SetClusterNumber(vm.editNumber);
                        $location.path('/edit');
                    }
                });
        }

        /**
         * + Handle attempts to create a cluster, check the publish and stage environments,
         *   if the cluster is there we can't create it, so handle an error.
         */
        function CreateCluster() {

            var pattern = /^[SNH]{1}\d{1}[A-Z]{3}[0-9]{3}$/; //N1CSC001            
            if (!(pattern.test(vm.createNumber))) {
                vm.createMessage = "Cluster numbers must be formatted starting with one of 'N','S','H' and formatted as follows: N1CSC001";
                return;
            }

            ClusterService.GetPublish(vm.createNumber)
                .then((response) => {
                    if (response.data.results === null)
                        return ClusterService.GetStage(vm.createNumber);
                    else
                        return $q.when(response);
                })
                .then((response) => {
                    if (response.data.results === null) {
                        ClusterService.SetClusterNumber(vm.createNumber);
                        return ClusterService.CreateCluster({ clusterNumber: vm.createNumber });
                    }
                    else
                        return $q.when(response);

                })
                .then((response) => {
                    if (!response.data.results.hasOwnProperty('recordID'))
                        $location.path('/edit');
                    else
                        vm.createMessage = "A cluster with this number already exists in the system, please select a different number.";
                });
        }

        /**
         * + Handle attempts to view the history of changes to a cluster, if there is not history handle an error.
         */
        function HistoryDisplay() {
            if (vm.historyNumber === "" || vm.historyNumber === null) {
                vm.historyMessage = "Please enter a cluster number to view the history of.";
                return;
            }

            ClusterService.GetHistory(vm.historyNumber)
                .then((response) => {
                    console.log(response);
                    if (response.data.results === null)
                        vm.historyMessage = "There does not appear to be a historical record for this cluster as of yet.";
                    else {
                        ClusterService.SetClusterNumber(vm.historyNumber);
                        $location.path('/history');
                    }
                });
        }

        /**
         * + Dashboard navigation handlers.
         */
        function Search() {
            $location.path('/search');
        }

        function Create() {
            vm.createMessage = null;
            vm.createClusterDisplay = true;
            vm.editClusterDisplay = false;
            vm.viewHistoryDisplay = false;
        }

        function Edit() {
            vm.editMessage = null;
            vm.editClusterDisplay = true;
            vm.createClusterDisplay = false;
            vm.viewHistoryDisplay = false;
        }

        function Publish() {
            $location.path('/publish');
        }

        function Process() {
            $location.path('/process');
        }

        function History() {
            vm.historyMessage = null;
            vm.viewHistoryDisplay = true;
            vm.editClusterDisplay = false;
            vm.createClusterDisplay = false;
        }

        function Logout() {
            AuthenticationService.Reset();
            $route.reload();
        }
    }
})();