module.exports = {
  default: {
    requireModule: ['ts-node/register/transpile-only'],
    require: ['tests/bdd/steps/**/*.ts'],
    paths: ['tests/bdd/features/**/*.feature'],
  },
};
