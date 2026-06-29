module.exports = {
    apps: [
        {
            name: "T2U_LMS_Panel_Backend",
            cwd: "/home/sites/T2U_LMS_Panel/current/server",
            script: "npm",
            args: "start",
            instances: 1,
            exec_mode: "fork",
            wait_ready: true,
            listen_timeout: 10000,
            kill_timeout: 5000,
            autorestart: true,
            max_restarts: 10,
            min_uptime: "10s",
            max_memory_restart: "500M",
            env: {
                NODE_ENV: "production",
                PORT: 3040
            }
        },
        {
            name: "T2U_LMS_Panel_Frontend",
            cwd: "/home/sites/T2U_LMS_Panel/current",
            script: "npm",
            args: "start",
            instances: 1,
            exec_mode: "fork",
            wait_ready: true,
            listen_timeout: 10000,
            kill_timeout: 5000,
            autorestart: true,
            max_restarts: 10,
            min_uptime: "10s",
            max_memory_restart: "500M",
            env: {
                NODE_ENV: "production",
                PORT: 3041
            }
        }
    ],

    deploy: {
        production: {
            user: "sites",
            host: "CCL-PROD-SITES",
            ref: "origin/main",
            repo: "git@github.com:codecafe-lab-it-solutions/T2U_LMS_Panel.git",
            path: "/home/sites/T2U_LMS_Panel",
            'post-deploy': 'bash scripts/post-deploy.sh',
            'pre-deploy-local': "echo 'Starting deployment...'",
            'post-setup': "echo 'Initial setup complete'",
            'post-deploy-local': "echo 'This is a local executed command'"
        }
    }
};
