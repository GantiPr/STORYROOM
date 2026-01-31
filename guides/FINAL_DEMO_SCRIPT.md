# Storyroom Demo Script - Natural & Conversational (7 Minutes)

---

## 🎬 INTRO (30 seconds)
**[Screen: Live site homepage - https://your-app.vercel.app]**

"Hey, I'm [Name]. So I built this thing called Storyroom, and it's basically an AI writing tool - but with a twist.

Most AI writing tools just say yes to everything and make stuff up. Storyroom actually challenges your ideas and makes sure everything is grounded in real research. 

Let me show you what I mean."

---

## 🏗️ PART 1: THE ARCHITECTURE (2 minutes)

### Show the Structure
**[Screen: VS Code - File explorer open]**

"Alright, so let me walk you through how this is built. 

**[Expand src/app/api/ folder]**

The backend is pretty straightforward - I've got about 10 different API routes here. Each one does one thing:
- This one handles the main chat
- This one's for character-specific conversations
- This one does web research
- And this one - we'll come back to this one, it's the cool part

**[Open src/hooks/useBible.ts]**

Now for state management, I built this hook called `useBible`. It's basically the brain of the app - handles all the story data, saves everything to localStorage automatically.

**[Scroll to the setBible function around line 70]**

See this part? Every time you change something, it saves to localStorage immediately. No 'save' button needed. And it's project-specific, so you can work on multiple stories without them getting mixed up.

**[Open src/lib/types.ts]**

And here's the type system. I'm using TypeScript in strict mode, so...

**[Scroll through the file]**

...you can see I've got types for everything. Characters, plot beats, research notes. This catches bugs before they happen.

**[Open src/app/api/chat/route.ts]**

Let me show you error handling real quick.

**[Scroll to try-catch block around line 20]**

Every API route has this pattern - try the thing, catch errors, return a proper error response. So if OpenAI goes down or you hit a rate limit, the app doesn't just crash.

**[Scroll to streaming section around line 50]**

And I'm using streaming here, so you see the AI response as it's being generated. Makes it feel way faster."

---

## 🤖 PART 2: HOW I BUILT IT (1.5 minutes)

**[Screen: Keep VS Code open, maybe show CharacterCreationModal.tsx]**

"So, full transparency - I used AI to build a lot of this. But not in the way you might think.

**[Open src/components/CharacterCreationModal.tsx]**

Like this component - it's 600 lines of code. I had Claude generate the initial structure, but then I went through and added all the error handling, fixed the edge cases, made sure the types were right.

**[Scroll through the file]**

The AI gave me a starting point, but I had to verify everything. 

**[Switch to terminal]**

After every AI generation, I'd run:

```bash
npm run build
```

**[Let it run, show it passing]**

TypeScript catches any type errors. Then I'd test it manually in the browser, try to break it, make sure edge cases work.

**[Back to VS Code]**

So AI made me maybe 5x faster, but I still had to make all the architecture decisions. Like choosing Next.js, deciding to use localStorage instead of a database, designing the whole workflow - that was all me.

The AI was more like a really fast junior developer. It could write code, but I had to tell it what to build and then fix what it got wrong."

---

## ✨ PART 3: THE COOL PART (2 minutes)

**[Screen: Switch to live site - navigate to Research page]**

"Okay, so here's the thing that makes this different from just using ChatGPT.

The problem with AI is it makes stuff up, right? If you ask it about quantum physics or medieval history, it'll give you something that sounds good but might be completely wrong.

So I built this research pipeline.

**[Type in search box: "quantum computing basics"]**

I search for real sources...

**[Show results appearing]**

These are actual articles from the web, with real URLs. 

**[Click to save a few sources]**

I save the ones I want to my knowledge base.

**[Navigate to the Generate tab]**

And then when I generate content...

**[Type prompt: "Write a scene where a scientist explains quantum entanglement to a student"]**

**[Click generate, show output appearing]**

...it only uses information from those sources. And every fact gets cited.

**[Point to citations in the output]**

See these [Source 1], [Source 2] tags? You can click them to see the original article. 

**[Click a citation to show it opens the source]**

So there's zero hallucination. Everything is grounded in real research.

**[Back to VS Code - open src/app/api/generate-from-sources/route.ts]**

Let me show you how this works under the hood.

**[Scroll to system prompt around line 30-50]**

Here's the system prompt I send to OpenAI:

```typescript
const systemPrompt = `You are a creative writing assistant.
CRITICAL: Use ONLY information from the provided sources.
Cite every fact with [Source N] notation.
If information isn't in sources, say "I don't have that information."`;
```

So I'm literally telling it: only use these sources, cite everything, and if you don't know, say so.

**[Scroll down to where sources are formatted]**

Then I format all the saved sources into the prompt, and the AI generates content based only on that.

This is what makes Storyroom actually useful for real writers. You're not just getting AI slop - you're getting researched, cited content."

---

## 💻 PART 4: TECHNICAL DECISIONS (1.5 minutes)

**[Screen: Back to VS Code]**

"Let me quickly walk through some of the technical choices I made.

**[Open src/app/dashboard/page.tsx]**

I'm using Next.js with the App Router. This is a client component...

**[Point to 'use client' at top]**

...but the API routes are all server-side. So API keys never touch the browser.

**[Open src/hooks/useProjects.ts]**

For the database, I'm just using localStorage. 

**[Scroll to createProject function around line 50]**

When you create a project, it saves immediately to localStorage. No backend database needed.

Now, the trade-off is you can't sync across devices. But for an MVP, this is way simpler. I can always add cloud sync later.

**[Open src/app/api/chat/route.ts, scroll to streaming section]**

And I mentioned streaming earlier - this is the code for that.

**[Point to ReadableStream around line 70]**

I'm using ReadableStream to send chunks as they come from OpenAI. So instead of waiting 10 seconds for the full response, you see it word by word.

**[Open src/hooks/useProjects.ts again]**

Oh, and the multi-project system - this was important because writers work on multiple stories.

**[Scroll through the file]**

Each project gets its own ID, its own localStorage key. So you can switch between projects without any data mixing.

**[Show the setActiveProjectId function]**

And I made sure the save is synchronous, so when you switch projects, it saves immediately before navigating. No race conditions."

---

## 🚀 PART 5: DEPLOYMENT (30 seconds)

**[Screen: Show Vercel dashboard or just talk over VS Code]**

"Deploying this was... interesting. 

**[Open package.json]**

I had to add a Node.js version requirement here because Vercel was using a different version than my local machine.

**[Open tsconfig.json]**

And TypeScript strict mode - locally it was fine, but Vercel's build was way stricter. So I had to go through and add explicit types everywhere.

**[Open src/app/api/sessions/route.ts]**

I also had to disable Prisma because SQLite doesn't work in serverless environments. So this route just returns mock data now. All the real data is in localStorage anyway.

But yeah, it's live now. Took some debugging but it works."

---

## 🎯 CLOSING (30 seconds)

**[Screen: Back to live site, navigate around]**

"So that's Storyroom. 

To recap:
- It's modular, everything's typed, error handling everywhere
- I used AI to build it fast, but I verified everything
- The research pipeline is the unique thing - no hallucinations, everything cited
- And it's live and working

**[Navigate to GitHub]**

Code's on GitHub if you want to check it out. 

Thanks for watching!"

---

## 📋 WHAT TO HAVE OPEN BEFORE RECORDING

### VS Code Tabs (in order):
1. `src/hooks/useBible.ts`
2. `src/lib/types.ts`
3. `src/app/api/chat/route.ts`
4. `src/components/CharacterCreationModal.tsx`
5. `src/app/api/generate-from-sources/route.ts`
6. `src/app/dashboard/page.tsx`
7. `src/hooks/useProjects.ts`
8. `package.json`
9. `src/app/api/sessions/route.ts`

### Browser Tabs:
1. Live site homepage
2. Live site research page
3. GitHub repository

### Terminal:
- Have it open and ready to run `npm run build`

---

## 🎬 RECORDING TIPS

### Make it Feel Natural:
- **Don't read word-for-word** - Use the script as a guide, but speak naturally
- **Pause when switching screens** - Give yourself edit points
- **Use filler words occasionally** - "So...", "Alright...", "Let me show you..."
- **Point at things** - Use your cursor to highlight what you're talking about
- **Vary your pace** - Speed up for simple stuff, slow down for complex parts
- **Show enthusiasm** - You built something cool, let that show!

### Technical Level:
- **Explain concepts simply** - "This hook manages state" not "This implements a closure-based memoization pattern"
- **Show, don't tell** - Let the code speak, just narrate what it does
- **Skip implementation details** - Don't explain every line, just the key ideas
- **Use analogies** - "It's like a brain for the app" instead of "It's a centralized state management solution"

### Common Mistakes to Avoid:
- ❌ Don't apologize for code ("This is messy but...")
- ❌ Don't go down rabbit holes ("Oh and this other thing...")
- ❌ Don't explain things twice
- ❌ Don't show unfinished features
- ❌ Don't expose API keys or personal info
- ❌ Don't spend too long on any one section

### If You Mess Up:
- Just pause, take a breath, and start that sentence again
- You'll edit it out later
- Don't say "oops" or "wait" - just redo it

---

## ⏱️ TIMING CHECKPOINTS

- **1:00** - Should be finishing architecture overview
- **2:30** - Should be starting the wow factor demo
- **4:30** - Should be starting technical decisions
- **6:00** - Should be starting deployment
- **7:00** - Should be wrapping up

If you're running long, cut:
- Some of the file scrolling
- The terminal build demo
- Some of the technical decisions section

If you're running short, add:
- More live site demo
- Show more of the research workflow
- Explain the multi-project system in more detail

---

## 🎯 KEY MESSAGES TO HIT

1. **"I used AI but verified everything"** - Shows you understand AI's limitations
2. **"The research pipeline prevents hallucinations"** - Your unique value prop
3. **"Everything is typed and error-handled"** - Production quality
4. **"It's modular and maintainable"** - Good architecture
5. **"I made deliberate trade-offs"** - Shows engineering judgment

---

## 💡 FINAL TIPS

**Energy Level:**
- Start strong - first 10 seconds matter
- Stay engaged - you're excited about this
- End confident - you built something real

**Camera/Screen:**
- Record in 1080p minimum
- Use good lighting if showing your face
- Clear audio is more important than video quality
- Test your setup with a 30-second recording first

**Editing:**
- Cut dead air and long pauses
- Speed up slow parts (file loading, scrolling)
- Add zoom for code sections if needed
- Keep it under 8 minutes total (leaves buffer)

**Before You Hit Record:**
- Close all other apps (no notifications)
- Clear browser history/bookmarks
- Set VS Code font to 16-18pt
- Test your microphone
- Have water nearby
- Take a deep breath!

You got this! 🚀
