import { getProtectedResourceHandlers } from '../../../../src/auth/protected-resource';

const { GET, OPTIONS } = getProtectedResourceHandlers({});

export { GET, OPTIONS };
