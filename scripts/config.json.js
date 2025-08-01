export default {
	addonEnabled: true,
	scanRadius: 5,
	jobDuration: 400, // 20 secs
	maxHitboxSize: 10,
	maxEntityCount: 10,
	includePlayers: false,
	numerics: false,
	toggleMode: "both",
	refreshRate: 5,
	itemId: "minecraft:stick",
	itemNameTag: "@hitbox_viewer",
	excludeEntityIds: ["minecraft:player"],
	dynamicEntityIds: [
		"minecraft:camel",
		"minecraft:shulker",
		"minecraft:player",
	],
};
