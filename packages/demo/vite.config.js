import reactRefresh from '@vitejs/plugin-react-refresh';
import path from 'path';

/**
 * https://vitejs.dev/config/
 * @type { import('vite').UserConfig }
 */
export default {
    plugins: [reactRefresh()],
    resolve: {
        alias: [
            {
                find: /^ra-keycloak$/,
                replacement: path.resolve(__dirname, '../ra-keycloak/src'),
            },
            {
                find: /^@mui\/icons-material\/(.*)/,
                replacement: '@mui/icons-material/esm/$1',
            },
        ],
    },
    server: {
        port: 8081,
    },
    define: { 'process.env': {} },
};
