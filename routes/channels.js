const express = require('express');
const router = express.Router();
const Channel = require('../models/Channel');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware d'authentification
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '❌ Token manquant' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '❌ Token invalide' });
    }
    req.user = user;
    next();
  });
}

// GET TOUS LES SALONS
router.get('/', authenticateToken, async (req, res) => {
  try {
    const channels = await Channel.find()
      .populate('createdBy', 'username email')
      .populate('members', 'username')
      .populate('allowedRoles', 'name');
    
    res.json({ channels });
  } catch (error) {
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
  }
});

// CREATE SALON (Owner/Admin/Modérateur)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (!['Owner', 'Admin', 'Modérateur'].includes(req.user.role)) {
      return res.status(403).json({ message: '❌ Permission refusée' });
    }

    const { name, description, type, private: isPrivate, allowedRoles } = req.body;
    const user = await User.findById(req.user.id);

    const channel = new Channel({
      name,
      description,
      type: type || 'text',
      private: isPrivate || false,
      createdBy: user._id,
      members: [user._id],
      allowedRoles: allowedRoles || []
    });

    await channel.save();
    await channel.populate('createdBy', 'username email');

    res.status(201).json({
      message: '✅ Salon créé avec succès',
      channel
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
  }
});

// GET SALON PAR ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id)
      .populate('createdBy', 'username email')
      .populate('members', 'username email')
      .populate('allowedRoles', 'name permissions');

    if (!channel) {
      return res.status(404).json({ message: '❌ Salon non trouvé' });
    }

    res.json({ channel });
  } catch (error) {
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
  }
});

// UPDATE SALON (Owner/Admin/Créateur)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);

    if (!channel) {
      return res.status(404).json({ message: '❌ Salon non trouvé' });
    }

    // Vérifier les permissions
    if (req.user.role !== 'Owner' && req.user.role !== 'Admin' && channel.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: '❌ Permission refusée' });
    }

    const { name, description, type, private: isPrivate, allowedRoles } = req.body;

    channel.name = name || channel.name;
    channel.description = description || channel.description;
    channel.type = type || channel.type;
    channel.private = isPrivate !== undefined ? isPrivate : channel.private;
    channel.allowedRoles = allowedRoles || channel.allowedRoles;

    await channel.save();

    res.json({ message: '✅ Salon mis à jour', channel });
  } catch (error) {
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
  }
});

// DELETE SALON (Owner/Admin seulement)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Owner' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: '❌ Permission refusée' });
    }

    const channel = await Channel.findByIdAndDelete(req.params.id);

    if (!channel) {
      return res.status(404).json({ message: '❌ Salon non trouvé' });
    }

    res.json({ message: '✅ Salon supprimé' });
  } catch (error) {
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
  }
});

// REJOINDRE UN SALON
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!channel) {
      return res.status(404).json({ message: '❌ Salon non trouvé' });
    }

    if (channel.members.includes(user._id)) {
      return res.status(400).json({ message: '❌ Vous êtes déjà membre de ce salon' });
    }

    channel.members.push(user._id);
    await channel.save();

    res.json({ message: '✅ Vous avez rejoint le salon', channel });
  } catch (error) {
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
  }
});

// QUITTER UN SALON
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);

    if (!channel) {
      return res.status(404).json({ message: '❌ Salon non trouvé' });
    }

    channel.members = channel.members.filter(m => m.toString() !== req.user.id);
    await channel.save();

    res.json({ message: '✅ Vous avez quitté le salon' });
  } catch (error) {
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
  }
});

module.exports = router;
