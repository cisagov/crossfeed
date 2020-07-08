import * as crypto from 'crypto';
import { Issuer, ClientMetadata } from 'openid-client';

const loginGov: any = {
  discoveryUrl:
    process.env.DISCOVERY_URL || 'https://idp.int.identitysandbox.gov'
};

const jwkSet = {
  keys: [JSON.parse(process.env.JWT_KEY!)]
};

const clientOptions: ClientMetadata = {
  client_id: 'urn:gov:gsa:openidconnect.profiles:sp:sso:cisa:crossfeed',
  token_endpoint_auth_method: 'private_key_jwt',
  id_token_signed_response_alg: 'RS256',
  key: 'client_id',
  redirect_uris: ['http://localhost/callback'],
  token_endpoint: 'https://idp.int.identitysandbox.gov/api/openid_connect/token'
};

loginGov.login = async function (): Promise<{
  url: string;
  state: string;
  nonce: string;
}> {
  const issuer = await Issuer.discover(loginGov.discoveryUrl);
  const client = new issuer.Client(clientOptions, jwkSet);
  const nonce = loginGov.randomString(32);
  const state = loginGov.randomString(32);
  const url = client.authorizationUrl({
    response_type: 'code',
    acr_values: `http://idmanagement.gov/ns/assurance/loa/1`,
    scope: 'openid email',
    redirect_uri: `http://localhost/callback`,
    nonce: nonce,
    state: state,
    prompt: 'select_account'
  });
  return { url, state, nonce };
};

loginGov.callback = async function (body) {
  try {
    const issuer = await Issuer.discover(loginGov.discoveryUrl);
    const client = new issuer.Client(clientOptions, jwkSet);
    const tokenSet = await client.callback(
      'http://localhost/callback',
      {
        code: body.code,
        state: body.state
      }
      {
        state: body.origState,
        nonce: body.nonce
      }
    );
    const userInfo = await client.userinfo(tokenSet);
    return userInfo;
  } catch (e) {
    console.log('an error occurred');
    console.log(e);
  }
};

loginGov.randomString = function (length) {
  return crypto.randomBytes(length).toString('hex');
};

export default loginGov;
