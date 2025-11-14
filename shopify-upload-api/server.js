require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;

// Shopify Configuration from environment variables
const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP || 'thereadcounts.myshopify.com';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-10';

// Validate required environment variables
if (!SHOPIFY_ACCESS_TOKEN) {
  console.error('ERROR: SHOPIFY_ACCESS_TOKEN is required');
  process.exit(1);
}

// Configure CORS - allow requests from your Shopify store
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow Shopify store domains
    const allowedOrigins = [
      'https://thereadcounts.myshopify.com',
      'https://thereadcounts.com', // Add your custom domain if you have one
      'http://localhost:9292', // For local Shopify CLI development
    ];

    if (allowedOrigins.some(allowed => origin.includes(allowed.replace('https://', '').replace('http://', '')))) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Configure multer for file uploads (store in memory)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and design files
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/svg+xml',
      'image/gif',
      'application/pdf',
      'application/postscript', // .ai, .eps
    ];

    if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(jpg|jpeg|png|svg|gif|pdf|ai|eps)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and design files are allowed.'));
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    shop: SHOPIFY_SHOP,
    apiVersion: SHOPIFY_API_VERSION
  });
});

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    console.log('Upload request received');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Step 1: Create a staged upload
    const stagedUploadQuery = `
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            resourceUrl
            url
            parameters {
              name
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const stagedUploadVariables = {
      input: [{
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        resource: "FILE",
        fileSize: req.file.size.toString()
      }]
    };

    console.log('Creating staged upload...');
    const stagedUploadResponse = await axios.post(
      `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
      {
        query: stagedUploadQuery,
        variables: stagedUploadVariables
      },
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        }
      }
    );

    if (stagedUploadResponse.data.errors) {
      console.error('GraphQL errors:', stagedUploadResponse.data.errors);
      throw new Error('Failed to create staged upload: ' + JSON.stringify(stagedUploadResponse.data.errors));
    }

    const stagedTarget = stagedUploadResponse.data.data.stagedUploadsCreate.stagedTargets[0];
    const userErrors = stagedUploadResponse.data.data.stagedUploadsCreate.userErrors;

    if (userErrors && userErrors.length > 0) {
      console.error('User errors:', userErrors);
      throw new Error('Staged upload errors: ' + JSON.stringify(userErrors));
    }

    console.log('Staged upload created:', stagedTarget.url);

    // Step 2: Upload file to staged URL
    const formData = new FormData();

    // Add parameters from Shopify in the correct order
    stagedTarget.parameters.forEach(param => {
      formData.append(param.name, param.value);
    });

    // Add the file last
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    console.log('Uploading file to staged URL...');

    // Upload using form-data's native submit to preserve Google Cloud Storage signature
    const uploadResponse = await new Promise((resolve, reject) => {
      formData.submit(stagedTarget.url, (err, res) => {
        if (err) return reject(err);

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data });
          } else {
            reject(new Error(`Upload failed with status ${res.statusCode}: ${data}`));
          }
        });
        res.on('error', reject);
      });
    });

    console.log('File uploaded successfully');

    // Step 3: Create file in Shopify
    const createFileQuery = `
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            id
            ... on GenericFile {
              url
              id
            }
            ... on MediaImage {
              image {
                url
              }
              id
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const createFileVariables = {
      files: [{
        alt: req.file.originalname,
        contentType: "FILE",
        originalSource: stagedTarget.resourceUrl
      }]
    };

    console.log('Creating file record in Shopify...');
    const createFileResponse = await axios.post(
      `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
      {
        query: createFileQuery,
        variables: createFileVariables
      },
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
          'Content-Type': 'application/json',
        }
      }
    );

    if (createFileResponse.data.errors) {
      console.error('GraphQL errors:', createFileResponse.data.errors);
      throw new Error('Failed to create file: ' + JSON.stringify(createFileResponse.data.errors));
    }

    const fileData = createFileResponse.data.data.fileCreate;
    const fileErrors = fileData.userErrors;

    if (fileErrors && fileErrors.length > 0) {
      console.error('File creation errors:', fileErrors);
      throw new Error('File creation errors: ' + JSON.stringify(fileErrors));
    }

    const createdFile = fileData.files[0];

    // Extract the URL based on file type
    let fileUrl;
    if (createdFile.url) {
      fileUrl = createdFile.url;
    } else if (createdFile.image && createdFile.image.url) {
      fileUrl = createdFile.image.url;
    } else {
      throw new Error('Could not extract file URL from response');
    }

    console.log('File created successfully:', fileUrl);

    // Return success response
    res.json({
      success: true,
      url: fileUrl,
      fileId: createdFile.id,
      filename: req.file.originalname
    });

  } catch (error) {
    console.error('Upload error:', error.message);
    console.error('Error details:', error.response?.data || error);

    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.response?.data : undefined
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 20MB.'
      });
    }
  }

  res.status(500).json({
    success: false,
    error: error.message
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Shopify Upload API running on port ${PORT}`);
  console.log(`Shop: ${SHOPIFY_SHOP}`);
  console.log(`API Version: ${SHOPIFY_API_VERSION}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
