# Architecture

## Cognitive Controller

The cognitive controller is the central module that is solely responsible for making high-level decisions, unlike the other modules which are responsible for carrying out those decisions. It periodically creates a snapshot of the agent's state, which is then turned into a bottlenecked state by discarding information. This bottlenecked state is then used to make decisions by the cognitive controller by using a language model to generate a decision, which is then broadcasted to all other modules.

From the Sid paper:

> This bottleneck reduces the amount of information presented to the Cognitive Controller, which serves two purposes: it allows the CC to attend its reasoning on relevant information, and it gives “system designers” (like us) explicit control over information flow. For example, we can design highly sociable agents by ensuring that information from the social processing module always passes through the bottleneck.

## Skill Execution

The skill execution module executes skills in the Minecraft environment. This module is the main module that interacts with the Minecraft bot through skill scripts that interact with the Minecraft bot's API. The module is responsible for updating the agent's skillset and executing skills based on decisions made by the cognitive controller. When the cognitive controller module decides to develop a new skill, the skill execution module is responsible for creating a new skill script using a language model.

This is inspired by [Voyager](https://github.com/MineDojo/Voyager/tree/main) and [Mindcraft](https://github.com/kolbytn/mindcraft/tree/main).

## Memory

The memory module manages the agent's short-term memory, and long-term memory.

### Short-Term Memory

The short-term memory is the kept to enable the agent to perform the current task at hand. This can include things like the agent's current goal, the agent's current location, the agent's current useful items in inventory, etc.

The short-term memory is stored in the agent's state. Memories are consolidated into long-term memory based on a time threshold and importance and similarity to other memories. During consolidation, similar memories are compressed into a single long-term memory.

### Long-Term Memory

The long-term memory is used to store information about the agent's past experiences and knowledge. This can include things like the agent's past actions, the agent's past observations, the agent's past goals, etc.

The long-term memory is stored in a Vector Database, and relevant memories are retrieved using a similarity search and weighted by recency. (Maybe also by importance and relevance?)

## Action Awareness

The action awareness module monitors the agent's current actions and provides feedback on their outcomes. This module is responsible for updating the agent's state based on information from the environment (the mineflayer bot).

## Goal Generation

The goal generation module generates and manages the agent's goals based on its current state and decisions made by the cognitive controller. It is responsible for creating new goals, updating existing goals, and discarding goals that are no longer relevant.

## Social Awareness

The social awareness module tracks and understands social relationships between agents. This module tracks the relationships between agents, sentiment, and other social information, such as awareness of surrouding agents. It is also used to understand the sentiment and intents of other agents to allow for a degree of theory of mind and social intelligence.

## Talking

The talking module generates and processes speech for communication with other agents. This module is responsible for interacting with the bot's chat API to send and receive messages. It is also responsible for tracking conversations.

## Potential Modules

- **Reflection**: This module could be used to allow the agent to reflect on its own actions and decisions. This could be useful for the agent to improve its decision making and skill execution. See [Generative Agents](https://github.com/joonspk-research/generative_agents)
- **Reflex**: This module could be used to allow the agent to react to events in the environment without the need for the cognitive controller to make a decision. This could be useful for the agent to react to events like explosions, nearby entities, etc.
- **Visual**: This module could be used to take screenshots of the agent's pov to allow the cognitive controller to make decisions based on the agent's current view. This could help the agent navigate complex environments and allow it to make aesthetic decisions.
- **Audio**: This module could be used to process audio information from the environment. I don't see it it being very useful except for maybe avoiding creeper explosions.
