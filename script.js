// SPIMF SYSTEM - OPTIMIZED WITH COUNTDOWN
class SPIMFSystem {
    constructor() {
        this.currentUser = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.loadingInterval = null;
        this.APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxrj3hY8hAxyn1HUFiYnras66lu38BQRzOk9xu7d51KQrm02-uA_jQpG2hvbbS1YZOE/exec';
        this.init();
    }

    init() {
        console.log('🚀 SPIMF System Initializing...');
        this.setupEventListeners();
        this.showLoadingScreen();
        this.checkSystemStatus();
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading');
        const loadingText = loadingScreen.querySelector('h3');
        const loadingSubtext = loadingScreen.querySelector('p');
        
        loadingScreen.classList.remove('hidden');
        
        let dots = 0;
        let seconds = 0;
        this.loadingInterval = setInterval(() => {
            dots = (dots + 1) % 4;
            seconds++;
            
            loadingText.innerHTML = `Memuatkan SPIMF Sistem${'.'.repeat(dots)}`;
            loadingSubtext.innerHTML = `Loading: ${seconds}s | Sistem sedang dimuatkan`;
            
            // Auto timeout setelah 20 saat
            if (seconds >= 20) {
                this.hideLoadingScreen();
                this.showError('Sistem timeout. Sila refresh page atau cuba lagi nanti.', true);
            }
        }, 1000);
    }

    hideLoadingScreen() {
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
        }
        document.getElementById('loading').classList.add('hidden');
    }

    async checkSystemStatus() {
        try {
            console.log('🔍 Checking system status...');
            const response = await this.callApi('GET', this.APPS_SCRIPT_URL);
            
            if (response.status === 'SUCCESS' || response.connected) {
                console.log('✅ System connected successfully');
                setTimeout(() => {
                    this.hideLoadingScreen();
                    this.showLoginScreen();
                }, 1000);
            } else {
                this.showError('Sistem tidak dapat diakses. Sila cuba lagi.', true);
            }
        } catch (error) {
            console.error('❌ System check failed:', error);
            this.showError('Gagal menyambung ke sistem SPIMF. Sila check connection internet.', true);
        }
    }

    async callApi(method = 'GET', url, data = null) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const options = {
                method: method,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            if (data && method !== 'GET') {
                options.body = JSON.stringify(data);
            }

            console.log(`🌐 API Call: ${method} ${url}`);
            const response = await fetch(url, options);
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();

        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout. Sila check connection anda.');
            }
            throw error;
        }
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Navigation tabs
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.switchTab(e.currentTarget.dataset.tab);
            });
        });

        // Profile form
        document.getElementById('profileForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile();
        });

        // Media form
        document.getElementById('mediaForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateMedia();
        });

        // Social media toggle
        document.getElementById('hasSocialMedia')?.addEventListener('change', (e) => {
            this.toggleSocialMediaFields(e.target.value === 'YES');
        });

        // Copy buttons
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.copyToClipboard(e.currentTarget.dataset.target);
            });
        });

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });
    }

    async handleLogin() {
        const formData = new FormData(document.getElementById('loginForm'));
        const loginData = {
            phoneNumber: formData.get('phoneNumber'),
            idCard: formData.get('idCard'),
            kodeUser: formData.get('kodeUser')
        };

        const btn = document.querySelector('.login-btn');
        const originalText = btn.innerHTML;
        
        // Show loading state
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengesahkan...';
        btn.disabled = true;

        try {
            const response = await this.callApi('POST', this.APPS_SCRIPT_URL, {
                action: 'login',
                ...loginData
            });

            if (response.success) {
                this.showMessage('loginMessage', '✅ Login berjaya! Memuatkan data...', 'success');
                this.currentUser = response.userData;
                
                setTimeout(() => {
                    this.showAppScreen();
                    this.loadUserData();
                }, 1000);
                
            } else {
                this.showMessage('loginMessage', response.message, 'error');
            }
        } catch (error) {
            this.showMessage('loginMessage', '❌ Ralat sistem: ' + error.message, 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    async updateProfile() {
        const formData = new FormData(document.getElementById('profileForm'));
        const updates = {};
        
        formData.forEach((value, key) => {
            updates[key] = value;
        });

        const btn = document.querySelector('#profileForm .btn-primary');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        btn.disabled = true;

        try {
            const response = await this.callApi('POST', this.APPS_SCRIPT_URL, {
                action: 'updateProfile',
                row: this.currentUser.row,
                updates: updates
            });

            if (response.success) {
                this.showMessage('profileMessage', '✅ Data berjaya dikemaskini!', 'success');
                Object.assign(this.currentUser, updates);
            } else {
                this.showMessage('profileMessage', response.message, 'error');
            }
        } catch (error) {
            this.showMessage('profileMessage', '❌ Gagal save: ' + error.message, 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    async updateMedia() {
        const formData = new FormData(document.getElementById('mediaForm'));
        const updates = {};
        
        formData.forEach((value, key) => {
            updates[key] = value;
        });

        const btn = document.querySelector('#mediaForm .btn-primary');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        btn.disabled = true;

        try {
            const response = await this.callApi('POST', this.APPS_SCRIPT_URL, {
                action: 'updateMedia',
                row: this.currentUser.row,
                updates: updates
            });

            if (response.success) {
                this.showMessage('mediaMessage', '✅ Media sosial berjaya dikemaskini!', 'success');
                Object.assign(this.currentUser, updates);
                this.toggleSocialMediaFields(updates['DO YOU HAVE A SOCIAL MEDIA ACCOUNT AND HAVE MORE THAN 50 FOLLOWERS'] === 'YES');
            } else {
                this.showMessage('mediaMessage', response.message, 'error');
            }
        } catch (error) {
            this.showMessage('mediaMessage', '❌ Gagal save media: ' + error.message, 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    loadUserData() {
        if (!this.currentUser) return;

        // Update welcome message
        document.getElementById('userName').textContent = this.currentUser['YOUR NAME'] || '-';
        
        // Update profile form
        this.populateForm('profileForm', this.currentUser);

        // Update media form
        this.populateForm('mediaForm', this.currentUser);
        this.toggleSocialMediaFields(this.currentUser['DO YOU HAVE A SOCIAL MEDIA ACCOUNT AND HAVE MORE THAN 50 FOLLOWERS'] === 'YES');

        // Update personality info
        document.getElementById('likeToRepair').textContent = this.currentUser['DO YOU LIKE TO REPAIR'] || '-';
        document.getElementById('favoriteSubject').textContent = this.currentUser['YOUR FAVORITE SUBJECT'] || '-';
        document.getElementById('difficultSubject').textContent = this.currentUser['THE SUBJECT YOU FIND MOST DIFFICULT'] || '-';

        // Update additional info
        document.getElementById('knowUsAs').textContent = this.currentUser['YOU KNOW US AS'] || '-';
        document.getElementById('currentDate').textContent = this.currentUser['CURRENT DATE'] || '-';
        document.getElementById('score').textContent = this.currentUser['SCORE'] || '-';
        document.getElementById('idCardDisplay').textContent = this.currentUser['ID CARD REGISTRATION'] || '-';
        document.getElementById('kodeUserDisplay').textContent = this.currentUser['KODE USER'] || '-';
        document.getElementById('membershipAccount').textContent = this.currentUser['MEMBERSHIP ACCOUNT'] || '-';
        document.getElementById('membershipPassword').textContent = this.currentUser['MEMBERSHIP PASSWORD ACCOUNT'] || '-';

        // Update account status
        this.updateAccountStatus(this.currentUser['STATUS ACCOUNT']);
    }

    populateForm(formId, data) {
        const form = document.getElementById(formId);
        const inputs = form.querySelectorAll('input, select');
        
        inputs.forEach(input => {
            const fieldName = input.name;
            if (data[fieldName] && data[fieldName] !== '') {
                input.value = data[fieldName];
            }
        });
    }

    toggleSocialMediaFields(show) {
        const fields = document.getElementById('socialMediaFields');
        if (show) {
            fields.classList.remove('hidden');
        } else {
            fields.classList.add('hidden');
        }
    }

    showLoginScreen() {
        document.getElementById('loginScreen').classList.remove('hidden');
    }

    showAppScreen() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
    }

    switchTab(tabName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }

    updateAccountStatus(status) {
        const statusText = document.getElementById('statusText');
        const statusBadge = document.getElementById('statusBadge');
        
        const isActive = status === '✅AKTIF';
        statusText.textContent = isActive ? 'Sistem Aktif' : 'Sistem Tidak Aktif';
        
        if (statusBadge) {
            statusBadge.className = `status-badge ${isActive ? 'active' : 'inactive'}`;
            statusBadge.innerHTML = `<i class="fas fa-circle"></i><span>${status}</span>`;
        }
    }

    logout() {
        if (confirm('Adakah anda pasti ingin log keluar?')) {
            this.currentUser = null;
            document.getElementById('app').classList.add('hidden');
            document.getElementById('loginScreen').classList.remove('hidden');
            document.getElementById('loginForm').reset();
        }
    }

    copyToClipboard(targetId) {
        const text = document.getElementById(targetId).textContent;
        navigator.clipboard.writeText(text).then(() => {
            const btn = event.currentTarget;
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            btn.style.background = '#10b981';
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = '';
            }, 2000);
        });
    }

    showMessage(elementId, message, type) {
        const messageEl = document.getElementById(elementId);
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.className = `message ${type}`;
            messageEl.classList.remove('hidden');

            setTimeout(() => {
                messageEl.classList.add('hidden');
            }, 5000);
        }
    }

    showError(message, showRetry = false) {
        this.hideLoadingScreen();
        
        const errorHtml = `
            <div class="error-screen">
                <div class="error-content">
                    <div class="error-icon">❌</div>
                    <h3>System Error</h3>
                    <p>${message}</p>
                    ${showRetry ? '<button class="retry-btn" onclick="location.reload()">Cuba Lagi</button>' : ''}
                </div>
            </div>
        `;
        
        document.body.innerHTML += errorHtml;
    }
}

// Initialize system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SPIMFSystem();
});

// Add CSS for error screen
const style = document.createElement('style');
style.textContent = `
    .error-screen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        color: white;
    }
    
    .error-content {
        background: white;
        padding: 40px;
        border-radius: 15px;
        text-align: center;
        max-width: 400px;
        margin: 20px;
        color: #333;
    }
    
    .error-icon {
        font-size: 64px;
        margin-bottom: 20px;
        color: #e74c3c;
    }
    
    .retry-btn {
        background: #3498db;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        margin-top: 20px;
    }
    
    .retry-btn:hover {
        background: #2980b9;
    }
    
    .loading-screen {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
`;
document.head.appendChild(style);
