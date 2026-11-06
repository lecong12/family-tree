# Deploy NestJS Backend to Vercel

This guide explains how to deploy the NestJS backend to Vercel using the serverless configuration.

## Prerequisites

1.  **Vercel Account**: Create an account at [vercel.com](https://vercel.com).
2.  **Vercel CLI** (Optional): Install globally via `npm i -g vercel` for local testing.

## Configuration Files Created

We have added the following files to enable Vercel deployment:

1.  `backend/src/vercel.ts`: This is the entry point for the Vercel serverless function. It wraps the NestJS application in an Express adapter.
2.  `backend/vercel.json`: This configuration file tells Vercel how to build and route requests to the application.

## Deployment Steps

### Option 1: Deploy via Git Integration (Recommended)

1.  Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2.  Go to the Vercel Dashboard and click **"Add New..."** -> **"Project"**.
3.  Import your repository.
4.  **Configure Project**:
    - **Root Directory**: Select `backend` (since your NestJS app is in the `backend` folder).
    - **Framework Preset**: Vercel should automatically detect it or select "Other".
    - **Build Command**: `nest build` (or leave default if it detects package.json scripts).
    - **Output Directory**: Leave the default; `backend/vercel.json` configures the serverless function entry point.
    - **Install Command**: `npm install` (or `yarn`).
5.  **Environment Variables**:
    - Set `MONGO_URI` to a reachable MongoDB Atlas connection string (Vercel cannot connect to your computer's `localhost` MongoDB).
    - Set `JWT_SECRET` (or `JWT_SECRET_KEY`) and `ADMIN_PASSWORD`.
    - Set `FRONTEND_URL` to the deployed frontend origin, such as `https://your-app.vercel.app`. Multiple origins can be comma-separated.
    - Set any Cloudinary credentials used by the app.
6.  Click **Deploy**.

### Option 2: Deploy via CLI

1.  Navigate to the `backend` directory in your terminal:
    ```bash
    cd backend
    ```
2.  Run the deploy command:
    ```bash
    vercel
    ```
3.  Follow the prompts to link the project.
4.  Set up environment variables in the Vercel dashboard or via CLI:
    ```bash
    vercel env add MONGO_URI
    # ... repeat for other variables
    ```
5.  Deploy to production:
    ```bash
    vercel --prod
    ```

## Important Notes

- **Cold Starts**: Serverless functions may have a slight delay (cold start) if they haven't been used recently.
- **Database Connections**: Use a reachable MongoDB provider such as Atlas, and configure its network access to permit connections from the Vercel deployment.
- **Troubleshooting 500 errors**: Check the deployment's Function Logs in Vercel. A missing Mongo URI or an unreachable/unauthorized database prevents Nest from starting. After changing environment variables, redeploy the Backend project.
- **CORS**: Add the frontend's exact origin to the allowlist in `backend/src/vercel.ts`; a CORS error is separate from a `500 FUNCTION_INVOCATION_FAILED` backend startup error.
