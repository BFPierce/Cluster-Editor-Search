<?php
//**********************************************************************************************************
//*
//*   	Class: MySQLDriver - Class for handling interactions with the MySQL Database via the REST API.
//*				This class handles basic Create, Read, Update, and Delete, you should extend to any endpoint
//*				class and extend functionality from there.
//*
//*		Author: Jeffery A. White
//*
//**********************************************************************************************************

class MySQLDriver
{
	protected $db_conn;
	
	private $db_strn;
	private $db_user;
	private $db_pass;
	
	public function __construct() {
		
		$this->db_strn = '';
		$this->db_user = '';
		$this->db_pass = '';
		
		try {
			$this->db_conn = new PDO($this->db_strn,$this->db_user,$this->db_pass);
			
			$this->db_conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
			$this->db_conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		} 
		catch (PDOException $e) {
			echo "Database Connection Error! - " . $e->getMessage() . "<br/>";
			die();
		}
	}
	
	/**
	 * Function to add a record into the MySQL database, returns the ID.
	 *
	 * @param string $table
	 * @param array $data
	 * @return int - record ID of the created record, false if failure.
	 */
	protected function Create($table, $data) {
		
		$bindings = array();
		$keys = "";
		$values = "";
		
		$control = false;
		foreach($data as $key => $value) {
			if(!$control){
				$keys .= $key;
				$values .= ":$key";
				$bindings[":$key"] = htmlentities($value);
				$control = true;	
			} else {
				$keys .= "," . $key;
				$values .= ",:$key";
				$bindings[":$key"] = htmlentities($value);	
			}
		}		
		
		try {
			$stmnt = $this->db_conn->prepare("INSERT INTO " . $table . " (" . $keys . ") VALUES (" . $values . ")");
			$stmnt->execute($bindings);
			
			return $this->db_conn->lastInsertId();
		}
		catch (PDOException $e) { 
			return false;	
		}
	
	}
	
	/**
	 * Function to read a database table with the given parameters, returns an array of records from the
	 * database with key associations only.
	 *
	 * @param [string] $tableName
	 * @param array $parameters
	 * @return array
	 */
	protected function Read($tableName, $parameters = array()) {
		$data = array();
		$bindings = array();
		$filter = "";
		
		if(!empty($parameters))	{
			$control = false;
			foreach($parameters as $key => $value) {
				if(!$control) {
					$filter .= " WHERE $key = :$key";
					$bindings[":$key"] = $value;
					$control = true;	
				} else {
					$filter .= " AND $key = :$key";
					$bindings[":$key"] = $value;	
				}
			}
		}		
		
		$rows = array();
		
		try {		
			$stmnt = $this->db_conn->prepare("SELECT * FROM " . $tableName . $filter);
			$stmnt->execute($bindings);
			$rows = $stmnt->fetchAll(PDO::FETCH_ASSOC);
		} catch (PDOException $e) {
			return $data;	
		}		
		
		foreach($rows as $row) {	
			foreach($row as $key => $value)
				$row[$key] = html_entity_decode($value);
			
			$data[] = $row;	
		}
		
		return $data;	

	}
	
	/**
	 * Function to update database records with the input data matching the given parameters.
	 *
	 * @param string $tableName
	 * @param string $recordID
	 * @param array $data
	 * @return boolean
	 */
	protected function Update($tableName, $recordID, $data)	{	
		$bindings = array();	
		$update = "";
		
		$flag = false;
		foreach($data as $key => $value){
			if(!$flag){
				$update .= " SET $key = :$key";
				$bindings[":$key"] = $value;
				$flag = true;
			} else {
				$update .= ",$key = :$key";
				$bindings[":$key"] = $value;
			}
		}
						
		try {
			$stmnt = $this->db_conn->prepare("UPDATE " . $tableName . $update . " WHERE recordID = '" . $recordID . "'");
			$stmnt->execute($bindings);
			return true;
		} catch (PDOException $e) {
			return false;
		}
	}
	
	/**
	 * Function to delete a database record by the recordID.
	 *
	 * @param string $tableName
	 * @param string $recordID
	 * @return boolean
	 */
	protected function Delete($tableName, $recordID) {
		$sql = "DELETE FROM " . $tableName . " WHERE recordID ='" . $recordID . "'";
		
		try	{
			$stmnt = $this->db_conn->query($sql);
			return true;
		} catch (PDOException $e) {
			return false;
		}		
	}
}