# Youth Night School Mini Program

A full-stack demo project featuring a WeChat Mini Program frontend and Cloud Functions backend, supporting daily check-in and points tracking. Uses an external MySQL database as the sole data source.

## Features

- My Points: Displays total points and check-in records
- Night School Tasks: Perform daily check-in, refresh points and records
- Cloud Function `dailySign`: Accesses external MySQL only, supports `status` and `sign` actions

## Directory Structure

- `miniprogram/pages/points/`: Points page
- `miniprogram/pages/tasks/`: Night school tasks page (check-in)
- `miniprogram/pages/mine/`: My page (total points, check-in count)
- `cloudfunctions/dailySign/`: Daily check-in cloud function (Node.js)

## Deployment (SCF Local ZIP Upload)

1. Install dependencies locally
   - In `cloudfunctions/dailySign` directory:
     - `npm config set registry https://registry.npmmirror.com`
     - `npm install --production`
   - For Node.js 10.15 runtime, use `mysql2@2.3.3`; if upgraded to Node.js 16, use `^3.x`.

2. Package and upload
   - Zip as `dailySign.zip`, including: `index.js`, `package.json`, `package-lock.json`, `node_modules/`
   - In Tencent Cloud SCF Console, select function `dailySign`, runtime `Nodejs10.15` or higher, upload ZIP and deploy.

3. Environment variables (strongly recommended to set in cloud function config):

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

Security tip: Do not hardcode database credentials in source code or commit to Git. Use cloud platform environment variables for sensitive info management.

Mini Program
- Source code is in `miniprogram/`, open and debug with WeChat DevTools. Ensure cloud functions are deployed and configured with correct URLs or backend environment.

Git / Push to GitHub (Quick Guide)
1. Local commit:

```
git add README.md
git commit -m "docs: update README"
```

2. Bind remote and push (if not already bound):

```
git branch -M main
git remote add origin https://github.com/<your-username>/Youth-Night-School.git
git push -u origin main
```

If remote exists, just run `git push`.

More Info & Contribution
- For deploying, testing, or extending cloud functions, check the corresponding function directory under `cloudfunctions/` for README or code comments.
- Feel free to submit issues or Pull Requests describing improvements or fixes.

---

If you want me to commit and push to your GitHub (requires remote configured and push permission), I can run `git add/commit/push` for you. Please confirm if you want to proceed.

// All comments in this README are written in English for international collaboration.

