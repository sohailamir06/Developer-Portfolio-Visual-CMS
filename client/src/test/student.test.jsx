import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PageRenderer } from '../components/sections/index.jsx';
import ProjectCard from '../components/sections/ProjectCard.jsx';
import { isResumeLink } from '../utils/track.js';

const renderSections = (sections) =>
  render(
    <MemoryRouter>
      <PageRenderer sections={sections} />
    </MemoryRouter>,
  );

describe('student portfolio sections', () => {
  it('renders education with degree, school, period, grade and highlights', () => {
    renderSections([
      {
        id: 'e',
        type: 'education',
        visible: true,
        style: {},
        data: { heading: 'Education', items: [{ institution: 'TU Berlin', degree: 'B.Sc. Computer Science', period: '2022 – 2026', grade: 'GPA 1.7', highlights: ['Thesis: Realtime collaboration'], logo: {} }] },
      },
    ]);
    expect(screen.getByRole('heading', { name: 'B.Sc. Computer Science' })).toBeInTheDocument();
    expect(screen.getByText('TU Berlin')).toBeInTheDocument();
    expect(screen.getByText('2022 – 2026')).toBeInTheDocument();
    expect(screen.getByText('GPA 1.7')).toBeInTheDocument();
    expect(screen.getByText('Thesis: Realtime collaboration')).toBeInTheDocument();
  });

  it('renders certificates with a credential link, and hides empty sections publicly', () => {
    renderSections([
      { id: 'c', type: 'certifications', visible: true, style: {}, data: { heading: 'Certificates', items: [{ kind: 'award', title: 'Hackathon winner', issuer: 'HackZurich', date: '2025', credentialUrl: 'https://example.com/proof' }] } },
      { id: 'empty', type: 'education', visible: true, style: {}, data: { heading: 'Empty education', items: [] } },
    ]);
    expect(screen.getByRole('heading', { name: 'Hackathon winner' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View credential/ })).toHaveAttribute('href', 'https://example.com/proof');
    expect(screen.queryByText('Empty education')).not.toBeInTheDocument();
  });

  it('shows project role, year and first highlight on the card', () => {
    render(
      <MemoryRouter>
        <ProjectCard project={{ _id: '1', slug: 'x', title: 'Campus App', role: 'Frontend lead', year: '2025', highlights: ['Used by 2,000 students'], technologies: [] }} />
      </MemoryRouter>,
    );
    expect(screen.getByText('My role: Frontend lead')).toBeInTheDocument();
    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(screen.getByText('Used by 2,000 students')).toBeInTheDocument();
  });

  it('recognises CV download links', () => {
    expect(isResumeLink('/uploads/2026/10/cv.pdf')).toBe(true);
    expect(isResumeLink('https://cdn.example.com/my-cv', 'https://cdn.example.com/my-cv')).toBe(true);
    expect(isResumeLink('/projects')).toBe(false);
  });
});
