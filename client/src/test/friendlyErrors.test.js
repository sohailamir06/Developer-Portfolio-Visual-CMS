import { describe, expect, it } from 'vitest';
import { friendlyMessage, humanizePath } from '../admin/friendlyErrors.js';

describe('friendly error messages', () => {
  it('names page sections and fields in plain language', () => {
    const sections = [{ type: 'hero' }, { type: 'cta' }];
    expect(humanizePath('sections.0.data.primaryButton.url', sections)).toBe('Intro banner (section 1) › Main button › Link');
    expect(humanizePath('sections.1.style.anchorId', sections)).toBe('Invitation banner (section 2) › Jump-link name');
  });

  it('translates common field names', () => {
    expect(humanizePath('seo.description')).toBe('Search & sharing › Description');
    expect(humanizePath('demoUrl')).toBe('Live demo link');
    expect(humanizePath('gallery.2.alt')).toBe('Gallery › item 3 › Picture description');
  });

  it('rewrites technical error summaries', () => {
    expect(friendlyMessage({ message: 'Validation failed' })).toMatch(/need fixing/);
    expect(friendlyMessage({ status: 0, message: 'Network Error' })).toMatch(/internet connection/);
    expect(friendlyMessage({ status: 401, message: 'Authentication required' })).toMatch(/signed out/);
    // A wrong password must keep its own message.
    expect(friendlyMessage({ status: 401, message: 'Invalid email or password' })).toBe('Invalid email or password');
  });
});
