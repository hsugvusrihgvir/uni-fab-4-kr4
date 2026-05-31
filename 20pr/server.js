const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = 3000;
const mongoUrl = 'mongodb://admin:1234@localhost:27017/pr20?authSource=admin';

const userSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
    },
    first_name: {
      type: String,
      required: true,
      trim: true,
    },
    last_name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 0,
    },
    created_at: {
      type: Number,
      default: () => Date.now(),
    },
    updated_at: {
      type: Number,
      default: () => Date.now(),
    },
  },
  {
    versionKey: false,
    id: false,
  }
);

const User = mongoose.model('User', userSchema);

app.use(express.json());

app.post('/api/users', async (req, res) => {
  try {
    const last = await User.findOne().sort({ id: -1 });
    const user = new User({
      id: last ? last.id + 1 : 1,
      ...req.body,
    });

    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().sort({ created_at: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: Number(req.params.id) });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { id: Number(req.params.id) },
      {
        ...req.body,
        updated_at: Date.now(),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ id: Number(req.params.id) });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function start() {
  await mongoose.connect(mongoUrl);
  console.log('Connected to MongoDB');

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

start().catch((err) => {
  console.error('Connection error:', err);
  process.exit(1);
});
