import * as crypto from 'crypto';
import { Issuer, ClientMetadata } from 'openid-client';

const discoveryUrl =
  process.env.LOGIN_GOV_BASE_URL + '/.well-known/openid-configuration';

let jwkSet;

try {
  jwkSet = {
    keys: [JSON.parse(process.env.LOGIN_GOV_JWT_KEY ?? '{}')]
  };
} catch (e) {
  jwkSet = {
    keys: [{}]
  };
}

const clientOptions: ClientMetadata = {
  client_id: process.env.LOGIN_GOV_ISSUER!,
  token_endpoint_auth_method: 'private_key_jwt',
  id_token_signed_response_alg: 'RS256',
  key: 'client_id',
  redirect_uris: [process.env.LOGIN_GOV_REDIRECT_URI!],
  token_endpoint: process.env.LOGIN_GOV_BASE_URL + '/api/openid_connect/token'
};

const randomString = function (length) {
  return crypto.randomBytes(length).toString('hex');
};

export const login = async function (): Promise<{
  url: string;
  state: string;
  nonce: string;
}> {
  const issuer = await Issuer.discover(discoveryUrl);
  const client = new issuer.Client(clientOptions, jwkSet);
  const nonce = randomString(32);
  const state = randomString(32);
  const url = client.authorizationUrl({
    response_type: 'code',
    acr_values: `http://idmanagement.gov/ns/assurance/ial/1`,
    scope: 'openid email',
    redirect_uri: process.env.LOGIN_GOV_REDIRECT_URI,
    nonce: nonce,
    state: state,
    prompt: 'select_account'
  });
  return { url, state, nonce };
};

export const callback = async function (body) {
  const issuer = await Issuer.discover(discoveryUrl);
  const client = new issuer.Client(clientOptions, jwkSet);
  const tokenSet = await client.callback(
    process.env.LOGIN_GOV_REDIRECT_URI,
    {
      code: body.code,
      state: body.state
    },
    {
      state: body.origState,
      nonce: body.nonce
    }
  );
  const userInfo = await client.userinfo(tokenSet);
  return userInfo;
};

export default { login, callback };
