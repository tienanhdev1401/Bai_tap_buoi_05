const Joi = require('joi');

const registerValidation = {
  body: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('user', 'admin').optional(),
  }),
};

const loginValidation = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const createProductValidation = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    category: Joi.string().required(),
    price: Joi.number().positive().required(),
    imageUrl: Joi.string().uri().allow('', null),
    discountPercent: Joi.number().min(0).max(100).optional(),
    isOnSale: Joi.boolean().optional(),
    views: Joi.number().min(0).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
  }),
};

module.exports = { registerValidation, loginValidation, createProductValidation };
