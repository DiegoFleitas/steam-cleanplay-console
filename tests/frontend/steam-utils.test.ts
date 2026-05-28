import { discoverFriendships, getLocation } from '@src/utils/steamUtils.js';

// Known cheater SteamIDs from the bundled blacklist files
const PAZER_CHEATER = '76561197961520612';
const MCD_CHEATER = '76561199291189951';
const TACOBOT_CHEATER = '76561198820178900';
const CLEAN_STEAMID = '76561197960265728';

describe('steamUtils.getLocation', () => {
  it('returns empty string when location data is missing', async () => {
    await expect(getLocation('XX', 'YY', 123)).resolves.toBe('');
  });

  it('returns a country name for a known country code after lazy init', async () => {
    const location = await getLocation('US');
    expect(location).toBe('United States');
  });

  it('returns city/state/country when all codes are valid', async () => {
    const location = await getLocation('US', 'CA', 5348);
    expect(location).toContain('United States');
  });
});

describe('steamUtils.discoverFriendships', () => {
  it('returns a map containing all provided players', async () => {
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

    const result = await discoverFriendships(players);

    expect(result.size).toBe(2);
    expect(result.get('1')).toBeDefined();
    expect(result.get('2')).toBeDefined();
  });

  it('identifies a known pazer cheater from lazy-loaded blacklist', async () => {
    const players = [
      {
        id: CLEAN_STEAMID,
        groups: [],
        friends: [{ steamid: PAZER_CHEATER }],
      },
      {
        id: PAZER_CHEATER,
        groups: [],
        friends: [{ steamid: CLEAN_STEAMID }],
      },
    ];

    const result = await discoverFriendships(players);
    const entry = result.get(CLEAN_STEAMID)!;

    expect(entry.relatedCheaters?.has(PAZER_CHEATER)).toBe(true);
    expect(entry.blacklist?.has('tf2botdetector')).toBe(true);
  });

  it('identifies a known MCD cheater from lazy-loaded blacklist', async () => {
    const players = [
      {
        id: CLEAN_STEAMID,
        groups: [],
        friends: [{ steamid: MCD_CHEATER }],
      },
      {
        id: MCD_CHEATER,
        groups: [],
        friends: [{ steamid: CLEAN_STEAMID }],
      },
    ];

    const result = await discoverFriendships(players);
    const entry = result.get(CLEAN_STEAMID)!;

    expect(entry.relatedCheaters?.has(MCD_CHEATER)).toBe(true);
    expect(entry.blacklist?.has('mcd')).toBe(true);
  });

  it('identifies a known tacobot cheater from lazy-loaded blacklist', async () => {
    const players = [
      {
        id: CLEAN_STEAMID,
        groups: [],
        friends: [{ steamid: TACOBOT_CHEATER }],
      },
      {
        id: TACOBOT_CHEATER,
        groups: [],
        friends: [{ steamid: CLEAN_STEAMID }],
      },
    ];

    const result = await discoverFriendships(players);
    const entry = result.get(CLEAN_STEAMID)!;

    expect(entry.relatedCheaters?.has(TACOBOT_CHEATER)).toBe(true);
    expect(entry.blacklist?.has('tacobot')).toBe(true);
  });
});
