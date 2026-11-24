import { escapeCellText } from '../../public/src/vac-check/tableUtils';

describe('escapeCellText', () => {
  it('neutralises HTML from a Steam profile summary', () => {
    expect(escapeCellText('<img src=x onerror="alert(1)">')).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;',
    );
  });

  it('escapes ampersands and single quotes', () => {
    expect(escapeCellText("Tom & Jerry's")).toBe('Tom &amp; Jerry&#39;s');
  });

  it('passes plain text through unchanged', () => {
    expect(escapeCellText('Just a normal summary.')).toBe('Just a normal summary.');
  });

  it('renders null/undefined as empty string', () => {
    expect(escapeCellText(null)).toBe('');
    expect(escapeCellText(undefined)).toBe('');
  });
});
