// server/models/__tests__/players.test.js
// Tests for player profile functions

const { formatName, calculateAge, getAgeRange, findProfileByNameAndBirthday, createProfile, getProfileById, players } = require('../players');

describe('formatName', () => {
  // Basic functionality: capitalization and case handling
  test.each([
    ['kyle', 'Kyle'],
    ['KYLE', 'Kyle'],
    ['kYlE', 'Kyle'],
    ['john smith', 'John Smith'],
    ['MARY JANE', 'Mary Jane'],
    ['jOhN sMiTh', 'John Smith'],
  ])('should capitalize names correctly: "%s" → "%s"', (input, expected) => {
    expect(formatName(input)).toBe(expected);
  });

  // Space handling: multiple spaces, trimming
  test.each([
    ['john   smith', 'John Smith'],
    ['mary  jane  doe', 'Mary Jane Doe'],
    ['  kyle  ', 'Kyle'],
    ['  john smith  ', 'John Smith'],
  ])('should handle spaces: "%s" → "%s"', (input, expected) => {
    expect(formatName(input)).toBe(expected);
  });

  // Edge cases: empty/null/whitespace
  test.each([
    ['', ''],
    ['   ', '   '],
    [null, null],
    [undefined, undefined],
  ])('should handle edge cases: %s → %s', (input, expected) => {
    expect(formatName(input)).toBe(expected);
  });

  // Special characters: remove symbols/numbers/emojis, keep hyphens/apostrophes
  test.each([
    ['John@Smith', 'John Smith'],
    ['Mary#Jane', 'Mary Jane'],
    ['Bob123', 'Bob'],
    ['Alice!Doe', 'Alice Doe'],
    ['John😀Smith', 'John Smith'],
    ['Mary-Jane', 'Mary-Jane'],
    ["O'Brien", "O'Brien"],
    ["Mary-Jane O'Brien", "Mary-Jane O'Brien"],
    ['John@Smith123!', 'John Smith'],
  ])('should handle special characters: "%s" → "%s"', (input, expected) => {
    expect(formatName(input)).toBe(expected);
  });

  // Edge cases: only special chars, hyphens/apostrophes at boundaries
  test.each([
    ['123!@#', ''],
    ['!!!', ''],
    ['123', ''],
    ['---', ''],
    ["'''", ''],
    ["--'--", ''],
    ['-John', 'John'],
    ['John-', 'John'],
    ["'John", 'John'],
    ["John'", 'John'],
    ['-John-', 'John'],
  ])('should handle edge cases: "%s" → "%s"', (input, expected) => {
    expect(formatName(input)).toBe(expected);
  });

  // Normalization: multiple hyphens/apostrophes, spaces around them
  test.each([
    ['Mary--Jane', 'Mary-Jane'],
    ["O''Brien", "O'Brien"],
    ['Mary---Jane', 'Mary-Jane'],
    ['Mary - Jane', 'Mary - Jane'],
    ["Mary ' Jane", "Mary ' Jane"],
    ['Mary  -  Jane', 'Mary - Jane'],
  ])('should normalize formatting: "%s" → "%s"', (input, expected) => {
    expect(formatName(input)).toBe(expected);
  });
});

describe('calculateAge', () => {
  // Mock Date to return fixed date: June 15, 2024
  const FIXED_DATE = new Date('2024-06-15T12:00:00Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_DATE);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Basic age calculation: birthdays in the past
  test('should calculate age correctly from past birthdays', () => {
    // Test various ages (reference date: June 15, 2024)
    expect(calculateAge('1999-05-15')).toBe(25); // Born May 15, 1999 → 25 on June 15, 2024
    expect(calculateAge('1993-12-31')).toBe(30); // Born Dec 31, 1993 → 30 on June 15, 2024 (hasn't had birthday yet)
    expect(calculateAge('2014-01-01')).toBe(10); // Born Jan 1, 2014 → 10 on June 15, 2024
    expect(calculateAge('1974-06-30')).toBe(49); // Born June 30, 1974 → 49 on June 15, 2024 (hasn't had birthday yet)
    expect(calculateAge('1974-06-15')).toBe(50); // Born June 15, 1974 → 50 on June 15, 2024 (birthday today)
    expect(calculateAge('1974-06-14')).toBe(50); // Born June 14, 1974 → 50 on June 15, 2024 (already had birthday)
  });

  // Birthday timing: hasn't occurred vs already occurred this year
  test('should handle birthday timing correctly', () => {
    // Reference date: June 15, 2024

    // Birthday today (counts as having occurred)
    expect(calculateAge('1999-06-15')).toBe(25); // Born June 15, 1999 → 25 on June 15, 2024

    // Birthday earlier this year (already occurred)
    expect(calculateAge('1999-05-15')).toBe(25); // Born May 15, 1999 → 25 on June 15, 2024

    // Birthday later this year (hasn't occurred yet)
    expect(calculateAge('1999-07-15')).toBe(24); // Born July 15, 1999 → 24 on June 15, 2024 (hasn't had birthday yet)
    expect(calculateAge('1999-12-31')).toBe(24); // Born Dec 31, 1999 → 24 on June 15, 2024 (hasn't had birthday yet)
  });

  // Year boundaries: Dec 31 and Jan 1 edge cases
  test('should handle year boundary birthdays correctly', () => {
    // Reference date: June 15, 2024

    // Dec 31 birthday - hasn't occurred yet this year
    expect(calculateAge('1998-12-31')).toBe(25); // Born Dec 31, 1998 → 25 on June 15, 2024 (hasn't had birthday yet)

    // Jan 1 birthday - already occurred this year
    expect(calculateAge('1999-01-01')).toBe(25); // Born Jan 1, 1999 → 25 on June 15, 2024 (already had birthday)
  });

  // Leap year: Feb 29 should be treated as Feb 28
  test('should handle leap year birthdays (Feb 29 → Feb 28)', () => {
    // Reference date: June 15, 2024

    // Feb 29 in a leap year should be treated as Feb 28
    // Person born on Feb 29, 2000 (leap year) - treat as Feb 28
    expect(calculateAge('2000-02-29')).toBe(24); // Born Feb 29, 2000 → 24 on June 15, 2024 (treated as Feb 28, birthday already occurred)

    // Feb 29 in non-leap year should throw specific error
    // Test multiple non-leap years to ensure coverage
    expect(() => calculateAge('2001-02-29')).toThrow('Invalid date. February 29 only exists in leap years');
    expect(() => calculateAge('1900-02-29')).toThrow('Invalid date. February 29 only exists in leap years'); // 1900 is not a leap year (divisible by 100 but not 400)
    expect(() => calculateAge('2100-02-29')).toThrow('Invalid date. February 29 only exists in leap years'); // 2100 is not a leap year
  });

  // Age extremes: very young and very old
  test('should handle age extremes correctly', () => {
    // Reference date: June 15, 2024
    
    // Age 0: born this year, birthday today
    expect(calculateAge('2024-06-15')).toBe(0); // Born June 15, 2024 → 0 on June 15, 2024 (birthday today)
    
    // Age 0: born last year, birthday hasn't occurred yet this year
    expect(calculateAge('2023-07-15')).toBe(0); // Born July 15, 2023 → 0 on June 15, 2024 (hasn't had birthday yet)
    
    // Age 1: born last year, birthday already occurred this year
    expect(calculateAge('2023-05-15')).toBe(1); // Born May 15, 2023 → 1 on June 15, 2024 (already had birthday)
    
    // Very old: 100+ years
    expect(calculateAge('1924-01-01')).toBe(100); // Born Jan 1, 1924 → 100 on June 15, 2024
    expect(calculateAge('1904-06-15')).toBe(120); // Born June 15, 1904 → 120 on June 15, 2024 (birthday today)
  });

  // Invalid inputs: should throw errors
  test.each([
    [null, 'null'],
    [undefined, 'undefined'],
    ['', 'empty string'],
    ['1990-5-15', 'missing leading zeros'],
    ['1990/05/15', 'wrong separator'],
    ['05-15-1990', 'wrong format'],
    ['1990-13-01', 'invalid month'],
    ['1990-00-15', 'month zero'],
    ['1990-05-00', 'day zero'],
    ['1990-02-30', 'invalid day for month'],
    ['1990-04-31', 'invalid day for month'],
    [' 1990-05-15 ', 'extra spaces'],
    ['1990-05-15T00:00:00Z', 'ISO format with time'],
    ['abc', 'non-numeric'],
    ['1990', 'incomplete date'],
    ['1990-05', 'missing day'],
  ])('should throw error for invalid input: %s (%s)', (input, description) => {
    expect(() => calculateAge(input)).toThrow();
  });

  // Future dates: should throw errors
  test('should throw error for future dates', () => {
    // Reference date: June 15, 2024

    // Future year
    expect(() => calculateAge('2025-05-15')).toThrow();

    // Future month this year
    expect(() => calculateAge('2024-07-15')).toThrow(); // July 15, 2024 is in the future

    // Future day this month
    expect(() => calculateAge('2024-06-16')).toThrow(); // June 16, 2024 is in the future
  });
});

describe('getAgeRange', () => {
  test('should return "10 and under" for ages 0-9', () => {
    expect(getAgeRange(0)).toBe('10 and under');
    expect(getAgeRange(5)).toBe('10 and under');
    expect(getAgeRange(9)).toBe('10 and under');
  });

  test('should return "11-15" for ages 11-15', () => {
    expect(getAgeRange(11)).toBe('11-15');
    expect(getAgeRange(13)).toBe('11-15');
    expect(getAgeRange(15)).toBe('11-15');
  });

  test('should return "16-20" for ages 16-20', () => {
    expect(getAgeRange(16)).toBe('16-20');
    expect(getAgeRange(18)).toBe('16-20');
    expect(getAgeRange(20)).toBe('16-20');
  });

  test('should return "21-25" for ages 21-25', () => {
    expect(getAgeRange(21)).toBe('21-25');
    expect(getAgeRange(23)).toBe('21-25');
    expect(getAgeRange(25)).toBe('21-25');
  });

  test('should return "26-30" for ages 26-30', () => {
    expect(getAgeRange(26)).toBe('26-30');
    expect(getAgeRange(28)).toBe('26-30');
    expect(getAgeRange(30)).toBe('26-30');
  });

  test('should return "31-35" for ages 31-35', () => {
    expect(getAgeRange(31)).toBe('31-35');
    expect(getAgeRange(33)).toBe('31-35');
    expect(getAgeRange(35)).toBe('31-35');
  });

  test('should return "36-40" for ages 36-40', () => {
    expect(getAgeRange(36)).toBe('36-40');
    expect(getAgeRange(38)).toBe('36-40');
    expect(getAgeRange(40)).toBe('36-40');
  });

  test('should return "41+" for ages 41 and older', () => {
    expect(getAgeRange(41)).toBe('41+');
    expect(getAgeRange(50)).toBe('41+');
    expect(getAgeRange(100)).toBe('41+');
  });

  test('should handle edge case: age 10', () => {
    // Age 10 falls between "10 and under" and "11-15"
    // Should default to "10 and under" or handle as needed
    expect(getAgeRange(10)).toBe('10 and under');
  });
});

describe('findProfileByNameAndBirthday', () => {
  beforeEach(() => {
    // Clear players map before each test
    players.clear();
  });

  test('should return null if no profile exists', () => {
    expect(findProfileByNameAndBirthday('John Smith', '1990-05-15')).toBeNull();
  });

  test('should find profile by exact formatted name and birthday match', () => {
    // Create a profile first
    const profile = createProfile('john smith', '1990-05-15', 'male');
    const profileId = profile.id;

    // Find it using different name casing (should still match after formatting)
    const found = findProfileByNameAndBirthday('JOHN SMITH', '1990-05-15');
    expect(found).not.toBeNull();
    expect(found.id).toBe(profileId);
    expect(found.name).toBe('John Smith'); // Should be formatted
  });

  test('should return null if name matches but birthday does not', () => {
    createProfile('John Smith', '1990-05-15', 'male');
    expect(findProfileByNameAndBirthday('John Smith', '1991-05-15')).toBeNull();
  });

  test('should return null if birthday matches but name does not', () => {
    createProfile('John Smith', '1990-05-15', 'male');
    expect(findProfileByNameAndBirthday('Jane Doe', '1990-05-15')).toBeNull();
  });

  test('should handle multiple profiles with same name but different birthdays', () => {
    const profile1 = createProfile('John Smith', '1990-05-15', 'male');
    const profile2 = createProfile('John Smith', '1991-06-20', 'male');

    // Should find the correct one by birthday
    expect(findProfileByNameAndBirthday('John Smith', '1990-05-15').id).toBe(profile1.id);
    expect(findProfileByNameAndBirthday('John Smith', '1991-06-20').id).toBe(profile2.id);
  });
});

describe('createProfile', () => {
  beforeEach(() => {
    players.clear();
  });

  test('should create profile with UUID as id', () => {
    const profile = createProfile('John Smith', '1990-05-15', 'male');
    expect(profile.id).toBeDefined();
    expect(profile.id).toMatch(/^profile-/); // Should start with "profile-"
    expect(profile.id).not.toBe('profile-John Smith-1990-05-15'); // Should be UUID, not name-based
  });

  test('should format name when creating profile', () => {
    const profile = createProfile('john smith', '1990-05-15', 'male');
    expect(profile.name).toBe('John Smith');
  });

  test('should store birthday as provided', () => {
    const profile = createProfile('John Smith', '1990-05-15', 'male');
    expect(profile.birthday).toBe('1990-05-15');
  });

  test('should store gender as provided', () => {
    const profile = createProfile('John Smith', '1990-05-15', 'female');
    expect(profile.gender).toBe('female');
  });

  test('should calculate and store age', () => {
    // Mock Date to fixed date: June 15, 2024
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));

    const profile = createProfile('John Smith', '1990-05-15', 'male');
    expect(profile.age).toBe(34); // Born May 15, 1990 → 34 on June 15, 2024

    jest.useRealTimers();
  });

  test('should calculate and store ageRange', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));

    const profile = createProfile('John Smith', '1990-05-15', 'male');
    expect(profile.ageRange).toBe('31-35'); // Age 34 → "31-35"

    jest.useRealTimers();
  });

  test('should initialize stats to zero', () => {
    const profile = createProfile('John Smith', '1990-05-15', 'male');
    expect(profile.gamesPlayed).toBe(0);
    expect(profile.pointsEarnedAsClueGiver).toBe(0);
    expect(profile.turnsAsClueGiver).toBe(0);
    expect(profile.lifetimeCardsOffered).toBe(0);
    expect(profile.lifetimeCardsDrafted).toBe(0);
  });

  test('should initialize createdCards as empty array', () => {
    const profile = createProfile('John Smith', '1990-05-15', 'male');
    expect(profile.createdCards).toEqual([]);
  });

  test('should set lastActive timestamp', () => {
    const before = Date.now();
    const profile = createProfile('John Smith', '1990-05-15', 'male');
    const after = Date.now();
    expect(profile.lastActive).toBeGreaterThanOrEqual(before);
    expect(profile.lastActive).toBeLessThanOrEqual(after);
  });

  test('should create unique profiles even with same name and birthday', () => {
    const profile1 = createProfile('John Smith', '1990-05-15', 'male');
    const profile2 = createProfile('John Smith', '1990-05-15', 'male');
    expect(profile1.id).not.toBe(profile2.id);
    expect(profile1).not.toBe(profile2);
  });

  test('should add profile to main storage map', () => {
    const profile = createProfile('John Smith', '1990-05-15', 'male');
    expect(players.has(profile.id)).toBe(true);
    expect(players.get(profile.id)).toBe(profile);
  });
});

describe('getProfileById', () => {
  beforeEach(() => {
    players.clear();
  });

  test('should return null if profile does not exist', () => {
    expect(getProfileById('non-existent-id')).toBeNull();
  });

  test('should return profile if it exists', () => {
    const created = createProfile('John Smith', '1990-05-15', 'male');
    const retrieved = getProfileById(created.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved.id).toBe(created.id);
    expect(retrieved.name).toBe('John Smith');
  });

  test('should auto-update age when profile is retrieved', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));

    const profile = createProfile('John Smith', '1990-05-15', 'male');
    expect(profile.age).toBe(34);

    // Advance time by 1 year
    jest.setSystemTime(new Date('2025-06-15T12:00:00Z'));

    // Retrieve profile - age should be updated
    const retrieved = getProfileById(profile.id);
    expect(retrieved.age).toBe(35); // Should be 35 now

    jest.useRealTimers();
  });

  test('should auto-update ageRange when age crosses boundary', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-06-15T12:00:00Z'));

    // Create profile that will be 35 (in "31-35" range)
    const profile = createProfile('John Smith', '1989-06-15', 'male');
    expect(profile.age).toBe(35);
    expect(profile.ageRange).toBe('31-35');

    // Advance time by 1 year - now 36 (should be "36-40")
    jest.setSystemTime(new Date('2025-06-15T12:00:00Z'));

    const retrieved = getProfileById(profile.id);
    expect(retrieved.age).toBe(36);
    expect(retrieved.ageRange).toBe('36-40');

    jest.useRealTimers();
  });

  test('should update lastActive when profile is retrieved', () => {
    const profile = createProfile('John Smith', '1990-05-15', 'male');
    const originalLastActive = profile.lastActive;

    // Wait a bit
    jest.useFakeTimers();
    jest.advanceTimersByTime(1000);

    const retrieved = getProfileById(profile.id);
    expect(retrieved.lastActive).toBeGreaterThan(originalLastActive);

    jest.useRealTimers();
  });
});

