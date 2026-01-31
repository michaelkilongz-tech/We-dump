// Authentication Module
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authListeners = [];
        
        // Check if Firebase is loaded
        if (!window.firebaseAuth) {
            console.error('Firebase not loaded');
            return;
        }
        
        this.init();
    }
    
    init() {
        // Listen for auth state changes
        firebaseAuth.onAuthStateChanged((user) => {
            this.handleAuthStateChange(user);
        });
    }
    
    handleAuthStateChange(user) {
        this.currentUser = user;
        
        if (user) {
            console.log('User signed in:', user.email);
            this.updateUserProfile(user);
            this.notifyListeners('login', user);
        } else {
            console.log('User signed out');
            this.notifyListeners('logout');
        }
    }
    
    async login(email, password) {
        try {
            const result = await firebaseAuth.signInWithEmailAndPassword(email, password);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }
    
    async register(email, password, displayName) {
        try {
            // Create user
            const result = await firebaseAuth.createUserWithEmailAndPassword(email, password);
            
            // Update profile
            await result.user.updateProfile({
                displayName: displayName
            });
            
            // Create user document in Firestore
            await this.createUserDocument(result.user, displayName);
            
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }
    
    async googleLogin() {
        try {
            const result = await firebaseAuth.signInWithPopup(googleProvider);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Google login error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }
    
    async logout() {
        try {
            await firebaseAuth.signOut();
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async updateUserProfile(user) {
        try {
            // Update Firestore user document
            await firebaseDb.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || user.email.split('@')[0],
                photoURL: user.photoURL || '',
                lastLogin: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error('Update profile error:', error);
        }
    }
    
    async createUserDocument(user, displayName) {
        try {
            await firebaseDb.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: user.email,
                displayName: displayName || user.email.split('@')[0],
                photoURL: user.photoURL || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                preferences: {
                    theme: 'light',
                    notifications: true
                }
            });
        } catch (error) {
            console.error('Create user document error:', error);
        }
    }
    
    getErrorMessage(error) {
        switch(error.code) {
            case 'auth/invalid-email':
                return 'Invalid email address';
            case 'auth/user-disabled':
                return 'This account has been disabled';
            case 'auth/user-not-found':
                return 'No account found with this email';
            case 'auth/wrong-password':
                return 'Incorrect password';
            case 'auth/email-already-in-use':
                return 'Email already in use';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters';
            case 'auth/operation-not-allowed':
                return 'Email/password accounts are not enabled';
            case 'auth/network-request-failed':
                return 'Network error. Please check your connection';
            default:
                return error.message || 'An error occurred';
        }
    }
    
    addListener(callback) {
        this.authListeners.push(callback);
    }
    
    notifyListeners(event, data) {
        this.authListeners.forEach(callback => {
            callback(event, data);
        });
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    isAuthenticated() {
        return this.currentUser !== null;
    }
    
    async resetPassword(email) {
        try {
            await firebaseAuth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error) };
        }
    }
}

// Initialize Auth Manager
window.authManager = new AuthManager();

