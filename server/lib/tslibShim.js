/**
 * Metro shim for `tslib`. The passkey plugin's attestation parsers (@peculiar/asn1-*,
 * @peculiar/x509, via @simplewebauthn/server) are ESM compiled with `importHelpers` and
 * read `tslib.default.__extends`. Metro loads tslib's CJS build, where `.default` is
 * undefined, so the whole Better Auth handler 500s. Re-export the helpers AND a
 * self-referencing `default` so both `tslib.__extends` and `tslib.default.__extends` work.
 *
 * `require("tslib/tslib.js")` (not "tslib") sidesteps the resolver alias below, so there's
 * no resolution loop.
 */
const tslib = require("tslib/tslib.js");
module.exports = tslib;
module.exports.default = tslib;
