# Database Migration Guide

## Overview

This guide helps you migrate from the old localStorage-based system to the new SQLite canonical structured layer.

## Why Migrate?

### Before: Loose Text Blobs
- Data stored as unstructured JSON in localStorage
- No relationships between entities
- No data integrity
- Hard to query
- Limited to browser storage
- No backup/sync

### After: Structured Database
- Proper relational database with SQLite
- Explicit relationships (character-to-character, character-to-beat, etc.)
- Data integrity with foreign keys
- Complex queries and analysis
- Scalable and performant
- Easy backup and export

## Migration Steps

### Step 1: Update Prisma Schema

Replace `prisma/schema.prisma` with the new schema:

```bash
# Backup old schema
cp prisma/schema.prisma prisma/schema-old.prisma

# Copy new schema
cp prisma/schema-new.prisma prisma/schema.prisma

# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name canonical_structured_layer
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Run Migration Script

Create a migration script to move data from localStorage to SQLite:

```typescript
// scripts/migrate-to-db.ts
import { prisma } from '../src/lib/prisma';
import {
  createProject,
  createCharacter,
  addBeat,
  addTimelineEvent,
  addLocation,
  addResearchNote,
} from '../src/lib/db';

async function migrate() {
  // Get data from localStorage
  const projects = JSON.parse(localStorage.getItem('storyroom-projects') || '[]');

  for (const oldProject of projects) {
    console.log(`Migrating project: ${oldProject.name}`);

    // Create project
    const project = await createProject({
      name: oldProject.name,
      description: oldProject.description,
      title: oldProject.bible.title,
      premise: oldProject.bible.premise,
      genre: oldProject.bible.genre,
      themes: oldProject.bible.themes,
      phase: oldProject.bible.phase || 'discovery',
    });

    // Migrate characters
    for (const oldChar of oldProject.bible.characters || []) {
      await createCharacter(project.id, {
        name: oldChar.name,
        role: oldChar.role,
        logline: oldChar.logline,
        desire: oldChar.desire,
        fear: oldChar.fear,
        wound: oldChar.wound,
        contradiction: oldChar.contradiction,
        voiceTone: oldChar.voice?.tone,
        voiceRhythm: oldChar.voice?.rhythm,
        voiceVocabulary: oldChar.voice?.vocabulary,
        voiceQuirks: oldChar.voice?.quirks,
        arcStart: oldChar.arc?.start,
        arcMidpoint: oldChar.arc?.midpoint,
        arcEnd: oldChar.arc?.end,
      });
    }

    // Migrate plot beats
    for (const [index, oldBeat] of (oldProject.bible.plotBeats || []).entries()) {
      await addBeat(project.id, {
        label: oldBeat.label,
        summary: oldBeat.summary,
        stakes: oldBeat.stakes,
        turn: oldBeat.turn,
        order: index,
        act: oldBeat.act,
      });
    }

    // Migrate research
    for (const oldResearch of oldProject.bible.research || []) {
      await addResearchNote(project.id, {
        question: oldResearch.question,
        bullets: oldResearch.bullets,
        sources: oldResearch.sources,
        summary: oldResearch.summary,
        tags: oldResearch.tags,
      });
    }

    console.log(`✓ Migrated project: ${oldProject.name}`);
  }

  console.log('Migration complete!');
}

migrate().catch(console.error);
```

Run the migration:

```bash
npx ts-node scripts/migrate-to-db.ts
```

### Step 4: Update Application Code

Replace old localStorage calls with database calls:

#### Before:
```typescript
// Old way
const bible = JSON.parse(localStorage.getItem('storyroom-bible') || '{}');
const characters = bible.characters || [];
```

#### After:
```typescript
// New way
import { listCharacters } from '@/lib/db';

const characters = await listCharacters(projectId);
```

### Step 5: Test Migration

```bash
# Start dev server
npm run dev

# Open Prisma Studio to inspect data
npx prisma studio

# Verify data in browser
# Check that all characters, plot beats, etc. are visible
```

### Step 6: Backup Old Data

```bash
# Export localStorage data before removing
# In browser console:
const backup = {
  projects: localStorage.getItem('storyroom-projects'),
  bible: localStorage.getItem('storyroom-bible'),
};
console.log(JSON.stringify(backup));
// Copy and save to file
```

## Common Migration Patterns

### Pattern 1: Character CRUD

#### Before:
```typescript
const bible = getBible();
bible.characters.push(newCharacter);
setBible(bible);
```

#### After:
```typescript
import { createCharacter } from '@/lib/db';

await createCharacter(projectId, {
  name: 'Marcus',
  role: 'protagonist',
  // ...
});
```

### Pattern 2: Relationships

#### Before:
```typescript
// Stored as unstructured text in character object
character.relationships = [
  { type: 'enemy', description: 'Hates Lord Blackwood' }
];
```

#### After:
```typescript
import { createRelationship } from '@/lib/db';

await createRelationship(
  projectId,
  marcusId,
  blackwoodId,
  'enemy',
  'Marcus seeks to expose Blackwood\'s corruption'
);
```

### Pattern 3: Queries

#### Before:
```typescript
// Manual filtering
const protagonists = bible.characters.filter(c => c.role === 'protagonist');
```

#### After:
```typescript
import { getProtagonists } from '@/lib/db';

const protagonists = await getProtagonists(projectId);
```

### Pattern 4: Timeline

#### Before:
```typescript
// No timeline structure
// Events scattered in text
```

#### After:
```typescript
import { addTimelineEvent, linkEventToCharacter } from '@/lib/db';

const event = await addTimelineEvent(projectId, {
  title: 'Opening Scene',
  description: 'Marcus at the forge',
  type: 'scene',
  order: 0,
  act: 1,
});

await linkEventToCharacter(event.id, marcusId);
```

## Rollback Plan

If you need to rollback:

### Option 1: Restore Old Schema

```bash
# Restore old schema
cp prisma/schema-old.prisma prisma/schema.prisma

# Rollback migration
npx prisma migrate reset

# Restore from backup
# Use localStorage backup from Step 6
```

### Option 2: Keep Both Systems

```typescript
// Read from database first, fallback to localStorage
async function getCharacters(projectId: string) {
  try {
    return await listCharacters(projectId);
  } catch (error) {
    // Fallback to localStorage
    const bible = JSON.parse(localStorage.getItem('storyroom-bible') || '{}');
    return bible.characters || [];
  }
}
```

## Verification Checklist

After migration, verify:

- [ ] All projects visible in app
- [ ] All characters with correct data
- [ ] Character relationships preserved
- [ ] Plot beats in correct order
- [ ] Research notes with sources
- [ ] Timeline events (if any)
- [ ] Locations (if any)
- [ ] No data loss
- [ ] App functionality works
- [ ] Performance is good

## Troubleshooting

### Issue: Migration fails with foreign key error

**Solution:** Ensure parent entities are created before children:
1. Projects first
2. Characters, Locations
3. Plot Beats, Timeline Events
4. Relationships, Links

### Issue: Data appears corrupted

**Solution:** Check JSON parsing:
```typescript
// Validate JSON before parsing
try {
  const data = JSON.parse(jsonString);
} catch (error) {
  console.error('Invalid JSON:', jsonString);
}
```

### Issue: Performance is slow

**Solution:** Use batch operations:
```typescript
// Instead of individual creates
for (const char of characters) {
  await createCharacter(projectId, char); // Slow
}

// Use transaction
await prisma.$transaction(
  characters.map(char =>
    prisma.character.create({ data: { ...char, projectId } })
  )
);
```

### Issue: Missing relationships

**Solution:** Migrate relationships after entities:
```typescript
// 1. Create all characters first
const characterMap = new Map();
for (const oldChar of oldCharacters) {
  const newChar = await createCharacter(projectId, oldChar);
  characterMap.set(oldChar.id, newChar.id);
}

// 2. Then create relationships
for (const oldRel of oldRelationships) {
  await createRelationship(
    projectId,
    characterMap.get(oldRel.fromId),
    characterMap.get(oldRel.toId),
    oldRel.type,
    oldRel.description
  );
}
```

## Post-Migration

### Clean Up

```bash
# Remove old localStorage data (after verifying migration)
localStorage.removeItem('storyroom-projects');
localStorage.removeItem('storyroom-bible');

# Remove old schema backup
rm prisma/schema-old.prisma
```

### Optimize

```bash
# Analyze database
npx prisma db execute --stdin < analyze.sql

# Vacuum database
npx prisma db execute --stdin < vacuum.sql
```

### Backup

```bash
# Backup database regularly
cp prisma/dev.db prisma/dev.db.backup

# Or use Prisma
npx prisma db push --skip-generate
```

## Support

For migration issues:
1. Check console for errors
2. Inspect database with `npx prisma studio`
3. Review migration logs
4. Restore from backup if needed

---

**Migration Status:** Ready
**Estimated Time:** 10-30 minutes depending on data size
**Risk Level:** Low (with backup)
