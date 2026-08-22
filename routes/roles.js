const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
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

// GET TOUS LES RÔLES
router.get('/', authenticateToken, async (req, res) => {
  try {
    const roles = await Role.find();
    res.json({ roles });
  } catch (error) {
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
  }
});

// CREATE RÔLE (Owner/Admin seulement)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Owner' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: '❌ Permission refusée' });
    }

    const { name, description, permissions, color } = req.body;

    const role = new Role({
      name,
      description,
      permissions: permissions || [],
      color: color || '#7289DA'
    });

    await role.save();

    res.status(201).json({
      message: '✅ Rôle créé avec succès',
      role
    });
  } catch (error) {
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
  }
});

// UPDATE RÔLE (Owner/Admin seulement)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Owner' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: '❌ Permission refusée' });
    }

    const { name, description, permissions, color } = req.body;

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { name, description, permissions, color },
      { new: true }
    );

    if (!role) {
      return res.status(404).json({ message: '❌ Rôle non trouvé' });
    }

    res.json({ message: '✅ Rôle mis à jour', role });
  } catch (error) {
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
  }
});

// DELETE RÔLE (Owner seulement)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Owner') {
      return res.status(403).json({ message: '❌ Seul l\'Owner peut supprimer des rôles' });
    }

    const role = await Role.findByIdAndDelete(req.params.id);

    if (!role) {
      return res.status(404).json({ message: '❌ Rôle non trouvé' });
    }

    res.json({ message: '✅ Rôle supprimé' });
  } catch (error) {
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
  }
});

// AJOUTER PERMISSION À UN RÔLE (Owner/Admin seulement)
router.post('/:id/permissions', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Owner' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: '❌ Permission refusée' });
    }

    const { permission } = req.body;
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ message: '❌ Rôle non trouvé' });
    }

    if (!role.permissions.includes(permission)) {
      role.permissions.push(permission);
      await role.save();
    }

    res.json({ message: '✅ Permission ajoutée', role });
  } catch (error) {
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
  }
});

// SUPPRIMER PERMISSION D'UN RÔLE (Owner/Admin seulement)
router.delete('/:id/permissions', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Owner' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: '❌ Permission refusée' });
    }

    const { permission } = req.body;
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ message: '❌ Rôle non trouvé' });
    }

    role.permissions = role.permissions.filter(p => p !== permission);
    await role.save();

    res.json({ message: '✅ Permission supprimée', role });
  } catch (error) {
    res.status(500).json({ message: '❌ Erreur serveur', error: error.message });
  }
});

module.exports = router;
