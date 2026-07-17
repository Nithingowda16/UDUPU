# Production Deployment Guide

This guide details steps for containerizing and deploying the virtual try-on application onto Google Cloud Compute Engine (GCE), utilizing Google Cloud Storage (GCS) for media assets, and reverse-proxying with Nginx.

---

## 1. Local Container Verification

Test your container suite locally using Docker Compose before pushing to cloud nodes:

```bash
# Build and run containers in detached mode
docker-compose up --build -d

# Verify containers are healthy
docker-compose ps

# Monitor execution streams
docker-compose logs -f
```

---

## 2. Google Cloud Compute Engine VM Setup

1. **Launch VM Instance**:
   - Go to Google Cloud Console > Compute Engine > VM Instances.
   - Click **Create Instance**.
   - Machine type: `e2-medium` (2 vCPUs, 4 GB RAM) is recommended to handle OpenCV alpha blending.
   - OS Boot disk: `Ubuntu 22.04 LTS` (x86/64).
2. **Configure Firewalls**:
   - Enable **Allow HTTP traffic** and **Allow HTTPS traffic**.
   - Under VPC Networks > Firewall, verify ingress rule for port `80` and `443` is set to `0.0.0.0/0` (all source IPs).
3. **Install Docker on Ubuntu VM**:
   SSH into your VM and install Docker:
   ```bash
   sudo apt-get update
   sudo apt-get install -y docker.io docker-compose git
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

---

## 3. Storage Integration: Google Cloud Storage (GCS)

To serve user uploads and outputs from GCS instead of the local VM disk:

1. **Create GCS Bucket**:
   - Go to Cloud Storage > Buckets.
   - Click **Create**. Name it (e.g. `aurastyle-media-bucket`).
   - Choose region close to GCE VM.
   - Set Access control to **Uniform**, and uncheck "Enforce public access prevention on this bucket" if you want users to download composite results directly via URL (or keep it private and generate signed URLs).
2. **Authorize VM Service Account**:
   - Create a Service Account under IAM & Admin > Service Accounts with **Storage Object Admin** permissions.
   - Download the private key file in JSON format (e.g., `gcs-credentials.json`).
3. **Configure Environment Variables**:
   In your root `.env` or in the GCE VM, add path details:
   ```env
   USE_GCS=true
   GCS_BUCKET_NAME=aurastyle-media-bucket
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcs-credentials.json
   ```
   *Note: Our application code has default fallbacks to local disk storage if `USE_GCS` is false.*

---

## 4. Run Deploy Command on GCE

1. Clone codebase onto VM:
   ```bash
   git clone https://github.com/your-username/Try-on.git /var/www/aura-tryon
   cd /var/www/aura-tryon
   ```
2. Place key credentials in secure locations and run Compose:
   ```bash
   sudo docker-compose -f docker-compose.yml up --build -d
   ```
3. Visit your VM instance's External IP address in the browser to access AuraStyle.
