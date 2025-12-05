import Joi from "joi";

export const signUpSchema = Joi.object({
  username: Joi.string().min(3).max(30).required().messages({
    "string.base": "Username must be a string",
    "string.empty": "Username is required",
    "string.min": "Username must be at least 3 characters",
    "any.required": "Username is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Email must be a valid email",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "Password must be at least 6 characters",
    "any.required": "Password is required",
  }),
});

export const loginSchema = Joi.object({
  username: Joi.string().required().messages({
    "any.required": "Username is required",
    "string.empty": "Username is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
    "string.empty": "Password is required",
  }),
});

export const createOrgSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Organization name is required",
    "any.required": "Organization name is required",
  }),
  domain: Joi.string().domain().optional().allow("", null).messages({
    "string.domain": "Domain must be a valid domain (example.com)",
  }),
});

export const createProjectSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().allow("", null),
  startDate: Joi.date().optional(),
  endDate: Joi.date().min(Joi.ref("startDate")).optional(),
});

export const updateProjectSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  description: Joi.string().allow("", null),
  startDate: Joi.date(),
  endDate: Joi.date().min(Joi.ref("startDate")),
}).min(1);

export const createTaskSchema = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().allow("", null),
  status: Joi.string()
    .valid("pending", "in_progress", "completed", "cancelled")
    .default("pending"),
  priority: Joi.string().valid("low", "medium", "high").default("medium"),
  assignees: Joi.array().items(Joi.string().hex().length(24)).optional(),
  watchers: Joi.array().items(Joi.string().hex().length(24)).optional(),
  dueDate: Joi.date().optional(),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().min(2).max(200),
  description: Joi.string().allow("", null),
  status: Joi.string().valid("pending", "in_progress", "completed", "cancelled"),
  priority: Joi.string().valid("low", "medium", "high"),
  assignees: Joi.array().items(Joi.string().hex().length(24)),
  watchers: Joi.array().items(Joi.string().hex().length(24)),
  dueDate: Joi.date(),
}).min(1);

export const addCommentSchema = Joi.object({
  text: Joi.string().min(1).max(1000).required(),
});

export const assignTaskSchema = Joi.object({
  assignees: Joi.array().items(Joi.string().hex().length(24)).min(1).required(),
});
