const router = require('express').Router();
const { register, login, seedAccounts, fixTechnicians } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/seed', seedAccounts);
router.post('/fix-technicians', fixTechnicians);

module.exports = router;
