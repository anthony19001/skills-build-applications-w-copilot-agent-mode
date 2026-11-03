import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Invalid activity input'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as {
    userId?: unknown;
    teamId?: unknown;
    type?: unknown;
    minutes?: unknown;
  };

  if (
    typeof userId !== 'string' ||
    typeof teamId !== 'string' ||
    !mongoose.isValidObjectId(userId) ||
    !mongoose.isValidObjectId(teamId) ||
    typeof type !== 'string' ||
    type.trim().length === 0 ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw Object.assign(new Error('Invalid activity input'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.findById(userId).lean(),
    Team.findById(teamId).lean(),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('User or team does not exist'), { status: 404 });
  }

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Invalid team input'), { status: 400 });
  }

  const { name, mascot, members = [] } = input as {
    name?: unknown;
    mascot?: unknown;
    members?: unknown;
  };

  if (
    typeof name !== 'string' ||
    name.trim().length === 0 ||
    typeof mascot !== 'string' ||
    mascot.trim().length === 0 ||
    !Array.isArray(members)
  ) {
    throw Object.assign(new Error('Invalid team input'), { status: 400 });
  }

  const memberIds = members.map((member) => String(member));
  if (
    memberIds.some((memberId) => !mongoose.isValidObjectId(memberId))
  ) {
    throw Object.assign(new Error('Invalid team member ID'), { status: 400 });
  }

  const foundMembers = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
  if (foundMembers.length !== new Set(memberIds).size) {
    throw Object.assign(new Error('Team member does not exist'), { status: 404 });
  }

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: memberIds,
  });
  await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  return team;
}

export async function getLeaderboard() {
  const entries = await Activity.aggregate([
    {
      $group: {
        _id: '$team',
        totalPoints: { $sum: '$points' },
      },
    },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    {
      $project: {
        _id: 0,
        teamName: '$team.name',
        totalPoints: 1,
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User does not exist'), { status: 404 });
  }

  const recentActivity = await Activity.findOne({ user: user._id })
    .sort({ occurredAt: -1 })
    .lean();

  let focus = typeof user.fitnessGoal === 'string' ? user.fitnessGoal : '';
  if (recentActivity?.type === 'run' || recentActivity?.type === 'cycle' || recentActivity?.type === 'walk') {
    focus = 'endurance';
  } else if (recentActivity?.type === 'strength') {
    focus = 'strength';
  } else if (!focus) {
    focus = 'mobility';
  }

  const workout = await Workout.findOne({ focus }).lean();
  if (!workout) {
    const fallback = await Workout.findOne().lean();
    if (!fallback) return [];
    return [{
      ...fallback,
      reason: `Matches your ${focus} activity pattern`,
    }];
  }

  const activityType = typeof recentActivity?.type === 'string'
    ? recentActivity.type
    : focus;
  return [{
    ...workout,
    reason: `Matches your ${activityType} activity and ${focus} goal`,
  }];
}

export { User };
