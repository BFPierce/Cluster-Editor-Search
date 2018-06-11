<?php
require_once('AbstractAPI.php');
require_once('SecurityManager.php');

require_once('endpoints/Clusters.php');

class RegistrarAPI extends API
{
	protected $m_security = NULL;
	
	public function __construct($request){
		parent::__construct($request);
		
		$this->m_security = new SecurityManager();
	}	
	
	//---------------------------------------------------------------------------
	protected function authenticate($args){	
		// Authorize the current user and return their authentication token,
		// which should be provided on every request they make to the API
		// for those endpoints which require a secured login.
		if($this->m_method == 'POST'){
			$result = $this->m_security->GenerateAuthToken($this->m_request['user'], $this->m_request['pass']);
			
			if($result)
				return array('token' => $result);
			else
				return array('token' => null);
		}
	}

	//---------------------------------------------------------------------------
	protected function clusters($args){
		$clusters = new Clusters();
		$security = new SecurityManager();

		$user = null;
		if(!empty($this->m_auth)){
			$token = explode(' ', $this->m_auth);
			if($security->ValidateAuthToken($token[1])){
				$userData = $security->GetPayload($token[1]);
				if($clusters->GetAdminType($userData['netID']))
					$user = $userData['netID'];
			}
		}
				
		if($this->m_method == 'GET') {
			switch($this->m_verb) {
				case 'admin':
					return ($user ? $clusters->GetAdminType($args[0]) : array('ERR' => "Not Authorized"));
					break;
				case 'departments':
					return $clusters->ListDepartments();
					break;
				case 'groups':
					return $clusters->ListGroups();
					break;
				case 'crosslist':
					return $clusters->ListCrossListed();
					break;
				case 'publish':
					return $clusters->GetPublish($args[0]);
					break;
				case 'stage':
					return ($user ? $clusters->ListStage($args[0]) : array('ERR' => "Not Authorized"));
					break;
				case 'archive':
					return ($user ? $clusters->ListArchive($args[0]) : array('ERR' => "Not Authorized"));
					break;
				case 'process':
					return ($user ? $clusters->ListProcess($args[0]) : array('ERR' => "Not Authorized"));
					break;
			}
		}

		if($this->m_method == 'POST') {
			switch ($this->m_verb) {
				case 'query':
					return $clusters->SearchClusters($this->m_request); 
					break;
				case 'cluster':
					return ($user ? $clusters->CreateCluster($user, $this->m_request) : array('ERR' => "Not Authorized"));
					break;
				case 'group':
					return ($user ? $clusters->CreateGroup($args[0], $user, $this->m_request) : array('ERR' => "Not Authorized"));
					break;
				case 'course':
					return ($user ? $clusters->CreateCourse($args[0], $user, $this->m_request) : array('ERR' => "Not Authorized"));
					break;
				case 'publish':
					return ($user ? $clusters->PublishCluster($args[0], $user) : array('ERR' => "Not Authorized"));
					break;
				case 'stage':
					return ($user ? $clusters->StageCluster($args[0], $user) : array('ERR' => "Not Authorized"));	
					break;

			}
		}

		if($this->m_method == 'PUT') {
			switch($this->m_verb) {
				case 'process':
					return ($user ? $clusters->UpdateProcess($args[0], $args[1], $user) : array('ERR' => "Not Authorized"));
					break;
				case 'cluster':
					return ($user ? $clusters->UpdateCluster($args[0], $user, $this->m_file) : array('ERR' => "Not Authorized"));
					break;
				case 'group':
					return ($user ? $clusters->UpdateGroup($args[0], $args[1], $user, $this->m_file) : array('ERR' => "Not Authorized"));
					break;
				case 'course':
					return ($user ? $clusters->UpdateCourse($args[0], $args[1], $user, $this->m_file) : array('ERR' => "Not Authorized"));
					break;
			}
		}

		if($this->m_method == 'DELETE'){
			switch($this->m_verb) {
				case 'group':
					return ($user ? $clusters->DeleteGroup($args[0], $args[1]) : array('ERR' => "Not Authorized"));
					break;
				case 'course':
					return ($user ? $clusters->DeleteCourse($args[0], $args[1]) : array('ERR' => "Not Authorized"));
					break;
			}
		}
	}
}

?>