import { initializeApp } from 'firebase/app'
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

// Firebase configuration - you'll need to replace this with your actual Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "demo-messaging-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "demo-app-id",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "demo-measurement-id"
}

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo-api-key" &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN !== "demo-auth-domain"
  )
}

// Initialize Firebase only if configured
let app: any = null
let auth: any = null
let database: any = null

if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    database = getDatabase(app)

    // Set persistence to local for better user experience
    if (typeof window !== 'undefined') {
      setPersistence(auth, browserLocalPersistence)
    }
    console.log('Firebase initialized successfully')
  } catch (error) {
    console.error('Error initializing Firebase:', error)
  }
} else {
  console.warn('Firebase not configured. Using local storage only.')
}

export { app, auth, database }

// Helper functions for Firebase operations
export const firebaseHelpers = {
  // Check if Firebase is available
  isAvailable: () => {
    return isFirebaseConfigured() && app !== null
  },

  // Save user data to Firebase
  saveUserData: async (userId: string, userData: any) => {
    if (!firebaseHelpers.isAvailable()) {
      console.warn('Firebase not available, skipping save to Firebase')
      return false
    }

    try {
      await database.ref(`users/${userId}`).set({
        ...userData,
        lastUpdated: new Date().toISOString(),
        deviceInfo: typeof window !== 'undefined' ? {
          platform: navigator.platform,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`
        } : null
      })
      return true
    } catch (error) {
      console.error('Error saving user data to Firebase:', error)
      return false
    }
  },

  // Load user data from Firebase
  loadUserData: async (userId: string) => {
    if (!firebaseHelpers.isAvailable()) {
      console.warn('Firebase not available, skipping load from Firebase')
      return null
    }

    try {
      const snapshot = await database.ref(`users/${userId}`).once('value')
      return snapshot.val()
    } catch (error) {
      console.error('Error loading user data from Firebase:', error)
      return null
    }
  },

  // Save game settings to Firebase
  saveGameSettings: async (settings: any) => {
    if (!firebaseHelpers.isAvailable()) {
      console.warn('Firebase not available, skipping save to Firebase')
      return false
    }

    try {
      await database.ref('gameSettings').set({
        ...settings,
        lastUpdated: new Date().toISOString()
      })
      return true
    } catch (error) {
      console.error('Error saving game settings to Firebase:', error)
      return false
    }
  },

  // Load game settings from Firebase
  loadGameSettings: async () => {
    if (!firebaseHelpers.isAvailable()) {
      console.warn('Firebase not available, skipping load from Firebase')
      return null
    }

    try {
      const snapshot = await database.ref('gameSettings').once('value')
      return snapshot.val()
    } catch (error) {
      console.error('Error loading game settings from Firebase:', error)
      return null
    }
  },

  // Save transaction to Firebase
  saveTransaction: async (transaction: any) => {
    if (!firebaseHelpers.isAvailable()) {
      console.warn('Firebase not available, skipping save to Firebase')
      return null
    }

    try {
      const newTransactionRef = database.ref('transactions').push()
      await newTransactionRef.set({
        ...transaction,
        timestamp: new Date().toISOString()
      })
      return newTransactionRef.key
    } catch (error) {
      console.error('Error saving transaction to Firebase:', error)
      return null
    }
  },

  // Get user transactions
  getUserTransactions: async (userId: string) => {
    if (!firebaseHelpers.isAvailable()) {
      console.warn('Firebase not available, skipping load from Firebase')
      return { sent: [], received: [] }
    }

    try {
      const snapshot = await database.ref('transactions')
        .orderByChild('senderId')
        .equalTo(userId)
        .once('value')
      
      const sentTransactions = snapshot.val() || {}
      
      const receivedSnapshot = await database.ref('transactions')
        .orderByChild('receiverId')
        .equalTo(userId)
        .once('value')
      
      const receivedTransactions = receivedSnapshot.val() || {}
      
      return {
        sent: Object.values(sentTransactions),
        received: Object.values(receivedTransactions)
      }
    } catch (error) {
      console.error('Error getting user transactions:', error)
      return { sent: [], received: [] }
    }
  }
}