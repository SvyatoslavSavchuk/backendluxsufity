import express from 'express';
const router = express.Router();

import bcrypt from 'bcrypt';
import User from './../models/user.js'; // обязательно .js в пути, если ты в ES-модуле
import jwt from 'jsonwebtoken';

// Signin 
router.post('/signin', (req, res) => {
    let { userEmail, password } = req.body;
    userEmail = userEmail.trim();
    password = password.trim();

    if (userEmail === '' || password === '') {
        return res.json({
            status: 'FAILED',
            message: 'Empty credentials supplied'
        });
    }

    // check if user exists
    User.findOne({ userEmail })
        .then(user => {
            if (!user) {
                return res.json({
                    status: 'FAILED',
                    message: 'Неверный email'
                });
            }

            // compare password
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if (!isMatch) {
                        return res.json({
                            status: 'FAILED',
                            message: 'Пароль введен не правильно'
                        });
                    }

                    // Create JWT token
                    const token = jwt.sign(
                        { id: user._id, email: user.userEmail },
                        process.env.JWT_SECRET, 
                        { expiresIn: '1h' }
                    );
                    res.json({
                        status: 'SUCCESS',
                        message: 'Signin successful',
                        token,
                        user: {
                            id: user._id,
                            name: user.name,
                            email: user.userEmail
                        }
                    });
                })
                .catch(err => {
                    console.log(err);
                    res.json({
                        status: 'FAILED',
                        message: 'An error occurred while checking password'
                    });
                });
        })
        .catch(err => {
            console.log(err);
            res.json({
                status: 'FAILED',
                message: 'An error occurred while checking for existing user'
            });
        });
});


export default router;