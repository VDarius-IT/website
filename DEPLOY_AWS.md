# Deploying this Node.js Website to AWS

This guide provides general steps and considerations for deploying this Node.js/Express application to Amazon Web Services (AWS). The specific steps can vary depending on the chosen AWS service and your exact requirements.

## Prerequisites

1.  **AWS Account:** You need an active AWS account.
2.  **Code Repository:** Your website code should be stored in a Git repository (e.g., GitHub, AWS CodeCommit, Bitbucket).
3.  **Node.js & npm:** Installed locally for testing and potentially bundling.
4.  **AWS CLI (Optional):** The AWS Command Line Interface can be helpful for managing resources.
5.  **Git:** Installed locally.

## Deployment Options Overview

AWS offers several services suitable for hosting Node.js applications:

1.  **Amazon EC2 (Elastic Compute Cloud):**
    *   **Pros:** Full control over the server environment (OS, software installs, configuration). Flexible.
    *   **Cons:** Requires manual setup and ongoing management (OS updates, security patches, Node.js installation, process management, web server configuration).
    *   **Good for:** Users needing fine-grained control or specific configurations not easily met by managed services.

2.  **AWS Elastic Beanstalk:**
    *   **Pros:** Platform as a Service (PaaS). Simplifies deployment by managing the underlying infrastructure, OS, Node.js runtime, application deployment, load balancing, and scaling.
    *   **Cons:** Less control over the underlying infrastructure compared to EC2. Configuration is done through the Beanstalk console/CLI/config files.
    *   **Good for:** Standard web applications where you want to focus on code rather than infrastructure management.

3.  **AWS App Runner:**
    *   **Pros:** Fully managed service designed for containers or source code. Very simple deployment from a code repository or container image. Handles scaling, load balancing, and SSL automatically.
    *   **Cons:** Less configurable than Beanstalk or EC2. Best suited for containerized applications or simple web apps fitting its model.
    *   **Good for:** Quick deployments, simple web apps/APIs, containerized workflows.

4.  **Amazon ECS / EKS (with Fargate or EC2):**
    *   **Pros:** Powerful container orchestration services for managing containerized applications at scale. Highly scalable and flexible.
    *   **Cons:** More complex setup and management compared to Beanstalk or App Runner. Requires understanding of containers and orchestration concepts.
    *   **Good for:** Microservices, large-scale applications, complex container workflows.

## General Deployment Steps (Using EC2 as Example)

This is a common, albeit manual, approach.

1.  **Launch EC2 Instance:**
    *   Go to the EC2 console in your AWS account.
    *   Launch a new instance. Choose an appropriate Amazon Machine Image (AMI), like Amazon Linux 2 or Ubuntu Server.
    *   Select an instance type (e.g., `t2.micro` or `t3.micro` might be sufficient for starting).
    *   Configure instance details (VPC, subnet - defaults are often okay to start).
    *   Configure storage (default is usually fine).
    *   Add tags (optional, e.g., Name: MyNodeWebsite).
    *   **Configure Security Group:** Create a new security group or select an existing one. Ensure it allows inbound traffic on:
        *   **SSH (Port 22):** From your IP address only (for secure access).
        *   **HTTP (Port 80):** From Anywhere (IPv4: `0.0.0.0/0` and IPv6: `::/0`) - Needed for Nginx/web server.
        *   **HTTPS (Port 443):** From Anywhere (if you plan to use SSL directly on EC2 or via a Load Balancer).
        *   **Custom App Port (e.g., 6090 TCP):** From `localhost` or the EC2 instance itself (`127.0.0.1/32`) if using a reverse proxy like Nginx. If accessing the Node app directly (not recommended for production), open it to required sources (e.g., Anywhere). **Ensure your specific port (e.g., 6090) is allowed.**
    *   Review and launch. Create or select an existing key pair to connect via SSH.

2.  **Connect to Instance:**
    *   Use SSH with the key pair you selected to connect to your instance's public IP address or DNS name.
    *   Example (Linux/macOS): `ssh -i /path/to/your-key.pem ec2-user@YOUR_INSTANCE_IP` (Username might be `ubuntu` for Ubuntu AMIs).

3.  **Install Environment:**
    *   Update the package manager:
        *   Amazon Linux: `sudo yum update -y`
        *   Ubuntu: `sudo apt update && sudo apt upgrade -y`
    *   Install Node.js and npm (use NodeSource repository for specific versions or NVM for flexibility):
        *   *Refer to official Node.js or NVM installation guides for the specific commands for your chosen OS.*
    *   Install Git:
        *   Amazon Linux: `sudo yum install git -y`
        *   Ubuntu: `sudo apt install git -y`

4.  **Get Your Code:**
    *   Clone your Git repository: `git clone YOUR_REPOSITORY_URL`
    *   Navigate into the project directory: `cd your-project-directory` (e.g., `cd node-website`)

5.  **Install Dependencies:**
    *   Run `npm install`

6.  **Install Process Manager (PM2):**
    *   A process manager keeps your app running and restarts it if it crashes.
    *   Install PM2 globally: `sudo npm install pm2 -g`

7.  **Start Application:**
    *   **Important:** If your app needs to run on a specific port (like 6090), set the `PORT` environment variable when starting. Your `server.js` already looks for `process.env.PORT`.
    *   Start your app using PM2, setting the port: `PORT=6090 pm2 start server.js --name "node-website"` (Replace 6090 if needed. The `--name` is optional but helpful).
    *   **Troubleshooting:** Check if the app started correctly: `pm2 list` (Should show status as `online`).
    *   **Troubleshooting:** If not online or behaving unexpectedly, check the application logs: `pm2 logs node-website` (Look for errors).

8.  **Ensure App Runs on Boot:**
    *   Generate PM2 startup script: `pm2 startup`
    *   Follow the instructions provided by the command (usually involves running a `sudo` command).
    *   Save the current process list: `pm2 save`

9.  **Set up Reverse Proxy (Recommended - Nginx Example):**
    *   Install Nginx:
        *   Amazon Linux: `sudo amazon-linux-extras install nginx1 -y`
        *   Ubuntu: `sudo apt install nginx -y`
    *   Configure Nginx to proxy requests from port 80 to your Node.js app (running on port 3000):
        *   Edit the Nginx configuration file (e.g., `/etc/nginx/conf.d/default.conf` or `/etc/nginx/sites-available/default`).
        *   Replace the default `location / { ... }` block with something like:
            ```nginx
            # Example for proxying HTTP (port 80) to Node app on port 6090
            server {
                listen 80 default_server;
                listen [::]:80 default_server;

                server_name _; # Or your domain name

                location / {
                    proxy_pass http://localhost:6090; # Forward to Node app on its specific port
                    proxy_http_version 1.1;
                    proxy_set_header Upgrade $http_upgrade;
                    proxy_set_header Connection 'upgrade';
                    proxy_set_header Host $host;
                    proxy_cache_bypass $http_upgrade;
                }
            }
            ```
        *   **Note:** Ensure the `proxy_pass` port matches the port your Node.js application is listening on (e.g., 6090).
        *   **Note:** If SSL is handled *externally* (e.g., by your domain provider redirecting HTTPS to HTTP, or by an AWS Load Balancer), Nginx typically still listens on port 80 as shown above. If you were handling SSL directly on EC2 with Nginx, you would have a separate `server` block listening on port 443.
    *   Test Nginx configuration: `sudo nginx -t`
    *   Start/Restart Nginx:
        *   Amazon Linux: `sudo systemctl restart nginx && sudo systemctl enable nginx`
        *   Ubuntu: `sudo systemctl restart nginx && sudo systemctl enable nginx`
    *   Now your app should be accessible via the instance's public IP (or your domain) on port 80 (or 443 if SSL configured).
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
            }
            ```
    *   Test Nginx configuration: `sudo nginx -t`
    *   Start/Restart Nginx:
        *   Amazon Linux: `sudo systemctl start nginx && sudo systemctl enable nginx`
        *   Ubuntu: `sudo systemctl start nginx && sudo systemctl enable nginx`
    *   Now your app should be accessible via the instance's public IP on port 80.

## Simpler Alternatives

*   **Elastic Beanstalk:** Zip your code (ensure `package.json` is correct, *exclude* `node_modules`), create a Node.js environment in the Beanstalk console, and upload the zip. Beanstalk handles the rest.
*   **App Runner:** Push your code to GitHub/CodeCommit. Create an App Runner service, connect it to your repository, configure the build (`npm install`) and start (`node server.js` or use `npm start` if defined in `package.json`) commands, and specify port 3000. App Runner handles building and deployment.

## Important Considerations

*   **Environment Variables:** Avoid hardcoding sensitive information or configuration (like database credentials or specific ports). Use environment variables. Services like EC2 (set manually or via user data), Beanstalk, and App Runner provide ways to configure these. Your `server.js` already uses `process.env.PORT || 3000`, which is good practice.
*   **Domain Name:** Point a custom domain name to your EC2 instance IP, Elastic Beanstalk environment URL, or App Runner URL using DNS (e.g., AWS Route 53).
*   **SSL/TLS (HTTPS):** Essential for security.
    *   **EC2 with External SSL:** If your domain provider handles SSL termination and forwards traffic (e.g., HTTPS -> HTTP) to your EC2 instance's port 80, your Nginx setup listening on port 80 (as shown in the example) is likely correct. Ensure your domain points correctly to the EC2 instance IP.
    *   **EC2 with Load Balancer:** Use an Application Load Balancer (ALB) with an ACM certificate. The ALB handles HTTPS (port 443) and forwards traffic (usually HTTP on port 80) to your EC2 instance(s). Your EC2 security group only needs to allow port 80 from the ALB. Nginx on EC2 listens on port 80 and proxies to your Node app (e.g., 6090).
    *   **EC2 Direct SSL:** Manually install certificates (e.g., Let's Encrypt via Certbot) on the instance and configure Nginx/Apache to listen on port 443 and handle SSL termination before proxying to your Node app.
    *   **Beanstalk/App Runner:** Can often integrate directly with ACM for managed certificates.
*   **Security:** Regularly update your server (if using EC2), configure security groups tightly, manage access keys securely, and follow general AWS security best practices.
*   **Database:** If your application needs a database, consider AWS RDS (managed relational database) or DynamoDB (NoSQL).

This guide provides a starting point. Consult the official AWS documentation for the specific service you choose for detailed instructions.