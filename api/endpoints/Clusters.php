<?php
//**********************************************************************************************************
//*
//*   	Class: Clusters - Storage class for all endpoints associated with this application.
//*
//*		Author: Jeffery A. White
//*
//**********************************************************************************************************
require_once($_SERVER["DOCUMENT_ROOT"] . "/api/lib/database/MySQL.php");

class Clusters extends MySQLDriver{

    public function __construct(){
        parent::__construct();
	}

	//=====================================================================================================
	// GET METHODS
	//=====================================================================================================

	/**
	 * + Get the admin type for the logged in user
	 * @param string $netID - netID we're attemtping to validate through the administrator table.
	 * @return array returned database record.
	 */
	public function GetAdminType($netID){
		$results = $this->Read('[ADMIN TABLE]', array('netID' => $netID));
		return array("results" => $results[0]);
	}

    /**
	 * + Get all records from the CSEDepartments Table.
	 * @return array returns an array of database records.
	 */
    public function ListDepartments(){
		$query = "SELECT code, label, division, sortOrder FROM [DEPARTMENTS TABLE] ORDER BY sortOrder ASC";
		return array("results" => $this->SelectQueryHelper($query));
	}
	
	/**
	 * + Get Crosslisted Courses for unique course or all courses.	
	 * @return array Returns all entries in the crosslistings table.
	 */	
	public function ListCrossListed(){
		return array("results" => $this->Read('[CROSSLISTINGS TABLE]'));
	}

	/**
	 * + Get all records from the CSEGroups Table.
	 * @return array returns an array of database records.
	 */
	public function ListGroups(){
		$query = "SELECT groupTitle FROM [PUBLISH GROUPS TABLE] ORDER BY groupTitle ASC";
		return array("results" => $this->SelectQueryHelper());
	}

	/**
	 *  + Get a cluster from publish by it's number if it exists.
	 * @param string $number - Unique cluster number we're looking for.
	 * @return array Returns an array with the cluster object if the cluster exists, 
	 * 			     otherwise an array with a null object.
	 */
	public function GetPublish($number){
		$query = "SELECT recordID FROM [PUBLISH CLUSTERS TABLE] WHERE clusterNumber = :clusterNumber";
		$bindings = array(':clusterNumber' => $number);

		if($rows = $this->SelectQueryHelper($query, $bindings)){
			$recordID = $rows[0]['recordID'];
			return array("results" => $this->LoadClusterObject("Publish", $recordID));
		} else 
			return array("results" => null);		
	}

	/**
	 *  + Get a cluster from the stage by it's number if it exists.
	 * @param string $number - Unique cluster number we're looking for, or null for a full listing.
	 * @return array Returns an array with the cluster object if the cluster exists, 
	 * 			     otherwise an array with a null object.
	 */
	public function ListStage($number = null){
		if($number == null){
			$query = "SELECT recordID, clusterNumber, title, editedUser, editedDate FROM [STAGE CLUSTERS TABLE]";

			if($rows = $this->SelectQueryHelper($query))
				return array("results" => $rows);
			else 
				return array("results" => null);
		} else {
			$query = "SELECT recordID FROM [STAGE CLUSTERS TABLE] WHERE clusterNumber = :clusterNumber";
			$bindings = array(':clusterNumber' => $number);
	
			if($rows = $this->SelectQueryHelper($query, $bindings)){
				$recordID = $rows[0]['recordID'];
				return array("results" => $this->LoadClusterObject("Stage", $recordID));
			} else 
				return array("results" => null);			
		}
	}

	/**
	 * + Return all cluster objects from the archive for this cluster number.
	 * @param string $clusterNumber - Unique cluster number for this cluster.
	 */
	public function ListArchive($clusterNumber){
        $query = "SELECT recordID FROM [ARCHIVE CLUSTERS TABLE] WHERE clusterNumber = :clusterNumber";		
        $bindings = array(':clusterNumber' => $clusterNumber);

        if($rows = $this->SelectQueryHelper($query, $bindings)) 
			return array("results" => $this->LoadClusterCollection("Archive", $this->CreateRecordSet($rows)));
		else
			return array("results" => null);		
	}

	/**
	 * + Return all clusters that are still in process.
	 * @param string $processType (either uAchieve or sis)
	 * @return array collection of clusters still in process.
	 */
	public function ListProcess($processType){
		if($processType == "uAchieve")
			$query = "SELECT recordID, clusterNumber, title, publishedUser, publishedDate FROM [PUBLISH CLUSTERS TABLE] WHERE uAchieveChangeFlag = 'N'";
		else if($processType == "sis")
			$query = "SELECT recordID, clusterNumber, title, publishedUser, publishedDate FROM [PUBLISH CLUSTERS TABLE] WHERE sisChangeFlag = 'N'";
		else
			return array("results" => null);

		if($rows = $this->SelectQueryHelper($query))
			return array("results" => $rows);
		else 
			return array("results" => null);		
	}
	
	//=====================================================================================================
	// POST METHODS
	//=====================================================================================================

	/**
	 * + Query the pubished clusters and return a collection of cluster objects matching the criteria.
	 * @param array $request - search query parameters.
	 */
    public function SearchClusters($request){

		$freeText = $request['freeText'];
		$academicDiscipline = $request['academicDiscipline'];
		$academicDepartment = $request['academicDepartment'];
		$courseList = $request['courseList'];

        $foundSets = array();

        // An empty query should return ALL clusters from the search engine.
        if(empty($courseList) && empty($freeText) && empty($academicDiscipline) && empty($academicDepartment)){
            $rows = $this->Read('[PUBLISH CLUSTERS TABLE]', array());
			$foundSets[] = $this->CreateRecordSet($rows);
		} else {			
            // Otherwise we consider each element in the query separately, find all the ID's for each component,
            // then intersect those sets at the end to come up with the clusters that match the query.
            if(!empty($academicDiscipline)){
                $query = "SELECT DISTINCT recordID FROM [PUBLISH CLUSTERS TABLE] WHERE academicDiscipline = :academicDiscipline";
                $bindings = array(':academicDiscipline' => $academicDiscipline);

				if($rows = $this->SelectQueryHelper($query, $bindings))
					$foundSets[] = $this->CreateRecordSet($rows); 
            }

            if(!empty($academicDepartment)){
                $query = "SELECT DISTINCT recordID FROM [PUBLISH CLUSTERS TABLE] WHERE academicDepartment = :academicDepartment";
                $bindings = array(':academicDepartment' => $academicDepartment);

				if($rows = $this->SelectQueryHelper($query, $bindings))
					$foundSets[] = $this->CreateRecordSet($rows); 
            }

            if(!empty($freeText)){
                $setOne = array();
                $setTwo = array();

                $text = "%" . trim($freeText) . "%";

                $query = "SELECT DISTINCT recordID FROM [PUBLISH CLUSTERS TABLE] 
                            WHERE clusterNumber LIKE :clusterNumber OR
                                title LIKE :title OR
                                description LIKE :description";

                $bindings = array(':clusterNumber' => $text,
                                ':title' => $text,
                                ':description' => $text);

				if($rows = $this->SelectQueryHelper($query, $bindings))
					$setOne = $this->CreateRecordSet($rows);

                $query = "SELECT DISTINCT A.recordID FROM [PUBLISH CLUSTERS TABLE] A
                                LEFT JOIN [PUBLISH GROUPS TABLE] B ON A.recordID = B.clusterID
                                LEFT JOIN [PUBLISH COURSES TABLE] C ON B.recordID = C.groupID
                            WHERE C.courseNumber LIKE :courseNumber OR C.courseTitle LIKE :courseTitle";

                $bindings = array(':courseNumber' => $text,
                                ':courseTitle' => $text);

				if($rows = $this->SelectQueryHelper($query, $bindings))
					$setTwo = $this->CreateRecordSet($rows);

                $union = array_unique(array_merge($setOne, $setTwo));
                $set = array();
                foreach($union as $key => $value)
                    $set[] = $value;

                $foundSets[] = $set;
            }

            if(!empty($courseList)){
                $courses = explode(',',$courseList);

                foreach($courses as $course){
                    $query = "SELECT DISTINCT A.recordID FROM [PUBLISH CLUSTERS TABLE] A
                                LEFT JOIN [PUBLISH GROUPS TABLE] B ON A.recordID = B.clusterID
                                LEFT JOIN [PUBLISH COURSES TABLE] C ON B.recordID = C.groupID
                            WHERE C.courseNumber = :courseNumber";

                    $bindings = array(':courseNumber' => $course);

					if($rows = $this->SelectQueryHelper($query, $bindings))
						$foundSets[] = $this->CreateRecordSet($rows);
                }
            }   
        }


        $intersection = NULL;
        foreach($foundSets as $found){
            if($intersection == NULL)
                $intersection = $found;
            else
                $intersection = array_intersect($intersection, $found);
		}
		
		$queryRecord = array("freeText" => $freeText,
							 "academicDiscipline" => $academicDiscipline,
							 "academicDepartment" => $academicDepartment,
							 "courseList" => json_encode($courseList),
							 "queryDate" => date('Y-m-d H:i:s', time()),
							 "queryHits" => count($intersection));
		$this->Create('CSEQuery', $queryRecord);

        if(!empty($intersection))
            return array("results" => $this->LoadClusterCollection("Publish", $intersection));
        
        return array("results" => null);
	}
	
	/**
	 * + Create a new cluster.
	 * @param string $user - user ID of the admin.
	 * @param array $request - initial data for the cluster.
	 */
	public function CreateCluster($user, $request){
		$request['editedUser'] = $user;
		$request['editedDate'] = date('Y-m-d H:i:s', time());
		return array("results" => $this->Create('[STAGE CLUSTERS TABLE]', $request));
	}

	/**
	 * + Create a new group.
	 * @param string $clusterID - ID of the cluster this group belongs to.
	 * @param string $user - user ID of the admin.
	 * @param array $request - initial data for the group.
	 */
	public function CreateGroup($clusterID, $user, $request){
		$clusterUpdate['editedUser'] = $user;
		$clusterUpdate['editedDate'] = date('Y-m-d H:i:s', time());
		$clusterResult = $this->Update('[STAGE CLUSTERS TABLE]', $cluserID, $clusterUpdate);
		$groupResult = $this->Create('[STAGE GROUPS TABLE]', $request);
		return array("results" => $clusterResult && $groupResult);
	}

	/**
	 * + Create a new course.
	 * @param string $clusterID - ID of the cluster this course belongs to.
	 * @param string $user - user ID of the admin.
	 * @param array $request - initial data for the course.
	 */
	public function CreateCourse($clusterID, $user, $request){
		$clusterUpdate['editedUser'] = $user;
		$clusterUpdate['editedDate'] = date('Y-m-d H:i:s', time());
		$clusterResult = $this->Update('[STAGE CLUSTERS TABLE]', $clusterID, $clusterUpdate);
		$courseResult = $this->Create('[STAGE COURSES TABLE]', $request);
		return array("results" => $clusterResult && $courseResult);
	}

	
	/**
	 * + Publish an updated cluster, moves published to archive, deletes published, moves stage to publish and deletes stage.
	 * @param string $clusterNumber - Cluster number that will be published.
	 * @param string $userID - user ID of the admin publishing the cluster.
	 */
    public function PublishCluster($clusterNumber, $userID){
		// Does this cluster exist in the stage environment?
		$test = $this->Read('[STAGE CLUSTERS TABLE]', array('clusterNumber' => $clusterNumber));
		if(empty($test))
			return array("results" => null);

		// Copy the publish to the archive and then delete from the publish
		$clusters = $this->Read('[PUBLISH CLUSTERS TABLE]', array('clusterNumber' => $clusterNumber));
		$cluster = $clusters[0];

		$clusterObject = array('clusterNumber' => $cluster['clusterNumber'],
							   'expirationTerm' => $cluster['expirationTerm'],
							   'title' => $cluster['title'],
							   'description' => $cluster['description'],
							   'academicDiscipline' => $cluster['academicDiscipline'],
							   'academicDepartment' => $cluster['academicDepartment'],
							   'archivedUser' => $userID,
							   'archivedDate' => date('Y-m-d H:i:s'),
							   'uAchieveChangeUser' => $cluster['uAchieveChangeUser'],
							   'uAchieveChangeDate' => $cluster['uAchieveChangeDate'],
							   'sisChangeUser' => $cluster['sisChangeUser'],
							   'sisChangeDate' => $cluster['sisChangeDate']);

		$clusterID = $this->Create('[ARCHIVE CLUSTERS TABLE]', $clusterObject);

		$groups = $this->Read('[PUBLISH GROUPS TABLE]', array('clusterID' => $cluster['recordID']));
		foreach($groups as $group){
			$groupObject = array();
			foreach($group as $key => $value){
				if($key != 'recordID')
					$groupObject[$key] = $value;
			}
			$groupObject['clusterID'] = $clusterID;
									
			$groupID = $this->Create('[ARCHIVE GROUPS TABLE]', $groupObject);

			$courses = $this->Read('[PUBLISH COURSES TABLE]', array('groupID' => $group['recordID']));
			foreach($courses as $course){
				$courseObject = array();
				foreach($course as $key => $value){
					if($key != 'recordID')
						$courseObject[$key] = $value;
				}
				$courseObject['groupID'] = $groupID;
				
				$this->Create('[ARCHIVE COURSES TABLE]', $courseObject);
			}
		}
		
		$deletePub = $this->DeleteClusterByTable("Publish", $clusterNumber);

		// Copy the stage to the publish and then delete the stage
		$clusters = $this->Read('[STAGE CLUSTERS TABLE]', array('clusterNumber' => $clusterNumber));
		$cluster = $clusters[0];

		$clusterObject = array('clusterNumber' => $cluster['clusterNumber'],
							   'expirationTerm' => $cluster['expirationTerm'],
							   'title' => $cluster['title'],
							   'description' => $cluster['description'],
							   'academicDiscipline' => $cluster['academicDiscipline'],
							   'academicDepartment' => $cluster['academicDepartment'],
							   'publishedUser' => $userID,
							   'publishedDate' => date('Y-m-d H:i:s'));

		$clusterID = $this->Create('[PUBLISH CLUSTERS TABLE]', $clusterObject);

		$groups = $this->Read('[STAGE GROUPS TABLE]', array('clusterID' => $cluster['recordID']));
		foreach($groups as $group){
			$groupObject = array();
			foreach($group as $key => $value){
				if($key != 'recordID')
					$groupObject[$key] = $value;
			}
			$groupObject['clusterID'] = $clusterID;
									
			$groupID = $this->Create('[PUBLISH GROUPS TABLE]', $groupObject);

			$courses = $this->Read('[STAGE COURSES TABLE]', array('groupID' => $group['recordID']));
			foreach($courses as $course){
				$courseObject = array();
				foreach($course as $key => $value){
					if($key != 'recordID')
						$courseObject[$key] = $value;
				}
				$courseObject['groupID'] = $groupID;
				
				$this->Create('[PUBLISH COURSES TABLE]', $courseObject);
			}
		}
		
		$deleteStg = $this->DeleteClusterByTable("Stage", $clusterNumber);
		
		return array("results" => $deletePub && $deleteStg);
    }

	/**
	 * + Move a cluster from published to staged, and returns the staged cluster, checks to see if the clusterNumber is already staged.
	 * @param string $clusterNumber - Cluster to move to staged
	 * @param string $userID - User ID of the Admin
	 */
    public function StageCluster($clusterNumber, $userID){
		$records = $this->Read('[STAGE CLUSTERS TABLE]', array('clusterNumber' => $clusterNumber));

		if(!empty($records)){
			return array("results" => $this->LoadClusterObject("Stage", $records[0]['recordID']));
		}
		else {
			$clusters = $this->Read('[PUBLISH CLUSTERS TABLE]', array('clusterNumber' => $clusterNumber));
			$cluster = $clusters[0];

			$clusterObject = array('clusterNumber' => $cluster['clusterNumber'],
								   'expirationTerm' => $cluster['expirationTerm'],
								   'title' => $cluster['title'],
								   'description' => $cluster['description'],
								   'academicDiscipline' => $cluster['academicDiscipline'],
								   'academicDepartment' => $cluster['academicDepartment'],
								   'editedUser' => $userID,
								   'editedDate' => date('Y-m-d H:i:s'));

			$clusterID = $this->Create('[STAGE CLUSTERS TABLE]', $clusterObject);

			$groups = $this->Read('[PUBLISH GROUPS TABLE]', array('clusterID' => $cluster['recordID']));
			foreach($groups as $group){
				$groupObject = array('clusterID' => $clusterID,
									 'groupDescription' => $group['groupDescription'],
									 'groupOrder' => $group['groupOrder']);
									 
				$groupID = $this->Create('[STAGE GROUPS TABLE]', $groupObject);

				$courses = $this->Read('[PUBLISH COURSES TABLE]', array('groupID' => $group['recordID']));
				foreach($courses as $course){
					$courseObject = array('groupID' => $groupID,
										  'courseNumber' => $course['courseNumber'],
										  'courseTitle' => $course['courseTitle'],
										  'validStart' => $course['validStart'],
										  'validEnd' => $course['validEnd'],
										  'courseOrder' => $course['courseOrder']);
					
					$this->Create('[STAGE COURSES TABLE]', $courseObject);
				}
			}

			return array("results" => $this->LoadClusterObject("Stage", $clusterID));
		}
	}


	//=====================================================================================================
	// PUT METHODS
	//=====================================================================================================

	/**
	 * + Update the process data for a cluster
	 * @param string $clusterID
	 * @param string $user
	 */
	public function UpdateProcess($type, $clusterID, $user){
		$updates = array();

		if($type == "uAchieve"){
			$updates['uAchieveChangeFlag'] = 'Y';
			$updates['uAchieveChangeUser'] = $user;
			$updates['uAchieveChangeDate'] = date('Y-m-d H:i:s', time());
		}
		else if($type == "sis"){
			$updates['sisChangeFlag'] = 'Y';
			$updates['sisChangeUser'] = $user;
			$updates['sisChangeDate'] = date('Y-m-d H:i:s', time());
		}
		else
			return array("results" => null);

		return array("results" => $this->Update('[PUBLISH CLUSTERS TABLE]', $clusterID, $updates));
	}

	/**
	 * + Update the cluster in the stage table with the submitted information.
	 * @param string $clusterID - primary key for the cluster database table.
	 * @param string $user - userID for the administrator.
	 * @param array $request - key:value pairs for updates to the record.
	 */
	public function UpdateCluster($clusterID, $user, $request){
		$request['editedUser'] = $user;
		$request['editedDate'] = date('Y-m-d H:i:s', time());

		return array("results" => $this->Update('[STAGE CLUSTERS TABLE]', $clusterID, $request));
	}

	/**
	 * + Update the group in the stage table with the submitted information.
	 * @param string $clusterID - primary key for the cluster database table.
	 * @param string $groupID - primary key for the group being updated.
	 * @param string $user - userID for the administrator.
	 * @param array $request - key:value pairs for updates to the record.
	 */
	public function UpdateGroup($clusterID, $groupID, $user, $request){
		$clusterUpdates['editedUser'] = $user;
		$clusterUpdates['editedDate'] = date('Y-m-d H:i:s', time());
		$clusterResult = $this->Update('[STAGE CLUSTERS TABLE]', $clusterID, $clusterUpdates);
		$groupResult = $this->Update('[STAGE GROUPS TABLE]', $groupID, $request);

		return array("results" => $clusterResult && $groupResult);
	}

	/**
	 * + Update the group in the stage table with the submitted information.
	 * @param string $clusterID - primary key for the cluster database table.
	 * @param string $courseID - primary key for the group being updated.
	 * @param string $user - userID for the administrator.
	 * @param array $request - key:value pairs for updates to the record.
	 */
	public function UpdateCourse($clusterID, $courseID, $user, $request){
		$clusterUpdates['editedUser'] = $user;
		$clusterUpdates['editedDate'] = date('Y-m-d H:i:s', time());
		$clusterResult = $this->Update('[STAGE CLUSTERS TABLE]', $clusterID, $clusterUpdates);
		$courseResult = $this->Update('[STAGE COURSES TABLE]', $courseID, $request);

		return array("results" => $clusterResult && $courseResult);
	}

	//=====================================================================================================
	// DELETE METHODS
	//=====================================================================================================
	
	/**
	 * + Delete the group with the given ID from the stage tables.
	 * @param string $clusterID - primary key for the cluster being modified.
	 * @param string $groupID - primary key for the group database table.
	 */
    public function DeleteGroup($clusterID, $groupID){
		$clusterUpdates['editedUser'] = $user;
		$clusterUpdates['editedDate'] = date('Y-m-d H:i:s', time());
		$clusterResult = $this->Update('[STAGE CLUSTERS TABLE]', $clusterID, $clusterUpdates);

		$curGroups = $this->Read('[STAGE GROUPS TABLE]', $groupID);
		$curGroupOrder = (int)$curGroups[0]['groupOrder'];

		$courses = $this->Read('[STAGE COURSES TABLE]', array('groupID' => $groupID));
		$courseResult = true;
		foreach($courses as $course)
			$courseResult &= $this->Delete('[STAGE COURSES TABLE]', $course['recordID']);
		$groupResult = $this->Delete('[STAGE GROUPS TABLE]', $groupID);

		$groups = $this->Read('[STAGE GROUPS TABLE]', array('clusterID' => $clusterID));
		foreach($groups as $group){
			if((int)$group['groupOrder'] > $curGroupOrder){
				$update = array('groupOrder' => (int)$group['groupOrder'] - 1);
				$groupResult &= $this->Update('[STAGE GROUPS TABLE]', $group['recordID'], $update);
			}
		}

		return array("results" => $clusterResult && $groupResult);
	}
	
	/**
	 * + Delete the course with the given ID from the stage tables.
	 * @param string $clusterID - primary key for the cluster being modified.
	 * @param string $courseID - primary key for the cluster database table.
	 */
    public function DeleteCourse($clusterID, $courseID){
		$clusterUpdates['editedUser'] = $user;
		$clusterUpdates['editedDate'] = date('Y-m-d H:i:s', time());
		$clusterResult = $this->Update('[STAGE CLUSTERS TABLE]', $clusterID, $clusterUpdates);

		$curCourses = $this->Read('[STAGE COURSES TABLE]', array('recordID' => $courseID));
		$curGroupID = $curCourses[0]['groupID'];
		$curCourseOrder = (int)$curCourses[0]['courseOrder'];

		$courseResult = $this->Delete('[STAGE COURSES TABLE]', $courseID);

		$courses = $this->Read('[STAGE COURSES TABLE]', array('groupID' => $curGroupID));
		foreach($courses as $course){
			if((int)$course['courseOrder'] > $curCourseOrder){
				$update = array('courseorder' => (int)$course['courseOrder'] - 1);
				$courseResult &= $this->Update('[STAGE COURSES TABLE]', $course['recordID'], $update);
			}
		}

		return array("results" => $clusterResult && $courseResult);
    }

	//=====================================================================================================
	// HELPER METHODS
	//=====================================================================================================

	/**
	 * + Load a Cluster by ID from the specified location, this loads ALL DB fields for that cluster.
	 * @param string $location - one of the 'Stage, Publish, or Archive' table sets.
	 * @param array $clusterID - cluster ID for the cluster to pull data for.
	 */
	private function LoadClusterObject($location, $clusterID){
		if(in_array($location, array('Stage', 'Publish', 'Archive'))){
			$clusterTable = "CSE" . $location . "Clusters";
			$groupTable = "CSE" . $location . "Groups";
			$courseTable = "CSE" . $location . "Courses"; 
			
			$clusterObject = array();
			$groupsObject = array();

			// Setup cluster data from the database table
			$clusterQuery = "SELECT * FROM " . $clusterTable . " WHERE recordID = :id";
			$bindings = array(':id' => $clusterID);

			$rows = $this->SelectQueryHelper($clusterQuery, $bindings);
			foreach($rows[0] as $key => $value)
				$clusterObject[$key] = $value;

			// Grab group and course data for this cluster from the database
			$groupQuery = "SELECT * FROM " . $groupTable . " WHERE clusterID = :id ORDER BY groupOrder ASC";
			$bindings = array(":id" => $clusterID);
			$groups = $this->SelectQueryHelper($groupQuery, $bindings);
			foreach($groups as $group){
				$groupData = array();
				foreach($group as $key => $value)
					$groupData[$key] = $value;

				$courseData = array();
				$courseQuery = "SELECT * FROM " . $courseTable . " WHERE groupID = :id ORDER BY courseOrder ASC";
				$bindings = array(":id" => $group['recordID']);
				$courses = $this->SelectQueryHelper($courseQuery, $bindings);

				$courseData = array();
				foreach($courses as $course){
					$courseObject = array();
					foreach($course as $key => $value)
						$courseObject[$key] = $value;
					$courseData[] = $courseObject;
				}
				$groupData['courses'] = $courseData;
				$groupsObject[] = $groupData;
			}

			$clusterObject['groups'] = $groupsObject;
			return $clusterObject;
		}
		else
			return null;
	}

	/**
	 * + Create a collection cluster objects from a list of cluster ID numbers.
	 * @param string $location - one of the 'Stage, Publish, or Archive' table sets
	 * @param array $clusterIDList - list of cluster record ID's to pull data for
	 */
	private function LoadClusterCollection($location, $clusterIDList){
		$collection = array();
		if(in_array($location, array('Stage', 'Publish', 'Archive'))){
			$clusterTable = "CSE" . $location . "Clusters";
			$groupTable = "CSE" . $location . "Groups";
			$courseTable = "CSE" . $location . "Courses"; 

			foreach($clusterIDList as $id) {
				$query = "SELECT * FROM " . $clusterTable . " A 
							LEFT JOIN " . $groupTable . " B ON A.recordID = B.clusterID
							LEFT JOIN " . $courseTable . " C ON B.recordID = C.groupID
							WHERE A.recordID = :id";
			
				$bindings = array(':id' => $id);
	
				if($rows = $this->SelectQueryHelper($query, $bindings)) {
					$clusterData = array();
					$clusterGroups = array();
	
					$check = false;
					foreach($rows as $row) {
						if(!$check) {
							$clusterHeader = array( "clusterNumber" => $row['clusterNumber'],
													"expirationTerm" => $row['expirationTerm'],
													"title" => $row['title'],
													"description" => $row['description'],
													"note" => $row['note'],
													"academicDiscipline" => $row['academicDiscipline'],
													"academicDepartment" => $row['academicDepartment']);
	
							$clusterData["header"] = $clusterHeader;
							
							$check = true;
						}        
						
						if(!isset($clusterGroups[$row['groupID']])) {
							$clusterGroups[$row['groupID']] = array("groupDescription" => $row['groupDescription'],
																	"groupOrder" => $row['groupOrder'],
																	"courses" => array());
						}
	
						$course = array("courseNumber" => $row['courseNumber'],
										"courseTitle" => $row['courseTitle'],
										"validStart" => $row['validStart'],
										"validEnd" => $row['validEnd'],
										"courseOrder" => $row['courseOrder']);
	
						$clusterGroups[$row['groupID']]['courses'][] = $course;
										
					}
	
					foreach($clusterGroups as $key => $value)
						$clusterData['groups'][] = $value;
	
					$collection[] = $clusterData;
				}
			}
		}
		return $collection;
	}

	/**
	 * + Retrieve information from the database and return it as an associative array.
	 * @param string $query - SQL query to execute.
	 * @param array $bindings - key:value pairs of PDF bindings.
	 */
	private function SelectQueryHelper($query, $bindings = array()){
		try	{
			$stmnt = $this->db_conn->prepare($query);

			foreach($bindings as $key => $value)
				$stmnt->bindValue($key, $value);
			$stmnt->execute();

			return $stmnt->fetchAll(PDO::FETCH_ASSOC);
		} catch (PDOException $e) {
			return false;
		}
	}

	/**
	 *  + Create a set of record id's from a database result
	 * @param string $rows - array of records to create a set of ID's for.
	 */
	private function CreateRecordSet($rows){
		$set = array();
		foreach($rows as $row)    
			$set[] = $row['recordID'];
		return $set;
	}
	
	/**
	 * + Deletes a cluster from the specified table location by clusterNumber.
	 * @param string $location - table set looking to delete cluster from
	 * @param string $clusterNumber - cluster to be deleted
	 */	
	private function DeleteClusterByTable($location, $clusterNumber){
		if(in_array($location, array('Stage', 'Publish', 'Archive'))){
			$clusterTable = "CSE" . $location . "Clusters";
			$groupTable = "CSE" . $location . "Groups";
			$courseTable = "CSE" . $location . "Courses"; 

			$records = $this->Read($clusterTable, array('clusterNumber' => $clusterNumber));
			$recordID = $records[0]['recordID'];

			$this->Delete($clusterTable, $recordID);
			$groupRecords = $this->Read($groupTable, array('clusterID' => $recordID));

			foreach($groupRecords as $group){
				$courseRecords = $this->Read($courseTable, array('groupID' => $group['recordID']));

				foreach($courseRecords as $course){
					$this->Delete($courseTable, $course['recordID']);
				}

				$this->Delete($groupTable, $group['recordID']);
			}
		}
    }	
}
?>