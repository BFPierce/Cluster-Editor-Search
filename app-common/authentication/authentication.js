/**
 * Standard authentication and storage of a JWT for angularJS applications utilizing the API
 * 
 * Jeffery A. White - 3/16/2018
 */

(() => {
    'use strict';

    angular
        .module('regrAuth',[])
        .factory('AuthenticationService', AuthenticationService);


    AuthenticationService.$inject = ['$http','$window'];
    function AuthenticationService($http, $window){
        var token = null;

        var service = {};
        service.Login = Login;
        service.SetAuthorization = SetAuthorization;
        service.GetUserData = GetUserData;
        service.Reset = Reset;        
        return service;

        /**
         * + Send a request to the authenticate endpoint and return a promise.
         * 
         * @param string netid 
         * @param string password 
         */
        function Login(netid, password){
            const host = $window.location.hostname;

            return $http({
                method: 'POST',
                url: "https://" + host + "/registrar/api/authenticate",
                data: { 'user': netid, 'pass': password }});
        }

        /**
         * + Parse the stored token if there is one, return the payload.
         */
        function GetUserData(){
            let userData = null;

            if(token != null) {
                let tokenArray = token.split('.');
                let decoded = JSON.parse(Base64Decode(tokenArray[1]));
                userData = decoded;
            }

            return userData;
        }

        /**
         * + Store an authorization token (JWT)
         * 
         * @param string jwtObj 
         */
        function SetAuthorization(jwtObj) {
            token = jwtObj;
            $http.defaults.headers.common.Authorization = 'Bearer ' + token;
        }

        /**
         * + Reset the authorization for this user.
         */
        function Reset() {
            $http.defaults.headers.common.Authorization = null; 
            token = null;
        }

        /**
         * + Helper function to decoade a base64 string.
         * 
         * @param string input 
         */
        function Base64Decode(input){
            return atob(input.replace(/_/g, '/').replace(/-/g, '+'));
        }
    }

})();