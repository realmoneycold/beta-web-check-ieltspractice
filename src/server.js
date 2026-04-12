const app = require('./app');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initializeOllamaService } = require('./services/ollamaService');
const prisma = require('./models/prisma');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.resend.com", "https://generativelanguage.googleapis.com"],
      mediaSrc: ["'self'", "blob:", "https:"],
      frameSrc: ["'self'", "https://zoom.us", "https://*.zoom.us"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Apply rate limiting to auth routes
app.use('/api/auth', limiter);

const PORT = process.env.PORT || 4000;

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV'
];

const OPTIONAL_ENV_VARS = [
  'GEMINI_API_KEY',
  'RESEND_API_KEY',
  'FRONTEND_URL'
];

/**
 * Validates that all required environment variables are present
 * and warns about missing optional ones.
 */
function validateEnvironment() {
  console.log('🔍 Validating environment variables...');
  const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
  const warnings = [];

  if (missing.length) {
    console.error('❌ Environment validation failed');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  OPTIONAL_ENV_VARS.forEach(v => {
    if (!process.env[v]) {
      warnings.push(`⚠️  ${v} not set - feature disabled`);
    }
  });

  if (warnings.length) {
    warnings.forEach(w => console.warn(w));
  }
  console.log('✅ Environment validation passed');
}

// ─── VALIDATE FRONTEND_URL FOR PRODUCTION ─────────────────
function validateProductionConfig() {
  if (process.env.NODE_ENV === 'production') {
    const frontendUrl = process.env.FRONTEND_URL || '';
    
    if (!frontendUrl) {
      throw new Error(
        '❌ PRODUCTION ERROR: FRONTEND_URL environment variable is required in production\n' +
        '   This URL is used in password reset links, email templates, and callbacks.\n' +
        '   Set FRONTEND_URL to your production domain (e.g., https://ieltspractice.com)'
      );
    }
    
    if (frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1') || frontendUrl.includes('0.0.0.0')) {
      throw new Error(
        '❌ PRODUCTION ERROR: FRONTEND_URL cannot be localhost in production\n' +
        `   Current value: ${frontendUrl}\n` +
        '   Update FRONTEND_URL to your production domain (e.g., https://yourdomain.com)'
      );
    }
    
    // Validate HTTPS for production
    if (!frontendUrl.startsWith('https://')) {
      console.warn(
        '⚠️  WARNING: FRONTEND_URL is not using HTTPS in production\n' +
        `   Current: ${frontendUrl}\n` +
        '   Consider changing to HTTPS for security'
      );
    }
  }
}

/**
 * Redacts password from DATABASE_URL for safe logging
 */
function getRedactedDbUrl() {
  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl) return 'NOT SET';
  try {
    const url = new URL(dbUrl);
    if (url.password) url.password = '********';
    return url.toString();
  } catch (e) {
    // If not a valid URL (e.g. file path for SQLite), just return as is or obscured
    return dbUrl.replace(/:([^:@/]+)@/, ':********@');
  }
}

/**
 * Verifies database connection and basic health on startup
 */
async function verifyDatabase() {
  console.log('📡 Verifying database connection...');
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set in environment variables');
    process.exit(1);
  }

  console.log(`🔗 Database URL: ${getRedactedDbUrl()}`);

  try {
    // 1. Simple connectivity check
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection verified');

    // 2. Check if migrations have likely run by checking for a core table
    // We'll check for 'User' table which should exist in any valid migration state
    try {
      await prisma.user.findFirst({ take: 1 });
      console.log('✅ Database schema verified (User table found)');
    } catch (schemaError) {
      console.warn('⚠️  WARNING: Could not query User table. Migrations might not have run.');
      console.error('❌ Schema error details:', schemaError.message);
      // We don't exit here as it might be a fresh DB, but we log it clearly
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('   Please check if your database is running and DATABASE_URL is correct.');
    process.exit(1);
  }
}

(async () => {
  try {
    // Validate environment variables first
    validateEnvironment();

    // Validate production configuration
    validateProductionConfig();

    // Verify database connection before starting
    await verifyDatabase();
    
    // Initialize Ollama service
    await initializeOllamaService();

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`IELTSPRACTICE API listening on http://localhost:${PORT}`);
      console.log(`Access from this machine or others on: http://0.0.0.0:${PORT}`);
      
      // Log current FRONTEND_URL being used
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
      console.log(`📧 Email links will use: ${frontendUrl}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
