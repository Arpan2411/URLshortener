const path = require('path');
// const router = express.Router();

exports.getHome = (req, res) => {
    res.sendFile(path.resolve(__dirname, '../public/index.html'));
};