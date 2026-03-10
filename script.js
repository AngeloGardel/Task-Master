let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || {};
let currentFilter = 'all';

window.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
});

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');

    if (!email || !password) {
        showError(errorDiv, 'Preencha todos os campos');
        return;
    }

    if (!users[email] || users[email].password !== hashPassword(password)) {
        showError(errorDiv, 'Email ou senha incorretos');
        return;
    }

    currentUser = { email, name: users[email].name };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showDashboard();
    document.getElementById('loginForm').reset();
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    const errorDiv = document.getElementById('registerError');

    if (!name || !email || !password || !confirm) {
        showError(errorDiv, 'Preencha todos os campos');
        return;
    }

    if (password !== confirm) {
        showError(errorDiv, 'As senhas não coincidem');
        return;
    }

    if (password.length < 6) {
        showError(errorDiv, 'Senha deve ter no mínimo 6 caracteres');
        return;
    }

    if (users[email]) {
        showError(errorDiv, 'Este email já está registrado');
        return;
    }

    users[email] = { name, password: hashPassword(password), tasks: [] };
    localStorage.setItem('users', JSON.stringify(users));
    
    currentUser = { email, name };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    showDashboard();
    document.getElementById('registerForm').reset();
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
    showLogin();
}

function switchToRegister() {
    document.getElementById('loginSection').classList.remove('active');
    document.getElementById('registerSection').classList.add('active');
    document.getElementById('loginError').classList.remove('show');
}

function switchToLogin() {
    document.getElementById('registerSection').classList.remove('active');
    document.getElementById('loginSection').classList.add('active');
    document.getElementById('registerError').classList.remove('show');
}

function checkAuthStatus() {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
        currentUser = JSON.parse(stored);
        showDashboard();
    }
}

function showLogin() {
    document.getElementById('loginSection').classList.add('active');
    document.getElementById('registerSection').classList.remove('active');
    document.getElementById('dashboardSection').classList.remove('active');
    document.getElementById('headerSubtitle').textContent = 'Organize suas tarefas com estilo';
}

function showDashboard() {
    document.getElementById('loginSection').classList.remove('active');
    document.getElementById('registerSection').classList.remove('active');
    document.getElementById('dashboardSection').classList.add('active');
    
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('headerSubtitle').textContent = `Bem-vindo, ${currentUser.name}!`;
    
    renderTasks();
}

function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const isPassword = field.type === 'password';
    field.type = isPassword ? 'text' : 'password';
}

function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => element.classList.remove('show'), 4000);
}

function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        hash = ((hash << 5) - hash) + password.charCodeAt(i);
        hash = hash & hash;
    }
    return hash.toString();
}

function addTask() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();
    if (text === '') return;

    const task = {
        id: Date.now(),
        text,
        completed: false,
        priority: document.getElementById('prioritySelect').value,
        createdAt: new Date().toISOString()
    };

    if (!users[currentUser.email].tasks) {
        users[currentUser.email].tasks = [];
    }

    users[currentUser.email].tasks.unshift(task);
    localStorage.setItem('users', JSON.stringify(users));
    renderTasks();
    input.value = '';
    input.focus();
}

function deleteTask(id) {
    users[currentUser.email].tasks = users[currentUser.email].tasks.filter(t => t.id !== id);
    localStorage.setItem('users', JSON.stringify(users));
    renderTasks();
}

function toggleTask(id) {
    const task = users[currentUser.email].tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        localStorage.setItem('users', JSON.stringify(users));
        renderTasks();
    }
}

function setFilter(e) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.dataset.filter;
    renderTasks();
}

function getFilteredTasks() {
    const tasks = users[currentUser.email].tasks || [];
    switch (currentFilter) {
        case 'pending':
            return tasks.filter(t => !t.completed);
        case 'completed':
            return tasks.filter(t => t.completed);
        case 'high':
            return tasks.filter(t => t.priority === 'high');
        default:
            return tasks;
    }
}

function renderTasks() {
    const filtered = getFilteredTasks();
    const tasksList = document.getElementById('tasksList');

    if (filtered.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-tasks"></i>
                <p>Nenhuma tarefa ${currentFilter !== 'all' ? 'nesta categoria' : 'ainda'}.</p>
            </div>
        `;
    } else {
        tasksList.innerHTML = filtered.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}">
                <div class="checkbox" onclick="toggleTask(${task.id})">
                    <i class="fas fa-check"></i>
                </div>
                <span class="task-text">${escapeHtml(task.text)}</span>
                <span class="task-priority priority-${task.priority}">
                    ${getPriorityLabel(task.priority)}
                </span>
                <button class="btn-delete" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    updateStats();
}

function updateStats() {
    const tasks = users[currentUser.email].tasks || [];
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
}

function getPriorityLabel(priority) {
    const labels = {
        high: 'Alta',
        medium: 'Média',
        low: 'Baixa'
    };
    return labels[priority] || priority;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}