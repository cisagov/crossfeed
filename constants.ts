// TODO: Explore alternate ways to implement DRY

const CORS_OPTIONS = {
  origin: [/crossfeed\.cyber\.dhs\.gov$/, /localhost$/],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};
