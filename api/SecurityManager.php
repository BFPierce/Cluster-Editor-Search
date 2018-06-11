<?php

class SecurityManager
{
	private $m_secret = "[REMOVED TO PROTECT THE INNOCENT - You should come up with something really good here!]";	
	private $m_ldap = '[REMOVED TO PROTECT THE INNOCENT]';

	public function __construct(){
		
	}
	
	/**
	 * 	Authenticate User by NetID and return a key and user information as
	 *	a JSON Web Token. These are valid for 60 minutes.
	 *
	 * @param [string] $netid
	 * @param [string] $password
	 * @return void
	 */
	public function GenerateAuthToken($netid, $password){		
		$result = $this->Authenticate($netid, $password);
		
		if($result){	
			$userInformation = array();

			$header = array('typ' => 'JWT', 'alg' => 'SHA256');

			$userInformation['lastName'] = $result[1];
			$userInformation['firstName'] = $result[2];
			$userInformation['classYear'] = $result[3];
			$userInformation['studentID'] = $result[4];
			$userInformation['emailAddress'] = $result[5];
			$userInformation['netID'] = $result[6];
			$userInformation['expiration'] = date("Y-m-d h:i:sa", strtotime('+1 Hour'));
			
			$token = array();
			$token[] = $this->URLSafeB64Encode(json_encode($header));
			$token[] = $this->URLSafeB64Encode(json_encode($userInformation));
			
			$signature = $this->GenerateSignature(implode('.', $token), $this->m_secret);
			
			$token[] = $this->URLSafeB64Encode($signature);
			
			
			return implode('.', $token);
		}
		else{
			return false;	
		}
	}	
	
	/**
	 *  Validated a submitted web token.
	 *
	 * @param [string] $token
	 * @return bool
	 */
	public function ValidateAuthToken($token){
		$tokens = explode('.', $token);
		
		if(count($tokens) != 3)
			return false;
			
		list($headerb64, $payloadb64, $signatureb64) = $tokens;
		
		$signature = $this->URLSafeB64Decode($signatureb64);
		
		// Validate whether this token has expired
		$payload = json_decode($this->URLSafeB64Decode($payloadb64), true);
		
		if(time() > strtotime($payload['expiration']))
			return false;
		
		// Generate the signature, did the token get tampered with?
		$sigCheck = $headerb64 . "." . $payloadb64;
		
		if($signature != $this->GenerateSignature($sigCheck, $this->m_secret))
			return false;


		return true;
	}
	
	/**
	 * Get the payload from a JSON web token, utilied by the API.
	 *
	 * @param [string] $token
	 * @return array
	 */
	public function GetPayload($token){
		$tokens = explode('.', $token);
		return json_decode($this->URLSafeB64Decode($tokens[1]), true);
	}


	private function GenerateSignature($data, $key){
		return hash('sha256', $data . $key);
	}
	
	private function URLSafeB64Decode($input){
		$remainder = strlen($input) % 4;
		
		// If there's a remainder we need to add in '=' as appropriate
		if($remainder){
			$padlen = 4 - $remainder;
			$input .= str_repeat('=', $padlen);	
		}
		
		return base64_decode(strtr($input, '-_', '+/'));
	}
	
	private function URLSafeB64Encode($input){
		return str_replace('=', '', strtr(base64_encode($input), '+/', '-_'));
	}
	
	private function Authenticate($netid, $password)
	{
		/**
		 * I've removed the body of this function for release on github, in practice it uses a standard LDAP bind process to valid the user against
		 * your internal systems. You can use any method here. The one we use internally produces a predictable array structure seen up in the 
		 * 'GenerateAuthToken method.
		 * 
		 * One example out there on the internet I've found that does work generally (https://samjlevy.com/php-ldap-login/)
		 */
	}
}

?>