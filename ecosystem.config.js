require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'server-api',        
      script: 'src/app.js',
      env: {
        NODE_ENV: 'development',
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: process.env.DB_PASSWORD,
        DB_NAME: process.env.DB_NAME,
      },
      env_production: {
        NODE_ENV: 'production',
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT,
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: process.env.DB_PASSWORD,
        DB_NAME: process.env.DB_NAME,
      },
    },
  ],
};
