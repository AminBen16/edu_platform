"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/webrtc.ts
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/', (req, res) => {
    res.json({ message: 'WebRTC endpoint' });
});
exports.default = router;
