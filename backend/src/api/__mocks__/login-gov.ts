const loginGov: any = {};

loginGov.login = async function (): Promise<{
  url: string;
  state: string;
  nonce: string;
}> {
  return {
    url: 'https://idp.int.identitysandbox.gov/openid_connect/authorize?client_id=urn%3Agov%3Agsa%3Aopenidconnect.profiles%3Asp%3Asso%3Acisa%3Acrossfeed&scope=openid%20email&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%2F&acr_values=http%3A%2F%2Fidmanagement.gov%2Fns%2Fassurance%2Fial%2F1&nonce=3ac04a92b121fce3fc5ca95251e70205d764147731&state=258165a7dc37ce6034e74815e991606d49fd52240e469f&prompt=select_account',
    state: '258165a7dc37ce6034e74815e991606d49fd52240e469f',
    nonce: '3ac04a92b121fce3fc5ca95251e70205d764147731'
  };
};

loginGov.callback = async function (body) {
  return {
    sub: 'eaf059e8-bde2-4647-8c74-4aedbe0a2091',
    iss: 'https://idp.int.identitysandbox.gov/',
    email: 'test@crossfeed.cisa.gov',
    email_verified: true
  };
};

export default loginGov;
