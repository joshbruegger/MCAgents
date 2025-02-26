# MCAgents: PIANO Architecture for Minecraft Agents

MCAgents implements the PIANO (Perception, Inference, Action, and Observation Network) architecture for creating intelligent agents in Minecraft. This project is inspired by the paper "Generative Agents in Minecraft" and aims to create agents that can autonomously explore, interact, and collaborate in a Minecraft environment.

## Architecture Overview

The PIANO architecture consists of several modules that work together to create an intelligent agent:

### Core Modules

- **Cognitive Controller**: The central module that coordinates all other modules and makes high-level decisions.
- **Memory**: Manages the agent's working memory, short-term memory, and long-term memory.
- **Action Awareness**: Monitors the agent's actions and provides feedback on their outcomes.
- **Goal Generation**: Generates and manages the agent's goals based on its current state and observations.
- **Social Awareness**: Tracks and understands social relationships between agents.
- **Talking**: Generates and processes speech for communication with other agents.
- **Skill Execution**: Executes skills in the Minecraft environment.

### Utilities

- **LLM Client**: Provides a client for interacting with Language Models (LLMs) through various APIs.
- **Logger**: Provides utilities for setting up and configuring logging.
- **Config Loader**: Provides utilities for loading and validating configuration files.

## Getting Started

### Prerequisites

- Python 3.8 or higher
- Minecraft Java Edition (1.20.4 recommended)
- An API key for one of the supported LLM providers (OpenAI, Anthropic, OpenRouter, etc.)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/MCAgents.git
   cd MCAgents
   ```

2. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the root directory with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

### Configuration

The project uses YAML configuration files to configure the PIANO architecture. The default configuration file is located at `config/default.yaml`. You can create your own configuration file and specify it using the `--config` command-line argument.

### Running Experiments

The project provides two types of experiments:

1. **Single Agent Experiment**: Runs a single agent in a Minecraft environment.
2. **Multi-Agent Experiment**: Runs multiple agents in a Minecraft environment, allowing them to interact with each other.

To run an experiment, use the following command:

```bash
python src/main.py --experiment [single|multi] --num-agents [num_agents] --duration [duration] --config [config_file] --output-dir [output_dir] --log-level [log_level]
```

#### Command-Line Arguments

- `--experiment`: Type of experiment to run (`single` or `multi`). Default: `single`.
- `--num-agents`: Number of agents to spawn. Default: `1`.
- `--duration`: Duration of the experiment in seconds. Default: `3600` (1 hour).
- `--config`: Path to the configuration file. Default: `config/default.yaml`.
- `--output-dir`: Directory to save output files. Default: `output`.
- `--log-level`: Logging level (`DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`). Default: `INFO`.

#### Examples

Run a single agent experiment for 10 minutes:
```bash
python src/main.py --experiment single --duration 600
```

Run a multi-agent experiment with 3 agents for 30 minutes:
```bash
python src/main.py --experiment multi --num-agents 3 --duration 1800
```

## Output

The experiments generate log files in the specified output directory. Each agent has its own log file that contains its observations and actions. For multi-agent experiments, there is also a social interactions log file that records interactions between agents.

## Extending the Project

### Adding New Modules

To add a new module to the PIANO architecture, create a new Python file in the `src/piano/modules` directory. The module should inherit from the `Module` class defined in `src/piano/modules/base_module.py`.

### Adding New Skills

To add a new skill to the Skill Execution module, add a new method to the `SkillExecutionModule` class in `src/piano/modules/skill_execution.py`. The method should have the following signature:

```python
async def _skill_name(self, parameters: Dict) -> Tuple[bool, Dict]:
    """
    Execute the skill.
    
    Args:
        parameters (Dict): Skill parameters
    
    Returns:
        Tuple[bool, Dict]: Success flag and result
    """
    # Skill implementation
    ...
```

Then, add the skill to the `_initialize_skills` method:

```python
def _initialize_skills(self) -> Dict[str, Callable]:
    """
    Initialize the available skills.
    
    Returns:
        Dict[str, Callable]: Dictionary of available skills
    """
    # Define skills
    skills = {
        # Existing skills...
        "skill_name": self._skill_name,
    }
    
    return skills
```

## Acknowledgements

- The PIANO architecture is inspired by the paper [Project Sid: Many-agent simulations toward AI civilization](https://arxiv.org/pdf/2411.00114).
- The project uses the [Mineflayer](https://github.com/PrismarineJS/mineflayer) library for interacting with Minecraft.
- The project is inspired by [Voyager](https://github.com/MineDojo/Voyager/tree/main) and [Mindcraft](https://github.com/kolbytn/mindcraft/tree/main).