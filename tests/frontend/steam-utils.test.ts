import { discoverFriendships, getLocation } from '@src/utils/steamUtils.js';

describe('steamUtils.getLocation', () => {
  it('returns empty string when location data is missing', () => {
    expect(getLocation('XX', 'YY', 123)).toBe('');
  });
});

describe('steamUtils.discoverFriendships', () => {
  it('returns a map containing all provided players', () => {
    const players = [
      {
        id: '1',
        groups: [],
        friends: [{ steamid: '2' }],
      },
      {
        id: '2',
        groups: [],
        friends: [{ steamid: '1' }],
      },
    ];

    const result = discoverFriendships(players);

    expect(result.size).toBe(2);
    expect(result.get('1')).toBeDefined();
    expect(result.get('2')).toBeDefined();
  });
});
