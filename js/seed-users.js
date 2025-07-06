const { getAuth, createUserWithEmailAndPassword } = require("firebase/auth");
const { initializeApp } = require("firebase/app");

const firebaseConfig = { /* Your config from Firebase Console */ };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const testUsers = [
  { email: "itstation.cab@gmail.com", password: "hattahatta", role: "admin" },
  { email: "staff@siomaiking.test", password: "TestStaff123", role: "staff" }
];

testUsers.forEach(async (user) => {
  try {
    await createUserWithEmailAndPassword(auth, user.email, user.password);
    console.log(`User ${user.email} created`);
  } catch (error) {
    console.error(`Error creating ${user.email}:`, error.message);
  }
});
