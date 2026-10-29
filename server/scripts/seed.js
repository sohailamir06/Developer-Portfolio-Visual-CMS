/*
 * Loads clearly-labelled SAMPLE content (skills, projects, an experience placeholder) so the
 * site has something to render. Safe to run repeatedly: it only inserts into empty collections.
 *   npm run seed
 */
import { connectDB, disconnectDB } from '../config/db.js';
import { ensureDefaults } from '../services/defaults.js';
import Skill from '../models/Skill.js';
import Project from '../models/Project.js';
import Experience from '../models/Experience.js';

const SKILLS = {
  Frontend: [['HTML', 'FileCode'], ['CSS', 'Palette'], ['JavaScript', 'Braces'], ['React', 'Atom'], ['Responsive Design', 'MonitorSmartphone']],
  Backend: [['Node.js', 'Server'], ['Express.js', 'Route'], ['REST APIs', 'Webhook']],
  Database: [['MongoDB', 'Database'], ['PostgreSQL', 'DatabaseZap']],
  Tools: [['Git', 'GitBranch'], ['GitHub', 'Github'], ['Docker', 'Container']],
};

const PROJECTS = [
  {
    title: 'Sample Project — Task Manager',
    summary: 'Sample project entry. Replace it with a real project from Admin → Projects.',
    content: '<p><em>This is sample content.</em> Describe the problem, your approach, the architecture and the result.</p><h3>Highlights</h3><ul><li>Feature one</li><li>Feature two</li></ul>',
    technologies: ['React', 'Node.js', 'MongoDB'],
    category: 'Web App',
    featured: true,
  },
  {
    title: 'Sample Project — REST API',
    summary: 'Sample project entry demonstrating a backend-focused card.',
    content: '<p><em>This is sample content.</em> Document endpoints, authentication and testing strategy.</p>',
    technologies: ['Express.js', 'PostgreSQL'],
    category: 'API',
    featured: true,
  },
  {
    title: 'Sample Project — Portfolio CMS',
    summary: 'Sample project entry. Projects without demo/source links hide those buttons automatically.',
    content: '<p><em>This is sample content.</em></p>',
    technologies: ['React', 'Tailwind CSS'],
    category: 'Web App',
    featured: false,
  },
];

async function main() {
  await connectDB();
  await ensureDefaults();

  if ((await Skill.countDocuments()) === 0) {
    let order = 0;
    const docs = Object.entries(SKILLS).flatMap(([category, items]) => items.map(([name, icon]) => ({ name, icon, category, order: order++ })));
    await Skill.insertMany(docs);
    console.log(`Inserted ${docs.length} sample skills`);
  }

  if ((await Project.countDocuments()) === 0) {
    await Project.insertMany(
      PROJECTS.map((p, order) => ({
        ...p,
        slug: p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        status: 'published',
        publishedAt: new Date(),
        order,
      })),
    );
    console.log(`Inserted ${PROJECTS.length} sample projects`);
  }

  if ((await Experience.countDocuments()) === 0) {
    await Experience.create({
      company: 'Sample Company (replace me)',
      position: 'Software Developer',
      startDate: new Date('2023-01-01'),
      current: true,
      description: '<p><em>Sample entry.</em> Edit or delete this in Admin → Experience.</p>',
      responsibilities: ['Describe a responsibility', 'Describe an achievement'],
      technologies: ['JavaScript', 'React', 'Node.js'],
    });
    console.log('Inserted 1 sample experience entry');
  }
  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
