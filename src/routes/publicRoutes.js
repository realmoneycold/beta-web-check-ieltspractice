const express = require('express');
const centreCtrl = require('../controllers/centreController');

const router = express.Router();

/**
 * GET /api/public/centres/locations
 * Get all education centres with geolocation for map display
 */
router.get('/locations', centreCtrl.getCentresWithLocations);

/**
 * GET /api/public/centres
 * Get list of active education centres
 */
router.get('/', centreCtrl.getEducationCentres);

module.exports = router;
