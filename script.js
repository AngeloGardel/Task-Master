let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || {};
let currentFilter = 'all';

// ============= INITIALIZATION =============
window.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
});