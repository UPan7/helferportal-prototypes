/**
 * Block registry utilities.
 * Shared alias resolution for block types.
 */

/**
 * Resolve a block type to its definition, checking aliases if direct lookup fails.
 * @param {string} blockType - The block type from data-block attribute
 * @param {Object} registry - The block-registry.json contents
 * @returns {Object|null} The block definition, or null if not found
 */
function resolveBlockDef(blockType, registry) {
  if (!registry || !blockType) return null;
  let blockDef = registry[blockType];
  if (!blockDef) {
    for (const [, def] of Object.entries(registry)) {
      if (def.aliases && Object.keys(def.aliases).includes(blockType)) {
        blockDef = def;
        break;
      }
    }
  }
  return blockDef || null;
}

module.exports = { resolveBlockDef };
