// SPIMF SYSTEM - OPTIMIZED FOR FAST LOADING
class SPIMFSystem {
    constructor() {
        this.currentUser = null;
        this.isSystemActive = false;
        this.retryCount = 0;
        this.maxRetries = 2;
        this.loadingStartTime = null;
        this.loadingInterval = null;
        this.init();
    }

    init() {
        console.log('🚀 SPIMF System Initializing...');
        this.setupEventListeners();
        this.showLoadingScreen();
        this.checkSystemStatus();
    }

    showLoadingScreen() {
        this.loadingStartTime = Date.now();
        const loadingScreen = document.getElementById('loading');
        const loadingText = loadingScreen.querySelector('h3');
        const loadingSubtext = loadingScreen.querySelector('p');
        
        loadingScreen.classList.remove('hidden');
        
        let dots = 0;
        this.loadingInterval = setInterval(() => {
            dots = (dots + 1) % 4;
            const elapsed = Math.floor((Date.now() - this.loadingStartTime) / 1000);
            
            loadingText.innerHTML = `Memuatkan SPIMF Sistem${'.'.repeat(dots)}`;
            loadingSubtext.innerHTML = `Loading: ${elapsed}s | Sistem sedang dimuatkan`;
            
            // Auto timeout setelah 15 saat
            if (elapsed >= 15) {
                this.hideLoadingScreen();
                this.showError('Sistem timeout. Sila refresh page.', true);
            }
        }, 500);
    }

    hideLoadingScreen() {
        if (this.loadingInterval) {
            clearInterval(this.loadingInterval);
            this.loadingInterval = null;
        }
        document.getElementById('loading').classList.add('hidden');
    }

    showCountdownLoader(message, duration = 10) {
        return new Promise((resolve) => {
            const loader = document.createElement('div');
            loader.className = 'countdown-loader';
            loader.innerHTML = `
                <div class="countdown-content">
                    <div class="countdown-spinner"></div>
                    <h4>${message}</h4>
                    <div class="countdown-timer">
                        <span class="countdown-number">${duration}</span>s
                    </div>
                    <p>Sila tunggu sebentar...</p>
                </div>
            `;
            
            document.body.appendChild(loader);
            
            let timeLeft = duration;
            const timerElement = loader.querySelector('.countdown-number');
            const timerInterval = setInterval(() => {
                timeLeft--;
                timerElement.textContent = timeLeft;
                
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    loader.remove();
                    resolve(false); // Timeout
                }
            }, 1000);
            
            // Untuk cancel manual jika operation selesai
            return {
                complete: () => {
                    clearInterval(timerInterval);
                    loader.remove();
                    resolve(true);
                },
                timeout: () => {
                    clearInterval(timerInterval);
                    loader.remove();
                    resolve(false);
                }
            };
        });
    }

    async checkSystemStatus() {
        console.log('🔍 Checking system status...');
        
        const countdown = await this.showCountdownLoader('Menyambung ke Server', 8);
        if (!countdown) {
            this.showError('Gagal menyambung ke server. Timeout.', true);
            return;
        }

        try {
            const response = await this.callApi('GET', 'https://script.google.com/macros/s/AKfycbxrj3hY8hAxyn1HUFiYnras66lu38BQRzOk9xu7d51KQrm02-uA_jQpG2hvbbS1YZOE/exec');
            
            if (response.connected) {
                console.log('✅ System connected successfully');
                this.hideLoadingScreen();
                this.showLoginScreen();
            } else {
                this.showError('Sistem tidak dapat diakses. Sila cuba lagi.', true);
            }
        } catch (error) {
            console.error('❌ System check failed:', error);
            this.showError('Gagal menyambung ke sistem SPIMF.', true);
        }
    }

    async callApi(method = 'GET', url, data = null) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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

            const result = await response.json();
            console.log('✅ API Response:', result);
            return result;

        } catch (error) {
            clearTimeout(timeoutId);
            console.error('❌ API Error:', error);
            
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

        // Navigation
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

        const countdown = await this.showCountdownLoader('Mengesahkan Maklumat Login', 10);
        if (!countdown) {
            this.showMessage('loginMessage', 'Login timeout. Sila cuba lagi.', 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        try {
            const response = await this.callApi('POST', 
                'https://script.google.com/macros/s/AKfycbxrj3hY8hAxyn1HUFiYnras66lu38BQRzOk9xu7d51KQrm02-uA_jQpG2hvbbS1YZOE/exec',
                {
                    action: 'login',
                    ...loginData
                }
            );

            if (response.success) {
                this.showMessage('loginMessage', '✅ Login berjaya! Memuatkan data...', 'success');
                this.currentUser = response.userData;
                
                setTimeout(() => {
                    this.showAppScreen();
                    this.loadUserData();
                }, 1000);
                
            } else {
                this.showMessage('loginMessage', response.message, 'error');
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } catch (error) {
            this.showMessage('loginMessage', '❌ Ralat sistem: ' + error.message, 'error');
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

        const countdown = await this.showCountdownLoader('Menyimpan Perubahan', 8);
        if (!countdown) {
            this.showMessage('profileMessage', 'Save timeout. Sila cuba lagi.', 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        try {
            const response = await this.callApi('POST',
                'https://script.google.com/macros/s/AKfycbxrj3hY8hAxyn1HUFiYnras66lu38BQRzOk9xu7d51KQrm02-uA_jQpG2hvbbS1YZOE/exec',
                {
                    action: 'updateProfile',
                    row: this.currentUser.row,
                    updates: updates
                }
            );

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

        const countdown = await this.showCountdownLoader('Mengemaskini Media', 6);
        if (!countdown) {
            this.showMessage('mediaMessage', 'Save timeout. Sila cuba lagi.', 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }

        try {
            const response = await this.callApi('POST',
                'https://script.google.com/macros/s/AKfycbxrj3hY8hAxyn1HUFiYnras66lu38BQRzOk9xu7d51KQrm02-uA_jQpG2hvbbS1YZOE/exec',
                {
                    action: 'updateMedia',
                    row: this.currentUser.row,
                    updates: updates
                }
            );

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
        document.getElementById('welcomeMessage').textContent = 
            `Hai, ${this.currentUser['YOUR NAME'] || '-'}! Selamat kembali di SPIMF`;

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
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }

    updateAccountStatus(status) {
        const statusText = document.getElementById('statusText');
        const accountStatusText = document.getElementById('accountStatusText');
        const statusBadge = document.getElementById('statusBadge');
        
        const isActive = status === '✅AKTIF';
        
        statusText.textContent = isActive ? 'Sistem Aktif' : 'Sistem Tidak Aktif';
        accountStatusText.textContent = `Status: ${status}`;
        
        statusBadge.className = `status-badge ${isActive ? 'active' : 'inactive'}`;
        statusBadge.innerHTML = `<i class="fas fa-circle"></i><span>${status}</span>`;
        
        const systemStatus = document.getElementById('systemStatus');
        systemStatus.className = `system-status ${isActive ? 'active' : 'inactive'}`;
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
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }

    showMessage(elementId, message, type) {
        const messageEl = document.getElementById(elementId);
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        messageEl.classList.remove('hidden');

        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 5000);
    }

    showError(message, showRetry = false) {
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

// Add CSS for countdown loader
const style = document.createElement('style');
style.textContent = `
    .countdown-loader {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    
    .countdown-content {
        background: white;
        padding: 30px;
        border-radius: 15px;
        text-align: center;
        min-width: 300px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    
    .countdown-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    
    .countdown-timer {
        font-size: 24px;
        font-weight: bold;
        color: #e74c3c;
        margin: 15px 0;
    }
    
    .countdown-number {
        font-size: 32px;
    }
    
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
    }
    
    .error-content {
        background: white;
        padding: 40px;
        border-radius: 15px;
        text-align: center;
        max-width: 400px;
        margin: 20px;
    }
    
    .error-icon {
        font-size: 64px;
        margin-bottom: 20px;
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
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .loading-screen {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
`;
document.head.appendChild(style);
