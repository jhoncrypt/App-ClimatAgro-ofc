
"use client";

import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// This is a placeholder for the actual Firebase config.
// In a real app, this would be loaded securely.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isConfigValid = (config: any) => {
  return config.apiKey && config.projectId && config.appId;
};


export const setupFirebaseMessaging = async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
        return;
    }

    if (!isConfigValid(firebaseConfig)) {
        console.warn('Firebase configuration is incomplete. Skipping Firebase Messaging setup. Please check your environment variables.');
        return;
    }

    try {
        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);

        // Encode the config to pass it as a URL parameter
        const encodedFirebaseConfig = encodeURIComponent(JSON.stringify(firebaseConfig));
        
        const registration = await navigator.serviceWorker.register(
            `/firebase-messaging-sw.js?firebaseConfig=${encodedFirebaseConfig}`
        );

        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            console.log('Notification permission granted.');
            // TODO: VAPID key required.
            // The following code is commented out because it requires a valid VAPID key.
            // To enable push notifications, you need to:
            // 1. Get your VAPID key from the Firebase console (Project Settings > Cloud Messaging > Web configuration).
            // 2. Add it to the .env file as NEXT_PUBLIC_FIREBASE_VAPID_KEY.
            // 3. Uncomment the code below.
            /*
            const currentToken = await getToken(messaging, { 
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                serviceWorkerRegistration: registration 
            });

            if (currentToken) {
                console.log('FCM Token:', currentToken);
                // You would typically send this token to your server to store it
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
            */
        } else {
            console.log('Unable to get permission to notify.');
        }

        onMessage(messaging, (payload) => {
            console.log('Message received. ', payload);
            // Customize notification here
            const notificationTitle = payload.notification?.title || 'New Notification';
            const notificationOptions = {
                body: payload.notification?.body || '',
                icon: payload.notification?.image,
            };
            new Notification(notificationTitle, notificationOptions);
        });

    } catch(err) {
        console.error('An error occurred while setting up Firebase Messaging.', err);
    }
};
