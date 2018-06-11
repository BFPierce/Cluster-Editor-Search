<?php
// http://coreymaynard.com/blog/creating-a-restful-api-with-php/api/v1/example

/* Adapted from the above for a simple REST API - Jeffery A. White */

abstract class API
{
	protected $m_method = NULL;
	protected $m_endpoint = NULL;
	protected $m_verb = NULL;
	
	protected $m_args = array();
	
	protected $m_request = NULL;
	protected $m_file = NULL;	

	protected $m_auth = NULL;

	public function __construct($request)
	{
		header("Access-Control-Allow-Origin: *");
		header("Access-Control-Allow-Methods: *");
		header("Content-Type: application/json");
		
		$this->_parse($request);
		$this->_resolveMethod();
		$this->_processRequest();
		$this->_processHeaders();
	}
	
	//===========================================================================
	// Main routine for processing
	//===========================================================================
	public function Process()
	{
		if(method_exists($this, $this->m_endpoint))
			return $this->_response($this->{$this->m_endpoint}($this->m_args));
		else
			return $this->_response("No Endpoint: " . $this->m_endpoint, 404);
	}
	
	//---------------------------------------------------------------------------
	private function _response($result_data, $status = 200)
	{		
		header("HTTP/1.1 " . $status . " " . $this->_status($status));
		return json_encode($result_data);
		
	}		
	
	//---------------------------------------------------------------------------
	private function _parse($request)
	{
		$this->m_args = explode('/',rtrim($request, '/'));
		$this->m_endpoint = array_shift($this->m_args);
		
		if(array_key_exists(0, $this->m_args) && !is_numeric($this->m_args[0]))
			$this->m_verb = array_shift($this->m_args);
	}
	
	//---------------------------------------------------------------------------
	private function _resolveMethod()
	{
		$this->m_method = $_SERVER['REQUEST_METHOD'];
		
		if($this->m_method == 'POST' && array_key_exists('HTTP_X_HTTP_METHOD', $_SERVER))
		{		
			if($_SERVER['HTTP_X_HTTP_METHOD'] == 'PUT' || $_SERVER['HTTP_X_HTTP_METHOD'] == 'DELETE')
				$this->m_method = $_SERVER['HTTP_X_HTTP_METHOD'];
			else
				throw new Exception("Unexpected Header");				
		}
	}
	
	//---------------------------------------------------------------------------
	private function _processRequest()
	{
		switch($this->m_method)
		{
			case 'DELETE':
				break;
			case 'PUT':
				$this->m_request = $this->_sanitize($_GET);
				if(stripos($_SERVER['CONTENT_TYPE'], "application/json") === 0)
					$this->m_file = json_decode(file_get_contents("php://input"), true);
				else
					$this->m_file = file_get_contents("php://input");
			 	break;
			case 'GET':
				$this->m_request = $this->_sanitize($_GET);
				break;
			case 'POST':
				if(stripos($_SERVER['CONTENT_TYPE'], "application/json") === 0)
					$_POST = json_decode(file_get_contents("php://input"), true); // Handling quirk of AngularJS
				$this->m_request = $this->_sanitize($_POST);
				break;
			default:
				$this->_response('Invalid Method', 405);
				break;
		}
	}

	//---------------------------------------------------------------------------
	private function _processHeaders()
	{
		$this->m_auth = trim($_SERVER['HTTP_AUTHORIZATION']);
	}

	//---------------------------------------------------------------------------
	private function _sanitize($dirty_input)
	{
		$clean_input = array();
		
		if(is_array($dirty_input))
		{
			foreach($dirty_input as $key => $value)
			{
				$clean_input[$key] = trim(strip_tags($value));	
			}
		}
		else
		{
			$clean_input = trim(strip_tags($dirty_input));	
		}
		
		return $clean_input;
	}
	
	//---------------------------------------------------------------------------
	private function _status($code)
	{
		
		$status = array(200 => 'OK',
						404 => 'Not Found',
						405 => 'Method Not Allowed',
						500 => 'Internal Server Error');
						
		return (($status[$code]) ? $status[$code] : $status[500]);
		
	}
	
}

?>