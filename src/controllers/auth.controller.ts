import jwt, { SignOptions } from "jsonwebtoken";
import { JWT_SECRET, loginSchema, signUpSchema } from "../lib";
import { IUser } from "../models";
import User from '../models/user.model'
import { RequestHandler } from "express";
import bcrypt from "bcryptjs";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in environment variables");
}

export const createToken = (user: IUser) => {
  const payload = { id: user._id, username: user.username, email: user.email };

  const expiresIn: SignOptions["expiresIn"] =
    (process.env.JWT_EXPIRES_IN as SignOptions["expiresIn"]) || "1d";

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
  });
};

export const signUp: RequestHandler = async (req, res) => {
  const { error, value } = signUpSchema.validate(req.body, {
    abortEarly: false, // continues checking all errors
  });

  if (error) {
    return res.status(400).json({
      message: "Validation error",
      errors: error.details.map((err) => err.message),
    });
  }

  const { username, email, password } = value;

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = new User({ username, email, password: hashed });
    await user.save();

    const token = createToken(user);

    return res.status(201).json({
      message: "User registered successfully",
      token,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const login: RequestHandler = async (req,res) => {

    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });

    if (error) {
    return res.status(400).json({
      message: "Validation error",
      errors: error.details.map((error) => error.message),
    });
  }

   const { username, password } = value;

    try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = createToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
}catch(error){

    console.error(error);
    return res.status(500).json({ message: "Server error" });
}
};

export const getAllUser: RequestHandler = async (req,res) =>{
  try {
    const user = await User.find().select("-password");

    return res.status(200).json({
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
}

//Get User By Id
export const getUserById: RequestHandler = async (req,res) => {

  const { id } = req.params;

  try{

     const user = await User.findById(id).select("-password");

    if(!user){
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "User fetched successfully",
      data: user,
    });
  }catch(error){
    console.error(error)
  }
}
