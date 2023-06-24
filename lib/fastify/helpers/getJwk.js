import buildGetJwks from "get-jwks";

const getJwks = buildGetJwks({
  providerDiscovery: true,
});

export const getJwk = (
  request,
  token
) => {
  const {
    header: { kid, alg },
    payload: { iss },
  } = token;
  return getJwks.getPublicKey({ alg, domain: iss, kid });
};