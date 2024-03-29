import * as Pixi from "pixi.js"

import {FRAME} from "scripts/Constants.js"
import {COLORS} from "scripts/Constants.js"
import Projectile from "scripts/Projectile.js"
import {getDirection} from "scripts/Geometry.js"
import {BadGuyGrowing} from "scripts/Sounds.js"
import {BadGuyDeathLoop} from "scripts/Sounds.js"
import {BadGuyDeathEnd} from "scripts/Sounds.js"

const EXPLODING_DURATION = 5000

Pixi.settings.SCALE_MODE = Pixi.SCALE_MODES.NEAREST
const UFO_TEXTURE = Pixi.Texture.from(require("images/ufo.png"))
const ZAPPED_UFO_TEXTURE = Pixi.Texture.from(require("images/ufo-zapped.png"))

const SURGES = [
    [
        {amount: 3, time: 1, speed: 0.5, breadth: Math.PI / 64, aimed: true},
        {amount: 3, time: 1, speed: 0.5, breadth: Math.PI / 64},
    ],
    [
        {amount: 7, time: 2, speed: 1},
        {amount: 5, time: 0.5, speed: 1},
        {amount: 3, time: 0.5, speed: 1},
        {amount: 3, time: 2, speed: 1, breadth: Math.PI / 64, aimed: true},
        {amount: 3, time: 0.5, speed: 1, breadth: Math.PI / 64, aimed: true},
        {amount: 3, time: 0.5, speed: 1, breadth: Math.PI / 64, aimed: true},
    ],
    [
        {amount: 3, time: 1, speed: 1},
        {amount: 7, time: 0.5, speed: 1},
        {amount: 5, time: 0.5, speed: 1},
        {amount: 3, time: 1, speed: 0.5, breadth: Math.PI / 64, aimed: true},
        {amount: 3, time: 0.5, speed: 0.5, breadth: Math.PI / 64, aimed: true},
    ],
]

export default class BadGuy  extends Pixi.Sprite {
    constructor() {
        super(UFO_TEXTURE)

        this.anchor.x = 0.5
        this.anchor.y = 0.5

        this.stack = 20

        this.position.x = FRAME.WIDTH * 0.85
        this.position.y = FRAME.HEIGHT / 2

        this.maxhull = 30 * 1000 // in ms
        this.hull = this.maxhull

        this.gun = {time: 0, surges: SURGES[0]}

        this.time = 0 // in ms
        this.isExploding = false

        this.stage = 1
    }
    update(delta) {
        this.time += delta.ms

        if(this.hasExploded) {
            BadGuyDeathLoop.pause()
            return "he's dead!! :9"
        } else if(this.isExploding) {
            this.texture = UFO_TEXTURE
            this.isExploding += delta.ms

            if(this.isExploding > EXPLODING_DURATION - 4000) {
                this.scale.x = 2
                this.scale.y = 2
            }
            if(this.isExploding > EXPLODING_DURATION - 3000) {
                this.scale.x = 1
                this.scale.y = 1
            }

            if(this.isExploding < EXPLODING_DURATION - 2000) {
                this.rotation += this.isExploding
            } else {
                BadGuyDeathLoop.pause()
            }

            if(this.isExploding > EXPLODING_DURATION) {
                BadGuyDeathEnd.play()
                this.hasExploded = true
                this.visible = false
            }
        } else {
            this.rotation = Math.sin(this.time / 500) / 3
            this.position.y = (FRAME.HEIGHT / 2) + (Math.sin(this.time / 500) * 10)

            if(!!this.parent
            && !!this.parent.prompt) {
                if(!this.parent.prompt.isDone) {
                    return
                }
            }

            this.attack(delta)
            this.die(delta)

            if(this.stage == 1 && this.hull < this.maxhull * (2/3)) {
                this.gun.surges = SURGES[1]
                this.scale.x = 2
                this.scale.y = 2
                if(this.stage == 1) {
                    BadGuyGrowing.play()
                }
                this.stage = 2
            }
            if(this.stage == 2 && this.hull < this.maxhull * (1/3)) {
                this.gun.surges = SURGES[2]
                this.scale.x = 3
                this.scale.y = 3
                if(this.stage == 2) {
                    BadGuyGrowing.play()
                }
                this.stage = 3
            }
        }
    }
    attack(delta) {
        this.gun.time += delta.s

        if(this.gun.time > this.gun.surges[0].time) {
            this.gun.time -= this.gun.surges[0].time

            this.performSurge({
                position: this.position,
                direction: this.rotation + Math.PI,
                definition: this.gun.surges[0],
            })

            this.gun.surges.push(this.gun.surges.shift())
        }
    }
    die(delta) {
        if(!!this.parent
        && !!this.parent.goodguy) {
            if(this.parent.goodguy.isAttacking) {
                this.hull -= delta.ms

                if(this.hull <= 0) {
                    this.hull = 0
                    this.isExploding = true
                    BadGuyDeathLoop.play()
                }

                if(Math.floor(this.time / 50) % 2 == 0) {
                    this.texture = ZAPPED_UFO_TEXTURE
                } else {
                    this.texture = UFO_TEXTURE
                }
            } else {
                this.texture = UFO_TEXTURE
            }
        }
    }
    performSurge(surge) {
        surge.direction = surge.direction || Math.PI
        surge.position = surge.position || new Pixi.Point()
        surge.definition = surge.definition || new Object()
        surge.definition.breadth = surge.definition.breadth || Math.PI / 16

        if(surge.definition.aimed == true) {
            if(!!this.parent) {
                surge.direction = getDirection(this.position, this.parent.goodguy.position)
            }
        }

        var half = (surge.definition.amount - 1) / 2
        for(var i = -half; i <= half; i += 1) {
            this.parent.addChild(new Projectile({
                "direction": surge.direction + (i * surge.definition.breadth),
                "speed": surge.definition.speed,
                "position": surge.position,
            }))
        }
    }
}
