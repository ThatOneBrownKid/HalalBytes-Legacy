# Local Development Environment (Docker)

This guide explains how to run the application locally using Docker and connect to a remote Amazon RDS database for testing.

## Prerequisites

Ensure you have the following installed:

- **Docker Desktop** (or Docker Engine)
- **Docker Compose** (usually included with Docker Desktop)
- **pgAdmin** (or another PostgreSQL client like DBeaver) for inspecting the database

---

## 1. Running the Application Container

### Step 1.1: Build the Docker Image

Navigate to your project root (where the `Dockerfile` is located) and build the image:

```sh
docker build -t halalbytes-app .
```

### Step 1.2: Database Connection Variables

When running the container, pass the correct environment variables so the application can connect to the remote RDS instance.

> **🚨 IMPORTANT:**  
> Update your RDS Security Group to allow traffic on port `5432` from your local machine's public IP address.

### Step 1.3: Run the Container

Replace bracketed values (`[...]`) with your actual RDS credentials and secrets:

```sh
docker run -p 3000:3000 \
    -e RAILS_ENV=development \
    -e DATABASE_URL="postgres://[MASTER_USERNAME]:[MASTER_PASSWORD]@[RDS_ENDPOINT]:5432/[DB_NAME]" \
    -e SECRET_KEY_BASE=[YOUR_SECRET_KEY] \
    # Add any other secrets from Secrets Manager here:
    -e [SECRET_1_NAME]=[SECRET_1_VALUE] \
    halalbytes-app
```

---

## 2. Setting up the Database Locally (pgAdmin)

Use pgAdmin (or similar) to browse and manage your remote RDS instance.

### Step 2.1: Open pgAdmin and Start Connection Wizard

- Open pgAdmin
- Right-click on **Servers** in the browser panel
- Select **Create > Server...**

### Step 2.2: Connection Details

Configure the connection using your RDS details:

| Tab        | Setting              | Value                              |
| ---------- | -------------------- | ---------------------------------- |
| General    | Name                 | Halalbytes RDS - [Your Name]       |
| Connection | Host name/address    | [YOUR_RDS_ENDPOINT_URL]            |
| Connection | Port                 | 5432                               |
| Connection | Maintenance database | postgres (or your initial DB name) |
| Connection | Username             | [MASTER_USERNAME]                  |
| Connection | Password             | [MASTER_PASSWORD]                  |

### Step 2.3: Save and Connect

Click **Save**. If your RDS Security Group allows your IP (see Step 1.2), pgAdmin will connect and you can browse the `halalbytes-dev-1` database under the "Databases" tree.

---

## Deploying to ECR (AWS)

1. **Authenticate Docker to your registry:**

   ```sh
   aws ecr get-login-password --region us-east-2 | \
       docker login --username AWS --password-stdin 339713040556.dkr.ecr.us-east-2.amazonaws.com
   ```

   > **Note:**  
   > If you get an error, ensure you have the latest AWS CLI and Docker installed.

2. **Build your Docker image:**

   ```sh
   docker build -t halalbytes/development .
   ```

3. **Tag your image:**

   ```sh
   docker tag halalbytes/development:latest \
       339713040556.dkr.ecr.us-east-2.amazonaws.com/halalbytes/development:latest
   ```

4. **Push the image to AWS ECR:**

   ```sh
   docker push 339713040556.dkr.ecr.us-east-2.amazonaws.com/halalbytes/development:latest
   ```
