# Database Architecture: SQLite as Canonical Structured Layer

## Overview

Storyroom uses SQLite as the canonical structured layer for all story data. This replaces the previous "loose text blobs" approach with a proper relational database that maintains data integrity, enables complex queries, and provides a clean abstraction layer.

## Architecture Principles

### 1. SQLite as Single Source of Truth
- All story data lives in SQLite
- No more localStorage for critical data
- Proper relationships between entities
- ACID transactions for data integrity

### 2. Clean Abstraction Layer
- Simple, intuitive API: `getCharacter(id)`, `addBeat()`, `linkBeatToCharacter()`
- Hides Prisma complexity
- Type-safe operations
- Consistent patterns across all entities

### 3. Structured, Not Blobs
- Characters have proper fields (desire, fear, wound, etc.)
- Relationships are explicit (character-to-character, character-to-beat)
- Timeline events are ordered and linked
- Locations have hierarchy

## Database Schema

### Core Entities

```
Project (Story Bible)
├── Characters
│   ├── Core traits (desire, fear, wound, contradiction)
│   ├── Voice (tone, rhythm, vocabulary, quirks)
│   ├── Arc (start, midpoint, end)
│   └── Relationships (to other characters)
├── Plot Beats
│   ├── Label, summary, stakes, turn
│   ├── Order and act
│   └── Linked characters
├── Timeline Events
│   ├── Title, description, type
│   ├── Timestamp and order
│   ├── Linked characters
│   └── Location
├── Locations
│   ├── Name, type, description
│   ├── Hierarchy (parent/children)
│   └── Significance and atmosphere
├── Research Notes
│   ├── Question, bullets, sources
│   ├── Summary and tags
│   └── Linked to canon
├── Canon Entries (Locked Facts)
│   ├── Type (world-rule, character-habit, etc.)
│   ├── Content and reasoning
│   └── Links to characters/locations/research
└── Builder Sessions
    └── Conversation history
```

### Relationships

```
Character ←→ Character (CharacterRelationship)
Character ←→ PlotBeat (PlotBeatCharacter)
Character ←→ TimelineEvent (TimelineEventCharacter)
Character ←→ CanonEntry

Location ←→ Location (Hierarchy)
Location ←→ TimelineEvent
Location ←→ CanonEntry

PlotBeat ←→ TimelineEvent
ResearchNote ←→ CanonEntry
```

## Abstraction Layer API

### Characters

```typescript
// CRUD
getCharacter(id, includeRelationships?)
listCharacters(projectId, includeRelationships?)
searchCharacters(projectId, query)
createCharacter(projectId, data)
upsertCharacter(id, projectId, data)
updateCharacter(id, data)
deleteCharacter(id)

// Queries
getCharactersByRole(projectId, role)
getProtagonists(projectId)
getAntagonists(projectId)
countCharacters(projectId)

// Relationships
createRelationship(projectId, fromId, toId, type, description, dynamic?)
getCharacterRelationships(characterId)
updateRelationship(id, data)
deleteRelationship(id)
getRelationshipBetween(fromId, toId)
```

### Plot Beats

```typescript
// CRUD
getPlotBeat(id, includeCharacters?)
listBeats(projectId, includeCharacters?)
getBeatsByAct(projectId, act)
addBeat(projectId, data)
updateBeat(id, data)
deleteBeat(id)
reorderBeats(beatIds, startOrder?)
countBeats(projectId)

// Character Linking
linkBeatToCharacter(plotBeatId, characterId, role?)
unlinkBeatFromCharacter(plotBeatId, characterId)
getBeatCharacters(plotBeatId)
getCharacterBeats(characterId)
updateBeatCharacterRole(plotBeatId, characterId, role)

// Structure
getThreeActStructure(projectId)
getKeyBeats(projectId)
createThreeActTemplate(projectId)
```

### Timeline

```typescript
// CRUD
getTimelineEvent(id, includeRelations?)
listTimelineEvents(projectId, includeRelations?)
getEventsByType(projectId, type)
getEventsByAct(projectId, act)
getEventsByChapter(projectId, chapter)
addTimelineEvent(projectId, data)
updateTimelineEvent(id, data)
deleteTimelineEvent(id)
reorderTimelineEvents(eventIds, startOrder?)
countTimelineEvents(projectId)

// Character Linking
linkEventToCharacter(timelineEventId, characterId, role?)
unlinkEventFromCharacter(timelineEventId, characterId)
getEventCharacters(timelineEventId)
getCharacterEvents(characterId)

// Analysis
getTimelineByAct(projectId)
getTimelineByType(projectId)
getCharacterTimeline(characterId)
getLocationEvents(locationId)
searchTimelineEvents(projectId, query)
```

### Locations

```typescript
// CRUD
getLocation(id, includeHierarchy?)
listLocations(projectId, includeHierarchy?)
getLocationsByType(projectId, type)
getRootLocations(projectId)
getChildLocations(parentId)
addLocation(projectId, data)
updateLocation(id, data)
deleteLocation(id)
searchLocations(projectId, query)
countLocations(projectId)

// Hierarchy
getLocationHierarchy(projectId)
getLocationPath(id)
moveLocation(id, newParentId)
getLocationDescendants(id)

// Analysis
getLocationsByTypeGrouped(projectId)
getSignificantLocations(projectId)
createLocationHierarchy(projectId, locations)
```

### Research

```typescript
// CRUD
getResearchNote(id)
listResearchNotes(projectId)
addResearchNote(projectId, data)
updateResearchNote(id, data)
deleteResearchNote(id)
searchResearchNotes(projectId, query)

// Tags
getResearchNotesByTag(projectId, tag)
getAllResearchTags(projectId)
countResearchNotes(projectId)

// Helpers
parseResearchNote(note)
listResearchNotesParsed(projectId)
```

### Canon

```typescript
// CRUD
getCanonEntry(id, includeRelations?)
listCanonEntries(projectId, includeRelations?)
getCanonEntriesByType(projectId, type)
getCharacterCanon(characterId)
getLocationCanon(locationId)
getResearchCanon(researchNoteId)
addCanonEntry(projectId, data)
updateCanonEntry(id, data)
deleteCanonEntry(id)
searchCanonEntries(projectId, query)
countCanonEntries(projectId)

// Analysis
getCanonByType(projectId)
getStoryCanon(projectId)
validateCanonConsistency(projectId)
```

### Projects

```typescript
// CRUD
getProject(id)
getProjectWithStats(id)
listProjects()
createProject(data)
updateProject(id, data)
deleteProject(id)
searchProjects(query)

// Metadata
updateProjectPhase(id, phase)
updateStoryBible(id, data)
getProjectsByPhase(phase)

// Analysis
getProjectHealth(id)
getProjectSummary(id)
countProjects()
```

### Relationships (Cross-Entity)

```typescript
// Entity Relationships
getCharacterRelatedEntities(characterId)
getLocationRelatedEntities(locationId)
getResearchRelatedEntities(researchNoteId)

// Bulk Linking
linkCharactersToPlotBeat(plotBeatId, characterIds)
linkCharactersToTimelineEvent(timelineEventId, characterIds)

// Analysis
getCharacterInteractionMatrix(projectId)
getCharacterCoOccurrence(characterId1, characterId2)
getLocationUsageFrequency(projectId)
getMostUsedLocations(projectId, limit?)
getCharacterScreenTime(projectId)
getMostActiveCharacters(projectId, limit?)
```

## Usage Examples

### Example 1: Create a Character with Relationships

```typescript
import { createCharacter, createRelationship } from '@/lib/db';

// Create protagonist
const hero = await createCharacter(projectId, {
  name: 'Marcus',
  role: 'protagonist',
  logline: 'A blacksmith seeking redemption',
  desire: 'To prove his worth',
  fear: 'Being forgotten',
  wound: 'Abandoned by his father',
  contradiction: 'Seeks approval but pushes people away',
});

// Create antagonist
const villain = await createCharacter(projectId, {
  name: 'Lord Blackwood',
  role: 'antagonist',
  logline: 'A corrupt noble',
  desire: 'Total control',
  fear: 'Losing power',
  wound: 'Betrayed by his brother',
  contradiction: 'Craves loyalty but trusts no one',
});

// Create relationship
await createRelationship(
  projectId,
  hero.id,
  villain.id,
  'enemy',
  'Marcus seeks to expose Blackwood\'s corruption',
  'Tense, escalating conflict'
);
```

### Example 2: Build Plot Structure

```typescript
import { addBeat, linkBeatToCharacter } from '@/lib/db';

// Create inciting incident
const incitingIncident = await addBeat(projectId, {
  label: 'Inciting Incident',
  summary: 'Marcus discovers evidence of corruption',
  stakes: 'If he acts, he risks everything. If he doesn\'t, innocents suffer.',
  turn: 'Marcus decides to investigate',
  order: 1,
  act: 1,
});

// Link characters to beat
await linkBeatToCharacter(incitingIncident.id, hero.id, 'protagonist');
await linkBeatToCharacter(incitingIncident.id, villain.id, 'antagonist');
```

### Example 3: Create Timeline with Locations

```typescript
import { addLocation, addTimelineEvent, linkEventToCharacter } from '@/lib/db';

// Create location
const forge = await addLocation(projectId, {
  name: 'Marcus\'s Forge',
  type: 'building',
  description: 'A small blacksmith shop in the lower district',
  significance: 'Where Marcus feels most at home',
  atmosphere: 'Hot, smoky, filled with the ring of hammer on anvil',
});

// Create timeline event
const openingScene = await addTimelineEvent(projectId, {
  title: 'Opening: Dawn at the Forge',
  description: 'Marcus begins his day, unaware of what\'s coming',
  type: 'scene',
  timestamp: 'Day 1, Dawn',
  order: 0,
  act: 1,
  chapter: 1,
  locationId: forge.id,
});

// Link character
await linkEventToCharacter(openingScene.id, hero.id, 'protagonist');
```

### Example 4: Research to Canon Pipeline

```typescript
import { addResearchNote, addCanonEntry } from '@/lib/db';

// Add research
const research = await addResearchNote(projectId, {
  question: 'How did medieval blacksmiths work?',
  bullets: [
    'Work began at dawn [S1]',
    'Forge heated to 2,500°F [S2]',
    'Tools: anvil, hammer, tongs [S3]',
  ],
  sources: [
    { id: 'S1', domain: 'history.org', url: '...', title: 'Medieval Daily Life' },
    { id: 'S2', domain: 'metalwork.edu', url: '...', title: 'Forge Temperatures' },
    { id: 'S3', domain: 'crafts.com', url: '...', title: 'Blacksmith Tools' },
  ],
  tags: ['Medieval', 'Blacksmithing', 'Daily Life'],
});

// Convert to canon
await addCanonEntry(projectId, {
  type: 'character-habit',
  content: 'Marcus always begins work at dawn, a habit from his apprenticeship',
  reasoning: 'Grounds character in authentic medieval practice',
  sourceCitation: '[S1]',
  characterId: hero.id,
  researchNoteId: research.id,
});
```

### Example 5: Query and Analysis

```typescript
import {
  getCharacterTimeline,
  getCharacterInteractionMatrix,
  getMostActiveCharacters,
  getProjectHealth,
} from '@/lib/db';

// Get character's full timeline
const marcusTimeline = await getCharacterTimeline(hero.id);
console.log(`Marcus appears in ${marcusTimeline.length} events`);

// Analyze character interactions
const interactions = await getCharacterInteractionMatrix(projectId);
const marcusInteracts = interactions.get(hero.id);
console.log(`Marcus interacts with ${marcusInteracts?.size} other characters`);

// Get most active characters
const active = await getMostActiveCharacters(projectId, 5);
console.log('Top 5 most active characters:', active);

// Check project health
const health = await getProjectHealth(projectId);
console.log(`Project completeness: ${health.completeness}%`);
console.log('Recommendations:', health.recommendations);
```

## Migration Strategy

### Phase 1: Parallel Systems (Current)
- Keep localStorage for backward compatibility
- New features use database
- Gradual migration of existing data

### Phase 2: Database Primary
- All new data goes to database
- Read from database first, fallback to localStorage
- Migration tool for users

### Phase 3: Database Only
- Remove localStorage dependencies
- Full database-driven application
- Export/import for backup

## Benefits

### Before (Loose Text Blobs)
```typescript
// Unstructured
bible.characters = [
  { id: 'C1', name: 'Marcus', ...lotsOfText }
];

// No relationships
// No queries
// No integrity
// Hard to analyze
```

### After (Structured Database)
```typescript
// Structured
const marcus = await getCharacter('C1');

// Explicit relationships
const relationships = await getCharacterRelationships(marcus.id);

// Complex queries
const timeline = await getCharacterTimeline(marcus.id);
const coOccurrence = await getCharacterCoOccurrence(marcus.id, villain.id);

// Data integrity
// Easy analysis
// Scalable
```

## Performance

- **SQLite**: Fast, embedded, no network latency
- **Indexed**: All foreign keys and common queries indexed
- **Transactions**: Batch operations for speed
- **Caching**: Prisma handles query caching

## Testing

```bash
# Run database tests
npm test src/lib/db/__tests__/

# Test migrations
npx prisma migrate dev

# Inspect database
npx prisma studio
```

## Future Enhancements

- [ ] Full-text search across all entities
- [ ] Graph queries for relationship analysis
- [ ] Conflict detection and resolution
- [ ] Version history and undo
- [ ] Collaborative editing with CRDTs
- [ ] Export to various formats (JSON, CSV, etc.)
- [ ] Import from other writing tools

---

**Status:** Production-ready
**Last Updated:** January 27, 2026
**Version:** 1.0.0
