document.addEventListener('DOMContentLoaded', () => {

    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminLoginSection = document.getElementById('adminLoginSection');
    const adminDashboardSection = document.getElementById('adminDashboardSection');
    const logoutBtn = document.getElementById('logoutBtn');

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            adminLoginSection.hidden = true;
            adminDashboardSection.hidden = false;
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            adminDashboardSection.hidden = true;
            adminLoginSection.hidden = false;
        });
    }

    const tabs = document.querySelectorAll('[data-admin-tab]');
    const panels = document.querySelectorAll('.admin-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const targetPanel = document.getElementById(`admin-${tab.dataset.adminTab}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });

});