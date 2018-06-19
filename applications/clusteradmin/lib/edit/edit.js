(() => {
    'use strict';

    angular
        .module('clusterEditor')
        .controller('EditController', EditController);

    EditController.$inject = ['$q', '$location', 'ClusterService', 'AuthenticationService', 'StaticDataService'];

    function EditController($q, $location, ClusterService, AuthenticationService, StaticDataService) {
        var vm = this;

        vm.Dashboard = Dashboard;
        vm.UpdateCluster = UpdateCluster;
        vm.UpdateGroup = UpdateGroup;
        vm.UpdateCourse = UpdateCourse;
        vm.UpdateCourseNumber = UpdateCourseNumber;
        vm.CourseUpdateHelper = CourseUpdateHelper;
        vm.CreateGroup = CreateGroup;
        vm.CreateCourse = CreateCourse;
        vm.DeleteGroup = DeleteGroup;
        vm.DeleteCourse = DeleteCourse;
        vm.ShiftGroup = ShiftGroup;
        vm.ShiftCourse = ShiftCourse;
        vm.ResponseHandler = ResponseHandler;
        vm.ShiftGroups = ShiftGroups;
        vm.ShiftCourses = ShiftCourses;

        vm.userData = AuthenticationService.GetUserData();
        vm.modelData = null;
        vm.departments = null;

        vm.clusterServiceSetup = false;
        vm.dataServiceSetup = false;
        vm.transferInProgress = false;

        vm.academicDepartments = { "": [], "HUM": [], "SSC": [], "NSE": [] };
        vm.academicDisciplines = StaticDataService.GetAcademicDisciplinesEditor();
        vm.terms = StaticDataService.GetTermOptions(2000, 2024);

        /**
         * + Setup the cluster service with staged cluster data, if there isn't any
         * we have to create it prior to setting up the model.
         */
        ClusterService.GetStage()
            .then((response) => {
                if (response.data.results === null)
                    return ClusterService.SetStage();
                else
                    return $q.when(response);
            })
            .then((response) => {
                if (response.data.results)
                    return ClusterService.GetStage();
                else
                    return $q.when(response);
            })
            .then((response) => {
                vm.ResponseHandler(response);
                ClusterService.SetModel(response.data.results);
                vm.modelData = ClusterService.GetModel();
                vm.clusterServiceSetup = true;
            });

        /**
         * + Setup view model objects with drop down options from the static
         *   data service.
         */
        StaticDataService.GetAcademicDepartments((response) => {
            let placedInAll = [];
            let departments = response.data.results;

            for (let i = 0; i < departments.length; i++) {
                const label = departments[i].label;
                const code = departments[i].code;

                vm.academicDepartments[departments[i].division].push({ label: label, code: code });

                /**
                 * Some departments are in multiple divisions, so we'll keep track of
                 *  those already placed into the initial list to avoid duplicates
                */
                if (placedInAll.indexOf(code) < 0) {
                    vm.academicDepartments[""].push({ label: label, code: code });
                    placedInAll.push(code);
                }
            }

            vm.dataServiceSetup = true;
        });

        /**
         * + User Interface action handlers.
         */
        function Dashboard() {
            $location.path('/');
        }

        function UpdateCluster() {
            vm.transferInProgress = true;

            let updates = {};
            updates.expirationTerm = vm.modelData.expirationTerm;
            updates.title = vm.modelData.title;
            updates.academicDiscipline = vm.modelData.academicDiscipline;
            updates.academicDepartment = vm.modelData.academicDepartment;
            updates.description = vm.modelData.description;

            ClusterService.UpdateCluster(vm.modelData.recordID, updates)
                .then((response) => {
                    vm.transferInProgress = false;
                    vm.ResponseHandler(response);
                });
        }

        function UpdateGroup(groupID) {
            vm.transferInProgress = true;

            let group = null;
            for (let grp of vm.modelData.groups) {
                if (grp.recordID === groupID) {
                    group = grp;
                    break;
                }
            }

            let updates = {};
            if (group)
                updates.groupDescription = group.groupDescription;

            ClusterService.UpdateGroup(vm.modelData.recordID, groupID, updates)
                .then((response) => {
                    vm.transferInProgress = false;
                    vm.ResponseHandler(response)
                });
        }

        function UpdateCourse(groupID, courseID) {
            vm.transferInProgress = true;

            let updates = vm.CourseUpdateHelper(groupID, courseID);

            ClusterService.UpdateCourse(vm.modelData.recordID, courseID, updates)
                .then((response) => {
                    vm.transferInProgress = false;
                    vm.ResponseHandler(response)
                });
        }

        function UpdateCourseNumber(groupID, courseID) {
            vm.transferInProgress = true;

            let updates = vm.CourseUpdateHelper(groupID, courseID);

            StaticDataService.GetTitle(updates.courseNumber)
                .then((response) => {
                    if(response.data.ERR)
                        return $q.when(response)
                    else {
                        let title = response.data.title;
                        updates.courseTitle = title;
    
                        return ClusterService.UpdateCourse(vm.modelData.recordID, courseID, updates);
                    }
                })
                .then((response) => {
                    return ClusterService.GetStage();
                })
                .then((response) => {
                    vm.ResponseHandler(response)
                    ClusterService.SetModel(response.data.results);
                    vm.modelData = ClusterService.GetModel();
                    vm.transferInProgress = false;                    
                });
        }

        function CourseUpdateHelper(groupID, courseID) {
            let course = null;
            for (let grp of vm.modelData.groups) {
                if (grp.recordID === groupID) {
                    for (let crs of grp.courses) {
                        if (crs.recordID === courseID)
                            course = crs;
                    }
                }
            }

            let updates = {};
            if (course) {
                updates.courseNumber = course.courseNumber;
                updates.courseTitle = course.courseTitle;
                updates.validStart = course.validStart;
                updates.validEnd = course.validEnd;
            }

            let temp = updates.courseNumber.toUpperCase();
            temp = temp.replace(/\s/g, "");
            updates.courseNumber = temp;

            return updates;
        }

        function CreateGroup(clusterID) {
            vm.transferInProgress = true;

            let lastGroupOrder = 0;
            for (let grp of vm.modelData.groups) {
                if (parseInt(grp.groupOrder) >= lastGroupOrder) {
                    lastGroupOrder = parseInt(grp.groupOrder);
                }
            }

            let updates = {};
            updates.clusterID = clusterID;
            updates.groupOrder = lastGroupOrder + 1;

            ClusterService.CreateGroup(clusterID, updates)
                .then((response) => {
                    return ClusterService.GetStage();
                })
                .then((response) => {
                    vm.ResponseHandler(response);
                    ClusterService.SetModel(response.data.results);
                    vm.modelData = ClusterService.GetModel();
                    vm.transferInProgress = false;
                });
        }

        function CreateCourse(groupID) {
            vm.transferInProgress = true;

            let lastCourseOrder = 0;
            for (let grp of vm.modelData.groups) {
                if (grp.recordID === groupID) {
                    for (let crs of grp.courses) {
                        if (parseInt(crs.courseOrder) > lastCourseOrder)
                            lastCourseOrder = parseInt(crs.courseOrder);
                    }
                }
            }

            let updates = {};
            updates.groupID = groupID;
            updates.courseOrder = lastCourseOrder + 1;

            ClusterService.CreateCourse(vm.modelData.recordID, updates)
                .then((response) => {
                    return ClusterService.GetStage();
                })
                .then((response) => {
                    vm.ResponseHandler(response);
                    ClusterService.SetModel(response.data.results);
                    vm.modelData = ClusterService.GetModel();
                    vm.transferInProgress = false;
                });
        }

        function DeleteGroup(groupID) {
            let result = confirm("Are you sure you want to delete this group?");

            if (result) {
                vm.transferInProgress = true;
                ClusterService.DeleteGroup(vm.modelData.recordID, groupID)
                    .then((response) => {
                        return ClusterService.GetStage();
                    })
                    .then((response) => {
                        vm.ResponseHandler(response);
                        ClusterService.SetModel(response.data.results);
                        vm.modelData = ClusterService.GetModel();
                        vm.transferInProgress = false;
                    });
            }
        }

        function DeleteCourse(courseID) {
            let result = confirm("Are you sure you want to delete this course?");

            if (result) {
                vm.transferInProgress = true;
                ClusterService.DeleteCourse(vm.modelData.recordID, courseID)
                    .then((response) => {
                        return ClusterService.GetStage();
                    })
                    .then((response) => {
                        vm.ResponseHandler(response);
                        ClusterService.SetModel(response.data.results);
                        vm.modelData = ClusterService.GetModel();
                        vm.transferInProgress = false;
                    });
            }
        }

        function ShiftGroup(id, direction) {
            vm.transferInProgress = true;

            let previousGroup = null;
            let curGroup = null;

            if (direction === "UP") {
                for (let grp of vm.modelData.groups) {
                    previousGroup = curGroup;
                    curGroup = grp;
                    if (curGroup.recordID === id)
                        break;
                }

                if (previousGroup === null) {
                    vm.transferInProgress = false;
                    return;
                }

            } else {
                for (let grp of vm.modelData.groups) {
                    previousGroup = curGroup;
                    curGroup = grp;
                    if (previousGroup && previousGroup.recordID === id)
                        break;
                }

                if (curGroup.recordID === id) {
                    vm.transferInProgress = false;
                    return;
                }

            }

            previousGroup.groupOrder = parseInt(previousGroup.groupOrder) + 1;
            curGroup.groupOrder = parseInt(curGroup.groupOrder) - 1;
            vm.ShiftGroups(previousGroup, curGroup);
        }

        function ShiftCourse(id, groupID, direction) {
            vm.transferInProgress = true;

            let previousCourse = null;
            let curCourse = null;

            if (direction === "UP") {
                for (let grp of vm.modelData.groups) {
                    if (grp.recordID === groupID) {
                        for (let crs of grp.courses) {
                            previousCourse = curCourse;
                            curCourse = crs;
                            if (curCourse.recordID === id)
                                break;
                        }
                    }
                }

                if (previousCourse === null) {
                    vm.transferInProgress = false;
                    return;
                }

            } else {
                for (let grp of vm.modelData.groups) {
                    if (grp.recordID === groupID) {
                        for (let crs of grp.courses) {
                            previousCourse = curCourse;
                            curCourse = crs;
                            if (previousCourse && previousCourse.recordID === id)
                                break;
                        }
                    }
                }

                if (curCourse.recordID === id) {
                    vm.transferInProgress = false;
                    return;
                }

            }

            previousCourse.courseOrder = parseInt(previousCourse.courseOrder) + 1;
            curCourse.courseOrder = parseInt(curCourse.courseOrder) - 1;
            vm.ShiftCourses(previousCourse, curCourse);
        }

        function ResponseHandler(response) {
            if (response.data.ERR) {
                AuthenticationService.Reset();
                $location.path('/');
            }
        }

        function ShiftGroups(prev, cur) {
            let previous = { groupOrder: prev.groupOrder };
            let current = { groupOrder: cur.groupOrder };

            ClusterService.UpdateGroup(vm.modelData.recordID, prev.recordID, previous)
                .then((response) => {
                    return ClusterService.UpdateGroup(vm.modelData.recordID, cur.recordID, current);
                })
                .then((response) => {
                    return ClusterService.GetStage();
                })
                .then((response) => {
                    vm.ResponseHandler(response);
                    ClusterService.SetModel(response.data.results);
                    vm.modelData = ClusterService.GetModel();
                    vm.transferInProgress = false;
                });
        }

        function ShiftCourses(prev, cur) {
            ClusterService.UpdateCourse(vm.modelData.recordID, prev.recordID, prev)
                .then((response) => {
                    return ClusterService.UpdateCourse(vm.modelData.recordID, cur.recordID, cur);
                })
                .then((response) => {
                    return ClusterService.GetStage();
                })
                .then((response) => {
                    vm.ResponseHandler(response);
                    ClusterService.SetModel(response.data.results);
                    vm.modelData = ClusterService.GetModel();
                    vm.transferInProgress = false;
                });
        }
    }
})();