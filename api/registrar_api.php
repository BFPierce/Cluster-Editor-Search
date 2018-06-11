<?php

require_once('lib/RegistrarAPI.php');

try
{
	$API = new RegistrarAPI($_REQUEST['request']);	
	echo $API->Process();
}
catch(Exception $e)
{
	echo $e->getMessage();	
}

?>