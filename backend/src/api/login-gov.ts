import * as crypto from 'crypto';
import * as jose from 'node-jose';
import { pem2jwk, JSONWebKey } from 'pem-jwk';
import { Issuer, ClientMetadata } from 'openid-client';

var loginGov: any = {};

loginGov.discoveryUrl =
  process.env.DISCOVERY_URL || 'https://idp.int.identitysandbox.gov';

var jwk: JSONWebKey = JSON.parse(process.env.JWT_KEY!);

var clientOptions: ClientMetadata = {
  client_id: 'urn:gov:gsa:openidconnect.profiles:sp:sso:cisa:crossfeed',
  token_endpoint_auth_method: 'private_key_jwt',
  id_token_signed_response_alg: 'RS256',
  key: 'client_id',
  redirect_uris: ['http://localhost:3000/auth/callback']
};

loginGov.login = async function () {
  const issuer = await Issuer.discover(loginGov.discoveryUrl);
  var client = new issuer.Client(clientOptions, {
    keys: [jwk]
  });
  return client.authorizationUrl({
    response_type: 'code',
    acr_values: `http://idmanagement.gov/ns/assurance/loa/1`,
    scope: 'openid email',
    redirect_uri: `http://localhost:3000/auth/callback`,
    nonce: loginGov.randomString(32),
    state: loginGov.randomString(32),
    prompt: 'select_account'
  });
};

loginGov.callback = async function (event) {
  const issuer = await Issuer.discover(loginGov.discoveryUrl);
  var client = new issuer.Client(clientOptions, {
    keys: [jwk]
  });
  //   const params = client.callbackParams(event.body);
  console.log(event.queryStringParameters);
  const resp = await client.callback(
    'https://idp.int.identitysandbox.gov/api/openid_connect/token',
    event.queryStringParameters,
    { state: event.queryStringParameters.state }
  );
  console.log(resp);
  // .then(function (tokenSet) {
  //   console.log('received and validated tokens %j', tokenSet);
  //   console.log('validated ID Token claims %j', tokenSet.claims());
  // });
};

loginGov.randomString = function (length) {
  return crypto.randomBytes(length).toString('hex');
};

export default loginGov;
