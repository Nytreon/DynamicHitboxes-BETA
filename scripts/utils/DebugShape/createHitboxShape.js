import { debugDrawer, DebugBox, DebugLine } from "@minecraft/debug-utilities";
import settings from "settings";
import findEntityHitbox from "utils/Entity/findHitbox";

export default function createHitboxShape(entity, viewer) {
    let hitboxData = findEntityHitbox(entity, settings.get("maxHitboxSize", 10))
    let lastKnown = {
        x: 0,
        y: 0,
        z: 0
    }

    if (!hitboxData) return null

    let { bound, boundLocationOffset } = hitboxData
    let collisionBound = { ...bound }, collisionBoundLocationOffset = { ...boundLocationOffset }

    const isProjectile = !!entity.getComponent("projectile") && bound.x > 2;
    const margin = isProjectile ? 2 : 0.2;
    const offset = isProjectile ? 1 : 0.1;

    ['x', 'y', 'z'].forEach(axis => {
        collisionBound[axis] -= margin + 0.001;
        collisionBoundLocationOffset[axis] += offset - 0.0005;
    });

    let entityLocation = entity.location
    let eyeHeight = entity.getHeadLocation().y - entityLocation.y

    let color = (red, green, blue) => ({
        red,
        green,
        blue
    });

    const boundBox = new DebugBox(entityLocation)
    const collisionBox = new DebugBox(entityLocation)
    collisionBox.color = color(255, 0, 255)

    const eyeBox = new DebugBox(entityLocation)
    eyeBox.color = color(255, 0, 0)

    let xAxis = new DebugLine(entityLocation, entityLocation)
    xAxis.color = color(255, 0, 0)

    let yAxis = new DebugLine(entityLocation, entityLocation)
    yAxis.color = color(0, 255, 0)

    let zAxis = new DebugLine(entityLocation, entityLocation)
    zAxis.color = color(0, 0, 255)


    //look vector ray delcaration

    let lookVectorRay = new DebugLine(entityLocation, entityLocation)
    lookVectorRay.color = color(0, 0, 255)


    function update() {
        let hitbox = findEntityHitbox(entity, settings.get("maxHitboxSize", 10))
        entityLocation = entity.location
        eyeHeight = entity.getHeadLocation().y - entityLocation.y

        if (!hitbox) return false;

        ({
            bound,
            boundLocationOffset
        } = hitbox)
        let collisionBound = {
            x: bound.x,
            y: bound.y,
            z: bound.z
        }
        collisionBoundLocationOffset = {
            x: boundLocationOffset.x,
            y: boundLocationOffset.y,
            z: boundLocationOffset.z
        }

        const isProjectile = !!entity.getComponent("projectile") && bound.x > 2;
        const margin = isProjectile ? 2 : 0.2;
        const offset = isProjectile ? 1 : 0.1;

        ['x', 'y', 'z'].forEach(axis => {
            collisionBound[axis] -= margin;
            collisionBoundLocationOffset[axis] += offset;
        });

        if ((lastKnown.y !== bound.y || lastKnown.x !== bound.x || lastKnown.z !== bound.z) && viewer && settings.get("numerics")) {
            viewer.sendMessage(`
§9Hitbox§r
-x: ${bound.x}
-y: ${bound.y}
-z: ${bound.z}
§9Collision Box§r
-x: ${collisionBound.x}
-y: ${collisionBound.y}
-z: ${collisionBound.z}`);
        }
        lastKnown = bound


        boundBox.bound = {
            ...bound
        }
        collisionBox.bound = {
            ...collisionBound
        }


        return true
    }




    const setLocation = ({
        x,
        y,
        z
    }) => {


        //Bounding box

        boundBox.location = {
            x: x + boundLocationOffset.x,
            y: y + boundLocationOffset.y,
            z: z + boundLocationOffset.z
        }

        collisionBox.location = {
            x: x + collisionBoundLocationOffset.x,
            y: y + collisionBoundLocationOffset.y,
            z: z + collisionBoundLocationOffset.z
        }


        let axisOffset = "collisionbox" == settings.get("toggleMode") ? isProjectile ? 1.1 : 0.15 : 0.05;

        //Eyebox

        eyeBox.bound = {
            x: "collisionbox" == settings.get("toggleMode") ? collisionBound.x : bound.x,
            y: 0,
            z: "collisionbox" == settings.get("toggleMode") ? collisionBound.z : bound.z,
        }

        eyeBox.location = {
            x: "collisionbox" == settings.get("toggleMode") ? x + collisionBoundLocationOffset.x : x + boundLocationOffset.x,
            y: y + eyeHeight,
            z: "collisionbox" == settings.get("toggleMode") ? z + collisionBoundLocationOffset.z : z + boundLocationOffset.z
        }

        //look vector ray (blue)


        lookVectorRay.location = lookVectorRay.endLocation = {
            x: x,
            y: y + eyeHeight,
            z: z
        };

        //X axis indicator (red)

        xAxis.location = {
            x: x - bound.x / 2 + axisOffset,
            y: y + axisOffset + boundLocationOffset.y,
            z: z - bound.z / 2 + axisOffset
        }
        xAxis.endLocation = {
            x: x + bound.x / 2 - axisOffset,
            y: y + axisOffset + boundLocationOffset.y,
            z: z - bound.z / 2 + axisOffset
        }

        //Y axis indicator (green)

        yAxis.location = {
            x: x - bound.x / 2 + axisOffset,
            y: y + axisOffset + boundLocationOffset.y,
            z: z - bound.z / 2 + axisOffset
        }
        yAxis.endLocation = {
            x: x - bound.x / 2 + axisOffset,
            y: y + bound.y - axisOffset + boundLocationOffset.y,
            z: z - bound.z / 2 + axisOffset
        }

        //Z axis indicator

        zAxis.location = {
            x: x - bound.x / 2 + axisOffset,
            y: y + axisOffset + boundLocationOffset.y,
            z: z - bound.z / 2 + axisOffset
        }
        zAxis.endLocation = {
            x: x - bound.x / 2 + axisOffset,
            y: y + axisOffset + boundLocationOffset.y,
            z: z + bound.z / 2 - axisOffset
        }
    }


    let setDirection = ({
        x,
        y,
        z
    }, scale = (bound.x + bound.y + bound.z) / 3) => {
        if (!lookVectorRay) return

        lookVectorRay.endLocation = {
            x: lookVectorRay.location.x + x * scale,
            y: lookVectorRay.location.y + y * scale,
            z: lookVectorRay.location.z + z * scale,
        }

    }

    update()
    setLocation(entityLocation)

    return {
        setLocation,
        setDirection,
        addShape() {
            [eyeBox, xAxis, yAxis, zAxis, lookVectorRay].forEach(shape => debugDrawer.addShape(shape))
            if (["both", "collisionbox"].includes(settings.get("toggleMode"))) debugDrawer.addShape(collisionBox);
            if (["both", "hitbox"].includes(settings.get("toggleMode"))) debugDrawer.addShape(boundBox);
        },
        removeShape() {
            [eyeBox, xAxis, yAxis, zAxis, lookVectorRay].forEach(shape => debugDrawer.removeShape(shape))
            if (collisionBox) debugDrawer.removeShape(collisionBox);
            if (boundBox) debugDrawer.removeShape(boundBox);
        },
        update
    }
}
