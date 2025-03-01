# MCAgents: PIANO Architecture for Minecraft Agents

MCAgents aims to create agents that can autonomously explore, interact, and collaborate in a Minecraft environment, using mineflayer to interact with the game and an extensible architecture and modular design to allow for easy experimentation and customization.

It is inspired by the following:

- [Project Sid: Many-agent simulations toward AI civilization (Altera.AL, 2024)](https://arxiv.org/pdf/2411.00114)
- [Generative Agents: Interactive Simulacra of Human Behavior (Park et al., 2023)](https://arxiv.org/pdf/2304.01373)
- [Voyager: An Open-Ended Embodied Agent with Large Language Models (Wang, 2023)](https://github.com/MineDojo/Voyager/tree/main)
- [Mindcraft (Nottingham & Robinson, 2023)](https://github.com/kolbytn/mindcraft/tree/main)

## Architecture Overview

The architecture consists of several modules running in parallel that work together to create an intelligent agent. These modules share a shared state and have access to the instance of a mineflayer bot, which is used to interact with the Minecraft world. See the [[architecture]] page for more details.

### Core Modules

- **Cognitive Controller**: The central module that coordinates all other modules and makes high-level decisions. It can broadcast decisions to all other modules.
- **Skill Execution**: Executes skills in the Minecraft environment.
- **Memory**: Manages the agent's short-term memory, and long-term memory.
- **Action Awareness**: Monitors the agent's actions and provides feedback on their outcomes.
- **Goal Generation**: Generates and manages the agent's goals based on its current state and observations.
- **Social Awareness**: Tracks and understands social relationships between agents.
- **Talking**: Generates and processes speech for communication with other agents.

## Getting Started

### Prerequisites

- Deno
- Minecraft Java Edition
- An OpenRouter API key

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/joshbruegger/MCAgents.git
   cd MCAgents
   ```

2. Install the required dependencies:

   ```bash
   deno install
   ```

3. Create a `.env` file in the root directory with your API key:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

## Extending the Project

### Adding New Modules

To add a new module to the architecture, create a new TypeScript file in the `src/agent/modules` directory. The module should implement the `Module` class defined in `src/agent/module.ts`.

## Acknowledgements

- The architecture is inspired by the paper [Project Sid: Many-agent simulations toward AI civilization](https://arxiv.org/pdf/2411.00114).
- Project inspired by [Voyager](https://github.com/MineDojo/Voyager/tree/main) and [Mindcraft](https://github.com/kolbytn/mindcraft/tree/main)
- Project inspired by [Generative Agents](https://github.com/joonspk-research/generative_agents)
- The project uses the [Mineflayer](https://github.com/PrismarineJS/mineflayer) library for interacting with Minecraft.
