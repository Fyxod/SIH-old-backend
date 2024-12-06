import { verifyToken } from '../utils/jwtFuncs.js';
import config from '../config/config.js';

export default function checkAuth(role) { // role = minimum access level required (optional field)
    return (req, res, next) => {
        let token = null
        if (req.headers['isMobile'] === "true") {
            const authHeader = req.headers['authorization'];
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.error(401, 'Missing or malformed token', 'UNAUTHORIZED');
            }
            token = authHeader.split(' ')[1];
        }
        else {
            token = req.cookies?.token;
        }
        const payload = verifyToken(token);
        if (!payload) {
            return res.error(401, 'Invalid or expired token', 'UNAUTHORIZED');
        }
        if (role && (!(payload.role in config.priority) || config.priority[payload.role] < config.priority[role])) {
            return res.error(403, 'Unauthorized access', 'FORBIDDEN');
        }
        req.user = payload;
        next();
    }
}