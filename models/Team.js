const mongoose = require('mongoose');

/* ─────────────────────────────────────────────
   TASK SUB-SCHEMA
───────────────────────────────────────────── */
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    assign: {
      type: String,
      trim: true,
      default: 'Unassigned',
    },
    due: {
      type: String,
      trim: true,
      default: 'TBD',
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    done: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/* ─────────────────────────────────────────────
   TEAM SCHEMA
───────────────────────────────────────────── */
const teamSchema = new mongoose.Schema(
  {
    teamId: {
      type: String,
      required: true,
      unique: true,
      enum: ['tech', 'events', 'digital'],
    },
    tasks: [taskSchema],
  },
  { timestamps: true }
);

/* ─────────────────────────────────────────────
   STATIC METHOD: Initialize Default Teams
───────────────────────────────────────────── */
teamSchema.statics.initializeDefaults = async function () {
  const defaultTeams = ['tech', 'events', 'digital'];

  for (let id of defaultTeams) {
    const exists = await this.findOne({ teamId: id });
    if (!exists) {
      await this.create({ teamId: id, tasks: [] });
      console.log(`✔ Team created: ${id}`);
    }
  }
};

module.exports = mongoose.model('Team', teamSchema);
