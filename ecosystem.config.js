module.exports = {
  apps: [{
    name: "po-generator",
    script: "server.js",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "500M",
    env: {
      NODE_ENV: "production",
      PORT: 4789
    },
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    out_file: "logs/out.log",
    error_file: "logs/error.log"
  }]
}; 