var dbConfig = {
  username: process.env.CUSTOMCONNSTR_USER,
  password: process.env.CUSTOMCONNSTR_PASSWORD,
  db: process.env.CUSTOMCONNSTR_DB,
  host: process.env.CUSTOMCONNSTR_HOST,
  port: process.env.CUSTOMCONNSTR_PORT
};

module.exports = dbConfig;
