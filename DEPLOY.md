# Deploying to Fly.io

This guide will help you deploy the CoverGen application to Fly.io.

## Prerequisites

1. Install the Fly.io CLI:
   ```bash
   # For macOS
   brew install flyctl
   
   # For Linux
   curl -L https://fly.io/install.sh | sh
   
   # For Windows with PowerShell
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. Sign up for Fly.io and login:
   ```bash
   fly auth signup
   # or if you already have an account
   fly auth login
   ```

## Deployment Steps

1. Make sure you have committed all your changes to git.

2. Make sure your environment variables are correctly set in `fly.toml`

3. Launch your app (first-time deployment):
   ```bash
   fly launch
   ```
   - This will detect your Next.js app and create a Fly app for you
   - Choose a name for your app (must be globally unique)
   - Choose a region closest to your users
   - Skip adding a PostgreSQL or MongoDB database (we're using Supabase)

4. Deploy your app:
   ```bash
   fly deploy
   ```

5. Open your app in the browser:
   ```bash
   fly open
   ```

## Setting Environment Variables

If you need to update environment variables after deployment:

```bash
fly secrets set NEXT_PUBLIC_VARIABLE_NAME="value" ANOTHER_VARIABLE="value"
```

For sensitive environment variables (not NEXT_PUBLIC ones):

```bash
fly secrets set STRIPE_SECRET_KEY="sk_test_..."
```

## Scaling

To scale your app:

```bash
# Add another instance
fly scale count 2

# Change VM size
fly scale vm shared-cpu-1x
```

## Viewing Logs

To view your app's logs:

```bash
fly logs
```

## Troubleshooting

If you encounter issues with the deployment:

1. Check your app's logs:
   ```bash
   fly logs
   ```

2. SSH into your app's VM:
   ```bash
   fly ssh console
   ```

3. Check if your app is running:
   ```bash
   fly status
   ```

## Rollback

If something goes wrong, you can roll back to a previous deployment:

```bash
fly deploy --image registry.fly.io/covergen:<VERSION>
```

Replace `<VERSION>` with the version you want to roll back to, which you can find with `fly releases`.

## Additional Resources

- [Fly.io Documentation](https://fly.io/docs/)
- [Next.js on Fly.io](https://fly.io/docs/js/frameworks/nextjs/)
- [Fly.io Dashboard](https://fly.io/dashboard) 