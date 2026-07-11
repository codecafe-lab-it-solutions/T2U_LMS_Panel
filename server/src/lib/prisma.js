const { PrismaClient } = require('../generated/prisma');

// Shared singleton — Node module cache ensures only one instance per process.
const prisma = new PrismaClient();

module.exports = prisma;
