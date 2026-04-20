import dayjs from "dayjs";

export function generateGame(playerCount) {
  let game = { created_at: dayjs().valueOf(), phase: "rooms", round: 1 }; // phases are "room", "rounds", "boom"

  game.rounds = generateDefaultRounds(playerCount);

  return game;
}

export function generateDefaultRounds(playerCount) {
  // Official Leader Card table from Two Rooms and a Boom rulebook
  // 22+ players: 5 rounds, hostages 5,4,3,2,1
  if (playerCount >= 22) {
    return [
      { time: 5, hostages: 5 },
      { time: 4, hostages: 4 },
      { time: 3, hostages: 3 },
      { time: 2, hostages: 2 },
      { time: 1, hostages: 1 },
    ];
  }
  // 18-21 players: 5 rounds, hostages 4,3,2,1,1
  if (playerCount >= 18) {
    return [
      { time: 5, hostages: 4 },
      { time: 4, hostages: 3 },
      { time: 3, hostages: 2 },
      { time: 2, hostages: 1 },
      { time: 1, hostages: 1 },
    ];
  }
  // 14-17 players: 5 rounds, hostages 3,2,2,1,1
  if (playerCount >= 14) {
    return [
      { time: 5, hostages: 3 },
      { time: 4, hostages: 2 },
      { time: 3, hostages: 2 },
      { time: 2, hostages: 1 },
      { time: 1, hostages: 1 },
    ];
  }
  // 11-13 players: 5 rounds, hostages 2,2,1,1,1
  if (playerCount >= 11) {
    return [
      { time: 5, hostages: 2 },
      { time: 4, hostages: 2 },
      { time: 3, hostages: 1 },
      { time: 2, hostages: 1 },
      { time: 1, hostages: 1 },
    ];
  }
  // 6-10 players (Basic Game): 3 rounds, 1 hostage each
  // Official rules: NO color reveals & ONLY 3 rounds without 11 players
  return [
    { time: 3, hostages: 1 },
    { time: 2, hostages: 1 },
    { time: 1, hostages: 1 },
  ];
}
