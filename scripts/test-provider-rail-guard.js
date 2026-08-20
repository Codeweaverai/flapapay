process.env.ENVIRONMENT_CONTEXT_ENABLED = 'true';
process.env.SANDBOX_PROVIDER_ENABLED = 'false';

const contextModulePath = process.env.FLAPAPAY_ENV_CONTEXT_PATH || './current_environmentContext';
const {
    assertProviderRailSafe,
    EnvironmentError,
} = require(contextModulePath);

let blocked = false;
try {
    assertProviderRailSafe({ environmentKind: 'sandbox' }, 'Lenco');
} catch (error) {
    blocked = error instanceof EnvironmentError
        && error.code === 'SANDBOX_PROVIDER_DISABLED'
        && error.status === 409;
}
if (!blocked) throw new Error('sandbox provider rail was not blocked');

assertProviderRailSafe({ environmentKind: 'live' }, 'Stripe');
process.env.SANDBOX_PROVIDER_ENABLED = 'true';
assertProviderRailSafe({ environmentKind: 'sandbox' }, 'PawaPay');

console.log('provider rail guard test passed');
