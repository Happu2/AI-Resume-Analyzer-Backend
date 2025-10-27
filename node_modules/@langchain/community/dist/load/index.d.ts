import { OptionalImportMap, SecretMap } from "./import_type.js";
import { import_map_d_exports } from "./import_map.js";
import { optionalImportEntrypoints } from "./import_constants.js";

//#region src/load/index.d.ts

/**
 * Load a LangChain module from a serialized text representation.
 * NOTE: This functionality is currently in beta.
 * Loaded classes may change independently of semver.
 * @param text Serialized text representation of the module.
 * @param secretsMap
 * @param optionalImportsMap
 * @returns A loaded instance of a LangChain module.
 */
declare function load<T>(text: string,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
secretsMap?: Record<string, any>,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
optionalImportsMap?: OptionalImportMap & Record<string, any>): Promise<T>;
//#endregion
export { type OptionalImportMap, type SecretMap, import_map_d_exports as importMap, load, optionalImportEntrypoints };
//# sourceMappingURL=index.d.ts.map