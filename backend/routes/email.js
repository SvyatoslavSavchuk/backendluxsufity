import express from 'express'
import nodemailer from 'nodemailer'

const router = express.Router();

// лимиты
const LIMITS = {
    name: 50,
    email: 100,
    message: 300,
    phoneNumber: 20
};

router.post('/send-email', async (req, res) => {
    const { email, name, message, phoneNumber } = req.body;
    // защита от пустых данных
    if (!email || !name || !message) {
        return res.status(400).json({
            message: 'Обязательные поля не заполнены'
        });
    }
    // проверки длины
    if (name.length > LIMITS.name) {
        return res.status(400).json({
            message: `Imię nie może być dłuższe niż ${LIMITS.name} znaków`
        });
    }
    if (email.length > LIMITS.email) {
        return res.status(400).json({
            message: `E-mail nie może mieć więcej niż ${LIMITS.email} znaków`
        });
    }
    if (message.length > LIMITS.message) {
        return res.status(400).json({
            message: `Wiadomość nie może być dłuższa niż ${LIMITS.message} znaków`
        });
    }
    if (phoneNumber && phoneNumber.length > LIMITS.phoneNumber) {
        return res.status(400).json({
            message: `Numer telefonu nie może być dłuższy niż ${LIMITS.phoneNumber} znaków`
        });
    }
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'luxsufity.warszawa@gmail.com',
            pass: process.env.Emeil_Pass
        }
    });
    const mailOptions = {
        from: `"${name}" <luxsufity.warszawa@gmail.com>`,
        replyTo: email,
        to: 'luxsufity.warszawa@gmail.com',
        subject: `Wiadomość od ${name}`,
        text: `
            Имя: ${name}
            Email: ${email}
            Телефон: ${phoneNumber || 'не указан'}

            Сообщение:
            ${message}`};
    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Wiadomość została wysłana' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Błąd podczas wysyłania wiadomości' });
    }
});

export default router;