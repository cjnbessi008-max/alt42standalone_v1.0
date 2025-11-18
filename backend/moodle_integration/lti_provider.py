"""
LTI 1.3 Provider Implementation for Moodle Integration

This module handles LTI 1.3 authentication flow with Moodle 3.7+
Supports OIDC login, JWT validation, and secure session creation.
"""

import json
import logging
import time
from typing import Dict, Optional, Any
from datetime import datetime, timedelta
from urllib.parse import urlencode, parse_qs

import jwt
import requests
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

logger = logging.getLogger(__name__)


class LTI13Provider:
    """
    LTI 1.3 Provider for Moodle integration.

    Implements the IMS Global LTI 1.3 specification for secure
    integration with Moodle LMS.
    """

    def __init__(
        self,
        issuer: str,
        client_id: str,
        deployment_id: str,
        platform_public_keyset_url: str,
        platform_auth_url: str,
        platform_token_url: str,
        tool_url: str,
        private_key_path: str,
        public_key_path: str
    ):
        """
        Initialize LTI 1.3 Provider.

        Args:
            issuer: Moodle platform issuer URL
            client_id: LTI client identifier
            deployment_id: Deployment identifier
            platform_public_keyset_url: Moodle's JWKS endpoint
            platform_auth_url: OIDC authentication URL
            platform_token_url: OAuth 2.0 token endpoint
            tool_url: This tool's base URL
            private_key_path: Path to RSA private key (PEM format)
            public_key_path: Path to RSA public key (PEM format)
        """
        self.issuer = issuer
        self.client_id = client_id
        self.deployment_id = deployment_id
        self.platform_public_keyset_url = platform_public_keyset_url
        self.platform_auth_url = platform_auth_url
        self.platform_token_url = platform_token_url
        self.tool_url = tool_url

        # Load RSA keys
        self.private_key = self._load_private_key(private_key_path)
        self.public_key = self._load_public_key(public_key_path)

        # Cache for platform public keys
        self._platform_keys_cache: Optional[Dict] = None
        self._platform_keys_cache_time: Optional[datetime] = None
        self._cache_ttl = timedelta(hours=1)

    def _load_private_key(self, key_path: str):
        """Load RSA private key from PEM file."""
        try:
            with open(key_path, 'rb') as key_file:
                return serialization.load_pem_private_key(
                    key_file.read(),
                    password=None,
                    backend=default_backend()
                )
        except Exception as e:
            logger.error(f"Failed to load private key: {e}")
            raise

    def _load_public_key(self, key_path: str):
        """Load RSA public key from PEM file."""
        try:
            with open(key_path, 'rb') as key_file:
                return serialization.load_pem_public_key(
                    key_file.read(),
                    backend=default_backend()
                )
        except Exception as e:
            logger.error(f"Failed to load public key: {e}")
            raise

    def generate_key_pair(self) -> tuple:
        """
        Generate new RSA key pair for LTI.

        Returns:
            Tuple of (private_key_pem, public_key_pem)
        """
        # Generate private key
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )

        # Get private key PEM
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )

        # Get public key PEM
        public_key = private_key.public_key()
        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )

        return private_pem, public_pem

    def get_jwks(self) -> Dict:
        """
        Get JWKS (JSON Web Key Set) for public key distribution.

        Returns:
            JWKS dictionary
        """
        # Convert public key to JWK format
        public_numbers = self.public_key.public_numbers()

        # Get modulus and exponent
        n = public_numbers.n
        e = public_numbers.e

        # Convert to base64url encoded strings
        import base64

        def int_to_base64url(num):
            """Convert integer to base64url encoded string."""
            # Convert to bytes
            byte_length = (num.bit_length() + 7) // 8
            num_bytes = num.to_bytes(byte_length, byteorder='big')
            # Base64url encode
            return base64.urlsafe_b64encode(num_bytes).rstrip(b'=').decode('utf-8')

        jwk = {
            "kty": "RSA",
            "alg": "RS256",
            "use": "sig",
            "kid": self._generate_key_id(),
            "n": int_to_base64url(n),
            "e": int_to_base64url(e)
        }

        return {
            "keys": [jwk]
        }

    def _generate_key_id(self) -> str:
        """Generate a unique key ID for JWKS."""
        import hashlib
        public_pem = self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        return hashlib.sha256(public_pem).hexdigest()[:16]

    def _fetch_platform_keys(self) -> Dict:
        """
        Fetch platform public keys from JWKS endpoint.

        Returns:
            JWKS dictionary
        """
        # Check cache
        if (self._platform_keys_cache and self._platform_keys_cache_time and
            datetime.now() - self._platform_keys_cache_time < self._cache_ttl):
            return self._platform_keys_cache

        try:
            response = requests.get(
                self.platform_public_keyset_url,
                timeout=10
            )
            response.raise_for_status()

            keys = response.json()

            # Update cache
            self._platform_keys_cache = keys
            self._platform_keys_cache_time = datetime.now()

            logger.info(f"Fetched {len(keys.get('keys', []))} platform public keys")
            return keys

        except Exception as e:
            logger.error(f"Failed to fetch platform keys: {e}")
            raise

    def validate_jwt_token(self, token: str) -> Dict:
        """
        Validate JWT token from Moodle.

        Args:
            token: JWT token string

        Returns:
            Decoded token payload

        Raises:
            jwt.InvalidTokenError: If token is invalid
        """
        # Get platform public keys
        jwks = self._fetch_platform_keys()

        # Decode header to get kid
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get('kid')

        # Find matching key
        platform_key = None
        for key in jwks.get('keys', []):
            if key.get('kid') == kid:
                platform_key = key
                break

        if not platform_key:
            raise jwt.InvalidTokenError(f"No matching key found for kid: {kid}")

        # Convert JWK to public key
        from jwt.algorithms import RSAAlgorithm
        public_key = RSAAlgorithm.from_jwk(json.dumps(platform_key))

        # Validate and decode token
        try:
            payload = jwt.decode(
                token,
                public_key,
                algorithms=['RS256'],
                audience=self.client_id,
                issuer=self.issuer,
                options={
                    'verify_exp': True,
                    'verify_aud': True,
                    'verify_iss': True
                }
            )

            logger.info(f"Successfully validated JWT for user: {payload.get('sub')}")
            return payload

        except jwt.ExpiredSignatureError:
            logger.error("JWT token has expired")
            raise
        except jwt.InvalidAudienceError:
            logger.error(f"Invalid audience. Expected: {self.client_id}")
            raise
        except jwt.InvalidIssuerError:
            logger.error(f"Invalid issuer. Expected: {self.issuer}")
            raise
        except Exception as e:
            logger.error(f"JWT validation failed: {e}")
            raise

    def handle_oidc_login(self, request_params: Dict) -> str:
        """
        Handle OIDC login initiation from Moodle.

        Args:
            request_params: Request parameters from Moodle
                - iss: Issuer identifier
                - login_hint: Login hint (user ID)
                - target_link_uri: Target URL
                - lti_message_hint: Message hint
                - client_id: OAuth client ID

        Returns:
            Redirect URL to Moodle authentication endpoint
        """
        # Validate required parameters
        required = ['iss', 'login_hint', 'target_link_uri', 'client_id']
        for param in required:
            if param not in request_params:
                raise ValueError(f"Missing required parameter: {param}")

        # Verify issuer and client_id
        if request_params['iss'] != self.issuer:
            raise ValueError(f"Invalid issuer: {request_params['iss']}")
        if request_params['client_id'] != self.client_id:
            raise ValueError(f"Invalid client_id: {request_params['client_id']}")

        # Generate state and nonce
        import secrets
        state = secrets.token_urlsafe(32)
        nonce = secrets.token_urlsafe(32)

        # Store state and nonce for validation (should be stored in Redis/database)
        # This is a placeholder - implement proper storage
        self._store_auth_state(state, {
            'nonce': nonce,
            'target_link_uri': request_params['target_link_uri'],
            'timestamp': time.time()
        })

        # Build authentication request
        auth_params = {
            'response_type': 'id_token',
            'response_mode': 'form_post',
            'scope': 'openid',
            'client_id': self.client_id,
            'redirect_uri': f"{self.tool_url}/lti/auth-callback",
            'login_hint': request_params['login_hint'],
            'state': state,
            'nonce': nonce,
            'prompt': 'none'
        }

        if 'lti_message_hint' in request_params:
            auth_params['lti_message_hint'] = request_params['lti_message_hint']

        redirect_url = f"{self.platform_auth_url}?{urlencode(auth_params)}"

        logger.info(f"Generated OIDC login redirect for user: {request_params['login_hint']}")
        return redirect_url

    def handle_auth_callback(self, request_params: Dict) -> Dict:
        """
        Handle authentication callback from Moodle.

        Args:
            request_params: POST parameters from Moodle
                - id_token: JWT ID token
                - state: State parameter

        Returns:
            Parsed LTI launch data
        """
        # Validate required parameters
        if 'id_token' not in request_params:
            raise ValueError("Missing id_token")
        if 'state' not in request_params:
            raise ValueError("Missing state")

        # Retrieve and validate state
        state = request_params['state']
        stored_state = self._retrieve_auth_state(state)

        if not stored_state:
            raise ValueError("Invalid or expired state")

        # Validate JWT token
        token = request_params['id_token']
        payload = self.validate_jwt_token(token)

        # Verify nonce
        if payload.get('nonce') != stored_state['nonce']:
            raise ValueError("Nonce mismatch")

        # Extract LTI claims
        lti_data = self._extract_lti_claims(payload)

        logger.info(f"Successful LTI launch for user: {lti_data['user_id']}")
        return lti_data

    def _extract_lti_claims(self, payload: Dict) -> Dict:
        """
        Extract LTI-specific claims from JWT payload.

        Args:
            payload: Decoded JWT payload

        Returns:
            Structured LTI launch data
        """
        # Standard claims
        lti_data = {
            'user_id': payload.get('sub'),
            'user_email': payload.get('email'),
            'user_name': payload.get('name'),
            'user_given_name': payload.get('given_name'),
            'user_family_name': payload.get('family_name'),
            'deployment_id': payload.get('https://purl.imsglobal.org/spec/lti/claim/deployment_id'),
            'message_type': payload.get('https://purl.imsglobal.org/spec/lti/claim/message_type'),
            'version': payload.get('https://purl.imsglobal.org/spec/lti/claim/version'),
        }

        # Context (course) claims
        context = payload.get('https://purl.imsglobal.org/spec/lti/claim/context', {})
        lti_data['context_id'] = context.get('id')
        lti_data['context_label'] = context.get('label')
        lti_data['context_title'] = context.get('title')
        lti_data['context_type'] = context.get('type', [])

        # Resource link claims
        resource_link = payload.get('https://purl.imsglobal.org/spec/lti/claim/resource_link', {})
        lti_data['resource_link_id'] = resource_link.get('id')
        lti_data['resource_link_title'] = resource_link.get('title')
        lti_data['resource_link_description'] = resource_link.get('description')

        # Roles
        roles = payload.get('https://purl.imsglobal.org/spec/lti/claim/roles', [])
        lti_data['roles'] = roles
        lti_data['is_instructor'] = any('Instructor' in role or 'Teacher' in role for role in roles)
        lti_data['is_learner'] = any('Learner' in role or 'Student' in role for role in roles)

        # Launch presentation
        launch_presentation = payload.get('https://purl.imsglobal.org/spec/lti/claim/launch_presentation', {})
        lti_data['launch_presentation_return_url'] = launch_presentation.get('return_url')
        lti_data['launch_presentation_locale'] = launch_presentation.get('locale')

        # Custom parameters
        custom = payload.get('https://purl.imsglobal.org/spec/lti/claim/custom', {})
        lti_data['custom_params'] = custom

        # Moodle-specific extensions
        lti_data['platform'] = {
            'product_family_code': payload.get('https://purl.imsglobal.org/spec/lti/claim/tool_platform', {}).get('product_family_code'),
            'version': payload.get('https://purl.imsglobal.org/spec/lti/claim/tool_platform', {}).get('version'),
        }

        return lti_data

    def _store_auth_state(self, state: str, data: Dict) -> None:
        """
        Store authentication state temporarily.

        This should be implemented using Redis or database.
        Current implementation is a placeholder using in-memory cache.
        """
        # TODO: Implement proper storage (Redis)
        if not hasattr(self, '_auth_states'):
            self._auth_states = {}
        self._auth_states[state] = data

        logger.debug(f"Stored auth state: {state}")

    def _retrieve_auth_state(self, state: str) -> Optional[Dict]:
        """
        Retrieve stored authentication state.

        Returns None if state not found or expired.
        """
        # TODO: Implement proper retrieval (Redis)
        if not hasattr(self, '_auth_states'):
            return None

        data = self._auth_states.get(state)
        if not data:
            return None

        # Check expiration (5 minutes)
        if time.time() - data['timestamp'] > 300:
            del self._auth_states[state]
            return None

        # Clean up after use
        del self._auth_states[state]

        return data

    def create_access_token(self, lti_data: Dict, expires_in: int = 3600) -> str:
        """
        Create JWT access token for authenticated user.

        Args:
            lti_data: LTI launch data
            expires_in: Token expiration in seconds (default: 1 hour)

        Returns:
            JWT access token
        """
        now = int(time.time())

        payload = {
            'iss': self.tool_url,
            'sub': lti_data['user_id'],
            'aud': self.client_id,
            'exp': now + expires_in,
            'iat': now,
            'nbf': now,

            # Custom claims
            'user_email': lti_data.get('user_email'),
            'user_name': lti_data.get('user_name'),
            'context_id': lti_data.get('context_id'),
            'context_title': lti_data.get('context_title'),
            'roles': lti_data.get('roles', []),
            'is_instructor': lti_data.get('is_instructor', False),
            'is_learner': lti_data.get('is_learner', False),
        }

        token = jwt.encode(
            payload,
            self.private_key,
            algorithm='RS256',
            headers={'kid': self._generate_key_id()}
        )

        logger.info(f"Created access token for user: {lti_data['user_id']}")
        return token

    def validate_access_token(self, token: str) -> Dict:
        """
        Validate access token issued by this tool.

        Args:
            token: JWT access token

        Returns:
            Decoded token payload
        """
        try:
            payload = jwt.decode(
                token,
                self.public_key,
                algorithms=['RS256'],
                audience=self.client_id,
                issuer=self.tool_url,
                options={
                    'verify_exp': True,
                    'verify_aud': True,
                    'verify_iss': True
                }
            )

            return payload

        except jwt.ExpiredSignatureError:
            logger.error("Access token has expired")
            raise
        except Exception as e:
            logger.error(f"Access token validation failed: {e}")
            raise


# Example configuration for Moodle 3.7
MOODLE_LTI_CONFIG = {
    'issuer': 'https://your-moodle.kaist.ac.kr',
    'client_id': 'your_client_id',
    'deployment_id': 'your_deployment_id',
    'platform_public_keyset_url': 'https://your-moodle.kaist.ac.kr/mod/lti/certs.php',
    'platform_auth_url': 'https://your-moodle.kaist.ac.kr/mod/lti/auth.php',
    'platform_token_url': 'https://your-moodle.kaist.ac.kr/mod/lti/token.php',
    'tool_url': 'https://alt42.kaist.ac.kr',
    'private_key_path': '/path/to/private_key.pem',
    'public_key_path': '/path/to/public_key.pem',
}


if __name__ == '__main__':
    # Example: Generate new key pair
    provider = LTI13Provider(**MOODLE_LTI_CONFIG)

    # Generate keys
    private_pem, public_pem = provider.generate_key_pair()

    print("Private Key:")
    print(private_pem.decode('utf-8'))
    print("\nPublic Key:")
    print(public_pem.decode('utf-8'))

    # Get JWKS
    jwks = provider.get_jwks()
    print("\nJWKS:")
    print(json.dumps(jwks, indent=2))
