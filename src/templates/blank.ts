import type { ProjectConfig } from "../config/schema.js";
import { emptyConfig } from "../config/schema.js";

/** Empty skeleton — current init behavior. */
export function blankTemplate(): ProjectConfig {
	return emptyConfig();
}
