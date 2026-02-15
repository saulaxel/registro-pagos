import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDWOm3nqCTQwUGOA07kIV4fhfvxqkaY0VA",
    authDomain: "pagos-8f2e6.firebaseapp.com",
    projectId: "pagos-8f2e6",
    storageBucket: "pagos-8f2e6.firebasestorage.app",
    messagingSenderId: "753332216176",
    appId: "1:753332216176:web:ac421031c2f421f020afb5"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
