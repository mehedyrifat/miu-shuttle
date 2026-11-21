// Firebase SDKs
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyAskclVg2sPSLbiwjSxZJ8GnnU0C4YUsb4",
  authDomain: "miu-shuttle-a33a6.firebaseapp.com",
  projectId: "miu-shuttle-a33a6",
  storageBucket: "miu-shuttle-a33a6.firebasestorage.app",
  messagingSenderId: "62819165754",
  appId: "1:62819165754:web:4a5d7618197e6fcba5f703",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon-192x192.png", 
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});