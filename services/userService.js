const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

// Register a new user
const registerUser = async (data) => {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }]
      }
    });

    if (existingUser) {
      throw new Error('User with this email or phone already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        avatar: data.avatar
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { user, token };
  } catch (error) {
    throw new Error(`Registration failed: ${error.message}`);
  }
};

// Login user
const loginUser = async (email, password) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar
      },
      token
    };
  } catch (error) {
    throw new Error(`Login failed: ${error.message}`);
  }
};

// Get user by ID
const getUserById = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
};

// Update user profile
const updateUserProfile = async (userId, data) => {
  try {
    const updateData = {};

    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.avatar) updateData.avatar = data.avatar;
    if (data.phone) {
      // Check if phone is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          phone: data.phone,
          NOT: { id: userId }
        }
      });
      if (existingUser) {
        throw new Error('Phone number already in use');
      }
      updateData.phone = data.phone;
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return user;
  } catch (error) {
    if (error.code === 'P2025') {
      throw new Error('User not found');
    }
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

// Change password
const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    return { message: 'Password changed successfully' };
  } catch (error) {
    throw new Error(`Failed to change password: ${error.message}`);
  }
};

// Delete user account
const deleteUserAccount = async (userId) => {
  try {
    const user = await prisma.user.delete({
      where: { id: userId },
      select: {
        id: true,
        email: true
      }
    });

    return { message: 'User account deleted successfully', user };
  } catch (error) {
    if (error.code === 'P2025') {
      throw new Error('User not found');
    }
    throw new Error(`Failed to delete user: ${error.message}`);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
  changePassword,
  deleteUserAccount
};
