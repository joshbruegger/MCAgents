import * as path from "jsr:@std/path";
import { AgentConfig } from "../../utils/config.ts";
import { AgentState } from "../agent_state.ts";
import { Decision } from "../cognitive_controller.ts";
import { Module } from "./module.ts";

interface Skill {
  docstring: string;
  declaration: string;
  implementation: string;
}

/**
 * This module is responsible for executing skills in the Minecraft environment.
 * It translates high-level decisions from the Cognitive Controller into
 * concrete actions that can be executed in Minecraft.
 */
export class SkillExecutionModule extends Module {
  private _skillset: Record<string, Skill>;

  constructor(config: AgentConfig, agentState: AgentState) {
    super("SkillExecution", config, agentState);
    this._skillset = this._loadSkills();
  }

  private _loadSkills(): Record<string, Skill> {
    // load primitive skills
    const primitive_skills_dir = path.join(
      import.meta.url, //modules
      "..", //agent
      "skills",
    );
    const primitive_skills = Deno.readDirSync(primitive_skills_dir);
    for (const skill of primitive_skills) {
      const skill_path = path.join(primitive_skills_dir, skill.name);
      const skill_body = Deno.readTextFileSync(skill_path);
      this._skillset[skill.name] = this._parseSkill(skill_body);
    }
    // load skills from skill directory
    const skill_dir = path.join(this._config.root_dir, "skills");
    const skills = Deno.readDirSync(skill_dir);
    for (const skill of skills) {
      const skill_path = path.join(skill_dir, skill.name);
      // Read the skill file
      const skill_body = Deno.readTextFileSync(skill_path);
      const name = skill.name.replace(".ts", "");
      this._skillset[name] = this._parseSkill(skill_body);
    }
    return this._skillset;
  }

  private _parseSkill(skill_body: string): Skill {
    const docstring =
      skill_body.match(/\/\*\*\s*\n([^\*]|(\*(?!\/)))*\*\//)![0];
    const declaration = skill_body.match(/.*async .+\(.+\)/)![0];
    const implementation = skill_body;
    return { docstring, declaration, implementation };
  }

  override update(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  override onDecision(decision: Decision): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
