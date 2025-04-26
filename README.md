# Guide: Deploying a Node.js Application with Nginx on AWS EC2

This guide provides step-by-step instructions to deploy your Node.js application (located in `/website` and running on port 6091) on an AWS EC2 instance using Nginx as a reverse proxy.

**Assumptions:**
*   You have an AWS account.
*   You have launched an EC2 instance (preferably Ubuntu or another Debian-based Linux distribution).
*   You have the SSH private key (`.pem` file) for your instance.
*   You know your instance's public IP address or have a domain name pointing to it.

---

**Step 1: Connect to Your EC2 Instance**

Open your local terminal or command prompt and use the SSH command to connect. Replace `your_key_pair.pem`, `ubuntu` (use `ec2-user` for Amazon Linux), and `your_ec2_ip_or_domain` with your actual values.

```bash
ssh -i /path/to/your_key_pair.pem ubuntu@your_ec2_ip_or_domain
```

---

**Step 2: Update System Packages**

Once connected, update your instance's package list and upgrade existing packages:

```bash
sudo apt update
sudo apt upgrade -y
```
*(Use `sudo yum update -y` for CentOS/RHEL/Amazon Linux)*

---

**Step 3: Install Node.js and npm**

Install Node.js (which includes npm). Using NodeSource repositories is recommended for getting specific versions. Replace `18.x` if you need a different major version.

```bash
# Download and import the NodeSource GPG key
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

# Create deb repository
NODE_MAJOR=18 # Or 20, 16, etc.
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list

# Update package list and install Node.js
sudo apt-get update
sudo apt-get install nodejs -y

# Verify installation
node -v
npm -v
```
*(For other distributions, check NodeSource documentation: https://github.com/nodesource/distributions)*

---

**Step 4: Install Nginx**

Install the Nginx web server:

```bash
sudo apt install nginx -y
```
*(Use `sudo yum install nginx -y` or `sudo amazon-linux-extras install nginx1 -y` for CentOS/RHEL/Amazon Linux)*

Start and enable Nginx to run on boot:
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

**Step 5: Configure Firewall (AWS Security Group)**

This is crucial. Go to your AWS EC2 console:
1.  Find your instance.
2.  Click on the **Security Group** associated with it.
3.  Go to the **Inbound rules** tab.
4.  Ensure you have rules allowing traffic on:
    *   **Port 22 (SSH):** From your IP address (for security) or `0.0.0.0/0` (less secure).
    *   **Port 80 (HTTP):** From `0.0.0.0/0` and `::/0` (allows web traffic from anywhere).
    *   **Port 443 (HTTPS):** From `0.0.0.0/0` and `::/0` (if you plan to set up SSL later).
5.  Save the rules.

*(Optional: If you also use `ufw` on the instance itself)*
```bash
sudo ufw allow ssh       # Port 22
sudo ufw allow 'Nginx HTTP' # Port 80
# sudo ufw allow 'Nginx HTTPS' # Port 443 (if using SSL)
sudo ufw enable
sudo ufw status
```

---

**Step 6: Get Your Website Code**

Transfer your application code to the `/website` directory on the EC2 instance. Choose one method:

*   **Method A: Git Clone (Recommended if your code is in a repository)**
    ```bash
    sudo apt install git -y # If git is not installed
    # Clone your repository into a temporary location first
    git clone your_github_repo_url /tmp/my-app
    # Create the target directory and set permissions (adjust user/group if needed)
    sudo mkdir /website
    sudo chown ubuntu:ubuntu /website # Or the user you run commands as
    # Move the contents
    sudo mv /tmp/my-app/* /tmp/my-app/.??* /website/
    sudo rmdir /tmp/my-app
    ```

*   **Method B: SCP (Secure Copy from your local machine)**
    Open *another* local terminal window (don't close the SSH connection).
    ```bash
    # Create the directory on EC2 first via your SSH connection
    # ssh> sudo mkdir /website
    # ssh> sudo chown ubuntu:ubuntu /website

    # Run scp from your local machine
    scp -i /path/to/your_key_pair.pem -r /path/to/your/local/website/* ubuntu@your_ec2_ip_or_domain:/website/
    ```

---

**Step 7: Install Application Dependencies**

Navigate to your project directory on the EC2 instance and install the Node.js packages defined in your `package.json`:

```bash
cd /website
npm install
```
*(Use `sudo npm install` if you encounter permission issues, though running as a non-root user is generally better practice if possible).*

---

**Step 8: Run Your Node.js App with PM2**

PM2 is a process manager that will keep your Node.js application running in the background, restart it if it crashes, and manage logs.

```bash
# Install PM2 globally
sudo npm install pm2 -g

# Navigate to your project directory
cd /website

# Start your application with PM2
# Replace 'node-website' with a name you prefer
pm2 start server.js --name node-website

# Check if the app is running
pm2 list

# (Optional but Recommended) Set up PM2 to start automatically on system boot
pm2 startup systemd
# Follow the instructions given by the command above (it will likely give you a 'sudo env ...' command to run)

# Save the current PM2 process list
pm2 save
```
Your Node.js app should now be running on `localhost:6091` *inside* the EC2 instance.

---

**Step 9: Configure Nginx as a Reverse Proxy**

Tell Nginx to forward incoming web requests (on port 80) to your Node.js app (on port 6091).

1.  **Create the Nginx configuration file:**
    ```bash
    sudo nano /etc/nginx/sites-available/node-website
    ```

2.  **Paste the following configuration.** Remember to **replace `your_ec2_ip_or_domain`** with your instance's public IP or your domain name.

    ```nginx
    server {
        listen 80;
        listen [::]:80;

        server_name your_ec2_ip_or_domain; # Replace!

        root /website; # Optional but good practice

        location / {
            proxy_pass http://localhost:6091; # Forward to Node app
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

3.  **Save and close** the file (Ctrl+X, then Y, then Enter).

4.  **Enable the site configuration** by creating a symbolic link:
    ```bash
    sudo ln -s /etc/nginx/sites-available/node-website /etc/nginx/sites-enabled/
    ```

5.  **(Optional but Recommended)** Remove the default Nginx configuration if it exists to avoid conflicts:
    ```bash
    sudo rm /etc/nginx/sites-enabled/default
    ```

6.  **Test the Nginx configuration** for syntax errors:
    ```bash
    sudo nginx -t
    ```
    If you see "syntax is ok" and "test is successful", proceed. Otherwise, double-check the file `/etc/nginx/sites-available/node-website` for typos.

7.  **Restart Nginx** to apply the changes:
    ```bash
    sudo systemctl restart nginx
    ```

---

**Step 10: (Optional) Set Up SSL/HTTPS with Let's Encrypt**

Using HTTPS is highly recommended for security. Certbot makes this easy.

1.  **Install Certbot:**
    ```bash
    sudo apt install certbot python3-certbot-nginx -y
    ```
    *(Use `sudo yum install certbot python3-certbot-nginx -y` for CentOS/RHEL)*

2.  **Obtain and Install Certificate:** Make sure your domain name in the Nginx config (`server_name`) is correct and points to your EC2 instance's IP address via DNS records.
    ```bash
    sudo certbot --nginx -d your_ec2_ip_or_domain
    ```
    Follow the prompts. Certbot will automatically update your Nginx configuration to handle HTTPS and set up automatic renewal.

3.  **Verify Auto-Renewal:**
    ```bash
    sudo systemctl status certbot.timer
    sudo certbot renew --dry-run
    ```

---

**Step 11: Final Verification**

Open your web browser and navigate to:
*   `http://your_ec2_ip_or_domain` (if you skipped SSL)
*   `https://your_ec2_ip_or_domain` (if you set up SSL)

You should see your Node.js application being served via Nginx.

---

Congratulations! Your Node.js application is deployed on AWS EC2 with Nginx.
