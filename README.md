# How to use the skeleton

## Get the code

You have 3 options for getting the code:

- **_(recommended)_** Click the green "Use this template" button
- Clone the repo
- Download the zip file

## Get set up

Let's get the database all setup! Follow [these instructions](https://www.mongodb.com/basics/clusters/mongodb-cluster-setup) to setup your MongoDB cluster. We're going to keep your credential string safe in a `.env` file.

### Install dependencies - easy way

I wrote a short Python script to automate the setup. Run `python setup.py` and input the relevant fields to automagically set your project up, including your connection string from Mongo.

### Install dependencies - manual way

1. Run `npm install` from the project root to install the dependencies for the Express server.
2. Run `cd client && npm install` to install the dependencies for the React frontend.
3. Create a `.env` file in the root of the project.
4. Add the following line to the `.env` file, replacing `YOUR_CONNECTION` with your connection string: `MONGO_SRV=YOUR_CONNECTION`

## How to run the app locally

Now that we have the database configured and all of the dependencies installed, let's test out the app in development mode.

1. From the root of the project, run `npm run dev` to start both the Express server and the React frontend. When you make changes to any files, your app will automatically update for you, so no need to rerun this command.
2. Open [http://localhost:3000](http://localhost:3000) to view the skeleton in the browser. You should see the rendered skeleton awaiting.
3. Go to [http://localhost:3000/api-test](http://localhost:3000/api-test) to test if your API is working properly. Alternatively, you can open [http://localhost:8000/api/](http://localhost:8000/api/) to view the raw API response. You should see a JSON object with a message: `{message: "Hello world"}`

## What to change in the skeleton to make it your own

There's not too much you need to do besides adding all your custom code. Here's a list of things you should change:

1. Change the name of the app in `package.json`
2. Change the page title in `client/public/index.html`
3. Change the favicon in `client/public/favicon.ico`
4. Add your own logos in `client/public/logo192.png` and `client/public/logo512.png`
5. Build out your API by adding routers to `server/` and importing them in `api/index.ts`
6. Build out your frontend by adding pages to `client/src/pages` and components to `client/src/components` and importing them in `client/src/App.tsx`

## How to deploy to Vercel

Let's deploy to vercel!

1. Push your updated code to your repo.
2. Create an account on [Vercel](https://vercel.com/).
3. Create a new project and click the "Continue with GitHub" button to link to your repo.
4. Use the following settings for your project:
   - **Output Directory:** `client/build`
   - **Install Command:** `npm install && cd client && npm install`
     ![Vercel Configuration](./tutorial_images/build_config.png)
5. Add the following environment variables:
   - `MONGO_SRV` - your MongoDB connection string
     ![Vercel environment variables](./tutorial_images/env_config.png)
6. Click "Deploy" and wait for your app to deploy!

You can check out the deployed site for this skeleton [here](https://vercel-mern-skeleton.vercel.app/).
