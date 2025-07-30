import { world, system, Player } from "@minecraft/server";
import settings from "./settings.js";

import * as Vec from "./utils/Math/vec.js";
import createHitboxShape from "./utils/DebugShape/createHitboxShape.js";

import "./utils/scriptEventHandler.js";


// Track active viewers and their job durations
let lastModeState = "both";
const activeViewers = new Map();
let trackingJobId = null;
let previousTrackedShapes = new Map();
let currentTrackedShapes = new Map();


/**
 * Start or stop hitbox tracking for a player
 * @param {Player} player
 */
function toggleHitboxTracking(player) {
	if (!settings.get("addonEnabled")) return;

	if (activeViewers.has(player)) {
		activeViewers.delete(player);
		player.sendMessage("Hitbox tracking stopped around you.");
		return;
	}

	// Set expiration if not sneaking (indefinite otherwise)
	const MS_IN_ONE_TICK = 50;
	const JOB_DURATION_IN_MS = settings.get("jobDuration") * MS_IN_ONE_TICK;
	const expiryTimestamp = !player.isSneaking
		? Date.now() + JOB_DURATION_IN_MS
		: null;

	activeViewers.set(player, expiryTimestamp);
	player.sendMessage("Hitbox tracking queued around you.");

	if (!trackingJobId) {
		trackingJobId = system.runJob(trackingRoutine());
	}
}

//DEBUG FUNCTION ONLY!
function listObjectDetails(obj) {
  const details = [];

  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      const type = typeof obj[key];
      if (type === 'function') {
        details.push(`Method: ${key}()`);
      } else {
        details.push(`Property: ${key} = ${JSON.stringify(obj[key])}`);
      }
    }
  }
  return details.join('\n');
}



// Main tracking logic
function* trackingRoutine() {
	//world.sendMessage("Hitbox job started.");

	while (settings.get("addonEnabled") && activeViewers.size > 0) {
		yield* processViewerScans();

		//yield;
	}

	yield* cleanupShapes();

	// Final cleanup when job stops
	trackingJobId = null;
	activeViewers.clear();
	// world.sendMessage("Hitbox job stopped.");
}

function* processViewerScans() {
	let excludeIds = settings.get("excludeEntityIds", []);

	for (const [viewer, expiration] of activeViewers) {
		if (!viewer.isValid || expiration && Date.now() > expiration) {
            		activeViewers.delete(viewer);

            		if (viewer.isValid)
                		viewer.sendMessage("Hitbox tracking ended.");
            		continue;
        	}

		let scanRadius = settings.get("scanRadius");
		const scanPos = Vec.add(
			viewer.getHeadLocation(),
			Vec.scale(viewer.getViewDirection(), scanRadius * 0.75)
		);

		let entities = viewer.dimension.getEntities({
			location: scanPos,
			maxDistance: scanRadius,
			excludeTypes: excludeIds,
			closest: settings.get("maxEntityCount", 10),
		});

        	if (settings.get("toggleMode") !== lastModeState) {
        	    	for (const entity of entities) {
                		if (!entity.isValid || !previousTrackedShapes.has(entity.id)) continue
                		let shape = previousTrackedShapes.get(entity.id)[0]
                		shape.removeShape()
						let hitboxShape = createHitboxShape(entity)
						shape = hitboxShape
						shape.addShape()
						const isBaby = !!(entity.getComponent('is_baby'))
						currentTrackedShapes.set(entity.id, [shape, isBaby]);
            		}
			
            		lastModeState = settings.get("toggleMode")
        	}





		yield;

		for (const entity of entities) {
			if (currentTrackedShapes.has(entity.id)) continue;
			if (!entity.isValid) continue;
			

			let shape;
			let growthState;

			let isShapeCreatedNow = false;
			let entityId = entity.id;

			const isBaby = !!(entity.getComponent('is_baby'))

			if (previousTrackedShapes.has(entityId)) {
				
				shape = previousTrackedShapes.get(entityId)[0]
				growthState = previousTrackedShapes.get(entityId)[1]

				// even tho cleanupShapes does this already,
				// we are doing this to save some memory

				previousTrackedShapes.delete(entityId);
			} else {
				let hitboxShape = createHitboxShape(entity);
				if (!hitboxShape) continue;

				yield;

				isShapeCreatedNow = true;

				shape = hitboxShape;
				shape.addShape();
			}

			if (!isBaby == growthState) {
				shape.update();
			}
			
			currentTrackedShapes.set(entity.id, [shape, isBaby]);

			if (
				!isShapeCreatedNow &&
				system.currentTick % (settings.get("refreshRate")) == 0 &&
				(settings.get("dynamicEntityIds", []).includes(entity.typeId) ||
					!entity.typeId.startsWith("minecraft:")) &&
				entity.isValid
			) {
				shape.update();

				yield;
			}

			if (entity.isValid) {
				shape.setLocation(entity.location);
				shape.setDirection?.(entity.getViewDirection());
			}

			yield;
		}

		yield;
	}

	// Remove shapes for entities no longer tracked
	yield* cleanupShapes();
}

function* cleanupShapes() {
	for (let [entityId, [shape, x]] of previousTrackedShapes) {
		shape.removeShape();
		previousTrackedShapes.delete(entityId);
		yield;
	}

	// Final cleanup and state reset
	previousTrackedShapes = currentTrackedShapes;
	currentTrackedShapes = new Map();
}

function isHitboxViewerItem(itemStack) {
	return (
		settings.get("addonEnabled") &&
		itemStack != null &&
		settings.get("itemId", "minecraft:stick") == itemStack.typeId &&
		itemStack.nameTag === settings.get("itemNameTag", "@hitbox_viewer")
	);
}

// Listen for item use to toggle hitbox tracking
world.beforeEvents.itemUse.subscribe((event) => {
	const { itemStack, source } = event;
	if (!(source instanceof Player) || !isHitboxViewerItem(itemStack)) return;

	event.cancel = true;
	toggleHitboxTracking(source);
});

// Cancel block/entity interaction if holding hitbox viewer item
function blockInteractionIfHoldingViewer(event) {
	if (isHitboxViewerItem(event.itemStack)) event.cancel = true;
}

const interactionEvents = [
	world.beforeEvents.playerBreakBlock,
	world.beforeEvents.playerInteractWithBlock,
	world.beforeEvents.playerInteractWithEntity,
];

for (let eventType of interactionEvents) {
	eventType.subscribe(blockInteractionIfHoldingViewer);
}

