// admin/server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const CryptoJS = require('crypto-js');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Directories
const dataDir = path.join(__dirname, '../data');
const privateConfigPath = path.join(dataDir, 'config.private.json');
const publicConfigPath = path.join(dataDir, 'config.json');
const uploadsDir = path.join(dataDir, 'uploads');

// Ensure directories exist
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Migrate old config if present
if (fs.existsSync(publicConfigPath) && !fs.existsSync(privateConfigPath)) {
    fs.copyFileSync(publicConfigPath, privateConfigPath);
}

// Ensure private config exists
if (!fs.existsSync(privateConfigPath)) {
    const defaultConfig = {
        settings: {
            siteTitle: "My Stacker",
            favicon: "",
            background: { type: "preset", value: "blob-animation" }
        },
        items: [
            { id: "item-default-prof", type: "profile", url: "https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff&size=128", style: "framed" }
        ]
    };
    fs.writeFileSync(privateConfigPath, JSON.stringify(defaultConfig, null, 2));
}

// Helper: Generate Public Config by encrypting protected fields
function generatePublicConfig(privateConf) {
    const pub = JSON.parse(JSON.stringify(privateConf));

    function processItems(items) {
        if (!items) return;
        items.forEach(item => {
            if (item.isProtected && item.password) {
                // Encrypt URL for links
                if (item.url) {
                    item.encryptedData = CryptoJS.AES.encrypt(item.url, item.password).toString();
                    delete item.url;
                }
                // Encrypt whole contents for folders
                if (item.type === 'folder' && item.items) {
                    item.encryptedData = CryptoJS.AES.encrypt(JSON.stringify(item.items), item.password).toString();
                    delete item.items;
                }
                // Always strip the password from public
                delete item.password;
            } else if (item.type === 'folder' && item.items) {
                // Process unlocked folder contents recursively
                processItems(item.items);
            }
        });
    }

    if (pub.items) {
        processItems(pub.items);
    }
    return pub;
}

// Setup Multer for File Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, 'upload-' + uniqueSuffix + path.extname(file.originalname))
    }
})
const upload = multer({ storage: storage });

// Serve Admin UI statically
app.use(express.static(path.join(__dirname, 'public')));
// Serve user uploads statically at /uploads
app.use('/uploads', express.static(uploadsDir));

// API: Get Admin Private Config Data
app.get('/api/config', (req, res) => {
    fs.readFile(privateConfigPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read private config.' });
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            res.status(500).json({ error: 'Invalid config JSON.' });
        }
    });
});

// API: Get Public Config (encrypted version for public page)
app.get('/api/public-config', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    fs.readFile(publicConfigPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read public config.' });
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            res.status(500).json({ error: 'Invalid public config JSON.' });
        }
    });
});

// API: Save Config Data (Writes Private and Public independently)
app.post('/api/config', (req, res) => {
    const newConfig = req.body;

    // Save Private Source of Truth
    fs.writeFile(privateConfigPath, JSON.stringify(newConfig, null, 2), 'utf8', (err) => {
        if (err) return res.status(500).json({ error: 'Failed to save private config.' });

        // Generate and Save Public Version
        try {
            const publicConfig = generatePublicConfig(newConfig);
            fs.writeFile(publicConfigPath, JSON.stringify(publicConfig, null, 2), 'utf8', (err) => {
                if (err) console.error("Could not write public config", err);
                res.json({ success: true, message: 'Config saved and public output generated.' });
            });
        } catch (cryptoErr) {
            console.error(cryptoErr);
            res.status(500).json({ error: 'Failed during encryption phase.' });
        }
    });
});

// API: Upload File (Image)
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    // Return the relative URL which will be handled by the frontend
    // When proxying or local, /uploads maps to the data/uploads folder
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
});

app.listen(PORT, () => {
    console.log(`🚀 Admin API Server running on port ${PORT}`);
});
