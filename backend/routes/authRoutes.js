const router = require('express').Router();
const { register, login, seedAccounts } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/seed', seedAccounts);

module.exports = router;
