import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { publicApi } from '../services/api.js';
import { SiteProvider } from '../context/SiteContext.jsx';
import { clearPublicCache } from '../utils/hooks.js';
import App from '../App.jsx';

vi.mock('../services/api.js', async (orig) => {
  const actual = await orig();
  const fn = () => vi.fn();
  return {
    ...actual,
    publicApi: {
      settings: fn(), navigation: fn(), page: fn(), projects: fn(), project: fn(), skills: fn(), experience: fn(),
      resolveRedirect: fn(), contact: fn(),
    },
  };
});

const SETTINGS = {
  siteTitle: 'Ada Dev',
  logo: { type: 'text', text: 'AD' },
  theme: { mode: 'dark', primary: '#38bdf8', secondary: '#818cf8', accent: '#34d399', background: '#0b1120', allowToggle: true },
  contact: { email: 'ada@example.com' },
  social: [],
  header: { showContactButton: true, contactButton: { label: 'Hire me', url: '/contact', visible: true, style: 'primary' } },
  footer: { intro: 'Footer intro from API', copyright: '© {year} Ada' },
  seo: { titleTemplate: '%s | Ada' },
  resume: {},
};

const notFound = () => Object.assign(new Error('nf'), { response: { status: 404, data: { error: { message: 'Page not found' } } } });

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SiteProvider>
        <App />
      </SiteProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  clearPublicCache();
  publicApi.settings.mockResolvedValue(SETTINGS);
  publicApi.navigation.mockResolvedValue({ main: [{ id: 'n1', label: 'Work', url: '/projects' }], footer: [] });
  publicApi.skills.mockResolvedValue([]);
  publicApi.experience.mockResolvedValue([]);
  publicApi.projects.mockResolvedValue([]);
  publicApi.resolveRedirect.mockRejectedValue(notFound());
});

describe('public website rendering', () => {
  it('renders homepage content from the API (nothing hard-coded)', async () => {
    publicApi.page.mockResolvedValue({
      slug: 'home',
      pageType: 'home',
      title: 'Home',
      seo: {},
      sections: [
        {
          id: 's1',
          type: 'hero',
          visible: true,
          style: {},
          data: { name: 'Ada Lovelace', title: 'Analytical Engineer', intro: 'Intro from the CMS', primaryButton: { label: 'See my work', url: '/projects', visible: true, style: 'primary' }, image: {}, availability: { show: false } },
          },
      ],
    });
    renderAt('/');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Ada Lovelace');
    expect(screen.getByText('Intro from the CMS')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /see my work/i })).toHaveAttribute('href', '/projects');
    expect(screen.getAllByText('Hire me')[0]).toBeInTheDocument();
    expect(screen.getByText('Footer intro from API')).toBeInTheDocument();
    expect(publicApi.page).toHaveBeenCalledWith('home');
    await waitFor(() => expect(document.title).toBe('Ada Dev'));
  });

  it('lists published projects from the API and hides missing demo/source buttons', async () => {
    publicApi.page.mockResolvedValue({
      slug: 'projects', pageType: 'projects', title: 'Projects', seo: {},
      sections: [{ id: 'p', type: 'projects', visible: true, style: {}, data: { heading: 'All Projects', mode: 'all', limit: 12, columns: '3', viewAllButton: { visible: false } } }],
    });
    publicApi.projects.mockResolvedValue([
      { _id: '1', slug: 'alpha', title: 'Alpha App', summary: 'First', technologies: ['React'], demoUrl: 'https://alpha.example.com', repoUrl: '' },
      { _id: '2', slug: 'beta', title: 'Beta API', summary: 'Second', technologies: [], demoUrl: '', repoUrl: 'https://github.com/x/beta' },
    ]);
    renderAt('/projects');
    expect(await screen.findByRole('link', { name: 'Alpha App' })).toHaveAttribute('href', '/projects/alpha');
    expect(screen.getByRole('link', { name: 'Beta API' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Alpha App live demo' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Alpha App source code' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Beta API live demo' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Beta API source code' })).toBeInTheDocument();
  });

  it('does not render hidden sections', async () => {
    publicApi.page.mockResolvedValue({
      slug: 'about', pageType: 'about', title: 'About', seo: {},
      sections: [
        { id: 'a', type: 'textImage', visible: true, style: {}, data: { heading: 'Visible heading', body: '', image: {}, button: {} } },
        { id: 'b', type: 'textImage', visible: false, style: {}, data: { heading: 'Hidden heading', body: '', image: {}, button: {} } },
      ],
    });
    renderAt('/about');
    expect(await screen.findByText('Visible heading')).toBeInTheDocument();
    expect(screen.queryByText('Hidden heading')).not.toBeInTheDocument();
  });

  it('survives invalid or unknown section content without crashing', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    publicApi.page.mockResolvedValue({
      slug: 'odd', pageType: 'custom', title: 'Odd', seo: {},
      sections: [
        { id: 'x', type: 'unknownType', visible: true, data: {} },
        { id: 'y', type: 'stats', visible: true, style: {}, data: { heading: 'Broken stats', items: 'not-an-array' } },
        null,
        { id: 'z', type: 'cta', visible: true, style: {}, data: { heading: 'Still rendered', primaryButton: { label: 'Go', url: 'javascript:alert(1)', visible: true } } },
      ],
    });
    renderAt('/odd');
    expect(await screen.findByText('Still rendered')).toBeInTheDocument();
    // Unsafe URL is not rendered as a link.
    expect(screen.queryByRole('link', { name: /^go$/i })).not.toBeInTheDocument();
    spy.mockRestore();
  });

  it('shows a 404 page for unknown slugs', async () => {
    publicApi.page.mockRejectedValue(notFound());
    renderAt('/does-not-exist');
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('follows a configured redirect when a page moved', async () => {
    publicApi.page.mockImplementation((slug) => (slug === 'old' ? Promise.reject(notFound()) : Promise.resolve({ slug: 'new', pageType: 'custom', title: 'New', seo: {}, sections: [{ id: 'n', type: 'cta', visible: true, style: {}, data: { heading: 'Moved here' } }] })));
    publicApi.resolveRedirect.mockResolvedValue({ to: '/new', statusCode: 301 });
    renderAt('/old');
    expect(await screen.findByText('Moved here')).toBeInTheDocument();
  });

  it('shows an error state when the API is down', async () => {
    publicApi.settings.mockRejectedValue(Object.assign(new Error('down'), { response: undefined }));
    publicApi.page.mockResolvedValue({ slug: 'home', title: 'Home', sections: [] });
    renderAt('/');
    expect(await screen.findByText(/temporarily unavailable/i)).toBeInTheDocument();
  });
});
