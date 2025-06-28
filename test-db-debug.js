// Simple script to debug database state
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

async function debugDatabase() {
  try {
    // Load environment variables
    require('dotenv').config({ path: '.env.local' });
    
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const userId = 'user_1736177030395';
    
    console.log(`\n1. Checking jobs for userId: ${userId}`);
    const jobsQuery = query(collection(db, 'jobs'), where('userId', '==', userId));
    const jobsSnap = await getDocs(jobsQuery);
    console.log(`Found ${jobsSnap.size} jobs`);
    
    jobsSnap.forEach(doc => {
      const data = doc.data();
      console.log(`Job ${doc.id}: status=${data.status}, category=${data.category}, query=${data.query}`);
    });
    
    console.log(`\n2. Checking analysis results for userId: ${userId}`);
    const resultsQuery = query(collection(db, 'analysisResults'), where('userId', '==', userId));
    const resultsSnap = await getDocs(resultsQuery);
    console.log(`Found ${resultsSnap.size} analysis results`);
    
    resultsSnap.forEach(doc => {
      const data = doc.data();
      console.log(`Result ${doc.id}: category=${data.category}`);
      console.log('Analysis structure:', JSON.stringify(data.analysis, null, 2));
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

debugDatabase();
