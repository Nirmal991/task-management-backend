import path from "node:path";
import process from "node:process";

import "dotenv/config";
import dotenv from 'dotenv';
import e, { json, static as serve } from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose, { ConnectOptions } from "mongoose";

import { HOST, PORT, connectToMongo } from "./lib";
import routes from "./routes";

dotenv.config();

const api = e();
// api.disable("etag");
api.use(
  cors({
    origin: "http://localhost:8100", 
    credentials: true,              
  })
);
api.use(
  helmet({
    contentSecurityPolicy: false, //blocks unauthorized scripts
  })
);

api.use(json());
api.use(routes);

connectToMongo().then(() => {
  api.listen(PORT, HOST, () => console.log(`API listing on port:- ${PORT}`));
});

module.exports = api;//?
