# Database Quick Reference

## Import

```typescript
import {
  // Characters
  getCharacter,
  listCharacters,
  createCharacter,
  updateCharacter,
  createRelationship,
  
  // Plot
  listBeats,
  addBeat,
  linkBeatToCharacter,
  
  // Timeline
  listTimelineEvents,
  addTimelineEvent,
  linkEventToCharacter,
  
  // Locations
  listLocations,
  addLocation,
  getLocationHierarchy,
  
  // Research
  listResearchNotes,
  addResearchNote,
  
  // Canon
  listCanonEntries,
  addCanonEntry,
  
  // Projects
  getProject,
  getProjectHealth,
  
  // Analysis
  getCharacterTimeline,
  getCharacterInteractionMatrix,
  getMostActiveCharacters,
} from '@/lib/db';
```

## Common Operations

### Create a Character
```typescript
const character = await createCharacter(projectId, {
  name: 'Marcus',
  role: 'protagonist',
  logline: 'A blacksmith seeking redemption',
  desire: 'To prove his worth',
  fear: 'Being forgotten',
  wound: 'Abandoned by his father',
  contradiction: 'Seeks approval but pushes people away',
});
```

### Create a Relationship
```typescript
await createRelationship(
  projectId,
  characterId1,
  characterId2,
  'enemy',
  'Marcus seeks to expose Blackwood\'s corruption',
  'Tense, escalating conflict'
);
```

### Add a Plot Beat
```typescript
const beat = await addBeat(projectId, {
  label: 'Inciting Incident',
  summary: 'Marcus discovers evidence of corruption',
  stakes: 'Risk everything or let innocents suffer',
  turn: 'Marcus decides to investigate',
  order: 1,
  act: 1,
});
```

### Link Character to Beat
```typescript
await linkBeatToCharacter(beatId, characterId, 'protagonist');
```

### Create Timeline Event
```typescript
const event = await addTimelineEvent(projectId, {
  title: 'Opening: Dawn at the Forge',
  description: 'Marcus begins his day',
  type: 'scene',
  timestamp: 'Day 1, Dawn',
  order: 0,
  act: 1,
  chapter: 1,
  locationId: forgeId,
});
```

### Link Character to Event
```typescript
await linkEventToCharacter(eventId, characterId, 'protagonist');
```

### Create Location
```typescript
const location = await addLocation(projectId, {
  name: 'Marcus\'s Forge',
  type: 'building',
  description: 'A small blacksmith shop in the lower district',
  significance: 'Where Marcus feels most at home',
  atmosphere: 'Hot, smoky, filled with the ring of hammer on anvil',
});
```

### Add Research Note
```typescript
const research = await addResearchNote(projectId, {
  question: 'How did medieval blacksmiths work?',
  bullets: [
    'Work began at dawn [S1]',
    'Forge heated to 2,500°F [S2]',
  ],
  sources: [
    { id: 'S1', domain: 'history.org', url: '...', title: 'Medieval Daily Life' },
    { id: 'S2', domain: 'metalwork.edu', url: '...', title: 'Forge Temperatures' },
  ],
  tags: ['Medieval', 'Blacksmithing'],
});
```

### Create Canon Entry
```typescript
await addCanonEntry(projectId, {
  type: 'character-habit',
  content: 'Marcus always begins work at dawn',
  reasoning: 'Grounds character in authentic medieval practice',
  sourceCitation: '[S1]',
  characterId: marcusId,
  researchNoteId: researchId,
});
```

## Query Operations

### Get Character Timeline
```typescript
const timeline = await getCharacterTimeline(characterId);
// Returns all events the character appears in, ordered
```

### Get Character Relationships
```typescript
const relationships = await getCharacterRelationships(characterId);
// Returns all relationships (incoming and outgoing)
```

### Get Plot Structure
```typescript
const structure = await getThreeActStructure(projectId);
// Returns { act1: [...], act2: [...], act3: [...] }
```

### Get Location Hierarchy
```typescript
const hierarchy = await getLocationHierarchy(projectId);
// Returns tree structure of locations
```

### Search Characters
```typescript
const results = await searchCharacters(projectId, 'blacksmith');
// Searches name, role, logline
```

### Get Project Health
```typescript
const health = await getProjectHealth(projectId);
// Returns completeness %, balance, recommendations
```

## Analysis Operations

### Character Interaction Matrix
```typescript
const matrix = await getCharacterInteractionMatrix(projectId);
// Shows which characters appear together
```

### Character Co-Occurrence
```typescript
const count = await getCharacterCoOccurrence(characterId1, characterId2);
// How many events they share
```

### Most Active Characters
```typescript
const active = await getMostActiveCharacters(projectId, 5);
// Top 5 characters by event count
```

### Most Used Locations
```typescript
const locations = await getMostUsedLocations(projectId, 5);
// Top 5 locations by usage
```

### Character Screen Time
```typescript
const screenTime = await getCharacterScreenTime(projectId);
// Map of characterId -> event count
```

## Batch Operations

### Link Multiple Characters to Beat
```typescript
await linkCharactersToPlotBeat(beatId, [char1Id, char2Id, char3Id]);
```

### Link Multiple Characters to Event
```typescript
await linkCharactersToTimelineEvent(eventId, [char1Id, char2Id]);
```

### Reorder Beats
```typescript
await reorderBeats([beat1Id, beat2Id, beat3Id], startOrder);
```

### Reorder Timeline Events
```typescript
await reorderTimelineEvents([event1Id, event2Id, event3Id], startOrder);
```

## Type Definitions

### CharacterInput
```typescript
{
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'other';
  logline?: string;
  desire?: string;
  fear?: string;
  wound?: string;
  contradiction?: string;
  voiceTone?: string;
  voiceRhythm?: string;
  voiceVocabulary?: string;
  voiceQuirks?: string;
  arcStart?: string;
  arcMidpoint?: string;
  arcEnd?: string;
}
```

### PlotBeatInput
```typescript
{
  label: string;
  summary: string;
  stakes?: string;
  turn?: string;
  order: number;
  act?: number;
}
```

### TimelineEventInput
```typescript
{
  title: string;
  description: string;
  type: 'scene' | 'backstory' | 'world-event' | 'character-moment';
  timestamp?: string;
  order: number;
  duration?: string;
  act?: number;
  chapter?: number;
  plotBeatId?: string;
  locationId?: string;
}
```

### LocationInput
```typescript
{
  name: string;
  type: string; // city, building, region, planet, etc.
  description: string;
  parentId?: string;
  significance?: string;
  atmosphere?: string;
}
```

## Error Handling

```typescript
try {
  const character = await getCharacter(id);
  if (!character) {
    // Handle not found
  }
} catch (error) {
  console.error('Database error:', error);
  // Handle error
}
```

## Transactions

```typescript
import { prisma } from '@/lib/prisma';

await prisma.$transaction(async (tx) => {
  const character = await tx.character.create({ data: {...} });
  await tx.plotBeatCharacter.create({ data: {...} });
  // All or nothing
});
```

## Prisma Studio

```bash
# Open visual database editor
npx prisma studio
```

## Common Patterns

### Get Character with All Relations
```typescript
const character = await getCharacter(id, true);
// Includes relationshipsFrom and relationshipsTo
```

### Get Plot Beat with Characters
```typescript
const beat = await getPlotBeat(id, true);
// Includes characters array
```

### Get Timeline Event with Everything
```typescript
const event = await getTimelineEvent(id, true);
// Includes characters and location
```

### Get Canon with Links
```typescript
const canon = await getCanonEntry(id, true);
// Includes character, location, researchNote
```

---

**Quick Tip:** All list functions return arrays sorted by default (name, order, or createdAt)

**Performance Tip:** Use `includeRelations` parameter only when needed to avoid unnecessary joins

**Type Safety:** All functions are fully typed - your IDE will help you!
