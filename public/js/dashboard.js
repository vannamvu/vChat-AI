// Dashboard JavaScript functionality

class VChatDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.init();
    }

    init() {
        this.loadDashboardStats();
        this.setupNavigation();
        
        // Auto refresh every 30 seconds
        setInterval(() => {
            if (this.currentSection === 'dashboard') {
                this.loadDashboardStats();
            }
        }, 30000);
    }

    setupNavigation() {
        // Update URL hash when section changes
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1);
            if (hash && hash !== this.currentSection) {
                this.showSection(hash);
            }
        });

        // Load initial section from hash
        const hash = window.location.hash.substring(1);
        if (hash) {
            this.showSection(hash);
        }
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });

        // Show selected section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.style.display = 'block';
            this.currentSection = sectionName;

            // Update active nav link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            document.querySelector(`a[href="#${sectionName}"]`).classList.add('active');

            // Load section-specific data
            this.loadSectionData(sectionName);

            // Update URL hash
            window.location.hash = sectionName;
        }
    }

    loadSectionData(sectionName) {
        switch (sectionName) {
            case 'conversations':
                this.loadConversations();
                break;
            case 'leads':
                this.loadLeads();
                break;
            case 'dashboard':
                this.loadDashboardStats();
                break;
        }
    }

    async loadDashboardStats() {
        try {
            this.showLoading();
            
            const response = await fetch('/dashboard/api/stats');
            const data = await response.json();

            if (response.ok) {
                this.updateStatsCards(data);
                this.updateHotLeads(data.hotLeads);
                this.loadRecentConversations();
            } else {
                this.showError('Không thể tải thống kê dashboard');
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            this.showError('Lỗi kết nối khi tải dữ liệu');
        } finally {
            this.hideLoading();
        }
    }

    updateStatsCards(data) {
        // Update conversation stats
        const totalConversations = document.getElementById('total-conversations');
        const activeConversations = document.getElementById('active-conversations');
        const totalLeads = document.getElementById('total-leads');
        const conversionRate = document.getElementById('conversion-rate');

        if (totalConversations) totalConversations.textContent = data.conversations?.total || 0;
        if (activeConversations) activeConversations.textContent = data.conversations?.active || 0;
        if (totalLeads) totalLeads.textContent = data.leads?.total || 0;
        if (conversionRate) conversionRate.textContent = `${data.leads?.conversionRate || 0}%`;
    }

    updateHotLeads(hotLeads) {
        const container = document.getElementById('hot-leads-list');
        if (!container) return;

        if (!hotLeads || hotLeads.length === 0) {
            container.innerHTML = '<p class="text-muted">Không có leads nóng</p>';
            return;
        }

        const html = hotLeads.map(lead => `
            <div class="lead-item mb-2 p-2 border rounded">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        ${lead.customerId?.profilePic ? 
                            `<img src="${lead.customerId.profilePic}" class="customer-avatar me-2" alt="Avatar">` :
                            '<div class="customer-avatar me-2 bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white"><i class="fas fa-user"></i></div>'
                        }
                        <div>
                            <h6 class="mb-0">${lead.customerId?.firstName || 'Unknown'} ${lead.customerId?.lastName || ''}</h6>
                            <small class="text-muted">Score: <span class="lead-score ${this.getScoreClass(lead.score)}">${lead.score}</span></small>
                        </div>
                    </div>
                    <div>
                        <span class="status-badge status-${lead.status}">${this.getStatusText(lead.status)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    async loadRecentConversations() {
        try {
            const response = await fetch('/dashboard/api/conversations?limit=5');
            const data = await response.json();

            if (response.ok) {
                this.updateRecentConversations(data.conversations);
            }
        } catch (error) {
            console.error('Error loading recent conversations:', error);
        }
    }

    updateRecentConversations(conversations) {
        const container = document.getElementById('recent-conversations');
        if (!container) return;

        if (!conversations || conversations.length === 0) {
            container.innerHTML = '<p class="text-muted">Không có hội thoại gần đây</p>';
            return;
        }

        const html = conversations.map(conv => `
            <div class="conversation-item mb-2 p-2 border rounded">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        ${conv.customerId?.profilePic ? 
                            `<img src="${conv.customerId.profilePic}" class="customer-avatar me-2" alt="Avatar">` :
                            '<div class="customer-avatar me-2 bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white"><i class="fas fa-user"></i></div>'
                        }
                        <div>
                            <h6 class="mb-0">${conv.customerId?.firstName || 'Unknown'} ${conv.customerId?.lastName || ''}</h6>
                            <small class="text-muted">${this.formatDate(conv.lastActivity)}</small>
                        </div>
                    </div>
                    <div>
                        <span class="status-badge status-${conv.status}">${this.getStatusText(conv.status)}</span>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    async loadConversations() {
        const container = document.getElementById('conversations-list');
        if (!container) return;

        try {
            container.innerHTML = '<p class="text-muted">Đang tải...</p>';
            
            const response = await fetch('/dashboard/api/conversations');
            const data = await response.json();

            if (response.ok && data.conversations) {
                if (data.conversations.length === 0) {
                    container.innerHTML = '<p class="text-muted">Chưa có hội thoại nào</p>';
                    return;
                }

                const html = data.conversations.map(conv => `
                    <div class="conversation-item">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="d-flex align-items-center">
                                ${conv.customerId?.profilePic ? 
                                    `<img src="${conv.customerId.profilePic}" class="customer-avatar me-3" alt="Avatar">` :
                                    '<div class="customer-avatar me-3 bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white"><i class="fas fa-user"></i></div>'
                                }
                                <div>
                                    <h5 class="mb-1">${conv.customerId?.firstName || 'Unknown'} ${conv.customerId?.lastName || ''}</h5>
                                    <p class="mb-1 small-text">Facebook ID: ${conv.facebookId}</p>
                                    <p class="mb-0 small-text">Cập nhật: ${this.formatDate(conv.lastActivity)}</p>
                                </div>
                            </div>
                            <div class="text-end">
                                <span class="status-badge status-${conv.status} mb-2 d-block">${this.getStatusText(conv.status)}</span>
                                <small class="text-muted">${conv.messages?.length || 0} tin nhắn</small>
                            </div>
                        </div>
                    </div>
                `).join('');

                container.innerHTML = html;
            } else {
                container.innerHTML = '<p class="text-danger">Lỗi tải dữ liệu hội thoại</p>';
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
            container.innerHTML = '<p class="text-danger">Lỗi kết nối</p>';
        }
    }

    async loadLeads() {
        const container = document.getElementById('leads-list');
        if (!container) return;

        try {
            container.innerHTML = '<p class="text-muted">Đang tải...</p>';
            
            const response = await fetch('/dashboard/api/leads');
            const data = await response.json();

            if (response.ok && data.leads) {
                if (data.leads.length === 0) {
                    container.innerHTML = '<p class="text-muted">Chưa có lead nào</p>';
                    return;
                }

                const html = data.leads.map(lead => `
                    <div class="lead-item">
                        <div class="d-flex justify-content-between align-items-start">
                            <div class="d-flex align-items-center">
                                ${lead.customerId?.profilePic ? 
                                    `<img src="${lead.customerId.profilePic}" class="customer-avatar me-3" alt="Avatar">` :
                                    '<div class="customer-avatar me-3 bg-secondary rounded-circle d-flex align-items-center justify-content-center text-white"><i class="fas fa-user"></i></div>'
                                }
                                <div>
                                    <h5 class="mb-1">${lead.customerId?.firstName || 'Unknown'} ${lead.customerId?.lastName || ''}</h5>
                                    <p class="mb-1 small-text">
                                        ${lead.contactInfo?.phone ? `📞 ${lead.contactInfo.phone}` : ''}
                                        ${lead.contactInfo?.email ? `📧 ${lead.contactInfo.email}` : ''}
                                    </p>
                                    <p class="mb-0 small-text">Tạo: ${this.formatDate(lead.createdAt)}</p>
                                </div>
                            </div>
                            <div class="text-end">
                                <div class="d-flex align-items-center mb-2">
                                    <span class="lead-score me-2 ${this.getScoreClass(lead.score)}">${lead.score}</span>
                                    <span class="status-badge status-${lead.status}">${this.getStatusText(lead.status)}</span>
                                </div>
                                <small class="text-muted">${lead.notes?.length || 0} ghi chú</small>
                            </div>
                        </div>
                        ${lead.interestedIn && lead.interestedIn.length > 0 ? `
                            <div class="mt-2">
                                <small class="text-muted">Quan tâm: ${lead.interestedIn.map(i => i.service || i.product).join(', ')}</small>
                            </div>
                        ` : ''}
                    </div>
                `).join('');

                container.innerHTML = html;
            } else {
                container.innerHTML = '<p class="text-danger">Lỗi tải dữ liệu leads</p>';
            }
        } catch (error) {
            console.error('Error loading leads:', error);
            container.innerHTML = '<p class="text-danger">Lỗi kết nối</p>';
        }
    }

    getStatusText(status) {
        const statusMap = {
            'active': 'Hoạt động',
            'resolved': 'Đã giải quyết',
            'escalated': 'Đã chuyển lên',
            'pending': 'Chờ xử lý',
            'new': 'Mới',
            'contacted': 'Đã liên hệ',
            'qualified': 'Đủ điều kiện',
            'proposal': 'Đề xuất',
            'negotiation': 'Đàm phán',
            'closed_won': 'Thành công',
            'closed_lost': 'Thất bại'
        };
        return statusMap[status] || status;
    }

    getScoreClass(score) {
        if (score >= 80) return 'high';
        if (score >= 50) return 'medium';
        return 'low';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'Vừa xong';
        } else if (diffMins < 60) {
            return `${diffMins} phút trước`;
        } else if (diffHours < 24) {
            return `${diffHours} giờ trước`;
        } else if (diffDays < 7) {
            return `${diffDays} ngày trước`;
        } else {
            return date.toLocaleDateString('vi-VN');
        }
    }

    showLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = 'flex';
    }

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    showError(message) {
        // Simple alert for now, can be improved with toast notifications
        console.error(message);
    }

    refreshDashboard() {
        this.loadDashboardStats();
    }
}

// Global functions for HTML onclick events
function showSection(sectionName) {
    window.dashboard.showSection(sectionName);
}

function refreshDashboard() {
    window.dashboard.refreshDashboard();
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.dashboard = new VChatDashboard();
});