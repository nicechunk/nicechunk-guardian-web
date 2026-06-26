export const smeltingRules = {
  "schemaVersion": 1,
  "ruleSet": "nicechunk-smelting-v1",
  "heatTiers": [
    {
      "tier": 1,
      "key": "low",
      "temperatureC": 350
    },
    {
      "tier": 2,
      "key": "workshop",
      "temperatureC": 700
    },
    {
      "tier": 3,
      "key": "forge",
      "temperatureC": 1050
    },
    {
      "tier": 4,
      "key": "blast",
      "temperatureC": 1300
    }
  ],
  "fuels": [
    {
      "id": "dry_grass",
      "sourceType": "raw",
      "sourceKeys": [
        "dryGrass",
        "deadBush",
        "thorn"
      ],
      "heatTier": 1,
      "burnSeconds": 18,
      "consumable": true
    },
    {
      "id": "wood",
      "sourceType": "raw",
      "sourceKeys": [
        "trunk",
        "pineTrunk",
        "deadWood",
        "giantRoot"
      ],
      "heatTier": 2,
      "burnSeconds": 42,
      "consumable": true
    },
    {
      "id": "charcoal",
      "sourceType": "material",
      "materialId": "charcoal",
      "heatTier": 2,
      "burnSeconds": 64,
      "consumable": true
    },
    {
      "id": "coal",
      "sourceType": "raw",
      "sourceKeys": [
        "coal"
      ],
      "heatTier": 3,
      "burnSeconds": 96,
      "consumable": true
    },
    {
      "id": "lava_heat",
      "sourceType": "raw",
      "sourceKeys": [
        "lava",
        "basalt"
      ],
      "heatTier": 4,
      "burnSeconds": 160,
      "consumable": false
    }
  ],
  "materials": [
    {
      "id": "charcoal",
      "class": "carbon",
      "rawInputs": [
        {
          "key": "trunk",
          "amount": 2
        },
        {
          "key": "dryGrass",
          "amount": 3
        }
      ],
      "requiredHeatTier": 1,
      "artisanLevel": 1,
      "yieldCount": 1,
      "forgeUse": "fuel",
      "composition": [
        [
          "C",
          "70-88%"
        ],
        [
          "O",
          "6-18%"
        ],
        [
          "H",
          "2-6%"
        ],
        [
          "K",
          "0.2-2%"
        ]
      ]
    },
    {
      "id": "biochar_compost",
      "class": "carbon",
      "rawInputs": [
        {
          "key": "leaves",
          "amount": 2
        },
        {
          "key": "moss",
          "amount": 1
        },
        {
          "key": "mud",
          "amount": 1
        }
      ],
      "requiredHeatTier": 1,
      "artisanLevel": 1,
      "yieldCount": 2,
      "forgeUse": "soilCatalyst",
      "composition": [
        [
          "C",
          "32-52%"
        ],
        [
          "O",
          "24-38%"
        ],
        [
          "H",
          "4-9%"
        ],
        [
          "N",
          "1-5%"
        ],
        [
          "K",
          "0.5-4%"
        ]
      ]
    },
    {
      "id": "plant_fiber",
      "class": "fiber",
      "rawInputs": [
        {
          "key": "reed",
          "amount": 2
        },
        {
          "key": "vine",
          "amount": 1
        }
      ],
      "requiredHeatTier": 1,
      "artisanLevel": 1,
      "yieldCount": 2,
      "forgeUse": "binding",
      "composition": [
        [
          "C",
          "42-50%"
        ],
        [
          "O",
          "38-45%"
        ],
        [
          "H",
          "5-7%"
        ],
        [
          "N",
          "0.3-2%"
        ]
      ]
    },
    {
      "id": "resin_binder",
      "class": "polymer",
      "rawInputs": [
        {
          "key": "pineTrunk",
          "amount": 1
        },
        {
          "key": "vine",
          "amount": 1
        }
      ],
      "requiredHeatTier": 1,
      "artisanLevel": 1,
      "yieldCount": 1,
      "forgeUse": "binding",
      "composition": [
        [
          "C",
          "58-72%"
        ],
        [
          "H",
          "7-11%"
        ],
        [
          "O",
          "12-24%"
        ],
        [
          "N",
          "0.2-2%"
        ]
      ]
    },
    {
      "id": "ceramic_brick",
      "class": "ceramic",
      "rawInputs": [
        {
          "key": "clay",
          "amount": 2
        },
        {
          "key": "sand",
          "amount": 1
        }
      ],
      "requiredHeatTier": 2,
      "artisanLevel": 1,
      "yieldCount": 2,
      "forgeUse": "mold",
      "composition": [
        [
          "O",
          "46-56%"
        ],
        [
          "Si",
          "22-36%"
        ],
        [
          "Al",
          "6-16%"
        ],
        [
          "Fe",
          "0.5-6%"
        ]
      ]
    },
    {
      "id": "lime_ceramic",
      "class": "ceramic",
      "rawInputs": [
        {
          "key": "shellBed",
          "amount": 1
        },
        {
          "key": "clay",
          "amount": 1
        }
      ],
      "requiredHeatTier": 2,
      "artisanLevel": 1,
      "yieldCount": 1,
      "forgeUse": "binding",
      "composition": [
        [
          "O",
          "42-54%"
        ],
        [
          "Ca",
          "18-34%"
        ],
        [
          "Si",
          "10-24%"
        ],
        [
          "Al",
          "3-10%"
        ]
      ]
    },
    {
      "id": "quicklime",
      "class": "ceramic",
      "rawInputs": [
        {
          "key": "shellBed",
          "amount": 2
        },
        {
          "key": "coral",
          "amount": 1
        }
      ],
      "requiredHeatTier": 2,
      "artisanLevel": 1,
      "yieldCount": 1,
      "forgeUse": "flux",
      "composition": [
        [
          "Ca",
          "42-58%"
        ],
        [
          "O",
          "32-45%"
        ],
        [
          "C",
          "0-8%"
        ],
        [
          "Mg",
          "0.5-4%"
        ]
      ]
    },
    {
      "id": "salt_flux",
      "class": "chemical",
      "rawInputs": [
        {
          "key": "saltFlat",
          "amount": 2
        },
        {
          "key": "ash",
          "amount": 1
        }
      ],
      "requiredHeatTier": 2,
      "artisanLevel": 1,
      "yieldCount": 1,
      "forgeUse": "flux",
      "composition": [
        [
          "Na",
          "24-38%"
        ],
        [
          "Cl",
          "28-42%"
        ],
        [
          "K",
          "2-8%"
        ],
        [
          "O",
          "8-20%"
        ]
      ]
    },
    {
      "id": "ash_cement",
      "class": "composite",
      "rawInputs": [
        {
          "key": "ash",
          "amount": 2
        },
        {
          "key": "clay",
          "amount": 1
        },
        {
          "key": "shellBed",
          "amount": 1
        }
      ],
      "requiredHeatTier": 2,
      "artisanLevel": 2,
      "yieldCount": 2,
      "forgeUse": "masonry",
      "composition": [
        [
          "O",
          "42-55%"
        ],
        [
          "Si",
          "16-30%"
        ],
        [
          "Ca",
          "8-20%"
        ],
        [
          "Al",
          "4-12%"
        ],
        [
          "Fe",
          "1-6%"
        ]
      ]
    },
    {
      "id": "glass_ingot",
      "class": "glass",
      "rawInputs": [
        {
          "key": "sand",
          "amount": 3
        },
        {
          "key": "saltFlat",
          "amount": 1
        }
      ],
      "requiredHeatTier": 3,
      "artisanLevel": 2,
      "yieldCount": 1,
      "forgeUse": "lens",
      "composition": [
        [
          "Si",
          "30-44%"
        ],
        [
          "O",
          "48-58%"
        ],
        [
          "Na",
          "3-10%"
        ],
        [
          "Ca",
          "1-6%"
        ]
      ]
    },
    {
      "id": "obsidian_glass",
      "class": "glass",
      "rawInputs": [
        {
          "key": "sand",
          "amount": 2
        },
        {
          "key": "basalt",
          "amount": 1
        }
      ],
      "catalysts": [
        {
          "key": "lava",
          "amount": 1
        }
      ],
      "requiredHeatTier": 4,
      "artisanLevel": 3,
      "yieldCount": 1,
      "forgeUse": "lens",
      "composition": [
        [
          "Si",
          "26-40%"
        ],
        [
          "O",
          "42-54%"
        ],
        [
          "Fe",
          "3-10%"
        ],
        [
          "Mg",
          "1-7%"
        ],
        [
          "Al",
          "4-12%"
        ]
      ]
    },
    {
      "id": "silicon_wafer",
      "class": "crystal",
      "rawInputs": [
        {
          "key": "sand",
          "amount": 4
        },
        {
          "key": "coal",
          "amount": 1
        }
      ],
      "requiredHeatTier": 4,
      "artisanLevel": 3,
      "yieldCount": 1,
      "forgeUse": "circuit",
      "composition": [
        [
          "Si",
          "78-92%"
        ],
        [
          "O",
          "3-12%"
        ],
        [
          "C",
          "0.5-4%"
        ],
        [
          "Al",
          "0.1-2%"
        ]
      ]
    },
    {
      "id": "ice_crystal",
      "class": "crystal",
      "rawInputs": [
        {
          "key": "ice",
          "amount": 2
        },
        {
          "key": "snow",
          "amount": 2
        },
        {
          "key": "saltFlat",
          "amount": 1
        }
      ],
      "requiredHeatTier": 1,
      "artisanLevel": 1,
      "yieldCount": 1,
      "forgeUse": "cooling",
      "composition": [
        [
          "O",
          "82-89%"
        ],
        [
          "H",
          "10-12%"
        ],
        [
          "Na",
          "0.2-2%"
        ],
        [
          "Cl",
          "0.2-2%"
        ]
      ]
    },
    {
      "id": "iron_bloom",
      "class": "metal",
      "rawInputs": [
        {
          "key": "deepStone",
          "amount": 3
        },
        {
          "key": "stone",
          "amount": 1
        }
      ],
      "catalysts": [
        {
          "key": "coal",
          "amount": 1
        }
      ],
      "requiredHeatTier": 3,
      "artisanLevel": 2,
      "yieldCount": 1,
      "forgeUse": "toolHead",
      "composition": [
        [
          "Fe",
          "54-74%"
        ],
        [
          "O",
          "8-18%"
        ],
        [
          "C",
          "0.2-3%"
        ],
        [
          "Si",
          "2-10%"
        ],
        [
          "Mn",
          "0-2%"
        ]
      ]
    },
    {
      "id": "copper_bloom",
      "class": "metal",
      "rawInputs": [
        {
          "key": "gravel",
          "amount": 2
        },
        {
          "key": "basalt",
          "amount": 1
        }
      ],
      "requiredHeatTier": 3,
      "artisanLevel": 2,
      "yieldCount": 1,
      "forgeUse": "conductor",
      "composition": [
        [
          "Cu",
          "42-68%"
        ],
        [
          "Fe",
          "4-14%"
        ],
        [
          "Si",
          "4-14%"
        ],
        [
          "O",
          "8-22%"
        ]
      ]
    },
    {
      "id": "alumina_plate",
      "class": "ceramic",
      "rawInputs": [
        {
          "key": "clay",
          "amount": 3
        },
        {
          "key": "deepStone",
          "amount": 1
        }
      ],
      "requiredHeatTier": 3,
      "artisanLevel": 2,
      "yieldCount": 1,
      "forgeUse": "armorPlate",
      "composition": [
        [
          "Al",
          "22-38%"
        ],
        [
          "O",
          "42-54%"
        ],
        [
          "Si",
          "8-18%"
        ],
        [
          "Fe",
          "1-6%"
        ]
      ]
    },
    {
      "id": "nickel_iron",
      "class": "alloy",
      "rawInputs": [
        {
          "key": "deepStone",
          "amount": 3
        },
        {
          "key": "basalt",
          "amount": 2
        }
      ],
      "catalysts": [
        {
          "key": "coal",
          "amount": 1
        }
      ],
      "requiredHeatTier": 4,
      "artisanLevel": 3,
      "yieldCount": 1,
      "forgeUse": "magneticCore",
      "composition": [
        [
          "Fe",
          "48-68%"
        ],
        [
          "Ni",
          "6-18%"
        ],
        [
          "Mg",
          "2-8%"
        ],
        [
          "C",
          "0.2-3%"
        ],
        [
          "Si",
          "2-10%"
        ]
      ]
    },
    {
      "id": "carbon_plate",
      "class": "carbon",
      "rawInputs": [
        {
          "key": "coal",
          "amount": 2
        },
        {
          "key": "deepStone",
          "amount": 1
        }
      ],
      "requiredHeatTier": 3,
      "artisanLevel": 2,
      "yieldCount": 1,
      "forgeUse": "reinforcement",
      "composition": [
        [
          "C",
          "62-82%"
        ],
        [
          "Fe",
          "3-12%"
        ],
        [
          "Si",
          "2-8%"
        ],
        [
          "O",
          "4-14%"
        ]
      ]
    },
    {
      "id": "carbon_steel",
      "class": "alloy",
      "rawInputs": [
        {
          "key": "deepStone",
          "amount": 4
        },
        {
          "key": "coal",
          "amount": 2
        }
      ],
      "requiredHeatTier": 4,
      "artisanLevel": 3,
      "yieldCount": 1,
      "forgeUse": "weaponAndTool",
      "composition": [
        [
          "Fe",
          "78-92%"
        ],
        [
          "C",
          "0.6-2.2%"
        ],
        [
          "Mn",
          "0-2%"
        ],
        [
          "Si",
          "0.2-2%"
        ]
      ]
    },
    {
      "id": "basalt_fiber",
      "class": "fiber",
      "rawInputs": [
        {
          "key": "basalt",
          "amount": 3
        },
        {
          "key": "lava",
          "amount": 1
        }
      ],
      "requiredHeatTier": 4,
      "artisanLevel": 3,
      "yieldCount": 2,
      "forgeUse": "heatShield",
      "composition": [
        [
          "Si",
          "18-30%"
        ],
        [
          "O",
          "42-54%"
        ],
        [
          "Mg",
          "4-12%"
        ],
        [
          "Fe",
          "4-12%"
        ],
        [
          "Ca",
          "4-10%"
        ]
      ]
    },
    {
      "id": "basalt_composite",
      "class": "composite",
      "rawInputs": [
        {
          "key": "basalt",
          "amount": 3
        },
        {
          "key": "pineTrunk",
          "amount": 1
        },
        {
          "key": "coal",
          "amount": 1
        }
      ],
      "requiredHeatTier": 4,
      "artisanLevel": 3,
      "yieldCount": 1,
      "forgeUse": "armorPlate",
      "composition": [
        [
          "Si",
          "14-24%"
        ],
        [
          "O",
          "34-48%"
        ],
        [
          "C",
          "18-32%"
        ],
        [
          "Mg",
          "2-8%"
        ],
        [
          "Fe",
          "2-8%"
        ]
      ]
    },
    {
      "id": "geopolymer_block",
      "class": "composite",
      "rawInputs": [
        {
          "key": "ash",
          "amount": 2
        },
        {
          "key": "basalt",
          "amount": 1
        },
        {
          "key": "saltFlat",
          "amount": 1
        }
      ],
      "requiredHeatTier": 3,
      "artisanLevel": 2,
      "yieldCount": 2,
      "forgeUse": "masonry",
      "composition": [
        [
          "O",
          "42-55%"
        ],
        [
          "Si",
          "20-34%"
        ],
        [
          "Al",
          "5-14%"
        ],
        [
          "Na",
          "1-6%"
        ],
        [
          "Ca",
          "1-7%"
        ]
      ]
    },
    {
      "id": "coral_lime",
      "class": "ceramic",
      "rawInputs": [
        {
          "key": "coral",
          "amount": 2
        },
        {
          "key": "deadCoral",
          "amount": 1
        },
        {
          "key": "sand",
          "amount": 1
        }
      ],
      "requiredHeatTier": 2,
      "artisanLevel": 2,
      "yieldCount": 2,
      "forgeUse": "masonry",
      "composition": [
        [
          "Ca",
          "24-42%"
        ],
        [
          "O",
          "38-52%"
        ],
        [
          "Si",
          "8-18%"
        ],
        [
          "C",
          "1-8%"
        ]
      ]
    },
    {
      "id": "toxic_glass",
      "class": "glass",
      "rawInputs": [
        {
          "key": "sand",
          "amount": 2
        },
        {
          "key": "toxicWater",
          "amount": 1
        },
        {
          "key": "saltFlat",
          "amount": 1
        }
      ],
      "requiredHeatTier": 3,
      "artisanLevel": 3,
      "yieldCount": 1,
      "forgeUse": "sealedVessel",
      "composition": [
        [
          "Si",
          "24-38%"
        ],
        [
          "O",
          "44-56%"
        ],
        [
          "Na",
          "3-10%"
        ],
        [
          "Cl",
          "1-6%"
        ],
        [
          "S",
          "0.5-4%"
        ]
      ]
    }
  ]
};

export default smeltingRules;

export const SMELTING_RECIPES_PER_TABLE = 12;

export function validateSmeltingRules(rules = smeltingRules) {
  if (!rules || typeof rules !== "object") throw new Error("Missing smelting rules");
  if (!Number.isInteger(rules.schemaVersion)) throw new Error("Missing smelting schemaVersion");
  if (!rules.ruleSet) throw new Error("Missing smelting ruleSet");
  const heatTiers = Array.isArray(rules.heatTiers) ? rules.heatTiers : [];
  const fuels = Array.isArray(rules.fuels) ? rules.fuels : [];
  const materials = Array.isArray(rules.materials) ? rules.materials : [];
  if (!heatTiers.length) throw new Error("Smelting rules require heatTiers");
  if (!fuels.length) throw new Error("Smelting rules require fuels");
  if (!materials.length) throw new Error("Smelting rules require materials");

  const heatTierIds = new Set();
  for (const tier of heatTiers) {
    if (!Number.isInteger(tier.tier) || tier.tier < 1) throw new Error(`Invalid heat tier: ${JSON.stringify(tier)}`);
    if (heatTierIds.has(tier.tier)) throw new Error(`Duplicate heat tier: ${tier.tier}`);
    heatTierIds.add(tier.tier);
  }

  const fuelIds = new Set();
  for (const fuel of fuels) {
    if (!fuel.id) throw new Error("Fuel missing id");
    if (fuelIds.has(fuel.id)) throw new Error(`Duplicate fuel id: ${fuel.id}`);
    fuelIds.add(fuel.id);
    if (!heatTierIds.has(fuel.heatTier)) throw new Error(`Fuel ${fuel.id} uses unknown heat tier ${fuel.heatTier}`);
    if (fuel.sourceType === "raw" && !Array.isArray(fuel.sourceKeys)) throw new Error(`Raw fuel ${fuel.id} requires sourceKeys`);
    if (fuel.sourceType === "material" && !fuel.materialId) throw new Error(`Material fuel ${fuel.id} requires materialId`);
  }

  const materialIds = new Set();
  for (const material of materials) {
    if (!material.id) throw new Error("Material missing id");
    if (materialIds.has(material.id)) throw new Error(`Duplicate material id: ${material.id}`);
    materialIds.add(material.id);
    if (!material.class) throw new Error(`Material ${material.id} missing class`);
    if (!Array.isArray(material.rawInputs) || !material.rawInputs.length) throw new Error(`Material ${material.id} requires rawInputs`);
    if (!heatTierIds.has(material.requiredHeatTier)) throw new Error(`Material ${material.id} uses unknown heat tier ${material.requiredHeatTier}`);
    if (!Number.isInteger(material.yieldCount) || material.yieldCount < 1) throw new Error(`Material ${material.id} has invalid yieldCount`);
    for (const input of [...material.rawInputs, ...(material.catalysts ?? [])]) {
      if (!input.key || !Number.isFinite(input.amount) || input.amount < 1) {
        throw new Error(`Material ${material.id} has invalid input ${JSON.stringify(input)}`);
      }
    }
  }

  for (const fuel of fuels) {
    if (fuel.sourceType === "material" && !materialIds.has(fuel.materialId)) {
      throw new Error(`Fuel ${fuel.id} points to unknown material ${fuel.materialId}`);
    }
  }
  return true;
}

export function smeltingHeatTierByTier(tier, rules = smeltingRules) {
  return (rules.heatTiers ?? []).find((item) => item.tier === tier) ?? null;
}

export function smeltingMaterialById(id, rules = smeltingRules) {
  return (rules.materials ?? []).find((material) => material.id === id) ?? null;
}

export function smeltingRecipeIdForMaterialId(id, rules = smeltingRules) {
  const index = (rules.materials ?? []).findIndex((material) => material.id === id);
  return index >= 0 ? 1001 + index : 0;
}

export function smeltingRecipeTableIdForMaterialId(id, rules = smeltingRules) {
  const index = (rules.materials ?? []).findIndex((material) => material.id === id);
  return index >= 0 ? Math.floor(index / SMELTING_RECIPES_PER_TABLE) + 1 : 0;
}

export function smeltingRecipeTableIdForRecipeId(recipeId, rules = smeltingRules) {
  const index = Number(recipeId) - 1001;
  return Number.isInteger(index) && index >= 0 && index < (rules.materials ?? []).length
    ? Math.floor(index / SMELTING_RECIPES_PER_TABLE) + 1
    : 0;
}

export function smeltingMaterialIdForRecipeId(recipeId, rules = smeltingRules) {
  const index = Number(recipeId) - 1001;
  return Number.isInteger(index) && index >= 0 ? rules.materials?.[index]?.id ?? null : null;
}

export function smeltingMaterialItemCode(id, rules = smeltingRules) {
  const index = (rules.materials ?? []).findIndex((material) => material.id === id);
  return index >= 0 ? 1001 + index : 0;
}

export function smeltingMaterialIdForItemCode(itemCode, rules = smeltingRules) {
  const index = Number(itemCode) - 1001;
  return Number.isInteger(index) && index >= 0 ? rules.materials?.[index]?.id ?? null : null;
}

export function smeltingFuelForRawKey(key, rules = smeltingRules) {
  return (rules.fuels ?? [])
    .filter((fuel) => fuel.sourceType === "raw" && (fuel.sourceKeys ?? []).includes(key))
    .sort((a, b) => (b.heatTier ?? 0) - (a.heatTier ?? 0))[0] ?? null;
}

export function smeltingFuelForMaterialId(materialId, rules = smeltingRules) {
  return (rules.fuels ?? [])
    .filter((fuel) => fuel.sourceType === "material" && fuel.materialId === materialId)
    .sort((a, b) => (b.heatTier ?? 0) - (a.heatTier ?? 0))[0] ?? null;
}

export function createSmeltingInputCounts(keys = []) {
  const counts = new Map();
  for (const key of keys.filter(Boolean)) counts.set(key, (counts.get(key) ?? 0) + 1);
  return counts;
}

export function recipeRequirements(recipe) {
  return [...(recipe?.rawInputs ?? []), ...(recipe?.catalysts ?? [])];
}

export function hasRequiredSmeltingInputs(recipe, counts) {
  return recipeRequirements(recipe).every((input) => (counts.get(input.key) ?? 0) >= input.amount);
}

export function smeltingRecipeMatchScore(recipe, counts) {
  const requirements = recipeRequirements(recipe);
  const requiredTotal = requirements.reduce((sum, input) => sum + input.amount, 0);
  const matchedTotal = requirements.reduce((sum, input) => sum + Math.min(counts.get(input.key) ?? 0, input.amount), 0);
  const exact = hasRequiredSmeltingInputs(recipe, counts);
  const waste = [...counts.entries()].reduce((sum, [key, count]) => {
    const required = requirements.find((input) => input.key === key)?.amount ?? 0;
    return sum + Math.max(0, count - required);
  }, 0);
  return {
    exact,
    matchedTotal,
    requiredTotal,
    ratio: requiredTotal > 0 ? matchedTotal / requiredTotal : 0,
    waste,
  };
}

export function findBestSmeltingRecipeForKeys(keys = [], rules = smeltingRules) {
  const counts = createSmeltingInputCounts(keys);
  const candidates = (rules.materials ?? [])
    .map((recipe) => ({ recipe, score: smeltingRecipeMatchScore(recipe, counts) }))
    .filter(({ score }) => score.matchedTotal > 0)
    .sort((a, b) => {
      if (a.score.exact !== b.score.exact) return a.score.exact ? -1 : 1;
      if (b.score.ratio !== a.score.ratio) return b.score.ratio - a.score.ratio;
      if (a.score.waste !== b.score.waste) return a.score.waste - b.score.waste;
      return (a.recipe.requiredHeatTier ?? 0) - (b.recipe.requiredHeatTier ?? 0);
    });
  return candidates[0] ?? null;
}

export function missingSmeltingInputs(recipe, keys = []) {
  const counts = createSmeltingInputCounts(keys);
  return recipeRequirements(recipe)
    .map((input) => ({ ...input, missing: Math.max(0, input.amount - (counts.get(input.key) ?? 0)) }))
    .filter((input) => input.missing > 0);
}

validateSmeltingRules(smeltingRules);
