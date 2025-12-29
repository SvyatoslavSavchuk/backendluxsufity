import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1]; // 'Bearer <token>'
    if (!token) {
        return res.status(401).json({ message: 'Access denied. Malformed token.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token has expired.' });
            } else {
                return res.status(403).json({ message: 'Invalid token.' });
            }
        }

        req.user = decoded; // например: { id, email, iat, exp }
        next(); // всё ок
    });
};
