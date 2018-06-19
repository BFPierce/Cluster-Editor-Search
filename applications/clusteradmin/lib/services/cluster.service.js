(() => {
    'use strict';

    angular
        .module('clusterEditor')
        .factory('ClusterService', ClusterService);

    ClusterService.$inject = ['$http','$window'];

    function ClusterService($http, $window){
        const host = $window.location.hostname;

        var adminType = null;
        var clusterNumber = null;
        var cluster = {};

        var service = {};
        service.SetClusterNumber = SetClusterNumber;
        service.GetAdminType = GetAdminType;
        service.GetModel = GetModel;
        service.SetModel = SetModel;
        service.GetStage = GetStage;
        service.SetStage = SetStage; 
        service.GetPublish = GetPublish;
        service.SetPublish = SetPublish;
        service.CreateCluster = CreateCluster;  
        service.UpdateCluster = UpdateCluster;
        service.CreateGroup = CreateGroup;
        service.UpdateGroup = UpdateGroup;
        service.DeleteGroup = DeleteGroup;
        service.CreateCourse = CreateCourse;
        service.UpdateCourse = UpdateCourse;     
        service.DeleteCourse = DeleteCourse;
        service.ListStage = ListStage;
        service.GetProcessList = GetProcessList;
        service.UpdateProcess = UpdateProcess;
        service.GetHistory = GetHistory;
        return service;

        function SetClusterNumber(number){
            this.clusterNumber = number;
        }

        function GetAdminType(user){
            return $http({
                method: 'GET',
                url: "https://" + host + "/registrar/api/clusters/admin/" + user
            });
        }

        function GetModel(){
            return this.cluster;
        }

        function SetModel(cluster){
            this.cluster = cluster;
        }


        /**
         * Below are various HTTP requests this service uses to interact with the API. 
         */
        function GetStage(number = null){
            return $http({ 
                method: 'GET',
                url: "https://" + host + "/registrar/api/clusters/stage/" + (number ? number : this.clusterNumber)
            });
        }

        function SetStage(number = null){
            return $http({
                method: 'POST',
                url: "https://" + host + "/registrar/api/clusters/stage/" + (number ? number : this.clusterNumber)
            });
        }

        function GetPublish(number = null){
            return $http({
                method: 'GET',
                url: "https://" + host + "/registrar/api/clusters/publish/" + (number ? number : this.clusterNumber)
            });
        }

        function SetPublish(number = null){
            return $http({
                method: 'POST',
                url: "https://" + host + "/registrar/api/clusters/publish/" + (number ? number : this.clusterNumber)
            });
        }

        function CreateCluster(request){
            return $http({
                method: 'POST',
                data: request,
                url: "https://" + host + "/registrar/api/clusters/cluster"
            });
        }

        function UpdateCluster(clusterID, request){
            return $http({
                method: 'PUT',
                data: request,
                url: "https://" + host + "/registrar/api/clusters/cluster/" + clusterID
            });
        }

        function CreateGroup(clusterID, request){
            return $http({
                method: 'POST',
                data: request,
                url: "https://" + host + "/registrar/api/clusters/group/" + clusterID
            });
        }

        function UpdateGroup(clusterID, groupID, request){
            return $http({
                method: 'PUT',
                data: request,
                url: "https://" + host + "/registrar/api/clusters/group/" + clusterID + "/" + groupID
            });
        }

        function DeleteGroup(clusterID, groupID){
            return $http({
                method: 'DELETE',
                url: "https://" + host + "/registrar/api/clusters/group/" + clusterID + "/" + groupID
            });
        }

        function CreateCourse(clusterID, request){
            return $http({
                method: 'POST',
                data: request,
                url: "https://" + host + "/registrar/api/clusters/course/" + clusterID
            });
        }

        function UpdateCourse(clusterID, courseID, request){
            return $http({
                method: 'PUT',
                data: request,
                url: "https://" + host + "/registrar/api/clusters/course/" + clusterID + "/" + courseID
            });
        } 

        function DeleteCourse(clusterID, courseID){
            return $http({
                method: 'DELETE',
                url: "https://" + host + "/registrar/api/clusters/course/" + clusterID + "/" + courseID
            });
        }

        function ListStage(){
            return $http({
                method: 'GET',
                url: "https://" + host + "/registrar/api/clusters/stage"
            });
        }

        function GetProcessList(type){
            return $http({
                method: 'GET',
                url: "https://" + host + "/registrar/api/clusters/process/" + type
            });
        }

        function UpdateProcess(clusterID, type){
            return $http({
                method: 'PUT',
                data: {},
                url: "https://" + host + "/registrar/api/clusters/process/" + type + "/" + clusterID
            });
        }

        function GetHistory(number = null){
            return $http({
                method: 'GET',
                url: "https://" + host + "/registrar/api/clusters/archive/" + (number ? number : this.clusterNumber)
            });
        }

    }
})();