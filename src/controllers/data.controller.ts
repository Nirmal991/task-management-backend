import path from "node:path";

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Joi from "joi";

import { Todo } from "../models";

export const getAllData = async (req: Request, res: Response) => {
  console.log("data");
  Todo.find({}, (err: any, todos: any) => {
    if (err) {
      console.log(err);
      res.status(StatusCodes.BAD_REQUEST).json(err);
    } else {
      console.log(todos);
      res.status(StatusCodes.OK).json(todos);
    }
  });
};

export const createData = async (req: Request, res: Response) => {
  const { title, description } = req.body;
  Todo.create({ title, description }, (err: any, todo: any) => {
    if (err) {
      console.log(err);
    } else {
      res.json(todo);
    }
  });
};

export const updateData = async (req: Request, res: Response) => {
  const { title, description } = req.body;
  Todo.findByIdAndUpdate(
    req.params.id,
    { title, description },
    (err: any, todo: any) => {
      if (err) {
        console.log(err);
      } else {
        res.json(todo);
      }
    }
  );
};

export const deleteData = async (req: Request, res: Response) => {
  Todo.findByIdAndRemove(req.params.id, (err: any, todo: any) => {
    if (err) {
      console.log(err);
    } else {
      res.json(todo);
    }
  });
};
