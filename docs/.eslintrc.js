module.exports = {
  globals: {
    __PATH_PREFIX__: true,
  },
  extends: 'react-app',
  rules: {
    'jsx-a11y/label-has-associated-control': [
    'error',
    {
      'labelComponents': [],
      'labelAttributes': [],
      'controlComponents': [],
      'assert': 'htmlFor',
      'depth': 25
    }
  ],
}