import { extend } from "colord";
import cmykPlugin from "colord/plugins/cmyk";
import namesPlugin from "colord/plugins/names";
import a11yPlugin from "colord/plugins/a11y";
import harmoniesPlugin from "colord/plugins/harmonies";
import mixPlugin from "colord/plugins/mix";

/**
 * Initialize colord with all required plugins
 */
export function setupColord(): void {
  extend([cmykPlugin, namesPlugin, a11yPlugin, harmoniesPlugin, mixPlugin]);
}
