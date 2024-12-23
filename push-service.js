const webpush = require('web-push');
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Générer des clés VAPID
const vapidKeys = webpush.generateVAPIDKeys();

// Configuration des clés VAPID
webpush.setVapidDetails(
    'mailto:votre@email.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

// Stockage des abonnements (en production, utilisez une base de données)
let subscriptions = [];

// Route pour enregistrer un nouvel abonnement
app.post('/subscribe', (req, res) => {
    const subscription = req.body;
    subscriptions.push(subscription);
    res.status(201).json({});
});

// Route pour envoyer une notification
app.post('/send-notification', async (req, res) => {
    const { title, body } = req.body;
    const payload = JSON.stringify({ title, body });

    for (let subscription of subscriptions) {
        try {
            await webpush.sendNotification(subscription, payload);
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification:', error);
        }
    }

    res.status(200).json({ message: 'Notifications envoyées' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur de notifications démarré sur le port ${PORT}`);
    console.log('Clés VAPID générées :');
    console.log('Public Key:', vapidKeys.publicKey);
    console.log('Private Key:', vapidKeys.privateKey);
});
