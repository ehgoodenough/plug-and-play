import * as Pixi from "pixi.js"

import {FRAME} from "scripts/Constants.js"
import {COLORS} from "scripts/Constants.js"
import {BAR_MARGIN} from "scripts/Constants.js"

const BORDER = 2
const TICK_COUNT = 50
const TICK_WIDTH = 3
const TICK_HEIGHT = 6

export default class HullBar extends Pixi.Sprite {
    constructor() {
        super(Pixi.Texture.from(require("images/hullbar.png")))

        this.stack = 1000
        this.position.x = BAR_MARGIN
        this.position.y = FRAME.HEIGHT - BAR_MARGIN + 10
        this.behere = FRAME.HEIGHT - BAR_MARGIN - 10

        this.addChild(this.graphics = new Pixi.Graphics())
    }
    update(delta) {
        if(!!this.parent
        && !!this.parent.prompt) {
            if(this.parent.prompt.isDone) {
                if(this.position.y > this.behere) {
                    this.position.y -= delta.f
                }
            }
        }
        if(!!this.parent
        && !!this.parent.badguy) {
            let badguy = this.parent.badguy
            let percent = Math.max(Math.min(badguy.hull / badguy.maxhull, 1), 0)
            let width = Math.ceil(percent * TICK_COUNT) * TICK_WIDTH

            this.graphics.clear()
            this.graphics.beginFill(COLORS.VOID)
            this.graphics.drawRect(BORDER + width, BORDER, (TICK_COUNT * TICK_WIDTH) - width, TICK_HEIGHT)

            if(badguy.isExploding > 5000 - 1000) {
                this.velocity = this.velocity || 0
                this.velocity += delta.f

                this.position.y += this.velocity
                if(this.position.y > FRAME.HEIGHT * 2) {
                    this.position.y = FRAME.HEIGHT * 2
                    this.velocity = 0
                }
            }
        }
    }
}
