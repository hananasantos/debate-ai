# Debate AI

A random thing

## TODO:

- [ ] ❗ HANDLE TOKENS/CONTEXT WINDOWS ❗
- [ ] Error handling around llm requests
- [x] Fix claude message prompts because next debater causes two user prompts in a row
- [ ] Is there a better way to pass websocket around? Feel like i need to centralize `ws` more into the routes somehow
- [ ] Check debate message passing from server to client. It needs cleaning because a debateMessage has a title that we never use but could pass to the client.
- [ ] Finish READMEs
- [ ] Why is stream from gpt getting cut off

  **Frontend**

- [ ] make debater siders prettier
- [ ] somehow highlight the current debater
- [x] change homepage footer to powered by XX

## Potential Additions

- Option to let debaters know about each other (ex: add to their system prompts: 'your opponent is ...')
- Option to give debaters names (and not just "Debater 1" and "Debater 2")
- Allow user to end the debate (and let debaters provide closing statements) and vote on a winner
- Allow user to moderate
- Allow user to be one of the debaters
- Allow user to change the topic mid debate
- Add gemini?
- Text to speech lmao

## Docs

### Routes

Routes are found in the `./routes/debate.ts` file, which handles websocket events sent from the client. The types of events are defined in `./types/ws.types.ts`. If more routes are needed, add their types to this file, then import them to the `routeMessage()` handler in index.

_**Note: The debate messages are send to the client in `./services/debate.ts` because of the llm streams**_

`debate.setup`

Creates the `LLM` classes that represent the debaters. Sends client status 1 for success, 0 for failure.

`debate.start`

Creates the `Debate` class that represents the whole debate, then starts it, sending a "startDebate" event to the client with the moderator's message.

`debate.next`

Advances the debate by one turn (switching to the next debater). Sends a "moderator" event to the client with the moderator's message

---

### Services

These currently contain the LLM class implementations (gpt, claude)

---

### Controllers

There's only one controller right now, and it's the `Debate` controller/class. This is where the majority of the logic for the debate routing is handled.

### `Debate`

#### Class properties

- `llm1: LLM` - The first debater llm
- `llm2: LLM` - The second debater llm
- `topic: string` - The topic of the debate
- `currentDebater: LLM` - The current debater llm
- `ws: WebSocket` - The websocket connection (from `ws` package. not the built in one)
- `debateHistory: DebateMessage[]` - The debate's messages (it's "thread", if you must)

#### Class Methods

`constructor({llm1, llm2, topic}, ws)`

Sets up the class properties. What would you expect?

**Params**

- `llm1: LLM`
- `llm2: LLM`
- `topic: string`
- `ws: WebSocket`

**Returns**

shiny new `Debate` instance

---

`private decideFirstDebater()`
Helper function that decides who goes first use randomness

**Returns**

the `LLM` that goes first (llm1 or llm2)

---

`private advanceLlm(llm, next)`

Advances the provided llm debater by the provided debate turn/message and updates `currentDebater` and `debateHistory`

**Params**

- `llm: LLM`
- `next: DebateMessage` - The next message in the debate: {title, llmMessage, debaterId}

---

`public start()`

Starts the debate

---

`public switchDebater()`

Switches the current debater to the next one and advances

---

### Types

---

### Util
