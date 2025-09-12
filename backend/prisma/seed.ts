import { PrismaClient, UserRole, AuthProvider } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Create categories
    const categories = [
        {
            name: 'Frontend Frameworks',
            slug: 'frontend-frameworks',
            description: 'React, Vue, Angular and other frontend frameworks',
            color: '#3B82F6'
        },
        {
            name: 'Backend Technologies',
            slug: 'backend-technologies',
            description: 'Node.js, Python, Java and other backend technologies',
            color: '#10B981'
        },
        {
            name: 'Databases',
            slug: 'databases',
            description: 'PostgreSQL, MongoDB, Redis and other databases',
            color: '#F59E0B'
        },
        {
            name: 'DevOps Tools',
            slug: 'devops-tools',
            description: 'Docker, Kubernetes, CI/CD and deployment tools',
            color: '#EF4444'
        },
        {
            name: 'Development Tools',
            slug: 'development-tools',
            description: 'IDEs, editors, debugging and productivity tools',
            color: '#8B5CF6'
        }
    ];

    console.log('📁 Creating categories...');
    for (const category of categories) {
        await prisma.category.upsert({
            where: { slug: category.slug },
            update: {},
            create: category
        });
    }

    // Create tags
    const tags = [
        'react', 'typescript', 'javascript', 'node.js', 'express',
        'postgresql', 'prisma', 'docker', 'vscode', 'git',
        'tailwind', 'next.js', 'vue', 'angular', 'python',
        'mongodb', 'redis', 'kubernetes', 'aws', 'testing'
    ];

    console.log('🏷️  Creating tags...');
    for (const tagName of tags) {
        await prisma.tag.upsert({
            where: { slug: tagName.toLowerCase().replace('.', '-') },
            update: {},
            create: {
                name: tagName,
                slug: tagName.toLowerCase().replace('.', '-')
            }
        });
    }

    // Create owner user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    console.log('👤 Creating owner user...');
    const owner = await prisma.user.upsert({
        where: { email: 'owner@vibecoding.com' },
        update: {},
        create: {
            email: 'owner@vibecoding.com',
            name: 'Site Owner',
            role: UserRole.OWNER,
            provider: AuthProvider.EMAIL
        }
    });

    // Create sample visitor user
    console.log('👥 Creating sample visitor user...');
    const visitor = await prisma.user.upsert({
        where: { email: 'visitor@example.com' },
        update: {},
        create: {
            email: 'visitor@example.com',
            name: 'Sample Visitor',
            role: UserRole.VISITOR,
            provider: AuthProvider.EMAIL
        }
    });

    // Get created categories and tags for sample notes
    const frontendCategory = await prisma.category.findUnique({
        where: { slug: 'frontend-frameworks' }
    });

    const backendCategory = await prisma.category.findUnique({
        where: { slug: 'backend-technologies' }
    });

    const reactTag = await prisma.tag.findUnique({
        where: { slug: 'react' }
    });

    const typescriptTag = await prisma.tag.findUnique({
        where: { slug: 'typescript' }
    });

    const nodeTag = await prisma.tag.findUnique({
        where: { slug: 'node-js' }
    });

    // Create sample notes
    console.log('📝 Creating sample notes...');

    if (frontendCategory && reactTag && typescriptTag) {
        const reactNote = await prisma.note.create({
            data: {
                title: 'Getting Started with React and TypeScript',
                content: `# Getting Started with React and TypeScript

React with TypeScript provides excellent developer experience with type safety and better IDE support.

## Key Benefits

- **Type Safety**: Catch errors at compile time
- **Better IDE Support**: Autocomplete and refactoring
- **Improved Documentation**: Types serve as documentation
- **Easier Refactoring**: Confident code changes

## Setup

\`\`\`bash
npx create-react-app my-app --template typescript
\`\`\`

## Basic Component

\`\`\`tsx
interface Props {
  name: string;
  age?: number;
}

const UserCard: React.FC<Props> = ({ name, age }) => {
  return (
    <div>
      <h2>{name}</h2>
      {age && <p>Age: {age}</p>}
    </div>
  );
};
\`\`\`

This combination is perfect for building scalable frontend applications.`,
                excerpt: 'Learn how to set up and use React with TypeScript for better development experience and type safety.',
                slug: 'getting-started-react-typescript',
                authorId: owner.id,
                categoryId: frontendCategory.id,
                published: true
            }
        });

        // Add tags to the note
        await prisma.noteTags.createMany({
            data: [
                { noteId: reactNote.id, tagId: reactTag.id },
                { noteId: reactNote.id, tagId: typescriptTag.id }
            ]
        });
    }

    if (backendCategory && nodeTag) {
        const nodeNote = await prisma.note.create({
            data: {
                title: 'Building REST APIs with Node.js and Express',
                content: `# Building REST APIs with Node.js and Express

Express.js is a minimal and flexible Node.js web application framework that provides robust features for web and mobile applications.

## Installation

\`\`\`bash
npm install express
npm install -D @types/express
\`\`\`

## Basic Server Setup

\`\`\`javascript
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(port, () => {
  console.log(\`Server running on port \${port}\`);
});
\`\`\`

## Best Practices

- Use middleware for common functionality
- Implement proper error handling
- Add input validation
- Use environment variables for configuration
- Implement proper logging

Express makes it easy to build scalable APIs quickly.`,
                excerpt: 'Learn how to build RESTful APIs using Node.js and Express with best practices and examples.',
                slug: 'building-rest-apis-nodejs-express',
                authorId: owner.id,
                categoryId: backendCategory.id,
                published: true
            }
        });

        // Add tags to the note
        await prisma.noteTags.create({
            data: { noteId: nodeNote.id, tagId: nodeTag.id }
        });
    }

    // Create sample comments
    console.log('💬 Creating sample comments...');
    const notes = await prisma.note.findMany();

    if (notes.length > 0) {
        await prisma.comment.create({
            data: {
                content: 'Great article! This really helped me understand the setup process.',
                noteId: notes[0].id,
                authorId: visitor.id
            }
        });

        await prisma.comment.create({
            data: {
                content: 'Thanks for sharing this. The code examples are very clear.',
                noteId: notes[0].id,
                authorId: visitor.id
            }
        });
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Created:
  - ${categories.length} categories
  - ${tags.length} tags
  - 2 users (1 owner, 1 visitor)
  - ${notes.length} sample notes
  - Sample comments`);
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });