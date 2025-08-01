import { world, system, Player, ItemStack } from "@minecraft/server";
import { debugDrawer } from "@minecraft/debug-utilities";

import settings from "settings";

const helpMessage = `
   Usage:
      hold and use a §3stick§r with the nametag §e@hitbox_viewer§r
   
   Runtime Config:
      /scriptevent hitbox:<key> [value]
   
   §3Valid keys, and values:§r
   remove    §7- removes debug shapes§r
   duration    <ticks: number>     (default: 400)
   toggle    §7- disable/enable the addon§r
   radius      <radius: number>    (default: 5)
   size        <size: number>      (default: 10)
   tool      §7- gives you a hitbox viewer tool§r
   settings  §7- shows active settings§r
   refresh     <refresh: number>    (default: 5)
   mode      §7- [hitbox, collisionbox, both]§r (default: both)
   maxCount  §7- <Entities: number>§r (default: 10)
   includePlayers §7- toggle player hitboxes§r (default: false)
   sendNumerics   §7- show numerical bounding box dimensions§r (default: false)
   `;

const scriptEventHandlers = {
	settings({ source }) {
		if (source instanceof Player) {
			source.sendMessage(`
Addon is enabled: ${settings.get("addonEnabled")}
Radius: ${settings.get("scanRadius")}
Duration: ${settings.get("jobDuration")}
size: ${settings.get("maxHitboxSize")}
refresh rate: ${settings.get("refreshRate")}
mode: ${settings.get("toggleMode")}
Entity Count: ${settings.get("maxEntityCount")}
Players Included: ${settings.get("includePlayers")}
send numerics: ${settings.get("numerics")}
`);}
	},
	help({ source }) {
		if (source instanceof Player) {
			source.sendMessage(helpMessage);
		}
	},

	remove(_) {
		debugDrawer.removeAll();
		world.sendMessage("Hitboxes removed!");
	},

	duration({ message }) {
		let newJobDuration = parseInt(message) || settings.get("jobDuration");
		settings.set("jobDuration", newJobDuration);
		world.sendMessage(
			"Hitbox watch duration has been set to: " + newJobDuration
		);
	},
	refresh({ message }) {
		let newRefreshRate = parseInt(message) || settings.get("refreshRate");
		settings.set("refreshRate", newRefreshRate);
		world.sendMessage(
			"Dynamic entity hitbox refresh rate has been set to: " + newRefreshRate
		);
	},
	toggle(_) {
		settings.set("addonEnabled", !settings.get("addonEnabled"));
		world.sendMessage(
			"Hitbox Addon has been: " +
				(settings.get("addonEnabled") ? "enabled" : "disabled")
		);
	},

	radius({ message }) {
		let newEntityScanRadius =
			parseInt(message) || settings.get("scanRadius");
		settings.set("scanRadius", newEntityScanRadius);
		world.sendMessage(
			"Hitbox viewing radius has been set to: " + newEntityScanRadius
		);
	},

	size({ message }) {
		let newMaxHitboxSize = parseInt(message) || settings.get("maxHitboxSize");
		settings.set("maxHitboxSize", newMaxHitboxSize);
		world.sendMessage("Hitbox size has been set to: " + newMaxHitboxSize);
	},

	tool({ source }) {
		if (!(source instanceof Player)) return;

		let tool = new ItemStack("minecraft:stick", 1);
		tool.nameTag = settings.get("itemNameTag", "@hitbox_viewer");
		if (source.getComponent("inventory")?.container?.addItem(tool))
			source.sendMessage("You have been given the tool.");
	},
	mode({ message }) {
		if (["both", "hitbox", "collisionbox"].includes(message)) {
			settings.set("toggleMode",message);
			world.sendMessage(`Now tracking: ${message}`);
		}
	},
	maxCount({ message }) {
		let newMaxEntityCount = parseInt(message) || settings.get("maxEntityCount");
		settings.set("maxEntityCount", newMaxEntityCount);
		world.sendMessage(
			"Max entity bounds per player set to: " + newMaxEntityCount
		);
	},
	includePlayers(_) {
		const excludedList = settings.get("excludeEntityIds")
		const currentState = settings.get("includePlayers")		
		settings.set("includePlayers", !currentState);
		world.sendMessage("Included player hitboxes set to: " + settings.get("includePlayers"));

		if (currentState) excludedList.push("minecraft:player")
		if (!(currentState)) excludedList.splice(excludedList.indexOf("minecraft:player"), 1);
		settings.set("excludeEntityIds", excludedList)
	},
	sendNumerics(_) {
		settings.set("numerics", !settings.get("numerics"));
		world.sendMessage(`Send numerics set to ${settings.get("numerics")}`);	
	}
};

system.afterEvents.scriptEventReceive.subscribe((event) => {
	let { id, message, sourceEntity: source } = event;
	let [namespace, key] = id.split(":");

	if (namespace !== "hitbox") return;

	let handler = scriptEventHandlers[key];

	if (handler) {
		handler({ source, message });
	} else {
		let errorMessage = "Unknown event: " + key;

		try {
			let target = source instanceof Player ? source : world;

			target.sendMessage(errorMessage);
		} catch {
			console.error(errorMessage);
		}
	}
});
