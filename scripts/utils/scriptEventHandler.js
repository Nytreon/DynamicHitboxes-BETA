import { world, system, Player, ItemStack } from "@minecraft/server";
import { debugDrawer } from "@minecraft/debug-utilities";

import settings from "settings";

import scriptEventHandlers from "./commands.json.js";

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

