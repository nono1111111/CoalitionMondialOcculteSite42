// API Configuration
const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

let authToken = localStorage.getItem('authToken');
let currentUser = null;
let currentChannel = null;
let socket = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  if (authToken) {
    initializeApp();
  } else {
    showLoginView();
  }

  setupEventListeners();
});

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // LOGIN/REGISTER
  document.getElementById('loginBtn').addEventListener('click', login);
  document.getElementById('registerBtn').addEventListener('click', register);
  document.getElementById('toggleFormBtn').addEventListener('click', toggleForms);
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // CHANNELS
  document.getElementById('createChannelBtn').addEventListener('click', () => {
    document.getElementById('createChannelModal').style.display = 'flex';
  });
  document.getElementById('confirmChannelBtn').addEventListener('click', createChannel);
  document.getElementById('closeChannelModal').addEventListener('click', () => {
    document.getElementById('createChannelModal').style.display = 'none';
  });

  // ROLES
  document.getElementById('createRoleBtn').addEventListener('click', () => {
    document.getElementById('createRoleModal').style.display = 'flex';
  });
  document.getElementById('confirmRoleBtn').addEventListener('click', createRole);
  document.getElementById('closeRoleModal').addEventListener('click', () => {
    document.getElementById('createRoleModal').style.display = 'none';
  });

  // MESSAGES
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
}

// ===== AUTHENTICATION =====
async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showAlert('❌ Email et mot de passe requis');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      initializeApp();
    } else {
      showAlert(data.message);
    }
  } catch (error) {
    showAlert('❌ Erreur de connexion: ' + error.message);
  }
}

async function register() {
  const username = document.getElementById('regUsername').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;

  if (!username || !email || !password) {
    showAlert('❌ Tous les champs sont requis');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      initializeApp();
    } else {
      showAlert(data.message);
    }
  } catch (error) {
    showAlert('❌ Erreur inscription: ' + error.message);
  }
}

function logout() {
  if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
    authToken = null;
    localStorage.removeItem('authToken');
    if (socket) socket.disconnect();
    location.reload();
  }
}

function toggleForms() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const btn = document.getElementById('toggleFormBtn');

  if (loginForm.style.display !== 'none') {
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
    btn.textContent = 'Déjà inscrit ? Se connecter';
  } else {
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
    btn.textContent = 'Pas de compte ? S\'inscrire';
  }
}

// ===== INITIALIZATION APP =====
async function initializeApp() {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('channelView').style.display = 'flex';

  // Get current user
  await loadCurrentUser();

  // Load channels and check permissions
  await loadChannels();

  // Check if Owner/Admin to show management panels
  if (currentUser && (currentUser.role === 'Owner' || currentUser.role === 'Admin')) {
    document.getElementById('rolesSection').style.display = 'block';
    document.getElementById('usersSection').style.display = 'block';
    await loadRoles();
    await loadUsers();
  }

  // Initialize Socket.io
  initializeSocket();
}

// ===== CURRENT USER =====
async function loadCurrentUser() {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      document.getElementById('userName').textContent = currentUser.username;
      document.getElementById('userRole').textContent = currentUser.role;
      document.getElementById('userRole').style.borderColor = getRoleColor(currentUser.role);
    }
  } catch (error) {
    console.error('Erreur chargement utilisateur:', error);
  }
}

function getRoleColor(role) {
  const colors = {
    'Owner': '#FF0000',
    'Admin': '#FFA500',
    'Modérateur': '#9B59B6',
    'Utilisateur': '#00d4aa'
  };
  return colors[role] || '#00d4aa';
}

// ===== CHANNELS =====
async function loadChannels() {
  try {
    const response = await fetch(`${API_BASE}/channels/`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      const channelsList = document.getElementById('channelsList');
      channelsList.innerHTML = '';

      data.channels.forEach(channel => {
        const channelEl = document.createElement('div');
        channelEl.className = 'channel-item';
        channelEl.innerHTML = `
          <span>${getChannelIcon(channel.type)} ${channel.name}</span>
          ${currentUser.role === 'Owner' || channel.createdBy._id === currentUser.id ? 
            `<span style="cursor: pointer; color: #FF6B6B;" onclick="deleteChannel('${channel._id}')">🗑️</span>` 
            : ''}
        `;
        channelEl.onclick = () => selectChannel(channel);
        channelsList.appendChild(channelEl);
      });
    }
  } catch (error) {
    console.error('Erreur chargement salons:', error);
  }
}

function getChannelIcon(type) {
  const icons = {
    'text': '#️⃣',
    'voice': '🔊',
    'announcement': '📢'
  };
  return icons[type] || '💬';
}

async function createChannel() {
  const name = document.getElementById('newChannelName').value;
  const description = document.getElementById('newChannelDesc').value;
  const type = document.getElementById('newChannelType').value;
  const isPrivate = document.getElementById('newChannelPrivate').checked;

  if (!name) {
    alert('❌ Nom du salon requis');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/channels/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ name, description, type, private: isPrivate })
    });

    if (response.ok) {
      document.getElementById('createChannelModal').style.display = 'none';
      document.getElementById('newChannelName').value = '';
      document.getElementById('newChannelDesc').value = '';
      loadChannels();
    }
  } catch (error) {
    console.error('Erreur création salon:', error);
  }
}

async function deleteChannel(channelId) {
  if (!confirm('Supprimer ce salon ?')) return;

  try {
    const response = await fetch(`${API_BASE}/channels/${channelId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.ok) {
      loadChannels();
      currentChannel = null;
      document.getElementById('channelView').innerHTML = '<p style="padding: 20px;">Salon supprimé</p>';
    }
  } catch (error) {
    console.error('Erreur suppression salon:', error);
  }
}

async function selectChannel(channel) {
  currentChannel = channel;
  document.querySelectorAll('.channel-item').forEach(el => el.classList.remove('active'));
  event.target.closest('.channel-item').classList.add('active');

  document.getElementById('channelName').textContent = getChannelIcon(channel.type) + ' ' + channel.name;
  document.getElementById('channelDescription').textContent = channel.description || 'Pas de description';

  await loadMessages(channel._id);

  // Join channel if not member
  if (!channel.members.find(m => m._id === currentUser.id)) {
    await joinChannel(channel._id);
  }

  // Initialize Socket for this channel
  if (socket) {
    socket.emit('join_room', { room: channel._id, user: currentUser.username });
  }
}

async function joinChannel(channelId) {
  try {
    await fetch(`${API_BASE}/channels/${channelId}/join`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
  } catch (error) {
    console.error('Erreur rejoindre salon:', error);
  }
}

// ===== MESSAGES =====
async function loadMessages(channelId) {
  try {
    const response = await fetch(`${API_BASE}/messages/channel/${channelId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      const messagesList = document.getElementById('messagesList');
      messagesList.innerHTML = '';

      data.messages.forEach(msg => {
        addMessageToDOM(msg);
      });

      messagesList.scrollTop = messagesList.scrollHeight;
    }
  } catch (error) {
    console.error('Erreur chargement messages:', error);
  }
}

function addMessageToDOM(message) {
  const messagesList = document.getElementById('messagesList');
  const messageEl = document.createElement('div');
  messageEl.className = 'message';
  messageEl.innerHTML = `
    <div>
      <span class="message-author">${message.author.username}</span>
      <span class="message-time">${new Date(message.createdAt).toLocaleTimeString('fr-FR')}</span>
      <p class="message-content">${escapeHtml(message.content)}</p>
    </div>
  `;
  messagesList.appendChild(messageEl);
  messagesList.scrollTop = messagesList.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('messageInput');
  const content = input.value.trim();

  if (!content || !currentChannel) return;

  try {
    const response = await fetch(`${API_BASE}/messages/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ content, channelId: currentChannel._id })
    });

    if (response.ok) {
      input.value = '';
      const data = await response.json();
      addMessageToDOM(data.data);

      // Emit via Socket.io
      if (socket) {
        socket.emit('send_message', {
          room: currentChannel._id,
          user: currentUser.username,
          message: content
        });
      }
    }
  } catch (error) {
    console.error('Erreur envoi message:', error);
  }
}

// ===== ROLES =====
async function loadRoles() {
  try {
    const response = await fetch(`${API_BASE}/roles/`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      const rolesList = document.getElementById('rolesList');
      rolesList.innerHTML = '';

      data.roles.forEach(role => {
        const roleEl = document.createElement('div');
        roleEl.className = 'role-item';
        roleEl.style.borderLeftColor = role.color;
        roleEl.innerHTML = `
          <span>${role.name}</span>
          ${currentUser.role === 'Owner' ? 
            `<span style="cursor: pointer; color: #FF6B6B;" onclick="deleteRole('${role._id}')">🗑️</span>` 
            : ''}
        `;
        rolesList.appendChild(roleEl);
      });
    }
  } catch (error) {
    console.error('Erreur chargement rôles:', error);
  }
}

async function createRole() {
  const name = document.getElementById('newRoleName').value;
  const description = document.getElementById('newRoleDesc').value;
  const color = document.getElementById('newRoleColor').value;

  if (!name) {
    alert('❌ Nom du rôle requis');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/roles/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ name, description, color })
    });

    if (response.ok) {
      document.getElementById('createRoleModal').style.display = 'none';
      document.getElementById('newRoleName').value = '';
      loadRoles();
    }
  } catch (error) {
    console.error('Erreur création rôle:', error);
  }
}

async function deleteRole(roleId) {
  if (!confirm('Supprimer ce rôle ?')) return;

  try {
    const response = await fetch(`${API_BASE}/roles/${roleId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.ok) {
      loadRoles();
    }
  } catch (error) {
    console.error('Erreur suppression rôle:', error);
  }
}

// ===== USERS =====
async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE}/users/`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      const usersList = document.getElementById('usersList');
      usersList.innerHTML = '';

      data.users.forEach(user => {
        const userEl = document.createElement('div');
        userEl.className = 'user-item';
        userEl.innerHTML = `
          <div>
            <strong>${user.username}</strong>
            <span class="role-badge" style="background: ${getRoleColor(user.role.name)}">${user.role.name}</span>
          </div>
          ${currentUser.role === 'Owner' ? 
            `<span style="cursor: pointer; color: #FF6B6B;" onclick="deleteUser('${user._id}')">🗑️</span>` 
            : ''}
        `;
        usersList.appendChild(userEl);
      });
    }
  } catch (error) {
    console.error('Erreur chargement utilisateurs:', error);
  }
}

async function deleteUser(userId) {
  if (!confirm('Supprimer cet utilisateur ?')) return;

  try {
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.ok) {
      loadUsers();
    }
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
  }
}

// ===== SOCKET.IO =====
function initializeSocket() {
  socket = io(SOCKET_URL);

  socket.on('connect', () => {
    console.log('✅ Socket connecté');
  });

  socket.on('receive_message', (data) => {
    if (currentChannel && data.room === currentChannel._id) {
      console.log('Nouveau message reçu:', data.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket déconnecté');
  });
}

// ===== UTILS =====
function showLoginView() {
  document.getElementById('loginView').style.display = 'flex';
  document.getElementById('channelView').style.display = 'none';
}

function showAlert(message) {
  document.getElementById('messageAlert').textContent = message;
  setTimeout(() => {
    document.getElementById('messageAlert').textContent = '';
  }, 4000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
