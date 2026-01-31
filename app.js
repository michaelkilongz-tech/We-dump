// Main Application
class WeDumpApp {
    constructor() {
        this.currentPage = 'home';
        this.photos = [];
        this.users = [];
        this.notifications = [];
        
        this.init();
    }
    
    async init() {
        // Wait for DOM and Firebase
        await this.waitForDependencies();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check auth state
        this.setupAuthListener();
        
        // Hide loading screen
        this.hideLoading();
    }
    
    async waitForDependencies() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        // Wait for Firebase
        await new Promise(resolve => {
            const checkFirebase = () => {
                if (window.firebaseAuth && window.firebaseDb) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }
    
    setupEventListeners() {
        // Auth buttons
        document.getElementById('loginBtn')?.addEventListener('click', () => this.handleLogin());
        document.getElementById('registerBtn')?.addEventListener('click', () => this.handleRegister());
        document.getElementById('googleLoginBtn')?.addEventListener('click', () => this.handleGoogleLogin());
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());
        
        // Form switches
        document.getElementById('showRegister')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });
        
        document.getElementById('showLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });
        
        // Navigation
        document.getElementById('menuBtn')?.addEventListener('click', () => this.toggleMenu());
        document.getElementById('closeMenu')?.addEventListener('click', () => this.closeMenu());
        document.getElementById('menuNavBtn')?.addEventListener('click', () => this.toggleMenu());
        
        // Page navigation
        document.querySelectorAll('.menu-item[data-page]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateTo(page);
                this.closeMenu();
            });
        });
        
        // Bottom nav
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
        
        // Upload
        document.getElementById('emptyBox')?.addEventListener('click', () => this.showUploadModal());
        document.getElementById('uploadNavBtn')?.addEventListener('click', () => this.showUploadModal());
        document.getElementById('newDumpBtn')?.addEventListener('click', () => this.showUploadModal());
        document.getElementById('firstDumpBtn')?.addEventListener('click', () => this.showUploadModal());
        
        // Upload modal
        document.getElementById('uploadZone')?.addEventListener('click', () => {
            document.getElementById('modalFileInput').click();
        });
        
        document.getElementById('modalFileInput')?.addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });
        
        document.getElementById('confirmUploadBtn')?.addEventListener('click', () => {
            this.handleUpload();
        });
        
        document.getElementById('cancelUploadBtn')?.addEventListener('click', () => {
            this.hideUploadModal();
        });
        
        document.getElementById('closeUploadModal')?.addEventListener('click', () => {
            this.hideUploadModal();
        });
        
        // Show password buttons
        document.querySelectorAll('.show-password').forEach(button => {
            button.addEventListener('click', function() {
                const input = this.parentElement.querySelector('input');
                const icon = this.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    input.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        });
        
        // Refresh button
        document.getElementById('refreshBtn')?.addEventListener('click', () => {
            this.loadPhotos();
        });
        
        // Enter key in login form
        document.getElementById('loginPassword')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin();
            }
        });
        
        // Enter key in register form
        document.getElementById('confirmPassword')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleRegister();
            }
        });
    }
    
    setupAuthListener() {
        authManager.addListener((event, user) => {
            if (event === 'login') {
                this.handleUserLogin(user);
            } else if (event === 'logout') {
                this.handleUserLogout();
            }
        });
        
        // Check initial auth state
        if (authManager.isAuthenticated()) {
            this.handleUserLogin(authManager.getCurrentUser());
        }
    }
    
    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        
        if (!email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }
        
        const result = await authManager.login(email, password);
        
        if (result.success) {
            this.showToast('Welcome back!', 'success');
        } else {
            this.showToast(result.error, 'error');
        }
    }
    
    async handleRegister() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        const agreeTerms = document.getElementById('agreeTerms').checked;
        
        // Validation
        if (!name || !email || !password || !confirmPassword) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showToast('Password must be at least 6 characters', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showToast('Passwords do not match', 'error');
            return;
        }
        
        if (!agreeTerms) {
            this.showToast('Please agree to the terms and conditions', 'error');
            return;
        }
        
        const result = await authManager.register(email, password, name);
        
        if (result.success) {
            this.showToast('Account created successfully!', 'success');
        } else {
            this.showToast(result.error, 'error');
        }
    }
    
    async handleGoogleLogin() {
        const result = await authManager.googleLogin();
        
        if (result.success) {
            this.showToast('Signed in with Google', 'success');
        } else {
            this.showToast(result.error, 'error');
        }
    }
    
    async handleLogout() {
        const result = await authManager.logout();
        
        if (result.success) {
            this.showToast('Logged out successfully', 'info');
        } else {
            this.showToast(result.error, 'error');
        }
    }
    
    handleUserLogin(user) {
        // Update UI
        document.getElementById('authScreen').classList.add('hidden');
        document.getElementById('appScreen').classList.remove('hidden');
        
        // Update user info
        this.updateUserInfo(user);
        
        // Load data
        this.loadPhotos();
        this.loadUsers();
        this.loadNotifications();
        
        // Start real-time listeners
        this.startRealtimeListeners();
    }
    
    handleUserLogout() {
        // Update UI
        document.getElementById('appScreen').classList.add('hidden');
        document.getElementById('authScreen').classList.remove('hidden');
        
        // Clear forms
        this.clearAuthForms();
        
        // Clear data
        this.photos = [];
        this.users = [];
        this.notifications = [];
        
        // Stop real-time listeners
        this.stopRealtimeListeners();
    }
    
    updateUserInfo(user) {
        const avatar = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=667eea&color=fff`;
        const name = user.displayName || user.email.split('@')[0];
        
        // Update in top nav
        document.getElementById('userAvatar').src = avatar;
        document.getElementById('userName').textContent = name;
        
        // Update in side menu
        document.getElementById('menuAvatar').src = avatar;
        document.getElementById('menuUserName').textContent = name;
        document.getElementById('menuUserEmail').textContent = user.email;
        
        // Update greeting
        document.getElementById('userGreeting').textContent = `Hi, ${name}`;
    }
    
    clearAuthForms() {
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('registerName').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        document.getElementById('agreeTerms').checked = false;
        
        // Show login form by default
        this.showLoginForm();
    }
    
    showLoginForm() {
        document.getElementById('loginForm').classList.add('active');
        document.getElementById('registerForm').classList.remove('active');
    }
    
    showRegisterForm() {
        document.getElementById('registerForm').classList.add('active');
        document.getElementById('loginForm').classList.remove('active');
    }
    
    toggleMenu() {
        document.getElementById('sideMenu').classList.toggle('open');
    }
    
    closeMenu() {
        document.getElementById('sideMenu').classList.remove('open');
    }
    
    navigateTo(page) {
        // Update active page
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        document.getElementById(`${page}Page`).classList.add('active');
        
        // Update active nav items
        document.querySelectorAll('.menu-item[data-page]').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.menu-item[data-page="${page}"]`)?.classList.add('active');
        
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
        
        this.currentPage = page;
        
        // Load page-specific data
        switch(page) {
            case 'home':
                this.loadPhotos();
                break;
            case 'profile':
                this.loadProfile();
                break;
            case 'friends':
                this.loadFriends();
                break;
            case 'albums':
                this.loadAlbums();
                break;
        }
    }
    
    async loadPhotos() {
        try {
            const snapshot = await firebaseDb.collection('photos')
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();
            
            this.photos = [];
            snapshot.forEach(doc => {
                this.photos.push({ id: doc.id, ...doc.data() });
            });
            
            this.renderPhotos();
            this.updateStats();
            
        } catch (error) {
            console.error('Error loading photos:', error);
            this.showToast('Failed to load photos', 'error');
        }
    }
    
    renderPhotos() {
        const wall = document.getElementById('photoWall');
        const emptyState = document.getElementById('emptyState');
        
        if (this.photos.length === 0) {
            emptyState?.classList.remove('hidden');
            return;
        }
        
        emptyState?.classList.add('hidden');
        
        wall.innerHTML = '';
        
        this.photos.forEach(photo => {
            const card = this.createPhotoCard(photo);
            wall.appendChild(card);
        });
    }
    
    createPhotoCard(photo) {
        const card = document.createElement('div');
        card.className = 'photo-card';
        
        const timeAgo = this.formatTimeAgo(photo.createdAt);
        const userAvatar = photo.userPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(photo.userName)}&background=667eea&color=fff`;
        
        card.innerHTML = `
            <img src="${photo.imageURL}" alt="Photo" class="photo-image" 
                 onerror="this.src='https://placehold.co/400x300/e0e0e0/666?text=Image+Failed+to+Load'">
            <div class="photo-content">
                <div class="photo-header">
                    <div class="photo-user">
                        <img src="${userAvatar}" alt="${photo.userName}" class="user-avatar-sm">
                        <span class="user-name-sm">${photo.userName}</span>
                    </div>
                    <span class="photo-time">
                        <i class="far fa-clock"></i> ${timeAgo}
                    </span>
                </div>
                ${photo.caption ? `<p class="photo-caption">${photo.caption}</p>` : ''}
                <div class="photo-actions">
                    <button class="action-btn like-btn" data-id="${photo.id}">
                        <i class="far fa-heart"></i>
                        <span class="like-count">${photo.likes?.length || 0}</span>
                    </button>
                    <button class="action-btn comment-btn" data-id="${photo.id}">
                        <i class="far fa-comment"></i>
                        <span class="comment-count">${photo.comments?.length || 0}</span>
                    </button>
                    ${this.isPhotoOwner(photo) ? `
                        <button class="action-btn delete-btn" data-id="${photo.id}">
                            <i class="far fa-trash-alt"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Add event listeners
        card.querySelector('.like-btn')?.addEventListener('click', (e) => {
            this.handleLikePhoto(photo.id);
        });
        
        card.querySelector('.comment-btn')?.addEventListener('click', (e) => {
            this.handleCommentPhoto(photo.id);
        });
        
        card.querySelector('.delete-btn')?.addEventListener('click', (e) => {
            this.handleDeletePhoto(photo.id);
        });
        
        return card;
    }
    
    isPhotoOwner(photo) {
        const user = authManager.getCurrentUser();
        return user && photo.userId === user.uid;
    }
    
    async handleLikePhoto(photoId) {
        const user = authManager.getCurrentUser();
        if (!user) return;
        
        try {
            const photoRef = firebaseDb.collection('photos').doc(photoId);
            const photoDoc = await photoRef.get();
            
            if (!photoDoc.exists) return;
            
            const photo = photoDoc.data();
            const likes = photo.likes || [];
            const userIndex = likes.indexOf(user.uid);
            
            if (userIndex > -1) {
                // Unlike
                likes.splice(userIndex, 1);
            } else {
                // Like
                likes.push(user.uid);
            }
            
            await photoRef.update({ likes });
            
        } catch (error) {
            console.error('Error liking photo:', error);
        }
    }
    
    async handleDeletePhoto(photoId) {
        if (!confirm('Are you sure you want to delete this photo?')) {
            return;
        }
        
        try {
            // Delete from Firestore
            await firebaseDb.collection('photos').doc(photoId).delete();
            
            // Delete from Storage (if implemented)
            // await firebaseStorage.ref().child(`photos/${photoId}`).delete();
            
            this.showToast('Photo deleted', 'success');
            
            // Reload photos
            this.loadPhotos();
            
        } catch (error) {
            console.error('Error deleting photo:', error);
            this.showToast('Failed to delete photo', 'error');
        }
    }
    
    handleCommentPhoto(photoId) {
        // TODO: Implement comment functionality
        this.showToast('Comment feature coming soon!', 'info');
    }
    
    updateStats() {
        // Update photo count
        document.getElementById('totalPhotos').textContent = this.photos.length;
        
        // Update user's upload count
        const user = authManager.getCurrentUser();
        if (user) {
            const userUploads = this.photos.filter(p => p.userId === user.uid).length;
            document.getElementById('yourUploads').textContent = userUploads;
        }
        
        // Update active users (simulated)
        const activeUsers = Math.max(1, Math.floor(this.photos.length / 5) + 1);
        document.getElementById('activeUsers').textContent = activeUsers;
    }
    
    async loadUsers() {
        try {
            const snapshot = await firebaseDb.collection('users').limit(20).get();
            
            this.users = [];
            snapshot.forEach(doc => {
                this.users.push({ id: doc.id, ...doc.data() });
            });
            
            // Update friends count
            document.getElementById('friendsCount').textContent = this.users.length - 1;
            
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }
    
    async loadNotifications() {
        try {
            const user = authManager.getCurrentUser();
            if (!user) return;
            
            const snapshot = await firebaseDb.collection('notifications')
                .where('userId', '==', user.uid)
                .where('read', '==', false)
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get();
            
            this.notifications = [];
            snapshot.forEach(doc => {
                this.notifications.push({ id: doc.id, ...doc.data() });
            });
            
            // Update notification badge
             // Update notification badge
            document.getElementById('notificationCount').textContent = this.notifications.length;
            
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }
    
    showUploadModal() {
        if (!authManager.isAuthenticated()) {
            this.showToast('Please login first', 'error');
            return;
        }
        
        document.getElementById('uploadModal').classList.remove('hidden');
        document.getElementById('previewContainer').classList.add('hidden');
        document.getElementById('uploadZone').classList.remove('hidden');
        document.getElementById('photoCaption').value = '';
        document.getElementById('confirmUploadBtn').disabled = true;
    }
    
    hideUploadModal() {
        document.getElementById('uploadModal').classList.add('hidden');
        document.getElementById('modalFileInput').value = '';
    }
    
    handleFileSelect(event) {
        const file = event.target.files[0];
        
        if (!file) return;
        
        // Validate file
        if (!file.type.startsWith('image/')) {
            this.showToast('Please select an image file', 'error');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            this.showToast('Image must be less than 5MB', 'error');
            return;
        }
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('modalPreview');
            preview.src = e.target.result;
            
            document.getElementById('previewContainer').classList.remove('hidden');
            document.getElementById('uploadZone').classList.add('hidden');
            document.getElementById('confirmUploadBtn').disabled = false;
        };
        reader.readAsDataURL(file);
    }
    
    async handleUpload() {
        const fileInput = document.getElementById('modalFileInput');
        const caption = document.getElementById('photoCaption').value.trim();
        const user = authManager.getCurrentUser();
        
        if (!fileInput.files[0]) {
            this.showToast('Please select a photo', 'error');
            return;
        }
        
        const file = fileInput.files[0];
        
        try {
            // Show loading
            document.getElementById('confirmUploadBtn').disabled = true;
            document.getElementById('confirmUploadBtn').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
            
            // Upload to Firebase Storage
            const storageRef = firebaseStorage.ref();
            const fileRef = storageRef.child(`photos/${user.uid}/${Date.now()}_${file.name}`);
            const uploadTask = await fileRef.put(file);
            
            // Get download URL
            const imageURL = await uploadTask.ref.getDownloadURL();
            
            // Save to Firestore
            await firebaseDb.collection('photos').add({
                imageURL,
                caption,
                userId: user.uid,
                userName: user.displayName || user.email.split('@')[0],
                userPhotoURL: user.photoURL || '',
                likes: [],
                comments: [],             
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Success
            this.showToast('Photo uploaded successfully!', 'success');
            this.hideUploadModal();
            
            // Reload photos
            this.loadPhotos();
            
        } catch (error) {
            console.error('Upload error:', error);
            this.showToast('Failed to upload photo', 'error');
            
            // Reset button
            document.getElementById('confirmUploadBtn').disabled = false;
            document.getElementById('confirmUploadBtn').innerHTML = '<i class="fas fa-upload"></i> Dump to Wall';
        }
    }
    
    startRealtimeListeners() {
        // Listen for new photos
        this.photosUnsubscribe = firebaseDb.collection('photos')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .onSnapshot((snapshot) => {
                const changes = snapshot.docChanges();
                
                changes.forEach(change => {
                    if (change.type === 'added') {
                        this.handleNewPhoto(change.doc.data());
                    }
                });
                
                // Reload all photos
                this.loadPhotos();
            });
        
        // Listen for notifications
        const user = authManager.getCurrentUser();
        if (user) {
            this.notificationsUnsubscribe = firebaseDb.collection('notifications')
                .where('userId', '==', user.uid)
                .where('read', '==', false)
                .onSnapshot((snapshot) => {
                    this.loadNotifications();
                });
        }
    }
    
    stopRealtimeListeners() {
        if (this.photosUnsubscribe) {
            this.photosUnsubscribe();
        }
        if (this.notificationsUnsubscribe) {
            this.notificationsUnsubscribe();
        }
    }
    
    handleNewPhoto(photo) {
        // Send notification to all users (except the uploader)
        const user = authManager.getCurrentUser();
        if (user && photo.userId !== user.uid) {
            this.sendNotification(photo.userId, 'new_photo', {
                userName: photo.userName,
                photoId: photo.id
            });
        }
    }
    
    async sendNotification(userId, type, data) {
        try {
            await firebaseDb.collection('notifications').add({
                userId,
                type,
                data,
                read: false,
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }
    
    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };
        
        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval}${unit.charAt(0)} ago`;
            }
        }
        
        return 'Just now';
    }
    
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        
        toast.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Remove after duration
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    hideLoading() {
        document.getElementById('loadingScreen').classList.add('hidden');
    }
    
    // Page-specific loaders (to be implemented)
    async loadProfile() {
        // TODO: Implement profile page
    }
    
    async loadFriends() {
        // TODO: Implement friends page
    }
    
    async loadAlbums() {
        // TODO: Implement albums page
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WeDumpApp();
});