// SPIMF System Configuration
const SPIMF_CONFIG = {
    APP_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbw8sRFcGxZZbRyRyg0_NHMYuaGPAGM_rwrUa5phlR6IfYOI8IErCksWOfr9rQcvA_-a/exec',
    OPERATING_HOURS: [
        { start: '06:00', end: '11:30' },
        { start: '12:00', end: '18:00' },
        { start: '18:30', end: '23:59' }
    ],
    BAN_DAYS: 7
};

class SPIMFSystem {
    constructor() {
        this.currentUser = null;
        this.isSystemActive = false;
        this.init();
    }

    init() {
        this.checkSystemStatus();
        this.setupEventListeners();
        this.startCountdownTimer();
        
        // Hide loading screen after 2 seconds
        setTimeout(() => {
            this.hideLoadingScreen();
            this.showLoginScreen();
        }, 2000);
    }

    async checkSystemStatus() {
        const now = new Date();
        const currentTime = this.formatTime(now);
        
        for (const hours of SPIMF_CONFIG.OPERATING_HOURS) {
            if (currentTime >= hours.start && currentTime <= hours.end) {
                this.isSystemActive = true;
                return;
            }
        }
        this.isSystemActive = false;
        this.showMaintenanceScreen();
    }

    formatTime(date) {
        return date.toTimeString().slice(0, 5);
    }

    hideLoadingScreen() {
        document.getElementById('loading').classList.add('hidden');
    }

    showMaintenanceScreen() {
        document.getElementById('maintenance').classList.remove('hidden');
        this.updateMaintenanceCountdown();
    }

    showLoginScreen() {
        if (this.isSystemActive) {
            document.getElementById('loginScreen').classList.remove('hidden');
            this.updateLoginCountdown();
        }
    }

    showAppScreen() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
    }

    updateMaintenanceCountdown() {
        const nextActivation = this.getNextActivationTime();
        document.getElementById('nextActivationTime').textContent = nextActivation;
    }

    updateLoginCountdown() {
        const timeToDeactivate = this.getTimeToDeactivation();
        document.getElementById('timeToDeactivate').textContent = timeToDeactivate;
    }

    getNextActivationTime() {
        const now = new Date();
        const currentTime = this.formatTime(now);
        
        for (const hours of SPIMF_CONFIG.OPERATING_HOURS) {
            if (currentTime < hours.start) {
                return hours.start;
            }
        }
        
        // Return first operating hour tomorrow
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return `Besok ${SPIMF_CONFIG.OPERATING_HOURS[0].start}`;
    }

    getTimeToDeactivation() {
        const now = new Date();
        const currentTime = this.formatTime(now);
        
        for (const hours of SPIMF_CONFIG.OPERATING_HOURS) {
            if (currentTime >= hours.start && currentTime < hours.end) {
                return hours.end;
            }
        }
        return '-';
    }

    startCountdownTimer() {
        setInterval(() => {
            if (this.isSystemActive) {
                this.updateLoginCountdown();
            } else {
                this.updateMaintenanceCountdown();
            }
        }, 60000); // Update every minute
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
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
        document.getElementById('profileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile();
        });

        // Media form
        document.getElementById('mediaForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateMedia();
        });

        // Social media toggle
        document.getElementById('hasSocialMedia').addEventListener('change', (e) => {
            this.toggleSocialMediaFields(e.target.value === 'YES');
        });

        // Copy buttons
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.copyToClipboard(e.currentTarget.dataset.target);
            });
        });

        // Action buttons
        document.getElementById('revertDataBtn').addEventListener('click', () => {
            this.revertData();
        });

        document.getElementById('viewLogsBtn').addEventListener('click', () => {
            this.viewLogs();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
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
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sedang Login...';
        btn.disabled = true;

        try {
            const response = await this.callAppScript('login', loginData);
            
            if (response.success) {
                this.showMessage('loginMessage', 'Login berjaya! Sedang memuatkan data...', 'success');
                this.currentUser = response.userData;
                setTimeout(() => {
                    this.showAppScreen();
                    this.loadUserData();
                }, 1500);
            } else {
                this.showMessage('loginMessage', response.message, response.banned ? 'error' : 'warning');
            }
        } catch (error) {
            this.showMessage('loginMessage', 'Ralat sistem: ' + error.message, 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    async callAppScript(action, data = {}) {
        const payload = {
            action: action,
            ...data
        };

        try {
            const response = await fetch(SPIMF_CONFIG.APP_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            return await response.json();
        } catch (error) {
            console.error('Error calling Apps Script:', error);
            throw error;
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

    async updateProfile() {
        const formData = new FormData(document.getElementById('profileForm'));
        const updates = {};
        
        formData.forEach((value, key) => {
            updates[key] = value;
        });

        try {
            const response = await this.callAppScript('updateProfile', {
                row: this.currentUser.row,
                updates: updates
            });

            if (response.success) {
                this.showMessage('profileMessage', 'Data berjaya dikemaskini!', 'success');
                // Update current user data
                Object.assign(this.currentUser, updates);
            } else {
                this.showMessage('profileMessage', response.message, 'error');
            }
        } catch (error) {
            this.showMessage('profileMessage', 'Ralat sistem: ' + error.message, 'error');
        }
    }

    async updateMedia() {
        const formData = new FormData(document.getElementById('mediaForm'));
        const updates = {};
        
        formData.forEach((value, key) => {
            updates[key] = value;
        });

        try {
            const response = await this.callAppScript('updateMedia', {
                row: this.currentUser.row,
                updates: updates
            });

            if (response.success) {
                this.showMessage('mediaMessage', 'Data media berjaya dikemaskini!', 'success');
                // Update current user data
                Object.assign(this.currentUser, updates);
                this.toggleSocialMediaFields(updates['DO YOU HAVE A SOCIAL MEDIA ACCOUNT AND HAVE MORE THAN 50 FOLLOWERS'] === 'YES');
            } else {
                this.showMessage('mediaMessage', response.message, 'error');
            }
        } catch (error) {
            this.showMessage('mediaMessage', 'Ralat sistem: ' + error.message, 'error');
        }
    }

    switchTab(tabName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update content
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
        
        // Update system status indicator
        const systemStatus = document.getElementById('systemStatus');
        systemStatus.className = `system-status ${isActive ? 'active' : 'inactive'}`;
    }

    async revertData() {
        if (!confirm('Adakah anda pasti ingin mengembalikan data kepada keadaan sebelumnya?')) {
            return;
        }

        try {
            const response = await this.callAppScript('revertData', {
                row: this.currentUser.row
            });

            if (response.success) {
                this.showMessage('actionMessage', 'Data berjaya dikembalikan!', 'success');
                this.currentUser = response.userData;
                this.loadUserData();
            } else {
                this.showMessage('actionMessage', response.message, 'error');
            }
        } catch (error) {
            this.showMessage('actionMessage', 'Ralat sistem: ' + error.message, 'error');
        }
    }

    async viewLogs() {
        try {
            const response = await this.callAppScript('getLogs', {
                row: this.currentUser.row
            });

            if (response.success) {
                alert(`Log Aktiviti:\n\n${response.logs.join('\n')}`);
            } else {
                this.showMessage('actionMessage', response.message, 'error');
            }
        } catch (error) {
            this.showMessage('actionMessage', 'Ralat sistem: ' + error.message, 'error');
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
            // Show temporary success feedback
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

        // Auto hide after 5 seconds
        setTimeout(() => {
            messageEl.classList.add('hidden');
        }, 5000);
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SPIMFSystem();
});
