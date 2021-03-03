'use strict';
exports.handler = (event, context, callback) => {
  const response = event.Records[0].cf.response;
  const headers = response.headers;

  headers['strict-transport-security'] = [
    {
      key: 'Strict-Transport-Security',
      value: 'max-age=31536000; includeSubdomains; preload'
    }
  ];

  callback(null, response);
};
